"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, ExternalLink, Copy, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SolanaPayButtonProps {
  items: any[]
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export function SolanaPayButton({ items, onSuccess, onError }: SolanaPayButtonProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<"sol" | "usdc">("sol")
  const { toast } = useToast()

  const createCheckout = async () => {
    setIsCreating(true)

    try {
      const response = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, paymentMethod }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create checkout")
      }

      setCheckoutData(data)

      toast({
        title: "Payment Request Created",
        description: "Click the payment URL to complete your purchase with a Solana wallet.",
      })
    } catch (error) {
      console.error("Checkout error:", error)
      onError?.(error)
      toast({
        title: "Checkout Error",
        description: "Failed to create payment request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
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
    // Mock successful payment for demo
    const mockSignature =
      "5KJp7xQ2jH8vL9mN3pR6tS4uW1yZ8aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4aB5cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3uV4wX5yZ6aB7cD8eF9gH0iJ1kL2mN3oP4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV0wX1yZ2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1u"

    onSuccess?.({
      signature: mockSignature,
      reference: checkoutData?.reference,
      orderId: checkoutData?.orderId,
    })
  }

  if (checkoutData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Payment Request Created</h3>
            <Badge variant="secondary">
              {checkoutData.currency} {checkoutData.amount}
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Payment URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {checkoutData.paymentUrl}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(checkoutData.paymentUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={openInWallet} className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Wallet
              </Button>
              <Button variant="outline" onClick={simulatePayment} className="flex-1 bg-transparent">
                <CheckCircle className="w-4 h-4 mr-2" />
                Simulate Payment
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Use a Solana wallet like Phantom, Solflare, or Backpack to complete payment
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div className="flex gap-2">
        <Button
          variant={paymentMethod === "sol" ? "default" : "outline"}
          size="sm"
          onClick={() => setPaymentMethod("sol")}
        >
          <Zap className="w-4 h-4 mr-1" />
          SOL
        </Button>
        <Button
          variant={paymentMethod === "usdc" ? "default" : "outline"}
          size="sm"
          onClick={() => setPaymentMethod("usdc")}
        >
          USDC
        </Button>
      </div>

      {/* Main Checkout Button */}
      <Button className="w-full" size="lg" onClick={createCheckout} disabled={isCreating}>
        <Zap className="w-4 h-4 mr-2" />
        {isCreating ? "Creating Payment..." : `Pay with ${paymentMethod.toUpperCase()}`}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        Secure payments on Solana {paymentMethod === "usdc" ? "with USDC stablecoin" : "blockchain"}
      </div>
    </div>
  )
}
