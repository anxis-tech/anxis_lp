'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { formatWhatsAppLink } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface WhatsAppButtonProps {
  whatsapp?: string
}

export function WhatsAppButton({ whatsapp = '5511999999999' }: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) return null

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
      className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      aria-label="Atendimento via WhatsApp"
    >
      <MessageSquare className="w-6 h-6 fill-current" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
        Falar no WhatsApp
      </span>
    </a>
  )
}
