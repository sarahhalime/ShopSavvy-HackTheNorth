import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isMockMode } from "@/lib/env"
import { mockOrders, mockProducts } from "@/lib/mock-data"

const insightsRequestSchema = z.object({
  userId: z.string().optional(),
  // Make orders optional; if not provided, we'll fallback server-side
  orders: z
    .array(
      z.object({
        id: z.string(),
        items: z.array(
          z.object({
            title: z.string(),
            priceCents: z.number(),
            category: z.string(),
            qty: z.number(),
          }),
        ),
        totalCents: z.number(),
        createdAt: z.string(),
      }),
    )
    .optional(),
})

interface SpendingInsights {
  bullets: string[]
  budgetRule: string
  savingsTip: string
  categoryBreakdown: Record<string, number>
  monthlyTrend: "increasing" | "decreasing" | "stable"
  riskScore: number
  recommendations?: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body safely; support empty body
    let raw: any = {}
    try {
      raw = await request.json()
    } catch {
      raw = {}
    }

    const parsed = insightsRequestSchema.safeParse(raw ?? {})

    // Normalize orders from request if present
    let orders = (parsed.success && Array.isArray(parsed.data.orders))
      ? parsed.data.orders!.map((o: any) => ({
          id: String(o?.id ?? ""),
          items: Array.isArray(o?.items)
            ? o.items.map((it: any) => ({
                title: String(it?.title ?? "Item"),
                priceCents: Number(it?.priceCents ?? it?.price ?? 0),
                category: String(it?.category ?? "General"),
                qty: Number(it?.qty ?? it?.quantity ?? 1),
              }))
            : [],
          totalCents: Number(o?.totalCents ?? o?.totalAmount ?? 0),
          createdAt:
            typeof o?.createdAt === "string"
              ? o.createdAt
              : new Date(o?.createdAt ?? Date.now()).toISOString(),
        }))
      : []

    let usingDemoData = false
    // If no orders were provided, fallback to demo/mock data server-side (dev-friendly)
    if (!orders || orders.length === 0) {
      usingDemoData = true
      orders = (mockOrders as any[]).map((order: any) => ({
        id: String(order.id),
        items: Array.isArray(order.items)
          ? order.items.map((item: any) => {
              const product = (mockProducts as any[]).find((p: any) => p.id === item.productId)
              const category = product?.category || "General"
              return {
                title: String(item.title ?? product?.title ?? "Item"),
                priceCents: Number(item.price ?? item.priceCents ?? 0),
                category,
                qty: Number(item.quantity ?? item.qty ?? 1),
              }
            })
          : [],
        totalCents: Number((order as any).totalAmount ?? (order as any).totalCents ?? 0),
        createdAt:
          typeof (order as any).createdAt === "string"
            ? (order as any).createdAt
            : (order as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
      }))
    }

    // Compute insights from orders (shared logic, no hard-coded placeholders)
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalCents || 0), 0)
    const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0

    // Category analysis
    const categoryTotals: Record<string, number> = {}
    orders.forEach((order) => {
      order.items.forEach((item: { category: string; priceCents: number; qty: number }) => {
        const key = item.category || "General"
        categoryTotals[key] = (categoryTotals[key] || 0) + (item.priceCents || 0) * (item.qty || 0)
      })
    })

    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || "General"
    const monthlySpend = totalSpent / Math.max(1, orders.length)

    const bullets: string[] = []
    

    // Build general, sensible recommendations
    const recommendations: string[] = []
    if (totalSpent > 0) {
      if ((categoryTotals[topCategory] || 0) / Math.max(1, totalSpent) > 0.5) {
        recommendations.push(
          `Set a weekly cap for ${topCategory} and space out purchases to smooth spending.`,
        )
      } else {
        recommendations.push(
          `Track ${topCategory} purchases and review them monthly to keep totals in check.`,
        )
      }
      if (avgOrderValue > 15000) {
        recommendations.push(
          `Large average order size detected. Plan big purchases ahead and compare prices to avoid overspend.`,
        )
      } else if (avgOrderValue < 3000) {
        recommendations.push(
          `Many small orders can add up. Consider batching items to cut fees and get bundle discounts.`,
        )
      }
      recommendations.push(
        `Create a simple 50/30/20 budget and earmark a fixed amount for discretionary categories like ${topCategory}.`,
      )
      recommendations.push(
        `Set price alerts for items you frequently buy to catch sales and reduce impulse spending.`,
      )
    } else {
      recommendations.push(
        "Add recent purchases or connect your wallet to unlock tailored recommendations.",
      )
    }

    // Default insights (fallback if AI not available)
    const insights: SpendingInsights & { usingDemoData?: boolean } = {
      bullets,
      budgetRule:
        totalSpent > 0
          ? `Set a monthly cap of $${Math.ceil((monthlySpend * 1.1) / 100)} for ${topCategory} until next review.`
          : "Add purchases to see a personalized budget recommendation.",
      savingsTip:
        totalSpent > 0
          ? "Batch purchases and compare across vendors to reduce fees and catch bundle discounts."
          : "No data yet — upload receipts or connect your wallet to get savings tips.",
      categoryBreakdown: categoryTotals,
      monthlyTrend: avgOrderValue > 7500 ? "increasing" : avgOrderValue < 3000 && totalSpent > 0 ? "decreasing" : "stable",
      riskScore:
        totalSpent > 0 ? Math.min(100, Math.max(0, Math.round(100 - (monthlySpend / 10000) * 100))) : 70,
      recommendations,
      usingDemoData,
    }

    // If Gemini key is present, synthesize bullets and recommendations via AI
    const hasGemini = !!process.env.GEMINI_API_KEY
    if (hasGemini) {
      try {
        const origin = new URL(request.url).origin
        const summary = {
          totalSpent,
          avgOrderValue,
          monthlySpend,
          orderCount: orders.length,
          categoryTotals,
        }
        const systemAsk = `You are a helpful finance coach. Generate concise, general insights without naming specific categories.`
        const userAsk = `Given this spending summary JSON, return ONLY a JSON object with two fields: "bullets" (array of 2-3 concise observations) and "recommendations" (array of 2-4 short, actionable tips). Do not mention category names; refer generically to "your largest category" if needed. Keep supportive tone. No markdown, no prose outside JSON.\n\nSUMMARY:\n${JSON.stringify(summary)}`
        const res = await fetch(`${origin}/api/ai/response`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `${systemAsk}\n\n${userAsk}`, mood: "coach" }),
        })
        if (res.ok) {
          const payload = await res.json()
          const text = typeof payload === "string" ? payload : (payload as any).response
          // Try to extract JSON from the model response
          const jsonStart = text.indexOf("{")
          const jsonEnd = text.lastIndexOf("}")
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const jsonText = text.slice(jsonStart, jsonEnd + 1)
            const parsed = JSON.parse(jsonText)
            if (Array.isArray(parsed?.bullets) && parsed?.bullets.length) {
              insights.bullets = parsed.bullets.slice(0, 5)
            }
            if (Array.isArray(parsed?.recommendations) && parsed?.recommendations.length) {
              insights.recommendations = parsed.recommendations.slice(0, 6)
            }
          }
        }
      } catch (e) {
        // Swallow AI errors and keep fallback insights
        console.warn("AI synthesis failed, using fallback insights.", e)
      }
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error("AI insights error:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
