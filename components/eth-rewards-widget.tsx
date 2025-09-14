"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Gift, Zap, ExternalLink, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ethAnimationManager } from "@/components/eth-animation"

interface RewardData {
  pendingReward: string
  contractBalance: string
  rewardPool: string
  hasReward: boolean
}

export function EthRewardsWidget() {
  const [rewardData, setRewardData] = useState<RewardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [userAddress] = useState("0x742d35Cc6532C02bAc9F64f3d3f7BC0a97Fd8c3E") // Mock address
  const { toast } = useToast()

  const fetchRewardData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/eth-rewards/process?address=${userAddress}`)
      const data = await response.json()
      
      if (data.success) {
        setRewardData(data)
      }
    } catch (error) {
      console.error("Failed to fetch reward data:", error)
    } finally {
      setLoading(false)
    }
  }

  const claimReward = async () => {
    if (!rewardData?.hasReward) return
    
    setClaiming(true)
    try {
      const response = await fetch("/api/eth-rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "🎉 Reward Claimed!",
          description: `Successfully claimed ${result.claimedAmount} ETH!`
        })
        
        // Trigger celebration animation
        if (result.triggerAnimation) {
          ethAnimationManager.triggerGlobalAnimation()
        }
        
        // Refresh data
        fetchRewardData()
      } else {
        toast({
          title: "Claim Failed",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Claim Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive"
      })
    } finally {
      setClaiming(false)
    }
  }

  const triggerTestReward = async () => {
    try {
      const response = await fetch("/api/eth-rewards/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerAddress: userAddress,
          purchaseAmountUSD: 50, // $50 test purchase
          orderId: `test-${Date.now()}`
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: result.hasReward ? "🎊 You Won!" : "🎯 Try Again!",
          description: result.message
        })
        
        if (result.triggerAnimation) {
          ethAnimationManager.triggerGlobalAnimation()
        }
        
        // Refresh data
        fetchRewardData()
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test reward system",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchRewardData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRewardData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          ETH Rewards
          <Badge variant="secondary" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pending Rewards */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-green-600" />
            <span className="font-medium text-sm">Pending Rewards</span>
          </div>
          <div className="text-right">
            {loading ? (
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="font-bold text-green-600">
                  {rewardData?.pendingReward || '0'} ETH
                </div>
                {rewardData?.hasReward && (
                  <div className="text-xs text-green-500">Ready to claim!</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Contract Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-muted rounded text-center">
            <div className="font-medium">Reward Pool</div>
            <div className="text-blue-600">{rewardData?.rewardPool || '0'} ETH</div>
          </div>
          <div className="p-2 bg-muted rounded text-center">
            <div className="font-medium">Contract Balance</div>
            <div className="text-purple-600">{rewardData?.contractBalance || '0'} ETH</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {rewardData?.hasReward ? (
            <Button 
              onClick={claimReward}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {claiming ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Claim {rewardData.pendingReward} ETH
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={triggerTestReward}
              variant="outline"
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Test Reward (30% chance)
            </Button>
          )}
          
          <Button
            onClick={fetchRewardData}
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <span>💡</span>
            <span>30% chance to win ETH on each purchase!</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🎲</span>
            <span>Powered by Chainlink VRF randomness</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span>Rewards: 0.001 - 0.01 ETH</span>
          </div>
        </div>

        {/* Contract Link */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => window.open("https://sepolia.etherscan.io/", "_blank")}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          View Contract on Etherscan
        </Button>
      </CardContent>
    </Card>
  )
}
