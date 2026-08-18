'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { Search, Gauge, Target, CheckCircle2 } from 'lucide-react'

export function PerformanceImpactSection() {
  const journeySteps = [
    {
      key: 'seo',
      label: 'SEO',
      image: '/images/jornada-seo.svg',
      alt: 'SEO - Estrutura e indexação no Google',
      color: '#086ec5',
      textColor: 'text-[#086ec5]',
    },
    {
      key: 'velocidade',
      label: 'VELOCIDADE',
      image: '/images/jornada-velocidade.svg',
      alt: 'Velocidade - Carregamento rápido',
      color: '#059669',
      textColor: 'text-[#059669]',
    },
    {
      key: 'conversao',
      label: 'CONVERSÃO',
      image: '/images/jornada-conversao.svg',
      alt: 'Conversão - Visitantes em clientes',
      color: '#F86533',
      textColor: 'text-[#F86533]',
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-[#FFFFFF] text-[#0F172A] relative overflow-hidden">
      {/* Ambient background brand glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[#086ec5]/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-[#F86533]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16 sm:space-y-20">
        {/* TOP LAYOUT: LEFT PERSUASIVE CONTENT & JOURNEY VS RIGHT 3D TECH COMPOSITION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* LEFT COLUMN: PERSUASIVE TYPOGRAPHY & STRATEGIC JOURNEY */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* EYEBROW */}
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] px-4 py-1.5 rounded-[20px] bg-slate-100/90 border border-slate-200/90 font-extrabold">
              <span className="text-[#086ec5]">SEO</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#059669]">PERFORMANCE</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#F86533]">CONVERSÃO</span>
            </div>

            {/* MAIN HEADLINE */}
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#2f2f2f] tracking-tight leading-[1.15] font-heading">
              Seu site não precisa apenas existir. Ele precisa{' '}
              <span className="text-[#086ec5] bg-gradient-to-r from-[#086ec5] to-[#0a7ee0] bg-clip-text text-transparent">
                ser encontrado.
              </span>
            </h2>

            {/* DESCRIPTION */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
              Desenvolvemos sites com estrutura preparada para o Google, carregamento rápido e boas práticas de SEO para aumentar sua visibilidade nas pesquisas e transformar acessos em novas oportunidades.
            </p>

            {/* STRATEGIC PIPELINE: SEO -> VELOCIDADE -> CONVERSÃO */}
            <div className="pt-2 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                A Jornada Estratégica do Seu Projeto
              </span>

              {/* 3 INDIVIDUAL ILLUSTRATIONS & TIMELINE TRACK */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-xl"
              >
                {/* 3 IMAGES ROW */}
                <div className="grid grid-cols-3 gap-6 sm:gap-10 items-end">
                  {journeySteps.map((step, idx) => (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className="flex flex-col items-center justify-end"
                    >
                      <div className="relative w-full aspect-[896/1216] max-h-[150px] sm:max-h-[170px] flex items-center justify-center">
                        <Image
                          src={step.image}
                          alt={step.alt}
                          width={896}
                          height={1216}
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                          priority
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* TIMELINE TRACK ("TRILHA") */}
                <div className="relative mt-4 pt-1">
                  {/* Continuous Connecting Line */}
                  <div className="absolute top-[5px] left-[16.67%] right-[16.67%] h-[1.5px] bg-slate-300" />

                  {/* 3 Track Dots & Text Labels */}
                  <div className="grid grid-cols-3 gap-6 sm:gap-10 relative z-10 text-center">
                    {journeySteps.map((step) => (
                      <div key={step.key} className="flex flex-col items-center">
                        {/* Dot */}
                        <div
                          className="w-2.5 h-2.5 rounded-full border-2 bg-white shadow-2xs transition-transform duration-300 hover:scale-125"
                          style={{ borderColor: step.color, backgroundColor: step.color }}
                        />
                        {/* Label */}
                        <span
                          className={`mt-2 text-xs sm:text-[13px] font-black tracking-wider uppercase font-heading ${step.textColor}`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* RIGHT COLUMN: REFINED 3D GLASS CARD FOR SEO + VELOCIDADE + CONVERSÃO */}
          <div className="lg:col-span-5 flex justify-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative w-full max-w-[420px]"
            >
              {/* BACKDROP GLOWS */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#086ec5]/15 via-emerald-500/10 to-[#FF6B00]/15 rounded-[28px] blur-xl opacity-80 pointer-events-none" />

              {/* COCKPIT GLASS CONTAINER */}
              <div className="relative bg-white/90 backdrop-blur-md rounded-[24px] border border-slate-200/90 shadow-xl p-5 sm:p-6 space-y-4">
                {/* 1. MOCK GOOGLE SEARCH PILL */}
                <div className="bg-slate-50 rounded-[16px] p-3.5 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#086ec5] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Search className="w-3 h-3" />
                    </div>
                    <div className="flex-1 bg-white rounded-full px-3 py-1 text-[11px] font-mono text-slate-600 border border-slate-200 truncate flex items-center justify-between">
                      <span className="truncate">site para sua empresa</span>
                      <span className="text-[9px] text-[#086ec5] font-bold shrink-0 ml-1">Buscar</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-[12px] p-2.5 border border-slate-100 flex items-center justify-between shadow-2xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Indexado no Google
                      </span>
                      <p className="text-xs font-bold text-[#2f2f2f] truncate">Sua Empresa | Site Oficial</p>
                    </div>
                    <span className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-[6px] bg-blue-50 text-[#086ec5] border border-blue-200">
                      1ª Página
                    </span>
                  </div>
                </div>

                {/* 2. SPLIT ROW: SPEED METRICS & CONVERSION SIGNAL */}
                <div className="grid grid-cols-2 gap-3">
                  {/* SPEED DIAL */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-[16px] p-3.5 border border-emerald-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <Gauge className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-mono font-black text-emerald-600">99/100</span>
                    </div>
                    <div className="pt-1">
                      <div className="text-xs font-extrabold text-[#2f2f2f]">Carregamento</div>
                      <p className="text-[10px] text-slate-500">Instantâneo (&lt; 0.8s)</p>
                    </div>
                  </div>

                  {/* CONVERSION METRIC */}
                  <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-[16px] p-3.5 border border-orange-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <Target className="w-4 h-4 text-[#FF6B00]" />
                      <span className="text-xs font-mono font-black text-[#FF6B00]">Alta Taxa</span>
                    </div>
                    <div className="pt-1">
                      <div className="text-xs font-extrabold text-[#2f2f2f]">Conversão</div>
                      <p className="text-[10px] text-slate-500">Visitante → Cliente</p>
                    </div>
                  </div>
                </div>

                {/* 3. CONVERSION EVENT TOAST NOTIFICATION */}
                <div className="bg-slate-900 text-white rounded-[14px] px-3.5 py-2.5 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span className="text-xs font-bold truncate">Novo contato recebido via Google</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0 ml-2">Agora</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
