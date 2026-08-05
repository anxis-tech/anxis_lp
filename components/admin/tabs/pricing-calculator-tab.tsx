'use client'

import { useState } from 'react'
import {
  QuoteFormData,
  PricingConfig,
  SavedQuote,
} from '@/types/pricing.types'
import {
  DEFAULT_PRICING_CONFIG,
  calculateProjectQuote,
} from '@/lib/utils/pricing-calculator'
import { saveQuoteAction } from '@/lib/actions/quotes'
import {
  STRICT_PROJECT_TYPES,
  CONTENT_COPY_OPTIONS,
  URGENCY_OPTIONS,
  StrictProjectType,
  ContentCopyOption,
  UrgencyOption,
  quoteFormSchema,
} from '@/lib/validations/quote-schema'
import { Icon } from '@/components/ui/icon'
import { PricingNavIcon } from '@/lib/icons/navigation'
import {
  ConfigActionIcon,
  DuplicateActionIcon,
  SaveActionIcon,
  SparklesActionIcon,
  AddActionIcon,
} from '@/lib/icons/actions'
import {
  SuccessStatusIcon,
  WarningStatusIcon,
} from '@/lib/icons/status'

interface PricingCalculatorTabProps {
  canManageSettings?: boolean
  canSaveQuote?: boolean
  onSaveQuote?: (quote: SavedQuote) => void
  onConvertToProject?: (quote: SavedQuote) => void
  initialData?: QuoteFormData
}

export function PricingCalculatorTab({
  canManageSettings = true,
  canSaveQuote = true,
  onSaveQuote,
  onConvertToProject,
  initialData,
}: PricingCalculatorTabProps) {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  // Default Form State
  const [formData, setFormData] = useState<QuoteFormData>(
    initialData || {
      clientName: '',
      company: '',
      projectName: '',
      projectType: 'Site institucional',
      platform: 'Next.js',
      pageCount: 5,
      additionalPageCount: 0,
      hasCustomCode: false,
      hasBlogModule: false,
      complexity: 'Simples',
      contentOption: 'Cliente fornecerá todo o conteúdo',
      urgency: 'Prazo normal',
      discountAmount: 0,
      additionalCosts: 0,
      taxPercent: 0,
      notes: '',
    }
  )

  const [validationError, setValidationError] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [saveSuccessFeedback, setSaveSuccessFeedback] = useState(false)

  // Calculate realtime breakdown
  const breakdown = calculateProjectQuote(formData, pricingConfig)

  const isLojaVirtual = formData.projectType === 'Loja virtual'

  const handleFormChange = <K extends keyof QuoteFormData>(field: K, value: QuoteFormData[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setValidationError(null)
  }

  const handleSaveQuote = async (andConvert = false) => {
    // Validate schema
    const result = quoteFormSchema.safeParse(formData)
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message || 'Preencha os campos obrigatórios.')
      return
    }

    const newQuote: SavedQuote = {
      id: `q-${Date.now()}`,
      client_name: formData.clientName,
      company: formData.company,
      project_name: formData.projectName,
      project_type: formData.projectType,
      platform: formData.platform,
      form_data: { ...formData },
      pricing_snapshot: JSON.parse(JSON.stringify(pricingConfig)),
      calculation_breakdown: { ...breakdown },
      subtotal: breakdown.subtotal,
      discount: breakdown.discount,
      additional_costs: breakdown.additionalCosts,
      taxes: breakdown.taxes,
      final_value: breakdown.finalValue,
      status: andConvert ? 'Convertido em Projeto' : 'Aprovado',
      notes: formData.notes,
      created_by_name: 'Administrador ANXIS',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await saveQuoteAction(newQuote)

    if (onSaveQuote) onSaveQuote(newQuote)

    if (andConvert && onConvertToProject) {
      onConvertToProject(newQuote)
    } else {
      setSaveSuccessFeedback(true)
      setTimeout(() => setSaveSuccessFeedback(false), 3000)
    }
  }

  const handleCopySummary = () => {
    const text = `
📌 ORÇAMENTO ESTIMADO ANXIS
----------------------------------
Cliente: ${formData.clientName || 'Cliente'} ${formData.company ? `(${formData.company})` : ''}
Projeto: ${formData.projectName || formData.projectType}
Tipo de Projeto: ${formData.projectType}
Páginas: ${isLojaVirtual ? 'N/A (Loja Virtual)' : `${formData.pageCount} padrão`} + ${formData.additionalPageCount} adicionais
Desenvol. Código Personalizado: ${formData.hasCustomCode ? 'Sim' : 'Não'}
Módulo Blog Adicional: ${formData.hasBlogModule ? 'Sim' : 'Não'}
Conteúdo: ${formData.contentOption}
Urgência: ${formData.urgency}

Subtotal: R$ ${breakdown.subtotal.toLocaleString('pt-BR')}
Desconto: R$ ${breakdown.discount.toLocaleString('pt-BR')}
Impostos (${formData.taxPercent}%): R$ ${breakdown.taxes.toLocaleString('pt-BR')}
----------------------------------
VALOR FINAL: R$ ${breakdown.finalValue.toLocaleString('pt-BR')}
`
    navigator.clipboard.writeText(text)
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 2000)
  }

  return (
    <div className="space-y-6 text-[#0C1D36] max-w-full overflow-hidden font-sans">
      {/* HEADER & TOP CONTROLS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Icon icon={PricingNavIcon} size={20} className="text-[#0075FF]" />
            <span>Calculadora Comercial de Precificação</span>
          </h2>
          <p className="text-xs text-slate-500">
            Estimativa de orçamentos e escopo operacional em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageSettings && (
            <button
              type="button"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Icon icon={ConfigActionIcon} size={16} className="text-slate-600" />
              <span>{isConfigOpen ? 'Fechar Configurações' : 'Configurar Valores'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors"
          >
            <Icon icon={DuplicateActionIcon} size={16} className="text-[#0075FF]" />
            <span>{copyFeedback ? 'Copiado!' : 'Copiar Resumo'}</span>
          </button>
        </div>
      </div>

      {/* VALIDATION & SUCCESS BANNERS */}
      {validationError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Icon icon={WarningStatusIcon} size={16} className="shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {saveSuccessFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Icon icon={SuccessStatusIcon} size={16} className="shrink-0 text-emerald-600" />
          <span>Orçamento salvo com sucesso no banco de dados Supabase!</span>
        </div>
      )}

      {/* CONFIGURATION DRAWER / PANEL */}
      {isConfigOpen && canManageSettings && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl border border-slate-800 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <Icon icon={ConfigActionIcon} size={18} className="text-[#0075FF]" />
              <span>Valores Base & Tabelas de Precificação</span>
            </h3>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-3 py-1 rounded-full font-mono">
              Salvo no Supabase
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Landing Page Base (R$)</label>
              <input
                type="number"
                value={pricingConfig.baseRates['Landing page']}
                onChange={(e) =>
                  setPricingConfig({
                    ...pricingConfig,
                    baseRates: { ...pricingConfig.baseRates, 'Landing page': Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Site Institucional Base (R$)</label>
              <input
                type="number"
                value={pricingConfig.baseRates['Site institucional']}
                onChange={(e) =>
                  setPricingConfig({
                    ...pricingConfig,
                    baseRates: { ...pricingConfig.baseRates, 'Site institucional': Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Loja Virtual Base (R$)</label>
              <input
                type="number"
                value={pricingConfig.baseRates['Loja virtual']}
                onChange={(e) =>
                  setPricingConfig({
                    ...pricingConfig,
                    baseRates: { ...pricingConfig.baseRates, 'Loja virtual': Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN CALCULATOR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: INPUT FORM (2 COLS) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          {/* SECTION 1: CLIENT & PROJECT INFO */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-[#0C1D36] uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
              1. Identificação do Cliente & Projeto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleFormChange('clientName', e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0075FF] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Empresa / Marca</label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => handleFormChange('company', e.target.value)}
                  placeholder="Ex: Silva Arquitetura"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0075FF] outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PROJECT SCOPE & TYPE */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-extrabold text-[#0C1D36] uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
              2. Escopo & Tipo de Aplicação
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Tipo de Projeto *</label>
                <select
                  value={formData.projectType}
                  onChange={(e) => handleFormChange('projectType', e.target.value as StrictProjectType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-[#0C1D36]"
                >
                  {STRICT_PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Plataforma Principal</label>
                <select
                  value={formData.platform}
                  onChange={(e) => handleFormChange('platform', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-[#0C1D36]"
                >
                  <option value="Next.js">Next.js / React (High Performance)</option>
                  <option value="Tray">Tray E-commerce</option>
                  <option value="Nuvemshop">Nuvemshop</option>
                  <option value="WordPress">WordPress / Elementor</option>
                </select>
              </div>
            </div>

            {/* PAGE COUNTS */}
            {!isLojaVirtual && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block font-bold mb-1">
                    Páginas Padrão Inclusas: <span className="text-[#0075FF]">{formData.pageCount}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={formData.pageCount}
                    onChange={(e) => handleFormChange('pageCount', Number(e.target.value))}
                    className="w-full accent-[#0075FF]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    Páginas Adicionais (+R$ {pricingConfig.perAdditionalPageRate}): <span className="text-[#0075FF]">{formData.additionalPageCount}</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={formData.additionalPageCount}
                    onChange={(e) => handleFormChange('additionalPageCount', Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: OPTIONS & URGENCY */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-extrabold text-[#0C1D36] uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
              3. Opções de Conteúdo & Prazos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Redação & Copywriting</label>
                <select
                  value={formData.contentOption}
                  onChange={(e) => handleFormChange('contentOption', e.target.value as ContentCopyOption)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {CONTENT_COPY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Nível de Urgência de Entrega</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => handleFormChange('urgency', e.target.value as UrgencyOption)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  {URGENCY_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FINANCIAL SUMMARY CARD (1 COL) */}
        <div className="bg-[#081D3A] text-white rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0075FF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Resumo Financeiro</span>
              <Icon icon={SparklesActionIcon} size={18} className="text-[#168CFF]" />
            </div>

            {/* FINANCIAL VALUES LIST */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Valor Base ({formData.projectType}):</span>
                <span className="font-mono font-bold">
                  R$ {breakdown.baseValue.toLocaleString('pt-BR')}
                </span>
              </div>

              {breakdown.additionalPagesValue > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Páginas Adicionais ({formData.additionalPageCount}x):</span>
                  <span className="font-mono font-bold">
                    + R$ {breakdown.additionalPagesValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {breakdown.contentValue > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Copywriting & Conteúdo:</span>
                  <span className="font-mono font-bold">
                    + R$ {breakdown.contentValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex justify-between text-slate-200">
                <span>Subtotal Operacional:</span>
                <span className="font-mono font-bold">
                  R$ {breakdown.subtotal.toLocaleString('pt-BR')}
                </span>
              </div>

              {breakdown.discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Desconto Aplicado:</span>
                  <span className="font-mono">
                    - R$ {breakdown.discount.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {/* FINAL VALUE BIG CARD */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center space-y-1 mt-4">
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Valor Total Proposto</span>
                <div className="text-3xl font-black text-[#168CFF]">
                  {breakdown.finalValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SAVE & CONVERT BUTTONS */}
          <div className="space-y-3 z-10 pt-4 border-t border-white/10">
            {canSaveQuote && (
              <button
                type="button"
                onClick={() => handleSaveQuote(false)}
                className="w-full py-3 rounded-2xl bg-[#0075FF] hover:bg-[#168CFF] font-extrabold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Icon icon={SaveActionIcon} size={16} />
                <span>Salvar Orçamento no Banco</span>
              </button>
            )}

            {canSaveQuote && onConvertToProject && (
              <button
                type="button"
                onClick={() => handleSaveQuote(true)}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Icon icon={AddActionIcon} size={16} />
                <span>Salvar e Converter em Projeto</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
