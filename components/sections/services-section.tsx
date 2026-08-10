'use client'

import { ServiceItem } from '@/types/database.types'
import { INITIAL_SERVICES } from '@/lib/constants/initial-data'
import { Icon } from '@/components/ui/hugeicons'
import { trackEvent } from '@/lib/analytics/events'

interface ServicesSectionProps {
  services?: ServiceItem[]
  title?: string
  description?: string
}

export function ServicesSection({
  services = INITIAL_SERVICES,
  title = 'Soluções completas fim a fim para o seu negócio',
  description = 'Desenvolvemos a estrutura perfeita para cada fase da sua empresa.',
}: ServicesSectionProps) {
  const visibleServices = services.filter((s) => s.is_visible)

  const scrollToContact = () => {
    trackEvent('click_primary_cta', { location: 'services_section' })
    const el = document.querySelector('#contato')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="servicos" className="py-24 sm:py-32 bg-[#293233] text-white relative overflow-hidden">
      {/* BACKGROUND PATTERN & AMBIENT GLOW */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#00ABB8]/10 rounded-full blur-[180px]" />
        {/* Subtle Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#00ABB8_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-[0.08]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* CENTERED HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#00C4D4] bg-[#00ABB8]/15 px-4 py-1.5 rounded-full border border-[#00ABB8]/30 inline-block">
            NOSSOS SERVIÇOS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* 2-COLUMN MINIMALIST SERVICES GRID PERFECTLY ALIGNED */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-16 items-start">
          {visibleServices.map((service) => {
            return (
              <div
                key={service.id}
                onClick={scrollToContact}
                className="group flex items-start gap-5 cursor-pointer py-2 transition-all"
              >
                {/* ICON DIRECTLY ON THE LEFT (NO BOX FRAME, SIZE 36PX) */}
                <div className="text-[#00ABB8] group-hover:text-[#00C4D4] transition-colors shrink-0 mt-1">
                  <Icon name={service.icon} size={36} />
                </div>

                {/* TITLE & DESCRIPTION */}
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#00C4D4] transition-colors flex items-center gap-2">
                    <span>{service.title}</span>
                    <Icon name="ArrowUpRight" size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00C4D4]" />
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {service.description}
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
