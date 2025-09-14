import { type NextRequest, NextResponse } from "next/server"
import { createEthRewardService, MockEthRewardService } from "@/lib/eth-reward-service"
import { ethAnimationManager } from "@/components/eth-animation"

export async function POST(request: NextRequest) {
  try {
    const { buyerAddress, purchaseAmountUSD, orderId } = await request.json()

    if (!buyerAddress || !purchaseAmountUSD) {
      return NextResponse.json({ 
        error: "Buyer address and purchase amount required" 
      }, { status: 400 })
    }

    // Use mock service for development, real service for production
    const rewardService = createEthRewardService() || new MockEthRewardService()

    // Process the purchase reward
    const result = await rewardService.processPurchaseReward(buyerAddress, purchaseAmountUSD)

    if (result.success) {
      // Get updated pending reward
      const pendingReward = await rewardService.getPendingReward(buyerAddress)
      const hasReward = parseFloat(pendingReward) > 0

      return NextResponse.json({
        success: true,
        transactionHash: result.transactionHash,
        pendingReward,
        hasReward,
        message: hasReward ? 
          `🎉 You won ${pendingReward} ETH!` : 
          "No reward this time, try again!",
        // Animation trigger data
        triggerAnimation: hasReward,
        announcementText: hasReward ? 
          `🎊 FREE ETH WON! ${pendingReward} ETH 🎊` : 
          "🎯 Better luck next time!",
        orderId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        hasReward: false
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("ETH reward processing error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to process ETH reward",
      success: false,
      hasReward: false
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('address')

    if (!userAddress) {
      return NextResponse.json({ 
        error: "User address required" 
      }, { status: 400 })
    }

    const rewardService = createEthRewardService() || new MockEthRewardService()

    // Get reward info
    const [pendingReward, rewardInfo] = await Promise.all([
      rewardService.getPendingReward(userAddress),
      rewardService.getRewardInfo()
    ])

    return NextResponse.json({
      success: true,
      pendingReward,
      contractBalance: rewardInfo.contractBalance,
      rewardPool: rewardInfo.rewardPool,
      hasReward: parseFloat(pendingReward) > 0
    })
  } catch (error: any) {
    console.error("ETH reward info error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to get reward info",
      success: false
    }, { status: 500 })
  }
}
