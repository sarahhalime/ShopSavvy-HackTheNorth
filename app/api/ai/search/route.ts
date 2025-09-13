import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isMockMode } from "@/lib/env"

const searchRequestSchema = z.object({
  query: z.string().min(1).max(500),
})

interface SearchFilters {
  keywords: string[]
  priceMin?: number
  priceMax?: number
  mustHaveTags: string[]
  excludeTags: string[]
  materials: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = searchRequestSchema.parse(body)

    if (isMockMode.ai) {
      // Mock AI search - simple keyword extraction
      const words = query.toLowerCase().split(" ")
      const priceMatch = query.match(/under\s*\$?(\d+)/i)
      const priceMax = priceMatch ? Number.parseInt(priceMatch[1]) * 100 : undefined

      const filters: SearchFilters = {
        keywords: words.filter(
          (word) => !["under", "over", "with", "and", "or", "the", "a", "an"].includes(word) && !word.startsWith("$"),
        ),
        priceMax,
        mustHaveTags: [],
        excludeTags: [],
        materials: words.filter((word) =>
          ["leather", "cotton", "polyester", "nylon", "metal", "plastic", "wood"].includes(word),
        ),
      }

      return NextResponse.json(filters)
    }

    // TODO: Implement real AI search with Cohere or Gemini
    // const aiResponse = await fetch('https://api.cohere.ai/v1/generate', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${env.COHERE_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'command',
    //     prompt: `Convert this natural language search query into structured filters: "${query}"`,
    //     max_tokens: 200,
    //   }),
    // })

    return NextResponse.json({
      keywords: query.split(" "),
      mustHaveTags: [],
      excludeTags: [],
      materials: [],
    })
  } catch (error) {
    console.error("AI search error:", error)
    return NextResponse.json({ error: "Failed to process search query" }, { status: 500 })
  }
}
