"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import {
  ArrowLeft,
  History,
  Brain,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  ExternalLink,
  Zap,
  Upload,
} from "lucide-react"
import { mockOrders } from "@/lib/mock-data"
import { AIInsightsWidget } from "@/components/ai-insights-widget"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("history")

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

  const totalSpent = mockOrders.reduce((sum, order) => sum + order.totalCents, 0)
  const totalOrders = mockOrders.length

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b">
            <div className="flex items-center space-x-2 px-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">ShopSavvy</h2>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === "history"} onClick={() => setActiveTab("history")}>
                  <History className="w-4 h-4" />
                  Purchase History
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === "insights"} onClick={() => setActiveTab("insights")}>
                  <Brain className="w-4 h-4" />
                  AI Insights
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/receipt-upload">
                    <Upload className="w-4 h-4" />
                    Receipt Upload
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {activeTab === "history" && "Purchase History"}
                {activeTab === "insights" && "AI Insights"}
                {activeTab === "analytics" && "Analytics"}
              </h1>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4">
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

            {activeTab === "insights" && (
              <div className="space-y-6">
                <AIInsightsWidget />
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
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
