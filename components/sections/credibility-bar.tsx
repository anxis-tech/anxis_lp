import { ShieldCheck, Smartphone, Gauge, Layers } from 'lucide-react'

export function CredibilityBar() {
  const indicators = [
    {
      icon: ShieldCheck,
      title: 'Projetos Personalizados',
      description: 'Interfaces exclusivas adaptadas aos objetivos da empresa',
    },
    {
      icon: Smartphone,
      title: 'Soluções Responsivas',
      description: 'Experiência impecável em smartphones, tablets e desktop',
    },
    {
      icon: Gauge,
      title: 'Foco em Desempenho',
      description: 'Código otimizado e carregamento veloz para converter mais',
    },
    {
      icon: Layers,
      title: 'Integrações & Suporte',
      description: 'Conexão com plataformas, ERPs, APIs e suporte contínuo',
    },
  ]

  return (
    <section id="credibilidade" className="bg-[#081D3A] text-white py-8 border-y border-[#0075FF]/20 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {indicators.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#0075FF]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0075FF]/20 flex items-center justify-center text-[#168CFF] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{item.title}</h3>
                  <p className="text-xs text-[#BBC4D1] leading-relaxed mt-0.5">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
