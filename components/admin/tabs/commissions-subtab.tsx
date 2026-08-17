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
  isDarkMode?: boolean
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
  isDarkMode = false,
}: CommissionsSubtabProps) {
  // Reference month for calculations
  const [referenceMonth, setReferenceMonth] = useState<string>(getPreviousMonthString())

  // Database Data States
  const [rulesList, setRulesList] = useState<CommissionRule[]>([])
  const [commissionsList, setCommissionsList] = useState<CommissionRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
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

  // MONTHLY SUMMARY METRICS
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

  // COMMISSIONS GROUPED BY USER
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

  const handleSaveRule = async () => {
    if (!editingRule) return
    setIsSavingRule(true)
    const res = await upsertCommissionRuleAction(editingRule)
    setIsSavingRule(false)

    if (res.success) {
      setEditingRule(null)
      loadCommissionsData()
    } else {
      alert(`Erro ao salvar regra: ${res.message}`)
    }
  }

  const handleConfirmRegisterPayment = async () => {
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
    <div className={cn('space-y-8 font-sans transition-colors', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>
      {/* 1. MODULE HEADER & REFERENCE MONTH SELECTOR */}
      <div
        className={cn(
          'rounded-3xl border p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6',
          isDarkMode ? 'bg-[#16181D] border-slate-800' : 'bg-white border-slate-200/80'
        )}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0075FF]/10 text-[#0075FF] flex items-center justify-center font-bold">
              <HugeiconsIcon icon={PieChartIcon} className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className={cn('text-xl font-extrabold', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>Módulo de Comissões</h2>
              <p className="text-xs text-slate-400 font-medium">
                Acompanhamento e fechamento mensal de comissões de comerciais e profissionais da ANXIS.
              </p>
            </div>
          </div>
        </div>

        {/* MONTH SELECTOR & RULE CONFIG BUTTON */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className={cn('flex items-center gap-2 p-2 rounded-2xl border', isDarkMode ? 'bg-[#1A1E26] border-slate-800' : 'bg-slate-50 border-slate-200')}>
            <HugeiconsIcon icon={Calendar01Icon} className="w-4 h-4 text-slate-400 ml-1" strokeWidth={1.5} />
            <span className="text-xs font-bold text-slate-400">Mês de Referência:</span>
            <select
              value={referenceMonth}
              onChange={(e) => setReferenceMonth(e.target.value)}
              className={cn(
                'px-3 py-1.5 rounded-xl border font-extrabold text-xs outline-none cursor-pointer text-[#0075FF]',
                isDarkMode ? 'bg-[#202530] border-slate-700 text-[#00C4D4]' : 'bg-white border-slate-300'
              )}
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
              className={cn(
                'px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer border',
                isDarkMode
                  ? 'bg-[#1A1E26] text-white border-slate-800 hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              )}
            >
              <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4 text-[#0075FF]" strokeWidth={1.5} />
              <span>Configurar Regras</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MONTHLY SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: TOTAL DE COMISSÕES */}
        <div className={cn('rounded-3xl p-6 border shadow-sm relative overflow-hidden', isDarkMode ? 'bg-[#16181D] border-blue-500/20' : 'bg-white border-blue-200/80')}>
          <div className="flex items-center justify-between text-[#0075FF] mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total de Comissões</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <HugeiconsIcon icon={Dollar01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className={cn('text-2xl font-black tracking-tight', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>
            {formatMoney(summaryMetrics.totalCommissions)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Valor apurado para {formatMonthName(referenceMonth)}
          </div>
        </div>

        {/* CARD 2: TOTAL PROFISSIONAIS */}
        <div className={cn('rounded-3xl p-6 border shadow-sm relative overflow-hidden', isDarkMode ? 'bg-[#16181D] border-emerald-500/20' : 'bg-white border-emerald-200/80')}>
          <div className="flex items-center justify-between text-emerald-500 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Para Profissionais</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <HugeiconsIcon icon={Briefcase01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-500 tracking-tight">
            {formatMoney(summaryMetrics.totalProfessional)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Designers & Desenvolvedores executores
          </div>
        </div>

        {/* CARD 3: TOTAL COMERCIAL */}
        <div className={cn('rounded-3xl p-6 border shadow-sm relative overflow-hidden', isDarkMode ? 'bg-[#16181D] border-amber-500/20' : 'bg-white border-amber-200/80')}>
          <div className="flex items-center justify-between text-amber-500 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Para Comercial</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <HugeiconsIcon icon={UserIcon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500 tracking-tight">
            {formatMoney(summaryMetrics.totalCommercial)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Fechamento comercial de contratos
          </div>
        </div>

        {/* CARD 4: PROJETOS E FUNCIONÁRIOS */}
        <div className={cn('rounded-3xl p-6 border shadow-sm relative overflow-hidden', isDarkMode ? 'bg-[#16181D] border-purple-500/20' : 'bg-white border-purple-200/80')}>
          <div className="flex items-center justify-between text-purple-500 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider">Funcionários & Projetos</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <HugeiconsIcon icon={Invoice01Icon} className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
          <div className={cn('text-2xl font-black tracking-tight', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>
            {summaryMetrics.userCount} <span className="text-xs font-semibold text-slate-400">membros</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Em {summaryMetrics.projectCount} projetos apurados
          </div>
        </div>
      </div>

      {/* 3. COMMISSIONS GROUPED BY USER */}
      <div className={cn('rounded-3xl border p-6 shadow-sm space-y-6', isDarkMode ? 'bg-[#16181D] border-slate-800' : 'bg-white border-slate-200/80')}>
        <div className={cn('flex items-center justify-between border-b pb-4', isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
          <div>
            <h3 className={cn('text-base font-extrabold flex items-center gap-2', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>
              <HugeiconsIcon icon={UserIcon} className="w-5 h-5 text-[#0075FF]" strokeWidth={1.5} />
              <span>Detalhamento por Funcionário — Mês de {formatMonthName(referenceMonth)}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Fechamento de comissões organizado por profissional e comercial responsável.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCommissionsData}
            className={cn('p-2 rounded-xl border transition-colors cursor-pointer', isDarkMode ? 'bg-[#1A1E26] border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')}
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
          <div className={cn('p-12 text-center font-medium text-xs rounded-2xl border border-dashed', isDarkMode ? 'bg-[#181B22] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-400')}>
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
                  className={cn('border rounded-3xl p-5 space-y-4 shadow-xs', isDarkMode ? 'bg-[#181B22] border-slate-800' : 'bg-slate-50/70 border-slate-200')}
                >
                  {/* USER CARD HEADER */}
                  <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4', isDarkMode ? 'border-slate-800' : 'border-slate-200/80')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#0075FF] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                        {userGroup.userName.charAt(0)}
                      </div>
                      <div>
                        <div className={cn('font-extrabold text-sm flex items-center gap-2', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>
                          <span>{userGroup.userName}</span>
                          <span className="text-[10px] bg-blue-500/10 text-[#0075FF] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-500/20">
                            {typeBadgeText}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                          {userGroup.items.length} {userGroup.items.length === 1 ? 'projeto no cálculo' : 'projetos no cálculo'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* TOTAL TO RECEIVE */}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total a receber:</span>
                        <div className="text-lg font-black text-emerald-500">
                          {formatMoney(userGroup.totalAmount)}
                        </div>
                      </div>

                      {/* STATUS BADGE & REGISTER BUTTON */}
                      {userGroup.isPaid ? (
                        <span className="text-xs bg-emerald-500/10 text-emerald-500 font-extrabold px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-4 h-4 text-emerald-500" />
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
                  <div className={cn('overflow-x-auto border rounded-2xl', isDarkMode ? 'border-slate-800 bg-[#202530]' : 'border-slate-200 bg-white')}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={cn('border-b font-bold uppercase tracking-wider text-[10px]', isDarkMode ? 'bg-[#13161C] text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200')}>
                          <th className="p-3">Projeto & Cliente</th>
                          <th className="p-3">Tipo de Projeto</th>
                          <th className="p-3">Papel</th>
                          <th className="p-3">Valor Base</th>
                          <th className="p-3">Regra Aplicada</th>
                          <th className="p-3">Comissão Calculada</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className={cn('divide-y font-medium', isDarkMode ? 'divide-slate-800' : 'divide-slate-100')}>
                        {userGroup.items.map((comm) => {
                          const hasConfiguredRule = comm.rule_value > 0

                          return (
                            <tr key={comm.id} className={cn('transition-colors', isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50')}>
                              <td className="p-3">
                                <div className={cn('font-extrabold', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>{comm.project_title}</div>
                                <div className="text-[11px] text-slate-400">Cliente: {comm.client_name}</div>
                              </td>

                              <td className="p-3">
                                <span className={cn('text-[10px] px-2 py-0.5 rounded font-semibold border', isDarkMode ? 'bg-[#181B22] text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200')}>
                                  {comm.project_type}
                                </span>
                              </td>

                              <td className="p-3">
                                <span
                                  className={cn(
                                    'text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                                    comm.recipient_type === 'commercial'
                                      ? 'bg-amber-500/10 text-amber-500'
                                      : 'bg-emerald-500/10 text-emerald-500'
                                  )}
                                >
                                  {comm.recipient_type === 'commercial' ? 'Comercial' : 'Profissional'}
                                </span>
                              </td>

                              <td className={cn('p-3 font-semibold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
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

                              <td className="p-3 font-black text-emerald-500 text-xs">
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
                                    className={cn(
                                      'px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer border',
                                      isDarkMode
                                        ? 'bg-[#181B22] border-slate-700 text-slate-300 hover:bg-[#0075FF] hover:text-white'
                                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-[#0075FF] hover:text-white'
                                    )}
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
    </div>
  )
}
