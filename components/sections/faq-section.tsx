'use client'

import { useState } from 'react'
import { FAQItem } from '@/types/database.types'
import { INITIAL_FAQS } from '@/lib/constants/initial-data'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQSectionProps {
  faqs?: FAQItem[]
  title?: string
  description?: string
}

export function FAQSection({
  faqs = INITIAL_FAQS,
  title = 'Perguntas Frequentes',
  description = 'Tire suas dúvidas sobre nosso processo de desenvolvimento, prazos, plataformas e suporte.',
}: FAQSectionProps) {
  const visibleFaqs = faqs.filter((f) => f.is_visible)
  const [openId, setOpenId] = useState<string | null>(visibleFaqs[0]?.id || null)

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  // Generate JSON-LD Schema.org for Google FAQPage
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: visibleFaqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <section id="faq" className="py-24 bg-[#F7F8FA] relative">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0075FF] bg-[#0075FF]/10 px-3.5 py-1.5 rounded-full border border-[#0075FF]/20">
            DÚVIDAS FREQUENTES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0C1D36] tracking-tight">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-[#596579] font-normal leading-relaxed">
            {description}
          </p>
        </div>

        {/* ACCORDION LIST */}
        <div className="space-y-4">
          {visibleFaqs.map((faq) => {
            const isOpen = openId === faq.id

            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-[#0C1D36] hover:text-[#0075FF] transition-colors focus:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-[#0075FF] shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-[#596579] shrink-0 transition-transform duration-300',
                      isOpen ? 'transform rotate-180 text-[#0075FF]' : ''
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-[#596579] leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
