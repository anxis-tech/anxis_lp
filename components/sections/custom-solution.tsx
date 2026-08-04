'use client'

import { Code2, ArrowRight, CheckCircle2, Terminal } from 'lucide-react'
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
    <section className="py-24 bg-gradient-to-b from-[#FFFFFF] to-[#F7F8FA] relative overflow-hidden border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#081D3A] rounded-3xl p-8 sm:p-12 lg:p-16 text-white relative overflow-hidden shadow-2xl border border-[#0075FF]/30">
          {/* Background Decorative Beam */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#0075FF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* LEFT CONTENT */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0075FF]/20 text-[#168CFF] text-xs font-bold uppercase tracking-wider border border-[#0075FF]/30">
                <Terminal className="w-3.5 h-3.5" />
                <span>DESENVOLVIMENTO EM CÓDIGO</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Seu projeto não se encaixa em uma solução pronta?
              </h2>

              <p className="text-base sm:text-lg text-[#BBC4D1] font-normal leading-relaxed">
                Desenvolvemos interfaces, integrações, painéis e funcionalidades personalizadas em código (Next.js, React, Node) para necessidades específicas de negócio.
              </p>

              {/* CHECKLIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {examples.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#0075FF] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={scrollToContact}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-lg hover:shadow-glow-blue transition-all duration-200"
                >
                  <span>Conversar sobre um projeto personalizado</span>
                  <ArrowRight className="w-5 h-5 ml-2.5" />
                </button>
              </div>
            </div>

            {/* RIGHT GRAPHIC: MODULAR CODE INTERFACE BUILDER */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-[#0B2F63] border border-[#BBC4D1]/20 rounded-2xl p-6 shadow-2xl space-y-4 font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-400">custom-architecture.ts</span>
                </div>

                <div className="space-y-2 text-[11px] leading-relaxed">
                  <p><span className="text-[#0075FF]">export const</span> <span className="text-amber-400">CustomApp</span> = {'{'}</p>
                  <p className="pl-4">stack: [<span className="text-emerald-400">'Next.js'</span>, <span className="text-emerald-400">'TypeScript'</span>, <span className="text-emerald-400">'Supabase'</span>],</p>
                  <p className="pl-4">security: <span className="text-emerald-400">'Enterprise Grade RLS'</span>,</p>
                  <p className="pl-4">performance: <span className="text-amber-400">99.8</span>,</p>
                  <p className="pl-4">integrations: [<span className="text-emerald-400">'ERP'</span>, <span className="text-emerald-400">'Payment Gateway'</span>, <span className="text-emerald-400">'CRM'</span>],</p>
                  <p>{'}'}</p>
                </div>

                <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[10px] text-[#BBC4D1]">
                  <div className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#0075FF]" />
                    <span>Clean Code & Modular Architecture</span>
                  </div>
                  <span className="text-emerald-400 font-bold">READY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
