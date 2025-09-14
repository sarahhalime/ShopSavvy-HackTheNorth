"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { EthAnimation, ethAnimationManager } from "@/components/eth-animation"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const { items, clearCart, getTotalPrice } = useCartStore()
  const [orderConfirmed, setOrderConfirmed] = useState(false)

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  useEffect(() => {
    // Simulate order confirmation
    const timer = setTimeout(async () => {
      setOrderConfirmed(true)
      const totalUSD = getTotalPrice() / 100
      
      // Try to process ETH reward
      try {
        const response = await fetch("/api/eth-rewards/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyerAddress: "0x742d35Cc6532C02bAc9F64f3d3f7BC0a97Fd8c3E", // Mock address
            purchaseAmountUSD: totalUSD,
            orderId: reference || "demo-order"
          })
        })
        
        const rewardResult = await response.json()
        
        if (rewardResult.success && rewardResult.triggerAnimation) {
          // Trigger special reward animation
          ethAnimationManager.triggerGlobalAnimation()
        } else {
          // Regular celebration animation
          ethAnimationManager.triggerGlobalAnimation()
        }
      } catch (error) {
        console.error("ETH reward error:", error)
        // Still trigger regular animation
        ethAnimationManager.triggerGlobalAnimation()
      }
      
      clearCart()
    }, 2000)

    return () => clearTimeout(timer)
  }, [clearCart, reference, getTotalPrice])

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
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">Your order has been confirmed and is being processed.</p>
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
              </div>
            </div>
          </CardContent>
        </Card>

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
