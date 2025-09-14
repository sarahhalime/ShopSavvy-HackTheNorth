import { type NextRequest, NextResponse } from "next/server"
import { createEthereumPayService } from "@/lib/ethereum-pay-service"

export async function POST(request: NextRequest) {
  try {
    const { transactionHash, expectedAmount, expectedCurrency = 'USDC', orderId } = await request.json()

    if (!transactionHash) {
      return NextResponse.json({ error: "Transaction hash required" }, { status: 400 })
    }

    if (!expectedAmount) {
      return NextResponse.json({ error: "Expected amount required" }, { status: 400 })
    }

    const ethService = createEthereumPayService()
    if (!ethService) {
      return NextResponse.json({ error: "Ethereum service not configured" }, { status: 500 })
    }

    // Verify the transaction
    const result = await ethService.verifyPayment(
      transactionHash,
      expectedAmount,
      expectedCurrency as 'ETH' | 'USDC'
    )

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || "Transaction verification failed",
        verified: false
      }, { status: 400 })
    }

    // Get additional transaction details
    const transactionDetails = await ethService.getTransactionDetails(transactionHash)

    // Update order status in database (mock for now)
    // In a real app, you would update the order status to 'paid'
    console.log(`ETH Order ${orderId} verified with transaction ${transactionHash}`)

    return NextResponse.json({
      success: true,
      verified: true,
      transactionHash,
      transactionDetails,
      gasUsed: result.gasUsed,
      effectiveGasPrice: result.effectiveGasPrice,
      currency: expectedCurrency,
      networkName: ethService.getNetworkName(),
      timestamp: new Date().toISOString(),
      // Animation trigger data
      triggerAnimation: true,
      announcementText: `ETH Payment Verified! ${expectedCurrency} transaction confirmed on ${ethService.getNetworkName()}`
    })
  } catch (error: any) {
    console.error("ETH transaction verification error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to verify ETH transaction",
      verified: false
    }, { status: 500 })
  }
}
