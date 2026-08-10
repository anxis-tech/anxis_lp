'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

export function AnxisHeroGraphic() {
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth springs for subtle parallax tilt
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  const rotateX = useTransform(springY, [-200, 200], [10, -10])
  const rotateY = useTransform(springX, [-200, 200], [-10, 10])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div
      className="relative w-full aspect-square max-w-[540px] mx-auto flex items-center justify-center p-2 cursor-pointer select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Radial Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00ABB8]/30 via-sky-300/20 to-transparent blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Perspective Container */}
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          perspective: 1000,
          rotateX: isReducedMotion ? 0 : rotateX,
          rotateY: isReducedMotion ? 0 : rotateY,
        }}
      >
        {/* Layer: 3D Flowing Glass Ribbon Infinite Loop ANXIS Symbol (Matching Reference Image) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full max-w-[480px] max-h-[480px] drop-shadow-[0_20px_40px_rgba(0,171,184,0.35)]" viewBox="0 0 400 400" fill="none">
            <defs>
              <linearGradient id="ribbonTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#80E9F2" />
                <stop offset="40%" stopColor="#00C4D4" />
                <stop offset="85%" stopColor="#00ABB8" />
                <stop offset="100%" stopColor="#007780" />
              </linearGradient>

              <linearGradient id="ribbonGlassGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#00C4D4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#00ABB8" stopOpacity="0.8" />
              </linearGradient>

              <radialGradient id="sparkleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#00ABB8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Soft Mesh Ambient Circles */}
            <circle cx="200" cy="200" r="160" stroke="#00ABB8" strokeWidth="1" strokeDasharray="6 6" opacity="0.2" />
            <circle cx="200" cy="200" r="110" stroke="#00C4D4" strokeWidth="1" opacity="0.15" />

            {/* Flowing Ribbon Loop 1 (Outer Translucent Glass Layer) */}
            <motion.path
              d="M 80 260 C 20 180, 100 80, 180 120 C 260 160, 320 80, 350 140 C 380 200, 280 320, 200 270 C 120 220, 40 320, 80 260 Z"
              fill="url(#ribbonGlassGrad)"
              stroke="#FFFFFF"
              strokeWidth="4"
              opacity="0.85"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.85, scale: 1 }}
              transition={{ duration: 0.8 }}
            />

            {/* Flowing Ribbon Loop 2 (Main Metallic Teal Layer - ANXIS 'A' / Infinity Motif) */}
            <motion.path
              d="M 60 220 C 10 140, 120 60, 210 140 C 300 220, 360 120, 340 210 C 320 300, 210 260, 150 290 C 90 320, 30 280, 60 220 Z"
              fill="url(#ribbonTealGrad)"
              stroke="#00ABB8"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />

            {/* Translucent Overlay Ribs & Details */}
            <path
              d="M 120 140 C 160 180, 240 220, 280 160"
              stroke="#FFFFFF"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M 90 240 C 140 200, 220 260, 270 230"
              stroke="#80E9F2"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Orbiting Glass Spheres (Matching Reference Floating Spheres) */}
            <circle cx="330" cy="110" r="14" fill="url(#ribbonGlassGrad)" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="70" cy="300" r="10" fill="#00C4D4" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="210" cy="330" r="8" fill="#80E9F2" />

            {/* Orbiting Light Sparkle */}
            <motion.circle
              r="6"
              fill="#FFFFFF"
              className="drop-shadow-[0_0_12px_#00ABB8]"
              animate={{
                cx: [80, 180, 350, 200, 80],
                cy: [260, 120, 140, 270, 260],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </svg>
        </div>
      </motion.div>
    </div>
  )
}
