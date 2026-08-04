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
} from 'lucide-react'

interface PricingCalculatorTabProps {
  canManageSettings: boolean
  canSaveQuote: boolean
}

export function PricingCalculatorTab({
  canManageSettings = true,
  canSaveQuote = true,
}: PricingCalculatorTabProps) {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([])
  const [copyFeedback, setCopyFeedback] = useState(false)

  const [formData, setFormData] = useState<QuoteFormData>({
    clientName: '',
    company: '',
    projectName: '',
    projectType: 'Site Institucional',
    platform: 'Next.js',
    desiredDeadline: 'Prazo normal',
    pageCount: 5,
    customPageCount: 1,
    productCount: 0,
    formCount: 1,
    hasRestrictedArea: false,
    hasBlog: false,
    hasIntegrations: true,
    complexity: 'Intermediária',
    designLevel: 'Design personalizado',
    contentOption: 'Revisão/Adaptação',
    urgency: 'Prazo normal',
    discountAmount: 0,
    additionalCosts: 0,
    taxPercent: 8,
    notes: '',
    paymentTerms: '50% de entrada e 50% na publicação',
  })

  // Live calculation
  const breakdown = calculateProjectQuote(formData, pricingConfig)

  const handleCopySummary = () => {
    const text = `
📌 ORÇAMENTO ESTIMADO ANXIS
----------------------------------
Cliente: ${formData.clientName || 'Cliente'} (${formData.company || 'Empresa'})
Projeto: ${formData.projectName || formData.projectType}
Plataforma: ${formData.platform || 'N/A'}
Páginas: ${formData.pageCount} padrão + ${formData.customPageCount} sob medida
Complexidade: ${formData.complexity} | Urgência: ${formData.urgency}

Subtotal: R$ ${breakdown.subtotal.toLocaleString('pt-BR')}
Desconto: R$ ${breakdown.discount.toLocaleString('pt-BR')}
Impostos (${breakdown.taxes > 0 ? formData.taxPercent : 0}%): R$ ${breakdown.taxes.toLocaleString('pt-BR')}

VALOR FINAL SUGERIDO: R$ ${breakdown.finalValue.toLocaleString('pt-BR')}
Condições: ${formData.paymentTerms}
----------------------------------
`.trim()

    navigator.clipboard.writeText(text)
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 2000)
  }

  const handleSaveQuote = () => {
    if (!canSaveQuote || !formData.projectName) return

    const newQuote: SavedQuote = {
      id: `q-${Date.now()}`,
      client_name: formData.clientName || 'Cliente Sem Nome',
      company: formData.company,
      project_name: formData.projectName,
      project_type: formData.projectType,
      platform: formData.platform,
      form_data: { ...formData },
      pricing_snapshot: { ...pricingConfig },
      calculation_breakdown: { ...breakdown },
      subtotal: breakdown.subtotal,
      discount: breakdown.discount,
      additional_costs: breakdown.additionalCosts,
      taxes: breakdown.taxes,
      final_value: breakdown.finalValue,
      status: 'Rascunho',
      notes: formData.notes,
      created_at: new Date().toISOString(),
    }

    setSavedQuotes((prev) => [newQuote, ...prev])
    alert('Orçamento salvo com sucesso no histórico!')
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#0075FF]" />
            <span>Calculadora de Precificação Comercial</span>
          </h2>
          <p className="text-xs text-[#596579]">
            Ferramenta interna para cálculo padronizado de estimativas comerciais e orçamentos da ANXIS.
          </p>
        </div>

        {canManageSettings && (
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-[#081D3A] bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all"
            title="Configurações da Calculadora"
          >
            <Settings className="w-4 h-4 mr-1.5 text-[#0075FF]" />
            <span>Configurações de Precificação ⚙️</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: FORM INPUTS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* GROUP 1: DADOS BÁSICOS */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0075FF]">1. Dados do Projeto & Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Nome do Projeto</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Ex: Redesign E-commerce"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Tipo de Projeto</label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="Landing Page">Landing Page</option>
                  <option value="Site Institucional">Site Institucional</option>
                  <option value="Loja Virtual">Loja Virtual (E-commerce)</option>
                  <option value="Reformulação">Reformulação de Site Existente</option>
                  <option value="Desenvolvimento Personalizado">Desenvolvimento Personalizado em Código</option>
                  <option value="Integração">Integração de API / Funcionalidade</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Plataforma Alvo</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Next.js">Next.js / React</option>
                  <option value="Tray">Tray E-commerce</option>
                  <option value="Nuvemshop">Nuvemshop</option>
                  <option value="WordPress">WordPress / Elementor</option>
                  <option value="WooCommerce">WooCommerce</option>
                </select>
              </div>
            </div>
          </div>

          {/* GROUP 2: ESTRUTURA & PÁGINAS */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0075FF]">2. Estrutura & Escopo</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Páginas Padrão</label>
                <input
                  type="number"
                  min="1"
                  value={formData.pageCount}
                  onChange={(e) => setFormData({ ...formData, pageCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Páginas Custom</label>
                <input
                  type="number"
                  min="0"
                  value={formData.customPageCount}
                  onChange={(e) => setFormData({ ...formData, customPageCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Qtd Produtos</label>
                <input
                  type="number"
                  min="0"
                  value={formData.productCount}
                  onChange={(e) => setFormData({ ...formData, productCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Formulários</label>
                <input
                  type="number"
                  min="1"
                  value={formData.formCount}
                  onChange={(e) => setFormData({ ...formData, formCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasRestrictedArea}
                  onChange={(e) => setFormData({ ...formData, hasRestrictedArea: e.target.checked })}
                  className="rounded border-slate-300 text-[#0075FF]"
                />
                <span>Área Restrita / Login (+R$ 1.500)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasBlog}
                  onChange={(e) => setFormData({ ...formData, hasBlog: e.target.checked })}
                  className="rounded border-slate-300 text-[#0075FF]"
                />
                <span>Blog / Notícias (+R$ 800)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasIntegrations}
                  onChange={(e) => setFormData({ ...formData, hasIntegrations: e.target.checked })}
                  className="rounded border-slate-300 text-[#0075FF]"
                />
                <span>Integração de APIs (+R$ 1.200)</span>
              </label>
            </div>
          </div>

          {/* GROUP 3: COMPLEXIDADE, DESIGN & CONTEÚDO */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0075FF]">3. Complexidade, Design & Urgência</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Nível de Complexidade</label>
                <select
                  value={formData.complexity}
                  onChange={(e) => setFormData({ ...formData, complexity: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Simples">Simples (1.0x)</option>
                  <option value="Intermediária">Intermediária (1.25x)</option>
                  <option value="Avançada">Avançada (1.5x)</option>
                  <option value="Personalizada">Personalizada (2.0x)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Nível de Urgência</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Sem urgência">Sem urgência (1.0x)</option>
                  <option value="Prazo normal">Prazo normal (1.0x)</option>
                  <option value="Urgente">Urgente (+30%)</option>
                  <option value="Prioridade máxima">Prioridade máxima (+60%)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Nível de Design</label>
                <select
                  value={formData.designLevel}
                  onChange={(e) => setFormData({ ...formData, designLevel: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Estrutura existente">Estrutura existente (R$ 0)</option>
                  <option value="Personalização de template">Personalização de template (+R$ 500)</option>
                  <option value="Design personalizado">Design personalizado (+R$ 1.800)</option>
                  <option value="Design do zero">Design do zero / Figma completo (+R$ 3.500)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Criação de Conteúdo / Copy</label>
                <select
                  value={formData.contentOption}
                  onChange={(e) => setFormData({ ...formData, contentOption: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Cliente fornece">Cliente fornece tudo (R$ 0)</option>
                  <option value="Revisão/Adaptação">Revisão/Adaptação (+R$ 600)</option>
                  <option value="Criação de Copy & Imagens">Criação de Copy & Imagens (+R$ 1.800)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BREAKDOWN & SUMMARY DISPLAY (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#081D3A] text-white rounded-3xl p-6 shadow-xl border border-[#0075FF]/30 space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#168CFF]">Resumo do Orçamento</span>
              <span className="text-[10px] bg-[#0075FF]/20 text-[#168CFF] px-2.5 py-0.5 rounded font-mono font-bold">
                Fórmula V1
              </span>
            </div>

            {/* BREAKDOWN ITEMS */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Taxa Base ({formData.projectType}):</span>
                <span className="font-mono">R$ {breakdown.baseValue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Páginas & Telas:</span>
                <span className="font-mono">R$ {breakdown.pagesValue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Funcionalidades Adicionais:</span>
                <span className="font-mono">R$ {breakdown.featuresValue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Design & UI:</span>
                <span className="font-mono">R$ {breakdown.designValue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Conteúdo & Copy:</span>
                <span className="font-mono">R$ {breakdown.contentValue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-[#168CFF]">
                <span>Multiplicadores (Comp: {breakdown.complexityMultiplier}x | Urg: {breakdown.urgencyMultiplier}x):</span>
                <span className="font-mono">Aplicados</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-white">
                <span>Subtotal:</span>
                <span className="font-mono text-sm">R$ {breakdown.subtotal.toLocaleString('pt-BR')}</span>
              </div>

              {breakdown.discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Desconto:</span>
                  <span className="font-mono">- R$ {breakdown.discount.toLocaleString('pt-BR')}</span>
                </div>
              )}

              {breakdown.taxes > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Impostos ({formData.taxPercent}%):</span>
                  <span className="font-mono">+ R$ {breakdown.taxes.toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>

            {/* FINAL VALUE DISPLAY */}
            <div className="bg-[#0B2F63] p-5 rounded-2xl border border-[#0075FF]/40 text-center space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold block">
                Valor Final Sugerido
              </span>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight text-gradient-blue">
                R$ {breakdown.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-lg transition-all"
              >
                {copyFeedback ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-300" />
                    <span>Copiado para a área de transferência!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    <span>Copiar Resumo Comercial</span>
                  </>
                )}
              </button>

              {canSaveQuote && (
                <button
                  type="button"
                  onClick={handleSaveQuote}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  <span>Salvar Orçamento no Histórico</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN CONFIGURATION SHEET / MODAL */}
      {isConfigOpen && canManageSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#0C1D36] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#0075FF]" />
                <span>Configurações de Precificação ⚙️</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <h4 className="font-bold text-[#0075FF]">Taxas Base por Tipo de Projeto (R$)</h4>
                {Object.entries(pricingConfig.baseRates).map(([type, val]) => (
                  <div key={type} className="flex items-center justify-between gap-4">
                    <span>{type}:</span>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) =>
                        setPricingConfig({
                          ...pricingConfig,
                          baseRates: {
                            ...pricingConfig.baseRates,
                            [type]: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-right font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-[#0075FF]">Taxas por Página & Adicionais (R$)</h4>
                <div className="flex items-center justify-between">
                  <span>Valor por Página Padrão:</span>
                  <input
                    type="number"
                    value={pricingConfig.perPageRate}
                    onChange={(e) =>
                      setPricingConfig({
                        ...pricingConfig,
                        perPageRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-right font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#0075FF] text-white text-xs font-bold hover:bg-[#168CFF]"
              >
                Salvar Novas Taxas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
