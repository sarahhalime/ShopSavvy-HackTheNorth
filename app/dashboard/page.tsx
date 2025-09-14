"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, History, Brain, TrendingUp, DollarSign, ShoppingBag, Calendar, ExternalLink, Zap, Upload, Camera, FileText, User } from "lucide-react"
import { mockOrders, Order } from "../../lib/mock-data"
import { AIInsightsWidget } from "@/components/ai-insights-widget"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { DashboardTopbar } from "@/components/dashboard-topbar"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const normalized = (tab: string | null) => (tab === "receipts" ? "profile" : tab)
  const initialTab = (normalized(searchParams.get("tab")) as string) || "history"
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  // Keep state in sync if query changes (e.g., via navigation)
  useEffect(() => {
    const q = (normalized(searchParams.get("tab")) as string) || "history"
    setActiveTab(q)
  }, [searchParams])

  const setTab = (tab: string) => {
    setActiveTab(tab)
    router.replace(`/dashboard?tab=${tab}`)
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const totalSpent = mockOrders.reduce((sum: number, order: Order) => sum + order.totalCents, 0)
  const totalOrders = mockOrders.length

  return (
    <div className="min-h-screen w-full">
      <DashboardTopbar active={(activeTab as any)} onTabChange={(t) => setTab(t)} />

      <main className="p-4">
            {activeTab === "history" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatPrice(totalSpent)}</div>
                      <p className="text-xs text-muted-foreground">All time purchases</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalOrders}</div>
                      <p className="text-xs text-muted-foreground">Completed purchases</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatPrice(totalOrders > 0 ? totalSpent / totalOrders : 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Per transaction</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Orders List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Your purchase history with Solana Pay</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">Order #{order.id}</h4>
                              <Badge variant={order.status === "confirmed" ? "default" : "secondary"}>
                                {order.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.items.map((item, idx) => (
                                <span key={idx}>
                                  {item.title} (x{item.qty}){idx < order.items.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(order.createdAt)}
                              </span>
                              <span className="flex items-center">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                {order.solanaSig}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatPrice(order.totalCents)}</div>
                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spending Analytics</CardTitle>
                    <CardDescription>Detailed analysis of your purchasing behavior</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Monthly Trends</h4>
                        <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                          <p className="text-muted-foreground">Chart placeholder</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Payment Methods</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Solana (SOL)</span>
                            <span className="text-sm font-medium">60%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">USDC</span>
                            <span className="text-sm font-medium">40%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Health Score</CardTitle>
                    <CardDescription>Based on your spending patterns and habits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Health Score</span>
                          <span className="font-medium">85/100</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div className="bg-green-500 h-3 rounded-full w-[85%]" />
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Excellent
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      You're maintaining healthy spending habits with good budget control.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "insights" && (
              <div className="space-y-6">
                <AIInsightsWidget />
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  {/* Left: Profile summary */}
                  <div className="space-y-6">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Profile
                        </CardTitle>
                        <CardDescription>Your wallet and rewards overview</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col h-full">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground">Token Balance</div>
                            <div className="text-2xl font-bold">1,250</div>
                            <div className="text-xs text-muted-foreground">Points</div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Paid</div>
                            <div className="text-2xl font-bold">{formatPrice(totalSpent)}</div>
                            <div className="text-xs text-muted-foreground">All time</div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground">Orders</div>
                            <div className="text-2xl font-bold">{totalOrders}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="text-sm text-muted-foreground">Avg Order</div>
                            <div className="text-2xl font-bold">{formatPrice(totalOrders > 0 ? totalSpent / totalOrders : 0)}</div>
                            <div className="text-xs text-muted-foreground">Per purchase</div>
                          </div>
                        </div>
                        {/* Tip removed as requested */}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right: Receipt upload */}
                  <div className="space-y-6">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          Upload Receipt
                        </CardTitle>
                        <CardDescription>Upload a photo of your receipt to verify your Solana Pay transaction</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 flex flex-col h-full">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                          <div className="space-y-2">
                            <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                            <Button variant="outline">Select File</Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="sig">Solana Transaction Signature</Label>
                            <Input id="sig" placeholder="5KJp7wM8..." />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="total">Expected Total ($)</Label>
                            <Input id="total" type="number" step="0.01" placeholder="29.99" />
                          </div>
                        </div>
                        <div className="mt-6">
                          <Button className="w-full">Process Receipt</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Results placeholder */}
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Upload a receipt to see reconciliation results</p>
                  </CardContent>
                </Card>
              </div>
            )}
      </main>
    </div>
  )
}
