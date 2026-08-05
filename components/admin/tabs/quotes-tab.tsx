'use client'

import { useState } from 'react'
import { SavedQuote } from '@/types/pricing.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import { formatDateBR } from '@/components/admin/tabs/kanban-board-tab'
import { STRICT_PROJECT_TYPES, QUOTE_STATUSES, QuoteStatus } from '@/lib/validations/quote-schema'
import { deleteQuoteAction, saveQuoteAction } from '@/lib/actions/quotes'
import {
  FileText,
  Search,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  FolderPlus,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const MOCK_SAVED_QUOTES: SavedQuote[] = [
  {
    id: 'quote-101',
    client_name: 'Ana Souza',
    company: 'Decor Studio Ltda',
    project_name: 'Redesign E-commerce Iluminação',
    project_type: 'Loja virtual',
    platform: 'Tray',
    form_data: {
      clientName: 'Ana Souza',
      company: 'Decor Studio Ltda',
      projectName: 'Redesign E-commerce Iluminação',
      projectType: 'Loja virtual',
      platform: 'Tray',
      pageCount: 1,
      additionalPageCount: 4,
      complexity: 'Avançada',
      contentOption: 'Criação completa de copy',
      urgency: 'Urgente',
      discountAmount: 1000,
      additionalCosts: 0,
      taxPercent: 8,
    },
    pricing_snapshot: {} as any,
    calculation_breakdown: {
      baseValue: 6500,
      pagesValue: 350,
      additionalPagesValue: 2000,
      customCodeValue: 0,
      blogModuleValue: 0,
      contentValue: 1800,
      complexityMultiplier: 1.5,
      urgencyMultiplier: 1.3,
      subtotal: 18000,
      discount: 1000,
      additionalCosts: 0,
      taxes: 1360,
      finalValue: 18360,
    },
    subtotal: 18000,
    discount: 1000,
    additional_costs: 0,
    taxes: 1360,
    final_value: 18360,
    status: 'Aprovado',
    created_by_name: 'Ana Comercial',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'quote-102',
    client_name: 'Carlos Oliveira',
    company: 'SaaS AI Tech',
    project_name: 'Landing Page SaaS AI',
    project_type: 'Landing page',
    platform: 'Next.js',
    form_data: {
      clientName: 'Carlos Oliveira',
      company: 'SaaS AI Tech',
      projectName: 'Landing Page SaaS AI',
      projectType: 'Landing page',
      platform: 'Next.js',
      pageCount: 1,
      additionalPageCount: 0,
      complexity: 'Intermediária',
      contentOption: 'Adaptação de conteúdo',
      urgency: 'Prazo normal',
      discountAmount: 0,
      additionalCosts: 0,
      taxPercent: 8,
    },
    pricing_snapshot: {} as any,
    calculation_breakdown: {
      baseValue: 2500,
      pagesValue: 350,
      additionalPagesValue: 0,
      customCodeValue: 0,
      blogModuleValue: 0,
      contentValue: 800,
      complexityMultiplier: 1.25,
      urgencyMultiplier: 1.0,
      subtotal: 4500,
      discount: 0,
      additionalCosts: 0,
      taxes: 360,
      finalValue: 4860,
    },
    subtotal: 4500,
    discount: 0,
    additional_costs: 0,
    taxes: 360,
    final_value: 4860,
    status: 'Enviado',
    created_by_name: 'Carlos Designer',
    created_at: '2026-08-03T14:30:00Z',
    updated_at: '2026-08-03T14:30:00Z',
  },
]

interface QuotesTabProps {
  quotes: SavedQuote[]
  userProfile: UserProfileWithRole | null
  onUpdateQuotes: (quotes: SavedQuote[]) => void
  onEditQuoteInCalculator: (quote: SavedQuote) => void
  onConvertToProject: (quote: SavedQuote) => void
  onOpenCreateQuote: () => void
}

export function QuotesTab({
  quotes = MOCK_SAVED_QUOTES,
  userProfile,
  onUpdateQuotes,
  onEditQuoteInCalculator,
  onConvertToProject,
  onOpenCreateQuote,
}: QuotesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [responsibleFilter, setResponsibleFilter] = useState('todos')
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<SavedQuote | null>(null)

  // Filtered List
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.company && q.company.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = typeFilter === 'todos' || q.project_type === typeFilter
    const matchesStatus = statusFilter === 'todos' || q.status === statusFilter
    const matchesResponsible =
      responsibleFilter === 'todos' || q.created_by_name === responsibleFilter

    return matchesSearch && matchesType && matchesStatus && matchesResponsible
  })

  const uniqueResponsibles = Array.from(
    new Set(quotes.map((q) => q.created_by_name).filter(Boolean))
  )

  const handleDuplicateQuote = async (quote: SavedQuote) => {
    const duplicated: SavedQuote = {
      ...quote,
      id: `quote-${Date.now()}`,
      project_name: `${quote.project_name} (Cópia)`,
      status: 'Rascunho',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    onUpdateQuotes([duplicated, ...quotes])
    await saveQuoteAction(duplicated)
    alert(`Orçamento para "${quote.client_name}" duplicado com sucesso como Rascunho!`)
  }

  const handleDeleteQuote = async (quoteId: string, projectName: string) => {
    const confirmDelete = window.confirm(
      `Tem certeza de que deseja excluir permanentemente o orçamento "${projectName}"?`
    )
    if (confirmDelete) {
      onUpdateQuotes(quotes.filter((q) => q.id !== quoteId))
      if (selectedQuoteDetail?.id === quoteId) setSelectedQuoteDetail(null)
      await deleteQuoteAction(quoteId)
    }
  }

  const getStatusBadgeClass = (status: QuoteStatus) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-emerald-500 text-white font-extrabold'
      case 'Convertido em Projeto':
        return 'bg-[#0075FF] text-white font-extrabold'
      case 'Enviado':
      case 'Em Negociação':
        return 'bg-amber-500 text-white font-extrabold'
      case 'Recusado':
        return 'bg-rose-500 text-white font-extrabold'
      default:
        return 'bg-slate-400 text-white font-extrabold'
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-6 max-w-full overflow-hidden font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0075FF]" />
            <span>Histórico de Orçamentos</span>
          </h2>
          <p className="text-xs text-[#596579]">
            Registro completo de orçamentos emitidos com cópia imutável dos valores.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateQuote}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Novo Orçamento</span>
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente ou projeto..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0075FF]"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-[#0C1D36]"
          >
            <option value="todos">Tipo: Todos</option>
            {STRICT_PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-[#0C1D36]"
          >
            <option value="todos">Status: Todos</option>
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-[#0C1D36]"
          >
            <option value="todos">Responsável: Todos</option>
            {uniqueResponsibles.map((resp) => (
              <option key={resp} value={resp}>
                {resp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QUOTES LIST TABLE */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl max-w-full">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#081D3A] text-white border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3.5 whitespace-nowrap">Cliente & Projeto</th>
              <th className="p-3.5 whitespace-nowrap">Tipo de Projeto</th>
              <th className="p-3.5 whitespace-nowrap">Valor Final</th>
              <th className="p-3.5 whitespace-nowrap">Responsável</th>
              <th className="p-3.5 whitespace-nowrap">Status</th>
              <th className="p-3.5 whitespace-nowrap">Data</th>
              <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  Nenhum orçamento registrado no histórico.
                </td>
              </tr>
            ) : (
              filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 max-w-[220px]">
                    <div className="font-extrabold text-[#0C1D36] text-xs truncate">
                      {quote.project_name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {quote.client_name} {quote.company ? `• ${quote.company}` : ''}
                    </div>
                  </td>

                  <td className="p-3.5 font-semibold text-[#0075FF] whitespace-nowrap">
                    {quote.project_type}
                  </td>

                  <td className="p-3.5 font-extrabold text-[#0C1D36] whitespace-nowrap">
                    {quote.final_value.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>

                  <td className="p-3.5 text-slate-600 whitespace-nowrap">
                    {quote.created_by_name || 'Admin'}
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-wider',
                        getStatusBadgeClass(quote.status)
                      )}
                    >
                      {quote.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-slate-500 whitespace-nowrap">
                    {formatDateBR(quote.created_at?.split('T')[0])}
                  </td>

                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* VISUALIZAR */}
                      <button
                        type="button"
                        onClick={() => setSelectedQuoteDetail(quote)}
                        className="w-8 h-8 rounded-xl bg-[#0C1D36] text-white hover:bg-[#0075FF] transition-all flex items-center justify-center shadow-sm"
                        title="Ver Detalhes do Orçamento"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* EDITAR NA CALCULADORA */}
                      <button
                        type="button"
                        onClick={() => onEditQuoteInCalculator(quote)}
                        className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-[#0075FF] hover:border-[#0075FF] transition-all flex items-center justify-center shadow-sm"
                        title="Editar na Calculadora"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* DUPLICAR */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateQuote(quote)}
                        className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-amber-600 hover:border-amber-300 transition-all flex items-center justify-center shadow-sm"
                        title="Duplicar Orçamento"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* CONVERTER EM PROJETO */}
                      <button
                        type="button"
                        onClick={() => onConvertToProject(quote)}
                        className="w-8 h-8 rounded-xl bg-blue-50 text-[#0075FF] border border-blue-200 hover:bg-[#0075FF] hover:text-white transition-all flex items-center justify-center shadow-sm"
                        title="Converter em Projeto de Cliente"
                      >
                        <FolderPlus className="w-4 h-4" />
                      </button>

                      {/* EXCLUIR */}
                      <button
                        type="button"
                        onClick={() => handleDeleteQuote(quote.id, quote.project_name)}
                        className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all flex items-center justify-center shadow-sm"
                        title="Excluir Orçamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* QUOTE DETAIL DRAWER */}
      {selectedQuoteDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300 p-6 space-y-6">
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0075FF] bg-[#0075FF]/10 px-2.5 py-0.5 rounded">
                    {selectedQuoteDetail.project_type}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0C1D36] mt-1">
                    {selectedQuoteDetail.project_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cliente: {selectedQuoteDetail.client_name} ({selectedQuoteDetail.company || 'N/A'})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuoteDetail(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SNAPSHOT BREAKDOWN DETAILS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-extrabold text-sm text-[#0C1D36]">Detalhamento do Escopo Fixo</h4>

                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block">Páginas Padrão:</span>
                    <span className="font-bold">{selectedQuoteDetail.form_data.pageCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Páginas Adicionais:</span>
                    <span className="font-bold">{selectedQuoteDetail.form_data.additionalPageCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Conteúdo & Copy:</span>
                    <span className="font-bold">{selectedQuoteDetail.form_data.contentOption}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Urgência:</span>
                    <span className="font-bold">{selectedQuoteDetail.form_data.urgency}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 space-y-1.5 font-semibold">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {selectedQuoteDetail.subtotal.toLocaleString('pt-BR')}</span>
                  </div>
                  {selectedQuoteDetail.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Desconto:</span>
                      <span>- R$ {selectedQuoteDetail.discount.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#0C1D36] text-sm font-extrabold pt-2 border-t border-slate-200">
                    <span>Valor Final Aprovado:</span>
                    <span className="text-[#0075FF]">
                      {selectedQuoteDetail.final_value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onConvertToProject(selectedQuoteDetail)
                  setSelectedQuoteDetail(null)
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0075FF] text-white text-xs font-extrabold hover:bg-[#168CFF] flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Converter em Projeto</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedQuoteDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#0C1D36] text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
