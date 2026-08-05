'use client'

import { useState } from 'react'
import { ClientProject } from '@/types/client-project.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import { normalizeProjectStage, formatDateBR } from '@/components/admin/tabs/kanban-board-tab'
import { Icon } from '@/components/ui/icon'
import { SearchActionIcon, ViewActionIcon } from '@/lib/icons/actions'
import {
  TrendUpIcon,
  MetricProjectsIcon,
  MetricRevenueIcon,
  MetricPendingIcon,
  MetricTaskIcon,
} from '@/lib/icons/dashboard'
import {
  SuccessStatusIcon,
  PendingStatusIcon,
  WarningStatusIcon,
} from '@/lib/icons/status'
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

  // Calculate metrics dynamically from Supabase projects
  const totalActiveProjects = projects.filter((p) => p.status !== 'Concluído').length
  const totalRevenue = projects.reduce((acc, p) => acc + (p.approved_value || 0), 0)
  const paidCount = projects.filter((p) => p.payment_status === 'Pago' || p.payment_status === 'Sinal Pago').length
  const pendingCount = projects.filter((p) => p.status === 'Novo projeto' || p.status === 'Aguardando revisão').length

  // Filtered project list for dashboard active table
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter
    const matchesResp = responsibleFilter === 'todos' || p.responsible_user_name === responsibleFilter
    return matchesSearch && matchesStatus && matchesResp
  })

  // Pending approval tasks
  const pendingApprovalProjects = projects.filter((p) => {
    const stage = normalizeProjectStage(p.status)
    return stage === 'Novo projeto' || stage === 'Aguardando revisão'
  })

  return (
    <div className="space-y-6 font-sans text-[#0C1D36]">
      {/* TOP HEADER / WELCOME BANNER */}
      <div className="bg-[#081D3A] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0075FF]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0075FF]/20 text-[#168CFF] text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#168CFF] animate-pulse" />
            <span>PAINEL DE CONTROLE ANXIS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Olá, {userProfile?.full_name || 'Usuário'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Bem-vindo ao seu painel administrativo. Acompanhe a evolução dos projetos, receitas e tarefas pendentes em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToTab('client_projects')}
            className="px-5 py-3 rounded-2xl bg-[#0075FF] text-white font-extrabold text-xs hover:bg-[#168CFF] shadow-lg transition-all flex items-center gap-2"
          >
            <span>Ver Todos os Projetos</span>
            <Icon icon={TrendUpIcon} size={16} />
          </button>
        </div>
      </div>

      {/* METRICS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: PROJETOS ATIVOS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projetos Ativos</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0075FF] flex items-center justify-center">
              <Icon icon={MetricProjectsIcon} size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#0C1D36]">{totalActiveProjects}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <Icon icon={TrendUpIcon} size={14} className="text-emerald-500" />
              <span>Em andamento no sistema</span>
            </div>
          </div>
        </div>

        {/* CARD 2: FATURAMENTO BRUTO */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faturamento Total</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icon icon={MetricRevenueIcon} size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#0C1D36]">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <Icon icon={SuccessStatusIcon} size={14} className="text-emerald-500" />
              <span>{paidCount} pagamentos confirmados</span>
            </div>
          </div>
        </div>

        {/* CARD 3: TAREFAS PENDENTES */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revisões Pendentes</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Icon icon={MetricPendingIcon} size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#0C1D36]">{pendingCount}</div>
            <div className="text-[11px] text-amber-600 font-bold mt-1 flex items-center gap-1">
              <Icon icon={PendingStatusIcon} size={14} />
              <span>Requerem atenção ou aprovação</span>
            </div>
          </div>
        </div>

        {/* CARD 4: TOTAL DE PROJETOS NO BANCO */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Registros</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Icon icon={MetricTaskIcon} size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#0C1D36]">{projects.length}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Projetos cadastrados no banco
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD SPLIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN COLUMN (2 COLS): ACTIVE PROJECTS TABLE */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0C1D36]">Visão Geral dos Projetos</h2>
              <p className="text-xs text-slate-500">Últimas atualizações e status de entrega da equipe</p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <Icon icon={SearchActionIcon} size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar projeto ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#0075FF] outline-none transition-colors"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px] text-slate-500">
                  <th className="p-3">Projeto / Cliente</th>
                  <th className="p-3">Estágio</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Prazo</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Nenhum projeto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.slice(0, 6).map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-[#0C1D36] text-xs">{project.title}</div>
                        <div className="text-[11px] text-slate-400">{project.client_name}</div>
                      </td>

                      <td className="p-3">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider',
                            project.status === 'Concluído'
                              ? 'bg-emerald-100 text-emerald-800'
                              : project.status === 'Aguardando revisão'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          )}
                        >
                          {project.status}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600 font-semibold">
                        {project.responsible_user_name || 'Não atribuído'}
                      </td>

                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {formatDateBR(project.deadline)}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenProjectDetail(project)}
                          className="p-1.5 rounded-lg bg-slate-100 text-[#0075FF] hover:bg-[#0075FF] hover:text-white transition-colors"
                          title="Ver Detalhes do Projeto"
                        >
                          <Icon icon={ViewActionIcon} size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDE COLUMN (1 COL): PENDING ACTION CARDS */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-[#0C1D36] flex items-center gap-2">
              <Icon icon={WarningStatusIcon} size={18} className="text-amber-500" />
              <span>Ações Necessárias</span>
            </h2>
            <p className="text-xs text-slate-500">Itens que exigem acompanhamento ou aprovação</p>
          </div>

          <div className="space-y-3">
            {pendingApprovalProjects.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Tudo em dia! Nenhuma pendência urgente.
              </div>
            ) : (
              pendingApprovalProjects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-[#0075FF] transition-all cursor-pointer"
                  onClick={() => onOpenProjectDetail(p)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#0C1D36] text-xs">{p.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Cliente: {p.client_name}</span>
                    <span className="text-slate-400 font-mono">{formatDateBR(p.deadline)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
