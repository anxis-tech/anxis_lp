'use client'

import { Icon } from '@/components/ui/hugeicons'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProcessSection() {
  const steps = [
    {
      stepBadge: 'Passo 01',
      title: 'Briefing & Diagnóstico',
      icon: 'FileText',
      description: 'Alinhamento de objetivos, estudo do negócio, público-alvo e levantamento de requisitos para a estrutura técnica.',
      badgeGradient: 'from-[#FF6B00] to-[#FFB800]',
      iconBg: 'bg-orange-500/10 text-[#FF6B00] group-hover:bg-[#FF6B00]',
      borderColor: 'group-hover:border-orange-400',
    },
    {
      stepBadge: 'Passo 02',
      title: 'Prototipagem UI/UX',
      icon: 'Layers',
      description: 'Criação do visual e protótipo interativo da interface, focando na usabilidade, navegabilidade e alta conversão.',
      badgeGradient: 'from-[#00C968] to-[#10B981]',
      iconBg: 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600',
      borderColor: 'group-hover:border-emerald-400',
    },
    {
      stepBadge: 'Passo 03',
      title: 'Validação & Ajustes',
      icon: 'ShieldCheck',
      description: 'Apresentação detalhada da prototipagem para validação com o cliente, permitindo refinamentos antes da codificação.',
      badgeGradient: 'from-[#C4E000] to-[#EAB308]',
      iconBg: 'bg-lime-500/10 text-lime-700 group-hover:bg-lime-600',
      borderColor: 'group-hover:border-lime-400',
    },
    {
      stepBadge: 'Passo 04',
      title: 'Desenvolvimento & Lançamento',
      icon: 'Code2',
      description: 'Implementação da aplicação em código limpo de alta performance (Next.js/React), otimização SEO e lançamento.',
      badgeGradient: 'from-[#0099FF] to-[#0284C7]',
      iconBg: 'bg-sky-500/10 text-[#0099FF] group-hover:bg-[#0099FF]',
      borderColor: 'group-hover:border-[#0099FF]',
    },
  ]

  return (
    <section id="processo" className="py-24 sm:py-32 bg-[#FAFBFC] text-[#0F172A] relative border-b border-slate-200/80 overflow-hidden">
      {/* Multi-color ambient background glows */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#0099FF]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#FF6B00]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16 sm:space-y-20">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#0099FF] bg-[#0099FF]/10 px-4 py-1.5 rounded-[20px] border border-[#0099FF]/20 inline-block font-bold">
            METODOLOGIA & PROCESSO
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2f2f2f] tracking-tight font-heading">
            Nosso Processo de Criação
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Fluxo estruturado do briefing inicial ao desenvolvimento final para garantir previsão de entrega, transparência e alta qualidade técnica.
          </p>
        </div>

        {/* STEP TRAIL PROCESS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6 relative">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1

            return (
              <div key={idx} className="relative group text-center space-y-5">
                {/* CONNECTING FORWARD ARROW BETWEEN NODES (DESKTOP ONLY) */}
                {!isLast && (
                  <div className="hidden lg:flex items-center justify-center absolute top-12 -right-4 w-8 z-0 text-slate-300 pointer-events-none">
                    <ArrowRight className="w-5 h-5 text-slate-300/80 stroke-[1.5]" />
                  </div>
                )}

                {/* LARGE ICON CONTAINER WITH COLORFUL SERIAL BADGE */}
                <div className={cn(
                  'relative w-24 h-24 sm:w-28 sm:h-28 rounded-[20px] bg-white shadow-xl shadow-slate-200/60 border border-slate-200/80 flex items-center justify-center mx-auto group-hover:scale-105 transition-all duration-300',
                  step.borderColor
                )}>
                  {/* SERIAL BADGE WITH STEP-SPECIFIC BRAND GRADIENT */}
                  <span className={cn(
                    'absolute -top-1.5 -right-1.5 bg-gradient-to-r text-white text-[10px] font-black font-mono px-2.5 py-0.5 rounded-[20px] shadow-md',
                    step.badgeGradient
                  )}>
                    {step.stepBadge}
                  </span>

                  {/* LINE VECTOR ICON */}
                  <div className={cn(
                    'w-12 h-12 rounded-[14px] flex items-center justify-center group-hover:text-white transition-all duration-300',
                    step.iconBg
                  )}>
                    <Icon name={step.icon} size={24} />
                  </div>
                </div>

                {/* STEP TITLE & DESCRIPTION */}
                <div className="space-y-2 max-w-xs mx-auto">
                  <h3 className="text-lg sm:text-xl font-bold text-[#2f2f2f] font-heading group-hover:text-slate-900 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
