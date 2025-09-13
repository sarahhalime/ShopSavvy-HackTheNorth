"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { X, Star, ShoppingCart } from "lucide-react"
import Image from "next/image"

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

interface CompareDrawerProps {
  products: Product[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemoveProduct: (productId: string) => void
}

export function CompareDrawer({ products, open, onOpenChange, onRemoveProduct }: CompareDrawerProps) {
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

  const allTags = Array.from(new Set(products.flatMap((p) => p.tags)))
  const priceRange =
    products.length > 0
      ? {
          min: Math.min(...products.map((p) => p.price)),
          max: Math.max(...products.map((p) => p.price)),
        }
      : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Compare Products ({products.length}/3)</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products to compare</p>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              {priceRange && (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price Range:</span>
                        <div className="font-semibold">
                          {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Categories:</span>
                        <div className="font-semibold">
                          {Array.from(new Set(products.map((p) => p.category))).join(", ")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Products Comparison */}
              <div className="space-y-4">
                {products.map((product) => (
                  <Card key={product.id} className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveProduct(product.id)}
                      className="absolute top-2 right-2 z-10"
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.title}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-sm line-clamp-2">{product.title}</h4>

                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-primary">{formatPrice(product.price)}</div>
                            <div className="flex items-center space-x-1">
                              {renderStars(product.rating)}
                              <span className="text-xs text-muted-foreground ml-1">({product.rating})</span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">by {product.vendor}</div>

                          <div className="flex flex-wrap gap-1">
                            {product.tags.slice(0, 4).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Common Tags */}
              {allTags.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">All Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {allTags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Button className="flex-1">Add All to Cart</Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
