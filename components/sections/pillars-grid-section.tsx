'use client'

import Image from 'next/image'
import { Icon } from '@/components/ui/hugeicons'
import { trackEvent } from '@/lib/analytics/events'

export function PillarsGridSection() {
  const pillars = [
    {
      number: '01',
      title: 'Design UI/UX',
      subtitle: 'Interfaces autorais, responsivas e focadas na melhor experiência do usuário.',
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
    {
      number: '05',
      title: 'Branding & Identidade',
      subtitle: 'Criação de marcas marcantes, logotipos, guias de estilo e identidade visual autoral.',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
      alt: 'Branding e criação de identidade visual na ANXIS',
    },
  ]

  const scrollToContact = (title: string) => {
    trackEvent('click_primary_cta', { location: 'pillar_card', title })
    const el = document.querySelector('#contato')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="servicos" className="w-full bg-gradient-to-b from-[#FFFFFF] via-[#FFFDF8] to-[#F8FAFC] text-[#0F172A] py-20 sm:py-28 border-y border-slate-200/80 relative overflow-hidden">
      {/* Ambient warm background glows */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[500px] bg-[#FF6B00]/6 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[400px] bg-[#00C968]/6 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full relative z-10 space-y-8">
        {/* HEADER BAR ALIGNED WITH STANDARD PAGE WIDTH (MAX-W-7XL) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-200/80 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-gradient-anxis bg-white px-3.5 py-1 rounded-full border border-slate-200 shadow-xs">
                NOSSOS SERVIÇOS
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="text-slate-600 font-sans text-xs font-medium">Soluções digitais de alta conversão</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-sans font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>5 Especialidades Digitais</span>
            </div>
          </div>
        </div>

        {/* 5 CARDS GRID STRETCHING CLOSE TO SCREEN EDGES */}
        <div className="w-full max-w-[99%] mx-auto px-2 sm:px-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                onClick={() => scrollToContact(pillar.title)}
                className="group relative h-[420px] sm:h-[470px] rounded-3xl overflow-hidden cursor-pointer border border-slate-200/90 hover:border-slate-300 transition-all duration-300 shadow-xl hover:shadow-2xl flex flex-col justify-between p-6 select-none bg-slate-900"
              >
                {/* BACKGROUND IMAGE WITH DUOTONE / OVERLAY */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={pillar.image}
                    alt={pillar.alt}
                    fill
                    className="object-cover brightness-65 group-hover:scale-105 group-hover:brightness-75 transition-all duration-500"
                    unoptimized
                  />
                  {/* DARK GRADIENT OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/90 transition-colors duration-500" />
                </div>

                {/* TOP NUMBER INDICATOR */}
                <div className="relative z-10 text-center">
                  <span className="text-xs font-mono font-bold tracking-widest text-white bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-sm">
                    {pillar.number}
                  </span>
                </div>

                {/* CENTER TITLE & ARROW CTA */}
                <div className="relative z-10 text-center space-y-4 my-auto">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading group-hover:text-white transition-colors leading-tight">
                    {pillar.title}
                  </h3>

                  {/* ARROW CIRCLE WITH MULTI-COLOR BRAND GRADIENT ON HOVER */}
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto text-white group-hover:bg-gradient-to-r group-hover:from-[#FF6B00] group-hover:via-[#00C968] group-hover:to-[#0099FF] group-hover:border-transparent group-hover:shadow-lg transition-all duration-300 shadow-md">
                    <Icon name="ArrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* BOTTOM SUBTITLE DESCRIPTION */}
                <div className="relative z-10 text-center pt-2">
                  <p className="text-xs text-slate-200 font-medium line-clamp-3 leading-relaxed">
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
