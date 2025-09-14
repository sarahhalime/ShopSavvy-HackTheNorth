"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain, RefreshCw } from "lucide-react"
import { getAIResponse } from "@/lib/gemini-api"

interface AIInsights {
  bullets: string[]
  budgetRule: string
  savingsTip: string
  categoryBreakdown: Record<string, number>
  monthlyTrend: "increasing" | "decreasing" | "stable"
  riskScore: number
  recommendations?: string[]
}

export function AIInsightsWidget() {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  type ChatMessage = { role: "user" | "assistant"; content: string }
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/ai/insights", { method: "POST" })
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      } else {
        const txt = await response.text()
        setError(txt || "Failed to load insights")
      }
    } catch (err) {
      console.error("Failed to fetch AI insights:", err)
      setError("Network error while loading insights")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Auto-scroll on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const askGemini = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userText = chatInput
    setChatInput("")
    setChatLoading(true)
    setMessages((prev) => [...prev, { role: "user", content: userText }])
    try {
      // Include a short rolling context (last 6 turns)
      const history = messages.slice(-6)
      const context = history
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n")
      const prompt = `${context}${context ? "\n" : ""}User: ${userText}\nAssistant:`
      const res = await getAIResponse({ content: prompt, mood: "coach" })
      const reply = typeof res === "string" ? res : (res as any)?.response || ""
      setMessages((prev) => [...prev, { role: "assistant", content: reply }])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't reach the AI service right now. Please try again in a moment.",
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const Recommendations = (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>Personalized recommendations</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={fetchInsights} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="py-6 text-sm text-red-600">{error}</div>
        ) : insights && Array.isArray((insights as any).recommendations) && (insights as any).recommendations.length > 0 ? (
          <div className="space-y-2">
            {(insights as any).recommendations.slice(0, 4).map((rec: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No insights yet. Click Refresh to generate recommendations.</div>
        )}
      </CardContent>
    </Card>
  )

  const Chat = (
    <Card>
      <CardHeader>
        <CardTitle>Ask the AI Coach</CardTitle>
        <CardDescription>Get quick answers about your spending</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-72 overflow-y-auto rounded-md border p-3 space-y-3 bg-background/40">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Ask anything about budgeting, spending habits, or saving tips.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                askGemini()
              }
            }}
          />
          <Button variant="outline" onClick={() => setMessages([])} disabled={messages.length === 0 || chatLoading}>
            Clear
          </Button>
          <Button onClick={askGemini} disabled={chatLoading || !chatInput.trim()}>
            {chatLoading ? "Thinking..." : "Ask"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {Recommendations}
      {Chat}
    </div>
  )
}
