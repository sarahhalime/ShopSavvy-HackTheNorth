"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGlobalEthAnimation } from '@/components/eth-animation'

interface EthOverlayProps {
  children: React.ReactNode
}

interface FloatingEth {
  id: number
  x: number
  y: number
  scale: number
  rotation: number
  duration: number
}

export function EthOverlay({ children }: EthOverlayProps) {
  const globalTrigger = useGlobalEthAnimation()
  const [floatingEths, setFloatingEths] = useState<FloatingEth[]>([])
  const [showOverlay, setShowOverlay] = useState(false)

  // ETH logo SVG component
  const EthLogo = ({ size = 40 }: { size?: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 256 417" 
      className="drop-shadow-lg"
      style={{
        filter: 'drop-shadow(0 0 8px #627eea) drop-shadow(0 0 16px #627eea40)'
      }}
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

  // Create floating ETH elements
  const createFloatingEths = () => {
    const count = 15
    const newEths: FloatingEth[] = []
    
    for (let i = 0; i < count; i++) {
      newEths.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 100, // Start below screen
        scale: 0.5 + Math.random() * 0.8,
        rotation: Math.random() * 360,
        duration: 4 + Math.random() * 3
      })
    }
    
    return newEths
  }

  useEffect(() => {
    if (globalTrigger) {
      setFloatingEths(createFloatingEths())
      setShowOverlay(true)
      
      // Clear overlay after animation
      const timer = setTimeout(() => {
        setShowOverlay(false)
        setFloatingEths([])
      }, 6000)
      
      return () => clearTimeout(timer)
    }
  }, [globalTrigger])

  return (
    <div className="relative">
      {children}
      
      <AnimatePresence>
        {showOverlay && (
          <>
            {/* Overlay Background */}
            <motion.div
              className="fixed inset-0 z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Background glow effect */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at center, rgba(98, 126, 234, 0.1) 0%, transparent 70%)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
              
              {/* Floating ETH elements */}
              {floatingEths.map((eth) => (
                <motion.div
                  key={eth.id}
                  className="absolute pointer-events-none"
                  initial={{
                    x: eth.x,
                    y: eth.y,
                    scale: 0,
                    rotate: eth.rotation,
                    opacity: 0
                  }}
                  animate={{
                    x: eth.x + (Math.random() - 0.5) * 200,
                    y: -200, // Float to top of screen
                    scale: eth.scale,
                    rotate: eth.rotation + 360,
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: eth.duration,
                    ease: "easeOut",
                    opacity: {
                      times: [0, 0.2, 0.8, 1],
                      duration: eth.duration
                    }
                  }}
                >
                  <EthLogo size={30 + eth.scale * 20} />
                </motion.div>
              ))}
              
              {/* Central announcement */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  delay: 0.5,
                  duration: 0.8,
                  ease: "easeOut"
                }}
              >
                <div className="text-center">
                  <motion.div
                    className="mb-4"
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 3, ease: "linear", repeat: Infinity },
                      scale: { duration: 2, ease: "easeInOut", repeat: Infinity }
                    }}
                  >
                    <EthLogo size={80} />
                  </motion.div>
                  
                  <motion.div
                    className="bg-[#627eea] text-white px-6 py-3 rounded-full text-xl font-bold shadow-2xl"
                    style={{
                      boxShadow: '0 0 20px #627eea60, 0 4px 15px rgba(0,0,0,0.3)'
                    }}
                    animate={{ 
                      boxShadow: [
                        '0 0 20px #627eea60, 0 4px 15px rgba(0,0,0,0.3)',
                        '0 0 40px #627eea80, 0 8px 25px rgba(0,0,0,0.4)',
                        '0 0 20px #627eea60, 0 4px 15px rgba(0,0,0,0.3)'
                      ]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  >
                    🎉 ETH Event Triggered! 🎉
                  </motion.div>
                  
                  <motion.p
                    className="text-[#627eea] font-medium mt-2 text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    Blockchain magic in action!
                  </motion.p>
                </div>
              </motion.div>
              
              {/* Corner sparkles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute w-3 h-3 bg-[#627eea] rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`,
                    filter: 'drop-shadow(0 0 4px #627eea)'
                  }}
                  initial={{ 
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    delay: Math.random() * 2,
                    duration: 1.5,
                    repeat: 2,
                    ease: "easeInOut"
                  }}
                />
              ))}
              
              {/* Shooting stars */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute w-1 h-20 bg-gradient-to-b from-[#627eea] to-transparent rounded-full"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: '-80px',
                    filter: 'drop-shadow(0 0 6px #627eea)'
                  }}
                  initial={{ 
                    x: 0,
                    y: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    x: 200,
                    y: window.innerHeight + 100,
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    delay: 1 + i * 0.3,
                    duration: 2,
                    ease: "easeIn"
                  }}
                />
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// CSS for the pulse animation
const styles = `
  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.8;
    }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
