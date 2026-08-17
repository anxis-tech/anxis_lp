'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Project } from '@/types/database.types'
import { INITIAL_PROJECTS } from '@/lib/constants/initial-data'
import { ExternalLink, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface HeroProjectCarouselProps {
  projects?: Project[]
}

export function HeroProjectCarousel({ projects = INITIAL_PROJECTS }: HeroProjectCarouselProps) {
  const visibleProjects = projects.filter((p) => p.is_visible)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  // Autoplay cycle every 4.5s unless user is hovering
  useEffect(() => {
    if (isHovered || visibleProjects.length <= 1) return

    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % visibleProjects.length)
    }, 4500)

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isHovered, visibleProjects.length])

  if (!visibleProjects || visibleProjects.length === 0) return null

  return (
    <div
      className="relative w-full max-w-7xl mx-auto pt-2 sm:pt-4 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* COVER FLOW CAROUSEL CONTAINER WITH BALANCED VERTICAL HIERARCHY */}
      <div className="relative h-[340px] sm:h-[430px] md:h-[490px] flex items-center justify-center overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]">
        <div className="relative w-full h-full flex items-center justify-center">
          {visibleProjects.map((project, idx) => {
            // Calculate relative offset in circular array
            let diff = idx - activeIndex
            const count = visibleProjects.length

            if (diff > count / 2) diff -= count
            if (diff < -count / 2) diff += count

            const isActive = diff === 0
            const isPrev1 = diff === -1
            const isNext1 = diff === 1
            const isPrev2 = diff === -2
            const isNext2 = diff === 2

            // Clean format for browser URL
            const cleanUrl = project.project_url
              ? project.project_url.replace(/^https?:\/\//, '').replace(/\/$/, '')
              : `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`

            // Dynamic transforms based on position
            // Symmetrical vertical hierarchy: active card extends smoothly above and below
            let xOffset = '0%'
            let scale = 1
            let zIndex = 30
            let opacity = 1
            let rotateY = 0

            if (isActive) {
              xOffset = '0%'
              scale = 1.08
              zIndex = 30
              opacity = 1
              rotateY = 0
            } else if (isPrev1) {
              xOffset = '-42%'
              scale = 0.88
              zIndex = 20
              opacity = 1
              rotateY = 5
            } else if (isNext1) {
              xOffset = '42%'
              scale = 0.88
              zIndex = 20
              opacity = 1
              rotateY = -5
            } else if (isPrev2) {
              xOffset = '-74%'
              scale = 0.74
              zIndex = 10
              opacity = 1
              rotateY = 8
            } else if (isNext2) {
              xOffset = '74%'
              scale = 0.74
              zIndex = 10
              opacity = 1
              rotateY = -8
            } else if (diff < -2) {
              xOffset = '-102%'
              scale = 0.62
              zIndex = 0
              opacity = 0
              rotateY = 12
            } else {
              xOffset = '102%'
              scale = 0.62
              zIndex = 0
              opacity = 0
              rotateY = -12
            }

            return (
              <motion.div
                key={project.id}
                onClick={() => {
                  if (!isActive) {
                    setActiveIndex(idx)
                    trackEvent('hero_carousel_select', { project: project.title })
                  }
                }}
                animate={{
                  x: xOffset,
                  scale,
                  zIndex,
                  opacity,
                  rotateY,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.25, 1, 0.5, 1],
                }}
                style={{
                  perspective: 1200,
                  transformOrigin: 'center center',
                  willChange: 'transform, opacity',
                }}
                className={cn(
                  'absolute w-[300px] sm:w-[460px] md:w-[560px] aspect-[16/10.5] rounded-[20px] select-none',
                  isActive ? 'cursor-default' : 'cursor-pointer'
                )}
              >
                {/* MAC BROWSER WINDOW WRAPPER */}
                <div
                  className={cn(
                    'w-full h-full rounded-[20px] flex flex-col transition-all duration-500 overflow-hidden bg-[#11131A]',
                    isActive
                      ? 'border border-slate-700/80 shadow-[0_12px_28px_-8px_rgba(15,23,42,0.12)]'
                      : 'border border-slate-800'
                  )}
                >
                  {/* MACOS BROWSER TOP BAR */}
                  <div className="h-8 sm:h-9 px-3 sm:px-4 bg-[#161822] border-b border-white/10 flex items-center justify-between shrink-0 select-none">
                    {/* MACOS 3 WINDOW CONTROL DOTS */}
                    <div className="flex items-center gap-1.5 w-12 sm:w-16">
                      <span
                        className={cn(
                          'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors',
                          isActive ? 'bg-[#FF5F56]' : 'bg-slate-600'
                        )}
                      />
                      <span
                        className={cn(
                          'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors',
                          isActive ? 'bg-[#FFBD2E]' : 'bg-slate-600'
                        )}
                      />
                      <span
                        className={cn(
                          'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors',
                          isActive ? 'bg-[#27C93F]' : 'bg-slate-600'
                        )}
                      />
                    </div>

                    {/* ADDRESS BAR CAPSULE */}
                    <div className="flex-1 max-w-[200px] sm:max-w-[280px] mx-auto">
                      <div className="bg-[#1F2230] border border-white/10 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 flex items-center justify-center gap-1.5">
                        <Globe
                          className={cn(
                            'w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 transition-colors',
                            isActive ? 'text-[#FF2D78]' : 'text-slate-500'
                          )}
                        />
                        <span className="text-[9px] sm:text-[11px] font-mono text-slate-300 truncate font-medium">
                          https://{cleanUrl}
                        </span>
                      </div>
                    </div>

                    {/* RIGHT SPACER FOR BALANCE */}
                    <div className="w-12 sm:w-16 flex justify-end" />
                  </div>

                  {/* SCREENSHOT VIEWPORT */}
                  <div className="relative flex-1 w-full overflow-hidden bg-slate-950">
                    <Image
                      src={project.desktop_image_url}
                      alt={project.image_alt || project.title}
                      fill
                      sizes="(max-width: 768px) 300px, 560px"
                      className={cn(
                        'object-cover object-top transition-all duration-500',
                        isActive
                          ? 'grayscale-0 contrast-105 brightness-100 scale-100'
                          : 'grayscale contrast-[0.85] brightness-[0.75] scale-100'
                      )}
                      unoptimized
                    />

                    {/* SUBTLE DARKENING OVERLAY ON INACTIVE CARDS */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-slate-950/20 transition-opacity duration-300 pointer-events-none" />
                    )}

                    {/* FLOATING FROSTED GLASS BADGE (ONLY ON ACTIVE CARD) */}
                    {isActive && (
                      <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-3 sm:bottom-3 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-[16px] p-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-3 shadow-md shadow-black/30">
                          <div className="space-y-0.5 max-w-[68%] min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] uppercase bg-white/10 px-2 py-0.5 rounded-[8px] border border-white/15 inline-block">
                              {project.category}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate font-heading drop-shadow-xs">
                              {project.title}
                            </h4>
                          </div>

                          <a
                            href={project.project_url || '#contato'}
                            target={project.open_new_tab ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation()
                              trackEvent('click_project_hero', { title: project.title })
                            }}
                            className="px-3.5 py-1.5 rounded-[12px] bg-white text-[#0F172A] hover:bg-slate-100 active:scale-95 text-[11px] font-bold shadow transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <span>Acessar</span>
                            <ExternalLink className="w-3 h-3 text-[#0F172A]" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* BOTTOM PAGINATION DOTS INDICATOR WITH CLEAN SEPARATION */}
      <div className="flex items-center justify-center gap-2 pt-4 sm:pt-6">
        {visibleProjects.map((_, dotIdx) => (
          <button
            key={dotIdx}
            type="button"
            onClick={() => setActiveIndex(dotIdx)}
            aria-label={`Ir para projeto ${dotIdx + 1}`}
            className={cn(
              'h-2 rounded-[10px] transition-all duration-300 cursor-pointer',
              dotIdx === activeIndex
                ? 'w-7 bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] shadow-xs'
                : 'w-2 bg-slate-300 hover:bg-slate-400'
            )}
          />
        ))}
      </div>
    </div>
  )
}





