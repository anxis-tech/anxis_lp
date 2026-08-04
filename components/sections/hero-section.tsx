'use client'

import { motion } from 'motion/react'
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
import { AnxisHeroGraphic } from '@/components/graphics/anxis-hero-graphic'
import { trackEvent } from '@/lib/analytics/events'

interface HeroSectionProps {
  eyebrow?: string
  title?: string
  description?: string
  primaryCtaText?: string
  secondaryCtaText?: string
}

export function HeroSection({
  eyebrow = 'DESENVOLVIMENTO DE SITES E LOJAS VIRTUAIS',
  title = 'Projetos digitais desenvolvidos para apresentar, vender e crescer.',
  description = 'A ANXIS cria sites institucionais, lojas virtuais e soluções personalizadas em código com foco em desempenho, experiência do usuário e facilidade de gestão.',
  primaryCtaText = 'Solicitar uma proposta',
  secondaryCtaText = 'Conhecer projetos',
}: HeroSectionProps) {
  const scrollToSection = (id: string) => {
    const el = document.querySelector(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#F7F8FA] via-[#FFFFFF] to-[#F7F8FA]">
      {/* Background Decorative Tech Lines & Ambient Light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0075FF]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#168CFF]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: PERSUASIVE CONTENT */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* EYEBROW */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0075FF]/10 border border-[#0075FF]/20 text-[#0075FF] text-xs font-bold tracking-wider uppercase"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{eyebrow}</span>
            </motion.div>

            {/* TITLE */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0C1D36] leading-[1.12] tracking-tight"
            >
              Projetos digitais desenvolvidos para{' '}
              <span className="text-gradient-blue">apresentar, vender e crescer.</span>
            </motion.h1>

            {/* DESCRIPTION */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-[#596579] font-normal leading-relaxed max-w-2xl"
            >
              {description}
            </motion.p>

            {/* ACTION BUTTONS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <button
                type="button"
                onClick={() => {
                  trackEvent('click_primary_cta', { location: 'hero' })
                  scrollToSection('#contato')
                }}
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-lg hover:shadow-glow-blue transition-all duration-200 active:scale-[0.98]"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-5 h-5 ml-2.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  trackEvent('click_project', { location: 'hero_secondary' })
                  scrollToSection('#projetos')
                }}
                className="inline-flex items-center justify-center px-7 py-4 rounded-xl text-base font-semibold text-[#0C1D36] bg-white border border-slate-200 hover:border-[#0075FF] hover:bg-slate-50 transition-all duration-200 shadow-sm"
              >
                <span>{secondaryCtaText}</span>
              </button>
            </motion.div>

            {/* MICROTEXT */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xs text-[#596579] pt-1 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Atendimento personalizado para projetos institucionais, e-commerce e desenvolvimento sob medida.</span>
            </motion.p>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE ANXIS GRAPHIC */}
          <div className="lg:col-span-5 flex justify-center">
            <AnxisHeroGraphic />
          </div>
        </div>
      </div>

      {/* SCROLL DOWN INDICATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
      >
        <button
          type="button"
          onClick={() => scrollToSection('#credibilidade')}
          className="text-slate-400 hover:text-[#0075FF] transition-colors p-2 flex flex-col items-center gap-1 group"
          aria-label="Rolar para baixo"
        >
          <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400 group-hover:text-[#0075FF]">Rolar</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-[#0075FF]" />
        </button>
      </motion.div>
    </section>
  )
}
