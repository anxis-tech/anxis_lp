'use client'

import Image from 'next/image'
import { trackEvent } from '@/lib/analytics/events'

export function PillarsGridSection() {
  const pillars = [
    {
      number: '01',
      title: 'Sites e Lojas Virtuais',
      subtitle: 'Sites institucionais, landing pages e e-commerces completos em Tray, Nuvemshop e WooCommerce.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
      alt: 'Criação de sites e lojas virtuais na ANXIS',
    },
    {
      number: '02',
      title: 'Design UI/UX',
      subtitle: 'Interfaces autorais, responsivas e focadas na melhor experiência do usuário.',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800&auto=format&fit=crop',
      alt: 'UI/UX Design e prototipagem na ANXIS',
    },
    {
      number: '03',
      title: 'Performance & SEO',
      subtitle: 'Otimização de velocidade e dados para dominar as buscas do Google.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
      alt: 'Performance de carregamento e SEO',
    },
    {
      number: '04',
      title: 'Branding & Identidade',
      subtitle: 'Criação de marcas marcantes, logotipos, guias de estilo e identidade visual autoral.',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
      alt: 'Branding e criação de identidade visual na ANXIS',
    },
    {
      number: '05',
      title: 'Desenvolvimento',
      subtitle: 'Código limpo em Next.js, React e integrações de alta performance.',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
      alt: 'Desenvolvimento sob medida e código limpo',
    },
  ]

  const scrollToContact = (title: string) => {
    trackEvent('click_primary_cta', { location: 'pillar_card', title })
    const el = document.querySelector('#contato')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="servicos" className="w-full py-4 sm:py-6 px-[15px] bg-[#FFFFFF]">
      {/* FLOATING ROUNDED DARK CONTAINER (EXACTLY 15PX INSET FROM SCREEN EDGES ON ALL RESOLUTIONS) */}
      <div className="w-full bg-[#0B0F19] text-white py-20 sm:py-28 rounded-[28px] sm:rounded-[32px] relative overflow-hidden border border-slate-800/80">
        {/* VIVID RAINBOW ACCENT TOP & BOTTOM BORDERS */}
        <div
          className="absolute top-0 inset-x-0 h-[2.5px] z-20"
          style={{
            background: 'linear-gradient(90deg, rgba(0,212,255,0) 0%, #00D4FF 15%, #00F5A0 50%, #FFA033 85%, rgba(255,160,51,0) 100%)',
            boxShadow: '0 1px 12px rgba(0, 245, 160, 0.4)',
          }}
        />
        <div
          className="absolute bottom-0 inset-x-0 h-[2.5px] z-20"
          style={{
            background: 'linear-gradient(90deg, rgba(255,160,51,0) 0%, #FFA033 15%, #00F5A0 50%, #00D4FF 85%, rgba(0,212,255,0) 100%)',
            boxShadow: '0 -1px 12px rgba(0, 212, 255, 0.4)',
          }}
        />

        {/* SOPHISTICATED DARK TECH BACKGROUND & DOT MATRIX PATTERN (MATCHING HERO) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Dot matrix pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.25) 1.25px, transparent 1.25px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Ambient multi-chroma glows */}
          <div className="absolute -top-24 left-1/4 -translate-x-1/2 w-[700px] h-[500px] bg-[#086ec5]/12 rounded-full blur-[170px]" />
          <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-[650px] h-[450px] bg-[#059669]/10 rounded-full blur-[160px]" />
          <div className="absolute top-1/2 right-10 w-[450px] h-[350px] bg-[#F86533]/8 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10 sm:space-y-12">
          {/* HEADER BAR (RESTORED FORMAT WITH REFINED TYPOGRAPHY & SIZES) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-xs sm:text-[13px] font-extrabold uppercase tracking-widest text-[#0099FF] bg-[#0099FF]/10 px-4 py-1.5 rounded-[20px] border border-[#0099FF]/30 shadow-xs">
                NOSSOS SERVIÇOS
              </span>
              <span className="hidden sm:inline text-slate-600 font-bold">|</span>
              <span className="text-slate-200 font-sans text-sm sm:text-base font-semibold tracking-tight">
                Soluções digitais de alta conversão
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-300 font-sans font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span>5 Especialidades Digitais</span>
            </div>
          </div>

          {/* 5 CARDS GRID ALIGNED TO STANDARD 7XL CONTAINER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                onClick={() => scrollToContact(pillar.title)}
                className="group relative h-[430px] sm:h-[480px] rounded-[20px] overflow-hidden cursor-pointer border border-white/10 hover:border-[#0099FF]/60 transition-all duration-300 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,153,255,0.15)] flex flex-col justify-between p-6 select-none bg-slate-900/90 backdrop-blur-xs"
              >
                {/* BACKGROUND IMAGE WITH DUOTONE / OVERLAY */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={pillar.image}
                    alt={pillar.alt}
                    fill
                    className="object-cover brightness-65 group-hover:scale-105 group-hover:brightness-80 transition-all duration-500"
                    unoptimized
                  />
                  {/* DARK GRADIENT OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/95 group-hover:from-black/60 group-hover:to-black/90 transition-colors duration-500" />
                </div>

                {/* TOP NUMBER INDICATOR */}
                <div className="relative z-10 text-center">
                  <span className="text-xs font-mono font-bold tracking-widest text-white/90 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-[20px] border border-white/15 shadow-sm">
                    {pillar.number}
                  </span>
                </div>

                {/* CENTER TITLE */}
                <div className="relative z-10 text-center my-auto">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading group-hover:text-white transition-colors leading-tight">
                    {pillar.title}
                  </h3>
                </div>

                {/* BOTTOM SUBTITLE DESCRIPTION */}
                <div className="relative z-10 text-center pt-2">
                  <p className="text-xs sm:text-[13px] text-slate-300/90 font-medium line-clamp-3 leading-relaxed">
                    {pillar.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
