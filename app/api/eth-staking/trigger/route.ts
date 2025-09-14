import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { action, amount, validator, userAddress } = await request.json()

    // Simulate ETH staking events
    const stakingEvents = {
      stake: "ETH Staking Initiated!",
      unstake: "ETH Unstaking Started!",
      claim: "Staking Rewards Claimed!",
      redelegate: "Stake Redelegated!"
    }

    const announcementText = stakingEvents[action as keyof typeof stakingEvents] || "ETH Staking Event!"

    // Mock staking processing
    const stakingResult = {
      success: true,
      action,
      amount: amount || "0.5",
      validator: validator || "Ethereum Validator #1234",
      userAddress: userAddress || "0x742d35Cc6532C02bAc9F64f3d3f7BC0a97Fd8c3E",
      estimatedRewards: "0.025 ETH/year",
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      ...stakingResult,
      // Animation trigger data
      triggerAnimation: true,
      announcementText,
      animationDuration: 4000, // Longer for staking events
      particles: 12 // More particles for celebration
    })
  } catch (error: any) {
    console.error("ETH staking trigger error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to process staking event",
      success: false
    }, { status: 500 })
  }
}

export async function GET() {
  // Get current staking status
  return NextResponse.json({
    stakedAmount: "2.5 ETH",
    pendingRewards: "0.15 ETH",
    activeValidators: 3,
    totalRewards: "0.8 ETH",
    stakingAPY: "4.2%",
    lastUpdate: new Date().toISOString()
  })
}
