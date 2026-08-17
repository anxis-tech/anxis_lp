'use client'

import { motion } from 'motion/react'

export function PerformanceImpactSection() {
  return (
    <section className="py-24 sm:py-32 bg-[#FFFFFF] text-[#0F172A] relative overflow-hidden border-b border-slate-200/80">
      {/* Ambient background brand glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[#0099FF]/6 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-[#FF6B00]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* TOP LAYOUT: LEFT TEXT & PROGRESS BARS VS RIGHT 3D GLASS COMPOSITION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* LEFT COLUMN: PERSUASIVE TYPOGRAPHY & PROGRESS METRICS */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="text-xs font-mono uppercase tracking-[0.2em] px-4 py-1.5 rounded-[20px] bg-slate-100 border border-slate-200/90 inline-block font-extrabold text-gradient-anxis">
              TECNOLOGIA & ALTA PERFORMANCE
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2f2f2f] tracking-tight leading-[1.1] font-heading">
              Como a ANXIS impulsiona os resultados do seu negócio
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
              Desenvolvemos projetos em código otimizado e nas melhores plataformas do mercado. Cada site, landing page ou e-commerce é construído para entregar carregamento instantâneo, SEO impecável e máxima conversão.
            </p>

            {/* COMPARATIVE PROGRESS BARS */}
            <div className="space-y-5 pt-4 max-w-lg">
              {/* BAR 1: ANXIS HIGH PERFORMANCE (BRAND MULTI-COLOR GRADIENT) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#2f2f2f] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Projetos desenvolvidos com a ANXIS
                  </span>
                  <span className="text-gradient-anxis font-mono font-black text-sm">99%</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-[20px] overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '99%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] rounded-[20px] shadow-sm"
                  />
                </div>
              </div>

              {/* BAR 2: TRADITIONAL NON-OPTIMIZED SITES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Sites tradicionais sem otimização</span>
                  <span className="font-mono">55%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-[20px] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '55%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                    className="h-full bg-slate-300 rounded-[20px] opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 3D TRANSLUCENT GLASS CLOUD & PERFORMANCE GRAPHIC */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center p-4">
              {/* 3D Glass Cloud & CPU Chip SVG Motif */}
              <motion.div
                animate={{ y: [-8, 8, -8], rotate: [-1, 1, -1] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <svg className="w-full h-full drop-shadow-[0_25px_50px_rgba(0,153,255,0.2)]" viewBox="0 0 320 320" fill="none">
                  <defs>
                    <linearGradient id="cloudGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                      <stop offset="35%" stopColor="#BAE6FD" stopOpacity="0.7" />
                      <stop offset="70%" stopColor="#A7F3D0" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#0099FF" stopOpacity="0.85" />
                    </linearGradient>
                    <linearGradient id="cpuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF6B00" />
                      <stop offset="50%" stopColor="#00C968" />
                      <stop offset="100%" stopColor="#0099FF" />
                    </linearGradient>
                  </defs>

                  {/* Outer Cloud Glass Background Shape */}
                  <path
                    d="M 80 180 C 50 180, 30 150, 40 120 C 50 90, 90 80, 110 90 C 130 60, 190 50, 220 80 C 250 80, 280 110, 270 140 C 290 170, 270 200, 230 200 C 210 210, 100 210, 80 180 Z"
                    fill="url(#cloudGlassGrad)"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    opacity="0.9"
                  />

                  {/* 3D Floating Typography Text "PERFORMANCE" */}
                  <text
                    x="160"
                    y="75"
                    textAnchor="middle"
                    fill="#0099FF"
                    fontSize="22"
                    fontWeight="900"
                    letterSpacing="4"
                    opacity="0.95"
                    className="font-heading"
                  >
                    PERFORMANCE
                  </text>

                  {/* Center CPU Chip Icon Container with Brand Gradient */}
                  <rect x="120" y="125" width="80" height="80" rx="20" fill="url(#cpuGrad)" stroke="#FFFFFF" strokeWidth="2.5" />
                  <text x="160" y="173" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="900" className="font-heading">
                    ⚡
                  </text>

                  {/* Circuit Pins */}
                  <circle cx="120" cy="140" r="3" fill="#FFFFFF" />
                  <circle cx="120" cy="160" r="3" fill="#FFFFFF" />
                  <circle cx="120" cy="180" r="3" fill="#FFFFFF" />
                  <circle cx="200" cy="140" r="3" fill="#FFFFFF" />
                  <circle cx="200" cy="160" r="3" fill="#FFFFFF" />
                  <circle cx="200" cy="180" r="3" fill="#FFFFFF" />
                </svg>
              </motion.div>
            </div>
          </div>
        </div>

        {/* BOTTOM METRICS CARDS ROW (3 HIGHLIGHT CARDS WITH INDIVIDUAL BRAND COLORS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* CARD 1: SKY BLUE */}
          <div className="bg-slate-50 hover:bg-white rounded-[20px] p-8 border border-slate-200/80 hover:border-[#0099FF]/60 transition-all duration-300 shadow-sm hover:shadow-xl space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#0099FF] to-[#0284C7] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl sm:text-5xl font-black text-[#0099FF] font-heading">
              70%
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#2f2f2f]">Otimização de Velocidade</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">Carregamento instantâneo que reduz drasticamente o abandono de visitantes.</p>
            </div>
          </div>

          {/* CARD 2: EMERALD */}
          <div className="bg-slate-50 hover:bg-white rounded-[20px] p-8 border border-slate-200/80 hover:border-emerald-400 transition-all duration-300 shadow-sm hover:shadow-xl space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#00C968] to-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl sm:text-5xl font-black text-emerald-600 font-heading">
              5x
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#2f2f2f]">Mais Capacidade de Escala</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">Estrutura preparada para suportar picos elevados de tráfego e vendas simultâneas.</p>
            </div>
          </div>

          {/* CARD 3: ORANGE */}
          <div className="bg-slate-50 hover:bg-white rounded-[20px] p-8 border border-slate-200/80 hover:border-orange-400 transition-all duration-300 shadow-sm hover:shadow-xl space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#FF6B00] to-[#FFB800] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl sm:text-5xl font-black text-orange-500 font-heading">
              +300%
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#2f2f2f]">Crescimento em Conversão</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">Design e arquitetura focados em transformar visitantes em leads e clientes fiéis.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
