'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Project } from '@/types/database.types'
import { INITIAL_PROJECTS } from '@/lib/constants/initial-data'
import { Icon } from '@/components/ui/hugeicons'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface ProjectPreviewBarProps {
  projects?: Project[]
}

export function ProjectPreviewBar({ projects = INITIAL_PROJECTS }: ProjectPreviewBarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tappedId, setTappedId] = useState<string | null>(null)
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)
  }, [])

  const featuredProjects = projects.filter((p) => p.is_visible).slice(0, 3)

  return (
    <section id="preview-projetos" className="relative bg-[#293233] text-white pt-16 pb-24 border-b border-white/10 overflow-hidden">
      {/* Background Accent Lines */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00ABB8] to-transparent opacity-60" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00ABB8]/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#00C4D4] bg-[#00ABB8]/15 px-4 py-1.5 rounded-full border border-[#00ABB8]/30 inline-block">
            DEMONSTRAÇÃO DE PROJETOS REAIS
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Experiência digital construída para alta conversão
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Passe o cursor ou toque nos projetos para visualizar a navegação completa.
          </p>
        </div>

        {/* FEATURED SHOWCASE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProjects.map((project) => {
            const isScrolling = !isReducedMotion && (hoveredId === project.id || tappedId === project.id)

            return (
              <div
                key={project.id}
                className="group relative bg-[#1E2526] rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-300 hover:border-[#00ABB8]/60 flex flex-col justify-between"
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* BROWSER TOPBAR */}
                <div className="bg-[#293233] px-4 py-3 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono text-slate-300 ml-2 truncate max-w-[140px]">
                      {project.project_url?.replace('https://', '') || 'anxis.com.br'}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#00C4D4] bg-[#00ABB8]/20 px-2 py-0.5 rounded">
                    {project.category}
                  </span>
                </div>

                {/* SCREENSHOT VIEWPORT WITH SCROLL ANIMATION */}
                <div
                  className="relative w-full aspect-[16/11] overflow-hidden bg-slate-950 cursor-pointer"
                  onClick={() => setTappedId((prev) => (prev === project.id ? null : project.id))}
                >
                  <div
                    className={cn(
                      'relative w-full min-h-full transition-transform duration-[6500ms] ease-in-out',
                      isScrolling ? '-translate-y-[calc(100%-100%/1.6)]' : 'translate-y-0'
                    )}
                  >
                    <Image
                      src={project.desktop_image_url}
                      alt={project.image_alt || project.title}
                      width={1000}
                      height={2000}
                      className="w-full h-auto object-top"
                      unoptimized
                    />
                  </div>

                  {/* OVERLAY HOVER BADGE */}
                  <div className="absolute inset-0 bg-[#293233]/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-[#00ABB8] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                      <Icon name="Globe" size={16} />
                      <span>Ver Projeto Completo</span>
                    </span>
                  </div>
                </div>

                {/* INFO FOOTER */}
                <div className="p-5 flex items-center justify-between border-t border-white/10 bg-[#1E2526]">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#00C4D4] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{project.client}</p>
                  </div>
                  <a
                    href={project.project_url || '#contato'}
                    target={project.open_new_tab ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('click_project', { title: project.title, location: 'preview_bar' })}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-[#00ABB8] text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="Acessar projeto"
                  >
                    <Icon name="ExternalLink" size={16} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
