'use client'

import { Icon } from '@/components/ui/hugeicons'
import { trackEvent } from '@/lib/analytics/events'

export function AboutSection() {
  const pillars = [
    {
      icon: 'ShieldCheck',
      title: 'Design Autoral Exclusivo',
      description: 'Criamos layouts sob medida para destacar a autoridade e essência da sua marca, sem templates genéricos.',
    },
    {
      icon: 'Gauge',
      title: 'Desempenho & Velocidade',
      description: 'Código limpo e otimizado com pontuação máxima no Google PageSpeed e carregamento ultra-rápido.',
    },
    {
      icon: 'Zap',
      title: 'Foco Total em Conversão',
      description: 'Arquitetura de informação planejada para guiar visitantes até o pedido de orçamento ou compra.',
    },
    {
      icon: 'Layers',
      title: 'Suporte & Escalabilidade',
      description: 'Integrações seguras com plataformas, ERPs, gateways de pagamento e acompanhamento técnico.',
    },
  ]

  const scrollToContact = () => {
    trackEvent('click_primary_cta', { location: 'about_section' })
    const el = document.querySelector('#contato')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="sobre" className="py-24 sm:py-32 bg-[#FFFFFF] text-[#293233] relative overflow-hidden border-b border-slate-200/80">
      {/* Subtle Background Geometric Accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#00ABB8]/5 rounded-full blur-3xl pointer-events-none transform -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-slate-100 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* CENTERED HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-20">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#00ABB8] bg-[#00ABB8]/10 px-4 py-1.5 rounded-[20px] border border-[#00ABB8]/20 inline-block">
            SOBRE A ANXIS
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#293233] tracking-tight leading-tight">
            Soluções digitais desenvolvidas para transformar o seu negócio.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            A ANXIS é uma agência especializada em desenvolvimento web de alta performance. Desenvolvemos sites institucionais, e-commerces completos e sistemas personalizados com foco em velocidade, usabilidade e resultados mensuráveis.
          </p>
        </div>

        {/* PILLARS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-8 rounded-[20px] bg-[#F8FAFC] border border-slate-200/90 hover:border-[#00ABB8]/50 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-[14px] bg-[#00ABB8]/10 border border-[#00ABB8]/20 flex items-center justify-center text-[#00939E] group-hover:bg-[#00ABB8] group-hover:text-white transition-all duration-300">
                  <Icon name={pillar.icon} size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#293233] group-hover:text-[#00939E] transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CENTERED CTA */}
        <div className="text-center">
          <button
            type="button"
            onClick={scrollToContact}
            className="inline-flex items-center justify-center px-8 py-4 rounded-[20px] text-base font-extrabold text-white bg-gradient-to-r from-[#209686] via-[#25ab99] to-[#2cd1bb] hover:opacity-95 shadow-xl shadow-teal-500/25 transition-all duration-200 active:scale-[0.98] cursor-pointer group"
          >
            <span>Falar com um especialista</span>
            <Icon name="ArrowRight" size={18} className="ml-2.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  )
}
