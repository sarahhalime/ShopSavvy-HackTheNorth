import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isMockMode } from "@/lib/env"

const rankRequestSchema = z.object({
  intent: z.object({
    keywords: z.array(z.string()),
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    mustHaveTags: z.array(z.string()),
    excludeTags: z.array(z.string()),
    materials: z.array(z.string()),
  }),
  products: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
      tags: z.array(z.string()),
    }),
  ),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { intent, products } = rankRequestSchema.parse(body)

    if (isMockMode.ai) {
      // Mock ranking - simple relevance scoring
      const scored = products.map((product: any) => {
        let score = 0

        // Keyword matching in title
        intent.keywords.forEach((keyword) => {
          if (product.title.toLowerCase().includes(keyword.toLowerCase())) {
            score += 10
          }
        })

        // Tag matching
        intent.mustHaveTags.forEach((tag) => {
          if (product.tags.some((t: string) => t.toLowerCase().includes(tag.toLowerCase()))) {
            score += 5
          }
        })

        // Price preference
        if (intent.priceMax && product.price <= intent.priceMax) {
          score += 3
        }

        return { ...product, score }
      })

      // Sort by score and return IDs
      const rankedIds = scored.sort((a, b) => b.score - a.score).map((p) => p.id)

      return NextResponse.json(rankedIds)
    }

    // TODO: Implement real AI ranking with Cohere or Gemini
    // const aiResponse = await fetch('https://api.cohere.ai/v1/rerank', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${env.COHERE_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'rerank-english-v2.0',
    //     query: intent.keywords.join(' '),
    //     documents: products.map(p => p.title),
    //     top_k: products.length,
    //   }),
    // })

    // Fallback: return products in original order
    return NextResponse.json(products.map((p: any) => p.id))
  } catch (error) {
    console.error("AI ranking error:", error)
    return NextResponse.json({ error: "Failed to rank products" }, { status: 500 })
  }
}
