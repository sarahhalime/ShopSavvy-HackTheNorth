import { type NextRequest, NextResponse } from "next/server"
import { PublicKey } from "@solana/web3.js"
import { solanaPayService, SOLANA_PAY_CONFIG } from "@/lib/solana-pay"
import type BigNumber from "bignumber.js"

export async function POST(request: NextRequest) {
  try {
    const { items, paymentMethod = "sol" } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    // Calculate total amount in cents
    const totalCents = items.reduce((sum: number, item: any) => {
      return sum + item.price * item.quantity
    }, 0)

    // Convert to USD
    const totalUsd = totalCents / 100

    // Generate reference key for tracking
    const reference = new PublicKey(Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)))

    // Create payment request based on method
    let amount: BigNumber
    let splToken: PublicKey | undefined

    if (paymentMethod === "usdc") {
      amount = solanaPayService.convertUsdToUsdc(totalUsd)
      splToken = SOLANA_PAY_CONFIG.USDC_MINT
    } else {
      // Default to SOL
      amount = solanaPayService.convertUsdToSol(totalUsd)
    }

    // Create payment URL
    const paymentUrl = solanaPayService.createPaymentRequest({
      recipient: SOLANA_PAY_CONFIG.MERCHANT_WALLET,
      amount,
      splToken,
      reference,
      label: "ShopSavvy Purchase",
      message: `Purchase of ${items.length} item(s) for $${totalUsd.toFixed(2)}`,
      memo: `ShopSavvy Order - ${reference.toString().slice(0, 8)}`,
    })

    // Store order in database (mock for now)
    const orderId = `SS-${Date.now()}-${reference.toString().slice(0, 8)}`

    // Return checkout data
    return NextResponse.json({
      success: true,
      orderId,
      reference: reference.toString(),
      paymentUrl: paymentUrl.toString(),
      amount: amount.toString(),
      currency: paymentMethod === "usdc" ? "USDC" : "SOL",
      totalUsd,
      items,
      network: SOLANA_PAY_CONFIG.NETWORK,
    })
  } catch (error) {
    console.error("Checkout creation error:", error)
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
  }
}
