'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/hugeicons'
import { cn } from '@/lib/utils'

interface ProcessStep {
  number: string
  title: string
  duration: string
  icon: string
  description: string
  deliverables: string[]
  accentGradient: string
  glowColor: string
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    number: '01',
    title: 'Briefing & Diagnóstico Estratégico',
    duration: '1 a 2 dias',
    icon: 'MessageSquare',
    description:
      'Começamos com uma conversa rápida e estratégica para alinhar seus objetivos comerciais, público-alvo, referências visuais e requisitos técnicos. É aqui que definimos o direcionamento ideal para o projeto.',
    deliverables: ['Documento de Requisitos', 'Definição de Escopo', 'Cronograma de Entrega'],
    accentGradient: 'from-[#00ABB8] to-[#086ec5]',
    glowColor: 'rgba(0, 171, 184, 0.3)',
  },
  {
    number: '02',
    title: 'Arquitetura & Estrutura de Conteúdo',
    duration: '2 a 3 dias',
    icon: 'Layers',
    description:
      'Reunimos e organizamos todo o conteúdo, textos persuasivos, hierarquia das seções e imagens. Desenhamos o mapa do site para que cada elemento guie o visitante naturalmente até a conversão.',
    deliverables: ['Sitemap & Hierarquia', 'Copywriting & Textos', 'Estrutura Wireframe'],
    accentGradient: 'from-[#086ec5] to-[#00C968]',
    glowColor: 'rgba(8, 110, 197, 0.3)',
  },
  {
    number: '03',
    title: 'Design UI/UX & Protótipo Navegável',
    duration: '4 a 6 dias',
    icon: 'Sparkles',
    description:
      'Criamos a interface visual exclusiva no Figma, desenvolvendo uma experiência moderna, elegante e alinhada à sua marca. Você recebe um link interativo para navegar e validar cada tela antes de iniciarmos o código.',
    deliverables: ['Design Desktop & Mobile', 'Protótipo Interativo Figma', 'Guia Visual de Cores & Tipografia'],
    accentGradient: 'from-[#00C968] to-[#00ABB8]',
    glowColor: 'rgba(0, 201, 104, 0.3)',
  },
  {
    number: '04',
    title: 'Desenvolvimento em Código & Integrações',
    duration: '5 a 10 dias',
    icon: 'Code2',
    description:
      'Transformamos o design aprovado em código limpo, ultrarrápido e responsivo com Next.js ou nas melhores plataformas de e-commerce. Configuramos conexões com WhatsApp, formulários, CRMs e rastreamento de anúncios.',
    deliverables: ['Código Otimizado & Limpo', 'Integrações de Conversão', 'Rastreamento de UTMs & Meta Pixel'],
    accentGradient: 'from-[#00ABB8] to-[#086ec5]',
    glowColor: 'rgba(0, 171, 184, 0.3)',
  },
  {
    number: '05',
    title: 'Homologação, Testes 90+ & Lançamento',
    duration: '1 a 2 dias',
    icon: 'ShieldCheck',
    description:
      'Realizamos testes rigorosos de performance (Google PageSpeed 90+), segurança com SSL, responsividade em múltiplos aparelhos e apontamento de domínio. Seu projeto entra no ar com garantia e suporte total.',
    deliverables: ['Score 90+ PageSpeed', 'Domínio & Certificado SSL Ativos', 'Suporte Pós-Lançamento'],
    accentGradient: 'from-[#00C968] to-[#00ABB8]',
    glowColor: 'rgba(0, 201, 104, 0.3)',
  },
]

export function ProcessSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineWrapperRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [trackGeometry, setTrackGeometry] = useState<{ top: number; height: number }>({
    top: 36,
    height: 1000,
  })

  useEffect(() => {
    const updateProgressAndTrack = () => {
      if (!timelineWrapperRef.current || stepRefs.current.length === 0) return

      const wrapperRect = timelineWrapperRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      const firstStep = stepRefs.current[0]
      const lastStep = stepRefs.current[stepRefs.current.length - 1]
      if (!firstStep || !lastStep) return

      const firstRect = firstStep.getBoundingClientRect()
      const lastRect = lastStep.getBoundingClientRect()

      // Node center offset: top-6 (24px) + half of w-6 (12px) = 36px from step card top
      const nodeCenterOffset = 36

      const lineTop = firstRect.top - wrapperRect.top + nodeCenterOffset
      const lineBottom = lastRect.top - wrapperRect.top + nodeCenterOffset
      const totalTrackHeight = Math.max(lineBottom - lineTop, 1)

      setTrackGeometry({
        top: lineTop,
        height: totalTrackHeight,
      })

      // Reading trigger point in viewport (around 45% height)
      const triggerViewportY = windowHeight * 0.45
      const currentScrollAlongTrack = triggerViewportY - (firstRect.top + nodeCenterOffset)
      const progress = Math.min(Math.max(currentScrollAlongTrack / totalTrackHeight, 0), 1)
      setScrollProgress(progress)

      // Exact pixel position of the beam tip
      const currentBeamY = lineTop + progress * totalTrackHeight

      let activeIndex = 0
      stepRefs.current.forEach((el, index) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        const nodeY = r.top - wrapperRect.top + nodeCenterOffset

        if (currentBeamY >= nodeY - 6) {
          activeIndex = index
        }
      })

      setActiveStepIndex(activeIndex)
    }

    window.addEventListener('scroll', updateProgressAndTrack, { passive: true })
    window.addEventListener('resize', updateProgressAndTrack, { passive: true })
    updateProgressAndTrack()

    return () => {
      window.removeEventListener('scroll', updateProgressAndTrack)
      window.removeEventListener('resize', updateProgressAndTrack)
    }
  }, [])

  return (
    <section
      id="processo"
      ref={containerRef}
      className="relative bg-[#090D16] text-[#F8FAFC] py-24 sm:py-32 border-b border-slate-800/80"
    >
      {/* ATMOSPHERIC BACKGROUND GLOWS WRAPPER */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-[#00ABB8]/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-[#086ec5]/8 rounded-full blur-[180px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00C968]/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-16 sm:space-y-20">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-[#00ABB8]/30 shadow-lg shadow-[#00ABB8]/5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00ABB8] animate-pulse" />
            <span className="text-xs font-mono font-extrabold uppercase tracking-[0.2em] text-[#00ABB8]">
              METODOLOGIA & PROCESSO
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-heading leading-[1.15]">
            Entenda o{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ABB8] via-[#00C968] to-[#086ec5]">
              processo de desenvolvimento
            </span>{' '}
            do seu projeto
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Um processo simples, transparente e estruturado, pensado para manter tudo claro, eficiente e tranquilo do
            início ao fim.
          </p>
        </div>

        {/* ZIG-ZAG TIMELINE CONTAINER */}
        <div ref={timelineWrapperRef} className="relative space-y-12 sm:space-y-16">
          {/* CENTRAL CONTINUOUS VERTICAL CONNECTING TRACK RAIL */}
          {/* Left on mobile (< md), exactly Center on desktop (md+) */}
          <div
            className="absolute left-4 md:left-1/2 -translate-x-1/2 w-[2px] bg-slate-800/80 rounded-full pointer-events-none"
            style={{
              top: `${trackGeometry.top}px`,
              height: `${trackGeometry.height}px`,
            }}
            aria-hidden="true"
          >
            {/* GLOWING FILL BEAM DRIVEN BY SCROLL */}
            <div
              className="w-full bg-gradient-to-b from-[#00ABB8] via-[#086ec5] to-[#00C968] rounded-full shadow-[0_0_14px_#00ABB8] transition-all duration-150 ease-out"
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>

          {/* ALTERNATING ZIG-ZAG STEP CARDS */}
          {PROCESS_STEPS.map((step, idx) => {
            const isEven = idx % 2 === 0
            const isActive = activeStepIndex === idx
            const isReached = idx <= activeStepIndex
            const isPassed = idx < activeStepIndex

            return (
              <div
                key={step.number}
                ref={(el) => {
                  stepRefs.current[idx] = el
                }}
                className="relative flex items-center group scroll-mt-36"
              >
                {/* CENTRAL MILESTONE BULLET NODE ON THE RAIL */}
                <div
                  className={cn(
                    'absolute left-4 md:left-1/2 -translate-x-1/2 top-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-20',
                    isActive
                      ? 'border-[#00ABB8] bg-[#00ABB8] shadow-[0_0_20px_#00ABB8] ring-4 ring-[#00ABB8]/25 scale-115'
                      : isPassed
                      ? 'border-[#00C968] bg-[#00C968] shadow-[0_0_10px_#00C968]'
                      : isReached
                      ? 'border-[#00ABB8] bg-[#00ABB8] shadow-[0_0_14px_#00ABB8]'
                      : 'border-slate-700 bg-slate-900'
                  )}
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors duration-300',
                      isActive
                        ? 'bg-white shadow-xs'
                        : isPassed
                        ? 'bg-slate-950'
                        : isReached
                        ? 'bg-white'
                        : 'bg-slate-600'
                    )}
                  />
                </div>

                {/* ZIG-ZAG STEP CARD */}
                {/* Mobile: pl-10. Desktop: Left side if isEven, Right side if !isEven */}
                <div
                  className={cn(
                    'w-full pl-10 md:pl-0',
                    isEven
                      ? 'md:w-[calc(50%-36px)] md:mr-auto'
                      : 'md:w-[calc(50%-36px)] md:ml-auto'
                  )}
                >
                  <div
                    className={cn(
                      'relative rounded-[24px] sm:rounded-[28px] backdrop-blur-xl border p-6 sm:p-7 space-y-4 transition-all duration-500 shadow-xl shadow-black/25',
                      isActive
                        ? 'border-[#00ABB8]/50 shadow-2xl shadow-[#00ABB8]/15 bg-slate-900/95 scale-[1.01]'
                        : isReached
                        ? 'border-slate-800 bg-slate-900/85 hover:border-slate-700'
                        : 'border-slate-800/60 bg-slate-900/60 opacity-80 hover:opacity-100 hover:border-slate-700/80'
                    )}
                  >
                    {/* CARD TOP META */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 pb-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-xs font-mono font-black px-3 py-1 rounded-full border transition-colors',
                            isActive
                              ? 'text-[#00ABB8] bg-[#00ABB8]/15 border-[#00ABB8]/40 shadow-xs'
                              : isReached
                              ? 'text-[#00C968] bg-[#00C968]/10 border-[#00C968]/30'
                              : 'text-slate-400 bg-slate-800/60 border-slate-700/60'
                          )}
                        >
                          ETAPA {step.number}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00C968]" />
                        <span>Estimativa: {step.duration}</span>
                      </div>
                    </div>

                    {/* CARD TITLE & ICON */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300',
                          isActive
                            ? 'bg-[#00ABB8]/20 border-[#00ABB8]/50 text-[#00ABB8] shadow-[0_0_14px_rgba(0,171,184,0.35)]'
                            : isReached
                            ? 'bg-slate-800/90 border-[#00C968]/40 text-[#00C968]'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
                        )}
                      >
                        <Icon name={step.icon} size={20} />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-white font-heading">
                          {step.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* DELIVERABLES PILLS */}
                    <div className="pt-1 space-y-1.5">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        O que entregamos nesta etapa:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {step.deliverables.map((item, dIdx) => (
                          <div
                            key={dIdx}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-950/70 border border-slate-800 text-slate-200"
                          >
                            <Icon name="Check" size={12} className="text-[#00C968] shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
