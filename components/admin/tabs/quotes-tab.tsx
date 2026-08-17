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
  isDarkMode?: boolean
}

export function QuotesTab({
  quotes = [],
  userProfile,
  onUpdateQuotes,
  onEditQuoteInCalculator,
  onConvertToProject,
  onOpenCreateQuote,
  isDarkMode = false,
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
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
      case 'Convertido em Projeto':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20 font-extrabold'
      case 'Recusado':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
      default:
        return 'bg-blue-500/10 text-[#0075FF] border border-[#0075FF]/20'
    }
  }

  return (
    <div
      className={cn(
        'rounded-3xl border p-5 sm:p-6 shadow-sm space-y-6 max-w-full overflow-hidden font-sans transition-colors',
        isDarkMode
          ? 'bg-[#16181D] text-white border-slate-800'
          : 'bg-white text-[#0C1D36] border-slate-200/80'
      )}
    >
      {/* HEADER */}
      <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4', isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
        <div>
          <h2 className={cn('text-xl font-extrabold flex items-center gap-2', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>
            <Icon icon={QuotesNavIcon} size={20} className="text-[#0075FF]" />
            <span>Histórico de Orçamentos Salvos</span>
          </h2>
          <p className="text-xs text-slate-400">
            Propostas comerciais geradas e registradas no sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateQuote}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md transition-all shrink-0 gap-1.5 cursor-pointer"
        >
          <Icon icon={AddActionIcon} size={16} />
          <span>Novo Orçamento</span>
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
            placeholder="Buscar cliente ou projeto..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none focus:border-[#0075FF]',
              isDarkMode
                ? 'bg-[#1A1E26] border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-white border-slate-200 text-[#0C1D36]'
            )}
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none',
              isDarkMode ? 'bg-[#1A1E26] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#0C1D36]'
            )}
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
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none',
              isDarkMode ? 'bg-[#1A1E26] border-slate-700 text-white' : 'bg-white border-slate-200 text-[#0C1D36]'
            )}
          >
            <option value="todos">Todos os Tipos</option>
            {STRICT_PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QUOTES TABLE */}
      {filteredQuotes.length === 0 ? (
        <div className={cn('text-center py-12 rounded-2xl border border-dashed space-y-2', isDarkMode ? 'bg-[#181B22] border-slate-800' : 'bg-slate-50 border-slate-200')}>
          <Icon icon={MetricQuoteIcon} size={32} className="text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Nenhum orçamento encontrado.</p>
        </div>
      ) : (
        <div className={cn('overflow-x-auto border rounded-2xl max-w-full', isDarkMode ? 'border-slate-800 bg-[#181B22]' : 'border-slate-200 bg-white')}>
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className={cn('border-b font-bold uppercase tracking-wider text-[11px]', isDarkMode ? 'bg-[#13161C] text-slate-300 border-slate-800' : 'bg-[#081D3A] text-white border-slate-800')}>
                <th className="p-3.5 whitespace-nowrap">Projeto & Cliente</th>
                <th className="p-3.5 whitespace-nowrap">Tipo</th>
                <th className="p-3.5 whitespace-nowrap">Valor Final</th>
                <th className="p-3.5 whitespace-nowrap">Status</th>
                <th className="p-3.5 whitespace-nowrap">Data</th>
                <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDarkMode ? 'divide-slate-800' : 'divide-slate-100')}>
              {filteredQuotes.map((quote) => (
                <tr key={quote.id} className={cn('transition-colors', isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50')}>
                  <td className="p-3.5">
                    <div className={cn('font-bold text-sm truncate', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>{quote.project_name}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {quote.client_name} {quote.company ? `(${quote.company})` : ''}
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-[#0075FF] whitespace-nowrap">{quote.project_type}</td>
                  <td className="p-3.5 font-bold font-mono text-emerald-500 whitespace-nowrap">
                    {quote.final_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={cn('px-2.5 py-1 rounded-md text-[10px] font-bold uppercase', getStatusBadgeStyle(quote.status))}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                    {formatDateBR(quote.created_at)}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedQuoteDetail(quote)}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-[#0075FF] hover:bg-blue-500/20 transition-colors cursor-pointer"
                        title="Ver Detalhes do Orçamento"
                      >
                        <Icon icon={ViewActionIcon} size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditQuoteInCalculator(quote)}
                        className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors cursor-pointer"
                        title="Editar no Calculador"
                      >
                        <Icon icon={EditActionIcon} size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuote(quote.id, quote.project_name)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
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

      {/* DETAIL MODAL */}
      {selectedQuoteDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={cn(
              'w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border',
              isDarkMode ? 'bg-[#16181D] text-white border-slate-800' : 'bg-white text-[#0C1D36] border-slate-200'
            )}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-700">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0075FF]">
                  Orçamento #{selectedQuoteDetail.id}
                </span>
                <h3 className="text-lg font-extrabold">{selectedQuoteDetail.project_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoteDetail(null)}
                className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400"
              >
                <Icon icon={CancelActionIcon} size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#1A1E26] border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Cliente:</span>
                  <span className="font-bold">{selectedQuoteDetail.client_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Empresa:</span>
                  <span className="font-bold">{selectedQuoteDetail.company || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tipo:</span>
                  <span className="font-bold text-[#0075FF]">{selectedQuoteDetail.project_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <span className="font-bold text-emerald-400">{selectedQuoteDetail.status}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between font-mono">
                <span className="font-bold">Valor Final Calculado:</span>
                <span className="text-base font-black">
                  {selectedQuoteDetail.final_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => onConvertToProject(selectedQuoteDetail)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-blue-600 shadow-md"
              >
                Gerar Projeto / Contrato
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuoteDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 text-slate-200"
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
