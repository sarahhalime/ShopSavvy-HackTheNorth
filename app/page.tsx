"use client"

import { useState, useEffect } from "react"
import { Search, Zap, ShoppingBag, Eye, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Product {
  name: string
  price: string
  image: string | null
  store: string
}

interface SearchResponse {
  query: string
  products: Product[]
  found: number
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([])
  const [displayCount, setDisplayCount] = useState(3)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setHasSearched(true)
    
    try {
      const response = await fetch(`http://localhost:3002/api/clean/${encodeURIComponent(searchQuery)}`)
      const data: SearchResponse = await response.json()
      
      setSearchResults(data)
      setDisplayedProducts(data.products.slice(0, 3))
      setDisplayCount(3)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreProducts = () => {
    if (!searchResults) return
    
    const newCount = Math.min(displayCount + 3, searchResults.products.length)
    setDisplayedProducts(searchResults.products.slice(0, newCount))
    setDisplayCount(newCount)
  }

  // Auto-load more on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 100
      ) {
        if (searchResults && displayCount < searchResults.products.length) {
          loadMoreProducts()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [searchResults, displayCount])

  const ProductCard = ({ product, index }: { product: Product; index: number }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const placeholder = target.nextElementSibling as HTMLElement
                if (placeholder) placeholder.style.display = 'flex'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border">
            #{index + 1}
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-green-600 text-lg">{product.price}</span>
            <Badge variant="outline" className="text-xs">
              {product.store}
            </Badge>
          </div>
          <Button
            size="sm"
            className="w-full group-hover:bg-primary/90"
            aria-label="Buy Now"
            title="Buy Now"
          >
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Compact when showing results */}
      <header className={`p-6 transition-all duration-300 ${hasSearched ? 'pb-4' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ShopSavvy</span>
          </div>
          <nav className="flex items-center space-x-6">
            <a href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
              Search
            </a>
            <a href="/history" className="text-muted-foreground hover:text-foreground transition-colors">
              History
            </a>
            <Button size="sm">Sign In</Button>
          </nav>
        </div>
      </header>

      {/* Search Bar - Always visible */}
      <div className={`px-6 transition-all duration-300 ${hasSearched ? 'mb-8' : ''}`}>
        <div className={`max-w-2xl mx-auto ${!hasSearched ? 'mt-20' : ''}`}>
          {/* Logo - Only show when no search has been made */}
          {!hasSearched && (
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold mb-2">ShopSavvy</h1>
              <p className="text-muted-foreground">AI-powered product search</p>
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for products... (e.g., black sunglasses, hat, white socks, etc.)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg rounded-full border-2 focus:border-primary transition-colors"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button 
                type="submit" 
                size="lg" 
                className="px-8 py-3 rounded-full"
                disabled={isLoading || !searchQuery.trim()}
              >
                {isLoading ? "Searching..." : "Search Products"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="lg" 
                className="px-8 py-3 rounded-full"
                onClick={() => {
                  setSearchQuery("")
                  setSearchResults(null)
                  setDisplayedProducts([])
                  setHasSearched(false)
                }}
              >
                Clear
              </Button>
            </div>
          </form>

          {/* Example Searches - Only show when no search has been made */}
          {!hasSearched && (
            <div className="mt-20">
              <p className="text-sm text-muted-foreground mb-4 text-center">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "red shoes",
                  "waterproof backpack",
                  "black jacket",
                  "running sneakers",
                  "blue jeans"
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setSearchQuery(example)}
                    className="px-3 py-1 text-sm bg-muted rounded-full hover:bg-muted/80 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <main className="px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            {/* Results Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                Search Results for "{searchResults.query}"
              </h2>
              <p className="text-muted-foreground">
                Found {searchResults.found} products • Showing {displayedProducts.length}
              </p>
            </div>

            {/* Products Grid */}
            {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedProducts.map((product, index) => (
                  <ProductCard key={`${product.name}-${index}`} product={product} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try searching with different keywords</p>
              </div>
            )}

            {/* Load More Button */}
            {searchResults && displayCount < searchResults.products.length && (
              <div className="text-center mt-12">
                <Button onClick={loadMoreProducts} size="lg" variant="outline">
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  Load More Products ({searchResults.products.length - displayCount} remaining)
                </Button>
              </div>
            )}

            {/* Loading indicator for auto-scroll */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-muted-foreground">Loading more products...</span>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Stats Footer - Only show when no search has been made */}
      {!hasSearched && (
        <footer className="fixed bottom-4 left-0 right-0 p-6 text-center border-t bg-background">
          
        </footer>
      )}
    </div>
  )
}