import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // In development, return mock data
    const mockFlags = [
      {
        key: "ethL2Receipts",
        enabled: false,
        description: "Enable Ethereum L2 NFT receipts for purchases",
        updatedAt: new Date(),
      },
      {
        key: "splCashback",
        enabled: true,
        description: "Enable SPL token cashback rewards program",
        updatedAt: new Date(),
      },
    ]

    return NextResponse.json({
      success: true,
      flags: mockFlags,
    })
  } catch (error) {
    console.error("Error fetching feature flags:", error)
    return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, enabled, description } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "Flag key is required" }, { status: 400 })
    }

    // In development, simulate database operation
    console.log(`[MOCK] Updating feature flag: ${key} = ${enabled}`)

    return NextResponse.json({
      success: true,
      flag: {
        key,
        enabled,
        description,
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error updating feature flag:", error)
    return NextResponse.json({ error: "Failed to update feature flag" }, { status: 500 })
  }
}
