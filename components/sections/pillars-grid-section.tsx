'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Icon } from '@/components/ui/hugeicons'
import { trackEvent } from '@/lib/analytics/events'
import { cn, formatWhatsAppLink } from '@/lib/utils'

interface PillarsGridSectionProps {
  whatsapp?: string
}

export function PillarsGridSection({
  whatsapp = '5584987147049',
}: PillarsGridSectionProps) {
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
    <section id="servicos" className="py-24 sm:py-32 bg-[#FFFFFF] text-[#0F172A] relative overflow-hidden select-none">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[#086ec5]/4 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-[#00C968]/4 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10 sm:space-y-14">
        {/* GIANT WATERMARK '02' IN THE BACKGROUND */}
        <div
          className="absolute -top-10 sm:-top-16 left-2 sm:left-6 text-[150px] sm:text-[220px] lg:text-[260px] font-black text-slate-100/80 font-heading select-none pointer-events-none leading-none z-0"
          aria-hidden="true"
        >
          02
        </div>

        {/* SPLIT HEADER: LEFT TITLE & EYEBROW VS RIGHT DESCRIPTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end relative z-10 pt-4 sm:pt-6">
          {/* LEFT COLUMN: EYEBROW & 42PX TITLE */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-[13px] font-heading font-extrabold uppercase tracking-widest text-[#086ec5]">
                NOSSOS SERVIÇOS
              </span>
              <div className="h-[1.5px] w-8 bg-[#086ec5]/30 rounded-full" />
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#1E293B] tracking-tight leading-[1.15] font-heading">
              Especialidades para <br />
              acelerar o seu negócio
            </h2>
          </div>

          {/* RIGHT COLUMN: DESCRIPTIVE TEXT */}
          <div className="lg:col-span-5 text-left lg:text-left space-y-2">
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Desenvolvemos ecossistemas digitais de alta performance com design autoral, tecnologia moderna e foco em autoridade e conversão para a sua marca.
            </p>
          </div>
        </div>

        {/* 5-CARDS ROW: BALANCED SLATE GREY WITH VISIBLE IMAGES, FULL-COLOR ON HOVER */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3.5 sm:gap-4 w-full relative z-10">
          {pillars.map((pillar, idx) => {
            const isExpanded = hoveredIdx === idx

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(isExpanded ? null : idx)}
                className={cn(
                  'group relative h-[320px] rounded-[24px] sm:rounded-[28px] overflow-hidden cursor-pointer border select-none transition-all duration-500 ease-out flex flex-col justify-between p-6',
                  isExpanded
                    ? cn(
                        'lg:flex-[2.4] w-full shadow-2xl z-20 bg-[#0F172A]',
                        pillar.activeBorder,
                        pillar.glowShadow
                      )
                    : 'lg:flex-[0.75] w-full bg-[#1E293B] border-slate-700/80 hover:border-slate-600 shadow-md hover:shadow-xl z-10'
                )}
              >
                {/* BACKGROUND IMAGE: FULL VIVID COLOR */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={pillar.image}
                    alt={pillar.alt}
                    fill
                    className={cn(
                      'object-cover transition-all duration-700',
                      isExpanded
                        ? 'scale-110 brightness-95 opacity-100'
                        : 'scale-100 brightness-85 opacity-90 group-hover:scale-105 group-hover:brightness-95 group-hover:opacity-100'
                    )}
                    unoptimized
                  />
                  {/* BALANCED OVERLAY: PRESERVES VIVID COLOR AND TEXT READABILITY */}
                  <div
                    className={cn(
                      'absolute inset-0 transition-all duration-500',
                      isExpanded
                        ? 'bg-gradient-to-b from-slate-950/70 via-slate-950/45 to-slate-950/95'
                        : 'bg-gradient-to-b from-slate-950/60 via-slate-950/30 to-slate-950/85'
                    )}
                  />
                </div>

                {/* TOP ROW: NUMBER BADGE */}
                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-heading font-bold tracking-widest px-3 py-1 rounded-full border transition-all duration-300',
                      isExpanded
                        ? 'text-white bg-white/20 border-white/30 shadow-md'
                        : 'text-slate-200 bg-white/10 border-white/20'
                    )}
                  >
                    {pillar.number}
                  </span>

                  <span
                    className={cn(
                      'text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all duration-300',
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
                    <p className="text-[11px] sm:text-xs text-slate-200 leading-snug line-clamp-2 font-normal font-sans">
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

                      <a
                        href={formatWhatsAppLink(
                          whatsapp,
                          `Olá! Gostaria de solicitar um orçamento para o serviço de ${pillar.title}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation()
                          trackEvent('click_whatsapp', { location: 'pillar_card', title: pillar.title })
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-heading font-black text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      >
                        <span>Solicitar</span>
                        <Icon name="ArrowRight" size={11} className="text-slate-900" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
