'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadFormSchema, LeadFormData } from '@/lib/validations/lead-schema'
import { captureUTMs, UTMData } from '@/lib/analytics/utm'
import { submitLeadAction } from '@/lib/actions/leads'
import { trackEvent } from '@/lib/analytics/events'
import { CheckCircle2, Loader2, Send, ShieldCheck } from 'lucide-react'

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [utmParams, setUtmParams] = useState<UTMData>({})

  useEffect(() => {
    // Capture UTM parameters on initial client mount
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

  return (
    <section id="contato" className="py-24 bg-[#F7F8FA] relative border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl relative">
          {/* HEADER */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0075FF] bg-[#0075FF]/10 px-3.5 py-1.5 rounded-full border border-[#0075FF]/20">
              SOLICITE UMA PROPOSTA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0C1D36] tracking-tight">
              Conte sobre a sua necessidade
            </h2>
            <p className="text-sm sm:text-base text-[#596579]">
              Preencha o formulário abaixo para receber uma análise técnica e proposta comercial personalizada para o seu negócio.
            </p>
          </div>

          {/* SUCCESS STATE */}
          {isSuccess ? (
            <div className="text-center py-16 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-2xl font-extrabold text-[#0C1D36]">Proposta Enviada com Sucesso!</h3>
                <p className="text-sm text-[#596579] leading-relaxed">
                  Agradecemos seu contato. Nossa equipe técnica analisará as informações enviadas e retornará em até 24 horas úteis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="px-6 py-3 rounded-xl bg-[#081D3A] text-white text-xs font-bold hover:bg-[#0075FF] transition-colors"
              >
                Enviar nova solicitação
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* ANTISPAM HONEYPOT FIELD (Hidden) */}
              <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register('website_hp')} />

              {/* ROW 1: NAME & COMPANY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    {...register('name')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm text-[#0C1D36] transition-all outline-none"
                  />
                  {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Sua empresa"
                    {...register('company')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm text-[#0C1D36] transition-all outline-none"
                  />
                </div>
              </div>

              {/* ROW 2: EMAIL & WHATSAPP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-2">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    placeholder="seuemail@empresa.com.br"
                    {...register('email')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm text-[#0C1D36] transition-all outline-none"
                  />
                  {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-2">
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    {...register('whatsapp')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm text-[#0C1D36] transition-all outline-none"
                  />
                  {errors.whatsapp && <p className="text-xs text-rose-600 mt-1">{errors.whatsapp.message}</p>}
                </div>
              </div>

              {/* ROW 3: PROJECT TYPE & CURRENT PLATFORM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-2">
                    Tipo de Projeto *
                  </label>
                  <select
                    {...register('project_type')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm text-[#0C1D36] transition-all outline-none bg-white"
                  >
                    <option value="">Selecione o tipo de projeto</option>
                    <option value="Site institucional">Site Institucional</option>
                    <option value="Landing page">Landing Page</option>
                    <option value="Loja virtual">Loja Virtual (E-commerce)</option>
                    <option value="Reformulação">Reformulação de Site Existente</option>
                    <option value="Desenvolvimento personalizado">Desenvolvimento Sob Medida em Código</option>
                    <option value="Integração">Integrações & Melhorias Técnicas</option>
                    <option value="Ainda não sei">Ainda preciso de orientação</option>
                  </select>
                  {errors.project_type && <p className="text-xs text-rose-600 mt-1">{errors.project_type.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-2">
                    Plataforma Atual / Desejada
                  </label>
                  <select
                    {...register('current_platform')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm text-[#0C1D36] transition-all outline-none bg-white"
                  >
                    <option value="">Selecione a plataforma</option>
                    <option value="Ainda não possuo">Ainda não possuo site/loja</option>
                    <option value="Tray">Tray E-commerce</option>
                    <option value="Nuvemshop">Nuvemshop</option>
                    <option value="WordPress">WordPress / Elementor</option>
                    <option value="WooCommerce">WooCommerce</option>
                    <option value="Loja Integrada">Loja Integrada</option>
                    <option value="Desenvolvimento próprio">Código Próprio (Next.js/React)</option>
                    <option value="Outra">Outra plataforma</option>
                  </select>
                </div>
              </div>

              {/* ROW 4: BUDGET & DEADLINE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-2">
                    Faixa de Investimento Prevista
                  </label>
                  <select
                    {...register('budget_range')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm text-[#0C1D36] transition-all outline-none bg-white"
                  >
                    <option value="">Selecione a faixa estimada</option>
                    <option value="Até R$ 3.000">Até R$ 3.000</option>
                    <option value="R$ 3.000 a R$ 6.000">R$ 3.000 a R$ 6.000</option>
                    <option value="R$ 6.000 a R$ 12.000">R$ 6.000 a R$ 12.000</option>
                    <option value="Acima de R$ 12.000">Acima de R$ 12.000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-2">
                    Prazo Desejado
                  </label>
                  <select
                    {...register('desired_deadline')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm text-[#0C1D36] transition-all outline-none bg-white"
                  >
                    <option value="">Selecione a expectativa de entrega</option>
                    <option value="Urgente (Até 15 dias)">Urgente (Até 15 dias)</option>
                    <option value="Normal (30 dias)">Em até 30 dias</option>
                    <option value="Flexível (30 a 60 dias)">De 30 a 60 dias</option>
                  </select>
                </div>
              </div>

              {/* ROW 5: MESSAGE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-2">
                  Descrição do Projeto
                </label>
                <textarea
                  rows={4}
                  placeholder="Conte brevemente sobre o objetivo da sua empresa, páginas necessárias ou referências..."
                  {...register('message')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 text-sm text-[#0C1D36] transition-all outline-none resize-y"
                />
              </div>

              {/* ROW 6: CONSENT CHECKBOX */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  {...register('consent')}
                  className="mt-1 rounded border-slate-300 text-[#0075FF] focus:ring-[#0075FF]"
                />
                <label htmlFor="consent" className="text-xs text-[#596579] cursor-pointer">
                  Concordo em fornecer meus dados para que a equipe da ANXIS entre em contato com a proposta solicitada.
                </label>
              </div>
              {errors.consent && <p className="text-xs text-rose-600">{errors.consent.message}</p>}

              {/* ERROR ALERT */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-lg hover:shadow-glow-blue transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span>Enviando solicitação...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2.5" />
                      <span>Solicitar Proposta sem Compromisso</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#596579] pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Seus dados estão protegidos. Não enviamos spam.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
