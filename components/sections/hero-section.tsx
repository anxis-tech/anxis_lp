'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { Icon } from '@/components/ui/hugeicons'
import { AnxisIcon } from '@/components/ui/anxis-logo'
import { AnxisHeroGraphic } from '@/components/graphics/anxis-hero-graphic'
import { trackEvent } from '@/lib/analytics/events'

interface HeroSectionProps {
  primaryCtaText?: string
}

export function HeroSection({
  primaryCtaText = 'Solicitar Proposta',
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
  ]

  return (
    <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 w-full bg-gradient-to-b from-[#F0F7FF] via-[#FAFBFC] to-[#FFFFFF] overflow-hidden text-[#0F172A] border-b border-slate-200/80">
      {/* AMBIENT BRAND GLOWS (SKY BLUE, AMBER, EMERALD MESH) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[#0099FF]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[500px] h-[400px] bg-[#FF6B00]/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#00C968]/8 rounded-full blur-[150px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#0099FF_1.2px,transparent_1.2px)] [background-size:36px_36px] opacity-[0.07]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0099ff0a_1px,transparent_1px),linear-gradient(to_bottom,#0099ff0a_1px,transparent_1px)] bg-[size:5rem_5rem]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT CONTENT COLUMN */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* EYEBROW BADGE WITH COLORFUL NEW LOGO ICON */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 border border-slate-200/90 shadow-sm backdrop-blur-md"
            >
              <AnxisIcon size={18} />
              <span className="text-xs font-mono font-extrabold tracking-wider uppercase text-slate-800">
                Soluções Digitais & Alta Performance
              </span>
            </motion.div>

            {/* HEADLINE WITH BRAND GRADIENT HIGHLIGHT */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] leading-[1.08] tracking-tight font-heading"
            >
              Desenvolvimento de Sites e Lojas Virtuais de{' '}
              <span className="text-gradient-anxis">Alta Performance</span>
            </motion.h1>

            {/* DESCRIPTION */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl"
            >
              A ANXIS desenvolve a estrutura perfeita para a sua empresa crescer no digital com carregamento instantâneo, design moderno e foco total em conversão de clientes.
            </motion.p>

            {/* ACTION CTA BUTTON & SOCIAL PROOF AVATARS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2"
            >
              {/* PRIMARY SOLID BRAND GRADIENT BUTTON */}
              <button
                type="button"
                onClick={() => {
                  trackEvent('click_primary_cta', { location: 'hero' })
                  scrollToSection('#contato')
                }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-extrabold text-white bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] hover:opacity-95 shadow-xl shadow-orange-500/15 hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-200 active:scale-[0.98] cursor-pointer group"
              >
                <span>{primaryCtaText}</span>
                <Icon name="ArrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
              </button>

              {/* OVERLAPPING AVATAR STACK & TRUSTED CLIENTS BADGE */}
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex -space-x-2.5 overflow-hidden">
                  {avatars.map((src, idx) => (
                    <div key={idx} className="inline-block h-9 w-9 rounded-full ring-2 ring-white overflow-hidden relative shadow-sm">
                      <Image
                        src={src}
                        alt="Cliente satisfeito ANXIS"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
                <div className="text-xs space-y-0.5 pl-1">
                  <div className="font-extrabold text-[#0F172A]">30+ Clientes</div>
                  <div className="text-slate-500 font-medium">Satisfeitos</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT 3D SMARTPHONE & FLOATING CARDS GRAPHIC COMPOSITION */}
          <div className="lg:col-span-6 flex justify-center">
            <AnxisHeroGraphic />
          </div>
        </div>
      </div>
    </section>
  )
}
