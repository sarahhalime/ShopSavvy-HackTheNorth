"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Settings,
  Flag,
  Users,
  ShoppingBag,
  BarChart3,
  Database,
  Save,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { mockOrders } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

interface FeatureFlag {
  key: string
  enabled: boolean
  description: string
  category: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    {
      key: "ethL2Receipts",
      enabled: false,
      description: "Enable Ethereum L2 NFT receipts for purchases",
      category: "Blockchain",
    },
    {
      key: "splCashback",
      enabled: true,
      description: "Enable SPL token cashback rewards program",
      category: "Rewards",
    },
    {
      key: "aiInsights",
      enabled: true,
      description: "Enable AI-powered spending insights and recommendations",
      category: "AI",
    },
    {
      key: "advancedSearch",
      enabled: true,
      description: "Enable advanced search filters and sorting options",
      category: "Search",
    },
  ])

  const { toast } = useToast()

  const toggleFeatureFlag = (key: string) => {
    setFeatureFlags((prev) => prev.map((flag) => (flag.key === key ? { ...flag, enabled: !flag.enabled } : flag)))
    toast({
      title: "Feature Flag Updated",
      description: `${key} has been ${featureFlags.find((f) => f.key === key)?.enabled ? "disabled" : "enabled"}`,
    })
  }

  const saveFeatureFlags = async () => {
    // Mock API call
    toast({
      title: "Settings Saved",
      description: "All feature flags have been updated successfully.",
    })
  }

  const totalOrders = mockOrders.length
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.totalCents, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b">
            <div className="flex items-center space-x-2 px-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">ShopSavvy</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === "features"} onClick={() => setActiveTab("features")}>
                  <Flag className="w-4 h-4" />
                  Feature Flags
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
                  <ShoppingBag className="w-4 h-4" />
                  Orders
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === "users"} onClick={() => setActiveTab("users")}>
                  <Users className="w-4 h-4" />
                  Users
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === "system"} onClick={() => setActiveTab("system")}>
                  <Database className="w-4 h-4" />
                  System
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
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "features" && "Feature Flags"}
                {activeTab === "orders" && "Order Management"}
                {activeTab === "users" && "User Management"}
                {activeTab === "system" && "System Settings"}
              </h1>
              <Badge variant="destructive" className="text-xs">
                Admin
              </Badge>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalOrders}</div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatPrice(avgOrderValue)}</div>
                      <p className="text-xs text-muted-foreground">Per transaction</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1,234</div>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                  </Card>
                </div>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Current status of all services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm font-medium">Solana Pay</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Operational
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm font-medium">AI Services</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Operational
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm font-medium">Database</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Operational
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          <span className="text-sm font-medium">Shopify API</span>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Degraded
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "features" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Feature Flags</h2>
                    <p className="text-muted-foreground">Control feature rollouts and experiments</p>
                  </div>
                  <Button onClick={saveFeatureFlags}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>

                <div className="grid gap-4">
                  {featureFlags.map((flag) => (
                    <Card key={flag.key}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{flag.key}</h3>
                              <Badge variant="outline" className="text-xs">
                                {flag.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{flag.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={flag.key} className="text-sm">
                              {flag.enabled ? "Enabled" : "Disabled"}
                            </Label>
                            <Switch
                              id={flag.key}
                              checked={flag.enabled}
                              onCheckedChange={() => toggleFeatureFlag(flag.key)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Add New Feature Flag</CardTitle>
                    <CardDescription>Create a new feature flag for testing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="flagKey">Flag Key</Label>
                        <Input id="flagKey" placeholder="newFeature" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="flagCategory">Category</Label>
                        <Input id="flagCategory" placeholder="Feature" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flagDescription">Description</Label>
                      <Textarea id="flagDescription" placeholder="Describe what this feature flag controls..." />
                    </div>
                    <Button>
                      <Flag className="w-4 h-4 mr-2" />
                      Create Flag
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Order Management</h2>
                    <p className="text-muted-foreground">View and manage all orders</p>
                  </div>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest transactions and their status</CardDescription>
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
                            <div className="text-xs text-muted-foreground">Solana: {order.solanaSig}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatPrice(order.totalCents)}</div>
                            <div className="text-xs text-muted-foreground">{order.createdAt.toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">User Management</h2>
                  <p className="text-muted-foreground">Manage user accounts and permissions</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>User Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">1,234</div>
                        <div className="text-sm text-muted-foreground">Total Users</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">89</div>
                        <div className="text-sm text-muted-foreground">Active Today</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">456</div>
                        <div className="text-sm text-muted-foreground">This Month</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                    <CardDescription>Latest user registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>User management features coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">System Settings</h2>
                  <p className="text-muted-foreground">Configure system-wide settings</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Environment Configuration
                    </CardTitle>
                    <CardDescription>Current environment and API settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Environment</Label>
                        <div className="mt-1">
                          <Badge variant="secondary">Development</Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Solana Network</Label>
                        <div className="mt-1">
                          <Badge variant="outline">Devnet</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">API Endpoints</Label>
                      <div className="space-y-1 text-xs font-mono bg-muted p-3 rounded">
                        <div>Solana RPC: https://api.devnet.solana.com</div>
                        <div>AI Service: Mock Mode</div>
                        <div>Shopify API: Mock Mode</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Database Status</CardTitle>
                    <CardDescription>MongoDB connection and health</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium">MongoDB Connection</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Connected
                      </Badge>
                    </div>
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
