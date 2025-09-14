"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EthAnimation, useEthAnimation, ethAnimationManager } from "@/components/eth-animation"
import { EthRewardsWidget } from "@/components/eth-rewards-widget"
import { Wallet, Zap, TrendingUp, DollarSign, Play } from "lucide-react"
import Image from "next/image"

export default function EthDemoPage() {
  const [selectedEvent, setSelectedEvent] = useState("payment")
  const [customText, setCustomText] = useState("")
  const { trigger: localTrigger, triggerAnimation: triggerLocal } = useEthAnimation()

  const demoEvents = {
    payment: { text: "ETH Payment Confirmed!", duration: 3000, particles: 8 },
    staking: { text: "ETH Staking Reward!", duration: 4000, particles: 12 },
    reward: { text: "Cashback Earned!", duration: 2500, particles: 6 },
    custom: { text: customText || "Custom ETH Event!", duration: 3000, particles: 10 }
  }

  const triggerGlobalAnimation = () => {
    ethAnimationManager.triggerGlobalAnimation()
  }

  const triggerLocalAnimation = () => {
    triggerLocal()
  }

  const triggerStakingEvent = async () => {
    try {
      const response = await fetch("/api/eth-staking/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stake",
          amount: "0.5",
          userAddress: "0x742d35Cc6532C02bAc9F64f3d3f7BC0a97Fd8c3E"
        })
      })

      const result = await response.json()
      if (result.triggerAnimation) {
        ethAnimationManager.triggerGlobalAnimation()
      }
    } catch (error) {
      console.error("Failed to trigger staking event:", error)
    }
  }

  const triggerEthPayment = async () => {
    try {
      const response = await fetch("/api/checkout/verify-ethereum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          expectedAmount: "1000000", // 1 USDC
          expectedCurrency: "USDC",
          orderId: "demo-order-123"
        })
      })

      const result = await response.json()
      if (result.triggerAnimation) {
        ethAnimationManager.triggerGlobalAnimation()
      }
    } catch (error) {
      console.error("Failed to trigger ETH payment:", error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">ETH Animation Demo</h1>
        <p className="text-lg text-muted-foreground">
          Test the beautiful ETH animations that trigger around images when events occur
        </p>
      </div>

      {/* Demo Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EthAnimation 
          trigger={localTrigger}
          announcementText={demoEvents[selectedEvent as keyof typeof demoEvents].text}
          duration={demoEvents[selectedEvent as keyof typeof demoEvents].duration}
          particles={demoEvents[selectedEvent as keyof typeof demoEvents].particles}
          size="lg"
        >
          <Card className="overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src="/wireless-headphones.png"
                alt="Demo Product"
                fill
                className="object-cover"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">Premium Headphones</h3>
              <p className="text-2xl font-bold text-primary">$199.99</p>
            </CardContent>
          </Card>
        </EthAnimation>

        <EthAnimation 
          trigger={localTrigger}
          announcementText="Global ETH Event!"
          size="md"
        >
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Wallet className="w-16 h-16 text-white" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">ETH Wallet</h3>
              <p className="text-lg">2.45 ETH</p>
            </CardContent>
          </Card>
        </EthAnimation>

        <EthAnimation 
          trigger={localTrigger}
          announcementText="Staking Rewards!"
          size="sm"
        >
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-16 h-16 text-white" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">Staking Pool</h3>
              <p className="text-lg">4.2% APY</p>
            </CardContent>
          </Card>
        </EthAnimation>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Animation Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Type Selector */}
          <div className="space-y-3">
            <Label>Select Event Type</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(demoEvents).map(([key, event]) => (
                <Button
                  key={key}
                  variant={selectedEvent === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEvent(key)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Text Input */}
          {selectedEvent === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customText">Custom Announcement Text</Label>
              <Input
                id="customText"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Enter your custom announcement..."
              />
            </div>
          )}

          {/* Trigger Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={triggerLocalAnimation} className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              Trigger Local
            </Button>
            
            <Button onClick={triggerGlobalAnimation} variant="outline" className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              Trigger Global
            </Button>

            <Button onClick={triggerStakingEvent} variant="secondary" className="w-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              Test Staking API
            </Button>

            <Button onClick={triggerEthPayment} variant="secondary" className="w-full">
              <DollarSign className="w-4 h-4 mr-2" />
              Test Payment API
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2">Local Animation</h4>
              <p className="text-xs text-muted-foreground">
                Triggers animation only on the specific component instance
              </p>
            </Card>
            
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2">Global Animation</h4>
              <p className="text-xs text-muted-foreground">
                Triggers animation on all ETH components across the app
              </p>
            </Card>
            
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2">API Triggers</h4>
              <p className="text-xs text-muted-foreground">
                Real API calls that would trigger animations in production
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* ETH Rewards Widget */}
      <div className="flex justify-center">
        <EthRewardsWidget />
      </div>

      {/* Feature Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Animation Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-green-500"></Badge>
                Rotating ETH logo particles around images
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-blue-500"></Badge>
                Glowing pulse effects and central radial gradient
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-purple-500"></Badge>
                Customizable announcement text with speech bubble
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-yellow-500"></Badge>
                Sparkle effects for extra celebration
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-2 h-2 p-0 rounded-full bg-red-500"></Badge>
                Multiple size options (sm, md, lg)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Use Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-500" />
                ETH/USDC payment confirmations
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Staking rewards and delegations
              </li>
              <li className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-500" />
                Cashback and reward notifications
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Transaction status updates
              </li>
              <li className="flex items-center gap-2">
                <Play className="w-4 h-4 text-red-500" />
                Any ETH-related event celebration
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
