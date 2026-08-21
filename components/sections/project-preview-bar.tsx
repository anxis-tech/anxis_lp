'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Project } from '@/types/database.types'
import { INITIAL_PROJECTS } from '@/lib/constants/initial-data'
import { Icon } from '@/components/ui/hugeicons'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics/events'

gsap.registerPlugin(ScrollTrigger)

interface ProjectPreviewBarProps {
  projects?: Project[]
  title?: string
  description?: string
}

interface ProjectTheme {
  bg: string
  dot: string
  tagBg: string
}

const PROJECT_THEMES: Record<string, ProjectTheme> = {
  p1: { bg: 'from-[#D4E89E] via-[#BFE07A] to-[#99BB4E]', dot: '#8FA836', tagBg: 'bg-[#99BB4E]/12 text-[#4D6318] border-[#99BB4E]/30' },
  p2: { bg: 'from-[#FDBA74] via-[#FB923C] to-[#EA580C]', dot: '#EA580C', tagBg: 'bg-[#EA580C]/12 text-[#C2410C] border-[#EA580C]/30' },
  p3: { bg: 'from-[#9B8CFA] via-[#6E54FA] to-[#4527A0]', dot: '#6E54FA', tagBg: 'bg-[#6E54FA]/12 text-[#371B8A] border-[#6E54FA]/30' },
  p4: { bg: 'from-[#67E8F9] via-[#0EA5E9] to-[#0284C7]', dot: '#0284C7', tagBg: 'bg-[#0284C7]/12 text-[#0369A1] border-[#0284C7]/30' },
  p5: { bg: 'from-[#FDC5CE] via-[#F472B6] to-[#EE5D7A]', dot: '#EE5D7A', tagBg: 'bg-[#EE5D7A]/12 text-[#BE123C] border-[#EE5D7A]/30' },
}

const FALLBACK_THEMES: ProjectTheme[] = [
  { bg: 'from-[#D4E89E] via-[#BFE07A] to-[#99BB4E]', dot: '#8FA836', tagBg: 'bg-[#99BB4E]/12 text-[#4D6318] border-[#99BB4E]/30' },
  { bg: 'from-[#9B8CFA] via-[#6E54FA] to-[#4527A0]', dot: '#6E54FA', tagBg: 'bg-[#6E54FA]/12 text-[#371B8A] border-[#6E54FA]/30' },
  { bg: 'from-[#FDBA74] via-[#FB923C] to-[#EA580C]', dot: '#EA580C', tagBg: 'bg-[#EA580C]/12 text-[#C2410C] border-[#EA580C]/30' },
  { bg: 'from-[#FDC5CE] via-[#F472B6] to-[#EE5D7A]', dot: '#EE5D7A', tagBg: 'bg-[#EE5D7A]/12 text-[#BE123C] border-[#EE5D7A]/30' },
  { bg: 'from-[#67E8F9] via-[#0EA5E9] to-[#0284C7]', dot: '#0284C7', tagBg: 'bg-[#0284C7]/12 text-[#0369A1] border-[#0284C7]/30' },
]

const CATEGORY_LABELS: Record<string, string> = {
  'institucional': 'Site Institucional',
  'e-commerce': 'E-commerce',
  'landing-page': 'Landing Page',
  'personalizado': 'Sob Medida',
}

export function ProjectPreviewBar({
  projects = INITIAL_PROJECTS,
  title = 'Alguns dos nossos trabalhos',
  description = 'Conheça projetos desenvolvidos para diferentes marcas, negócios e profissionais.',
}: ProjectPreviewBarProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tappedId, setTappedId] = useState<string | null>(null)

  const visibleProjects = projects
    .filter((p) => p.is_visible)
    .sort((a, b) => a.display_order - b.display_order)

  const total = visibleProjects.length

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current || !containerRef.current || total <= 1) return

    const getScrollDistance = () => {
      if (!trackRef.current || !containerRef.current) return 0
      const trackWidth = trackRef.current.scrollWidth
      const containerWidth = containerRef.current.offsetWidth
      return Math.max(trackWidth - containerWidth + 60, 0)
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: () => `+=${getScrollDistance() * 1.2}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setScrollProgress(self.progress)
        },
      },
    })

    tl.to(trackRef.current, {
      x: () => -getScrollDistance(),
      ease: 'none',
    })

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [total])

  const toggleTapPreview = (id: string) => {
    setTappedId((prev) => (prev === id ? null : id))
  }

  return (
    <section
      id="projetos"
      ref={sectionRef}
      className="relative bg-[#FFFFFF] text-[#0F172A]"
    >
      {/* STICKY MARQUEE VIEWPORT CONTAINER */}
      <div className="w-full h-screen flex flex-col justify-between pt-20 sm:pt-24 pb-8 sm:pb-10 overflow-hidden">
        {/* Ambient light highlights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-[#086ec5]/6 via-transparent to-transparent blur-[130px] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00C968]/4 rounded-full blur-[160px] pointer-events-none z-0" />

        {/* SECTION HEADER */}
        <div className="relative z-10 text-center max-w-2xl mx-auto px-4 space-y-2.5 shrink-0 mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#086ec5] animate-pulse" />
            <span className="text-[11px] font-heading font-extrabold uppercase tracking-[0.2em] text-[#086ec5]">
              PROJETOS
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#1E293B] tracking-tight font-heading leading-[1.15]">
            {title}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
            {description}
          </p>
        </div>

        {/* ===== HORIZONTAL MARQUEE TRACK (GENEROUS UN-SQUISHED CARDS WITH 20PX GAP) ===== */}
        <div
          ref={containerRef}
          className="relative z-10 flex-grow w-full overflow-hidden my-auto flex items-center"
        >
          <div
            ref={trackRef}
            className="flex items-stretch will-change-transform px-6 sm:px-12 lg:px-16"
            style={{ gap: '20px' }}
          >
            {visibleProjects.map((project, index) => {
              const theme = PROJECT_THEMES[project.id] || FALLBACK_THEMES[index % FALLBACK_THEMES.length]
              const isHovered = hoveredId === project.id
              const isTapped = tappedId === project.id
              const isScrolling = isHovered || isTapped
              const projectDomain = project.project_url
                ? project.project_url.replace(/^https?:\/\//, '').replace(/\/$/, '')
                : 'anxis.com.br'

              return (
                <div
                  key={project.id}
                  className="group relative flex flex-col justify-between shrink-0 select-none w-[340px] sm:w-[460px] md:w-[520px] lg:w-[560px] h-[380px] sm:h-[440px] md:h-[480px]"
                  onMouseEnter={() => setHoveredId(project.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* UNIFIED COLORED CANVAS WITH OPEN-BOTTOM MOCKUP (NO OUTER WHITE BORDER) */}
                  <div
                    className={cn(
                      'relative w-full flex-grow rounded-[24px] sm:rounded-[28px] overflow-hidden flex flex-col items-center justify-start pt-4 sm:pt-6 px-4 sm:px-8 select-none transition-all duration-500 bg-gradient-to-br shadow-md hover:shadow-2xl border border-black/5',
                      theme.bg
                    )}
                  >
                    {/* Ambient Glow Aura */}
                    <div
                      className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                      style={{ background: 'radial-gradient(circle at 50% 30%, #ffffff 0%, transparent 70%)' }}
                    />

                    {/* OPEN-BOTTOM BROWSER MOCKUP (CLICKABLE DIRECT LINK) */}
                    <a
                      href={project.project_url || '#contato'}
                      target={project.open_new_tab ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      aria-label={`Acessar projeto ${project.title}`}
                      onClick={() =>
                        trackEvent('click_project', {
                          title: project.title,
                          location: 'marquee_mockup',
                        })
                      }
                      className="relative w-full max-w-[96%] sm:max-w-[92%] flex-grow rounded-t-xl sm:rounded-t-2xl rounded-b-none overflow-hidden isolate bg-slate-900/90 border-t border-x border-white/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:scale-[1.015] group-hover:-translate-y-1 flex flex-col cursor-pointer block"
                    >
                      {/* Browser top bar */}
                      <div className="bg-slate-900/95 backdrop-blur-md px-3.5 py-2 flex items-center justify-between border-b border-white/10 shrink-0 rounded-t-[inherit]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-rose-400/90" />
                          <div className="w-2 h-2 rounded-full bg-amber-400/90" />
                          <div className="w-2 h-2 rounded-full bg-emerald-400/90" />
                        </div>
                        <div className="bg-white/10 px-2.5 py-0.5 rounded-full text-[9px] font-sans font-medium text-white/80 max-w-[150px] sm:max-w-[200px] truncate border border-white/10">
                          {projectDomain}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                      </div>

                      {/* Screenshot viewport */}
                      <div className="relative w-full flex-grow overflow-hidden bg-slate-950">
                        <div
                          className={cn(
                            'w-full transition-transform duration-[6500ms] ease-in-out will-change-transform',
                            isScrolling ? '-translate-y-[calc(100%-100%/1.35)]' : 'translate-y-0'
                          )}
                        >
                          <Image
                            src={project.desktop_image_url}
                            alt={project.image_alt || project.title}
                            width={1200}
                            height={2400}
                            className="w-full h-auto object-top block"
                            unoptimized
                            priority={index < 2}
                          />
                        </div>

                        {/* Hover overlay (translucent frosted glass button with perfectly aligned glowing arrow) */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                          <span className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-black/50 backdrop-blur-xl text-white text-xs font-bold shadow-2xl border border-white/30 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <span className="leading-none tracking-wide">Ver Projeto Online</span>
                            <svg
                              className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="6" y1="18" x2="18" y2="6" />
                              <polyline points="9 6 18 6 18 15" />
                            </svg>
                          </span>
                        </div>

                        {/* Mobile tap helper */}
                        <div className="md:hidden absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-md pointer-events-none">
                          <Icon name="Touchpad" size={11} className="text-[#00C968]" />
                          <span>{isTapped ? 'Pausar' : 'Toque p/ rolar'}</span>
                        </div>
                      </div>
                    </a>
                  </div>

                  {/* CARD META DIRECTLY UNDER CANVAS (NO OUTER WHITE BORDER) */}
                  <div className="mt-3.5 sm:mt-4 px-1 flex items-center justify-between gap-3 shrink-0">
                    {/* Title + 3 dashes below */}
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-black text-[#1E293B] group-hover:text-[#086ec5] transition-colors leading-tight font-heading">
                        {project.title.split(' - ')[0] || project.title}
                      </h3>
                      <div className="flex items-center gap-1" aria-hidden="true">
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
                    </div>

                    {/* Category badge + external link */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-[11px] font-bold px-3 py-1 rounded-full border transition-colors', theme.tagBg)}>
                        {CATEGORY_LABELS[project.category] || project.category}
                      </span>
                      <a
                        href={project.project_url || '#contato'}
                        target={project.open_new_tab ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        aria-label={`Ver projeto ${project.title}`}
                        onClick={() => trackEvent('click_project', { title: project.title, location: 'marquee_portfolio' })}
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-[#086ec5] hover:text-white transition-all duration-300 hover:scale-110 shadow-xs ml-1"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17L17 7" />
                          <path d="M7 7h10v10" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ===== CONTINUOUS PROGRESS TRAIL ===== */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-2 shrink-0 pt-4 pb-1">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-heading font-bold text-slate-400">
              01
            </span>

            {/* Progress Track */}
            <div className="w-48 sm:w-64 h-1.5 rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-75 ease-out"
                style={{
                  width: `${Math.min(Math.max(scrollProgress * 100, 6), 100)}%`,
                  background: 'linear-gradient(90deg, #00ABB8 0%, #086ec5 50%, #00C968 100%)',
                  boxShadow: '0 0 10px rgba(8, 110, 197, 0.5)',
                }}
              />
            </div>

            <span className="text-[11px] font-heading font-bold text-slate-400">
              0{total}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
