'use client'

import { ServiceItem } from '@/types/database.types'
import { INITIAL_SERVICES } from '@/lib/constants/initial-data'
import { Globe, Zap, ShoppingBag, RefreshCw, Code2, Cpu, Check, ArrowUpRight } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/events'

const ICON_MAP: Record<string, any> = {
  Globe,
  Zap,
  ShoppingBag,
  RefreshCw,
  Code2,
  Cpu,
}

interface ServicesSectionProps {
  services?: ServiceItem[]
  title?: string
  description?: string
}

export function ServicesSection({
  services = INITIAL_SERVICES,
  title = 'Soluções digitais para diferentes momentos da sua empresa.',
  description = 'Da criação de uma presença institucional à implementação de uma operação completa de e-commerce.',
}: ServicesSectionProps) {
  const visibleServices = services.filter((s) => s.is_visible)

  const scrollToContact = () => {
    const el = document.querySelector('#contato')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="servicos" className="py-24 bg-[#F7F8FA] relative overflow-hidden">
      {/* Background Geometric Accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#0075FF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#081D3A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0075FF] bg-[#0075FF]/10 px-3.5 py-1.5 rounded-full border border-[#0075FF]/20">
            NOSSOS SERVIÇOS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0C1D36] tracking-tight">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-[#596579] font-normal leading-relaxed">
            {description}
          </p>
        </div>

        {/* SERVICES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleServices.map((service) => {
            const IconComponent = ICON_MAP[service.icon] || Globe

            return (
              <div
                key={service.id}
                className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-slate-200/80 hover:border-[#0075FF]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Geometric Chevron Accent on Hover */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-[#0075FF]/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div>
                  {/* ICON */}
                  <div className="w-14 h-14 rounded-xl bg-[#0075FF]/10 border border-[#0075FF]/20 flex items-center justify-center text-[#0075FF] group-hover:bg-[#0075FF] group-hover:text-white transition-colors duration-300 mb-6">
                    <IconComponent className="w-7 h-7" />
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <h3 className="text-xl font-bold text-[#0C1D36] group-hover:text-[#0075FF] transition-colors mb-3">
                    {service.title}
                  </h3>
                  <p className="text-sm text-[#596579] leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* BENEFITS LIST */}
                  {service.benefits && service.benefits.length > 0 && (
                    <ul className="space-y-2.5 mb-8 border-t border-slate-100 pt-6">
                      {service.benefits.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5 text-xs font-medium text-[#0C1D36]">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* LINK / CTA */}
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('click_primary_cta', { location: `service_${service.id}` })
                    scrollToContact()
                  }}
                  className="inline-flex items-center text-xs font-bold text-[#0075FF] group-hover:text-[#168CFF] pt-2 transition-all"
                >
                  <span>Solicitar projeto</span>
                  <ArrowUpRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
