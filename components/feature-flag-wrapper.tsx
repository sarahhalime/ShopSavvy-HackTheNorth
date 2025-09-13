"use client"

import type { ReactNode } from "react"
import { FeatureFlagService } from "@/lib/feature-flags"

interface FeatureFlagWrapperProps {
  flag: string
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureFlagWrapper({ flag, children, fallback = null }: FeatureFlagWrapperProps) {
  // In a real app, this would use a hook to check the flag
  const isEnabled = FeatureFlagService.isEnabled(flag)

  return isEnabled ? <>{children}</> : <>{fallback}</>
}
