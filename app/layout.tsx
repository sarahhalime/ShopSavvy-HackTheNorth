import React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
// import { UserProvider } from "@auth0/nextjs-auth0"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { EthOverlay } from "@/components/eth-overlay"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = { 
  title: "ShopSavvy - AI-Powered Shopping with Solana Pay",
  description:
    "Search products naturally, pay instantly with crypto, and get AI insights to make smarter purchasing decisions.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
          <Suspense fallback={null}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <EthOverlay>
                {children}
              </EthOverlay>
              <Toaster />
            </ThemeProvider>
          </Suspense>
          <Analytics />
        </body>
    </html>
  )
}
