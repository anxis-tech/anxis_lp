'use client'

import { Icon } from '@/components/ui/hugeicons'
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
    <section className="py-24 bg-[#00ABB8] text-[#293233] relative overflow-hidden">
      {/* Background Geometric Rings & Abstract Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-[35px] border-[#293233]" />
        <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-[35px] border-white" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#293233] text-white text-xs font-extrabold tracking-wider uppercase shadow-md">
          <Icon name="Sparkles" size={14} className="text-[#00C4D4]" />
          <span>VAMOS TRABALHAR JUNTOS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#293233] tracking-tight leading-tight max-w-4xl mx-auto">
          Vamos estruturar o próximo projeto digital da sua empresa?
        </h2>

        <p className="text-lg sm:text-xl text-[#293233]/90 font-medium max-w-2xl mx-auto leading-relaxed">
          Conte brevemente o que você precisa e receba uma orientação inicial sem compromisso sobre a melhor estrutura técnica para o seu projeto.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={scrollToContact}
            className="w-full sm:w-auto inline-flex items-center justify-center px-9 py-4.5 rounded-xl text-base font-extrabold text-white bg-[#293233] hover:bg-[#1E2526] shadow-2xl transition-all duration-200 cursor-pointer active:scale-[0.98] group"
          >
            <span>Solicitar uma proposta</span>
            <Icon name="ArrowRight" size={18} className="ml-2.5 transition-transform group-hover:translate-x-1" />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('click_whatsapp', { location: 'final_cta' })}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4.5 rounded-xl text-base font-bold text-[#293233] bg-white/90 hover:bg-white border border-[#293233]/20 transition-all shadow-md cursor-pointer"
          >
            <Icon name="MessageSquare" size={18} className="mr-2 text-emerald-600" />
            <span>Chamar no WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
}
