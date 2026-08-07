'use client'

import { useState } from 'react'
import { SavedQuote } from '@/types/pricing.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import { formatDateBR } from '@/components/admin/tabs/kanban-board-tab'
import { STRICT_PROJECT_TYPES, QUOTE_STATUSES, QuoteStatus } from '@/lib/validations/quote-schema'
import { deleteQuoteAction, saveQuoteAction } from '@/lib/actions/quotes'
import { Icon } from '@/components/ui/icon'
import { QuotesNavIcon } from '@/lib/icons/navigation'
import {
  AddActionIcon,
  EditActionIcon,
  DeleteActionIcon,
  ViewActionIcon,
  SearchActionIcon,
  CancelActionIcon,
} from '@/lib/icons/actions'
import {
  MetricRevenueIcon,
  MetricQuoteIcon,
  MetricUserIcon,
} from '@/lib/icons/dashboard'
import {
  SuccessStatusIcon,
  PendingStatusIcon,
  DateStatusIcon,
} from '@/lib/icons/status'
import { cn } from '@/lib/utils'

interface QuotesTabProps {
  quotes: SavedQuote[]
  userProfile: UserProfileWithRole | null
  onUpdateQuotes: (quotes: SavedQuote[]) => void
  onEditQuoteInCalculator: (quote: SavedQuote) => void
  onConvertToProject: (quote: SavedQuote) => void
  onOpenCreateQuote: () => void
}

export function QuotesTab({
  quotes = [],
  userProfile,
  onUpdateQuotes,
  onEditQuoteInCalculator,
  onConvertToProject,
  onOpenCreateQuote,
}: QuotesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<SavedQuote | null>(null)

  // Filter quotes from Supabase DB
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.company && q.company.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'todos' || q.status === statusFilter
    const matchesType = typeFilter === 'todos' || q.project_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Delete quote handler
  const handleDeleteQuote = async (quoteId: string, projectName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o orçamento do projeto "${projectName}"?`)) return

    await deleteQuoteAction(quoteId)
    onUpdateQuotes(quotes.filter((q) => q.id !== quoteId))

    if (selectedQuoteDetail?.id === quoteId) {
      setSelectedQuoteDetail(null)
    }

    alert('Orçamento excluído com sucesso.')
  }

  // Status badge styling
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-emerald-100 text-emerald-800'
      case 'Convertido em Projeto':
        return 'bg-purple-100 text-purple-800 font-extrabold'
      case 'Recusado':
        return 'bg-rose-100 text-rose-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-6 max-w-full overflow-hidden font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Icon icon={QuotesNavIcon} size={20} className="text-[#0075FF]" />
            <span>Histórico de Orçamentos Comercial</span>
          </h2>
          <p className="text-xs text-slate-500">
            Registros salvos, propostas aprovadas e conversão em projetos operacionais.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateQuote}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md transition-all shrink-0 flex items-center gap-2"
        >
          <Icon icon={AddActionIcon} size={16} />
          <span>Criar Novo Orçamento</span>
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Icon icon={SearchActionIcon} size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, projeto ou empresa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0075FF]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-[#0C1D36]"
          >
            <option value="todos">Todos os Status</option>
            {QUOTE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-[#0C1D36]"
          >
            <option value="todos">Todos os Tipos de Projeto</option>
            {STRICT_PROJECT_TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QUOTES TABLE */}
      {filteredQuotes.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Icon icon={MetricQuoteIcon} size={40} className="text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-[#0C1D36]">Nenhum orçamento encontrado.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Utilize a Calculadora Comercial para criar e salvar novas propostas no banco de dados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl max-w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#081D3A] text-white border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 whitespace-nowrap">Projeto & Cliente</th>
                <th className="p-3.5 whitespace-nowrap">Tipo & Plataforma</th>
                <th className="p-3.5 whitespace-nowrap">Valor Final</th>
                <th className="p-3.5 whitespace-nowrap">Status da Proposta</th>
                <th className="p-3.5 whitespace-nowrap">Data</th>
                <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 max-w-[220px]">
                    <div className="font-bold text-[#0C1D36] text-sm truncate">{quote.project_name}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {quote.client_name} {quote.company ? `(${quote.company})` : ''}
                    </div>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <div className="font-semibold text-[#0075FF]">{quote.project_type}</div>
                    <div className="text-[10px] text-slate-400">{quote.platform || 'N/A'}</div>
                  </td>

                  <td className="p-3.5 whitespace-nowrap font-extrabold text-[#0C1D36] font-mono text-sm">
                    {quote.final_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span className={cn('px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider', getStatusBadgeStyle(quote.status))}>
                      {quote.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {formatDateBR(quote.created_at.split('T')[0])}
                  </td>

                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* DETALHES */}
                      <button
                        type="button"
                        onClick={() => setSelectedQuoteDetail(quote)}
                        className="p-1.5 rounded-lg bg-slate-100 text-[#0075FF] hover:bg-[#0075FF] hover:text-white transition-colors"
                        title="Ver Resumo Financeiro"
                      >
                        <Icon icon={ViewActionIcon} size={16} />
                      </button>

                      {/* EDITAR NA CALCULADORA */}
                      <button
                        type="button"
                        onClick={() => onEditQuoteInCalculator(quote)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Abrir na Calculadora"
                      >
                        <Icon icon={EditActionIcon} size={16} />
                      </button>

                      {/* TRANSFORMAR EM PROJETO (Oculto se já for Convertido em projeto) */}
                      {quote.status !== 'Convertido em Projeto' && quote.status !== 'Convertido em projeto' && (
                        <button
                          type="button"
                          onClick={() => onConvertToProject(quote)}
                          className="p-1.5 rounded-lg bg-blue-50 text-[#0075FF] hover:bg-[#0075FF] hover:text-white transition-colors cursor-pointer"
                          title="Transformar em Projeto (Cadastrar Projeto)"
                        >
                          <Icon icon={AddActionIcon} size={16} />
                        </button>
                      )}

                      {/* EXCLUIR */}
                      <button
                        type="button"
                        onClick={() => handleDeleteQuote(quote.id, quote.project_name)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Excluir Orçamento"
                      >
                        <Icon icon={DeleteActionIcon} size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL FOR QUOTE */}
      {selectedQuoteDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#0C1D36]">
                  {selectedQuoteDetail.project_name}
                </h3>
                <span className="text-xs text-slate-400">
                  Cliente: {selectedQuoteDetail.client_name}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuoteDetail(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <Icon icon={CancelActionIcon} size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Tipo de Projeto:</span>
                <span className="font-bold text-[#0C1D36]">{selectedQuoteDetail.project_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono">R$ {selectedQuoteDetail.subtotal?.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Desconto Aplicado:</span>
                <span className="font-mono">- R$ {selectedQuoteDetail.discount?.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-[#0075FF] font-black text-sm pt-2 border-t border-slate-200">
                <span>Valor Total Aprovado:</span>
                <span>{selectedQuoteDetail.final_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {selectedQuoteDetail.status !== 'Convertido em Projeto' && selectedQuoteDetail.status !== 'Convertido em projeto' && (
                <button
                  type="button"
                  onClick={() => onConvertToProject(selectedQuoteDetail)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Converter em Projeto no Kanban
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
