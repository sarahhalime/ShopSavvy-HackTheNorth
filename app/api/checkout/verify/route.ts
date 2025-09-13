import { type NextRequest, NextResponse } from "next/server"
import { PublicKey } from "@solana/web3.js"
import { solanaPayService } from "@/lib/solana-pay"

export async function POST(request: NextRequest) {
  try {
    const { signature, reference } = await request.json()

    if (!signature) {
      return NextResponse.json({ error: "Transaction signature required" }, { status: 400 })
    }

    // Verify the transaction
    const referenceKey = reference ? new PublicKey(reference) : undefined
    const isValid = await solanaPayService.verifyTransaction(signature, referenceKey)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid transaction" }, { status: 400 })
    }

    // Get transaction details
    const transactionDetails = await solanaPayService.getTransactionDetails(signature)

    // Update order status in database (mock for now)
    // In a real app, you would update the order status to 'paid'

    return NextResponse.json({
      success: true,
      verified: true,
      signature,
      transactionDetails,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Transaction verification error:", error)
    return NextResponse.json({ error: "Failed to verify transaction" }, { status: 500 })
  }
}
