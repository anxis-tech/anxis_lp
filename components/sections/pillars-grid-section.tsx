'use client'

import Image from 'next/image'
import { Icon } from '@/components/ui/hugeicons'
import { trackEvent } from '@/lib/analytics/events'

export function PillarsGridSection() {
  const pillars = [
    {
      number: '01',
      title: 'Design UI/UX',
      subtitle: 'Interfaces modernas, responsivas e focadas na experiência do usuário.',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800&auto=format&fit=crop',
      alt: 'UI/UX Design e prototipagem na ANXIS',
    },
    {
      number: '02',
      title: 'Desenvolvimento',
      subtitle: 'Código limpo em Next.js, React e APIs de alta performance.',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
      alt: 'Desenvolvimento sob medida e código limpo',
    },
    {
      number: '03',
      title: 'Lojas Virtuais',
      subtitle: 'E-commerces completos em Tray, Nuvemshop e WooCommerce.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
      alt: 'Criação e otimização de e-commerce',
    },
    {
      number: '04',
      title: 'Performance & SEO',
      subtitle: 'Otimização de velocidade e dados para dominar as buscas do Google.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
      alt: 'Performance de carregamento e SEO',
    },
  ]

  const scrollToContact = (title: string) => {
    trackEvent('click_primary_cta', { location: 'pillar_card', title })
    const el = document.querySelector('#servicos')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="bg-[#293233] text-white py-10 sm:py-14 border-y border-white/10 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#00ABB8]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-[96%] lg:max-w-[98%] mx-auto px-2 sm:px-4 relative z-10 space-y-6">
        {/* TOP BAR / METADATA HEADER (MATCHING REFERENCE IMAGE TOP BAR) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-6">
            <span className="text-white font-bold tracking-wider">anxis_digital</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <a href="mailto:contato@anxis.com.br" className="hover:text-[#00C4D4] transition-colors">
              contato@anxis.com.br
            </a>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              Sites Institucionais
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              E-commerce
            </span>
            <span className="px-3 py-1 rounded-full bg-[#00ABB8]/20 border border-[#00ABB8]/40 text-[#00C4D4] font-bold">
              Código Sob Medida
            </span>
          </div>
        </div>

        {/* 4 PILLARS GRID WITH REDUCED GAP AND LARGER TALLER CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              onClick={() => scrollToContact(pillar.title)}
              className="group relative h-[440px] sm:h-[480px] rounded-[2rem] overflow-hidden cursor-pointer border border-white/10 hover:border-[#00ABB8]/60 transition-all duration-300 shadow-2xl flex flex-col justify-between p-7 select-none"
            >
              {/* BACKGROUND IMAGE WITH DUOTONE / OVERLAY */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={pillar.image}
                  alt={pillar.alt}
                  fill
                  className="object-cover grayscale brightness-50 group-hover:scale-105 group-hover:brightness-65 transition-all duration-500"
                  unoptimized
                />
                {/* DARK GRADIENT OVERLAY WITH CYAN ACCENT GLOW AT BOTTOM ON HOVER */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90 group-hover:to-[#00ABB8]/50 transition-colors duration-500" />
              </div>

              {/* TOP NUMBER INDICATOR */}
              <div className="relative z-10 text-center">
                <span className="text-xs font-mono font-bold tracking-widest text-slate-300 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                  {pillar.number}
                </span>
              </div>

              {/* CENTER TITLE & ARROW CTA (MATCHING REFERENCE IMAGE) */}
              <div className="relative z-10 text-center space-y-5 my-auto">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading group-hover:text-[#00C4D4] transition-colors">
                  {pillar.title}
                </h3>

                <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto text-white group-hover:bg-[#00ABB8] group-hover:text-white transition-all duration-300 shadow-md">
                  <Icon name="ArrowRight" size={20} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* BOTTOM SUBTITLE DESCRIPTION */}
              <div className="relative z-10 text-center pt-2">
                <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2 leading-relaxed">
                  {pillar.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
