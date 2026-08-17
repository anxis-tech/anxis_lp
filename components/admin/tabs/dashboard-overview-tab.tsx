'use client'

import { useState } from 'react'
import { ClientProject } from '@/types/client-project.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import { normalizeProjectStage, formatDateBR } from '@/components/admin/tabs/kanban-board-tab'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Search01Icon,
  Globe02Icon,
  Dollar01Icon,
  EyeIcon,
  More01Icon,
  CreditCardIcon,
  MailSend01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

interface DashboardOverviewTabProps {
  projects: ClientProject[]
  userProfile: UserProfileWithRole | null
  onOpenProjectDetail: (project: ClientProject) => void
  onNavigateToTab: (tabId: string) => void
  onOpenCreateModal: () => void
  onLogout?: () => void
  isDarkMode?: boolean
}

export function DashboardOverviewTab({
  projects = [],
  userProfile,
  onOpenProjectDetail,
  onNavigateToTab,
  isDarkMode = false,
}: DashboardOverviewTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [responsibleFilter, setResponsibleFilter] = useState('todos')

  // Real Database & Confirmed Payments Metrics
  const totalProjectsCount = projects.length

  const paidProjects = projects.filter((p) => p.payment_status === 'Pago')
  const pendingPaymentProjects = projects.filter((p) => p.payment_status === 'Pendente')

  const completedProjectsCount = projects.filter(
    (p) => normalizeProjectStage(p.status) === 'Concluído'
  ).length

  const inProgressProjectsCount = projects.filter(
    (p) => normalizeProjectStage(p.status) === 'Em desenvolvimento'
  ).length

  // Revenue total: Sum strictly confirmed paid_value (0 if unconfirmed)
  const totalRevenueValue = paidProjects.reduce((sum, p) => {
    return sum + (p.paid_value || 0)
  }, 0)

  const overallCompletionPercentage =
    totalProjectsCount > 0
      ? Math.round((completedProjectsCount / totalProjectsCount) * 100)
      : 0

  // Filtered List
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'todos' || normalizeProjectStage(p.status) === statusFilter
    const matchesResponsible =
      responsibleFilter === 'todos' || p.responsible_user_name === responsibleFilter
    return matchesSearch && matchesStatus && matchesResponsible
  })

  // Filtered Awaiting Payment list
  const awaitingPaymentProjects = projects.filter((p) => {
    const stage = normalizeProjectStage(p.status)
    return stage === 'Novo projeto' || stage === 'Aguardando revisão'
  })

  // List of unique responsible team members for the filter dropdown
  const uniqueResponsibles = Array.from(
    new Set(projects.map((p) => p.responsible_user_name).filter(Boolean))
  )

  const getStatusPillStyle = (stage: string) => {
    switch (stage) {
      case 'Concluído':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-extrabold'
      case 'Em desenvolvimento':
        return 'bg-[#0075FF]/10 text-[#0075FF] border border-[#0075FF]/20 font-extrabold'
      case 'Aguardando revisão':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20 font-extrabold'
      default:
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20 font-extrabold'
    }
  }

  return (
    <div className={cn('space-y-4 max-w-full overflow-hidden font-sans', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>
      {/* TOP HEADER ROW: BUSCA + LINK SITE AO VIVO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* CAMPOS DE BUSCA ARREDONDADO */}
        <div className="relative w-full sm:w-96">
          <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar projetos ou clientes..."
            className={cn(
              'w-full pl-11 pr-5 py-3 rounded-full text-xs shadow-sm outline-none transition-all placeholder:text-slate-400 font-medium border',
              isDarkMode
                ? 'bg-[#181B22] border-slate-800 text-white focus:border-[#00C4D4]'
                : 'bg-white border-slate-200/80 text-[#0C1D36] focus:border-[#0C1D36]'
            )}
          />
        </div>

        {/* BOTÃO DO SITE AO VIVO */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={cn(
              'p-2.5 rounded-full border shadow-sm transition-all cursor-pointer',
              isDarkMode
                ? 'bg-[#181B22] border-slate-800 text-[#00C4D4] hover:bg-slate-800'
                : 'bg-white border-slate-200/80 text-[#0075FF] hover:bg-slate-100'
            )}
            title="Ver Site Ao Vivo"
          >
            <HugeiconsIcon icon={Globe02Icon} className="w-4 h-4" strokeWidth={1.5} />
          </a>
        </div>
      </div>

      {/* HERO ROW: CARTÃO ESCURO DE VISÃO GERAL + GOAL CIRCULAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ESQUERDA: CARTÃO DE BOAS VINDAS E MÉTRICAS */}
        <div className="lg:col-span-2 bg-[#0C1D36] text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          {/* EFEITO VISUAL DE FUNDO */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* TÍTULO PRINCIPAL */}
          <div className="relative z-10 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
              Visão Geral
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Olá, {userProfile?.full_name || 'Administrador'}</span>
              <span className="animate-bounce">👋</span>
            </h2>
          </div>

          {/* 2 CARDS INTERNOS DE RECEITA E PROJETOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 relative z-10">
            {/* CARD INTERNO 1: RECEITA TOTAL */}
            <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 text-white flex items-center gap-4 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                <HugeiconsIcon icon={Dollar01Icon} className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-300 tracking-wider truncate">
                  Receita Total
                </div>
                <div className="text-xl font-black tracking-tight text-white mt-0.5 whitespace-nowrap">
                  {totalRevenueValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">Faturado no mês</div>
              </div>
            </div>

            {/* CARD INTERNO 2: PROJETOS EM ANDAMENTO */}
            <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 text-white flex items-center gap-4 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                <HugeiconsIcon icon={EyeIcon} className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-300 tracking-wider truncate">
                  Projetos em Andamento
                </div>
                <div className="text-xl font-black tracking-tight text-white mt-0.5 whitespace-nowrap">
                  {inProgressProjectsCount} <span className="text-xs text-slate-300 font-bold">Projetos</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">Em desenvolvimento</div>
              </div>
            </div>
          </div>
        </div>

        {/* DIREITA: META E PROGRESSO DE ENTREGAS */}
        <div className="bg-[#0C1D36] text-white rounded-[32px] p-6 shadow-xl flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[240px]">
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-slate-300">
              Progresso de Entregas
            </span>
            <HugeiconsIcon icon={More01Icon} className="w-4 h-4 text-slate-400 cursor-pointer" strokeWidth={1.5} />
          </div>

          {/* CÍRCULO DE PROGRESSO */}
          <div className="relative w-32 h-32 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="#0075FF"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="238.7"
                strokeDashoffset={238.7 - (238.7 * overallCompletionPercentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{overallCompletionPercentage}%</span>
            </div>
          </div>

          {/* BOTÃO E SUBTÍTULO */}
          <div className="w-full space-y-2">
            <div className="text-xs font-bold text-slate-300 truncate">
              {completedProjectsCount} de {totalProjectsCount} projetos concluídos
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab('client_projects')}
              className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-100 text-[#0C1D36] font-extrabold text-xs transition-all shadow-lg truncate cursor-pointer"
            >
              Ver Todos os Projetos
            </button>
          </div>
        </div>
      </div>

      {/* LOWER ROW: TABELA DE ÚLTIMOS PROJETOS + SESSÃO "PROJETOS AGUARDANDO PAGAMENTO" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* TABELA DE ÚLTIMOS PROJETOS */}
        <div
          className={cn(
            'lg:col-span-2 rounded-[32px] border p-6 shadow-sm space-y-4',
            isDarkMode ? 'bg-[#16181D] border-slate-800' : 'bg-white border-slate-200/80'
          )}
        >
          <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4', isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
            <div>
              <h3 className={cn('text-base font-extrabold', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>Últimos Projetos</h3>
              <p className="text-xs text-slate-400">Acompanhamento das entregas e contratos mais recentes.</p>
            </div>

            {/* FILTROS LIMPOS COM ESPAÇAMENTO CONFORTÁVEL DAS BORDAS */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={cn(
                    'pl-4 pr-9 py-2 rounded-full border text-xs font-extrabold appearance-none outline-none cursor-pointer transition-all shadow-sm',
                    isDarkMode
                      ? 'bg-[#1C202B] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-[#0C1D36]'
                  )}
                >
                  <option value="todos">Status: Todos</option>
                  <option value="Novo projeto">Novo projeto</option>
                  <option value="Em desenvolvimento">Em desenvolvimento</option>
                  <option value="Aguardando revisão">Aguardando revisão</option>
                  <option value="Concluído">Concluído</option>
                </select>
                <HugeiconsIcon icon={ArrowDown01Icon} className={cn('w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none', isDarkMode ? 'text-white' : 'text-[#0C1D36]')} strokeWidth={1.5} />
              </div>

              <div className="relative">
                <select
                  value={responsibleFilter}
                  onChange={(e) => setResponsibleFilter(e.target.value)}
                  className={cn(
                    'pl-4 pr-9 py-2 rounded-full border text-xs font-extrabold appearance-none outline-none cursor-pointer transition-all shadow-sm',
                    isDarkMode
                      ? 'bg-[#1C202B] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-[#0C1D36]'
                  )}
                >
                  <option value="todos">Responsável: Todos</option>
                  {uniqueResponsibles.map((resp) => (
                    <option key={resp} value={resp}>
                      {resp}
                    </option>
                  ))}
                </select>
                <HugeiconsIcon icon={ArrowDown01Icon} className={cn('w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none', isDarkMode ? 'text-white' : 'text-[#0C1D36]')} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* TABELA LIMPA E BEM ORGANIZADA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[480px]">
              <thead>
                <tr className={cn('font-bold uppercase tracking-wider text-[10px] border-b', isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-400 border-slate-100')}>
                  <th className="pb-3 whitespace-nowrap">Projeto & Cliente</th>
                  <th className="pb-3 whitespace-nowrap">Prazo</th>
                  <th className="pb-3 whitespace-nowrap">Status</th>
                  <th className="pb-3 text-right whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className={cn('divide-y font-medium', isDarkMode ? 'divide-slate-800/80' : 'divide-slate-100')}>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                      Nenhum projeto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const normStage = normalizeProjectStage(project.status)
                    const pillClass = getStatusPillStyle(normStage)

                    return (
                      <tr key={project.id} className={cn('transition-colors', isDarkMode ? 'hover:bg-[#202530]' : 'hover:bg-slate-50/80')}>
                        {/* PROJETO & CLIENTE */}
                        <td className="py-3.5 max-w-[240px]">
                          <div className={cn('font-extrabold text-xs truncate', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>
                            {project.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{project.client_name}</div>
                        </td>

                        {/* PRAZO FORMATADO */}
                        <td className={cn('py-3.5 font-semibold whitespace-nowrap', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                          {formatDateBR(project.deadline)}
                        </td>

                        {/* STATUS */}
                        <td className="py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-wider',
                              pillClass
                            )}
                          >
                            {normStage}
                          </span>
                        </td>

                        {/* AÇÃO */}
                        <td className="py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onOpenProjectDetail(project)}
                            className="p-2 rounded-full bg-[#0075FF] hover:bg-blue-600 text-white transition-colors shadow-sm inline-flex items-center justify-center cursor-pointer"
                            title="Ver Detalhes do Projeto"
                          >
                            <HugeiconsIcon icon={EyeIcon} className="w-3.5 h-3.5" strokeWidth={1.5} />
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

        {/* DIREITA: PROJETOS AGUARDANDO PAGAMENTO */}
        <div
          className={cn(
            'rounded-[32px] border p-6 shadow-sm flex flex-col justify-between space-y-4',
            isDarkMode ? 'bg-[#16181D] border-slate-800' : 'bg-white border-slate-200/80'
          )}
        >
          <div className={cn('flex items-center justify-between border-b pb-4', isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
            <div>
              <h3 className={cn('text-base font-extrabold', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>Aguardando Ajuste/Aprovação</h3>
              <p className="text-xs text-slate-400">Projetos que necessitam de ação comercial ou revisão.</p>
            </div>
            <HugeiconsIcon icon={CreditCardIcon} className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
          </div>

          {/* LISTA DE CARDS DE COBRANÇA */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {awaitingPaymentProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Nenhum projeto pendente no momento.
              </div>
            ) : (
              awaitingPaymentProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onOpenProjectDetail(proj)}
                  className={cn(
                    'p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group',
                    isDarkMode
                      ? 'bg-[#1C202B] border-slate-800 hover:border-[#00C4D4]'
                      : 'bg-slate-50 border-slate-100 hover:border-[#0075FF]'
                  )}
                >
                  <div className="overflow-hidden pr-2 space-y-0.5">
                    <div className={cn('font-bold text-xs group-hover:text-[#00C4D4] transition-colors truncate', isDarkMode ? 'text-white' : 'text-[#0C1D36]')}>
                      {proj.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{proj.client_name}</div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                    Avisar
                  </span>
                </div>
              ))
            )}
          </div>

          {/* BOTÃO DISPARAR COBRANÇA DE LEMBRETE */}
          <button
            type="button"
            onClick={() => onNavigateToTab('finance_overview')}
            className="w-full py-3 px-4 rounded-2xl bg-[#0075FF] hover:bg-blue-600 text-white font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={MailSend01Icon} className="w-4 h-4" strokeWidth={1.5} />
            <span>Gerenciar Cobranças Financeiras</span>
          </button>
        </div>
      </div>
    </div>
  )
}
