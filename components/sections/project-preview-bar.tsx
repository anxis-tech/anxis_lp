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
  title?: string
  description?: string
}

export function ProjectPreviewBar({
  projects = INITIAL_PROJECTS,
  title = 'Experiência digital construída para alta conversão',
  description = 'Passe o cursor ou toque nos projetos para visualizar a navegação completa. Filtre por categoria para explorar trabalhos em diferentes segmentos.',
}: ProjectPreviewBarProps) {
  const [activeCategory, setActiveCategory] = useState<string>('todos')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tappedId, setTappedId] = useState<string | null>(null)
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

  const getCategoryCount = (key: string) => {
    if (key === 'todos') return visibleProjects.length
    return visibleProjects.filter((p) => p.category === key).length
  }

  const toggleTapPreview = (id: string) => {
    setTappedId((prev) => (prev === id ? null : id))
  }

  return (
    <section id="projetos" className="relative bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#FFFFFF] text-[#0F172A] py-24 sm:py-32 border-b border-slate-200/80 overflow-hidden">
      {/* Background Subtle Accent Top Line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#086ec5]/40 to-transparent opacity-80" />
      
      {/* Background Accent Blue Glows */}
      <div className="absolute -top-40 left-1/3 w-[800px] h-[350px] bg-[#086ec5]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] bg-[#086ec5]/4 rounded-full blur-[170px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono uppercase tracking-[0.25em] px-4 py-1.5 rounded-[20px] bg-white border border-slate-200 shadow-sm inline-block font-extrabold text-[#086ec5]">
            DEMONSTRAÇÃO DE PROJETOS REAIS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2f2f2f] tracking-tight font-heading">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            {description}
          </p>
        </div>

        {/* MAIN CONSOLIDATED LAYOUT: LEFT SIDEBAR FILTERS + RIGHT BROWSER PREVIEW GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          {/* LEFT SIDEBAR CATEGORY FILTER PANEL (STICKY TO VIEWPORT) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 self-start z-20 space-y-4">
            <div className="bg-white rounded-[20px] p-6 border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-slate-700 font-bold flex items-center gap-2 pb-3 border-b border-slate-100">
                <Icon name="Filter" size={16} className="text-[#086ec5]" />
                <span>Filtrar por Categoria</span>
              </div>

              <div className="space-y-1.5 pt-1">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.key
                  const count = getCategoryCount(cat.key)

                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 rounded-[20px] text-xs font-extrabold transition-all duration-200 cursor-pointer',
                        isActive
                          ? 'bg-[#086ec5] text-white shadow-md shadow-blue-600/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-[20px] text-[10px] font-mono font-bold',
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
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
            <div className="bg-gradient-to-br from-[#F0F7FF] via-[#FFFFFF] to-[#EFF6FF] rounded-[20px] p-6 border border-blue-200/70 space-y-3 hidden lg:block shadow-md relative overflow-hidden">
              <div className="flex items-center gap-2 text-[#086ec5] font-extrabold text-xs uppercase tracking-wider">
                <Icon name="Sparkles" size={16} className="text-[#086ec5]" />
                <span>Projetos Sob Medida</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Precisa de uma estrutura exclusiva para seu e-commerce ou site institucional?
              </p>
              <a
                href="#contato"
                className="inline-flex items-center text-xs font-extrabold text-[#086ec5] hover:text-blue-700 transition-colors pt-1"
              >
                <span>Solicitar proposta técnica</span>
                <Icon name="ArrowRight" size={14} className="ml-1 text-[#086ec5]" />
              </a>
            </div>
          </div>

          {/* RIGHT SIDE: INTERACTIVE BROWSER PREVIEW GRID */}
          <div className="lg:col-span-8">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[20px] border border-dashed border-slate-200">
                <Icon name="Filter" size={32} className="mx-auto text-slate-400 mb-3" />
                <p className="text-base font-semibold text-slate-600">Nenhum projeto encontrado nesta categoria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredProjects.map((project) => {
                  const isScrolling =
                    !isReducedMotion &&
                    (hoveredId === project.id || tappedId === project.id)

                  return (
                    <div
                      key={project.id}
                      className="group relative bg-white rounded-[20px] border border-slate-200/90 overflow-hidden shadow-xl hover:shadow-2xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
                      onMouseEnter={() => setHoveredId(project.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {/* BROWSER TOPBAR */}
                      <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <span className="text-[10px] font-mono text-slate-500 ml-2 truncate max-w-[150px]">
                            {project.project_url?.replace('https://', '') || 'anxis.com.br'}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 bg-white px-2 py-0.5 rounded-[20px] border border-slate-200 shadow-2xs">
                          {project.category}
                        </span>
                      </div>

                      {/* BROWSER SCREENSHOT VIEWPORT WITH AUTO-SCROLL */}
                      <div
                        className="relative w-full aspect-[16/10] overflow-hidden bg-slate-900 cursor-pointer group/img"
                        onClick={() => toggleTapPreview(project.id)}
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

                        {/* TOUCH INDICATOR FOR MOBILE */}
                        <div className="md:hidden absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-[20px] flex items-center gap-2 shadow-lg pointer-events-none">
                          <Icon name="Touchpad" size={14} className="text-emerald-400" />
                          <span>{tappedId === project.id ? 'Pausar prévia' : 'Toque p/ rolar'}</span>
                        </div>

                        {/* OVERLAY HOVER BADGE */}
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] text-white text-xs font-bold px-4 py-2 rounded-[20px] shadow-lg flex items-center gap-2">
                            <Icon name="Globe" size={16} />
                            <span>Ver Projeto Completo</span>
                          </span>
                        </div>
                      </div>

                      {/* DETAILS & META FOOTER */}
                      <div className="p-6 flex flex-col justify-between flex-grow space-y-4 bg-white">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                            <span className="text-slate-600 uppercase tracking-wider font-bold">{project.client}</span>
                            <span>{project.year}</span>
                          </div>

                          <h3 className="text-xl font-bold text-[#2f2f2f] group-hover:text-slate-800 transition-colors font-heading">
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
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-[20px]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* CTA LINK */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <a
                            href={project.project_url || '#contato'}
                            target={project.open_new_tab ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('click_project', { title: project.title, location: 'preview_bar' })}
                            className="inline-flex items-center text-xs sm:text-sm font-extrabold text-[#2f2f2f] hover:text-orange-600 transition-colors"
                          >
                            <span>{project.button_label || 'Ver Case Completo'}</span>
                            <Icon name="ExternalLink" size={14} className="ml-1.5 text-emerald-600" />
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
