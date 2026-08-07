'use client'

import { useState, useEffect, useMemo } from 'react'
import { ClientProject } from '@/types/client-project.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import {
  CommissionRule,
  CommissionRecord,
  CommissionPaymentHistory,
  getCommissionRulesAction,
  upsertCommissionRuleAction,
  getCommissionsForMonthAction,
  markUserCommissionsAsPaidAction,
} from '@/lib/actions/commissions'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Dollar01Icon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  AlertCircleIcon,
  UserIcon,
  Settings01Icon,
  Briefcase01Icon,
  PieChartIcon,
  CancelCircleIcon,
  RefreshIcon,
  File01Icon,
  Tick01Icon,
  Invoice01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

interface CommissionsSubtabProps {
  projects: ClientProject[]
  teamUsers: UserProfileWithRole[]
  userProfile: UserProfileWithRole | null
  canViewValues?: boolean
  canManageRules?: boolean
  canRegisterPayment?: boolean
  onOpenProjectDetail?: (project: ClientProject) => void
}

const PROJECT_TYPES_LIST = [
  'Landing page',
  'Página de vendas',
  'Site institucional',
  'Loja virtual',
  'Integração ou funcionalidade',
  'Desenvolvimento personalizado em código',
]

// Helper to get previous month in YYYY-MM format
function getPreviousMonthString(): string {
  const now = new Date()
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const yyyy = prevDate.getFullYear()
  const mm = (prevDate.getMonth() + 1).toString().padStart(2, '0')
  return `${yyyy}-${mm}`
}

// Format YYYY-MM to Month Name YYYY (e.g. '2026-07' -> 'Julho 2026')
function formatMonthName(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr
  const [year, month] = monthStr.split('-').map(Number)
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]
  return `${months[month - 1] || ''} ${year}`
}

export function CommissionsSubtab({
  projects = [],
  teamUsers = [],
  userProfile,
  canViewValues = true,
  canManageRules = true,
  canRegisterPayment = true,
  onOpenProjectDetail,
}: CommissionsSubtabProps) {
  // Reference Month State (Default to previous month for day 5 closing cycle)
  const [referenceMonth, setReferenceMonth] = useState<string>(getPreviousMonthString())

  // Loading & Data State
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [rulesList, setRulesList] = useState<CommissionRule[]>([])
  const [commissionsList, setCommissionsList] = useState<CommissionRecord[]>([])
  const [paymentsHistory, setPaymentsHistory] = useState<CommissionPaymentHistory[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Rules Modal State
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false)
  const [editingRule, setEditingRule] = useState<{
    recipient_type: 'professional' | 'commercial'
    project_type: string
    calculation_type: 'percentage' | 'fixed'
    value: number
  } | null>(null)
  const [isSavingRule, setIsSavingRule] = useState<boolean>(false)

  // Payment Modal State
  const [paymentUserModal, setPaymentUserModal] = useState<{
    userId: string
    userName: string
    amount: number
  } | null>(null)
  const [paymentNotes, setPaymentNotes] = useState<string>('')
  const [isRegisteringPayment, setIsRegisteringPayment] = useState<boolean>(false)

  // Generate last 12 months for selector
  const availableMonths = useMemo(() => {
    const monthsList: { value: string; label: string }[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
      monthsList.push({ value: val, label: formatMonthName(val) })
    }
    return monthsList
  }, [])

  // Fetch rules & sync commissions for month
  const loadCommissionsData = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [rulesRes, commsRes] = await Promise.all([
        getCommissionRulesAction(),
        getCommissionsForMonthAction(referenceMonth),
      ])

      if (rulesRes.rules) {
        setRulesList(rulesRes.rules)
      }

      if (commsRes.success) {
        setCommissionsList(commsRes.commissions || [])
        setPaymentsHistory(commsRes.paymentsHistory || [])
      } else {
        setErrorMessage(commsRes.message || 'Erro ao sincronizar comissões.')
      }
    } catch (err: any) {
      console.error('Error loading commissions:', err)
      setErrorMessage('Falha na conexão com o banco de dados.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCommissionsData()
  }, [referenceMonth])

  // ---------------------------------------------------------------------------
  // MONTHLY SUMMARY METRICS (SECTION 7)
  // ---------------------------------------------------------------------------
  const summaryMetrics = useMemo(() => {
    let totalCommissions = 0
    let totalProfessional = 0
    let totalCommercial = 0

    const userIdsSet = new Set<string>()
    const projectIdsSet = new Set<string>()

    commissionsList.forEach((c) => {
      const amt = Number(c.calculated_amount) || 0
      totalCommissions += amt

      if (c.recipient_type === 'professional') {
        totalProfessional += amt
      } else {
        totalCommercial += amt
      }

      userIdsSet.add(c.user_id)
      projectIdsSet.add(c.project_id)
    })

    return {
      totalCommissions,
      totalProfessional,
      totalCommercial,
      userCount: userIdsSet.size,
      projectCount: projectIdsSet.size,
    }
  }, [commissionsList])

  // ---------------------------------------------------------------------------
  // COMMISSIONS GROUPED BY USER (SECTION 4, 5 & 8)
  // ---------------------------------------------------------------------------
  const groupedByUser = useMemo(() => {
    const map: Record<
      string,
      {
        userId: string
        userName: string
        recipientTypes: Set<string>
        totalAmount: number
        isPaid: boolean
        items: CommissionRecord[]
      }
    > = {}

    commissionsList.forEach((c) => {
      if (!map[c.user_id]) {
        map[c.user_id] = {
          userId: c.user_id,
          userName: c.user_name || 'Funcionário',
          recipientTypes: new Set(),
          totalAmount: 0,
          isPaid: true,
          items: [],
        }
      }

      map[c.user_id].items.push(c)
      map[c.user_id].recipientTypes.add(c.recipient_type)
      map[c.user_id].totalAmount += Number(c.calculated_amount) || 0
      if (c.status !== 'Pago') {
        map[c.user_id].isPaid = false
      }
    })

    return Object.values(map)
  }, [commissionsList])

  // ---------------------------------------------------------------------------
  // SAVE / UPSERT COMMISSION RULE
  // ---------------------------------------------------------------------------
  const handleSaveRule = async () => {
    if (!editingRule) return
    setIsSavingRule(true)
    const res = await upsertCommissionRuleAction(editingRule)
    setIsSavingRule(false)

    if (res.success) {
      setEditingRule(null)
      loadCommissionsData()
    } else {
      alert(`Erro: ${res.message}`)
    }
  }

  // ---------------------------------------------------------------------------
  // REGISTER PAYMENT
  // ---------------------------------------------------------------------------
  const handleRegisterPayment = async () => {
    if (!paymentUserModal) return
    setIsRegisteringPayment(true)

    const res = await markUserCommissionsAsPaidAction(
      paymentUserModal.userId,
      referenceMonth,
      paymentNotes
    )

    setIsRegisteringPayment(false)

    if (res.success) {
      alert(res.message)
      setPaymentUserModal(null)
      setPaymentNotes('')
      loadCommissionsData()
    } else {
      alert(`Erro: ${res.message}`)
    }
  }

  // Format currency helper
  const formatMoney = (val?: number) => {
    if (!canViewValues) return '••••••'
    if (val === undefined || val === null) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  return (
    <div className="space-y-8 font-sans text-[#0C1D36] animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------- */}
      {/* 1. MODULE HEADER & REFERENCE MONTH SELECTOR (SECTION 6)              */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0075FF]/10 text-[#0075FF] flex items-center justify-center font-bold">
              <HugeiconsIcon icon={PieChartIcon} className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0C1D36]">Módulo de Comissões</h2>
              <p className="text-xs text-slate-500 font-medium">
                Acompanhamento e fechamento mensal de comissões de comerciais e profissionais da ANXIS.
              </p>
            </div>
          </div>
        </div>

        {/* MONTH SELECTOR & RULE CONFIG BUTTON */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 text-slate-500 ml-1" strokeWidth={1.5} />
            <span className="text-xs font-bold text-slate-600">Mês de Referência:</span>
            <select
              value={referenceMonth}
              onChange={(e) => setReferenceMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-extrabold text-xs bg-white outline-none cursor-pointer text-[#0075FF]"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {canManageRules && (
            <button
              type="button"
              onClick={() => setIsRulesModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-extrabold hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4 text-[#0075FF]" strokeWidth={1.5} />
              <span>Configurar Regras</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. MONTHLY SUMMARY CARDS (SECTION 7)                                */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: TOTAL DE COMISSÕES */}
        <div className="bg-white rounded-3xl p-6 border border-blue-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-[#0075FF] mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total de Comissões</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <HugeiconsIcon icon={Dollar01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0C1D36] tracking-tight">
            {formatMoney(summaryMetrics.totalCommissions)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Valor apurado para {formatMonthName(referenceMonth)}
          </div>
        </div>

        {/* CARD 2: TOTAL PROFISSIONAIS */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Para Profissionais</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <HugeiconsIcon icon={Briefcase01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatMoney(summaryMetrics.totalProfessional)}
          </div>
          <div className="text-[11px] text-emerald-600/80 font-medium mt-1">
            Designers & Desenvolvedores executores
          </div>
        </div>

        {/* CARD 3: TOTAL COMERCIAL */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-600 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Para Comercial</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <HugeiconsIcon icon={UserIcon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            {formatMoney(summaryMetrics.totalCommercial)}
          </div>
          <div className="text-[11px] text-amber-600/80 font-medium mt-1">
            Fechamento comercial de contratos
          </div>
        </div>

        {/* CARD 4: PROJETOS E FUNCIONÁRIOS */}
        <div className="bg-white rounded-3xl p-6 border border-purple-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-600 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Funcionários & Projetos</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <HugeiconsIcon icon={Invoice01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0C1D36] tracking-tight">
            {summaryMetrics.userCount} <span className="text-xs font-semibold text-slate-500">membros</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Em {summaryMetrics.projectCount} projetos apurados
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. COMMISSIONS GROUPED BY USER (SECTION 4, 5 & 8)                    */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#0C1D36] flex items-center gap-2">
              <HugeiconsIcon icon={UserIcon} className="w-5 h-5 text-[#0075FF]" strokeWidth={1.5} />
              <span>Detalhamento por Funcionário — Mês de {formatMonthName(referenceMonth)}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fechamento de comissões organizado por profissional e comercial responsável.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCommissionsData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Recarregar e Atualizar"
          >
            <HugeiconsIcon icon={RefreshIcon} className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* USER LIST CARDS */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#0075FF] border-t-transparent rounded-full animate-spin" />
            <span>Calculando e sincronizando comissões...</span>
          </div>
        ) : groupedByUser.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Nenhum projeto com profissional ou comercial vinculado no mês de {formatMonthName(referenceMonth)}.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByUser.map((userGroup) => {
              const typesArray = Array.from(userGroup.recipientTypes)
              const typeBadgeText =
                typesArray.length > 1
                  ? 'Profissional & Comercial'
                  : typesArray[0] === 'commercial'
                  ? 'Comercial'
                  : 'Profissional'

              return (
                <div
                  key={userGroup.userId}
                  className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs"
                >
                  {/* USER CARD HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#081D3A] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                        {userGroup.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-[#0C1D36] text-sm flex items-center gap-2">
                          <span>{userGroup.userName}</span>
                          <span className="text-[10px] bg-blue-100 text-[#0075FF] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                            {typeBadgeText}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {userGroup.items.length} {userGroup.items.length === 1 ? 'projeto no cálculo' : 'projetos no cálculo'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* TOTAL TO RECEIVE */}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Total a receber:</span>
                        <div className="text-lg font-black text-emerald-700">
                          {formatMoney(userGroup.totalAmount)}
                        </div>
                      </div>

                      {/* STATUS BADGE & REGISTER BUTTON */}
                      {userGroup.isPaid ? (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-4 h-4 text-emerald-600" />
                          <span>Pago</span>
                        </span>
                      ) : (
                        canRegisterPayment && (
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentUserModal({
                                userId: userGroup.userId,
                                userName: userGroup.userName,
                                amount: userGroup.totalAmount,
                              })
                            }
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4" />
                            <span>Registrar Pagamento</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* USER PROJECTS COMMISSION TABLE */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Projeto & Cliente</th>
                          <th className="p-3">Tipo de Projeto</th>
                          <th className="p-3">Papel</th>
                          <th className="p-3">Valor Base</th>
                          <th className="p-3">Regra Aplicada</th>
                          <th className="p-3">Comissão Calculada</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {userGroup.items.map((comm) => {
                          const hasConfiguredRule = comm.rule_value > 0

                          return (
                            <tr key={comm.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3">
                                <div className="font-extrabold text-[#0C1D36]">{comm.project_title}</div>
                                <div className="text-[11px] text-slate-500">Cliente: {comm.client_name}</div>
                              </td>

                              <td className="p-3">
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                                  {comm.project_type}
                                </span>
                              </td>

                              <td className="p-3">
                                <span
                                  className={cn(
                                    'text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                                    comm.recipient_type === 'commercial'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  )}
                                >
                                  {comm.recipient_type === 'commercial' ? 'Comercial' : 'Profissional'}
                                </span>
                              </td>

                              <td className="p-3 font-semibold text-slate-700">
                                {formatMoney(comm.base_value)}
                              </td>

                              <td className="p-3 font-bold">
                                {hasConfiguredRule ? (
                                  <span className="text-[#0075FF]">
                                    {comm.rule_type === 'percentage' ? `${comm.rule_value}%` : formatMoney(comm.rule_value)}
                                  </span>
                                ) : (
                                  <span className="text-rose-500 italic text-[11px]">
                                    Comissão não configurada
                                  </span>
                                )}
                              </td>

                              <td className="p-3 font-black text-emerald-700 text-xs">
                                {hasConfiguredRule ? formatMoney(comm.calculated_amount) : 'R$ 0,00'}
                              </td>

                              <td className="p-3 text-right">
                                {onOpenProjectDetail && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const p = projects.find((proj) => proj.id === comm.project_id)
                                      if (p) onOpenProjectDetail(p)
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0075FF] hover:text-white font-bold text-slate-600 transition-colors text-[11px]"
                                  >
                                    Ver Projeto
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. RULES CONFIGURATION MODAL (SECTION 10)                           */}
      {/* ------------------------------------------------------------------- */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#0075FF]">
                  Área de Configuração do Administrador
                </span>
                <h3 className="text-lg font-extrabold text-[#0C1D36] mt-0.5">
                  Regras de Comissão por Tipo de Projeto
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configure os percentuais ou valores fixos para comissões comerciais e profissionais.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="text-slate-400 hover:text-[#0C1D36] font-bold p-1 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* RULES CONFIGURATION TABLE */}
            <div className="space-y-4">
              {PROJECT_TYPES_LIST.map((projType) => {
                const profRule = rulesList.find(
                  (r) => r.project_type === projType && r.recipient_type === 'professional'
                )
                const commRule = rulesList.find(
                  (r) => r.project_type === projType && r.recipient_type === 'commercial'
                )

                return (
                  <div key={projType} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-extrabold text-sm text-[#0C1D36]">{projType}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* PROFISSIONAL RULE CARD */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-emerald-800 text-[11px] uppercase">
                            Profissional Executivo
                          </span>
                          <div className="text-slate-600 font-semibold mt-0.5">
                            {profRule && profRule.value > 0
                              ? profRule.calculation_type === 'percentage'
                                ? `${profRule.value}% do valor aprovado`
                                : `R$ ${profRule.value.toFixed(2)} por projeto`
                              : 'Comissão não configurada'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingRule({
                              recipient_type: 'professional',
                              project_type: projType,
                              calculation_type: profRule?.calculation_type || 'percentage',
                              value: profRule?.value || 0,
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-[#0075FF] text-white font-bold text-[11px] hover:bg-[#168CFF]"
                        >
                          Editar
                        </button>
                      </div>

                      {/* COMERCIAL RULE CARD */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-amber-800 text-[11px] uppercase">
                            Comercial Fechamento
                          </span>
                          <div className="text-slate-600 font-semibold mt-0.5">
                            {commRule && commRule.value > 0
                              ? commRule.calculation_type === 'percentage'
                                ? `${commRule.value}% do valor aprovado`
                                : `R$ ${commRule.value.toFixed(2)} por projeto`
                              : 'Comissão não configurada'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingRule({
                              recipient_type: 'commercial',
                              project_type: projType,
                              calculation_type: commRule?.calculation_type || 'percentage',
                              value: commRule?.value || 0,
                            })
                          }
                          className="px-3 py-1 rounded-lg bg-[#0075FF] text-white font-bold text-[11px] hover:bg-[#168CFF]"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* EDIT SINGLE RULE MODAL */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-[#0C1D36]">
              Configurar Regra: {editingRule.recipient_type === 'commercial' ? 'Comercial' : 'Profissional'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Tipo de Projeto: <strong className="text-slate-700">{editingRule.project_type}</strong>
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Tipo de Cálculo</label>
                <select
                  value={editingRule.calculation_type}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      calculation_type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white outline-none"
                >
                  <option value="percentage">Percentual (%) do Valor Aprovado</option>
                  <option value="fixed">Valor Fixo (R$) por Projeto</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {editingRule.calculation_type === 'percentage' ? 'Percentual (%)' : 'Valor Fixo em R$'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingRule.value}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder={editingRule.calculation_type === 'percentage' ? 'Ex: 10' : 'Ex: 500'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveRule}
                disabled={isSavingRule}
                className="px-5 py-2 rounded-xl bg-[#0075FF] text-white font-extrabold text-xs hover:bg-[#168CFF] shadow-sm disabled:opacity-50"
              >
                {isSavingRule ? 'Salvando...' : 'Salvar Regra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER PAYMENT CONFIRMATION MODAL */}
      {paymentUserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600">
                Baixa Mensal de Comissão
              </span>
              <h3 className="text-base font-extrabold text-[#0C1D36] mt-0.5">
                Registrar Pagamento: {paymentUserModal.userName}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mês de Referência: <strong className="text-slate-700">{formatMonthName(referenceMonth)}</strong>
              </p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
              <span className="text-xs font-bold text-emerald-800">Total a ser liquidado:</span>
              <div className="text-xl font-black text-emerald-700">
                {formatMoney(paymentUserModal.amount)}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-bold">Observações / Comprovante Interno (Opcional)</label>
              <textarea
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Ex: Transferência via Pix realizada no dia 05."
                className="w-full p-3 rounded-xl border border-slate-300 font-medium outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setPaymentUserModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleRegisterPayment}
                disabled={isRegisteringPayment}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRegisteringPayment ? 'Registrando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
