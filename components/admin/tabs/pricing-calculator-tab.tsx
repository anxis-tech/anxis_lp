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
  Code,
  Globe,
  Check,
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
  const [configSaveFeedback, setConfigSaveFeedback] = useState(false)
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
      hasCustomCode: false,
      hasBlogModule: false,
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
    } else if (newType === 'Site institucional' || newType === 'Blog') {
      newPageCount = 5
    } else if (newType === 'Loja virtual') {
      newPageCount = 0
    } else if (formData.pageCount < 1) {
      newPageCount = 1
    }

    setFormData((prev) => ({
      ...prev,
      projectType: newType,
      pageCount: newPageCount,
      // Reset Blog Checkbox if main project type becomes Blog
      hasBlogModule: newType === 'Blog' ? false : prev.hasBlogModule,
    }))
  }

  const isPageCountDisabled =
    formData.projectType === 'Landing page' ||
    formData.projectType === 'Página de vendas' ||
    formData.projectType === 'Site institucional'

  const isLojaVirtual = formData.projectType === 'Loja virtual'
  const isBlog = formData.projectType === 'Blog'

  // Live Calculation Breakdown
  const breakdown = calculateProjectQuote(formData, pricingConfig)

  const handleSaveConfig = () => {
    setConfigSaveFeedback(true)
    setTimeout(() => setConfigSaveFeedback(false), 3000)
  }

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

      {/* VALIDATION & SUCCESS BANNERS */}
      {validationError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {saveSuccessFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Orçamento salvo com sucesso e registrado no histórico!</span>
        </div>
      )}

      {/* COMPLETE ADMINISTRATIVE PRICING SETTINGS PANEL */}
      {isConfigOpen && canManageSettings && (
        <div className="bg-[#0C1D36] text-white rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#0075FF]" />
              <span>Configuração Administrativa de Preços & Métricas do Sistema</span>
            </h3>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-4 py-2 rounded-xl bg-[#0075FF] hover:bg-[#168CFF] text-white font-extrabold text-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>

          {configSaveFeedback && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Configurações administrativas salvas com sucesso!</span>
            </div>
          )}

          {/* BASE RATES PER PROJECT TYPE */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Valores Base por Tipo de Projeto (R$)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {STRICT_PROJECT_TYPES.map((type) => (
                <div key={type}>
                  <label className="text-[10px] text-slate-400 block mb-1 font-semibold">{type}</label>
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
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold outline-none focus:border-[#0075FF]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* PAGE RATES & FEATURE RATES */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Métricas de Páginas & Taxas Adicionais (R$)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Valor p/ Página Padrão (R$)</label>
                <input
                  type="number"
                  value={pricingConfig.perPageRate}
                  onChange={(e) => setPricingConfig({ ...pricingConfig, perPageRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Valor p/ Página Adicional (R$)</label>
                <input
                  type="number"
                  value={pricingConfig.perAdditionalPageRate}
                  onChange={(e) => setPricingConfig({ ...pricingConfig, perAdditionalPageRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Taxa Desenvol. Código (R$)</label>
                <input
                  type="number"
                  value={pricingConfig.customCodeRate}
                  onChange={(e) => setPricingConfig({ ...pricingConfig, customCodeRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Taxa Módulo Blog (R$)</label>
                <input
                  type="number"
                  value={pricingConfig.blogModuleRate}
                  onChange={(e) => setPricingConfig({ ...pricingConfig, blogModuleRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold outline-none"
                />
              </div>
            </div>
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

          {/* ETAPA 2: ESTRUTURA, PÁGINAS E CHECKBOXES */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-[#0C1D36] text-white flex items-center justify-center text-xs">2</span>
              <span>Estrutura, Páginas & Recursos Especiais</span>
            </h3>

            {/* PÁGINAS PADRÃO (OCULTO PARA LOJA VIRTUAL E BLOG) & ADICIONAIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {!isLojaVirtual && !isBlog ? (
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
              ) : isLojaVirtual ? (
                <div className="bg-blue-50/90 border border-blue-200 p-3.5 rounded-2xl text-blue-900 text-xs font-medium space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-[#0075FF]">
                    <Globe className="w-4 h-4" />
                    <span>Loja Virtual Selecionada</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    Páginas padrão inclusas: <strong>Home, Página de Produto Único, Páginas de Categorias, Painel do Usuário e Painel Administrativo</strong>.
                  </p>
                </div>
              ) : (
                <div className="bg-purple-50/90 border border-purple-200 p-3.5 rounded-2xl text-purple-900 text-xs font-medium space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-purple-700">
                    <FileText className="w-4 h-4" />
                    <span>Blog Selecionado</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-purple-800">
                    Páginas padrão inclusas: <strong>Home, Página do Artigo, Páginas de Categorias e Painel Administrativo de Conteúdo</strong>.
                  </p>
                </div>
              )}

              {/* PÁGINAS ADICIONAIS */}
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

            {/* CHECKBOXES DA ETAPA 2 (DESENVOLVIMENTO EM CÓDIGO & MÓDULO BLOG) */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="block text-slate-600 font-bold text-xs">Recursos Avançados Adicionais</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* CHECKBOX 1: DESENVOLVIMENTO PERSONALIZADO EM CÓDIGO */}
                <label className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.hasCustomCode || false}
                    onChange={(e) => setFormData({ ...formData, hasCustomCode: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0075FF] focus:ring-[#0075FF]"
                  />
                  <div>
                    <span className="font-extrabold text-xs text-[#0C1D36] block">Desenvolvimento personalizado em código</span>
                    <span className="text-[10px] text-slate-500">Programação sob medida e componentes avançados</span>
                  </div>
                </label>

                {/* CHECKBOX 2: INCLUIR MÓDULO BLOG (SE O TIPO PRINCIPAL NÃO FOR BLOG) */}
                {formData.projectType !== 'Blog' && (
                  <label className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.hasBlogModule || false}
                      onChange={(e) => setFormData({ ...formData, hasBlogModule: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0075FF] focus:ring-[#0075FF]"
                    />
                    <div>
                      <span className="font-extrabold text-xs text-[#0C1D36] block">Incluir Módulo de Blog no projeto</span>
                      <span className="text-[10px] text-slate-500">Área de artigos e gestão de conteúdo</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* ETAPA 3: CONTEÚDO, COPY E URGÊNCIA */}
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
                {formData.projectType} • {isLojaVirtual ? 'Loja Virtual' : `${formData.pageCount} pág.`}
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
              {!isLojaVirtual && (
                <div className="flex justify-between">
                  <span>Páginas Padrão ({formData.pageCount}):</span>
                  <span className="font-bold text-white">
                    R$ {breakdown.pagesValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
              {formData.additionalPageCount > 0 && (
                <div className="flex justify-between">
                  <span>Páginas Adicionais ({formData.additionalPageCount}):</span>
                  <span className="font-bold text-white">
                    R$ {breakdown.additionalPagesValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
              {formData.hasCustomCode && (
                <div className="flex justify-between text-[#0075FF] font-bold">
                  <span>Desenvol. em Código:</span>
                  <span>+ R$ {breakdown.customCodeValue.toLocaleString('pt-BR')}</span>
                </div>
              )}
              {formData.hasBlogModule && formData.projectType !== 'Blog' && (
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Módulo de Blog:</span>
                  <span>+ R$ {breakdown.blogModuleValue.toLocaleString('pt-BR')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Conteúdo & Copy:</span>
                <span className="font-bold text-white">
                  R$ {breakdown.contentValue.toLocaleString('pt-BR')}
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
