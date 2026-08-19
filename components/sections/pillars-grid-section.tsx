'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Icon } from '@/components/ui/hugeicons'
import { trackEvent } from '@/lib/analytics/events'
import { cn } from '@/lib/utils'

export function PillarsGridSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const pillars = [
    {
      number: '01',
      title: 'Sites e Lojas Virtuais',
      subtitle:
        'Sites institucionais, landing pages e e-commerces completos em Tray, Nuvemshop e WooCommerce para alta conversão.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
      alt: 'Criação de sites e lojas virtuais na ANXIS',
      tags: ['Tray & Nuvemshop', 'WooCommerce', 'Mobile First'],
      accentColor: '#0099FF',
      glowShadow: 'shadow-[#0099FF]/20',
      activeBorder: 'border-[#0099FF]',
    },
    {
      number: '02',
      title: 'Design UI/UX',
      subtitle:
        'Interfaces autorais e prototipagem interativa no Figma focada na melhor experiência de navegação do usuário.',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800&auto=format&fit=crop',
      alt: 'UI/UX Design e prototipagem na ANXIS',
      tags: ['Protótipo Figma', 'Design System', 'Conversão'],
      accentColor: '#00C968',
      glowShadow: 'shadow-[#00C968]/20',
      activeBorder: 'border-[#00C968]',
    },
    {
      number: '03',
      title: 'Performance & SEO',
      subtitle:
        'Otimização Core Web Vitals para carregamento instantâneo, score 90+ no PageSpeed e autoridade orgânica no Google.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
      alt: 'Performance de carregamento e SEO',
      tags: ['Score 90+ PageSpeed', 'SEO Técnico', 'Core Web Vitals'],
      accentColor: '#FFB800',
      glowShadow: 'shadow-[#FFB800]/20',
      activeBorder: 'border-[#FFB800]',
    },
    {
      number: '04',
      title: 'Branding & Identidade',
      subtitle:
        'Criação de marcas marcantes, logotipos, paletas de cores e manuais visuais completos para posicionamento premium.',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
      alt: 'Branding e criação de identidade visual na ANXIS',
      tags: ['Identidade Visual', 'Logo & Tipografia', 'Brandbook'],
      accentColor: '#FF6B00',
      glowShadow: 'shadow-[#FF6B00]/20',
      activeBorder: 'border-[#FF6B00]',
    },
    {
      number: '05',
      title: 'Desenvolvimento Sob Medida',
      subtitle:
        'Desenvolvimento em código limpo com Next.js, React e integrações sob medida para regras de negócio específicas.',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
      alt: 'Desenvolvimento sob medida e código limpo',
      tags: ['Next.js / React', 'APIs & Webhooks', 'Bancos de Dados'],
      accentColor: '#00D4FF',
      glowShadow: 'shadow-[#00D4FF]/20',
      activeBorder: 'border-[#00D4FF]',
    },
  ]

  const scrollToContact = (title: string) => {
    trackEvent('click_primary_cta', { location: 'pillar_card', title })
    const el = document.querySelector('#contato')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="servicos" className="w-full py-4 sm:py-6 px-[12px] sm:px-[15px] bg-[#FFFFFF]">
      {/* FLOATING ROUNDED DARK CONTAINER */}
      <div className="w-full bg-[#0B0F19] text-white py-12 sm:py-16 rounded-[28px] sm:rounded-[32px] relative overflow-hidden border border-slate-800/80">
        {/* VIVID RAINBOW ACCENT TOP & BOTTOM BORDERS */}
        <div
          className="absolute top-0 inset-x-0 h-[2.5px] z-20"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,212,255,0) 0%, #00D4FF 15%, #00F5A0 50%, #FFA033 85%, rgba(255,160,51,0) 100%)',
            boxShadow: '0 1px 12px rgba(0, 245, 160, 0.4)',
          }}
        />
        <div
          className="absolute bottom-0 inset-x-0 h-[2.5px] z-20"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,160,51,0) 0%, #FFA033 15%, #00F5A0 50%, #00D4FF 85%, rgba(0,212,255,0) 100%)',
            boxShadow: '0 -1px 12px rgba(0, 212, 255, 0.4)',
          }}
        />

        {/* SOPHISTICATED DARK TECH BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute inset-0 pointer-events-none opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.25) 1.25px, transparent 1.25px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute -top-24 left-1/4 -translate-x-1/2 w-[700px] h-[500px] bg-[#086ec5]/12 rounded-full blur-[170px]" />
          <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[650px] h-[450px] bg-[#059669]/10 rounded-full blur-[160px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 sm:space-y-8">
          {/* HEADER BAR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-xs sm:text-[13px] font-extrabold uppercase tracking-widest text-[#0099FF] bg-[#0099FF]/10 px-4 py-1.5 rounded-[20px] border border-[#0099FF]/30 shadow-xs">
                NOSSOS SERVIÇOS
              </span>
              <span className="hidden sm:inline text-slate-600 font-bold">|</span>
              <span className="text-slate-200 font-sans text-sm sm:text-base font-semibold tracking-tight">
                Passe o cursor sobre os cards para expandir os detalhes
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-300 font-sans font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span>5 Especialidades Digitais</span>
            </div>
          </div>

          {/* 5-CARDS ROW (EXACT 300PX HEIGHT WITH SMOOTH HOVER EXPANSION) */}
          <div className="flex flex-col lg:flex-row items-stretch gap-3.5 sm:gap-4 w-full">
            {pillars.map((pillar, idx) => {
              const isExpanded = hoveredIdx === idx

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(isExpanded ? null : idx)}
                  className={cn(
                    'group relative h-[300px] rounded-[22px] sm:rounded-[24px] overflow-hidden cursor-pointer border select-none transition-all duration-500 ease-out flex flex-col justify-between p-5',
                    isExpanded
                      ? cn(
                          'lg:flex-[2.2] w-full shadow-2xl z-20',
                          pillar.activeBorder,
                          pillar.glowShadow
                        )
                      : 'lg:flex-[0.8] w-full border-white/10 hover:border-white/30 z-10'
                  )}
                >
                  {/* BACKGROUND IMAGE */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={pillar.image}
                      alt={pillar.alt}
                      fill
                      className={cn(
                        'object-cover transition-all duration-700',
                        isExpanded
                          ? 'scale-110 brightness-85'
                          : 'scale-100 brightness-60 group-hover:scale-105 group-hover:brightness-75'
                      )}
                      unoptimized
                    />
                    {/* DARK GRADIENT OVERLAY */}
                    <div
                      className={cn(
                        'absolute inset-0 bg-gradient-to-b transition-all duration-500',
                        isExpanded
                          ? 'from-black/80 via-black/60 to-black/95'
                          : 'from-black/85 via-black/55 to-black/95'
                      )}
                    />
                  </div>

                  {/* TOP ROW: NUMBER BADGE */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className={cn(
                        'text-xs font-mono font-bold tracking-widest px-3 py-1 rounded-full border transition-all duration-300',
                        isExpanded
                          ? 'text-white bg-white/20 border-white/30 shadow-md'
                          : 'text-white/80 bg-white/10 border-white/15'
                      )}
                    >
                      {pillar.number}
                    </span>

                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all duration-300',
                        isExpanded
                          ? 'opacity-100 bg-white/15 text-white border-white/25'
                          : 'opacity-0'
                      )}
                    >
                      Detalhes
                    </span>
                  </div>

                  {/* BOTTOM CONTENT CONTAINER */}
                  <div className="relative z-10 space-y-2.5">
                    {/* TITLE */}
                    <h3
                      className={cn(
                        'font-black text-white tracking-tight font-heading leading-tight transition-all duration-300',
                        isExpanded ? 'text-lg sm:text-xl' : 'text-base sm:text-lg lg:text-base'
                      )}
                    >
                      {pillar.title}
                    </h3>

                    {/* EXPANDABLE DETAILS: SUBTITLE, TAGS, AND CTA BUTTON */}
                    <div
                      className={cn(
                        'space-y-2.5 transition-all duration-500 overflow-hidden',
                        isExpanded
                          ? 'max-h-[160px] opacity-100 pt-0.5'
                          : 'max-h-0 opacity-0 pointer-events-none'
                      )}
                    >
                      {/* SUBTITLE */}
                      <p className="text-[11px] sm:text-xs text-slate-200 leading-snug line-clamp-2 font-normal">
                        {pillar.subtitle}
                      </p>

                      {/* TAGS & CTA BUTTON ROW */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap gap-1">
                          {pillar.tags.slice(0, 2).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            scrollToContact(pillar.title)
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all duration-200 cursor-pointer shrink-0"
                        >
                          <span>Solicitar</span>
                          <Icon name="ArrowRight" size={11} className="text-slate-900" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
