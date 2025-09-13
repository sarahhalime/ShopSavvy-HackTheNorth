"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Plus, Minus, X, Zap, Shield, Clock } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { SolanaPayButton } from "@/components/solana-pay-button"

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalItems, getTotalPrice } = useCartStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const handlePaymentSuccess = (data: any) => {
    // Redirect to success page
    window.location.href = `/checkout/success?reference=${data.reference}&signature=${data.signature}`
  }

  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/search">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Search
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold">ShopSavvy</h1>
                <Badge variant="secondary">Cart</Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't added any products to your cart yet.</p>
            <Button asChild size="lg">
              <Link href="/search">Start Shopping</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/search">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold">ShopSavvy</h1>
              <Badge variant="secondary">Cart ({totalItems})</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold">Shopping Cart</h2>

            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold line-clamp-2 mb-1">{item.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            <span className="text-sm text-muted-foreground">by {item.vendor}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <div className="text-sm text-muted-foreground">{formatPrice(item.price)} each</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <SolanaPayButton items={items} onSuccess={handlePaymentSuccess} onError={handlePaymentError} />

                <div className="text-xs text-muted-foreground text-center">Pay with SOL or USDC on Solana devnet</div>
              </CardContent>
            </Card>

            {/* Payment Benefits */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Secure blockchain payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Instant transaction confirmation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Low fees with Solana</span>
                </div>
              </CardContent>
            </Card>

            {/* Continue Shopping */}
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/search">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
