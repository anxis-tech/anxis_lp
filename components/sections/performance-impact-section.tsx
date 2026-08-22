'use client'

import { motion } from 'motion/react'
import { Icon } from '@/components/ui/hugeicons'
import { trackEvent } from '@/lib/analytics/events'
import { cn, formatWhatsAppLink } from '@/lib/utils'

interface PerformanceImpactSectionProps {
  whatsapp?: string
}

export function PerformanceImpactSection({
  whatsapp = '5584987147049',
}: PerformanceImpactSectionProps) {
  const whatsappUrl = formatWhatsAppLink(
    whatsapp,
    'Olá! Gostaria de solicitar uma proposta para meu projeto com a ANXIS.'
  )

  const scrollToSection = (selector: string) => {
    const el = document.querySelector(selector)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-24 sm:py-32 bg-[#FFFFFF] text-[#0F172A] relative overflow-hidden select-none">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[#086ec5]/3 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-[#F89520]/3 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* GIANT WATERMARK '01' IN THE BACKGROUND */}
        <div
          className="absolute -top-10 sm:-top-16 left-2 sm:left-6 text-[150px] sm:text-[220px] lg:text-[260px] font-black text-slate-100/70 font-heading select-none pointer-events-none leading-none z-0"
          aria-hidden="true"
        >
          01
        </div>

        {/* TWO-COLUMN GRID: LEFT STRATEGIC CONTENT VS RIGHT 2X2 REFINED BENEFIT CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center relative z-10 pt-4 sm:pt-6">
          {/* LEFT COLUMN: CLEAR EDITORIAL TYPOGRAPHY & SOBER ACTION BUTTONS */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* 1. EYEBROW */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-[13px] font-heading font-bold uppercase tracking-widest text-[#086ec5]">
                DIFERENCIAIS
              </span>
              <div className="h-[1.5px] w-8 bg-[#086ec5]/30 rounded-full" />
            </div>

            {/* 2. HEADLINE (WEIGHT 700, LEADING 1.08, NATURAL 2-LINE WRAP) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#111827] tracking-tight leading-[1.08] font-heading max-w-xl">
              Sites desenvolvidos para performar de ponta a ponta
            </h2>

            {/* 3. SIMPLIFIED PARAGRAPH (SINGLE NEUTRAL TONE, SEMIBOLD EMPHASIS ONLY) */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans max-w-xl">
              Aplicamos boas práticas de{' '}
              <span className="font-semibold text-slate-800">SEO, performance, design e conversão</span> em cada
              projeto para criar sites rápidos, bem estruturados e preparados para gerar novas oportunidades.
            </p>

            {/* 4. SOBER ACTION BUTTONS (SUBDUED FOR AN INTERMEDIATE SECTION) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* PRIMARY TITLE-BLACK BUTTON */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent('click_whatsapp', { location: 'diferenciais_section' })
                }}
                className="inline-flex items-center justify-center px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-heading font-black text-white bg-[#2f2f2f] hover:bg-[#1f1f1f] border border-[#2f2f2f]/10 shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer uppercase tracking-wider"
              >
                <span>Solicitar proposta</span>
              </a>

              {/* SECONDARY CLEAN LINK */}
              <button
                type="button"
                onClick={() => scrollToSection('#servicos')}
                className="px-3 py-3.5 text-xs sm:text-sm font-heading font-semibold text-slate-700 hover:text-black transition-colors cursor-pointer inline-flex items-center gap-1.5 group"
              >
                <span>Conhecer Serviços</span>
                <Icon
                  name="ArrowRight"
                  size={14}
                  className="text-slate-400 group-hover:text-black group-hover:translate-x-1 transition-all"
                />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: 2x2 BALANCED SQUIRCLE BENEFIT CARDS */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-lg mx-auto lg:max-w-none">
              {/* CARD 1: PROTEÇÃO & SEO */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-[#F8F9FA] hover:bg-[#F3F4F6] border border-slate-200/60 rounded-[26px] sm:rounded-[28px] p-6 sm:p-7 flex flex-col justify-between text-left transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 min-h-[250px] sm:min-h-[270px] group"
              >
                {/* TOP GROUP: LABEL + ICON */}
                <div className="space-y-4 sm:space-y-5">
                  <span className="text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider text-slate-400 block">
                    PROTEÇÃO & SEO
                  </span>

                  {/* SEO Magnifier Icon */}
                  <div className="group-hover:scale-105 transition-transform duration-300 inline-block">
                    <svg
                      className="w-8 h-8 sm:w-9 sm:h-9 text-[#086ec5]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="10" cy="10" r="7.5" strokeWidth="1.8" />
                      <path d="M15.5 15.5L21 21" strokeWidth="2.4" strokeLinecap="round" />
                      <path d="M18 3v3M19.5 4.5h-3" strokeWidth="1.5" opacity="0.75" />
                      <text
                        x="10"
                        y="12"
                        textAnchor="middle"
                        fontSize="5.2"
                        fontWeight="900"
                        fontFamily="var(--font-plus-jakarta), sans-serif"
                        fill="currentColor"
                        stroke="none"
                        letterSpacing="-0.3px"
                      >
                        SEO
                      </text>
                    </svg>
                  </div>
                </div>

                {/* BOTTOM GROUP: BENEFIT TITLE + DESCRIPTION */}
                <div className="space-y-1.5 pt-3">
                  <h3 className="text-base sm:text-[17px] font-bold text-slate-900 font-heading leading-snug">
                    Preparado para o Google
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 font-sans font-normal leading-relaxed">
                    Estrutura técnica e boas práticas de SEO aplicadas desde o desenvolvimento para facilitar indexação e
                    rastreamento.
                  </p>
                </div>
              </motion.div>

              {/* CARD 2: ALTA VELOCIDADE (SOPHISTICATED DARK HIGHLIGHT) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-[#151922] text-white border border-slate-800/80 rounded-[26px] sm:rounded-[28px] p-6 sm:p-7 flex flex-col justify-between text-left transition-all duration-300 shadow-xl shadow-slate-950/20 hover:shadow-2xl hover:-translate-y-0.5 min-h-[250px] sm:min-h-[270px] relative overflow-hidden group"
              >
                {/* SUBTLE AMBIENT ACCENT INSIDE CARD */}
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 75% 25%, rgba(0, 201, 104, 0.15), transparent 60%)',
                  }}
                />

                {/* TOP GROUP: LABEL + GAUGE */}
                <div className="space-y-3 sm:space-y-4 relative z-10">
                  <span className="text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider text-slate-400 block">
                    ALTA VELOCIDADE
                  </span>

                  {/* Refined Circular PageSpeed Gauge with Score 99 */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-14 h-14 sm:w-16 sm:h-16 -rotate-90" viewBox="0 0 48 48">
                      <defs>
                        <linearGradient id="pagespeed-gauge-clean" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00E68A" />
                          <stop offset="60%" stopColor="#00C968" />
                          <stop offset="100%" stopColor="#38BDF8" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="24"
                        cy="24"
                        r="19"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="19"
                        fill="none"
                        stroke="url(#pagespeed-gauge-clean)"
                        strokeWidth="3.2"
                        strokeDasharray="119.38"
                        strokeDashoffset="6"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[17px] sm:text-[19px] font-heading font-black text-white leading-none tracking-tight">
                        99
                      </span>
                      <span className="text-[7.5px] font-heading font-extrabold text-[#00E68A] leading-none mt-0.5 tracking-wider">
                        SCORE
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM GROUP: BENEFIT TITLE + DESCRIPTION */}
                <div className="space-y-1.5 pt-3 relative z-10">
                  <h3 className="text-base sm:text-[17px] font-bold text-white font-heading leading-snug">
                    Performance otimizada
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-300 font-sans font-normal leading-relaxed">
                    Carregamento rápido e estrutura otimizada para alcançar excelente desempenho no PageSpeed.
                  </p>
                </div>
              </motion.div>

              {/* CARD 3: DESIGN AUTORAL */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-[#F8F9FA] hover:bg-[#F3F4F6] border border-slate-200/60 rounded-[26px] sm:rounded-[28px] p-6 sm:p-7 flex flex-col justify-between text-left transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 min-h-[250px] sm:min-h-[270px] group"
              >
                {/* TOP GROUP: LABEL + FIGMA LOGO */}
                <div className="space-y-4 sm:space-y-5">
                  <span className="text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider text-slate-400 block">
                    DESIGN AUTORAL
                  </span>

                  {/* Proportional Official Figma Logo */}
                  <div className="group-hover:scale-105 transition-transform duration-300 inline-block">
                    <svg className="w-6 h-8 sm:w-6.5 sm:h-9" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
                        fill="#1ABCFE"
                      />
                      <path
                        d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
                        fill="#0ACF83"
                      />
                      <path
                        d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
                        fill="#FF7262"
                      />
                      <path
                        d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
                        fill="#F24E1E"
                      />
                      <path
                        d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
                        fill="#A259FF"
                      />
                    </svg>
                  </div>
                </div>

                {/* BOTTOM GROUP: BENEFIT TITLE + DESCRIPTION */}
                <div className="space-y-1.5 pt-3">
                  <h3 className="text-base sm:text-[17px] font-bold text-slate-900 font-heading leading-snug">
                    Interfaces criadas para sua marca
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 font-sans font-normal leading-relaxed">
                    Cada projeto recebe uma interface exclusiva, desenvolvida para unir identidade, clareza e experiência
                    de navegação.
                  </p>
                </div>
              </motion.div>

              {/* CARD 4: ALTA CONVERSÃO */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-[#F8F9FA] hover:bg-[#F3F4F6] border border-slate-200/60 rounded-[26px] sm:rounded-[28px] p-6 sm:p-7 flex flex-col justify-between text-left transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 min-h-[250px] sm:min-h-[270px] group"
              >
                {/* TOP GROUP: LABEL + CONVERSION ICON */}
                <div className="space-y-4 sm:space-y-5">
                  <span className="text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider text-slate-400 block">
                    ALTA CONVERSÃO
                  </span>

                  {/* Users to Coin Conversion Flow Icon in #F89520 */}
                  <div className="group-hover:scale-105 transition-transform duration-300 inline-block">
                    <svg
                      className="w-8 h-8 sm:w-9 sm:h-9 text-[#F89520]"
                      viewBox="0 0 32 32"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="6" cy="11.5" r="2.5" />
                      <path d="M 2 19.5 C 2 16.5, 3.8 15.5, 6 15.5 C 8.2 15.5, 10 16.5, 10 19.5" />
                      <circle cx="11.5" cy="8" r="2.2" />
                      <path d="M 8.8 14 C 9.8 12.8, 11 12.5, 12.2 12.5 C 14 12.5, 15.5 13.5, 15.5 16.5" />
                      <circle cx="16.5" cy="5.5" r="2" />
                      <path d="M 14.8 10.8 C 15.8 9.8, 16.8 9.5, 18 9.5 C 19.5 9.5, 20.8 10.5, 20.8 13" />
                      <path d="M 21.5 5 C 25.5 5, 27.5 7.5, 27.5 10.5" />
                      <polyline points="25.5 10 27.5 12 29.5 10" />
                      <path d="M 4.5 21.5 C 4.5 25.5, 7.5 27.5, 10.5 27.5" />
                      <polyline points="8.5 29.5 10.5 27.5 8.5 25.5" />
                      <circle cx="21" cy="21" r="7" strokeWidth="1.8" />
                      <circle cx="21" cy="21" r="5.2" strokeWidth="1.2" strokeDasharray="1.5 1.5" opacity="0.6" />
                      <path
                        d="M 22.2 18.2 C 22.2 17.2, 21.6 16.8, 21 16.8 C 20.2 16.8, 19.8 17.4, 19.8 18.2 C 19.8 19.6, 22.2 19.6, 22.2 21 C 22.2 21.8, 21.6 22.4, 21 22.4 C 20.2 22.4, 19.8 21.8, 19.8 21"
                        strokeWidth="1.5"
                      />
                      <line x1="21" y1="15.8" x2="21" y2="23.4" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

                {/* BOTTOM GROUP: BENEFIT TITLE + DESCRIPTION */}
                <div className="space-y-1.5 pt-3">
                  <h3 className="text-base sm:text-[17px] font-bold text-slate-900 font-heading leading-snug">
                    Estrutura focada em resultados
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 font-sans font-normal leading-relaxed">
                    Experiência planejada para transformar visitantes em contatos, oportunidades e novos clientes.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
