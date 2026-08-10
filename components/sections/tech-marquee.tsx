'use client'

import { Technology } from '@/types/database.types'
import { INITIAL_TECHNOLOGIES } from '@/lib/constants/initial-data'

interface TechMarqueeProps {
  technologies?: Technology[]
  title?: string
  description?: string
}

export function TechMarquee({
  technologies = INITIAL_TECHNOLOGIES,
  title = 'Tecnologias & Plataformas',
  description = 'Trabalhamos com as principais plataformas do mercado e desenvolvimento personalizado em código.',
}: TechMarqueeProps) {
  const visibleTechs = technologies.filter((t) => t.is_visible)

  // Split into two sets for row 1 and row 2
  const row1 = visibleTechs.slice(0, Math.ceil(visibleTechs.length / 2))
  const row2 = visibleTechs.slice(Math.ceil(visibleTechs.length / 2))

  // Repeat items for seamless continuous marquee loop
  const marqueeRow1 = [...row1, ...row1, ...row1, ...row1]
  const marqueeRow2 = [...row2, ...row2, ...row2, ...row2]

  return (
    <section id="tecnologias" className="py-16 bg-[#F8FAFC] text-[#293233] relative overflow-hidden border-b border-slate-200">
      {/* Side Fade Gradients */}
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#F8FAFC] to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#F8FAFC] to-transparent z-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#00939E] bg-[#00ABB8]/10 px-3.5 py-1 rounded-full border border-[#00ABB8]/20 inline-block">
          PLATAFORMAS & STACK
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#293233] mt-3 tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-slate-600 font-normal max-w-2xl mx-auto mt-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="space-y-4 overflow-hidden">
        {/* ROW 1: LEFT TO RIGHT */}
        <div className="flex overflow-hidden select-none">
          <div className="animate-marquee-left flex items-center gap-5">
            {marqueeRow1.map((tech, idx) => (
              <div
                key={`r1-${tech.id}-${idx}`}
                className="flex items-center gap-3 bg-white border border-slate-200 hover:border-[#00ABB8] px-5 py-3 rounded-xl transition-all duration-300 group shrink-0 shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-7 h-7 relative flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                  <img
                    src={tech.logo_url}
                    alt={tech.image_alt || tech.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-[#293233] group-hover:text-[#00939E] transition-colors">
                  {tech.name}
                </span>
                <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {tech.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2: RIGHT TO LEFT */}
        <div className="flex overflow-hidden select-none">
          <div className="animate-marquee-right flex items-center gap-5">
            {marqueeRow2.map((tech, idx) => (
              <div
                key={`r2-${tech.id}-${idx}`}
                className="flex items-center gap-3 bg-white border border-slate-200 hover:border-[#00ABB8] px-5 py-3 rounded-xl transition-all duration-300 group shrink-0 shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-7 h-7 relative flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                  <img
                    src={tech.logo_url}
                    alt={tech.image_alt || tech.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-[#293233] group-hover:text-[#00939E] transition-colors">
                  {tech.name}
                </span>
                <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {tech.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
