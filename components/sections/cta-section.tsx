'use client'

import { motion } from 'motion/react'
import { Icon } from '@/components/ui/hugeicons'
import { AnxisIcon } from '@/components/ui/anxis-logo'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
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
    <section className="py-16 sm:py-24 bg-[#FAFBFC] relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* BOXED OUTER WARM CARD CONTAINER */}
      <div className="max-w-7xl mx-auto bg-gradient-to-br from-[#FFF7ED]/80 via-[#FFFFFF] to-[#EFF6FF]/90 rounded-[20px] p-8 sm:p-12 lg:p-16 border border-orange-200/60 shadow-2xl shadow-slate-900/5 relative overflow-hidden text-[#2f2f2f] min-h-[500px] flex flex-col justify-between">
        {/* TECHNICAL BLUEPRINT GRID OVERLAY & MULTI-COLOR AURORA GLOWS */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[20px]">
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#0099FF]/15 via-[#FF6B00]/15 to-[#00C968]/15 rounded-full blur-[170px]" />
          <div className="absolute inset-0 bg-[radial-gradient(#FF6B00_1.2px,transparent_1.2px)] [background-size:36px_36px] opacity-[0.05]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>

        {/* CENTER 3D BRAND LOGO BEACON */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-25 sm:opacity-40">
          <motion.div
            animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[260px] sm:w-[320px] aspect-square relative flex items-center justify-center"
          >
            <AnxisIcon size={240} className="drop-shadow-[0_20px_60px_rgba(255,107,0,0.25)]" />
          </motion.div>
        </div>

        {/* TOP LAYOUT: SPLIT LEFT Persuasive vs RIGHT Big Title */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          {/* TOP LEFT PERSUASIVE TITLE */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <span className="text-xs font-mono uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-[20px] bg-white border border-slate-200 shadow-xs inline-block font-extrabold text-gradient-anxis">
              VAMOS TRABALHAR JUNTOS
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-[#2f2f2f] tracking-tight leading-[1.08] font-heading max-w-xl">
              Desenvolvimento Digital que Impulsiona
            </h2>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-lg">
              Transforme a presença da sua empresa com sites e e-commerces desenvolvidos sob medida para vender mais, engajar visitantes e escalar com segurança.
            </p>
          </div>

          {/* TOP RIGHT HEADLINE */}
          <div className="lg:col-span-6 text-left lg:text-right pt-4 lg:pt-0">
            <h3 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#2f2f2f] tracking-tight leading-[1.05] font-heading">
              Resultados Reais <br className="hidden sm:inline" />
              <span className="text-gradient-anxis">para sua Empresa.</span>
            </h3>
          </div>
        </div>

        {/* BOTTOM LAYOUT: METRIC BADGES ON LEFT VS ACTION BUTTONS ON RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end relative z-10 pt-12">
          {/* BOTTOM LEFT: 2 TRANSLUCENT GLASS METRIC BADGES */}
          <div className="lg:col-span-6 flex flex-wrap sm:flex-nowrap items-center gap-4">
            <div className="bg-white/90 backdrop-blur-md rounded-[20px] p-4 border border-slate-200/90 shadow-lg space-y-0.5 flex-1 min-w-[160px]">
              <div className="text-2xl font-black text-[#2f2f2f] font-heading">+90%</div>
              <div className="text-xs text-slate-600 font-semibold">Mais Velocidade & Conversão</div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-[20px] p-4 border border-slate-200/90 shadow-lg space-y-0.5 flex-1 min-w-[160px]">
              <div className="text-2xl font-black text-emerald-600 font-heading">5x</div>
              <div className="text-xs text-slate-600 font-semibold">Maior Capacidade de Escala</div>
            </div>
          </div>

          {/* BOTTOM RIGHT: ACTION BUTTONS ROW */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-start lg:justify-end gap-4">
            <button
              type="button"
              onClick={scrollToContact}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[20px] text-base font-extrabold text-white bg-[#ffa337] hover:bg-[#e6902b] shadow-xl shadow-orange-500/20 transition-all duration-200 active:scale-[0.98] cursor-pointer group"
            >
              <span>Solicitar uma Proposta</span>
              <Icon name="ArrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('click_whatsapp', { location: 'final_cta' })}
              className="inline-flex items-center justify-center px-7 py-4 rounded-[20px] text-base font-bold text-[#2f2f2f] bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-md cursor-pointer gap-2"
            >
              <WhatsAppIcon className="w-5 h-5 text-[#25D366] fill-current" />
              <span>Chamar no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
