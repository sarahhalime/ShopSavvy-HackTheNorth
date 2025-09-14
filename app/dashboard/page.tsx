"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, History, Brain, TrendingUp, DollarSign, ShoppingBag, Calendar, ExternalLink, Zap, Upload, Camera, FileText, User, Gift } from "lucide-react"
import { mockOrders, Order } from "../../lib/mock-data"
import { AIInsightsWidget } from "@/components/ai-insights-widget"
import { EthRewardsWidget } from "@/components/eth-rewards-widget"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { DashboardTopbar } from "@/components/dashboard-topbar"
import { BalanceChecker } from "@/components/BalanceChecker"
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts'

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

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return "—"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d)
  }

  // Support both legacy totalCents and new totalAmount (cents)
  const getTotalCents = (order: any) =>
    typeof order.totalCents === "number"
      ? order.totalCents
      : typeof order.totalAmount === "number"
      ? order.totalAmount
      : 0

  const totalSpent = (mockOrders as any[]).reduce((sum: number, order: any) => sum + getTotalCents(order), 0)
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
                      <div className="text-2xl font-bold">$4,287.50</div>
                      <p className="text-xs text-muted-foreground">All time purchases</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">24</div>
                      <p className="text-xs text-muted-foreground">Completed purchases</p>
                    </CardContent>
                  </Card>

                  <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-yellow-700">SOL Rewards</CardTitle>
                      <Zap className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-700">0.0847 SOL</div>
                      <p className="text-xs text-yellow-600">~$3.39 earned</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Orders List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase History</CardTitle>
                    <CardDescription>Your recent orders paid with Solana</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Recent Order */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Order #SOL-2024-0924</h4>
                            <Badge variant="default">
                              delivered
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            MacBook Air M3 15-inch, Space Gray
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Sep 20, 2024
                            </span>
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              29.85 SOL
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$1,199.00</div>
                          <Button variant="outline" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Order 2 */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Order #SOL-2024-0918</h4>
                            <Badge variant="default">
                              delivered
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Nike Air Jordan 1 Low - White/Black (Size 10.5)
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Sep 18, 2024
                            </span>
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              3.75 SOL
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$149.99</div>
                          <Button variant="outline" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Order 3 */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Order #SOL-2024-0915</h4>
                            <Badge variant="default">
                              delivered
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sony WH-1000XM5 Wireless Headphones - Black
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Sep 15, 2024
                            </span>
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              9.98 SOL
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$399.99</div>
                          <Button variant="outline" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Order 4 */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Order #SOL-2024-0912</h4>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              shipped
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Levi's 511 Slim Jeans - Dark Blue (32x30), Uniqlo Heattech Crew Neck T-Shirt x2
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Sep 12, 2024
                            </span>
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              2.25 SOL
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$89.97</div>
                          <Button variant="outline" size="sm" className="mt-2">
                            Track Package
                          </Button>
                        </div>
                      </div>

                      {/* Order 5 */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Order #SOL-2024-0908</h4>
                            <Badge variant="default">
                              delivered
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Philips Hue Color Smart Bulbs (4-pack), Smart Light Strip 2m
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Sep 8, 2024
                            </span>
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              4.12 SOL
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$164.98</div>
                          <Button variant="outline" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Order 6 */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Order #SOL-2024-0905</h4>
                            <Badge variant="default">
                              delivered
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Kindle Paperwhite 11th Gen (16GB), Amazon Kindle Case - Navy Blue
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Sep 5, 2024
                            </span>
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              3.87 SOL
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$154.98</div>
                          <Button variant="outline" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Order 7 */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Order #SOL-2024-0902</h4>
                            <Badge variant="default">
                              delivered
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Yeti Rambler 30oz Tumbler - Stainless Steel, Hydro Flask 32oz Wide Mouth
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Sep 2, 2024
                            </span>
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              1.87 SOL
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$74.95</div>
                          <Button variant="outline" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Order 8 */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Order #SOL-2024-0829</h4>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              processing
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            iPhone 15 Pro Max 256GB - Natural Titanium, Apple MagSafe Charger
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Aug 29, 2024
                            </span>
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              32.45 SOL
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">$1,299.00</div>
                          <Button variant="outline" size="sm" className="mt-2">
                            Check Status
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Load More Section */}
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing 8 of 24 orders
                        </div>
                        <Button variant="outline">
                          Load More Orders
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                {/* Personal Spending Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Total This Year</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatPrice(totalSpent)}
                          </p>
                          <p className="text-green-600 text-xs">2024 spending</p>
                        </div>
                        <div className="bg-green-500 p-2 rounded-full">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Avg per Purchase</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatPrice(totalOrders > 0 ? totalSpent / totalOrders : 0)}
                          </p>
                          <p className="text-green-600 text-xs">Per transaction</p>
                        </div>
                        <div className="bg-green-500 p-2 rounded-full">
                          <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-600 text-sm font-medium">This Month</p>
                          <p className="text-2xl font-bold text-purple-900">{formatPrice(Math.floor(totalSpent / 100) * 30)}</p>
                          <p className="text-purple-600 text-xs">+15% vs last month</p>
                        </div>
                        <div className="bg-purple-500 p-2 rounded-full">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-600 text-sm font-medium">Purchases</p>
                          <p className="text-2xl font-bold text-orange-900">{totalOrders}</p>
                          <p className="text-orange-600 text-xs">Total orders</p>
                        </div>
                        <div className="bg-orange-500 p-2 rounded-full">
                          <History className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Spending Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        My Spending Trend
                      </CardTitle>
                      <CardDescription>Your monthly spending over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { month: 'Apr', spent: 450, purchases: 3 },
                            { month: 'May', spent: 720, purchases: 5 },
                            { month: 'Jun', spent: 580, purchases: 4 },
                            { month: 'Jul', spent: 890, purchases: 6 },
                            { month: 'Aug', spent: 650, purchases: 4 },
                            { month: 'Sep', spent: Math.floor(totalSpent / 100), purchases: totalOrders }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" stroke="#666" fontSize={12} />
                            <YAxis 
                              stroke="#666" 
                              fontSize={12}
                              tickFormatter={(value) => `$${value}`}
                              domain={[0, 1000]}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value, name) => [
                                name === 'spent' ? `$${value}` : `${value} purchases`,
                                name === 'spent' ? 'Amount Spent' : 'Number of Purchases'
                              ]}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="spent" 
                              stroke="#3b82f6" 
                              strokeWidth={3}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, fill: '#1d4ed8' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* My Payment Preferences */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        My Payment Methods
                      </CardTitle>
                      <CardDescription>How you prefer to pay for purchases</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Solana (SOL)', value: 70, color: '#8b5cf6' },
                                { name: 'USDC Stablecoin', value: 25, color: '#06b6d4' },
                                { name: 'Other Tokens', value: 5, color: '#10b981' }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={120}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {[
                                { name: 'Solana (SOL)', value: 70, color: '#8b5cf6' },
                                { name: 'USDC Stablecoin', value: 25, color: '#06b6d4' },
                                { name: 'Other Tokens', value: 5, color: '#10b981' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value) => [`${value}%`, 'of payments']}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36}
                              formatter={(value, entry) => (
                                <span style={{ color: entry.color, fontWeight: 500 }}>
                                  {value}
                                </span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Personal Insights & Shopping Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* What I Buy Most */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-purple-500" />
                        What I Buy Most
                      </CardTitle>
                      <CardDescription>Your favorite shopping categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { category: 'Electronics', amount: 1200, color: '#8b5cf6' },
                            { category: 'Fashion', amount: 800, color: '#3b82f6' },
                            { category: 'Home', amount: 600, color: '#10b981' },
                            { category: 'Other', amount: 300, color: '#f59e0b' }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="category" stroke="#666" fontSize={12} />
                            <YAxis 
                              stroke="#666" 
                              fontSize={12}
                              tickFormatter={(value) => `$${value}`}
                              domain={[0, 1500]}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value) => [`$${value}`, 'Spent']}
                            />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                              {[
                                { category: 'Electronics', amount: 1200, color: '#8b5cf6' },
                                { category: 'Fashion', amount: 800, color: '#3b82f6' },
                                { category: 'Home', amount: 600, color: '#10b981' },
                                { category: 'Other', amount: 300, color: '#f59e0b' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* My Spending Habits */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-indigo-500" />
                        My Spending Habits
                      </CardTitle>
                      <CardDescription>Personal insights about your shopping behavior</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            <span className="text-sm font-medium">Tech & Electronics</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '40%'}}></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12">40%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                            <span className="text-sm font-medium">Fashion & Accessories</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{width: '30%'}}></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12">30%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                            <span className="text-sm font-medium">Home & Lifestyle</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '20%'}}></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12">20%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                            <span className="text-sm font-medium">Others</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" style={{width: '10%'}}></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12">10%</span>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                          <div className="flex items-start gap-3">
                            <Brain className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-indigo-900">Personal Insight</h4>
                              <p className="text-sm text-indigo-700 mt-1">
                                You're a tech enthusiast! 40% of your spending goes to electronics. 
                                Consider setting alerts for tech deals to save money on future purchases.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Personal Finance Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      My Spending Health
                    </CardTitle>
                    <CardDescription>How well you're managing your spending habits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Health Score */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">Spending Health Score</h4>
                        <p className="text-sm text-gray-600">Based on your spending patterns and habits</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-emerald-600">82</div>
                        <div className="text-sm text-gray-500">Good</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-3 rounded-full transition-all duration-500" 
                          style={{width: '82%'}}></div>
                    </div>

                    {/* Personal Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <div className="text-sm text-blue-600 font-medium">Budget Control</div>
                        <div className="text-2xl font-bold text-blue-900">85%</div>
                        <div className="text-xs text-blue-600">Great discipline</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <div className="text-sm text-purple-600 font-medium">Spending Consistency</div>
                        <div className="text-2xl font-bold text-purple-900">78%</div>
                        <div className="text-xs text-purple-600">Pretty steady</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <div className="text-sm text-green-600 font-medium">Deal Finder</div>
                        <div className="text-2xl font-bold text-green-900">92%</div>
                        <div className="text-xs text-green-600">Smart shopper!</div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg text-center">
                        <div className="text-sm text-orange-600 font-medium">Impulse Control</div>
                        <div className="text-2xl font-bold text-orange-900">71%</div>
                        <div className="text-xs text-orange-600">Room to improve</div>
                      </div>
                    </div>

                    {/* Tips Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-green-900">You're doing great!</h4>
                            <p className="text-sm text-green-700 mt-1">
                              Your spending is consistent and you find good deals.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-orange-900">Tip for improvement</h4>
                            <p className="text-sm text-orange-700 mt-1">
                              Try waiting 24 hours before big purchases to avoid impulse buying.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-slate-500" />
                      Recent Transactions
                    </CardTitle>
                    <CardDescription>Your latest purchases and blockchain transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockOrders.slice(0, 8).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {order.items[0]?.title || `Order #${order.id}`}
                                {order.items.length > 1 && ` +${order.items.length - 1} more`}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span>{formatDate(order.createdAt)}</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs px-2 py-0">
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{formatPrice(getTotalCents(order))}</div>
                            <div className="text-xs text-gray-500">
                              {order.paymentMethod === 'solana' ? 'SOL' : 'USDC'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Showing {Math.min(8, mockOrders.length)} of {mockOrders.length} transactions
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View All on Blockchain Explorer
                        </Button>
                      </div>
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

            {activeTab === "rewards" && (
              <div className="space-y-6">
                <EthRewardsWidget />
              </div>
            )}

           {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Wallet Overview */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Wallet Overview
                    </CardTitle>
                    <CardDescription>Your Solana wallet and transaction summary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                        <div className="text-sm text-purple-700 font-medium">SOL Balance</div>
                        <div className="text-2xl font-bold text-purple-900">2.45</div>
                        <div className="text-xs text-purple-600">≈ $98.00</div>
                      </div>
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                        <div className="text-sm text-green-700 font-medium">Reward Points</div>
                        <div className="text-2xl font-bold text-green-900">1,250</div>
                        <div className="text-xs text-green-600">Earned</div>
                      </div>
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                        <div className="text-sm text-blue-700 font-medium">Total Spent</div>
                        <div className="text-2xl font-bold text-blue-900">{formatPrice(totalSpent)}</div>
                        <div className="text-xs text-blue-600">All time</div>
                      </div>
                      <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                        <div className="text-sm text-orange-700 font-medium">Transactions</div>
                        <div className="text-2xl font-bold text-orange-900">{totalOrders}</div>
                        <div className="text-xs text-orange-600">Completed</div>
                      </div>
                    </div>
                    
                    {/* Wallet Address */}
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Wallet Address</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            6UCG17H1umjFhjponngVVehXMBmcpkvPm1SQNk2u829n
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.open('https://explorer.solana.com/address/6UCG17H1umjFhjponngVVehXMBmcpkvPm1SQNk2u829n?cluster=devnet', '_blank')}>
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View on Explorer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Get Test SOL
                    </Button>
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Transactions
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setTab('rewards')}>
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem Rewards
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Blockchain Integration Tools */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Token Creator */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Create Custom Token
                    </CardTitle>
                    <CardDescription>
                      Create your own SPL token on Solana Devnet for testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tokenName">Token Name</Label>
                        <Input id="tokenName" placeholder="My Custom Token" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tokenSymbol">Symbol</Label>
                        <Input id="tokenSymbol" placeholder="MCT" maxLength={5} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="decimals">Decimals</Label>
                        <Input id="decimals" type="number" min="0" max="9" defaultValue="9" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supply">Initial Supply</Label>
                        <Input id="supply" type="number" min="1" defaultValue="1000000" />
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-sm text-amber-800">
                        <strong>Note:</strong> This will create a token on Solana Devnet for testing purposes only.
                      </div>
                    </div>

                    <Button className="w-full" disabled>
                      <Zap className="w-4 h-4 mr-2" />
                      Create Token
                    </Button>
                    
                    <div className="text-xs text-muted-foreground">
                      Cost: ~0.01 SOL for token creation
                    </div>
                  </CardContent>
                </Card>

                {/* Balance Checker */}
                <BalanceChecker />
              </div>

              {/* Receipt Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Receipt Verification
                  </CardTitle>
                  <CardDescription>
                    Upload receipts to verify your Solana Pay transactions and earn rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Area */}
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                        <div className="space-y-3">
                          <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Upload Receipt Image</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                          </div>
                          <Button variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Select File
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="txSignature">Transaction Signature</Label>
                          <Input 
                            id="txSignature" 
                            placeholder="5KJp7wM8..." 
                            className="font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expectedTotal">Expected Total ($)</Label>
                          <Input 
                            id="expectedTotal" 
                            type="number" 
                            step="0.01" 
                            placeholder="29.99" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Processing Status */}
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Processing Status</div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                          </div>
                          <span className="text-sm text-muted-foreground">Upload receipt image</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                          </div>
                          <span className="text-sm text-muted-foreground">Verify transaction signature</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                          </div>
                          <span className="text-sm text-muted-foreground">Process OCR and validate amounts</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                          </div>
                          <span className="text-sm text-muted-foreground">Award loyalty points</span>
                        </div>
                      </div>

                      <Button className="w-full" disabled>
                        <FileText className="w-4 h-4 mr-2" />
                        Process Receipt
                      </Button>

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-800">
                          <strong>Tip:</strong> Make sure your receipt is clear and the total amount matches your transaction.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Recent Blockchain Activity
                  </CardTitle>
                  <CardDescription>Your latest Solana transactions and token interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <ArrowLeft className="w-4 h-4 text-green-600 rotate-180" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Payment Received</div>
                          <div className="text-xs text-muted-foreground">2 hours ago</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">+0.05 SOL</div>
                        <div className="text-xs text-muted-foreground">≈ $2.00</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Zap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Token Created</div>
                          <div className="text-xs text-muted-foreground">1 day ago</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">MCT</div>
                        <div className="text-xs text-muted-foreground">1M supply</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <ArrowLeft className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Purchase</div>
                          <div className="text-xs text-muted-foreground">3 days ago</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">-0.15 SOL</div>
                        <div className="text-xs text-muted-foreground">≈ $6.00</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View All Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
      </main>
    </div>
  )
}
