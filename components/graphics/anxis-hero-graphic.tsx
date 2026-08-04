'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { Code2, Layout, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react'

export function AnxisHeroGraphic() {
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth springs for subtle parallax tilt
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  const rotateX = useTransform(springY, [-200, 200], [8, -8])
  const rotateY = useTransform(springX, [-200, 200], [-8, 8])

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
      className="relative w-full aspect-square max-w-[540px] mx-auto flex items-center justify-center p-4 cursor-pointer select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Radial Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0075FF]/20 via-[#168CFF]/10 to-transparent blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 0.85, 0.6],
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
        {/* Layer 1: Geometric Metallic 'A' Symbol Grid */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full max-w-[420px] max-h-[420px] drop-shadow-2xl" viewBox="0 0 400 400" fill="none">
            <defs>
              <linearGradient id="heroBlueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#081D3A" />
                <stop offset="50%" stopColor="#0055D4" />
                <stop offset="100%" stopColor="#0075FF" />
              </linearGradient>

              <linearGradient id="heroSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#657184" />
                <stop offset="50%" stopColor="#A5B0C0" />
                <stop offset="100%" stopColor="#E2E7F0" />
              </linearGradient>

              <linearGradient id="strokeLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0075FF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#168CFF" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines & Diagonal Rays */}
            <g stroke="url(#strokeLight)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4">
              <line x1="50" y1="50" x2="350" y2="350" />
              <line x1="350" y1="50" x2="50" y2="350" />
              <circle cx="200" cy="200" r="160" stroke="#0075FF" strokeOpacity="0.15" fill="none" />
              <circle cx="200" cy="200" r="110" stroke="#657184" strokeOpacity="0.15" fill="none" />
            </g>

            {/* Geometric Left Chevron Arrow */}
            <motion.path
              d="M 180 60 L 70 270 L 260 270 L 260 215 L 145 215 L 205 105 Z"
              fill="url(#heroBlueGrad)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            />

            {/* Geometric Right Metallic Slash */}
            <motion.path
              d="M 205 55 L 330 290 L 265 290 L 140 70 Z"
              fill="url(#heroSilverGrad)"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />

            {/* Moving Light Beam along the 'A' path */}
            <motion.circle
              r="6"
              fill="#FFFFFF"
              className="drop-shadow-[0_0_12px_#0075FF]"
              animate={{
                cx: [180, 70, 260, 205, 330, 180],
                cy: [60, 270, 270, 105, 290, 60],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </svg>
        </div>

        {/* Layer 2: Floating Floating UI Mockup Cards */}
        {/* Top-Right Performance Badge */}
        <motion.div
          className="absolute top-6 right-2 sm:right-6 bg-[#081D3A]/90 backdrop-blur-md border border-[#0075FF]/30 p-3.5 rounded-xl shadow-xl flex items-center gap-3 text-white text-xs z-20"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ transform: 'translateZ(35px)' }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#0075FF]/20 flex items-center justify-center text-[#168CFF]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white">Performance 98+</div>
            <div className="text-[10px] text-[#BBC4D1]">Core Web Vitals Otimizados</div>
          </div>
        </motion.div>

        {/* Bottom-Left Code / Architecture Card */}
        <motion.div
          className="absolute bottom-8 left-2 sm:left-6 bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-2xl flex items-center gap-3.5 text-slate-800 text-xs z-20"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{ transform: 'translateZ(45px)' }}
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-[#0C1D36] flex items-center gap-1.5">
              <span>Projetos Sob Medida</span>
            </div>
            <div className="text-[11px] text-[#596579]">Estrutura limpa, segura e escalável</div>
          </div>
        </motion.div>

        {/* Bottom-Right Security & Custom Stack Floating Pill */}
        <motion.div
          className="absolute top-1/2 -right-4 sm:right-2 transform -translate-y-1/2 bg-[#0B2F63]/90 backdrop-blur-md border border-[#BBC4D1]/30 text-white px-3.5 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-[11px] z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ transform: 'translateZ(25px)' }}
        >
          <ShieldCheck className="w-4 h-4 text-[#0075FF]" />
          <span className="font-medium text-slate-200">Plataformas & Código Limpo</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
