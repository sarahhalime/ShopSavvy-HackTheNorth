"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Gift, ExternalLink, Clock, CheckCircle, Zap } from "lucide-react"

interface EthReward {
  id: string
  amount: string
  status: 'pending' | 'claimed'
  transactionHash?: string
  earnedAt: Date
  claimedAt?: Date
  purchaseReference: string
}

// Mock ETH rewards data - in real app this would come from your backend/database
const mockEthRewards: EthReward[] = [
  {
    id: "eth_reward_1",
    amount: "0.003420",
    status: "pending",
    earnedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    purchaseReference: "SS-1736816-abc123",
    transactionHash: "0x1234567890abcdef1234567890abcdef12345678"
  },
  {
    id: "eth_reward_2", 
    amount: "0.007850",
    status: "claimed",
    earnedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    claimedAt: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 hours ago
    purchaseReference: "SS-1736701-def456",
    transactionHash: "0xabcdef1234567890abcdef1234567890abcdef12"
  },
  {
    id: "eth_reward_3",
    amount: "0.001250",
    status: "pending", 
    earnedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    purchaseReference: "SS-1736820-ghi789",
    transactionHash: "0x567890abcdef1234567890abcdef1234567890ab"
  }
]

export function EthRewardsWidget() {
  const [rewards, setRewards] = useState<EthReward[]>(mockEthRewards)
  const [isClaiming, setIsClaiming] = useState<string | null>(null)

  const pendingRewards = rewards.filter(r => r.status === 'pending')
  const claimedRewards = rewards.filter(r => r.status === 'claimed')
  const totalPending = pendingRewards.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const totalClaimed = claimedRewards.reduce((sum, r) => sum + parseFloat(r.amount), 0)

  const formatEth = (amount: string) => `${amount} ETH`
  const formatUsd = (ethAmount: string) => {
    const usd = parseFloat(ethAmount) * 3300 // Assuming ETH = $3300
    return `~$${usd.toFixed(2)}`
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffHours > 0) return `${diffHours}h ago`
    return `${diffMins}m ago`
  }

  const claimReward = async (rewardId: string) => {
    setIsClaiming(rewardId)
    
    // Simulate API call to claim reward
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setRewards(prev => prev.map(r => 
      r.id === rewardId 
        ? { ...r, status: 'claimed' as const, claimedAt: new Date() }
        : r
    ))
    
    setIsClaiming(null)
  }

  const openEtherscan = (txHash: string) => {
    // Open transaction on Etherscan (Sepolia testnet)
    window.open(`https://sepolia.etherscan.io/tx/${txHash}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending ETH</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{formatEth(totalPending.toFixed(6))}</div>
            <p className="text-xs text-yellow-600">{formatUsd(totalPending.toFixed(6))}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Claimed ETH</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatEth(totalClaimed.toFixed(6))}</div>
            <p className="text-xs text-green-600">{formatUsd(totalClaimed.toFixed(6))}</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Total Wins</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{rewards.length}</div>
            <p className="text-xs text-purple-600">30% win rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Rewards */}
      {pendingRewards.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Gift className="w-5 h-5" />
              Pending ETH Rewards
            </CardTitle>
            <CardDescription>
              Your ETH rewards are ready to claim! Each reward was won with a 30% chance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-yellow-700">{formatEth(reward.amount)}</span>
                      <span className="text-sm text-yellow-600">{formatUsd(reward.amount)}</span>
                      <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                        Pending
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      From purchase {reward.purchaseReference} • {formatTimeAgo(reward.earnedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEtherscan(reward.transactionHash!)}
                      className="text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Etherscan
                    </Button>
                    <Button
                      onClick={() => claimReward(reward.id)}
                      disabled={isClaiming === reward.id}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      {isClaiming === reward.id ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Claim ETH
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claimed Rewards History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Claimed ETH Rewards
          </CardTitle>
          <CardDescription>Your ETH reward history</CardDescription>
        </CardHeader>
        <CardContent>
          {claimedRewards.length > 0 ? (
            <div className="space-y-3">
              {claimedRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-green-700">{formatEth(reward.amount)}</span>
                      <span className="text-sm text-green-600">{formatUsd(reward.amount)}</span>
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-100">
                        ✓ Claimed
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      From purchase {reward.purchaseReference} • Claimed {formatTimeAgo(reward.claimedAt!)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEtherscan(reward.transactionHash!)}
                    className="text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Transaction
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No claimed rewards yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-blue-700">🎲 How ETH Rewards Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-700">
          <div className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Every purchase has a <strong>30% chance</strong> to win ETH rewards</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Reward amounts range from <strong>0.001 - 0.01 ETH</strong> based on purchase size</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Powered by <strong>Chainlink VRF</strong> for true randomness</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Claim anytime to receive ETH in your wallet</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
