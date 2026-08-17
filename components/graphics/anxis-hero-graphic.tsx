'use client'

import { motion } from 'motion/react'
import { Icon } from '@/components/ui/hugeicons'
import { AnxisIcon } from '@/components/ui/anxis-logo'

export function AnxisHeroGraphic() {
  return (
    <div className="relative w-full aspect-square max-w-[560px] mx-auto flex items-center justify-center p-4 select-none">
      {/* Background Multi-color Aurora Mesh Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0099FF]/20 via-[#FF6B00]/15 to-[#00C968]/20 blur-3xl pointer-events-none" />

      {/* 1. TOP LEFT: FLOATING CONVERSION BOOST CARD (ORANGE / AMBER ACCENT) */}
      <motion.div
        animate={{ y: [-8, 8, -8], rotate: [-2, 1, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-2 sm:left-0 top-12 z-30 flex items-center gap-3 p-3.5 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-[10px] shadow-xl shadow-slate-900/10"
      >
        <div className="w-11 h-11 rounded-[10px] bg-gradient-to-tr from-[#FF6B00] to-[#FFB800] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
          <Icon name="BarChart" size={22} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-[#0F172A] font-heading">+320%</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-[10px] border border-emerald-200">ROI</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Conversão Metrificada</p>
        </div>
      </motion.div>

      {/* 2. CENTER: SMARTPHONE GLASS MOCKUP IN OBSIDIAN */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-[270px] sm:w-[310px] bg-slate-950 rounded-[2.8rem] p-3.5 shadow-2xl shadow-slate-950/40 border-4 border-slate-800"
      >
        {/* Dynamic Island / Speaker Notch */}
        <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2.5 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-slate-800 rounded-full ml-auto mr-3" />
        </div>

        {/* Screen Viewport */}
        <div className="bg-slate-900 rounded-[2.2rem] p-4 space-y-3.5 border border-slate-800/80 font-sans overflow-hidden relative">
          {/* Header inside Phone */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <AnxisIcon size={20} />
              <span className="text-xs font-black text-white tracking-widest font-heading">ANXIS</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Simulated Agency UI Card with Brand Gradient */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 rounded-[10px] p-3.5 border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#0099FF]/20 via-transparent to-transparent rounded-full pointer-events-none" />
            <div className="text-[10px] font-mono text-[#0099FF] uppercase tracking-wider font-bold">
              Nova Estrutura Ativa
            </div>
            <div className="text-xs font-black text-white font-heading leading-tight">
              E-commerce & Site de Alta Performance
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] rounded-full" />
              </div>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">100%</span>
            </div>
          </div>

          {/* Quick Stat row inside phone */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/80 rounded-[10px] p-2.5 border border-slate-800 text-center">
              <span className="text-[9px] text-slate-400 block font-medium">Velocidade</span>
              <span className="text-xs font-black text-emerald-400 font-mono">0.4s LCP</span>
            </div>
            <div className="bg-slate-950/80 rounded-[10px] p-2.5 border border-slate-800 text-center">
              <span className="text-[9px] text-slate-400 block font-medium">SEO Google</span>
              <span className="text-xs font-black text-[#0099FF] font-mono">Top #1</span>
            </div>
          </div>
        </div>

        {/* FLOATING OVERLAY: FLOATING CLIENT URL BADGE */}
        <motion.div
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-10 sm:-left-12 bottom-12 z-30 w-56 bg-[#0B0F19]/95 text-white p-3.5 rounded-[10px] shadow-2xl border border-white/15 backdrop-blur-xl space-y-1.5"
        >
          <div className="flex items-center gap-2 text-xs text-[#0099FF] font-extrabold">
            <Icon name="Globe" size={14} />
            <span>Site 100% Responsivo</span>
          </div>
          <p className="text-[10px] text-slate-300 font-mono truncate">
            https://suaempresa.com.br
          </p>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-[#00C968] to-[#0099FF]" />
          </div>
        </motion.div>
      </motion.div>

      {/* 3. TOP RIGHT: FLOATING GOOGLE LIGHTHOUSE SCORE CARD (EMERALD / MINT ACCENT) */}
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-2 sm:right-2 top-8 z-30 w-52 bg-white/95 backdrop-blur-xl rounded-[10px] p-4 shadow-xl shadow-slate-900/10 border border-slate-200/90 space-y-2 hidden sm:block"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
            <Icon name="Zap" size={15} className="text-amber-500" />
            <span>Google Score</span>
          </div>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[10px] border border-emerald-200">
            100/100
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div className="w-full h-full bg-gradient-to-r from-[#00C968] to-[#10B981] rounded-full" />
        </div>
        <p className="text-[10px] text-slate-500 font-medium">Nota máxima nos Core Web Vitals</p>
      </motion.div>

      {/* 4. BOTTOM RIGHT: 3D BRAND BEACON BADGE */}
      <motion.div
        animate={{ y: [8, -8, 8], rotate: [4, -4, 4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-4 sm:-right-6 bottom-10 z-20 hidden sm:flex items-center justify-center w-20 h-20 bg-white/95 backdrop-blur-xl rounded-[10px] shadow-2xl border border-slate-200/90 p-3 group cursor-pointer"
      >
        <AnxisIcon size={46} className="group-hover:scale-110 transition-transform duration-300" />
      </motion.div>
    </div>
  )
}
