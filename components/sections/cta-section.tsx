'use client'

import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react'
import { formatWhatsAppLink } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface CTASectionProps {
  whatsapp?: string
}

export function CTASection({ whatsapp = '5511999999999' }: CTASectionProps) {
  const whatsappUrl = formatWhatsAppLink(
    whatsapp,
    'Olá! Gostaria de conversar com um especialista da ANXIS sobre o meu projeto.'
  )

  const scrollToContact = () => {
    trackEvent('click_primary_cta', { location: 'final_cta' })
    const el = document.querySelector('#contato')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-20 bg-[#081D3A] text-white relative overflow-hidden border-t border-[#0075FF]/30">
      {/* Background Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#0075FF]/20 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0075FF]/20 text-[#168CFF] text-xs font-bold uppercase tracking-wider border border-[#0075FF]/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>VAMOS COMEÇAR SEU PROJETO</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Vamos estruturar o próximo projeto digital da sua empresa?
        </h2>

        <p className="text-base sm:text-lg text-[#BBC4D1] font-normal max-w-2xl mx-auto leading-relaxed">
          Conte brevemente o que você precisa e receba uma orientação inicial sem compromisso sobre a melhor estrutura técnica para o projeto.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={scrollToContact}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-lg hover:shadow-glow-blue transition-all duration-200"
          >
            <span>Solicitar uma proposta</span>
            <ArrowRight className="w-5 h-5 ml-2.5" />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('click_whatsapp', { location: 'final_cta' })}
            className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 rounded-xl text-base font-semibold text-white bg-[#0B2F63] hover:bg-slate-800 border border-[#BBC4D1]/30 transition-all shadow-sm"
          >
            <MessageSquare className="w-5 h-5 mr-2 text-emerald-400" />
            <span>Chamar no WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
}
