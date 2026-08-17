'use client'

export function BlueprintPillarsSection() {
  const steps = [
    {
      number: '01',
      title: 'Análise & Diagnóstico',
      description: 'Estudamos seu mercado, concorrentes e público-alvo para desenhar a melhor estratégia e arquitetura técnica.',
    },
    {
      number: '02',
      title: 'Otimização & Estrutura',
      description: 'Aplicamos as melhores práticas de código, carregamento veloz, SEO técnico e usabilidade focada em conversão.',
    },
    {
      number: '03',
      title: 'Métricas & Escala',
      description: 'Acompanhamos os resultados em tempo real para refinar estratégias, escalar o tráfego e multiplicar o ROI.',
    },
  ]

  return (
    <section className="bg-[#FFFFFF] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* BOXED BLUEPRINT CONTAINER (MATCHING REFERENCE IMAGE EXACTLY) */}
      <div className="max-w-7xl mx-auto bg-[#293233] rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl relative overflow-hidden text-white space-y-12">
        {/* TECHNICAL BLUEPRINT CROSSHAIRS & GRID LINES */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
          <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-[#00ABB8]/15 rounded-full blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(#00C4D4_1.2px,transparent_1.2px)] [background-size:48px_48px] opacity-[0.15]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:6rem_6rem]" />
        </div>

        {/* SECTION HEADER INSIDE BOX */}
        <div className="text-center max-w-3xl mx-auto space-y-3 relative z-10">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#00C4D4] font-bold">
            estratégias digitais & alta performance
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-heading leading-tight">
            Estratégias Digitais para Impulsionar sua Presença e Vendas
          </h2>
        </div>

        {/* 3-COLUMN MINIMALIST STEP GRID DIVIDED BY BLUEPRINT GRID LINES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {steps.map((step, idx) => (
            <div key={idx} className="pt-6 md:pt-0 md:px-8 first:pl-0 last:pr-0 space-y-4 text-center">
              {/* LARGE OUTLINED NUMBER TEXT (MATCHING REFERENCE IMAGE 01, 02, 03) */}
              <div className="text-6xl sm:text-7xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-b from-white/90 to-white/20 tracking-tighter">
                {step.number}
              </div>

              {/* TITLE */}
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-heading">
                {step.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
