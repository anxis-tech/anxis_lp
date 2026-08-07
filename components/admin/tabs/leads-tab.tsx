'use client'

import { useState, useEffect, useMemo } from 'react'
import { Lead, LeadActivity, LeadStatus, LeadLossReason, LeadActivityType } from '@/types/lead.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import { SavedQuote } from '@/types/pricing.types'
import { ClientProject } from '@/types/client-project.types'
import {
  getLeadsAction,
  getLeadDetailsAction,
  createLeadManualAction,
  updateLeadStatusAction,
  assignLeadCommercialAction,
  addLeadActivityAction,
  deleteLeadAction,
} from '@/lib/actions/leads'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Mail01Icon,
  Search01Icon,
  FilterIcon,
  UserIcon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  AlertCircleIcon,
  CancelCircleIcon,
  RefreshIcon,
  PlusSignIcon,
  Delete02Icon,
  UserGroupIcon,
  Globe02Icon,
  Calculator01Icon,
  Briefcase01Icon,
  Tick01Icon,
  Link01Icon,
  Comment01Icon,
  CallIcon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

interface LeadsTabProps {
  teamUsers: UserProfileWithRole[]
  userProfile: UserProfileWithRole | null
  canViewAll?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canAssign?: boolean
  canChangeStatus?: boolean
  canCreateQuote?: boolean
  onStartQuoteForLead?: (lead: Lead) => void
  onStartProjectForLead?: (lead: Lead, quote?: SavedQuote | null) => void
}

const PROJECT_TYPES_LIST = [
  'Landing page',
  'Página de vendas',
  'Site institucional',
  'Loja virtual',
  'Integração ou funcionalidade',
  'Desenvolvimento personalizado em código',
]

const LOSS_REASONS_LIST: LeadLossReason[] = [
  'Valor',
  'Prazo',
  'Sem retorno',
  'Escolheu outro fornecedor',
  'Projeto cancelado',
  'Outro',
]

const STATUS_COLOR_MAP: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  Novo: { bg: 'bg-[#0075FF]/10', text: 'text-[#0075FF]', border: 'border-[#0075FF]/30' },
  'Em contato': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  Orçamento: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  Fechado: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  Perdido: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
}

export function LeadsTab({
  teamUsers = [],
  userProfile,
  canViewAll = true,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canAssign = true,
  canChangeStatus = true,
  canCreateQuote = true,
  onStartQuoteForLead,
  onStartProjectForLead,
}: LeadsTabProps) {
  // Loading & Data State
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [leadsList, setLeadsList] = useState<Lead[]>([])

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [quickFilter, setQuickFilter] = useState<string>('todos')
  const [periodFilter, setPeriodFilter] = useState<string>('todos')
  const [commercialFilter, setCommercialFilter] = useState<string>('todos')
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('todos')

  // Selected Lead Drawer State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedLeadActivities, setSelectedLeadActivities] = useState<LeadActivity[]>([])
  const [selectedLeadQuote, setSelectedLeadQuote] = useState<SavedQuote | null>(null)
  const [selectedLeadProject, setSelectedLeadProject] = useState<ClientProject | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false)
  const [activeDrawerTab, setActiveDrawerTab] = useState<'geral' | 'origem' | 'historico' | 'relacionados'>('geral')

  // New Interaction State in Drawer
  const [newActivityType, setNewActivityType] = useState<LeadActivityType>('observacao')
  const [newActivityDesc, setNewActivityDesc] = useState<string>('')
  const [isAddingActivity, setIsAddingActivity] = useState<boolean>(false)

  // New Manual Lead Modal State
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState<boolean>(false)
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    company: '',
    email: '',
    whatsapp: '',
    phone: '',
    project_type: 'Landing page',
    current_platform: '',
    budget_range: '',
    desired_deadline: '',
    initial_message: '',
    commercial_user_id: userProfile?.user_id || '',
  })
  const [isSubmittingLead, setIsSubmittingLead] = useState<boolean>(false)

  // Mark as Lost Modal State
  const [lostModalLead, setLostModalLead] = useState<Lead | null>(null)
  const [selectedLossReason, setSelectedLossReason] = useState<LeadLossReason>('Valor')
  const [lossNotes, setLossNotes] = useState<string>('')
  const [isMarkingLost, setIsMarkingLost] = useState<boolean>(false)

  // Load All Leads
  const loadLeads = async () => {
    setIsLoading(true)
    const res = await getLeadsAction({
      status: quickFilter === 'meus_leads' ? undefined : quickFilter,
      onlyMyLeads: quickFilter === 'meus_leads' || !canViewAll,
      commercialUserId: commercialFilter,
      projectType: projectTypeFilter,
      period: periodFilter as any,
      searchTerm: searchTerm,
    })

    if (res.leads) {
      setLeadsList(res.leads)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadLeads()
  }, [quickFilter, periodFilter, commercialFilter, projectTypeFilter, searchTerm])

  // Load Single Lead Details
  const openLeadDrawer = async (lead: Lead) => {
    setSelectedLead(lead)
    setIsLoadingDetails(true)
    setActiveDrawerTab('geral')

    const res = await getLeadDetailsAction(lead.id)
    if (res.success && res.lead) {
      setSelectedLead(res.lead)
      setSelectedLeadActivities(res.activities || [])
      setSelectedLeadQuote(res.quote || null)
      setSelectedLeadProject(res.project || null)
    }
    setIsLoadingDetails(false)
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD METRICS (SECTION 13)
  // ---------------------------------------------------------------------------
  const metrics = useMemo(() => {
    const totalReceived = leadsList.length
    const totalInContact = leadsList.filter((l) => l.status === 'Novo' || l.status === 'Em contato').length
    const totalQuotes = leadsList.filter((l) => l.status === 'Orçamento').length
    const totalClosed = leadsList.filter((l) => l.status === 'Fechado').length

    return { totalReceived, totalInContact, totalQuotes, totalClosed }
  }, [leadsList])

  // ---------------------------------------------------------------------------
  // CREATE MANUAL LEAD
  // ---------------------------------------------------------------------------
  const handleCreateManualLead = async () => {
    if (!newLeadForm.name || !newLeadForm.email || !newLeadForm.whatsapp) {
      alert('Por favor, preencha os campos obrigatórios: Nome, E-mail e WhatsApp.')
      return
    }

    setIsSubmittingLead(true)
    const commUser = teamUsers.find((u) => u.user_id === newLeadForm.commercial_user_id)

    const res = await createLeadManualAction({
      ...newLeadForm,
      commercial_user_name: commUser ? commUser.full_name : undefined,
    })

    setIsSubmittingLead(false)

    if (res.success) {
      setIsNewLeadModalOpen(false)
      setNewLeadForm({
        name: '',
        company: '',
        email: '',
        whatsapp: '',
        phone: '',
        project_type: 'Landing page',
        current_platform: '',
        budget_range: '',
        desired_deadline: '',
        initial_message: '',
        commercial_user_id: userProfile?.user_id || '',
      })
      loadLeads()
    } else {
      alert(`Erro: ${res.message}`)
    }
  }

  // ---------------------------------------------------------------------------
  // UPDATE STATUS OR MARK AS LOST
  // ---------------------------------------------------------------------------
  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    if (newStatus === 'Perdido') {
      const leadToMark = leadsList.find((l) => l.id === leadId) || selectedLead
      if (leadToMark) setLostModalLead(leadToMark)
      return
    }

    const res = await updateLeadStatusAction(leadId, newStatus)
    if (res.success) {
      if (selectedLead && selectedLead.id === leadId) {
        openLeadDrawer({ ...selectedLead, status: newStatus })
      }
      loadLeads()
    } else {
      alert(`Erro: ${res.message}`)
    }
  }

  const handleConfirmLost = async () => {
    if (!lostModalLead) return
    setIsMarkingLost(true)

    const res = await updateLeadStatusAction(
      lostModalLead.id,
      'Perdido',
      selectedLossReason,
      lossNotes
    )

    setIsMarkingLost(false)

    if (res.success) {
      setLostModalLead(null)
      setLossNotes('')
      if (selectedLead && selectedLead.id === lostModalLead.id) {
        openLeadDrawer({ ...selectedLead, status: 'Perdido' })
      }
      loadLeads()
    } else {
      alert(`Erro: ${res.message}`)
    }
  }

  // ---------------------------------------------------------------------------
  // ASSIGN COMMERCIAL RESPONSIBLE
  // ---------------------------------------------------------------------------
  const handleAssignCommercial = async (leadId: string, userId: string) => {
    const user = teamUsers.find((u) => u.user_id === userId)
    const userName = user ? user.full_name : 'Sem responsável'

    const res = await assignLeadCommercialAction(leadId, userId, userName)
    if (res.success) {
      if (selectedLead && selectedLead.id === leadId) {
        openLeadDrawer({ ...selectedLead, commercial_user_id: userId, commercial_user_name: userName })
      }
      loadLeads()
    } else {
      alert(`Erro: ${res.message}`)
    }
  }

  // ---------------------------------------------------------------------------
  // ADD TIMELINE ACTIVITY
  // ---------------------------------------------------------------------------
  const handleAddActivity = async () => {
    if (!selectedLead || !newActivityDesc.trim()) return
    setIsAddingActivity(true)

    const res = await addLeadActivityAction(selectedLead.id, newActivityType, newActivityDesc)
    setIsAddingActivity(false)

    if (res.success) {
      setNewActivityDesc('')
      openLeadDrawer(selectedLead)
    } else {
      alert(`Erro: ${res.message}`)
    }
  }

  // Helper date format
  const formatDateBR = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-8 font-sans text-[#0C1D36] animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------- */}
      {/* 1. MODULE HEADER & DASHBOARD METRICS CARDS (SECTION 13)             */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0075FF]/10 text-[#0075FF] flex items-center justify-center font-bold">
              <HugeiconsIcon icon={Mail01Icon} className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0C1D36]">Módulo de Leads</h2>
              <p className="text-xs text-slate-500 font-medium">
                Centralização comercial, contatos da Landing Page e histórico de atendimento.
              </p>
            </div>
          </div>
        </div>

        {/* PERIOD FILTER SELECTOR & NEW LEAD BUTTON */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 text-slate-500 ml-1" strokeWidth={1.5} />
            <span className="text-xs font-bold text-slate-600">Período:</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-extrabold text-xs bg-white outline-none cursor-pointer text-[#0075FF]"
            >
              <option value="todos">Todo o Período</option>
              <option value="hoje">Hoje</option>
              <option value="ultimos_7_dias">Últimos 7 dias</option>
              <option value="este_mes">Este Mês</option>
              <option value="mes_anterior">Mês Anterior</option>
              <option value="este_ano">Este Ano</option>
            </select>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => setIsNewLeadModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#0075FF] text-white text-xs font-extrabold hover:bg-[#168CFF] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" strokeWidth={2} />
              <span>Novo Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: RECEBIDOS */}
        <div className="bg-white rounded-3xl p-6 border border-blue-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[#0075FF] mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Leads Recebidos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <HugeiconsIcon icon={Mail01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0C1D36] tracking-tight">{metrics.totalReceived}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Total no período</div>
        </div>

        {/* CARD 2: EM CONTATO */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-600 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Em Atendimento</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <HugeiconsIcon icon={Clock01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">{metrics.totalInContact}</div>
          <div className="text-[11px] text-amber-600/80 font-medium mt-1">Novos e em contato</div>
        </div>

        {/* CARD 3: ORÇAMENTOS */}
        <div className="bg-white rounded-3xl p-6 border border-purple-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-600 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Em Orçamento</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <HugeiconsIcon icon={Calculator01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 tracking-tight">{metrics.totalQuotes}</div>
          <div className="text-[11px] text-purple-600/80 font-medium mt-1">Orçamentos gerados</div>
        </div>

        {/* CARD 4: FECHADOS */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Leads Fechados</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">{metrics.totalClosed}</div>
          <div className="text-[11px] text-emerald-600/80 font-medium mt-1">Convertidos em projetos</div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. SEARCH, QUICK FILTERS AND LEADS TABLE (SECTION 5)                */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        {/* QUICK FILTERS BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'Novo', label: 'Novos' },
              { id: 'Em contato', label: 'Em contato' },
              { id: 'Orçamento', label: 'Orçamento' },
              { id: 'Fechado', label: 'Fechados' },
              { id: 'Perdido', label: 'Perdidos' },
              { id: 'meus_leads', label: 'Meus Leads' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setQuickFilter(f.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer',
                  quickFilter === f.id
                    ? 'bg-[#0C1D36] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-[#0C1D36]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadLeads}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Recarregar e Atualizar"
          >
            <HugeiconsIcon icon={RefreshIcon} className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* SEARCH AND DETAILED DROPDOWN FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* SEARCH INPUT */}
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nome, empresa, e-mail, WhatsApp..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0075FF] font-medium bg-slate-50/50"
            />
          </div>

          {/* COMMERCIAL RESPONSIBLE SELECT */}
          <select
            value={commercialFilter}
            onChange={(e) => setCommercialFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0075FF] font-bold bg-slate-50/50"
          >
            <option value="todos">Todos os Comerciais</option>
            {teamUsers.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.full_name} ({u.role_slug || 'Membro'})
              </option>
            ))}
          </select>

          {/* PROJECT TYPE SELECT */}
          <select
            value={projectTypeFilter}
            onChange={(e) => setProjectTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#0075FF] font-bold bg-slate-50/50"
          >
            <option value="todos">Todos os Tipos de Projeto</option>
            {PROJECT_TYPES_LIST.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* CLEAR FILTERS */}
          {(searchTerm || quickFilter !== 'todos' || commercialFilter !== 'todos' || projectTypeFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setQuickFilter('todos')
                setCommercialFilter('todos')
                setProjectTypeFilter('todos')
              }}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors text-xs"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* LEADS TABLE */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Nome & Empresa</th>
                <th className="p-3.5">Tipo de Projeto</th>
                <th className="p-3.5">Origem</th>
                <th className="p-3.5">Comercial Responsável</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Entrada</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium text-xs">
                    <div className="w-5 h-5 border-2 border-[#0075FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Carregando leads...
                  </td>
                </tr>
              ) : leadsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium text-xs">
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                leadsList.map((lead) => {
                  const statusStyle = STATUS_COLOR_MAP[lead.status] || STATUS_COLOR_MAP.Novo

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      {/* NAME & CONTACT */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-[#0C1D36] text-xs">{lead.name}</div>
                        {lead.company && <div className="text-[11px] text-slate-500">{lead.company}</div>}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lead.whatsapp}</div>
                      </td>

                      {/* PROJECT TYPE */}
                      <td className="p-3.5">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md">
                          {lead.project_type}
                        </span>
                      </td>

                      {/* SOURCE */}
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            lead.source === 'Landing Page'
                              ? 'bg-blue-50 text-[#0075FF] border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          )}
                        >
                          {lead.source}
                        </span>
                        {lead.utm_source && (
                          <div className="text-[9px] text-slate-400 mt-0.5 font-mono">utm: {lead.utm_source}</div>
                        )}
                      </td>

                      {/* COMMERCIAL RESPONSIBLE */}
                      <td className="p-3.5">
                        {lead.commercial_user_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#081D3A] text-white flex items-center justify-center font-bold text-[10px]">
                              {lead.commercial_user_name.charAt(0)}
                            </div>
                            <span className="font-bold text-[#0C1D36] text-xs">{lead.commercial_user_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sem responsável</span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'text-[10px] font-extrabold px-2.5 py-1 rounded-full border',
                            statusStyle.bg,
                            statusStyle.text,
                            statusStyle.border
                          )}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="p-3.5 text-slate-500 text-[11px] font-medium">
                        {formatDateBR(lead.created_at)}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => openLeadDrawer(lead)}
                          className="px-3 py-1.5 rounded-lg bg-[#0075FF] text-white font-extrabold hover:bg-[#168CFF] transition-colors text-[11px]"
                        >
                          Abrir Lead
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. LEAD DETAILS DRAWER / MODAL (SECTION 6)                          */}
      {/* ------------------------------------------------------------------- */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-0 font-sans animate-in fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* DRAWER HEADER */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black text-[#0075FF] tracking-wider">
                      Detalhes do Lead
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                      Origem: {selectedLead.source}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#0C1D36] mt-1">{selectedLead.name}</h3>
                  {selectedLead.company && <p className="text-xs font-bold text-slate-500">{selectedLead.company}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* ACTION BUTTONS & STATUS BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* STATUS SELECT */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Status:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value as LeadStatus)}
                    disabled={!canChangeStatus}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 font-black text-xs bg-white outline-none cursor-pointer text-[#0075FF]"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Em contato">Em contato</option>
                    <option value="Orçamento">Orçamento</option>
                    <option value="Fechado">Fechado</option>
                    <option value="Perdido">Perdido</option>
                  </select>
                </div>

                {/* CREATE QUOTE & CONVERT TO PROJECT BUTTONS */}
                <div className="flex items-center gap-2">
                  {canCreateQuote && onStartQuoteForLead && (
                    <button
                      type="button"
                      onClick={() => {
                        onStartQuoteForLead(selectedLead)
                        setSelectedLead(null)
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <HugeiconsIcon icon={Calculator01Icon} className="w-3.5 h-3.5" />
                      <span>Criar Orçamento</span>
                    </button>
                  )}

                  {onStartProjectForLead && (
                    <button
                      type="button"
                      onClick={() => {
                        onStartProjectForLead(selectedLead, selectedLeadQuote)
                        setSelectedLead(null)
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <HugeiconsIcon icon={Briefcase01Icon} className="w-3.5 h-3.5" />
                      <span>Converter em Projeto</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* DRAWER INTERNAL NAVIGATION TABS */}
            <div className="flex border-b border-slate-200 px-6 bg-white text-xs font-extrabold">
              {[
                { id: 'geral', label: 'Informações Gerais' },
                { id: 'origem', label: 'Origem & UTMs' },
                { id: 'historico', label: `Linha do Tempo (${selectedLeadActivities.length})` },
                { id: 'relacionados', label: 'Orçamento & Projeto' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDrawerTab(tab.id as any)}
                  className={cn(
                    'py-3 px-4 border-b-2 transition-all cursor-pointer',
                    activeDrawerTab === tab.id
                      ? 'border-[#0075FF] text-[#0075FF]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* DRAWER TAB BODY */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {isLoadingDetails ? (
                <div className="p-12 text-center text-slate-400 font-medium text-xs">
                  <div className="w-5 h-5 border-2 border-[#0075FF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Carregando informações detalhadas...
                </div>
              ) : (
                <>
                  {/* TAB 1: GERAL & CONTATO */}
                  {activeDrawerTab === 'geral' && (
                    <div className="space-y-6 text-xs">
                      {/* DADOS DE CONTATO */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <h4 className="font-extrabold text-sm text-[#0C1D36]">Dados de Contato</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="font-bold text-slate-500">E-mail:</span>
                            <div className="font-extrabold text-[#0C1D36]">{selectedLead.email}</div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">WhatsApp:</span>
                            <div className="font-extrabold text-[#0C1D36] flex items-center gap-1.5">
                              <HugeiconsIcon icon={WhatsappIcon} className="w-4 h-4 text-emerald-600" />
                              <a
                                href={`https://wa.me/55${selectedLead.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="underline hover:text-emerald-700"
                              >
                                {selectedLead.whatsapp}
                              </a>
                            </div>
                          </div>
                          {selectedLead.phone && (
                            <div>
                              <span className="font-bold text-slate-500">Telefone Fixo:</span>
                              <div className="font-extrabold text-[#0C1D36]">{selectedLead.phone}</div>
                            </div>
                          )}
                          {selectedLead.company && (
                            <div>
                              <span className="font-bold text-slate-500">Empresa:</span>
                              <div className="font-extrabold text-[#0C1D36]">{selectedLead.company}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* INTERESSE DO PROJETO */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <h4 className="font-extrabold text-sm text-[#0C1D36]">Interesse do Projeto</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="font-bold text-slate-500">Tipo de Projeto:</span>
                            <div className="font-extrabold text-[#0075FF]">{selectedLead.project_type}</div>
                          </div>
                          {selectedLead.current_platform && (
                            <div>
                              <span className="font-bold text-slate-500">Plataforma Atual:</span>
                              <div className="font-extrabold text-[#0C1D36]">{selectedLead.current_platform}</div>
                            </div>
                          )}
                          {selectedLead.budget_range && (
                            <div>
                              <span className="font-bold text-slate-500">Faixa de Investimento:</span>
                              <div className="font-extrabold text-[#0C1D36]">{selectedLead.budget_range}</div>
                            </div>
                          )}
                          {selectedLead.desired_deadline && (
                            <div>
                              <span className="font-bold text-slate-500">Prazo Desejado:</span>
                              <div className="font-extrabold text-[#0C1D36]">{selectedLead.desired_deadline}</div>
                            </div>
                          )}
                        </div>

                        {selectedLead.initial_message && (
                          <div className="pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-500">Mensagem Inicial do Cliente:</span>
                            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 italic mt-1">
                              &quot;{selectedLead.initial_message}&quot;
                            </div>
                          </div>
                        )}
                      </div>

                      {/* COMERCIAL RESPONSÁVEL ATRIBUIÇÃO */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <h4 className="font-extrabold text-sm text-[#0C1D36]">Comercial Responsável</h4>
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#081D3A] text-white flex items-center justify-center font-bold">
                              {selectedLead.commercial_user_name
                                ? selectedLead.commercial_user_name.charAt(0)
                                : '?'}
                            </div>
                            <div>
                              <div className="font-extrabold text-[#0C1D36]">
                                {selectedLead.commercial_user_name || 'Nenhum comercial atribuído'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Receberá comissão no fechamento do projeto
                              </div>
                            </div>
                          </div>

                          {canAssign && (
                            <select
                              value={selectedLead.commercial_user_id || ''}
                              onChange={(e) => handleAssignCommercial(selectedLead.id, e.target.value)}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold bg-white outline-none text-xs text-[#0075FF]"
                            >
                              <option value="">Atribuir Comercial...</option>
                              {teamUsers.map((u) => (
                                <option key={u.user_id} value={u.user_id}>
                                  {u.full_name} ({u.role_slug || 'Membro'})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* SE FOR LEAD PERDIDO, EXIBE MOTIVO */}
                      {selectedLead.status === 'Perdido' && (
                        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-1">
                          <span className="font-extrabold text-rose-800 uppercase text-[10px]">
                            Motivo do Descarte / Perda:
                          </span>
                          <div className="font-extrabold text-rose-900 text-sm">
                            {selectedLead.loss_reason || 'Não informado'}
                          </div>
                          {selectedLead.loss_notes && (
                            <p className="text-xs text-rose-800 italic mt-1">&quot;{selectedLead.loss_notes}&quot;</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: ORIGEM & UTMS */}
                  {activeDrawerTab === 'origem' && (
                    <div className="space-y-4 text-xs">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <h4 className="font-extrabold text-sm text-[#0C1D36]">Dados de Aquisição & UTMs</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="font-bold text-slate-500">Canal de Origem:</span>
                            <div className="font-extrabold text-[#0075FF]">{selectedLead.source}</div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">Página de Entrada:</span>
                            <div className="font-mono text-slate-700">{selectedLead.landing_page || '/'}</div>
                          </div>
                          {selectedLead.referrer && (
                            <div className="col-span-2">
                              <span className="font-bold text-slate-500">Referrer (Origem de tráfego):</span>
                              <div className="font-mono text-slate-700">{selectedLead.referrer}</div>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="font-bold text-slate-500">utm_source:</span>
                            <div className="font-mono text-slate-800">{selectedLead.utm_source || '-'}</div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">utm_medium:</span>
                            <div className="font-mono text-slate-800">{selectedLead.utm_medium || '-'}</div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">utm_campaign:</span>
                            <div className="font-mono text-slate-800">{selectedLead.utm_campaign || '-'}</div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">utm_content:</span>
                            <div className="font-mono text-slate-800">{selectedLead.utm_content || '-'}</div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">utm_term:</span>
                            <div className="font-mono text-slate-800">{selectedLead.utm_term || '-'}</div>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500">gclid / fbclid:</span>
                            <div className="font-mono text-slate-800">
                              {selectedLead.gclid || selectedLead.fbclid || '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LINHA DO TEMPO / HISTÓRICO */}
                  {activeDrawerTab === 'historico' && (
                    <div className="space-y-6 text-xs">
                      {/* FORMULARIO ADICIONAR INTERACAO MANUAL */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <h4 className="font-extrabold text-sm text-[#0C1D36]">Registrar Nova Interação Comercial</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold mb-1">Tipo de Interação</label>
                            <select
                              value={newActivityType}
                              onChange={(e) => setNewActivityType(e.target.value as LeadActivityType)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white outline-none"
                            >
                              <option value="ligacao">Ligação Telefônica</option>
                              <option value="whatsapp">Mensagem no WhatsApp</option>
                              <option value="email">E-mail Enviado</option>
                              <option value="reuniao">Reunião Realizada</option>
                              <option value="follow_up">Follow-up Comercial</option>
                              <option value="observacao">Observação Interna</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold mb-1">Descrição / Notas da Interação</label>
                            <input
                              type="text"
                              value={newActivityDesc}
                              onChange={(e) => setNewActivityDesc(e.target.value)}
                              placeholder="Ex: Cliente solicitou reunião de alinhamento para sexta-feira às 14h."
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddActivity}
                            disabled={isAddingActivity || !newActivityDesc.trim()}
                            className="px-4 py-2 rounded-xl bg-[#0075FF] text-white font-extrabold text-xs hover:bg-[#168CFF] shadow-sm disabled:opacity-50"
                          >
                            {isAddingActivity ? 'Registrando...' : 'Registrar no Histórico'}
                          </button>
                        </div>
                      </div>

                      {/* TIMELINE LIST */}
                      <div className="space-y-4 relative pl-4 border-l-2 border-slate-200">
                        {selectedLeadActivities.length === 0 ? (
                          <div className="text-slate-400 italic">Nenhuma atividade registrada ainda.</div>
                        ) : (
                          selectedLeadActivities.map((act) => (
                            <div key={act.id} className="relative space-y-1">
                              <div className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-[#0075FF] border-2 border-white" />
                              <div className="flex items-center justify-between text-slate-500 font-medium text-[11px]">
                                <span className="font-extrabold text-[#0C1D36]">{act.user_name || 'Sistema'}</span>
                                <span>{formatDateBR(act.created_at)}</span>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium">
                                {act.description}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: RELACIONADOS (ORÇAMENTO & PROJETO) */}
                  {activeDrawerTab === 'relacionados' && (
                    <div className="space-y-6 text-xs">
                      {/* ORÇAMENTO VINCULADO */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm text-[#0C1D36]">Orçamento Calculado</h4>
                          {selectedLeadQuote && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              Status: {selectedLeadQuote.status}
                            </span>
                          )}
                        </div>

                        {selectedLeadQuote ? (
                          <div className="bg-white p-4 rounded-xl border border-purple-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-600">{selectedLeadQuote.project_name}</span>
                              <span className="text-base font-black text-purple-700">
                                R$ {selectedLeadQuote.final_value.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Gerado em: {formatDateBR(selectedLeadQuote.created_at)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 italic">Nenhum orçamento vinculado a este lead.</div>
                        )}
                      </div>

                      {/* PROJETO VINCULADO */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm text-[#0C1D36]">Projeto de Cliente</h4>
                          {selectedLeadProject && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              {selectedLeadProject.status}
                            </span>
                          )}
                        </div>

                        {selectedLeadProject ? (
                          <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-[#0C1D36]">{selectedLeadProject.title}</span>
                              <span className="text-sm font-black text-emerald-700">
                                R$ {(selectedLeadProject.approved_value || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Comercial atribuído: {selectedLeadProject.commercial_user_name || 'Nenhum'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 italic">
                            Nenhum projeto de cliente criado a partir deste lead ainda.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. MODAL MANUAL LEAD CREATION                                       */}
      {/* ------------------------------------------------------------------- */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#0C1D36]">Cadastrar Novo Lead Manualmente</h3>
                <p className="text-xs text-slate-500">Inserção de contato direto recebido por telefone, indicação ou WhatsApp.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewLeadModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Nome Completo do Cliente *</label>
                <input
                  type="text"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">E-mail *</label>
                <input
                  type="email"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  placeholder="carlos@empresa.com.br"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">WhatsApp *</label>
                <input
                  type="text"
                  value={newLeadForm.whatsapp}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Empresa</label>
                <input
                  type="text"
                  value={newLeadForm.company}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                  placeholder="Ex: ANXIS Tech"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Tipo de Projeto *</label>
                <select
                  value={newLeadForm.project_type}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, project_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white outline-none"
                >
                  {PROJECT_TYPES_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Comercial Responsável</label>
                <select
                  value={newLeadForm.commercial_user_id}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, commercial_user_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white outline-none"
                >
                  <option value="">Nenhum atribuído</option>
                  {teamUsers.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.full_name} ({u.role_slug || 'Membro'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Faixa de Investimento</label>
                <input
                  type="text"
                  value={newLeadForm.budget_range}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, budget_range: e.target.value })}
                  placeholder="Ex: R$ 3.000 a R$ 5.000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Mensagem Inicial / Necessidades</label>
                <textarea
                  rows={2}
                  value={newLeadForm.initial_message}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, initial_message: e.target.value })}
                  placeholder="Descreva a demanda principal do cliente..."
                  className="w-full p-3 rounded-xl border border-slate-300 font-medium outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsNewLeadModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCreateManualLead}
                disabled={isSubmittingLead}
                className="px-5 py-2 rounded-xl bg-[#0075FF] text-white font-extrabold hover:bg-[#168CFF] shadow-sm disabled:opacity-50"
              >
                {isSubmittingLead ? 'Cadastrando...' : 'Salvar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 5. MODAL MARK AS LOST (SECTION 12)                                  */}
      {/* ------------------------------------------------------------------- */}
      {lostModalLead && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div>
              <span className="text-[10px] uppercase font-black text-rose-600 tracking-wider">
                Descarte Comercial
              </span>
              <h3 className="text-base font-extrabold text-[#0C1D36] mt-0.5">
                Marcar Lead como Perdido: {lostModalLead.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Selecione o motivo principal do encerramento para fins de inteligência comercial.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Motivo da Perda *</label>
                <select
                  value={selectedLossReason}
                  onChange={(e) => setSelectedLossReason(e.target.value as LeadLossReason)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white outline-none text-rose-700"
                >
                  {LOSS_REASONS_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Observações Adicionais (Opcional)</label>
                <textarea
                  rows={2}
                  value={lossNotes}
                  onChange={(e) => setLossNotes(e.target.value)}
                  placeholder="Ex: Cliente optou por adiar a contratação para o próximo semestre."
                  className="w-full p-3 rounded-xl border border-slate-300 font-medium outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setLostModalLead(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmLost}
                disabled={isMarkingLost}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-extrabold hover:bg-rose-700 shadow-sm disabled:opacity-50"
              >
                {isMarkingLost ? 'Salvando...' : 'Confirmar Perda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
