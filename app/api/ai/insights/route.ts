import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isMockMode } from "@/lib/env"

const insightsRequestSchema = z.object({
  userId: z.string().optional(),
  orders: z.array(
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
  ),
})

interface SpendingInsights {
  bullets: string[]
  budgetRule: string
  savingsTip: string
  categoryBreakdown: Record<string, number>
  monthlyTrend: "increasing" | "decreasing" | "stable"
  riskScore: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orders } = insightsRequestSchema.parse(body)

    if (isMockMode.ai) {
      // Mock AI insights generation
      const totalSpent = orders.reduce((sum, order) => sum + order.totalCents, 0)
      const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0

      // Category analysis
      const categoryTotals: Record<string, number> = {}
      orders.forEach((order) => {
        order.items.forEach((item) => {
          categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.priceCents * item.qty
        })
      })

      const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || "Electronics"
      const monthlySpend = totalSpent / Math.max(1, orders.length)

      const insights: SpendingInsights = {
        bullets: [
          `You spent ${(((categoryTotals[topCategory] || 0) / totalSpent) * 100).toFixed(0)}% more on ${topCategory} this period compared to other categories`,
          `Your average order value is $${(avgOrderValue / 100).toFixed(2)}, which is ${avgOrderValue > 5000 ? "above" : "below"} the typical range`,
          `You could save $${((monthlySpend * 0.15) / 100).toFixed(0)}/month by comparing prices across multiple vendors`,
        ],
        budgetRule: `Consider setting a $${Math.ceil((monthlySpend * 1.2) / 100)} monthly limit for ${topCategory} purchases`,
        savingsTip:
          "Bundle similar items in single orders to reduce shipping costs and take advantage of bulk discounts",
        categoryBreakdown: categoryTotals,
        monthlyTrend: avgOrderValue > 7500 ? "increasing" : avgOrderValue < 3000 ? "decreasing" : "stable",
        riskScore: Math.min(100, Math.max(0, 100 - (monthlySpend / 10000) * 100)),
      }

      return NextResponse.json(insights)
    }

    // TODO: Implement real AI insights with Cohere or Gemini
    // const aiResponse = await fetch('https://api.cohere.ai/v1/generate', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${env.COHERE_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'command',
    //     prompt: `Analyze this spending data and provide insights: ${JSON.stringify(orders)}`,
    //     max_tokens: 500,
    //   }),
    // })

    return NextResponse.json({
      bullets: ["AI insights coming soon"],
      budgetRule: "Set a monthly spending limit",
      savingsTip: "Compare prices before purchasing",
      categoryBreakdown: {},
      monthlyTrend: "stable" as const,
      riskScore: 75,
    })
  } catch (error) {
    console.error("AI insights error:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
