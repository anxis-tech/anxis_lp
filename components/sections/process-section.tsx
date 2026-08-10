'use client'

import { Icon } from '@/components/ui/hugeicons'

export function ProcessSection() {
  const steps = [
    {
      number: '01',
      icon: 'Filter',
      title: 'Diagnóstico',
      description: 'Entendimento detalhado do negócio, público-alvo, objetivos e estrutura técnica necessária.',
    },
    {
      number: '02',
      icon: 'Terminal',
      title: 'Planejamento',
      description: 'Definição precisa do mapa do site, funcionalidades, integração com plataformas e cronograma.',
    },
    {
      number: '03',
      icon: 'Sparkles',
      title: 'Design Autoral',
      description: 'Criação de interface exclusiva com foco na identidade visual, experiência do usuário e alta conversão.',
    },
    {
      number: '04',
      icon: 'Code2',
      title: 'Desenvolvimento',
      description: 'Implementação em código limpo, otimização de velocidade, SEO e testes de usabilidade.',
    },
    {
      number: '05',
      icon: 'Check',
      title: 'Revisão & Testes',
      description: 'Testes em múltiplos dispositivos, revisão de formulários e homologação final.',
    },
    {
      number: '06',
      icon: 'Globe',
      title: 'Lançamento & Suporte',
      description: 'Publicação oficial no domínio, configuração de métricas e acompanhamento pós-lançamento.',
    },
  ]

  return (
    <section id="processo" className="py-24 sm:py-32 bg-[#F8FAFC] text-[#07090E] relative border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#00ABB8] bg-[#00ABB8]/10 px-4 py-1.5 rounded-full border border-[#00ABB8]/20 inline-block">
            METODOLOGIA & PROCESSO
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#07090E] tracking-tight">
            Processo transparente do briefing ao lançamento
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Metodologia organizada em etapas bem definidas para garantir prazos cumpridos, previsibilidade e máxima qualidade.
          </p>
        </div>

        {/* STEPS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#00ABB8]/50 transition-all duration-300 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#00ABB8]/10 border border-[#00ABB8]/20 flex items-center justify-center text-[#00939E]">
                    <Icon name={step.icon} size={26} />
                  </div>
                  <span className="text-2xl font-black text-slate-300">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-[#07090E] mb-3">
                  {step.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
