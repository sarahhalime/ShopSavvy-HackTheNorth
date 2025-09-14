"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface EthAnimationProps {
  trigger?: boolean
  children: React.ReactNode
  announcementText?: string
  duration?: number
  particles?: number
  size?: 'sm' | 'md' | 'lg'
  onAnimationComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  angle: number
  speed: number
  scale: number
  opacity: number
}

export function EthAnimation({ 
  trigger = false, 
  children, 
  announcementText = "ETH Event Triggered!",
  duration = 3000,
  particles = 8,
  size = 'md',
  onAnimationComplete
}: EthAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [ethParticles, setEthParticles] = useState<Particle[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const sizeConfig = {
    sm: { ethSize: 20, radius: 40, glow: 8 },
    md: { ethSize: 30, radius: 60, glow: 12 },
    lg: { ethSize: 40, radius: 80, glow: 16 }
  }

  const config = sizeConfig[size]

  // ETH logo SVG path
  const EthLogo = () => (
    <svg 
      viewBox="0 0 256 417" 
      className="w-full h-full"
      fill="none"
    >
      <path
        d="M127.961 0L125.82 7.29l-.00066 198.283L127.961 207.717l127.951-75.695L127.961 0z"
        fill="#343434"
      />
      <path
        d="M127.961 0L0 132.022l127.961 75.695L127.961 0z"
        fill="#8C8C8C"
      />
      <path
        d="M127.961 226.174l-1.548 1.89v98.199l1.548 4.527L255.922 156.022l-127.961 70.152z"
        fill="#3C3C3B"
      />
      <path
        d="M127.961 330.79V226.174L0 156.022l127.961 174.768z"
        fill="#8C8C8C"
      />
      <path
        d="M127.961 207.717l127.951-75.695-127.951-58.168v133.863z"
        fill="#141414"
      />
      <path
        d="M0 132.022l127.961 75.695V73.854L0 132.022z"
        fill="#393939"
      />
    </svg>
  )

  // Create particle positions in a circle
  const createParticles = (): Particle[] => {
    return Array.from({ length: particles }, (_, i) => {
      const angle = (i / particles) * 360
      return {
        id: i,
        x: 0,
        y: 0,
        angle,
        speed: 0.5 + Math.random() * 0.5,
        scale: 0.8 + Math.random() * 0.4,
        opacity: 0.7 + Math.random() * 0.3
      }
    })
  }

  useEffect(() => {
    if (trigger && !isAnimating) {
      setIsAnimating(true)
      setEthParticles(createParticles())
      
      const timer = setTimeout(() => {
        setIsAnimating(false)
        onAnimationComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [trigger, isAnimating, duration, particles, onAnimationComplete])

  return (
    <div ref={containerRef} className="relative inline-block">
      {children}
      
      <AnimatePresence>
        {isAnimating && (
          <>
            {/* Rotating ETH particles */}
            <div className="absolute inset-0 pointer-events-none">
              {ethParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute"
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: '50%',
                    y: '50%',
                  }}
                  animate={{ 
                    opacity: particle.opacity,
                    scale: particle.scale,
                    x: `calc(50% + ${Math.cos((particle.angle * Math.PI) / 180) * config.radius}px)`,
                    y: `calc(50% + ${Math.sin((particle.angle * Math.PI) / 180) * config.radius}px)`,
                    rotate: [0, 360]
                  }}
                  exit={{ 
                    opacity: 0,
                    scale: 0,
                    y: `calc(50% - ${config.radius * 2}px)`
                  }}
                  transition={{ 
                    duration: duration / 1000,
                    ease: "easeInOut",
                    rotate: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }
                  }}
                  style={{
                    width: config.ethSize,
                    height: config.ethSize,
                    marginLeft: -config.ethSize / 2,
                    marginTop: -config.ethSize / 2,
                  }}
                >
                  <div 
                    className="w-full h-full relative"
                    style={{
                      filter: `drop-shadow(0 0 ${config.glow}px #627eea) drop-shadow(0 0 ${config.glow * 2}px #627eea40)`
                    }}
                  >
                    <EthLogo />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Central glow effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, #627eea20 0%, transparent 70%)`,
                  filter: `blur(${config.glow}px)`
                }}
              />
            </motion.div>

            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.3, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Math.floor(duration / 1500),
                ease: "easeInOut"
              }}
            >
              <div 
                className="absolute inset-0 border-2 border-[#627eea] rounded-full"
                style={{
                  boxShadow: `0 0 ${config.glow * 2}px #627eea60`
                }}
              />
            </motion.div>

            {/* Announcement text */}
            {announcementText && (
              <motion.div
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 pointer-events-none z-10"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                transition={{ 
                  delay: 0.3,
                  duration: 0.5,
                  ease: "easeOut"
                }}
              >
                <div 
                  className="bg-[#627eea] text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
                  style={{
                    boxShadow: `0 0 ${config.glow}px #627eea60`,
                    filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.2))`
                  }}
                >
                  {announcementText}
                </div>
                {/* Speech bubble arrow */}
                <div 
                  className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #627eea'
                  }}
                />
              </motion.div>
            )}

            {/* Sparkle effects */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute w-2 h-2 bg-[#627eea] rounded-full"
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: '50%',
                    y: '50%',
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: `calc(50% + ${(Math.random() - 0.5) * config.radius * 2}px)`,
                    y: `calc(50% + ${(Math.random() - 0.5) * config.radius * 2}px)`,
                  }}
                  transition={{ 
                    delay: Math.random() * (duration / 1000),
                    duration: 1,
                    repeat: Math.floor(duration / 1500),
                    ease: "easeInOut"
                  }}
                  style={{
                    filter: `drop-shadow(0 0 4px #627eea)`
                  }}
                />
              ))}
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Hook for triggering animations across the app
export function useEthAnimation() {
  const [trigger, setTrigger] = useState(false)

  const triggerAnimation = () => {
    setTrigger(true)
    setTimeout(() => setTrigger(false), 100) // Reset trigger after brief moment
  }

  return { trigger, triggerAnimation }
}

// Global event system for coordinated animations
class EthAnimationEventManager {
  private listeners: Set<() => void> = new Set()

  subscribe(callback: () => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  triggerGlobalAnimation(announcementText?: string) {
    this.listeners.forEach(callback => callback())
  }
}

export const ethAnimationManager = new EthAnimationEventManager()

// Hook for global animation events
export function useGlobalEthAnimation() {
  const [trigger, setTrigger] = useState(false)

  useEffect(() => {
    const unsubscribe = ethAnimationManager.subscribe(() => {
      setTrigger(true)
      setTimeout(() => setTrigger(false), 100)
    })
    return unsubscribe
  }, [])

  return trigger
}
