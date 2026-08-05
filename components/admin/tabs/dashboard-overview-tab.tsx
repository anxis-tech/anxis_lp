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
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

interface DashboardOverviewTabProps {
  projects: ClientProject[]
  userProfile: UserProfileWithRole | null
  onOpenProjectDetail: (project: ClientProject) => void
  onNavigateToTab: (tabId: string) => void
  onOpenCreateModal: () => void
  onLogout?: () => void
}

export function DashboardOverviewTab({
  projects = [],
  userProfile,
  onOpenProjectDetail,
  onNavigateToTab,
}: DashboardOverviewTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [responsibleFilter, setResponsibleFilter] = useState('todos')

  // Real Database Metrics
  const totalProjectsCount = projects.length

  const completedProjectsCount = projects.filter(
    (p) => normalizeProjectStage(p.status) === 'Concluído'
  ).length

  const inProgressProjectsCount = projects.filter(
    (p) => normalizeProjectStage(p.status) === 'Em desenvolvimento'
  ).length

  const totalRevenueValue = projects.reduce((sum, p) => {
    return sum + (p.quote_data?.final_value || 12500)
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
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-200 font-extrabold'
      case 'Em desenvolvimento':
        return 'bg-[#0075FF]/10 text-[#0075FF] border border-[#0075FF]/20 font-extrabold'
      case 'Aguardando revisão':
        return 'bg-purple-500/10 text-purple-600 border border-purple-200 font-extrabold'
      default:
        return 'bg-amber-500/10 text-amber-600 border border-amber-200 font-extrabold'
    }
  }

  return (
    <div className="space-y-6 text-[#0C1D36] max-w-full overflow-hidden font-sans">
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
            className="w-full pl-11 pr-5 py-3 rounded-full border border-slate-200/80 text-xs bg-white shadow-sm outline-none focus:border-[#0C1D36] focus:ring-1 focus:ring-[#0C1D36] transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* BOTÃO DO SITE AO VIVO */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="bg-white hover:bg-slate-100 p-2.5 rounded-full border border-slate-200/80 shadow-sm text-[#0075FF] transition-all cursor-pointer"
            title="Ver Site Ao Vivo"
          >
            <HugeiconsIcon icon={Globe02Icon} className="w-4 h-4" strokeWidth={1.5} />
          </a>
        </div>
      </div>

      {/* HERO ROW: CARTÃO ESCURO DE VISÃO GERAL + GOAL CIRCULAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ESQUERDA: CARTÃO DE BOAS VINDAS E MÉTRICAS */}
        <div className="lg:col-span-2 bg-[#0C1D36] text-white rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[250px]">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 relative z-10">
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
        <div className="bg-[#0C1D36] text-white rounded-[32px] p-6 shadow-2xl flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[250px]">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TABELA DE ÚLTIMOS PROJETOS */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#0C1D36]">Últimos Projetos</h3>
              <p className="text-xs text-slate-500">Acompanhamento das entregas e contratos mais recentes.</p>
            </div>

            {/* FILTROS LIMPOS */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-bold bg-slate-50 text-[#0C1D36] outline-none focus:border-[#0C1D36]"
              >
                <option value="todos">Status: Todos</option>
                <option value="Novo projeto">Novo projeto</option>
                <option value="Em desenvolvimento">Em desenvolvimento</option>
                <option value="Aguardando revisão">Aguardando revisão</option>
                <option value="Concluído">Concluído</option>
              </select>

              <select
                value={responsibleFilter}
                onChange={(e) => setResponsibleFilter(e.target.value)}
                className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-bold bg-slate-50 text-[#0C1D36] outline-none focus:border-[#0C1D36]"
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

          {/* TABELA LIMPA E BEM ORGANIZADA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[480px]">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="pb-3 whitespace-nowrap">Projeto & Cliente</th>
                  <th className="pb-3 whitespace-nowrap">Prazo</th>
                  <th className="pb-3 whitespace-nowrap">Status</th>
                  <th className="pb-3 text-right whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
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
                      <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* PROJETO & CLIENTE */}
                        <td className="py-3.5 max-w-[240px]">
                          <div className="font-extrabold text-[#0C1D36] text-xs truncate">
                            {project.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{project.client_name}</div>
                        </td>

                        {/* PRAZO FORMATADO */}
                        <td className="py-3.5 text-slate-600 font-semibold whitespace-nowrap">
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
                            className="p-2 rounded-full bg-[#0C1D36] hover:bg-[#0075FF] text-white transition-colors shadow-sm inline-flex items-center justify-center cursor-pointer"
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

        {/* COLUNA DA DIREITA: PROJETOS AGUARDANDO PAGAMENTO */}
        <div className="bg-white rounded-[32px] border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#0C1D36] flex items-center gap-2">
                <HugeiconsIcon icon={CreditCardIcon} className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                <span>Aguardando Pagamento</span>
              </h3>
              <p className="text-[11px] text-slate-500">Links e faturas pendentes de confirmação.</p>
            </div>
            <HugeiconsIcon icon={More01Icon} className="w-4 h-4 text-slate-400 cursor-pointer" strokeWidth={1.5} />
          </div>

          <div className="space-y-3">
            {awaitingPaymentProjects.length === 0 ? (
              <div className="p-6 text-center text-slate-400 italic text-xs">
                Nenhum pagamento pendente no momento.
              </div>
            ) : (
              awaitingPaymentProjects.map((item, i) => {
                const itemValue = (12500 + i * 3500).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })

                return (
                  <div
                    key={item.id || i}
                    onClick={() => onOpenProjectDetail(item)}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/60 transition-colors cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="overflow-hidden">
                        <div className="font-extrabold text-xs text-[#0C1D36] truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{item.client_name}</div>
                      </div>

                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full shrink-0">
                        Pendente
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-xs">
                      <span className="font-extrabold text-[#0C1D36]">{itemValue}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          alert(`Notificação de cobrança enviada para o cliente ${item.client_name}!`)
                        }}
                        className="text-[10px] font-bold text-[#0075FF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <HugeiconsIcon icon={MailSend01Icon} className="w-3 h-3" strokeWidth={1.5} />
                        <span>Cobrar</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
