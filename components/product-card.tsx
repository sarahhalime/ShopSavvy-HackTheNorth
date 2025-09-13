"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Plus, ShoppingCart, GitCompare } from "lucide-react"

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

interface ProductCardProps {
  product: Product
  onAddToCompare?: () => void
  isInCompare?: boolean
}

export function ProductCard({ product, onAddToCompare, isInCompare }: ProductCardProps) {
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
        className={`w-3 h-3 ${
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
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {!imageError ? (
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Product Image</p>
            </div>
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAddToCompare && (
            <Button
              size="sm"
              variant={isInCompare ? "default" : "secondary"}
              onClick={(e) => {
                e.preventDefault()
                onAddToCompare()
              }}
              disabled={isInCompare}
              className="shadow-sm"
            >
              <GitCompare className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{product.title}</h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">{renderStars(product.rating)}</div>
            <span className="text-xs text-muted-foreground">({product.rating})</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-primary">{formatPrice(product.price)}</div>
            <div className="text-xs text-muted-foreground">by {product.vendor}</div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{product.tags.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-2">
        <div className="flex space-x-2 w-full">
          <Button asChild className="flex-1" size="sm">
            <Link href={`/product/${product.id}`}>View Details</Link>
          </Button>
          <Button size="sm" variant="outline">
            <Plus className="w-3 h-3 mr-1" />
            Cart
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
