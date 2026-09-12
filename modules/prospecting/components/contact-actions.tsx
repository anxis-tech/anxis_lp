'use client'
import { Mail, MessageCircle } from 'lucide-react'
import { buttonClass } from './shared'
export function ContactActions({
  onContact,
  compact = false,
}: {
  onContact: (channel: 'WhatsApp' | 'E-mail') => void
  compact?: boolean
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        className={buttonClass}
        title="WhatsApp — integração não configurada"
        aria-label="Contato por WhatsApp"
        onClick={() => onContact('WhatsApp')}
      >
        <MessageCircle size={14} />
        {!compact && 'WhatsApp'}
      </button>
      <button
        type="button"
        className={buttonClass}
        title="E-mail — integração não configurada"
        aria-label="Contato por e-mail"
        onClick={() => onContact('E-mail')}
      >
        <Mail size={14} />
        {!compact && 'E-mail'}
      </button>
    </div>
  )
}
