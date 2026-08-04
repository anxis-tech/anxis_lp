import { Target, Smartphone, Code, Compass, Zap, Link, Edit3, LifeBuoy, Lightbulb } from 'lucide-react'

export function Differentiators() {
  const items = [
    {
      icon: Target,
      title: 'Estrutura Focada em Conversão',
      description: 'Hierarquia visual e gatilhos de decisão planejados para conduzir o visitante ao contato.',
    },
    {
      icon: Smartphone,
      title: 'Desenvolvimento 100% Responsivo',
      description: 'Experiência adaptada sem quebras em smartphones, tablets e telas widescreen.',
    },
    {
      icon: Code,
      title: 'Código Limpo e Organizado',
      description: 'Sem acúmulo de plugins desnecessários, garantindo segurança e facilidade de manutenção.',
    },
    {
      icon: Compass,
      title: 'Arquitetura da Informação',
      description: 'Navegação intuitiva que permite ao seu cliente encontrar o que precisa em poucos cliques.',
    },
    {
      icon: Zap,
      title: 'Desempenho e Otimização',
      description: 'Carregamento veloz que reduz a taxa de rejeição e melhora o posicionamento no Google.',
    },
    {
      icon: Link,
      title: 'Integrações com Ferramentas',
      description: 'Conexão com CRMs, automações de e-mail, meios de pagamento e pixels de campanha.',
    },
    {
      icon: Edit3,
      title: 'Autonomia para Atualizações',
      description: 'Painel simples e intuitivo para atualizar conteúdos, imagens e banner com facilidade.',
    },
    {
      icon: LifeBuoy,
      title: 'Suporte Técnico Dedicado',
      description: 'Acompanhamento próximo durante o desenvolvimento e suporte garantido no pós-lançamento.',
    },
    {
      icon: Lightbulb,
      title: 'Orientação Estratégica',
      description: 'Recomendação sincera da melhor plataforma ou tecnologia para o momento atual da empresa.',
    },
  ]

  return (
    <section id="diferenciais" className="py-24 bg-[#081D3A] text-white relative overflow-hidden border-t border-[#0075FF]/20">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#0075FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#168CFF]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0075FF] bg-[#0075FF]/20 px-3.5 py-1.5 rounded-full border border-[#0075FF]/30">
            DIFERENCIAIS ANXIS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Mais do que um layout visualmente bonito.
          </h2>
          <p className="text-base sm:text-lg text-[#BBC4D1] font-normal leading-relaxed">
            Unimos engenharia de software, usabilidade e estratégia comercial para entregar soluções digitais completas.
          </p>
        </div>

        {/* MODULAR GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const IconComponent = item.icon
            return (
              <div
                key={idx}
                className="bg-[#0B2F63]/60 backdrop-blur-md border border-[#BBC4D1]/15 hover:border-[#0075FF]/60 p-7 rounded-2xl transition-all duration-300 group hover:-translate-y-1 shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0075FF]/20 border border-[#0075FF]/30 flex items-center justify-center text-[#168CFF] group-hover:bg-[#0075FF] group-hover:text-white transition-colors duration-300 mb-5">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#168CFF] transition-colors mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[#BBC4D1] leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
