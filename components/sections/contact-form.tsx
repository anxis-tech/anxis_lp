'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadFormSchema, LeadFormData } from '@/lib/validations/lead-schema'
import { captureUTMs, UTMData } from '@/lib/analytics/utm'
import { submitLeadAction } from '@/lib/actions/leads'
import { trackEvent } from '@/lib/analytics/events'
import { FAQItem } from '@/types/database.types'
import { INITIAL_FAQS } from '@/lib/constants/initial-data'
import { Icon } from '@/components/ui/hugeicons'
import { ChevronDown, Loader2 } from 'lucide-react'
import { cn, formatWhatsAppLink } from '@/lib/utils'

interface ContactFormProps {
  faqs?: FAQItem[]
  whatsapp?: string
}

export function ContactForm({ faqs = INITIAL_FAQS, whatsapp = '5511999999999' }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [utmParams, setUtmParams] = useState<UTMData>({})

  const visibleFaqs = faqs.filter((f) => f.is_visible)
  const [openFaqId, setOpenFaqId] = useState<string | null>(visibleFaqs[0]?.id || null)

  useEffect(() => {
    const utms = captureUTMs()
    setUtmParams(utms)
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      whatsapp: '',
      project_type: '',
      current_platform: '',
      budget_range: '',
      desired_deadline: '',
      message: '',
      consent: true,
      website_hp: '',
    },
  })

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    trackEvent('form_submit_start')

    try {
      const response = await submitLeadAction(data, utmParams)

      if (response.success) {
        setIsSuccess(true)
        trackEvent('form_submit_success', { project_type: data.project_type })
        reset()
      } else {
        setErrorMessage(response.message || 'Ocorreu um erro ao enviar. Tente novamente.')
        trackEvent('form_submit_error', { message: response.message })
      }
    } catch (err: any) {
      setErrorMessage('Erro na comunicação com o servidor. Tente novamente.')
      trackEvent('form_submit_error', { message: err?.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAccordion = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id))
  }

  const whatsappUrl = formatWhatsAppLink(
    whatsapp,
    'Olá! Estava navegando nas dúvidas frequentes e gostaria de tirar uma dúvida sobre meu projeto.'
  )

  // Generate JSON-LD Schema.org for Google FAQPage
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: visibleFaqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <section id="contato" className="py-24 sm:py-32 bg-[#FAFBFC] text-[#0F172A] relative border-t border-slate-200">
      {/* Schema.org FAQ Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* UNIFIED 50/50 SPLIT GRID (FAQ LEFT VS FORM RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT 50%: FAQ ACCORDIONS (LG:COL-SPAN-6) */}
          <div id="faq" className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-gradient-anxis bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 inline-block font-extrabold">
                DÚVIDAS FREQUENTES
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight font-heading">
                Perguntas Frequentes
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                Tire suas dúvidas sobre nosso processo de desenvolvimento, prazos, plataformas e suporte técnico.
              </p>
            </div>

            {/* ACCORDIONS LIST */}
            <div className="space-y-3 pt-2">
              {visibleFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id

                return (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      aria-expanded={isOpen}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 font-extrabold text-sm sm:text-base text-[#0F172A] hover:text-[#0099FF] transition-colors focus:outline-none cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <Icon name="Filter" size={16} className="text-amber-500 shrink-0" />
                        <span>{faq.question}</span>
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300',
                          isOpen ? 'transform rotate-180 text-emerald-500' : ''
                        )}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* QUICK WHATSAPP HELPER BADGE */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#0F172A]">Ainda possui alguma dúvida específica?</p>
                <p className="text-[11px] text-slate-600">Fale diretamente com nossa equipe no WhatsApp.</p>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('click_whatsapp', { location: 'faq_side' })}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <Icon name="MessageSquare" size={14} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* RIGHT 50%: PROPOSAL CONTACT FORM (LG:COL-SPAN-6) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative space-y-6">
              {/* FORM HEADER */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-gradient-anxis bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 inline-block">
                  SOLICITE UMA PROPOSTA
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight font-heading">
                  Conte sobre o seu projeto
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Preencha o formulário para receber uma análise técnica e orçamento personalizado sem compromisso.
                </p>
              </div>

              {/* SUCCESS STATE */}
              {isSuccess ? (
                <div className="text-center py-12 space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#00C968] to-[#0099FF] text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Icon name="Check" size={32} />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h4 className="text-xl font-black text-[#0F172A] font-heading">Proposta Enviada!</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Nossa equipe analisará as informações enviadas e retornará em até 24 horas úteis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSuccess(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Enviar nova solicitação
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* ANTISPAM HONEYPOT FIELD (Hidden) */}
                  <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register('website_hp')} />

                  {/* ROW 1: NAME & COMPANY */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        placeholder="Seu nome"
                        {...register('name')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0099FF] focus:ring-2 focus:ring-[#0099FF]/20 text-xs text-[#0F172A] transition-all outline-none"
                      />
                      {errors.name && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5">
                        Empresa
                      </label>
                      <input
                        type="text"
                        placeholder="Sua empresa"
                        {...register('company')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0099FF] focus:ring-2 focus:ring-[#0099FF]/20 text-xs text-[#0F172A] transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* ROW 2: EMAIL & WHATSAPP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        placeholder="seuemail@empresa.com"
                        {...register('email')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0099FF] focus:ring-2 focus:ring-[#0099FF]/20 text-xs text-[#0F172A] transition-all outline-none"
                      />
                      {errors.email && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5">
                        WhatsApp *
                      </label>
                      <input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        {...register('whatsapp')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0099FF] focus:ring-2 focus:ring-[#0099FF]/20 text-xs text-[#0F172A] transition-all outline-none"
                      />
                      {errors.whatsapp && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.whatsapp.message}</p>}
                    </div>
                  </div>

                  {/* ROW 3: PROJECT TYPE & BUDGET */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5">
                        Tipo de Projeto *
                      </label>
                      <select
                        {...register('project_type')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0099FF] focus:ring-2 focus:ring-[#0099FF]/20 text-xs text-[#0F172A] transition-all outline-none bg-white font-medium"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="Site institucional">Site Institucional</option>
                        <option value="Landing page">Landing Page</option>
                        <option value="Loja virtual">Loja Virtual (E-commerce)</option>
                        <option value="Reformulação">Reformulação de Site</option>
                        <option value="Desenvolvimento personalizado">Código Sob Medida</option>
                        <option value="Ainda não sei">Preciso de orientação</option>
                      </select>
                      {errors.project_type && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{errors.project_type.message}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5">
                        Investimento Previsto
                      </label>
                      <select
                        {...register('budget_range')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0099FF] focus:ring-2 focus:ring-[#0099FF]/20 text-xs text-[#0F172A] transition-all outline-none bg-white font-medium"
                      >
                        <option value="">Faixa estimada</option>
                        <option value="Até R$ 3.000">Até R$ 3.000</option>
                        <option value="R$ 3.000 a R$ 6.000">R$ 3.000 a R$ 6.000</option>
                        <option value="R$ 6.000 a R$ 12.000">R$ 6.000 a R$ 12.000</option>
                        <option value="Acima de R$ 12.000">Acima de R$ 12.000</option>
                      </select>
                    </div>
                  </div>

                  {/* ROW 4: MESSAGE */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5">
                      Descrição Resumida
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Conte sobre o objetivo da empresa, páginas necessárias ou referências..."
                      {...register('message')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0099FF] focus:ring-2 focus:ring-[#0099FF]/20 text-xs text-[#0F172A] transition-all outline-none resize-y"
                    />
                  </div>

                  {/* CONSENT CHECKBOX */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="consent"
                      {...register('consent')}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-[#0099FF]"
                    />
                    <label htmlFor="consent" className="text-[11px] text-slate-600 cursor-pointer font-medium leading-tight">
                      Concordo em fornecer meus dados para que a ANXIS entre em contato com a proposta.
                    </label>
                  </div>
                  {errors.consent && <p className="text-[10px] text-rose-600 font-semibold">{errors.consent.message}</p>}

                  {/* ERROR ALERT */}
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {errorMessage}
                    </div>
                  )}

                  {/* SUBMIT BUTTON WITH MULTI-COLOR BRAND GRADIENT */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#FF6B00] via-[#00C968] to-[#0099FF] hover:opacity-95 shadow-xl shadow-orange-500/15 transition-all duration-200 disabled:opacity-50 cursor-pointer group"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                          <span>Enviando solicitação...</span>
                        </>
                      ) : (
                        <>
                          <span>Solicitar Proposta sem Compromisso</span>
                          <Icon name="ArrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
