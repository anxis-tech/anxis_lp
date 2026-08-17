'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Project } from '@/types/database.types'
import { INITIAL_PROJECTS } from '@/lib/constants/initial-data'
import { Icon } from '@/components/ui/hugeicons'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

interface PortfolioSectionProps {
  projects?: Project[]
  title?: string
  description?: string
}

export function PortfolioSection({
  projects = INITIAL_PROJECTS,
  title = 'Projetos que geram resultados reais.',
  description = 'Conheça uma seleção dos nossos trabalhos mais recentes desenvolvidos em diferentes plataformas e segmentos.',
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
    { key: 'todos', label: 'Todos os Cases' },
    { key: 'institucional', label: 'Sites Institucionais' },
    { key: 'e-commerce', label: 'Lojas Virtuais' },
    { key: 'landing-page', label: 'Landing Pages' },
    { key: 'personalizado', label: 'Desenvolvimento Sob Medida' },
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

  // Count helper for category badges
  const getCategoryCount = (key: string) => {
    if (key === 'todos') return visibleProjects.length
    return visibleProjects.filter((p) => p.category === key).length
  }

  return (
    <section id="projetos" className="py-24 sm:py-32 bg-[#F8FAFC] text-[#293233] relative border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SECTION TOP HEADER */}
        <div className="max-w-3xl space-y-4 mb-16 text-left">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#00ABB8] bg-[#00ABB8]/10 px-4 py-1.5 rounded-[20px] border border-[#00ABB8]/20 inline-block">
            CASES & PORTFÓLIO
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#293233] tracking-tight font-heading">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            {description}
          </p>
        </div>

        {/* MAIN LAYOUT: LEFT SIDEBAR FILTERS (STICKY TO VIEWPORT UNTIL LAST CARD) + RIGHT PROJECTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          {/* LEFT SIDEBAR CATEGORY FILTER PANEL (FIXED TO VIEWPORT ON SCROLL) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 self-start z-20 space-y-4">
            <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-md space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-[#00939E] font-extrabold flex items-center gap-2 pb-3 border-b border-slate-100">
                <Icon name="Filter" size={16} />
                <span>Filtrar por Categoria</span>
              </div>

              {/* VERTICAL STACK OF CATEGORY BUTTONS */}
              <div className="flex flex-col space-y-1.5">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.key
                  const count = getCategoryCount(cat.key)

                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-[20px] text-xs font-bold transition-all duration-200 flex items-center justify-between cursor-pointer group',
                        isActive
                          ? 'bg-[#293233] text-white shadow-md'
                          : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-[#293233]'
                      )}
                    >
                      <span className="truncate">{cat.label}</span>
                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold px-2 py-0.5 rounded-[20px] transition-colors shrink-0 ml-2',
                          isActive
                            ? 'bg-[#00ABB8] text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SIDEBAR HELPER CARD */}
            <div className="bg-[#00ABB8]/10 rounded-[20px] p-6 border border-[#00ABB8]/30 space-y-3 hidden lg:block shadow-sm">
              <div className="flex items-center gap-2 text-[#00939E] font-extrabold text-xs uppercase tracking-wider">
                <Icon name="Sparkles" size={16} />
                <span>Projetos Sob Medida</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Precisa de uma estrutura exclusiva para seu e-commerce ou site institucional?
              </p>
              <a
                href="#contato"
                className="inline-flex items-center text-xs font-extrabold text-[#00939E] hover:text-[#293233] transition-colors pt-1"
              >
                <span>Solicitar proposta técnica</span>
                <Icon name="ArrowRight" size={14} className="ml-1" />
              </a>
            </div>
          </div>

          {/* RIGHT SIDE: PROJECTS GRID */}
          <div className="lg:col-span-8">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[20px] border border-dashed border-slate-300">
                <Icon name="Filter" size={32} className="mx-auto text-slate-400 mb-3" />
                <p className="text-base font-semibold text-slate-600">Nenhum projeto encontrado nesta categoria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredProjects.map((project) => {
                  const isScrolling =
                    !isReducedMotion &&
                    (hoveredProjectId === project.id || tappedProjectId === project.id)

                  return (
                    <div
                      key={project.id}
                      className="group bg-white rounded-[20px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                      onMouseEnter={() => setHoveredProjectId(project.id)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                    >
                      {/* BROWSER TOP BAR */}
                      <div className="bg-[#293233] px-4 py-3 flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-mono text-slate-300 ml-2 truncate max-w-[160px]">
                            {project.project_url?.replace('https://', '') || 'anxis.com.br'}
                          </span>
                        </div>

                        <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-[#00ABB8] px-2.5 py-0.5 rounded-[20px]">
                          {project.category}
                        </span>
                      </div>

                      {/* BROWSER SCREENSHOT VIEWPORT WITH AUTO-SCROLL */}
                      <div
                        className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950 cursor-pointer group/img"
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

                        {/* TOUCH INDICATOR FOR MOBILE */}
                        <div className="md:hidden absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-[20px] flex items-center gap-2 shadow-lg pointer-events-none">
                          <Icon name="Touchpad" size={14} className="text-[#00C4D4]" />
                          <span>{tappedProjectId === project.id ? 'Pausar prévia' : 'Toque p/ rolar'}</span>
                        </div>

                        {/* HOVER OVERLAY BADGE */}
                        <div className="absolute inset-0 bg-[#293233]/50 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="bg-[#00ABB8] text-white text-xs font-extrabold px-4 py-2 rounded-[20px] shadow-xl flex items-center gap-2">
                            <Icon name="Globe" size={16} />
                            <span>Acessar Projeto</span>
                          </span>
                        </div>
                      </div>

                      {/* DETAILS & META */}
                      <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span className="text-[#00939E] uppercase tracking-wider">{project.client}</span>
                            <span>{project.year}</span>
                          </div>

                          <h3 className="text-xl font-black text-[#293233] group-hover:text-[#00939E] transition-colors font-heading">
                            {project.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                            {project.short_description}
                          </p>

                          {/* TECHNOLOGIES BADGES */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {project.technologies.map((tech, tIdx) => (
                              <span
                                key={tIdx}
                                className="bg-[#F8FAFC] border border-slate-200 text-[#293233] text-[10px] font-bold px-2.5 py-0.5 rounded-[20px]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* CTA LINK */}
                        <div className="pt-4 border-t border-slate-100">
                          <a
                            href={project.project_url || '#contato'}
                            target={project.open_new_tab ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('click_project', { title: project.title })}
                            className="inline-flex items-center text-xs sm:text-sm font-extrabold text-[#293233] hover:text-[#0099FF] transition-colors"
                          >
                            <span>{project.button_label || 'Ver Case Completo'}</span>
                            <Icon name="ExternalLink" size={14} className="ml-1.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
