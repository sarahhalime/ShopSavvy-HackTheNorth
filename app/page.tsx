import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Zap, Brain, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ShopSavvy</span>
            <Badge variant="secondary">Solana Edition</Badge>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
              Search
            </Link>
            <Link href="/history" className="text-muted-foreground hover:text-foreground transition-colors">
              History
            </Link>
            <Link href="/insights" className="text-muted-foreground hover:text-foreground transition-colors">
              Insights
            </Link>
            <Button size="sm">Sign In</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            AI-Powered Shopping with <span className="text-primary">Solana Pay</span>
          </h1>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Search products naturally, pay instantly with crypto, and get AI insights to make smarter purchasing
            decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild>
              <Link href="/search">Start Shopping</Link>
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>

          {/* Demo GIF Placeholder */}
          <div className="bg-muted rounded-lg p-8 mb-16">
            <div className="aspect-video bg-background rounded border-2 border-dashed border-border flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Demo GIF Placeholder</p>
                <p className="text-sm text-muted-foreground mt-2">"waterproof laptop backpack under $80"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Natural Language Search</CardTitle>
              <CardDescription>
                Search for products using everyday language. Our AI understands context and intent.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded text-sm font-mono">"waterproof laptop backpack under $80"</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Instant Solana Payments</CardTitle>
              <CardDescription>
                Pay with SOL or USDC instantly. No credit cards, no lengthy checkout forms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">SOL</Badge>
                <Badge variant="outline">USDC</Badge>
                <Badge variant="outline">Devnet Ready</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Smart Insights</CardTitle>
              <CardDescription>Get AI-powered spending insights and personalized financial coaching.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li>• Monthly spending analysis</li>
                <li>• Budget recommendations</li>
                <li>• Savings opportunities</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Trust Section */}
        <div className="text-center mt-16 p-8 bg-muted/50 rounded-lg">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-4">Built for Security & Privacy</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your data stays secure with Auth0 authentication, minimal PII storage, and blockchain-verified transactions
            on Solana devnet.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">ShopSavvy</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground transition-colors">
                Admin
              </Link>
              <span>Powered by Solana & AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
