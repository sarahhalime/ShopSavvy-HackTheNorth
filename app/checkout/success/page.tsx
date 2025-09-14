"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Copy, ExternalLink, Gift, Sparkles, Zap } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const ethReward = searchParams.get("ethReward") === "true"
  const rewardAmount = searchParams.get("rewardAmount") || "0"
  const { items, clearCart, getTotalPrice } = useCartStore()
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [showRewardAnimation, setShowRewardAnimation] = useState(false)

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  useEffect(() => {
    // Simulate order confirmation
    const timer = setTimeout(() => {
      setOrderConfirmed(true)
      clearCart()
      
      // Show reward animation if ETH reward was won
      if (ethReward && parseFloat(rewardAmount) > 0) {
        setShowRewardAnimation(true)
        
        // Hide animation after 5 seconds
        setTimeout(() => setShowRewardAnimation(false), 5000)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [clearCart, ethReward, rewardAmount])

  const totalPrice = getTotalPrice()
  const mockTransactionSignature =
    "5KJp7xQ2jH8vL9mN3pR6tS4uW1yZ8aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3uV4wX5yZ6aB7cD8eF9gH0iJ1kL2mN3oP4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV0wX1yZ2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3uV4wX5yZ6aB7cD8eF9gH0iJ1kL2mN3oP4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV0wX1yZ2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1u"

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!orderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Processing Your Order...</h1>
          <p className="text-muted-foreground">Please wait while we confirm your payment on the Solana blockchain.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* ETH Reward Animation Overlay */}
        {showRewardAnimation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in-0">
            <Card className="w-96 border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-300 rounded-full animate-ping"></div>
                </div>
                <CardTitle className="text-2xl font-bold text-yellow-700">
                  🎉 Congratulations!
                </CardTitle>
                <CardDescription className="text-lg text-yellow-600">
                  You won <span className="font-bold text-xl">{rewardAmount} ETH</span>!
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4" />
                  Reward will be available in your dashboard
                </div>
                <Button 
                  onClick={() => setShowRewardAnimation(false)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  Awesome! 🚀
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">Your order has been confirmed and is being processed.</p>
          
          {/* ETH Reward Success Banner */}
          {ethReward && parseFloat(rewardAmount) > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-300">
              <div className="flex items-center justify-center gap-2 text-yellow-700">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">
                  Bonus: You won {rewardAmount} ETH! 🎊
                </span>
              </div>
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Reference: {reference || "SS-" + Date.now()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Your payment has been recorded on the Solana blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Signature</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                    {mockTransactionSignature}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(mockTransactionSignature)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Confirmed</Badge>
                <Badge variant="outline">Solana Mainnet</Badge>
                {ethReward && parseFloat(rewardAmount) > 0 && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    <Gift className="w-3 h-3 mr-1" />
                    ETH Reward Won
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ETH Reward Details Card */}
        {ethReward && parseFloat(rewardAmount) > 0 && (
          <Card className="mb-6 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Sparkles className="w-5 h-5" />
                Ethereum Reward Details
              </CardTitle>
              <CardDescription>Your ETH reward from this purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Reward Amount:</span>
                  <span className="font-bold text-lg text-yellow-700">{rewardAmount} ETH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Win Probability:</span>
                  <span className="text-sm text-muted-foreground">30% (You were lucky!)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    Available in Dashboard
                  </Badge>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700">
                    🎲 <strong>How it works:</strong> Every purchase has a 30% chance to win ETH rewards powered by Chainlink VRF for true randomness. Check your dashboard to claim your rewards!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/search">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <ExternalLink className="h-4 w-4" />
            View on Solscan
          </Button>
        </div>
      </div>
    </div>
  )
}
