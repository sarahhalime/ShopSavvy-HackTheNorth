import { type NextRequest, NextResponse } from "next/server"
import { createEthRewardService, MockEthRewardService } from "@/lib/eth-reward-service"

export async function POST(request: NextRequest) {
  try {
    const { userAddress } = await request.json()

    if (!userAddress) {
      return NextResponse.json({ 
        error: "User address required" 
      }, { status: 400 })
    }

    const rewardService = createEthRewardService() || new MockEthRewardService()

    // Check pending reward first
    const pendingReward = await rewardService.getPendingReward(userAddress)
    
    if (parseFloat(pendingReward) === 0) {
      return NextResponse.json({
        success: false,
        error: "No rewards to claim"
      }, { status: 400 })
    }

    // Claim the reward
    const result = await rewardService.claimReward()

    if (result.success) {
      return NextResponse.json({
        success: true,
        transactionHash: result.transactionHash,
        claimedAmount: pendingReward,
        message: `Successfully claimed ${pendingReward} ETH!`,
        // Animation trigger data
        triggerAnimation: true,
        announcementText: `💰 ${pendingReward} ETH CLAIMED! 💰`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("ETH reward claim error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to claim ETH reward",
      success: false
    }, { status: 500 })
  }
}
