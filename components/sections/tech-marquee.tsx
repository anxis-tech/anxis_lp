'use client'

import { Technology } from '@/types/database.types'
import { INITIAL_TECHNOLOGIES } from '@/lib/constants/initial-data'

interface TechMarqueeProps {
  technologies?: Technology[]
}

export function TechMarquee({ technologies = INITIAL_TECHNOLOGIES }: TechMarqueeProps) {
  const visibleTechs = technologies.filter((t) => t.is_visible)

  // Duplicate items for seamless continuous marquee loop
  const marqueeItems = [...visibleTechs, ...visibleTechs, ...visibleTechs, ...visibleTechs]

  return (
    <section className="py-6 sm:py-8 bg-[#FFFFFF] text-[#0F172A] relative overflow-hidden border-b border-slate-200/80">
      {/* Side Fade Gradients */}
      <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-white via-white/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-white via-white/80 to-transparent z-20 pointer-events-none" />

      {/* Subtle Title Badge */}
      <div className="text-center mb-4">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-400">
          Tecnologias & Plataformas Parceiras
        </span>
      </div>

      {/* CONTINUOUS LOGOS MARQUEE LOOP */}
      <div className="flex overflow-hidden select-none">
        <div className="animate-marquee-left flex items-center gap-10 sm:gap-14 py-2">
          {marqueeItems.map((tech, idx) => (
            <div
              key={`m-${tech.id}-${idx}`}
              className="flex items-center gap-3 px-3 py-1.5 rounded-[20px] border border-transparent hover:border-slate-200 hover:bg-slate-50/80 transition-all duration-300 group shrink-0 cursor-pointer"
            >
              <div className="w-7 h-7 relative flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110">
                <img
                  src={tech.logo_url}
                  alt={tech.image_alt || tech.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-slate-500 group-hover:text-slate-900 font-heading tracking-tight transition-colors">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
