"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, TrendingUp, AlertCircle, Lightbulb, RefreshCw } from "lucide-react"
import { mockOrders, mockProducts } from "@/lib/mock-data"
import { getAIResponse } from "@/lib/gemini-api"

interface AIInsights {
  bullets: string[]
  budgetRule: string
  savingsTip: string
  categoryBreakdown: Record<string, number>
  monthlyTrend: "increasing" | "decreasing" | "stable"
  riskScore: number
}

export function AIInsightsWidget() {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatReply, setChatReply] = useState<string | null>(null)

  const fetchInsights = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: mockOrders.map((order) => ({
            id: order.id,
            items: order.items.map((item) => {
              const product = mockProducts.find((p) => p.id === item.productId)
              const category = product?.category || "General"
              return {
                title: item.title,
                priceCents: item.price,
                category,
                qty: item.quantity ?? (item as any).qty ?? 1,
              }
            }),
            totalCents: (order as any).totalAmount ?? (order as any).totalCents ?? 0,
            createdAt:
              typeof (order as any).createdAt === "string"
                ? (order as any).createdAt
                : (order as any).createdAt?.toISOString?.() ?? "",
          })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  const askGemini = async () => {
    if (!chatInput.trim()) return
    setChatLoading(true)
    setChatReply(null)
    try {
      const res = await getAIResponse({ content: chatInput, mood: "curious" })
      const reply = typeof res === "string" ? res : (res as any).response
      setChatReply(reply)
    } catch (e: any) {
      setChatReply("Sorry, I couldn't reach the AI service. Please try again.")
    } finally {
      setChatLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case "decreasing":
        return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />
      default:
        return <TrendingUp className="w-4 h-4 text-blue-500" />
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Button onClick={fetchInsights} disabled={isLoading}>
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              {isLoading ? "Generating Insights..." : "Generate AI Insights"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Personalized recommendations based on your spending patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Insights */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Key Findings
            </h4>
            <div className="space-y-2">
              {insights.bullets.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Spending Trend */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {getTrendIcon(insights.monthlyTrend)}
              <span className="text-sm font-medium">Spending Trend</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {insights.monthlyTrend}
            </Badge>
          </div>

          {/* Financial Health Score */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${insights.riskScore >= 80 ? "bg-green-500" : insights.riskScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
              />
              <span className="text-sm font-medium">Financial Health</span>
            </div>
            <span className={`text-sm font-bold ${getRiskColor(insights.riskScore)}`}>{insights.riskScore}/100</span>
          </div>
        </CardContent>
      </Card>

      {/* Budget Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Lightbulb className="w-5 h-5" />
            Budget Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{insights.budgetRule}</p>
        </CardContent>
      </Card>

      {/* Savings Tip */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <TrendingUp className="w-5 h-5" />
            Savings Opportunity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{insights.savingsTip}</p>
        </CardContent>
      </Card>

      {/* Gemini Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Ask the AI Coach
          </CardTitle>
          <CardDescription>Get quick, supportive financial guidance powered by Gemini</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-md px-3 py-2 text-sm"
              placeholder="e.g., How do I budget on an irregular income?"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") askGemini()
              }}
            />
            <Button onClick={askGemini} disabled={chatLoading}>
              {chatLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              Ask
            </Button>
          </div>
          {chatReply && (
            <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">{chatReply}</div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {Object.keys(insights.categoryBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(insights.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm">{category}</span>
                    <span className="text-sm font-medium">{formatPrice(amount)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={fetchInsights} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Insights
        </Button>
      </div>
    </div>
  )
}
