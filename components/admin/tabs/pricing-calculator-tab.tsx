'use client'

import { useState, useEffect } from 'react'
import {
  QuoteFormData,
  PricingConfig,
  SavedQuote,
} from '@/types/pricing.types'
import {
  DEFAULT_PRICING_CONFIG,
  calculateProjectQuote,
} from '@/lib/utils/pricing-calculator'
import {
  STRICT_PROJECT_TYPES,
  CONTENT_COPY_OPTIONS,
  URGENCY_OPTIONS,
  StrictProjectType,
  ContentCopyOption,
  UrgencyOption,
  quoteFormSchema,
} from '@/lib/validations/quote-schema'
import {
  Calculator,
  Settings,
  Save,
  Copy,
  Printer,
  FileText,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  FolderPlus,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [saveSuccessFeedback, setSaveSuccessFeedback] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [formData, setFormData] = useState<QuoteFormData>(() => {
    if (initialData) return initialData

    return {
      clientName: '',
      company: '',
      projectName: '',
      projectType: 'Site institucional',
      platform: 'Next.js',
      desiredDeadline: 'Prazo normal',
      pageCount: 5,
      additionalPageCount: 0,
      complexity: 'Intermediária',
      contentOption: 'Cliente fornecerá todo o conteúdo',
      urgency: 'Prazo normal',
      discountAmount: 0,
      additionalCosts: 0,
      taxPercent: 8,
      notes: '',
      paymentTerms: '50% de entrada e 50% na publicação',
    }
  })

  // Handle automatic Page Count locking based on Project Type rules
  const handleProjectTypeChange = (newType: StrictProjectType) => {
    let newPageCount = formData.pageCount

    if (newType === 'Landing page' || newType === 'Página de vendas') {
      newPageCount = 1
    } else if (newType === 'Site institucional') {
      newPageCount = 5
    } else if (formData.pageCount < 1) {
      newPageCount = 1
    }

    setFormData((prev) => ({
      ...prev,
      projectType: newType,
      pageCount: newPageCount,
    }))
  }

  const isPageCountDisabled =
    formData.projectType === 'Landing page' ||
    formData.projectType === 'Página de vendas' ||
    formData.projectType === 'Site institucional'

  // Live Calculation Breakdown
  const breakdown = calculateProjectQuote(formData, pricingConfig)

  const handleSaveQuote = (andConvert: boolean = false) => {
    setValidationError(null)

    // Zod validation check
    const validation = quoteFormSchema.safeParse(formData)
    if (!validation.success) {
      const err = validation.error.issues[0]?.message || 'Por favor, preencha os campos obrigatórios.'
      setValidationError(err)
      return
    }

    const newQuote: SavedQuote = {
      id: `quote-${Date.now()}`,
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
Páginas: ${formData.pageCount} padrão + ${formData.additionalPageCount} adicionais
Conteúdo: ${formData.contentOption}
Urgência: ${formData.urgency}

Subtotal: R$ ${breakdown.subtotal.toLocaleString('pt-BR')}
Desconto: R$ ${breakdown.discount.toLocaleString('pt-BR')}
Impostos (${formData.taxPercent}%): R$ ${breakdown.taxes.toLocaleString('pt-BR')}
----------------------------------
VALOR FINAL: R$ ${breakdown.finalValue.toLocaleString('pt-BR')}
Condições: ${formData.paymentTerms || '50% entrada + 50% publicação'}
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
            <Calculator className="w-5 h-5 text-[#0075FF]" />
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
              <Settings className="w-4 h-4 text-slate-600" />
              <span>{isConfigOpen ? 'Fechar Configurações' : 'Configurar Valores'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors"
          >
            <Copy className="w-4 h-4 text-[#0075FF]" />
            <span>{copyFeedback ? 'Copiado!' : 'Copiar Resumo'}</span>
          </button>
        </div>
      </div>

      {/* VALIDATION ERROR BANNER */}
      {validationError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* SUCCESS FEEDBACK BANNER */}
      {saveSuccessFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Orçamento salvo com sucesso e registrado no histórico!</span>
        </div>
      )}

      {/* ADMINISTRATIVE PRICING SETTINGS (COLLAPSIBLE) */}
      {isConfigOpen && canManageSettings && (
        <div className="bg-[#0C1D36] text-white rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Settings className="w-4 h-4 text-[#0075FF]" />
            <span>Tabela de Preços Base & Multiplicadores do Sistema</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {STRICT_PROJECT_TYPES.map((type) => (
              <div key={type}>
                <label className="text-[10px] text-slate-300 block mb-1 font-semibold">{type} (Base R$)</label>
                <input
                  type="number"
                  value={pricingConfig.baseRates[type] || 2500}
                  onChange={(e) =>
                    setPricingConfig((prev) => ({
                      ...prev,
                      baseRates: {
                        ...prev.baseRates,
                        [type]: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CALCULATOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: FORM STEPS */}
        <div className="lg:col-span-2 space-y-6">
          {/* ETAPA 1: DADOS DO CLIENTE E TIPO DE PROJETO */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-[#0C1D36] text-white flex items-center justify-center text-xs">1</span>
              <span>Dados do Cliente & Tipo de Projeto</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Ex: Ana Souza"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#0C1D36]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Empresa / Razão Social</label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Ex: Decor Studio Ltda"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0C1D36]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Nome do Projeto *</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Ex: Redesign E-commerce Iluminação"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#0C1D36]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Tipo de Projeto *</label>
                <select
                  value={formData.projectType}
                  onChange={(e) => handleProjectTypeChange(e.target.value as StrictProjectType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-[#0C1D36] outline-none focus:border-[#0C1D36]"
                >
                  {STRICT_PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ETAPA 2: ESTRUTURA E QUANTIDADE DE PÁGINAS */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-[#0C1D36] text-white flex items-center justify-center text-xs">2</span>
              <span>Estrutura & Quantidade de Páginas</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* PÁGINAS PADRÃO (DESABILITADO CONFORME TIPO SELECIONADO) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 font-bold">Páginas Padrão</label>
                  {isPageCountDisabled && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Fixo para {formData.projectType}</span>
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  disabled={isPageCountDisabled}
                  value={formData.pageCount}
                  onChange={(e) =>
                    setFormData({ ...formData, pageCount: Math.max(1, Number(e.target.value)) })
                  }
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl border text-xs font-extrabold outline-none',
                    isPageCountDisabled
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-200 text-[#0C1D36] focus:border-[#0C1D36]'
                  )}
                />
              </div>

              {/* PÁGINAS ADICIONAIS (RENOMEADO) */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Páginas Adicionais</label>
                <input
                  type="number"
                  min={0}
                  value={formData.additionalPageCount}
                  onChange={(e) =>
                    setFormData({ ...formData, additionalPageCount: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold bg-white text-[#0C1D36] outline-none focus:border-[#0C1D36]"
                />
              </div>
            </div>
          </div>

          {/* ETAPA 3: CONTEÚDO, COPY E URGÊNCIA (SIMPLIFICADA) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-[#0C1D36] text-white flex items-center justify-center text-xs">3</span>
              <span>Conteúdo, Copy & Nível de Urgência</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* CONTEÚDO E COPY */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Conteúdo e Copy *</label>
                <select
                  value={formData.contentOption}
                  onChange={(e) => setFormData({ ...formData, contentOption: e.target.value as ContentCopyOption })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-[#0C1D36] outline-none focus:border-[#0C1D36]"
                >
                  {CONTENT_COPY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* NÍVEL DE URGÊNCIA */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Nível de Urgência *</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as UrgencyOption })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-[#0C1D36] outline-none focus:border-[#0C1D36]"
                >
                  {URGENCY_OPTIONS.map((urg) => (
                    <option key={urg} value={urg}>
                      {urg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* COMPLEXIDADE E DESCONTO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Complexidade do Projeto</label>
                <select
                  value={formData.complexity}
                  onChange={(e) => setFormData({ ...formData, complexity: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-[#0C1D36]"
                >
                  <option value="Simples">Simples (1.0x)</option>
                  <option value="Intermediária">Intermediária (1.25x)</option>
                  <option value="Avançada">Avançada (1.5x)</option>
                  <option value="Personalizada">Personalizada (2.0x)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Desconto Comercial (R$)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-[#0C1D36]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Impostos (%)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.taxPercent}
                  onChange={(e) => setFormData({ ...formData, taxPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-[#0C1D36]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: SUMMARY & ACTION BUTTONS */}
        <div className="space-y-6">
          <div className="bg-[#0C1D36] text-white rounded-3xl p-6 shadow-xl space-y-6 sticky top-24">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                Resumo do Cálculo
              </span>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {breakdown.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                {formData.projectType} • {formData.pageCount} pág. padrão
              </p>
            </div>

            {/* BREAKDOWN ITEMS */}
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Taxa Base do Projeto:</span>
                <span className="font-bold text-white">
                  R$ {breakdown.baseValue.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Páginas Adicionais ({formData.additionalPageCount}):</span>
                <span className="font-bold text-white">
                  R$ {breakdown.additionalPagesValue.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Conteúdo & Copy:</span>
                <span className="font-bold text-white">
                  R$ {breakdown.contentValue.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Multiplicador Urgência:</span>
                <span className="font-bold text-amber-400">
                  {breakdown.urgencyMultiplier}x
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-white">
                <span>Subtotal:</span>
                <span>R$ {breakdown.subtotal.toLocaleString('pt-BR')}</span>
              </div>
              {breakdown.discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Desconto:</span>
                  <span>- R$ {breakdown.discount.toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              {canSaveQuote && (
                <button
                  type="button"
                  onClick={() => handleSaveQuote(false)}
                  className="w-full py-3 px-4 rounded-2xl bg-[#0075FF] hover:bg-[#168CFF] text-white font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Orçamento</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSaveQuote(true)}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-[#0C1D36] font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <FolderPlus className="w-4 h-4 text-[#0075FF]" />
                <span>Salvar e Converter em Projeto</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
