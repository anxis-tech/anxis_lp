'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Testimonial } from '@/types/database.types'
import { INITIAL_TESTIMONIALS } from '@/lib/constants/initial-data'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import { AnxisIcon } from '@/components/ui/anxis-logo'
import { cn, formatWhatsAppLink } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface TestimonialsSectionProps {
  testimonials?: Testimonial[]
  title?: React.ReactNode
  description?: string
  whatsapp?: string
}

export function TestimonialsSection({
  testimonials = INITIAL_TESTIMONIALS,
  title,
  description = 'Depoimentos e resultados de empresas e profissionais que transformaram sua presença digital e autoridade com nossos projetos sob medida.',
  whatsapp = '5584987147049',
}: TestimonialsSectionProps) {
  const visibleItems = testimonials.filter((t) => t.is_visible)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = next, -1 = prev
  const [isPaused, setIsPaused] = useState(false)

  const total = visibleItems.length

  const whatsappUrl = formatWhatsAppLink(
    whatsapp,
    'Olá ANXIS! Gostaria de realizar um orçamento para o meu projeto.'
  )

  const goToNext = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % total)
  }, [total])

  const goToPrev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  const goToIndex = (targetIdx: number) => {
    if (targetIdx === currentIndex) return
    setDirection(targetIdx > currentIndex ? 1 : -1)
    setCurrentIndex(targetIdx)
  }

  // Auto-play timer with pause on hover
  useEffect(() => {
    if (isPaused || total <= 1) return
    const timer = setInterval(() => {
      goToNext()
    }, 7000)
    return () => clearInterval(timer)
  }, [isPaused, total, goToNext])

  if (!visibleItems || total === 0) {
    return null
  }

  const current = visibleItems[currentIndex]

  // Compute 3 items for the left vertical queue: [prev, active, next]
  const prevIdx = (currentIndex - 1 + total) % total
  const nextIdx = (currentIndex + 1) % total

  // Vertical avatar stack items (top: prev, center: current, bottom: next)
  const avatarStack = [
    { index: prevIdx, item: visibleItems[prevIdx], position: 'prev' },
    { index: currentIndex, item: current, position: 'active' },
    { index: nextIdx, item: visibleItems[nextIdx], position: 'next' },
  ]

  return (
    <section
      id="depoimentos"
      className="py-24 sm:py-32 bg-[#FFFFFF] text-[#0F172A] relative overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* AMBIENT SOFT GLOWS */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#086ec5]/4 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[500px] bg-[#FF4D4D]/3 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-14 sm:space-y-18">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#FF4D4D] animate-pulse" />
            <span className="text-[11px] font-heading font-extrabold uppercase tracking-[0.2em] text-[#FF4D4D]">
              AVALIAÇÕES DE CLIENTES
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#1E293B] tracking-tight font-heading leading-[1.15]">
            {title || (
              <>
                Feedback honesto <br /> de quem confia na ANXIS
              </>
            )}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* ===== MAIN COMPOSITION: LEFT UNIFORM WIDTH AVATARS QUEUE + RIGHT TESTIMONIAL CARD ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
          {/* LEFT COLUMN: VERTICAL QUEUE (EXACT SAME WIDTH, DYNAMIC EXPANDING HEIGHT ON ACTIVE) */}
          <div className="lg:col-span-4 flex lg:flex-col items-center justify-center gap-3 sm:gap-4.5 overflow-hidden py-2 w-full">
            {avatarStack.map(({ index, item, position }) => {
              const isActive = position === 'active'

              return (
                <motion.div
                  key={`${item.id}-${position}`}
                  layout
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => goToIndex(index)}
                  className={cn(
                    // EXACT SAME WIDTH FOR ALL CARDS (W-FULL with MAX-W)
                    'relative w-[130px] sm:w-[170px] md:w-[190px] rounded-[22px] sm:rounded-[26px] overflow-hidden cursor-pointer select-none shrink-0 shadow-md group transition-all duration-500 flex flex-col items-center justify-between p-3.5 sm:p-5',
                    isActive
                      ? 'h-[170px] sm:h-[210px] md:h-[235px] border-2 border-[#086ec5] shadow-xl shadow-[#086ec5]/15 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#070A12] z-20'
                      : 'h-[80px] sm:h-[95px] md:h-[105px] border border-slate-200/80 bg-slate-50 hover:bg-slate-100 opacity-60 hover:opacity-100 z-10'
                  )}
                >
                  {/* Glowing background accent for active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-radial from-[#086ec5]/20 via-transparent to-transparent pointer-events-none" />
                  )}

                  {/* Centered ANXIS Logo Icon */}
                  <div className="flex-1 flex items-center justify-center relative z-10 w-full">
                    <AnxisIcon
                      size={isActive ? 52 : 32}
                      className={cn(
                        'transition-transform duration-500 drop-shadow-md',
                        isActive ? 'scale-105' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'
                      )}
                    />
                  </div>

                  {/* Name label */}
                  <div
                    className={cn(
                      'relative z-10 w-full text-center px-2 py-1 rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-white/15 backdrop-blur-md border border-white/20'
                        : 'bg-white/90 border border-slate-200/80 shadow-2xs'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-heading font-extrabold truncate block',
                        isActive ? 'text-white' : 'text-slate-800'
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* RIGHT COLUMN: 3D DEPTH TESTIMONIAL CARD */}
          <div className="lg:col-span-8 relative [perspective:1200px] w-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current.id}
                custom={direction}
                initial={{
                  opacity: 0,
                  scale: 0.93,
                  y: direction > 0 ? 30 : -30,
                  rotateX: direction > 0 ? -4 : 4,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  rotateX: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.93,
                  y: direction > 0 ? -30 : 30,
                  rotateX: direction > 0 ? 4 : -4,
                }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-full bg-[#FAFBFC] rounded-[28px] sm:rounded-[36px] p-7 sm:p-10 lg:p-12 border border-slate-200/90 shadow-xl shadow-slate-900/5 relative overflow-hidden flex flex-col justify-between min-h-[380px] sm:min-h-[420px]"
              >
                {/* GIANT WATERMARK QUOTATION MARK IN BACKGROUND */}
                <div
                  className="absolute -top-6 right-6 sm:right-10 text-slate-200/60 text-[160px] sm:text-[220px] font-serif font-black select-none pointer-events-none leading-none z-0"
                  aria-hidden="true"
                >
                  ”
                </div>

                <div className="relative z-10 space-y-4 sm:space-y-6">
                  {/* MAIN HEADLINE QUOTE */}
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1E293B] font-heading leading-tight tracking-tight">
                    {current.headline || `"${current.content.slice(0, 75)}..."`}
                  </h3>

                  {/* SECONDARY NARRATIVE CONTENT */}
                  <p className="text-sm sm:text-base text-slate-600 font-sans font-normal leading-relaxed max-w-2xl">
                    {current.content}
                  </p>
                </div>

                {/* BOTTOM AUTHOR, DIVIDER & RATING ROW */}
                <div className="relative z-10 pt-6 mt-6 border-t border-dashed border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Author & Role with ANXIS Avatar */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700/80 flex items-center justify-center shadow-sm shrink-0">
                        <AnxisIcon size={24} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-base sm:text-lg font-black text-[#1E293B] font-heading leading-tight">
                          {current.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 font-sans font-medium">
                          {current.role ? `${current.role}, ` : ''}
                          <span className="text-[#086ec5] font-semibold">{current.company}</span>
                        </p>
                      </div>
                    </div>

                    {/* 5-Star Rating in vibrant red/coral */}
                    <div className="flex items-center gap-1 text-[#FF4D4D]">
                      {[...Array(current.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>

                  {/* CONTROLS & PAGINATION ROW */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    {/* Indicators */}
                    <div className="flex items-center gap-1.5">
                      {visibleItems.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => goToIndex(idx)}
                          aria-label={`Ver depoimento ${idx + 1}`}
                          className={cn(
                            'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                            idx === currentIndex
                              ? 'w-7 bg-[#FF4D4D]'
                              : 'w-2 bg-slate-200 hover:bg-slate-300'
                          )}
                        />
                      ))}
                    </div>

                    {/* Prev / Next navigation buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goToPrev}
                        aria-label="Depoimento anterior"
                        className="w-9 h-9 rounded-full bg-white hover:bg-[#086ec5] text-slate-600 hover:text-white border border-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNext}
                        aria-label="Próximo depoimento"
                        className="w-9 h-9 rounded-full bg-white hover:bg-[#086ec5] text-slate-600 hover:text-white border border-slate-200 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ===== BOTTOM CTA BLOCK (CENTRALIZED BELOW TESTIMONIALS) ===== */}
        <div className="pt-6 sm:pt-10 text-center space-y-3.5 max-w-xl mx-auto flex flex-col items-center">
          <p className="text-xs sm:text-sm text-slate-500 font-sans font-medium">
            Pronto para transformar a presença digital da sua marca?
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('click_whatsapp', { location: 'testimonials_cta' })}
            className="inline-flex items-center justify-center gap-2.5 px-9 sm:px-12 py-4 rounded-full text-xs sm:text-sm font-heading font-black text-white bg-[#2f2f2f] hover:bg-[#1f1f1f] border border-[#2f2f2f]/10 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer uppercase tracking-wider group"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366] fill-current shrink-0 group-hover:scale-110 transition-transform" />
            <span>Realizar um orçamento</span>
          </a>
        </div>
      </div>
    </section>
  )
}
