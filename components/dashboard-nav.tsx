"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { History, Brain, TrendingUp, ArrowLeft, Zap } from "lucide-react"

const navItems = [
  {
    title: "Purchase History",
    href: "/dashboard?tab=history",
    icon: History,
  },
  {
    title: "AI Insights",
    href: "/dashboard?tab=insights",
    icon: Brain,
  },
  {
    title: "Analytics",
    href: "/dashboard?tab=analytics",
    icon: TrendingUp,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">ShopSavvy</h2>
            <Badge variant="secondary" className="text-xs">
              Dashboard
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.href}
                variant={pathname === item.href ? "default" : "ghost"}
                className={cn("w-full justify-start", pathname === item.href && "bg-primary text-primary-foreground")}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="w-4 h-4 mr-2" />
                  {item.title}
                </Link>
              </Button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
