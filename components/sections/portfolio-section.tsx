'use client'

import { useState } from 'react'
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

interface ProjectTheme {
  bg: string
  dot: string
  shadow: string
  tagBg: string
  textAccent: string
  glowColor: string
}

const PROJECT_THEMES: Record<string, ProjectTheme> = {
  p1: {
    bg: 'from-[#D4E89E] via-[#BFE07A] to-[#99BB4E]',
    dot: '#8FA836',
    shadow: 'shadow-[#BFE07A]/25',
    tagBg: 'bg-[#99BB4E]/12 text-[#4D6318] border-[#99BB4E]/30',
    textAccent: '#4D6318',
    glowColor: 'rgba(191, 224, 122, 0.4)',
  },
  p2: {
    bg: 'from-[#FDBA74] via-[#FB923C] to-[#EA580C]',
    dot: '#EA580C',
    shadow: 'shadow-[#FB923C]/25',
    tagBg: 'bg-[#EA580C]/12 text-[#C2410C] border-[#EA580C]/30',
    textAccent: '#C2410C',
    glowColor: 'rgba(251, 146, 60, 0.4)',
  },
  p3: {
    bg: 'from-[#9B8CFA] via-[#6E54FA] to-[#4527A0]',
    dot: '#6E54FA',
    shadow: 'shadow-[#6E54FA]/25',
    tagBg: 'bg-[#6E54FA]/12 text-[#371B8A] border-[#6E54FA]/30',
    textAccent: '#6E54FA',
    glowColor: 'rgba(110, 84, 250, 0.4)',
  },
  p4: {
    bg: 'from-[#67E8F9] via-[#0EA5E9] to-[#0284C7]',
    dot: '#0284C7',
    shadow: 'shadow-[#0EA5E9]/25',
    tagBg: 'bg-[#0284C7]/12 text-[#0369A1] border-[#0284C7]/30',
    textAccent: '#0284C7',
    glowColor: 'rgba(14, 165, 233, 0.4)',
  },
  p5: {
    bg: 'from-[#FDC5CE] via-[#F472B6] to-[#EE5D7A]',
    dot: '#EE5D7A',
    shadow: 'shadow-[#F472B6]/25',
    tagBg: 'bg-[#EE5D7A]/12 text-[#BE123C] border-[#EE5D7A]/30',
    textAccent: '#BE123C',
    glowColor: 'rgba(244, 114, 182, 0.4)',
  },
}

const FALLBACK_THEMES: ProjectTheme[] = [
  {
    bg: 'from-[#D4E89E] via-[#BFE07A] to-[#99BB4E]',
    dot: '#8FA836',
    shadow: 'shadow-[#BFE07A]/25',
    tagBg: 'bg-[#99BB4E]/12 text-[#4D6318] border-[#99BB4E]/30',
    textAccent: '#4D6318',
    glowColor: 'rgba(191, 224, 122, 0.4)',
  },
  {
    bg: 'from-[#9B8CFA] via-[#6E54FA] to-[#4527A0]',
    dot: '#6E54FA',
    shadow: 'shadow-[#6E54FA]/25',
    tagBg: 'bg-[#6E54FA]/12 text-[#371B8A] border-[#6E54FA]/30',
    textAccent: '#6E54FA',
    glowColor: 'rgba(110, 84, 250, 0.4)',
  },
  {
    bg: 'from-[#FDBA74] via-[#FB923C] to-[#EA580C]',
    dot: '#EA580C',
    shadow: 'shadow-[#FB923C]/25',
    tagBg: 'bg-[#EA580C]/12 text-[#C2410C] border-[#EA580C]/30',
    textAccent: '#C2410C',
    glowColor: 'rgba(251, 146, 60, 0.4)',
  },
  {
    bg: 'from-[#FDC5CE] via-[#F472B6] to-[#EE5D7A]',
    dot: '#EE5D7A',
    shadow: 'shadow-[#F472B6]/25',
    tagBg: 'bg-[#EE5D7A]/12 text-[#BE123C] border-[#EE5D7A]/30',
    textAccent: '#BE123C',
    glowColor: 'rgba(244, 114, 182, 0.4)',
  },
  {
    bg: 'from-[#67E8F9] via-[#0EA5E9] to-[#0284C7]',
    dot: '#0284C7',
    shadow: 'shadow-[#0EA5E9]/25',
    tagBg: 'bg-[#0284C7]/12 text-[#0369A1] border-[#0284C7]/30',
    textAccent: '#0284C7',
    glowColor: 'rgba(14, 165, 233, 0.4)',
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  'institucional': 'Site Institucional',
  'e-commerce': 'E-commerce',
  'landing-page': 'Landing Page',
  'personalizado': 'Sob Medida',
}

export function PortfolioSection({
  projects = INITIAL_PROJECTS,
  title = 'Projetos que geram resultados reais',
  description = 'Conheça uma seleção dos nossos trabalhos mais recentes desenvolvidos em diferentes plataformas e segmentos.',
}: PortfolioSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('todos')
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [tappedProjectId, setTappedProjectId] = useState<string | null>(null)

  const categories = [
    { key: 'todos', label: 'Todos os Cases' },
    { key: 'landing-page', label: 'Landing Pages' },
    { key: 'institucional', label: 'Sites Institucionais' },
    { key: 'e-commerce', label: 'Lojas Virtuais' },
    { key: 'personalizado', label: 'Sob Medida' },
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

  const getCategoryCount = (key: string) => {
    if (key === 'todos') return visibleProjects.length
    return visibleProjects.filter((p) => p.category === key).length
  }

  return (
    <section id="projetos" className="py-24 sm:py-32 bg-[#FAFBFC] text-[#0F172A] relative border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#086ec5] animate-pulse" />
            <span className="text-xs font-mono font-extrabold uppercase tracking-[0.2em] text-[#086ec5]">
              CASES & PORTFÓLIO
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E293B] tracking-tight font-heading">
            {title}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* FLOATING PILL CATEGORY FILTER */}
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100/90 backdrop-blur-md rounded-[24px] sm:rounded-full border border-slate-200/80 shadow-xs max-w-full">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.key
              const count = getCategoryCount(cat.key)

              if (count === 0 && cat.key !== 'todos') return null

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer select-none',
                    isActive
                      ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5 border border-slate-200/60 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  )}
                >
                  <span>{cat.label}</span>
                  <span
                    className={cn(
                      'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full transition-colors',
                      isActive ? 'bg-[#086ec5] text-white' : 'bg-slate-200/80 text-slate-600'
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* SHOWCASE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-stretch">
          {filteredProjects.map((project, index) => {
            const theme = PROJECT_THEMES[project.id] || FALLBACK_THEMES[index % FALLBACK_THEMES.length]
            const isHovered = hoveredProjectId === project.id
            const isTapped = tappedProjectId === project.id
            const isScrolling = isHovered || isTapped
            const projectDomain = project.project_url
              ? project.project_url.replace(/^https?:\/\//, '').replace(/\/$/, '')
              : 'anxis.com.br'

            return (
              <div
                key={project.id}
                className="group relative flex flex-col rounded-[28px] sm:rounded-[32px] bg-white border border-slate-200/90 p-3.5 sm:p-5 shadow-sm hover:shadow-2xl hover:border-slate-300 transition-all duration-500"
                onMouseEnter={() => setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
              >
                {/* CANVAS */}
                <div
                  className={cn(
                    'relative w-full aspect-[16/11] sm:aspect-[16/10] rounded-[22px] sm:rounded-[24px] overflow-hidden flex items-center justify-center p-3 sm:p-6 md:p-8 select-none transition-all duration-500 bg-gradient-to-br',
                    theme.bg
                  )}
                >
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 40%, #ffffff 0%, transparent 70%)`,
                    }}
                  />

                  {/* CENTERED MOCKUP */}
                  <div
                    className="relative w-full max-w-[92%] sm:max-w-[88%] aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950/95 border border-white/50 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.35)] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1 cursor-pointer"
                    onClick={() => toggleTapPreview(project.id)}
                  >
                    <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 flex items-center justify-between border-b border-white/10 relative z-20">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-400/90" />
                        <div className="w-2 h-2 rounded-full bg-amber-400/90" />
                        <div className="w-2 h-2 rounded-full bg-emerald-400/90" />
                      </div>
                      <div className="bg-white/10 px-2.5 py-0.5 rounded-full text-[9px] font-mono text-white/80 max-w-[150px] sm:max-w-[200px] truncate border border-white/10">
                        {projectDomain}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                    </div>

                    <div className="relative w-full h-[calc(100%-28px)] overflow-hidden bg-slate-950">
                      <div
                        className={cn(
                          'relative w-full transition-transform duration-[6500ms] ease-in-out will-change-transform',
                          isScrolling ? '-translate-y-[calc(100%-100%/1.6)]' : 'translate-y-0'
                        )}
                      >
                        <Image
                          src={project.desktop_image_url}
                          alt={project.image_alt || project.title}
                          width={1200}
                          height={2400}
                          className="w-full h-auto object-top block"
                          unoptimized
                        />
                      </div>

                      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 text-slate-900 text-xs font-extrabold shadow-xl shadow-black/25 border border-white/80 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          <Icon name="Globe" size={14} className="text-[#086ec5]" />
                          <span>Ver Projeto Online</span>
                          <Icon name="ArrowUpRight" size={13} className="text-slate-500" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="mt-4 sm:mt-5 px-1.5 sm:px-2 pb-1.5 flex flex-col justify-between gap-3.5 flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex items-center gap-1 shrink-0 pt-1 sm:pt-0" aria-hidden="true">
                        <span
                          className="w-3.5 h-1.5 rounded-full border transition-all duration-300"
                          style={{
                            borderColor: theme.dot,
                            backgroundColor: isHovered ? theme.dot : 'transparent',
                          }}
                        />
                        <span
                          className="w-3.5 h-1.5 rounded-full border transition-all duration-300 opacity-80"
                          style={{
                            borderColor: theme.dot,
                            backgroundColor: isHovered ? theme.dot : 'transparent',
                          }}
                        />
                        <span
                          className="w-3.5 h-1.5 rounded-full border transition-all duration-300 opacity-60"
                          style={{
                            borderColor: theme.dot,
                            backgroundColor: isHovered ? theme.dot : 'transparent',
                          }}
                        />
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-black text-[#1E293B] group-hover:text-[#086ec5] transition-colors leading-tight font-heading">
                          {project.title.split(' - ')[0] || project.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                          <span>{project.client || 'Cliente ANXIS'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-400">{project.year || '2026'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100/90 text-slate-600 border border-slate-200/80">
                        Portfólio
                      </span>

                      <span
                        className={cn(
                          'text-[11px] font-bold px-3 py-1 rounded-full border transition-colors',
                          theme.tagBg
                        )}
                      >
                        {CATEGORY_LABELS[project.category] || project.category}
                      </span>

                      <a
                        href={project.project_url || '#contato'}
                        target={project.open_new_tab ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        aria-label={`Ver projeto ${project.title}`}
                        onClick={() =>
                          trackEvent('click_project', {
                            title: project.title,
                            location: 'portfolio_section',
                          })
                        }
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#086ec5] hover:text-white transition-all duration-300 hover:scale-105 shadow-2xs ml-1"
                      >
                        <Icon name="ArrowUpRight" size={15} />
                      </a>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {project.short_description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
