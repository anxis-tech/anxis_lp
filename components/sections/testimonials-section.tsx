'use client'

import { useState } from 'react'
import { Testimonial } from '@/types/database.types'
import { INITIAL_TESTIMONIALS } from '@/lib/constants/initial-data'
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react'

interface TestimonialsSectionProps {
  testimonials?: Testimonial[]
}

export function TestimonialsSection({
  testimonials = INITIAL_TESTIMONIALS,
}: TestimonialsSectionProps) {
  const visibleItems = testimonials.filter((t) => t.is_visible)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Automatically hide section if no visible testimonials exist
  if (!visibleItems || visibleItems.length === 0) {
    return null
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? visibleItems.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === visibleItems.length - 1 ? 0 : prev + 1))
  }

  const current = visibleItems[currentIndex]

  return (
    <section className="py-24 bg-white relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0075FF] bg-[#0075FF]/10 px-3.5 py-1.5 rounded-full border border-[#0075FF]/20">
            DEPOIMENTOS DE CLIENTES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0C1D36] tracking-tight">
            O que dizem os parceiros da ANXIS.
          </h2>
        </div>

        {/* TESTIMONIAL DISPLAY */}
        <div className="max-w-4xl mx-auto bg-[#F7F8FA] rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm relative">
          <Quote className="w-12 h-12 text-[#0075FF]/20 absolute top-8 left-8 pointer-events-none" />

          <div className="relative z-10 space-y-6 text-center sm:text-left">
            <div className="flex justify-center sm:justify-start gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>

            <p className="text-lg sm:text-2xl text-[#0C1D36] font-medium leading-relaxed italic">
              "{current.content}"
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div>
                <h4 className="text-base font-bold text-[#0C1D36]">{current.name}</h4>
                <p className="text-xs text-[#596579]">
                  {current.role ? `${current.role} - ` : ''}
                  <span className="font-semibold text-[#0075FF]">{current.company}</span>
                </p>
              </div>

              {/* NAVIGATION BUTTONS */}
              {visibleItems.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#0075FF] hover:bg-slate-50 transition-colors"
                    aria-label="Depoimento anterior"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#0C1D36]" />
                  </button>
                  <span className="text-xs font-semibold text-[#596579] px-2">
                    {currentIndex + 1} / {visibleItems.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#0075FF] hover:bg-slate-50 transition-colors"
                    aria-label="Próximo depoimento"
                  >
                    <ChevronRight className="w-5 h-5 text-[#0C1D36]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
