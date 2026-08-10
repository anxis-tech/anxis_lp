'use client'

import { useState } from 'react'
import { Testimonial } from '@/types/database.types'
import { INITIAL_TESTIMONIALS } from '@/lib/constants/initial-data'
import { Icon } from '@/components/ui/hugeicons'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

interface TestimonialsSectionProps {
  testimonials?: Testimonial[]
}

export function TestimonialsSection({
  testimonials = INITIAL_TESTIMONIALS,
}: TestimonialsSectionProps) {
  const visibleItems = testimonials.filter((t) => t.is_visible)
  const [currentIndex, setCurrentIndex] = useState(0)

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
    <section className="py-24 sm:py-32 bg-[#FFFFFF] text-[#07090E] relative border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#00ABB8] bg-[#00ABB8]/10 px-4 py-1.5 rounded-full border border-[#00ABB8]/20 inline-block">
            DEPOIMENTOS & AVALIAÇÕES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#07090E] tracking-tight">
            O que dizem os nossos parceiros
          </h2>
        </div>

        {/* TESTIMONIAL DISPLAY */}
        <div className="max-w-4xl mx-auto bg-[#F8FAFC] rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl relative">
          <div className="relative z-10 space-y-6 text-center sm:text-left">
            <div className="flex justify-center sm:justify-start gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>

            <p className="text-lg sm:text-2xl text-[#07090E] font-medium leading-relaxed italic">
              "{current.content}"
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
              <div>
                <h4 className="text-base font-extrabold text-[#07090E]">{current.name}</h4>
                <p className="text-xs text-slate-600">
                  {current.role ? `${current.role} - ` : ''}
                  <span className="font-bold text-[#00939E]">{current.company}</span>
                </p>
              </div>

              {/* NAVIGATION BUTTONS */}
              {visibleItems.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-3 rounded-xl bg-white border border-slate-300 hover:border-[#00ABB8] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    aria-label="Depoimento anterior"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#07090E]" />
                  </button>
                  <span className="text-xs font-bold text-slate-600 px-3">
                    {currentIndex + 1} / {visibleItems.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-3 rounded-xl bg-white border border-slate-300 hover:border-[#00ABB8] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    aria-label="Próximo depoimento"
                  >
                    <ChevronRight className="w-5 h-5 text-[#07090E]" />
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
