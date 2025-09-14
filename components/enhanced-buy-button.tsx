"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Zap, Gift, Sparkles, ExternalLink, Copy } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"

interface Product {
  id: string
  title: string
  price: number
  vendor: string
  tags: string[]
  image: string
  rating: number
  category: string
}

interface EnhancedBuyButtonProps {
  product: Product
  className?: string
}

export function EnhancedBuyButton({ product, className }: EnhancedBuyButtonProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<"sol" | "usdc">("sol")
  const [ethRewardPending, setEthRewardPending] = useState(false)
  const { toast } = useToast()
  const { addItem } = useCartStore()

  // Quick buy - bypasses cart and goes straight to checkout
  const quickBuy = async () => {
    setIsCreating(true)

    try {
      // Add to cart temporarily for checkout
      const cartItem = {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        image: product.image,
        vendor: product.vendor
      }

      // Create checkout with single item
      const response = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: [cartItem], 
          paymentMethod,
          ethRewardEnabled: true // Enable ETH rewards for this purchase
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create checkout")
      }

      setCheckoutData(data)

      // Check if ETH rewards are enabled and show notification
      if (data.ethRewardEnabled) {
        setEthRewardPending(true)
        toast({
          title: "🎉 ETH Rewards Enabled!",
          description: "Complete this purchase for a 30% chance to win ETH rewards (0.001-0.01 ETH)!",
        })
      }

      toast({
        title: "Payment Request Created",
        description: "Complete your purchase with Solana Pay to potentially win ETH rewards!",
      })
    } catch (error) {
      console.error("Quick buy error:", error)
      toast({
        title: "Checkout Error",
        description: "Failed to create payment request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const addToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      image: product.image,
      vendor: product.vendor
    })

    toast({
      title: "Added to Cart",
      description: `${product.title} added to your cart.`,
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Payment URL copied to clipboard.",
    })
  }

  const openInWallet = () => {
    if (checkoutData?.paymentUrl) {
      window.open(checkoutData.paymentUrl, "_blank")
    }
  }

  const simulatePayment = async () => {
    if (!checkoutData) return

    try {
      // Simulate payment completion and trigger ETH reward processing
      const response = await fetch("/api/checkout/verify-ethereum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: checkoutData.reference,
          signature: "demo_signature_" + Date.now(),
          purchaseAmount: product.price / 100, // Convert cents to dollars
          buyerAddress: "0xDemo1234567890123456789012345678901234567890" // Demo address
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "🎉 Payment Successful!",
          description: result.ethReward ? 
            `Congratulations! You won ${result.ethReward.amount} ETH! 🎊` : 
            "Payment completed successfully!",
        })

        // Redirect to success page with ETH reward info
        const params = new URLSearchParams({
          reference: checkoutData.reference,
          ethReward: result.ethReward ? "true" : "false",
          rewardAmount: result.ethReward?.amount || "0"
        })
        window.location.href = `/checkout/success?${params.toString()}`
      }
    } catch (error) {
      console.error("Payment simulation error:", error)
      toast({
        title: "Payment Error",
        description: "Payment simulation failed.",
        variant: "destructive"
      })
    }
  }

  // If checkout data exists, show payment interface
  if (checkoutData) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Solana Pay Checkout
            {ethRewardPending && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Gift className="w-3 h-3" />
                ETH Rewards
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Complete your purchase with a Solana wallet
            {ethRewardPending && (
              <div className="flex items-center gap-1 mt-1 text-yellow-600">
                <Sparkles className="w-3 h-3" />
                30% chance to win 0.001-0.01 ETH!
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">{checkoutData.amount} {checkoutData.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>USD Total:</span>
              <span className="font-medium">${checkoutData.totalUsd}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={openInWallet}
              disabled={!checkoutData.paymentUrl}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Wallet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(checkoutData.paymentUrl)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Demo simulation button */}
          <Button 
            variant="secondary" 
            className="w-full" 
            onClick={simulatePayment}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Simulate Payment (Demo)
          </Button>

          <div className="text-xs text-center space-y-1">
            <p className="text-muted-foreground">
              Payment URL: <code className="text-xs">{checkoutData.paymentUrl?.slice(0, 50)}...</code>
            </p>
            {ethRewardPending && (
              <p className="text-yellow-600 font-medium">
                🎲 ETH reward will be processed after payment confirmation
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default buy button interface
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Payment Method Selection */}
      <div className="flex gap-1">
        <Button
          variant={paymentMethod === "sol" ? "default" : "outline"}
          size="sm"
          onClick={() => setPaymentMethod("sol")}
          className="text-xs px-2 py-1"
        >
          SOL
        </Button>
        <Button
          variant={paymentMethod === "usdc" ? "default" : "outline"}
          size="sm"
          onClick={() => setPaymentMethod("usdc")}
          className="text-xs px-2 py-1"
        >
          USDC
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          size="sm" 
          onClick={quickBuy} 
          disabled={isCreating}
        >
          <Zap className="w-3 h-3 mr-1" />
          {isCreating ? "Creating..." : "Quick Buy"}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={addToCart}
          className="whitespace-nowrap"
        >
          Add to Cart
        </Button>
      </div>

      {/* ETH Rewards Notice */}
      <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
        <Gift className="w-3 h-3 text-yellow-500" />
        30% chance to win ETH rewards!
      </div>
    </div>
  )
}
