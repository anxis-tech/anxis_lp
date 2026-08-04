'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Project } from '@/types/database.types'
import { INITIAL_PROJECTS } from '@/lib/constants/initial-data'
import { ExternalLink, Touchpad, Globe, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface PortfolioSectionProps {
  projects?: Project[]
  title?: string
  description?: string
}

export function PortfolioSection({
  projects = INITIAL_PROJECTS,
  title = 'Projetos desenvolvidos para negócios reais.',
  description = 'Conheça alguns trabalhos criados pela ANXIS em diferentes plataformas, segmentos e níveis de complexidade.',
}: PortfolioSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('todos')
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [tappedProjectId, setTappedProjectId] = useState<string | null>(null)
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)
  }, [])

  const categories = [
    { key: 'todos', label: 'Todos' },
    { key: 'institucional', label: 'Sites Institucionais' },
    { key: 'e-commerce', label: 'Lojas Virtuais' },
    { key: 'landing-page', label: 'Landing Pages' },
    { key: 'personalizado', label: 'Projetos Sob Medida' },
  ]

  const visibleProjects = projects
    .filter((p) => p.is_visible)
    .sort((a, b) => a.display_order - b.display_order)

  const filteredProjects =
    activeCategory === 'todos'
      ? visibleProjects
      : visibleProjects.filter((p) => p.category === activeCategory)

  const toggleTapPreview = (id: string) => {
    setTappedProjectId((prev) => (prev === id ? null : id))
  }

  return (
    <section id="projetos" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0075FF] bg-[#0075FF]/10 px-3.5 py-1.5 rounded-full border border-[#0075FF]/20">
            PORTFÓLIO E CASES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0C1D36] tracking-tight">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-[#596579] font-normal leading-relaxed">
            {description}
          </p>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-16">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer',
                activeCategory === cat.key
                  ? 'bg-[#081D3A] text-white shadow-md'
                  : 'bg-slate-100 text-[#596579] hover:bg-slate-200 hover:text-[#0C1D36]'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* PROJECTS GRID */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Filter className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-[#596579]">Nenhum projeto encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {filteredProjects.map((project) => {
              const isScrolling =
                !isReducedMotion &&
                (hoveredProjectId === project.id || tappedProjectId === project.id)

              return (
                <div
                  key={project.id}
                  className="group bg-[#F7F8FA] rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                  onMouseEnter={() => setHoveredProjectId(project.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                >
                  {/* SIMULATED BROWSER WINDOW TOPBAR */}
                  <div className="bg-[#081D3A] px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      <span className="text-[11px] font-mono text-slate-400 ml-2 hidden sm:inline-block truncate max-w-[200px]">
                        {project.project_url?.replace('https://', '') || 'anxis.com.br'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0075FF] bg-[#0075FF]/20 px-2.5 py-0.5 rounded">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  {/* BROWSER SCREENSHOT VIEWPORT WITH AUTO-SCROLL */}
                  <div
                    className="relative w-full aspect-[16/10] overflow-hidden bg-slate-900 cursor-pointer group/img"
                    onClick={() => toggleTapPreview(project.id)}
                  >
                    <div
                      className={cn(
                        'relative w-full min-h-full transition-transform duration-[6000ms] ease-in-out',
                        isScrolling ? '-translate-y-[calc(100%-100%/1.6)]' : 'translate-y-0'
                      )}
                    >
                      <Image
                        src={project.desktop_image_url}
                        alt={project.image_alt || project.title}
                        width={1200}
                        height={2400}
                        className="w-full h-auto object-top"
                        unoptimized
                      />
                    </div>

                    {/* MOBILE TAP INDICATOR */}
                    <div className="md:hidden absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg pointer-events-none">
                      <Touchpad className="w-3 h-3 text-[#0075FF]" />
                      <span>{tappedProjectId === project.id ? 'Pausar prévia' : 'Toque p/ prévia'}</span>
                    </div>

                    {/* OVERLAY HOVER BADGE */}
                    <div className="absolute inset-0 bg-[#081D3A]/40 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="bg-[#0075FF] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>Visualizar Projeto</span>
                      </span>
                    </div>
                  </div>

                  {/* PROJECT DETAILS & META */}
                  <div className="p-6 sm:p-8 flex flex-col justify-between flex-grow">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#596579]">
                        <span className="font-semibold text-[#0075FF]">{project.client}</span>
                        <span>{project.year}</span>
                      </div>

                      <h3 className="text-xl font-bold text-[#0C1D36] group-hover:text-[#0075FF] transition-colors">
                        {project.title}
                      </h3>

                      <p className="text-sm text-[#596579] leading-relaxed line-clamp-2">
                        {project.short_description}
                      </p>

                      {/* TECHNOLOGIES BADGES */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {project.technologies.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="bg-white border border-slate-200 text-[#0C1D36] text-[11px] font-medium px-2.5 py-1 rounded-md"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA LINK */}
                    <div className="pt-6 border-t border-slate-200/80 mt-6">
                      <a
                        href={project.project_url || '#contato'}
                        target={project.open_new_tab ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('click_project', { title: project.title })}
                        className="inline-flex items-center text-sm font-bold text-[#081D3A] hover:text-[#0075FF] transition-colors"
                      >
                        <span>{project.button_label || 'Ver Projeto'}</span>
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
