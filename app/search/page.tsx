"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SearchBar } from "@/components/search-bar"
import { ProductCard } from "@/components/product-card"
import { CompareDrawer } from "@/components/compare-drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Filter } from "lucide-react"
import { mockProducts } from "@/lib/mock-data"
import { isMockMode } from "@/lib/env"

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

interface SearchFilters {
  keywords: string[]
  priceMin?: number
  priceMax?: number
  mustHaveTags: string[]
  excludeTags: string[]
  materials: string[]
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters | null>(null)
  const [sortBy, setSortBy] = useState<"relevance" | "price-low" | "price-high" | "rating">("relevance")
  const [compareItems, setCompareItems] = useState<Product[]>([])
  const [showCompare, setShowCompare] = useState(false)

  const searchExamples = [
    "waterproof laptop backpack under $80",
    "wireless noise-canceling headphones",
    "ergonomic office chair with lumbar support",
    "smart water bottle with temperature display",
  ]

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setQuery(searchQuery)

    try {
      if (isMockMode.ai || isMockMode.shopify) {
        // Mock search - filter mock products based on query
        const filtered = mockProducts.filter(
          (product) =>
            product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.tags.some((tag) => searchQuery.toLowerCase().includes(tag.toLowerCase())),
        )
        setProducts(filtered.length > 0 ? filtered : mockProducts)
        setFilters({
          keywords: searchQuery.split(" "),
          mustHaveTags: [],
          excludeTags: [],
          materials: [],
        })
      } else {
        // Real AI search
        const aiResponse = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        })
        const searchFilters = await aiResponse.json()
        setFilters(searchFilters)

        // Search Shopify with AI filters
        const shopifyResponse = await fetch("/api/shopify/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(searchFilters),
        })
        const shopifyProducts = await shopifyResponse.json()

        // Rank products with AI
        const rankResponse = await fetch("/api/ai/rank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: searchFilters,
            products: shopifyProducts,
          }),
        })
        const rankedIds = await rankResponse.json()

        // Sort products by AI ranking
        const sortedProducts = rankedIds
          .map((id: string) => shopifyProducts.find((p: Product) => p.id === id))
          .filter(Boolean)

        setProducts(sortedProducts)
      }
    } catch (error) {
      console.error("Search error:", error)
      // Fallback to mock data
      setProducts(mockProducts)
    } finally {
      setLoading(false)
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "rating":
        return b.rating - a.rating
      default:
        return 0 // Keep AI ranking order
    }
  })

  const addToCompare = (product: Product) => {
    if (compareItems.length < 3 && !compareItems.find((item) => item.id === product.id)) {
      setCompareItems([...compareItems, product])
    }
  }

  const removeFromCompare = (productId: string) => {
    setCompareItems(compareItems.filter((item) => item.id !== productId))
  }

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery)
    }
  }, [initialQuery])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">ShopSavvy</h1>
              <Badge variant="secondary">Search</Badge>
            </div>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </div>

          <SearchBar onSearch={handleSearch} initialValue={query} examples={searchExamples} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search Results Header */}
        {(products.length > 0 || loading) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-lg font-semibold">
                {loading ? "Searching..." : `${products.length} results`}
                {query && <span className="text-muted-foreground"> for "{query}"</span>}
              </h2>
              {filters && !loading && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.keywords.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {filters.priceMax && (
                    <Badge variant="outline" className="text-xs">
                      Under ${(filters.priceMax / 100).toFixed(0)}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="relevance">Best Match</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        )}

        {/* Mock Mode Banner */}
        {(isMockMode.ai || isMockMode.shopify) && products.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Demo Mode</span>
                <span className="text-sm text-muted-foreground">
                  Showing mock products. Configure Shopify and AI integrations for real search.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCompare={() => addToCompare(product)}
                isInCompare={compareItems.some((item) => item.id === product.id)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && query && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or browse our popular categories.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {searchExamples.map((example, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => handleSearch(example)}>
                  {example}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* No Query State */}
        {!loading && products.length === 0 && !query && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Start your search</h3>
            <p className="text-muted-foreground mb-6">Try one of these popular searches to get started:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {searchExamples.map((example, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start h-auto p-4 bg-transparent"
                  onClick={() => handleSearch(example)}
                >
                  <div className="text-left">
                    <div className="font-medium">{example}</div>
                    <div className="text-xs text-muted-foreground mt-1">Example search query</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Compare Button */}
        {compareItems.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button onClick={() => setShowCompare(true)} className="shadow-lg">
              Compare ({compareItems.length})
            </Button>
          </div>
        )}
      </main>

      {/* Compare Drawer */}
      <CompareDrawer
        products={compareItems}
        open={showCompare}
        onOpenChange={setShowCompare}
        onRemoveProduct={removeFromCompare}
      />
    </div>
  )
}
