import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isMockMode } from "@/lib/env"

const reconcileRequestSchema = z.object({
  receiptImage: z.string(), // base64 encoded image
  transactionSig: z.string(),
  expectedTotal: z.number(),
})

interface ReconciliationResult {
  success: boolean
  confidence: number
  extractedData: {
    vendor: string
    total: number
    items: Array<{
      name: string
      price: number
      quantity: number
    }>
    date: string
  }
  discrepancies: string[]
  recommendations: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { receiptImage, transactionSig, expectedTotal } = reconcileRequestSchema.parse(body)

    if (isMockMode.ai) {
      // Mock receipt reconciliation
      const mockExtractedData = {
        vendor: "TechGear Pro",
        total: expectedTotal + Math.floor(Math.random() * 200 - 100), // Add some variance
        items: [
          {
            name: "Waterproof Laptop Backpack",
            price: expectedTotal - 500,
            quantity: 1,
          },
          {
            name: "Shipping & Tax",
            price: 500,
            quantity: 1,
          },
        ],
        date: new Date().toISOString().split("T")[0],
      }

      const totalDifference = Math.abs(mockExtractedData.total - expectedTotal)
      const confidence = Math.max(0.6, 1 - totalDifference / expectedTotal)

      const result: ReconciliationResult = {
        success: totalDifference < expectedTotal * 0.05, // Within 5%
        confidence,
        extractedData: mockExtractedData,
        discrepancies:
          totalDifference > 0
            ? [
                `Receipt total ($${(mockExtractedData.total / 100).toFixed(2)}) differs from transaction amount ($${(expectedTotal / 100).toFixed(2)}) by $${(totalDifference / 100).toFixed(2)}`,
              ]
            : [],
        recommendations: [
          "Receipt successfully processed and matched with blockchain transaction",
          "Consider enabling automatic receipt capture for future purchases",
          totalDifference > 0
            ? "Review itemized charges for any unexpected fees"
            : "Transaction amounts match perfectly",
        ].filter(Boolean),
      }

      return NextResponse.json(result)
    }

    // TODO: Implement real receipt OCR with Google Vision API or similar
    // const visionResponse = await fetch('https://vision.googleapis.com/v1/images:annotate', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${env.GOOGLE_VISION_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     requests: [{
    //       image: { content: receiptImage },
    //       features: [{ type: 'TEXT_DETECTION' }]
    //     }]
    //   }),
    // })

    return NextResponse.json({
      success: false,
      confidence: 0,
      extractedData: {
        vendor: "Unknown",
        total: expectedTotal,
        items: [],
        date: new Date().toISOString().split("T")[0],
      },
      discrepancies: ["Receipt processing not yet implemented"],
      recommendations: ["Upload receipt for manual review"],
    })
  } catch (error) {
    console.error("Receipt reconciliation error:", error)
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 })
  }
}
