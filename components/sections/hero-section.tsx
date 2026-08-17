'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import { HeroProjectCarousel } from '@/components/sections/hero-project-carousel'
import { Project } from '@/types/database.types'
import { INITIAL_PROJECTS } from '@/lib/constants/initial-data'
import { trackEvent } from '@/lib/analytics/events'

import { cn } from '@/lib/utils'

interface HeroSectionProps {
  primaryCtaText?: string
  projects?: Project[]
}

interface FigmaLiveCursorProps {
  name: string
  color: string
  positionClass: string
  pointerSide?: 'top-left' | 'top-right'
  delay?: number
  floatOffset?: { x: number[]; y: number[] }
  duration?: number
}

function FigmaLiveCursor({
  name,
  color,
  positionClass,
  pointerSide = 'top-right',
  delay = 0,
  floatOffset = { x: [0, 8, -6, 0], y: [0, -10, 6, 0] },
  duration = 5.5,
}: FigmaLiveCursorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 15 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: floatOffset.x,
        y: floatOffset.y,
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        x: { duration, repeat: Infinity, ease: 'easeInOut', delay },
        y: { duration, repeat: Infinity, ease: 'easeInOut', delay },
      }}
      className={cn('absolute pointer-events-none select-none z-30 hidden sm:inline-flex items-center drop-shadow-md', positionClass)}
    >
      {/* CAPSULE NAME BADGE WITH INTEGRATED CURSOR ARROW */}
      <div
        className="relative px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-[13px] font-semibold text-white tracking-tight whitespace-nowrap shadow-xs flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        {name}

        {/* POINTER ARROW AT TOP-RIGHT (FITS SNUGLY WITH CAPSULE CURVATURE) */}
        {pointerSide === 'top-right' && (
          <div className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 pointer-events-none">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 3L3 10.5L11 13.5L14 21.5L21 3Z"
                fill={color}
                stroke={color}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {/* POINTER ARROW AT TOP-LEFT (FITS SNUGLY WITH CAPSULE CURVATURE) */}
        {pointerSide === 'top-left' && (
          <div className="absolute -top-3.5 -left-3.5 sm:-top-4 sm:-left-4 pointer-events-none">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3L21 10.5L13 13.5L10 21.5L3 3Z"
                fill={color}
                stroke={color}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function HeroSection({
  primaryCtaText = 'Quero criar meu site',
  projects = INITIAL_PROJECTS,
}: HeroSectionProps) {
  const scrollToSection = (id: string) => {
    const el = document.querySelector(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
  ]

  return (
    <section className="relative pt-28 sm:pt-36 pb-10 sm:pb-16 w-full bg-gradient-to-b from-[#F8FAFC] via-[#FAFBFC] to-[#FFFFFF] overflow-hidden text-[#2f2f2f] border-b border-slate-200/80">
      {/* SOPHISTICATED NEUTRAL TECH BACKGROUND & DOT MATRIX PATTERN */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft and subtle dot matrix pattern, smoothly masked so it never overlaps the carousel */}
        <div
          className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,black_0%,black_40%,transparent_75%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_40%,transparent_75%)]"
          style={{
            backgroundImage: 'radial-gradient(rgba(100, 116, 139, 0.16) 1.25px, transparent 1.25px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Soft diffused multi-chroma ambient glows */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-slate-200/30 via-slate-100/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[350px] bg-[#0099FF]/3 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[450px] h-[350px] bg-[#00C968]/3 rounded-full blur-[140px]" />
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[450px] h-[250px] bg-[#FF6B00]/3 rounded-full blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
          {/* HERO UPPER CONTENT CONTAINER (HEADLINE, SUBTITLE, CTA, SOCIAL PROOF & FIGMA CURSORS) */}
          <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-4 sm:space-y-6">
            {/* FIGMA LIVE CURSOR 1: DESIGN & UX (TOP-RIGHT OF HEADLINE) */}
            <FigmaLiveCursor
              name="Design & UX"
              color="#4E9B9B"
              positionClass="-top-4 sm:-top-2 right-[2%] sm:right-0 md:-right-6 lg:-right-10"
              pointerSide="top-right"
              delay={0.5}
              floatOffset={{ x: [0, 8, -5, 0], y: [0, -10, 6, 0] }}
              duration={5.2}
            />

            {/* FIGMA LIVE CURSOR 2: SEO & PERFORMANCE (LEFT OF CTA AREA) */}
            <FigmaLiveCursor
              name="SEO & Performance"
              color="#9333EA"
              positionClass="top-[68%] sm:top-[70%] left-[0%] sm:-left-4 md:-left-12 lg:-left-18"
              pointerSide="top-left"
              delay={0.8}
              floatOffset={{ x: [0, -6, 7, 0], y: [0, 8, -7, 0] }}
              duration={6.2}
            />

            {/* FIGMA LIVE CURSOR 3: DESENVOLVIMENTO (RIGHT OF CTA / SOCIAL PROOF) */}
            <FigmaLiveCursor
              name="Desenvolvimento"
              color="#0099FF"
              positionClass="bottom-0 sm:bottom-1 right-[2%] sm:right-0 md:-right-8 lg:-right-12"
              pointerSide="top-right"
              delay={1.1}
              floatOffset={{ x: [0, 7, -8, 0], y: [0, -9, 5, 0] }}
              duration={5.8}
            />

            {/* TITLE & SUBTITLE GROUP (15PX GAP) */}
            <div className="flex flex-col gap-[15px] max-w-4xl mx-auto">
              {/* MAIN MASSIVE CENTERED HEADLINE (WAVE REVEAL EFFECT) */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#2f2f2f] tracking-tight leading-[1.08] font-heading mx-auto select-none">
                {/* LINE 1 */}
                <span className="inline-flex flex-wrap justify-center gap-x-2.5 sm:gap-x-4">
                  {['Destaque', 'sua', 'marca'].map((word, index) => (
                    <motion.span
                      key={word}
                      initial={{ y: 35, opacity: 0, rotate: 3 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.08 + index * 0.09,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="inline-block pb-[0.25em] -mb-[0.25em]"
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>

                <br />

                {/* LINE 2: RAINBOW GRADIENT WITH SEQUENTIAL WAVE LIFT */}
                <span className="inline-flex flex-wrap justify-center gap-x-2.5 sm:gap-x-4">
                  {['no', 'mundo', 'digital'].map((word, index) => (
                    <motion.span
                      key={word}
                      initial={{ y: 35, opacity: 0, rotate: 3 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.36 + index * 0.09,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] font-black pb-[0.35em] -mb-[0.35em] pt-[0.1em] -mt-[0.1em]"
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
              </h1>

              {/* SUBTITLE */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto"
              >
                Criamos sites profissionais com SEO estratégico para aumentar sua visibilidade, fortalecer sua autoridade e gerar novas oportunidades.
              </motion.p>
            </div>

            {/* CENTERED ACTION CTA BUTTON & SOCIAL PROOF BELOW */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center gap-3 pt-6 sm:pt-9"
            >
              <button
                type="button"
                onClick={() => {
                  trackEvent('click_primary_cta', { location: 'hero' })
                  scrollToSection('#contato')
                }}
                className="inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-[20px] text-base sm:text-lg font-extrabold text-white bg-[#ffa337] hover:bg-[#e6902b] shadow-xl shadow-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-200 active:scale-[0.98] cursor-pointer group"
              >
                <WhatsAppIcon className="w-5 h-5 fill-current" />
                <span>{primaryCtaText}</span>
              </button>

              {/* SOCIAL PROOF (MOVED BELOW CTA, CLEAN & TRANSPARENT) */}
              <div className="flex items-center gap-2.5 sm:gap-3 pt-0.5">
                <div className="flex -space-x-1.5 sm:-space-x-2">
                  {avatars.map((src, idx) => (
                    <div
                      key={idx}
                      className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-[6px] sm:rounded-[7px] ring-2 ring-white overflow-hidden relative shadow-xs bg-slate-100 shrink-0"
                    >
                      <Image src={src} alt="Cliente satisfeito ANXIS" fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-slate-500 font-medium font-sans tracking-tight">
                  <strong className="font-bold text-[#2f2f2f]">+100 projetos entregues</strong> para marcas e profissionais.
                </span>
              </div>
            </motion.div>
          </div>

          {/* COVER FLOW CAROUSEL SHOWCASE (HIGH VISIBILITY) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full pt-2 sm:pt-3"
          >
            <HeroProjectCarousel projects={projects} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
