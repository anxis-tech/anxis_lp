'use client'

import { useState, useMemo } from 'react'
import { ClientProject } from '@/types/client-project.types'
import { SavedQuote } from '@/types/pricing.types'
import { Contract } from '@/types/contract.types'
import { Payment } from '@/types/payment.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Dollar01Icon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  AlertCircleIcon,
  Search01Icon,
  FilterIcon,
  UserIcon,
  File01Icon,
  Link01Icon,
  Download01Icon,
  Cancel01Icon,
  ArrowUp01Icon,
  PieChartIcon,
  Briefcase01Icon,
  Globe02Icon,
  Settings01Icon,
  CreditCardIcon,
  Invoice01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { CommissionsSubtab } from '@/components/admin/tabs/commissions-subtab'
import { PERMISSIONS, hasPermission } from '@/lib/auth/permissions'

export type PeriodFilterOption =
  | 'hoje'
  | 'ultimos_7_dias'
  | 'este_mes'
  | 'mes_anterior'
  | 'ultimos_3_meses'
  | 'este_ano'
  | 'custom'

interface FinanceTabProps {
  projects: ClientProject[]
  quotes: SavedQuote[]
  contracts: Contract[]
  payments: Payment[]
  teamUsers: UserProfileWithRole[]
  userProfile: UserProfileWithRole | null
  canViewValues?: boolean
  canViewPayments?: boolean
  onOpenProjectDetail?: (project: ClientProject) => void
}

export function FinanceTab({
  projects = [],
  quotes = [],
  contracts = [],
  payments = [],
  teamUsers = [],
  userProfile,
  canViewValues = true,
  canViewPayments = true,
  onOpenProjectDetail,
}: FinanceTabProps) {
  // ---------------------------------------------------------------------------
  // PERIOD FILTER STATE
  // ---------------------------------------------------------------------------
  const [period, setPeriod] = useState<PeriodFilterOption>('este_mes')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // Table Search & Filters State
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [responsibleFilter, setResponsibleFilter] = useState<string>('todos')
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('todos')
  const [activePendencyFilter, setActivePendencyFilter] = useState<string | null>(null)

  // Chart Grouping State
  const [chartGrouping, setChartGrouping] = useState<'dia' | 'semana' | 'mes'>('dia')

  // Sub-tab Navigation State ('overview' vs 'commissions')
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'commissions'>('overview')

  // Selected Detail Modal Project State
  const [selectedProjectModal, setSelectedProjectModal] = useState<ClientProject | null>(null)

  // ---------------------------------------------------------------------------
  // HELPER: DATE RANGE CALCULATION
  // ---------------------------------------------------------------------------
  const dateRange = useMemo(() => {
    const now = new Date()
    let start = new Date()
    let end = new Date()

    switch (period) {
      case 'hoje':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'ultimos_7_dias':
        start.setDate(now.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'este_mes':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'mes_anterior':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break
      case 'ultimos_3_meses':
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'este_ano':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
      case 'custom':
        if (customStartDate) {
          start = new Date(customStartDate + 'T00:00:00')
        } else {
          start = new Date(2020, 0, 1)
        }
        if (customEndDate) {
          end = new Date(customEndDate + 'T23:59:59')
        } else {
          end = new Date()
        }
        break
    }

    return { start, end }
  }, [period, customStartDate, customEndDate])

  // Helper check if a date falls within period
  const isInPeriod = (dateInput?: string | Date | null): boolean => {
    if (!dateInput) return false
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return false
    return d >= dateRange.start && d <= dateRange.end
  }

  // ---------------------------------------------------------------------------
  // MAP DATA RELATIONSHIPS REAL TIME
  // ---------------------------------------------------------------------------
  const paymentsMapByProjectId = useMemo(() => {
    const map: Record<string, Payment> = {}
    payments.forEach((pm) => {
      // Pick the latest payment entry for each project
      if (!map[pm.project_id] || new Date(pm.created_at) > new Date(map[pm.project_id].created_at)) {
        map[pm.project_id] = pm
      }
    })
    return map
  }, [payments])

  const contractsMapByProjectId = useMemo(() => {
    const map: Record<string, Contract> = {}
    contracts.forEach((c) => {
      if (!map[c.project_id] || new Date(c.created_at) > new Date(map[c.project_id].created_at)) {
        map[c.project_id] = c
      }
    })
    return map
  }, [contracts])

  // ---------------------------------------------------------------------------
  // FILTERED PROJECTS & PAYMENTS IN PERIOD
  // ---------------------------------------------------------------------------
  const filteredQuotesInPeriod = useMemo(() => {
    return quotes.filter((q) => isInPeriod(q.created_at))
  }, [quotes, dateRange])

  // ---------------------------------------------------------------------------
  // METRIC CARDS CALCULATIONS (SECTION 3)
  // ---------------------------------------------------------------------------
  const metrics = useMemo(() => {
    let revenueReceived = 0
    let pendingAmount = 0
    let paidProjectsCount = 0
    let pendingProjectsCount = 0

    projects.forEach((p) => {
      const pm = paymentsMapByProjectId[p.id]
      const dateToTest = pm?.paid_at || pm?.created_at || p.updated_at
      const isRecordInPeriod = isInPeriod(dateToTest)

      const isPaid = p.payment_status === 'Pago' || pm?.status === 'Pago'
      const isPending = p.payment_status === 'Pendente' || pm?.status === 'Pendente' || (p.payment_link && !isPaid)

      const approvedVal = p.approved_value || (pm ? pm.expected_amount / 100 : 0)
      const paidVal = p.paid_value || (pm && pm.status === 'Pago' ? (pm.paid_amount || pm.expected_amount) / 100 : 0)

      if (isPaid) {
        if (isRecordInPeriod) {
          revenueReceived += paidVal > 0 ? paidVal : approvedVal
          paidProjectsCount++
        }
      } else if (isPending) {
        if (isRecordInPeriod) {
          pendingAmount += approvedVal
          pendingProjectsCount++
        }
      }
    })

    return {
      revenueReceived,
      pendingAmount,
      paidProjectsCount,
      pendingProjectsCount,
    }
  }, [projects, paymentsMapByProjectId, dateRange])

  // ---------------------------------------------------------------------------
  // REVENUE EVOLUTION CHART DATA (SECTION 4)
  // ---------------------------------------------------------------------------
  const chartData = useMemo(() => {
    const points: Record<string, number> = {}

    projects.forEach((p) => {
      const pm = paymentsMapByProjectId[p.id]
      const isPaid = p.payment_status === 'Pago' || pm?.status === 'Pago'
      if (!isPaid) return

      const paidDate = pm?.paid_at || pm?.created_at || p.updated_at
      if (!isInPeriod(paidDate)) return

      const d = new Date(paidDate)
      const amount = p.paid_value || p.approved_value || (pm ? (pm.paid_amount || pm.expected_amount) / 100 : 0)

      let key = ''
      if (chartGrouping === 'dia') {
        key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
      } else if (chartGrouping === 'semana') {
        const weekNum = Math.ceil(d.getDate() / 7)
        key = `Sem ${weekNum} (${(d.getMonth() + 1).toString().padStart(2, '0')})`
      } else {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        key = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`
      }

      points[key] = (points[key] || 0) + amount
    })

    const labels = Object.keys(points)
    const values = Object.values(points)
    const maxVal = Math.max(...values, 1)

    return { labels, values, maxVal, points }
  }, [projects, paymentsMapByProjectId, chartGrouping, dateRange])

  // ---------------------------------------------------------------------------
  // REVENUE BY PROJECT TYPE (SECTION 8)
  // ---------------------------------------------------------------------------
  const revenueByType = useMemo(() => {
    const typesMap: Record<string, { count: number; total: number }> = {
      'Landing page': { count: 0, total: 0 },
      'Página de vendas': { count: 0, total: 0 },
      'Site institucional': { count: 0, total: 0 },
      'Loja virtual': { count: 0, total: 0 },
      'Integração ou funcionalidade': { count: 0, total: 0 },
      'Desenvolvimento personalizado em código': { count: 0, total: 0 },
    }

    projects.forEach((p) => {
      const pm = paymentsMapByProjectId[p.id]
      const isPaid = p.payment_status === 'Pago' || pm?.status === 'Pago'
      if (!isPaid) return

      const paidDate = pm?.paid_at || pm?.created_at || p.updated_at
      if (!isInPeriod(paidDate)) return

      const typeKey = typesMap[p.project_type] ? p.project_type : 'Desenvolvimento personalizado em código'
      const amount = p.paid_value || p.approved_value || (pm ? (pm.paid_amount || pm.expected_amount) / 100 : 0)

      typesMap[typeKey].count += 1
      typesMap[typeKey].total += amount
    })

    return Object.entries(typesMap).map(([type, data]) => ({
      type,
      count: data.count,
      total: data.total,
    }))
  }, [projects, paymentsMapByProjectId, dateRange])

  // ---------------------------------------------------------------------------
  // REVENUE BY RESPONSIBLE USER (SECTION 9)
  // ---------------------------------------------------------------------------
  const revenueByResponsible = useMemo(() => {
    const respMap: Record<string, { name: string; totalProjects: number; paidProjects: number; revenue: number; pending: number }> = {}

    // Initialize map with all team users
    teamUsers.forEach((u) => {
      respMap[u.user_id] = {
        name: u.full_name,
        totalProjects: 0,
        paidProjects: 0,
        revenue: 0,
        pending: 0,
      }
    })

    projects.forEach((p) => {
      const respId = p.responsible_user_id
      if (!respId) return

      const pm = paymentsMapByProjectId[p.id]
      const dateToTest = pm?.paid_at || pm?.created_at || p.updated_at
      if (!isInPeriod(dateToTest)) return

      if (!respMap[respId]) {
        respMap[respId] = {
          name: p.responsible_user_name || 'Usuário Sem Nome',
          totalProjects: 0,
          paidProjects: 0,
          revenue: 0,
          pending: 0,
        }
      }

      const isPaid = p.payment_status === 'Pago' || pm?.status === 'Pago'
      const amount = p.approved_value || (pm ? pm.expected_amount / 100 : 0)

      respMap[respId].totalProjects += 1
      if (isPaid) {
        respMap[respId].paidProjects += 1
        respMap[respId].revenue += p.paid_value || amount
      } else {
        respMap[respId].pending += amount
      }
    })

    return Object.values(respMap).filter((r) => r.totalProjects > 0)
  }, [projects, paymentsMapByProjectId, teamUsers, dateRange])

  // ---------------------------------------------------------------------------
  // QUOTES vs REVENUE CONVERSION (SECTION 7)
  // ---------------------------------------------------------------------------
  const quotesConversionMetrics = useMemo(() => {
    const totalCreated = filteredQuotesInPeriod.length
    let totalConverted = 0
    let totalConvertedValue = 0

    quotes.forEach((q) => {
      if (!isInPeriod(q.created_at)) return
      if (q.converted_project_id || q.status === 'Convertido em Projeto') {
        totalConverted++
        totalConvertedValue += q.form_data?.final_value || 0
      }
    })

    const conversionRate = totalCreated > 0 ? ((totalConverted / totalCreated) * 100).toFixed(1) : '0'

    return {
      totalCreated,
      totalConverted,
      totalConvertedValue,
      conversionRate,
    }
  }, [quotes, filteredQuotesInPeriod, dateRange])

  // ---------------------------------------------------------------------------
  // PENDENCIES & ATTENTION INDICATORS (SECTION 10)
  // ---------------------------------------------------------------------------
  const pendencies = useMemo(() => {
    const pendingPaymentsList = projects.filter((p) => {
      const pm = paymentsMapByProjectId[p.id]
      return p.payment_status === 'Pendente' || pm?.status === 'Pendente' || (p.payment_link && p.payment_status !== 'Pago')
    })

    const contractNoPaymentList = projects.filter((p) => {
      const hasContract = Boolean(contractsMapByProjectId[p.id])
      const pm = paymentsMapByProjectId[p.id]
      const hasPayment = Boolean(pm || p.payment_link)
      return hasContract && !hasPayment
    })

    const unconfirmedFailedList = projects.filter((p) => {
      const pm = paymentsMapByProjectId[p.id]
      return pm?.status === 'Falha na geração' || pm?.status === 'Falha na confirmação'
    })

    return {
      pendingPaymentsList,
      contractNoPaymentList,
      unconfirmedFailedList,
    }
  }, [projects, paymentsMapByProjectId, contractsMapByProjectId])

  // ---------------------------------------------------------------------------
  // RECENT PAYMENTS TABLE FILTERING (SECTION 5)
  // ---------------------------------------------------------------------------
  const tableData = useMemo(() => {
    return projects.filter((p) => {
      const pm = paymentsMapByProjectId[p.id]
      const contract = contractsMapByProjectId[p.id]

      // Search match
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.responsible_user_name && p.responsible_user_name.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status match
      const isPaid = p.payment_status === 'Pago' || pm?.status === 'Pago'
      const isFailed = pm?.status === 'Falha na geração' || pm?.status === 'Falha na confirmação'
      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'pago' && isPaid) ||
        (statusFilter === 'pendente' && !isPaid && !isFailed) ||
        (statusFilter === 'falha' && isFailed)

      // Responsible match
      const matchesResp =
        responsibleFilter === 'todos' || p.responsible_user_id === responsibleFilter

      // Project type match
      const matchesType =
        projectTypeFilter === 'todos' || p.project_type === projectTypeFilter

      // Active Pendency Filter match
      let matchesPendency = true
      if (activePendencyFilter === 'pendente') {
        matchesPendency = p.payment_status === 'Pendente' || pm?.status === 'Pendente'
      } else if (activePendencyFilter === 'contrato_sem_cobranca') {
        matchesPendency = Boolean(contract) && !pm && !p.payment_link
      } else if (activePendencyFilter === 'falha') {
        matchesPendency = isFailed
      }

      return matchesSearch && matchesStatus && matchesResp && matchesType && matchesPendency
    })
  }, [projects, paymentsMapByProjectId, contractsMapByProjectId, searchTerm, statusFilter, responsibleFilter, projectTypeFilter, activePendencyFilter])

  // Format monetary value helper
  const formatMoney = (val?: number) => {
    if (!canViewValues) return '••••••'
    if (val === undefined || val === null) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // Format date helper
  const formatDateBR = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('pt-BR')
  }

  const isSuperAdmin = userProfile?.is_super_admin === true
  const canViewCommissions = isSuperAdmin || hasPermission(userProfile, PERMISSIONS.COMMISSIONS_VIEW)

  return (
    <div className="space-y-8 font-sans text-[#0C1D36] animate-in fade-in duration-300">
      {/* SUB-NAVIGATION BAR (Visão Financeira vs Comissões) */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={cn(
            'px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2',
            activeSubTab === 'overview'
              ? 'bg-[#0C1D36] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-[#0C1D36] border border-slate-200'
          )}
        >
          <HugeiconsIcon icon={Dollar01Icon} className="w-4 h-4" strokeWidth={1.5} />
          <span>Visão Financeira</span>
        </button>

        {canViewCommissions && (
          <button
            type="button"
            onClick={() => setActiveSubTab('commissions')}
            className={cn(
              'px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2',
              activeSubTab === 'commissions'
                ? 'bg-[#0C1D36] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-[#0C1D36] border border-slate-200'
            )}
          >
            <HugeiconsIcon icon={PieChartIcon} className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
            <span>Comissões</span>
          </button>
        )}
      </div>

      {/* RENDER COMMISSIONS SUBTAB IF ACTIVE */}
      {activeSubTab === 'commissions' ? (
        <CommissionsSubtab
          projects={projects}
          teamUsers={teamUsers}
          userProfile={userProfile}
          canViewValues={canViewValues}
          canManageRules={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.COMMISSIONS_MANAGE_RULES)}
          canRegisterPayment={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.COMMISSIONS_REGISTER_PAYMENT)}
          onOpenProjectDetail={onOpenProjectDetail}
        />
      ) : (
        <>
          {/* ------------------------------------------------------------------- */}
          {/* 1. MODULE HEADER & PERIOD FILTER BAR (SECTION 2)                    */}
          {/* ------------------------------------------------------------------- */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0075FF]/10 text-[#0075FF] flex items-center justify-center font-bold">
                  <HugeiconsIcon icon={Dollar01Icon} className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0C1D36]">Módulo Financeiro</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Acompanhamento real de faturamento, receita recebida e cobranças da ANXIS.
                  </p>
                </div>
              </div>
            </div>

        {/* PERIOD SELECTOR BUTTONS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 flex-wrap">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: 'ultimos_7_dias', label: '7 dias' },
              { id: 'este_mes', label: 'Este mês' },
              { id: 'mes_anterior', label: 'Mês anterior' },
              { id: 'ultimos_3_meses', label: '3 meses' },
              { id: 'este_ano', label: 'Este ano' },
              { id: 'custom', label: 'Personalizado' },
            ].map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setPeriod(op.id as PeriodFilterOption)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  period === op.id
                    ? 'bg-[#0075FF] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#0C1D36] hover:bg-slate-200/60'
                )}
              >
                {op.label}
              </button>
            ))}
          </div>

          {/* CUSTOM DATE RANGE INPUTS */}
          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-slate-300 outline-none text-xs font-semibold bg-white"
              />
              <span className="text-slate-400 font-bold">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-slate-300 outline-none text-xs font-semibold bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. MAIN METRIC CARDS (SECTION 3)                                    */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: RECEITA RECEBIDA */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Receita Recebida</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatMoney(metrics.revenueReceived)}
          </div>
          <div className="text-[11px] text-emerald-600/80 font-medium mt-1">
            Pagamentos reais confirmados no período
          </div>
        </div>

        {/* CARD 2: VALORES PENDENTES */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-amber-600 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Valores Pendentes</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <HugeiconsIcon icon={Clock01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            {formatMoney(metrics.pendingAmount)}
          </div>
          <div className="text-[11px] text-amber-600/80 font-medium mt-1">
            Cobranças geradas aguardando pagamento
          </div>
        </div>

        {/* CARD 3: PROJETOS PAGOS */}
        <div className="bg-white rounded-3xl p-6 border border-blue-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-[#0075FF] mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Projetos Pagos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <HugeiconsIcon icon={Briefcase01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0C1D36] tracking-tight">
            {metrics.paidProjectsCount} <span className="text-xs font-semibold text-slate-500">projetos</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Com pagamento total liquidado
          </div>
        </div>

        {/* CARD 4: PROJETOS AGUARDANDO PAGAMENTO */}
        <div className="bg-white rounded-3xl p-6 border border-purple-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-purple-600 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Aguardando Pagamento</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <HugeiconsIcon icon={CreditCardIcon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0C1D36] tracking-tight">
            {metrics.pendingProjectsCount} <span className="text-xs font-semibold text-slate-500">projetos</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Links ativos aguardando liquidação
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. ATTENTION INDICATORS / FINANCIAL PENDENCIES (SECTION 10)         */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2">
            <HugeiconsIcon icon={AlertCircleIcon} className="w-4.5 h-4.5 text-amber-500" strokeWidth={1.5} />
            <span>Indicadores de Atenção Financeira</span>
          </h3>
          {activePendencyFilter && (
            <button
              type="button"
              onClick={() => setActivePendencyFilter(null)}
              className="text-xs font-bold text-[#0075FF] hover:underline"
            >
              Limpar filtro de atenção ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* PENDENCY 1 */}
          <button
            type="button"
            onClick={() => setActivePendencyFilter(activePendencyFilter === 'pendente' ? null : 'pendente')}
            className={cn(
              'p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3',
              activePendencyFilter === 'pendente'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200 hover:border-amber-300'
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
              {pendencies.pendingPaymentsList.length}
            </div>
            <div>
              <div className="font-extrabold text-[#0C1D36]">Pagamentos Pendentes</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Projetos com cobrança gerada aguardando confirmação do cliente.
              </div>
            </div>
          </button>

          {/* PENDENCY 2 */}
          <button
            type="button"
            onClick={() => setActivePendencyFilter(activePendencyFilter === 'contrato_sem_cobranca' ? null : 'contrato_sem_cobranca')}
            className={cn(
              'p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3',
              activePendencyFilter === 'contrato_sem_cobranca'
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
                : 'bg-slate-50 border-slate-200 hover:border-blue-300'
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0075FF] flex items-center justify-center shrink-0 font-bold">
              {pendencies.contractNoPaymentList.length}
            </div>
            <div>
              <div className="font-extrabold text-[#0C1D36]">Contrato sem Cobrança</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Projetos com PDF de contrato gerado mas sem link de pagamento.
              </div>
            </div>
          </button>

          {/* PENDENCY 3 */}
          <button
            type="button"
            onClick={() => setActivePendencyFilter(activePendencyFilter === 'falha' ? null : 'falha')}
            className={cn(
              'p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3',
              activePendencyFilter === 'falha'
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
                : 'bg-slate-50 border-slate-200 hover:border-rose-300'
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold">
              {pendencies.unconfirmedFailedList.length}
            </div>
            <div>
              <div className="font-extrabold text-[#0C1D36]">Falhas ou Erros</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Cobranças com erro na geração ou falha de confirmação.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. REVENUE EVOLUTION CHART (SECTION 4)                              */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#0C1D36] flex items-center gap-2">
              <HugeiconsIcon icon={ArrowUp01Icon} className="w-5 h-5 text-[#0075FF]" strokeWidth={1.5} />
              <span>Evolução da Receita no Período</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualização temporal exclusiva de recebimentos reais confirmados.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {[
              { id: 'dia', label: 'Por Dia' },
              { id: 'semana', label: 'Por Semana' },
              { id: 'mes', label: 'Por Mês' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setChartGrouping(g.id as any)}
                className={cn(
                  'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  chartGrouping === g.id
                    ? 'bg-white text-[#0075FF] shadow-xs'
                    : 'text-slate-600 hover:text-[#0C1D36]'
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* SVG BAR CHART */}
        {chartData.labels.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Nenhum pagamento confirmado registrado no período selecionado.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-48 w-full flex items-end justify-between gap-2 pt-6 px-2">
              {chartData.labels.map((label, idx) => {
                const val = chartData.values[idx]
                const heightPct = Math.max((val / chartData.maxVal) * 100, 8)

                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                    {/* TOOLTIP ON HOVER */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#081D3A] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-10">
                      {formatMoney(val)}
                    </div>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[40px] bg-[#0075FF] hover:bg-[#168CFF] rounded-t-xl transition-all shadow-xs"
                    />
                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-full">
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 5. BREAKDOWN GRID: PROJECT TYPES & RESPONSIBLES (SECTIONS 8 & 9)    */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REVENUE BY PROJECT TYPE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2 border-b border-slate-100 pb-3">
            <HugeiconsIcon icon={PieChartIcon} className="w-4.5 h-4.5 text-[#0075FF]" strokeWidth={1.5} />
            <span>Receita por Tipo de Projeto</span>
          </h3>

          <div className="space-y-2.5">
            {revenueByType.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs"
              >
                <div>
                  <div className="font-bold text-[#0C1D36]">{item.type}</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {item.count} {item.count === 1 ? 'projeto pago' : 'projetos pagos'}
                  </div>
                </div>
                <div className="font-black text-[#0075FF] text-sm">
                  {formatMoney(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REVENUE BY RESPONSIBLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2 border-b border-slate-100 pb-3">
            <HugeiconsIcon icon={UserIcon} className="w-4.5 h-4.5 text-[#0075FF]" strokeWidth={1.5} />
            <span>Acompanhamento por Responsável</span>
          </h3>

          {revenueByResponsible.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              Nenhum projeto com responsável registrado no período.
            </div>
          ) : (
            <div className="space-y-2.5">
              {revenueByResponsible.map((resp) => (
                <div
                  key={resp.name}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs"
                >
                  <div>
                    <div className="font-extrabold text-[#0C1D36]">{resp.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {resp.paidProjects} de {resp.totalProjects} projetos pagos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-emerald-600 text-sm">
                      {formatMoney(resp.revenue)}
                    </div>
                    {resp.pending > 0 && (
                      <div className="text-[10px] text-amber-600 font-semibold">
                        {formatMoney(resp.pending)} pendente
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 6. QUOTES vs REVENUE CONVERSION (SECTION 7)                         */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2">
            <HugeiconsIcon icon={File01Icon} className="w-4.5 h-4.5 text-[#0075FF]" strokeWidth={1.5} />
            <span>Relação entre Orçamentos e Conversão</span>
          </h3>
          <span className="text-[11px] bg-blue-50 text-[#0075FF] font-extrabold px-3 py-1 rounded-full border border-blue-200">
            Taxa de conversão: {quotesConversionMetrics.conversionRate}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-semibold">Orçamentos Criados</div>
            <div className="text-xl font-black text-[#0C1D36] mt-1">
              {quotesConversionMetrics.totalCreated}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-semibold">Orçamentos Convertidos</div>
            <div className="text-xl font-black text-emerald-600 mt-1">
              {quotesConversionMetrics.totalConverted}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-semibold">Valor dos Convertidos</div>
            <div className="text-xl font-black text-[#0075FF] mt-1">
              {formatMoney(quotesConversionMetrics.totalConvertedValue)}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 7. RECENT PAYMENTS & PROJECTS TABLE (SECTION 5)                      */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#0C1D36] flex items-center gap-2">
              <HugeiconsIcon icon={Invoice01Icon} className="w-5 h-5 text-[#0075FF]" strokeWidth={1.5} />
              <span>Histórico de Pagamentos e Projetos</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulte transações reais, comprovantes e status financeiros dos projetos.
            </p>
          </div>
        </div>

        {/* SEARCH & TABLE FILTERS */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-xs">
          <div className="relative w-full lg:w-72">
            <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Buscar cliente ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-[#0075FF] outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50 text-slate-700 outline-none"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="falha">Falha</option>
            </select>

            {/* RESPONSIBLE FILTER */}
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50 text-slate-700 outline-none"
            >
              <option value="todos">Todos os Responsáveis</option>
              {teamUsers.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.full_name}
                </option>
              ))}
            </select>

            {/* PROJECT TYPE FILTER */}
            <select
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 font-bold bg-slate-50 text-slate-700 outline-none"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="Landing page">Landing page</option>
              <option value="Página de vendas">Página de vendas</option>
              <option value="Site institucional">Site institucional</option>
              <option value="Loja virtual">Loja virtual</option>
              <option value="Integração ou funcionalidade">Integração</option>
              <option value="Desenvolvimento personalizado em código">Dev Personalizado</option>
            </select>
          </div>
        </div>

        {/* PAYMENTS TABLE */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#081D3A] text-white border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 whitespace-nowrap">Cliente & Projeto</th>
                <th className="p-3.5 whitespace-nowrap">Valor Aprovado</th>
                <th className="p-3.5 whitespace-nowrap">Status</th>
                <th className="p-3.5 whitespace-nowrap">Data</th>
                <th className="p-3.5 whitespace-nowrap">Responsável</th>
                <th className="p-3.5 whitespace-nowrap">Forma / Parcelas</th>
                <th className="p-3.5 text-right whitespace-nowrap">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    Nenhum registro financeiro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                tableData.map((p) => {
                  const pm = paymentsMapByProjectId[p.id]
                  const isPaid = p.payment_status === 'Pago' || pm?.status === 'Pago'
                  const isFailed = pm?.status === 'Falha na geração' || pm?.status === 'Falha na confirmação'
                  const dateStr = pm?.paid_at || pm?.created_at || p.updated_at
                  const approvedVal = p.approved_value || (pm ? pm.expected_amount / 100 : 0)

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-extrabold text-[#0C1D36] text-xs">{p.client_name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                          <span>{p.title}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            {p.project_type}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 font-extrabold text-[#0075FF]">
                        {formatMoney(approvedVal)}
                      </td>

                      <td className="p-3.5">
                        {isPaid ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-md border border-emerald-200">
                            Pago
                          </span>
                        ) : isFailed ? (
                          <span className="text-[10px] bg-rose-50 text-rose-700 font-extrabold px-2.5 py-1 rounded-md border border-rose-200">
                            Falha
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-md border border-amber-200">
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        {formatDateBR(dateStr)}
                      </td>

                      <td className="p-3.5 font-semibold text-slate-700">
                        {p.responsible_user_name || 'Sem responsável'}
                      </td>

                      <td className="p-3.5 text-slate-600">
                        {pm?.capture_method ? (
                          <span className="font-medium text-[11px]">
                            {pm.capture_method === 'credit_card' ? 'Cartão de crédito' : pm.capture_method === 'pix' ? 'PIX' : pm.capture_method}
                            {pm.installments && pm.installments > 1 ? ` (${pm.installments}x)` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProjectModal(p)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0075FF] hover:text-white font-bold text-slate-700 transition-colors cursor-pointer"
                        >
                          Ver Detalhes
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
      {/* 8. FINANCIAL DETAIL MODAL PER PROJECT (SECTION 6)                    */}
      {/* ------------------------------------------------------------------- */}
      {selectedProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#0075FF]">
                  Detalhes Financeiros do Projeto
                </span>
                <h3 className="text-lg font-extrabold text-[#0C1D36] mt-0.5">
                  {selectedProjectModal.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Cliente: <strong className="text-slate-700">{selectedProjectModal.client_name}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProjectModal(null)}
                className="text-slate-400 hover:text-[#0C1D36] font-bold p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* PROJECT FINANCIAL DATA GRID */}
            {(() => {
              const pm = paymentsMapByProjectId[selectedProjectModal.id]
              const contract = contractsMapByProjectId[selectedProjectModal.id]
              const quote = quotes.find((q) => q.id === selectedProjectModal.quote_id || q.converted_project_id === selectedProjectModal.id)
              const isPaid = selectedProjectModal.payment_status === 'Pago' || pm?.status === 'Pago'
              const approvedVal = selectedProjectModal.approved_value || (pm ? pm.expected_amount / 100 : 0)
              const paidVal = selectedProjectModal.paid_value || (pm && pm.status === 'Pago' ? (pm.paid_amount || pm.expected_amount) / 100 : 0)

              return (
                <div className="space-y-5 text-xs">
                  {/* VALUES GRID */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 font-medium">Tipo do Projeto</span>
                      <div className="font-bold text-[#0C1D36] mt-0.5">{selectedProjectModal.project_type}</div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Responsável</span>
                      <div className="font-bold text-[#0C1D36] mt-0.5">
                        {selectedProjectModal.responsible_user_name || 'Sem responsável'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Valor Aprovado</span>
                      <div className="font-black text-[#0075FF] text-sm mt-0.5">
                        {formatMoney(approvedVal)}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Valor Pago Confirmado</span>
                      <div className="font-black text-emerald-600 text-sm mt-0.5">
                        {formatMoney(paidVal)}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Status do Pagamento</span>
                      <div className="mt-1">
                        {isPaid ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full">
                            Pago Confirmado
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2.5 py-0.5 rounded-full">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Data do Pagamento / Gerado</span>
                      <div className="font-mono font-bold text-slate-700 mt-0.5">
                        {formatDateBR(pm?.paid_at || pm?.created_at || selectedProjectModal.updated_at)}
                      </div>
                    </div>
                  </div>

                  {/* RELATED LINKS & DOCUMENTS */}
                  <div className="space-y-2.5">
                    <h4 className="font-extrabold text-[#0C1D36]">Documentos e Links Relacionados</h4>

                    {/* QUOTE LINK */}
                    {quote && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={File01Icon} className="w-4 h-4 text-[#0075FF]" strokeWidth={1.5} />
                          <span className="font-bold">Orçamento Base: #{quote.id.slice(0, 8)}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600">
                          {formatMoney(quote.form_data?.final_value)}
                        </span>
                      </div>
                    )}

                    {/* CONTRACT LINK */}
                    {contract && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={File01Icon} className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
                          <span className="font-bold">Contrato em PDF Gerado</span>
                        </div>
                        <a
                          href={`/api/contracts/${contract.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] bg-emerald-600 text-white font-bold px-3 py-1 rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          Visualizar Contrato
                        </a>
                      </div>
                    )}

                    {/* PAYMENT LINK — ONLY SHOWN IF PAYMENT IS PENDING (SECTION 6) */}
                    {!isPaid && (selectedProjectModal.payment_link || pm?.payment_url) && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200">
                        <div className="flex items-center gap-2 text-amber-900">
                          <HugeiconsIcon icon={Link01Icon} className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
                          <span className="font-bold">Link de Pagamento InfinitePay (Pendente)</span>
                        </div>
                        <a
                          href={pm?.payment_url || selectedProjectModal.payment_link || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] bg-amber-600 text-white font-bold px-3 py-1 rounded-xl hover:bg-amber-700 transition-colors"
                        >
                          Abrir Link
                        </a>
                      </div>
                    )}

                    {/* PROOF / RECEIPT URL IF PAID */}
                    {isPaid && pm?.receipt_url && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-2 text-emerald-900">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
                          <span className="font-bold">Comprovante de Pagamento InfinitePay</span>
                        </div>
                        <a
                          href={pm.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] bg-emerald-600 text-white font-bold px-3 py-1 rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          Ver Comprovante
                        </a>
                      </div>
                    )}
                  </div>

                  {/* BUTTON TO FULL PROJECT DRAWER IF AVAILABLE */}
                  {onOpenProjectDetail && (
                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const proj = selectedProjectModal
                          setSelectedProjectModal(null)
                          onOpenProjectDetail(proj)
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0075FF] text-white font-extrabold text-xs hover:bg-[#168CFF] shadow-sm transition-all cursor-pointer"
                      >
                        Abrir Drawer Completo do Projeto
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )}
</div>
  )
}
