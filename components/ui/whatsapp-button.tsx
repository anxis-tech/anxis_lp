'use client'

import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import { formatWhatsAppLink } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface WhatsAppButtonProps {
  whatsapp?: string
}

export function WhatsAppButton({ whatsapp = '5511999999999' }: WhatsAppButtonProps) {
  const whatsappUrl = formatWhatsAppLink(
    whatsapp,
    'Olá! Gostaria de tirar dúvidas sobre o desenvolvimento do meu site/loja virtual.'
  )

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('click_whatsapp', { location: 'floating_button' })}
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 sm:p-4 rounded-[20px] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      aria-label="Atendimento via WhatsApp"
    >
      <WhatsAppIcon className="w-6 h-6 fill-current" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
        Falar no WhatsApp
      </span>
    </a>
  )
}

