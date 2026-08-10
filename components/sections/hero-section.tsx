'use client'

import { motion } from 'motion/react'
import { Icon } from '@/components/ui/hugeicons'
import { AnxisHeroGraphic } from '@/components/graphics/anxis-hero-graphic'
import { trackEvent } from '@/lib/analytics/events'

interface HeroSectionProps {
  primaryCtaText?: string
  secondaryCtaText?: string
}

export function HeroSection({
  primaryCtaText = 'Iniciar Projeto',
  secondaryCtaText = 'Ver Nosso Trabalho',
}: HeroSectionProps) {
  const scrollToSection = (id: string) => {
    const el = document.querySelector(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const stats = [
    {
      icon: 'Zap',
      value: '50+',
      label: 'Projetos Entregues',
    },
    {
      icon: 'Smartphone',
      value: '30+',
      label: 'Clientes Satisfeitos',
    },
    {
      icon: 'Gauge',
      value: '3x',
      label: 'Crescimento Médio',
    },
    {
      icon: 'ShieldCheck',
      value: '100%',
      label: 'Foco em Qualidade',
    },
  ]

  return (
    <section className="relative pt-28 sm:pt-36 pb-12 w-full bg-gradient-to-t from-[#BCEFF4] via-[#EEFAFC] to-[#FFFFFF] overflow-hidden text-[#0F172A] border-b border-[#00ABB8]/20">
      {/* SUBTLE AMBIENT BACKGROUND GLOW & TECHNICAL DOT MESH */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#00ABB8]/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#00ABB8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.06]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT 3D GLASS RIBBON GRAPHIC (MATCHING REFERENCE IMAGE) */}
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
            <AnxisHeroGraphic />
          </div>

          {/* RIGHT PERSUASIVE TYPOGRAPHY COMPOSITION (MATCHING REFERENCE IMAGE EXACT HEADLINE DISPOSITION) */}
          <div className="lg:col-span-7 space-y-6 text-left order-1 lg:order-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              {/* MASSIVE HERO HEADLINE (PLUS JAKARTA SANS FONT) */}
              <div className="lg:col-span-8">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-5xl sm:text-7xl lg:text-[5.5rem] font-extrabold text-[#0F172A] leading-[0.96] tracking-tight font-heading"
                >
                  Soluções <br />
                  <span className="text-[#00ABB8]">digitais</span> <br />
                  que escalam<span className="text-[#00ABB8]">.</span>
                </motion.h1>
              </div>

              {/* DESCRIPTION PARAGRAPH */}
              <div className="lg:col-span-4 pb-2">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed"
                >
                  A ANXIS é uma agência digital especializada em criar sites, lojas virtuais e sistemas de alta performance que impulsionam o seu crescimento e geram resultados reais.
                </motion.p>
              </div>
            </div>

            {/* ACTION PILL BUTTONS (MATCHING REFERENCE IMAGE BUTTON STYLES) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4"
            >
              {/* PRIMARY SOLID CYAN PILL BUTTON */}
              <button
                type="button"
                onClick={() => {
                  trackEvent('click_primary_cta', { location: 'hero' })
                  scrollToSection('#contato')
                }}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-extrabold text-white bg-[#00ABB8] hover:bg-[#00939E] shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <span>{primaryCtaText}</span>
              </button>

              {/* SECONDARY OUTLINE CYAN PILL BUTTON WITH CIRCULAR ICON */}
              <button
                type="button"
                onClick={() => {
                  trackEvent('click_project', { location: 'hero_secondary' })
                  scrollToSection('#projetos')
                }}
                className="inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-bold text-[#00939E] bg-white/80 hover:bg-[#00ABB8]/10 border-2 border-[#00ABB8]/60 transition-all duration-200 shadow-sm cursor-pointer gap-2.5"
              >
                <div className="w-6 h-6 rounded-full bg-[#00ABB8] text-white flex items-center justify-center">
                  <Icon name="ArrowRight" size={14} />
                </div>
                <span>{secondaryCtaText}</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* BOTTOM METRICS STATS BAR (MATCHING REFERENCE IMAGE BOTTOM BAR) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-8 border-t border-[#00ABB8]/25 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10"
        >
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-4 p-2">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-[#00ABB8]/30 shadow-sm flex items-center justify-center text-[#00ABB8] shrink-0">
                <Icon name={stat.icon} size={24} />
              </div>
              <div>
                <div className="text-2xl font-black text-[#0F172A] font-heading">{stat.value}</div>
                <div className="text-xs text-slate-600 font-semibold">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
