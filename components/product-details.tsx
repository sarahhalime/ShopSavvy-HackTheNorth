"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Star, ArrowLeft, Plus, Minus, ShoppingCart, Heart } from "lucide-react"

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

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : i < rating
              ? "fill-yellow-400/50 text-yellow-400"
              : "text-gray-300"
        }`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <Badge variant="secondary">Product</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {!imageError ? (
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Product Image</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary">{product.category}</Badge>
                <span className="text-sm text-muted-foreground">by {product.vendor}</span>
              </div>
              <h1 className="text-3xl font-bold text-balance mb-4">{product.title}</h1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {renderStars(product.rating)}
                  <span className="text-sm text-muted-foreground ml-2">({product.rating} stars)</span>
                </div>
              </div>

              <div className="text-3xl font-bold text-primary mb-6">{formatPrice(product.price)}</div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, i) => (
                  <Badge key={i} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button className="flex-1" size="lg">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">Total: {formatPrice(product.price * quantity)}</div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <div className="font-medium">{product.category}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Vendor:</span>
                  <div className="font-medium">{product.vendor}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Rating:</span>
                  <div className="font-medium">{product.rating}/5 stars</div>
                </div>
                <div>
                  <span className="text-muted-foreground">SKU:</span>
                  <div className="font-medium">{product.id}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6" />
                </div>
                <p>Reviews coming soon</p>
                <p className="text-sm mt-1">Be the first to review this product</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
