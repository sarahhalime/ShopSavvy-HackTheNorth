"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardTopbar } from "@/components/dashboard-topbar"
import { Rocket, Mail, Lock } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <DashboardTopbar active="auth" />
      <main className="container mx-auto px-4 py-10 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or explore the app in demo mode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-9" />
              </div>
            </div>

            {/* Non-functional Sign in for now */}
            <Button
              type="button"
              className="w-full bg-white text-black dark:text-black border border-input hover:bg-white/90"
              variant="outline"
            >
              Sign in
            </Button>

            {/* Primary path for now: Demo Mode */}
            <Button className="w-full" onClick={() => router.push("/")}>
              <Rocket className="w-4 h-4 mr-2" /> Enter Demo Mode 🚀
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Don’t have an account? <Link href="/signup" className="underline">Sign up</Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
