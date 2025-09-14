"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, History, TrendingUp, Zap, Search as SearchIcon, User, Gift } from "lucide-react"

type Tab = "search" | "history" | "insights" | "analytics" | "profile" | "rewards" | "auth"

interface DashboardTopbarProps {
  active: Tab
  onTabChange?: (tab: Exclude<Tab, "search" | "auth">) => void
  title?: string
  showAuth?: boolean
  hideSearch?: boolean
  hideTitle?: boolean
}

export function DashboardTopbar({ active, onTabChange, title, showAuth = true, hideSearch = false, hideTitle = false }: DashboardTopbarProps) {
  const go = (tab: Tab) => {
    if (onTabChange && tab !== "search" && tab !== "auth") onTabChange(tab)
  }

  const derivedTitle =
    title ?? (active === "search"
      ? "Search"
      : active === "history"
      ? "Purchase History"
      : active === "insights"
      ? "AI Insights"
      : active === "analytics"
      ? "Analytics"
      : active === "rewards"
      ? "ETH Rewards"
      : active === "profile"
      ? "Profile"
      : "Sign in/Sign up")

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur px-4">
      <div className="h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!hideTitle && <h1 className="text-lg font-semibold">{derivedTitle}</h1>}
        </div>
        <div className="flex items-center gap-2">
          {/* Search goes to landing page (optional hide on landing) */}
          {!hideSearch && (
            <Button asChild variant={active === "search" ? "default" : "ghost"}>
              <Link href="/">
                <SearchIcon className="w-4 h-4 mr-2" /> Search
              </Link>
            </Button>
          )}
          {/* Tabs - if onTabChange provided, use it; else deep-link to dashboard */}
          {onTabChange ? (
            <>
              <Button variant={active === "history" ? "default" : "ghost"} onClick={() => go("history")}>
                <History className="w-4 h-4 mr-2" /> History
              </Button>
              <Button variant={active === "insights" ? "default" : "ghost"} onClick={() => go("insights")}>
                <Brain className="w-4 h-4 mr-2" /> AI Insights
              </Button>
              <Button variant={active === "analytics" ? "default" : "ghost"} onClick={() => go("analytics")}>
                <TrendingUp className="w-4 h-4 mr-2" /> Analytics
              </Button>
              <Button variant={active === "rewards" ? "default" : "ghost"} onClick={() => go("rewards")}>
                <Gift className="w-4 h-4 mr-2" /> ETH Rewards
              </Button>
              <Button variant={active === "profile" ? "default" : "ghost"} onClick={() => go("profile")}>
                <User className="w-4 h-4 mr-2" /> Profile
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant={active === "history" ? "default" : "ghost"}>
                <Link href="/dashboard?tab=history">
                  <History className="w-4 h-4 mr-2" /> History
                </Link>
              </Button>
              <Button asChild variant={active === "insights" ? "default" : "ghost"}>
                <Link href="/dashboard?tab=insights">
                  <Brain className="w-4 h-4 mr-2" /> AI Insights
                </Link>
              </Button>
              <Button asChild variant={active === "analytics" ? "default" : "ghost"}>
                <Link href="/dashboard?tab=analytics">
                  <TrendingUp className="w-4 h-4 mr-2" /> Analytics
                </Link>
              </Button>
              <Button asChild variant={active === "rewards" ? "default" : "ghost"}>
                <Link href="/dashboard?tab=rewards">
                  <Gift className="w-4 h-4 mr-2" /> ETH Rewards
                </Link>
              </Button>
              <Button asChild variant={active === "profile" ? "default" : "ghost"}>
                <Link href="/dashboard?tab=profile">
                  <User className="w-4 h-4 mr-2" /> Profile
                </Link>
              </Button>
            </>
          )}

          {showAuth && (
            <div className="flex items-center gap-2 ml-2">
              <Button asChild variant={active === "auth" ? "default" : "ghost"}>
                <Link href="/signin">Sign in/Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
