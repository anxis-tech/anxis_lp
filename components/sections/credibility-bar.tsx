'use client'

import { Icon } from '@/components/ui/hugeicons'

export function CredibilityBar() {
  const indicators = [
    {
      icon: 'ShieldCheck',
      title: 'Projetos Personalizados',
      description: 'Interfaces exclusivas adaptadas aos objetivos da empresa',
    },
    {
      icon: 'Smartphone',
      title: 'Soluções Responsivas',
      description: 'Experiência impecável em smartphones, tablets e desktop',
    },
    {
      icon: 'Gauge',
      title: 'Foco em Desempenho',
      description: 'Código otimizado e carregamento veloz para converter mais',
    },
    {
      icon: 'Layers',
      title: 'Integrações & Suporte',
      description: 'Conexão com plataformas, ERPs, APIs e suporte contínuo',
    },
  ]

  return (
    <section id="credibilidade" className="bg-[#293233] text-white py-10 border-y border-white/10 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {indicators.map((item, idx) => {
            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-2xl bg-[#1E2526] border border-white/10 hover:border-[#00ABB8]/50 transition-colors shadow-lg"
              >
                <div className="w-11 h-11 rounded-xl bg-[#00ABB8]/15 border border-[#00ABB8]/30 flex items-center justify-center text-[#00C4D4] shrink-0">
                  <Icon name={item.icon} size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-wide">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
