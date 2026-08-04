import { Technology } from '@/types/database.types'
import { INITIAL_TECHNOLOGIES } from '@/lib/constants/initial-data'

interface TechMarqueeProps {
  technologies?: Technology[]
  title?: string
  description?: string
}

export function TechMarquee({
  technologies = INITIAL_TECHNOLOGIES,
  title = 'Tecnologia adequada para cada tipo de projeto.',
  description = 'Trabalhamos com plataformas consolidadas e desenvolvimento personalizado para indicar a estrutura mais coerente para cada necessidade.',
}: TechMarqueeProps) {
  const visibleTechs = technologies.filter((t) => t.is_visible)

  // Split into two sets for row 1 and row 2
  const row1 = visibleTechs.slice(0, Math.ceil(visibleTechs.length / 2))
  const row2 = visibleTechs.slice(Math.ceil(visibleTechs.length / 2))

  // Repeat items for seamless continuous marquee loop
  const marqueeRow1 = [...row1, ...row1, ...row1, ...row1]
  const marqueeRow2 = [...row2, ...row2, ...row2, ...row2]

  return (
    <section id="tecnologias" className="py-20 bg-[#081D3A] text-white relative overflow-hidden">
      {/* Side Fade Gradients */}
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#081D3A] to-transparent z-20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#081D3A] to-transparent z-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-[#0075FF] bg-[#0075FF]/20 px-3.5 py-1.5 rounded-full border border-[#0075FF]/30">
          TECNOLOGIAS & PLATAFORMAS
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-[#BBC4D1] font-normal max-w-2xl mx-auto mt-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="space-y-6 overflow-hidden">
        {/* ROW 1: LEFT TO RIGHT */}
        <div className="flex overflow-hidden select-none">
          <div className="animate-marquee-left flex items-center gap-6">
            {marqueeRow1.map((tech, idx) => (
              <div
                key={`r1-${tech.id}-${idx}`}
                className="flex items-center gap-3 bg-[#0B2F63]/80 border border-[#BBC4D1]/20 hover:border-[#0075FF] px-5 py-3 rounded-xl transition-all duration-300 group shrink-0 cursor-pointer"
              >
                <div className="w-7 h-7 relative flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                  <img
                    src={tech.logo_url}
                    alt={tech.image_alt || tech.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {tech.name}
                </span>
                <span className="text-[10px] text-[#BBC4D1] bg-[#081D3A] px-2 py-0.5 rounded border border-[#163968]">
                  {tech.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2: RIGHT TO LEFT */}
        <div className="flex overflow-hidden select-none">
          <div className="animate-marquee-right flex items-center gap-6">
            {marqueeRow2.map((tech, idx) => (
              <div
                key={`r2-${tech.id}-${idx}`}
                className="flex items-center gap-3 bg-[#0B2F63]/80 border border-[#BBC4D1]/20 hover:border-[#0075FF] px-5 py-3 rounded-xl transition-all duration-300 group shrink-0 cursor-pointer"
              >
                <div className="w-7 h-7 relative flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                  <img
                    src={tech.logo_url}
                    alt={tech.image_alt || tech.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {tech.name}
                </span>
                <span className="text-[10px] text-[#BBC4D1] bg-[#081D3A] px-2 py-0.5 rounded border border-[#163968]">
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
