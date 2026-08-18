'use client'

import { Technology } from '@/types/database.types'
import { INITIAL_TECHNOLOGIES } from '@/lib/constants/initial-data'

interface TechMarqueeProps {
  technologies?: Technology[]
}

const LOCAL_LOGO_FALLBACKS: Record<string, string> = {
  'tray': '/logos/tray.svg',
  'nuvemshop': '/logos/nuvemshop.svg',
  'wordpress': '/logos/wordpress.svg',
  'woocommerce': '/logos/woocommerce.svg',
  'next.js': '/logos/nextjs.svg',
  'nextjs': '/logos/nextjs.svg',
  'react': '/logos/react.svg',
  'typescript': '/logos/typescript.svg',
  'tailwind css': '/logos/tailwindcss.svg',
  'tailwind': '/logos/tailwindcss.svg',
  'supabase': '/logos/supabase.svg',
  'node.js': '/logos/nodejs.svg',
  'nodejs': '/logos/nodejs.svg',
}

function resolveLogoUrl(tech: Technology): string {
  const key = tech.name.toLowerCase().trim()
  if (LOCAL_LOGO_FALLBACKS[key]) {
    // If it's a known logo or uses an old broken svgporn url, prioritize local
    if (!tech.logo_url || tech.logo_url.includes('svgporn.com') || tech.logo_url.startsWith('/logos/')) {
      return LOCAL_LOGO_FALLBACKS[key]
    }
  }
  return tech.logo_url || LOCAL_LOGO_FALLBACKS[key] || '/logos/nextjs.svg'
}

export function TechMarquee({ technologies = INITIAL_TECHNOLOGIES }: TechMarqueeProps) {
  const visibleTechs = technologies.filter((t) => t.is_visible)

  // Duplicate items for seamless continuous marquee loop
  const marqueeItems = [...visibleTechs, ...visibleTechs, ...visibleTechs, ...visibleTechs]

  return (
    <section className="py-3.5 sm:py-4.5 bg-[#EEF2F6] text-[#0F172A] relative overflow-hidden">
      {/* Side Fade Gradients */}
      <div className="absolute top-0 bottom-0 left-0 w-20 sm:w-36 bg-gradient-to-r from-[#EEF2F6] via-[#EEF2F6]/90 to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-20 sm:w-36 bg-gradient-to-l from-[#EEF2F6] via-[#EEF2F6]/90 to-transparent z-20 pointer-events-none" />

      {/* CONTINUOUS LOGOS MARQUEE LOOP */}
      <div className="flex overflow-hidden select-none">
        <div className="animate-marquee-left flex items-center gap-4 sm:gap-6 py-1">
          {marqueeItems.map((tech, idx) => {
            const logoSrc = resolveLogoUrl(tech)
            const fallbackSrc = LOCAL_LOGO_FALLBACKS[tech.name.toLowerCase().trim()]

            return (
              <div
                key={`m-${tech.id}-${idx}`}
                className="flex items-center gap-3 px-3.5 sm:px-4.5 py-1.5 sm:py-2 rounded-[14px] sm:rounded-[16px] bg-white/90 hover:bg-white border border-slate-200/70 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all duration-300 group shrink-0 cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0">
                  <img
                    src={logoSrc}
                    alt={tech.image_alt || tech.name}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    onError={(e) => {
                      const target = e.currentTarget
                      if (fallbackSrc && target.src !== fallbackSrc) {
                        target.src = fallbackSrc
                      }
                    }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-950 font-heading tracking-tight transition-colors whitespace-nowrap">
                  {tech.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


