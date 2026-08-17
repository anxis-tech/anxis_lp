'use client'

import { Icon } from '@/components/ui/hugeicons'
import { trackEvent } from '@/lib/analytics/events'

export function CustomSolution() {
  const examples = [
    'Integrações avançadas com APIs REST & Webhooks',
    'Painéis administrativos e dashboards sob medida',
    'Calculadoras de preços e simuladores interativos',
    'Catálogos técnicos e sistemas de orçamento',
    'Áreas restritas de membros e portais de clientes',
    'Integração direta com ERPs, CRMs e meios de pagamento',
    'Automações de fluxos de trabalho e notificações',
    'Funcionalidades exclusivas para e-commerce de alto volume',
  ]

  const scrollToContact = () => {
    trackEvent('click_primary_cta', { location: 'custom_solution' })
    const el = document.querySelector('#contato')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-24 bg-[#FFFFFF] text-[#2f2f2f] relative overflow-hidden border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#F0F7FF]/90 via-[#FFFFFF] to-[#EFF6FF]/90 rounded-[20px] p-8 sm:p-12 lg:p-16 text-[#2f2f2f] relative overflow-hidden shadow-2xl shadow-slate-900/5 border border-blue-200/60">
          {/* Background Decorative Ambient Glows */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#086ec5]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#086ec5]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* LEFT CONTENT */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[20px] bg-white text-[#086ec5] text-xs font-extrabold uppercase tracking-wider border border-slate-200 shadow-xs">
                <Icon name="Terminal" size={14} className="text-[#086ec5]" />
                <span>DESENVOLVIMENTO EM CÓDIGO</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2f2f2f] tracking-tight leading-tight font-heading">
                Seu projeto precisa de uma solução sob medida?
              </h2>

              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                Desenvolvemos interfaces, integrações, painéis e funcionalidades personalizadas em código (Next.js, React, Node) para regras de negócio específicas.
              </p>

              {/* CHECKLIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {examples.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                    <div className="w-4 h-4 rounded-full bg-[#086ec5] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Icon name="Check" size={10} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={scrollToContact}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[20px] text-base font-extrabold text-white bg-gradient-to-r from-[#086ec5] to-[#0a7ee0] hover:opacity-95 shadow-xl shadow-blue-600/25 transition-all duration-200 cursor-pointer group"
                >
                  <span>Conversar sobre um projeto personalizado</span>
                  <Icon name="ArrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* RIGHT GRAPHIC: MODULAR CODE INTERFACE BUILDER (AUTHENTIC TERMINAL) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-[20px] p-6 shadow-2xl space-y-4 font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-400">custom-architecture.ts</span>
                </div>

                <div className="space-y-2 text-[11px] leading-relaxed">
                  <p><span className="text-[#0099FF]">export const</span> <span className="text-[#FF6B00] font-bold">CustomApp</span> = {'{'}</p>
                  <p className="pl-4">stack: [<span className="text-emerald-400">'Next.js'</span>, <span className="text-emerald-400">'TypeScript'</span>, <span className="text-emerald-400">'Supabase'</span>],</p>
                  <p className="pl-4">security: <span className="text-amber-400">'Enterprise Grade RLS'</span>,</p>
                  <p className="pl-4">performance: <span className="text-emerald-400">99.8</span>,</p>
                  <p className="pl-4">integrations: [<span className="text-[#0099FF]">'ERP'</span>, <span className="text-[#0099FF]">'Payment Gateway'</span>, <span className="text-[#0099FF]">'CRM'</span>],</p>
                  <p>{'}'}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Icon name="Code2" size={14} className="text-emerald-400" />
                    <span>Clean Code & Modular Architecture</span>
                  </div>
                  <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-[20px] border border-emerald-800">READY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
