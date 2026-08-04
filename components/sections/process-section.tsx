import { Search, Compass, Palette, Code2, CheckSquare, Rocket, Headphones } from 'lucide-react'

export function ProcessSection() {
  const steps = [
    {
      number: '01',
      icon: Search,
      title: 'Diagnóstico',
      description: 'Entendimento do negócio, do público, dos objetivos e da estrutura necessária.',
    },
    {
      number: '02',
      icon: Compass,
      title: 'Planejamento',
      description: 'Definição das páginas, funcionalidades, tecnologias e prioridades.',
    },
    {
      number: '03',
      icon: Palette,
      title: 'Design',
      description: 'Criação da interface com foco em clareza, identidade visual e experiência.',
    },
    {
      number: '04',
      icon: Code2,
      title: 'Desenvolvimento',
      description: 'Implementação responsiva, integrações e configuração das funcionalidades.',
    },
    {
      number: '05',
      icon: CheckSquare,
      title: 'Revisão',
      description: 'Testes, ajustes, validação do conteúdo e revisão das principais jornadas.',
    },
    {
      number: '06',
      icon: Rocket,
      title: 'Publicação',
      description: 'Configuração do ambiente, domínio, rastreamento e lançamento.',
    },
    {
      number: '07',
      icon: Headphones,
      title: 'Acompanhamento',
      description: 'Suporte inicial e orientação para utilização da solução.',
    },
  ]

  return (
    <section id="processo" className="py-24 bg-[#F7F8FA] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0075FF] bg-[#0075FF]/10 px-3.5 py-1.5 rounded-full border border-[#0075FF]/20">
            PROCESSO TRANSPARENTE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0C1D36] tracking-tight">
            Um processo claro do planejamento ao lançamento.
          </h2>
          <p className="text-base sm:text-lg text-[#596579] font-normal leading-relaxed">
            Metodologia organizada em etapas para garantir previsibilidade, prazo e qualidade em cada entrega.
          </p>
        </div>

        {/* TIMELINE GRID */}
        <div className="relative">
          {/* Connecting Line Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#0075FF] via-[#168CFF] to-[#081D3A] transform -translate-y-12 z-0 opacity-20" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const IconComponent = step.icon
              return (
                <div
                  key={idx}
                  className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#0075FF]/40 transition-all duration-300 relative flex flex-col justify-between"
                >
                  <div>
                    {/* STEP NUMBER & ICON */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-[#0075FF]/10 border border-[#0075FF]/20 flex items-center justify-center text-[#0075FF]">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-black text-[#657184]/40 group-hover:text-[#0075FF] transition-colors">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#0C1D36] mb-2">
                      {step.title}
                    </h3>

                    <p className="text-xs text-[#596579] leading-relaxed">
                      {step.description}
                    </p>
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
