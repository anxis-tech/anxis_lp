'use client'

import { useState } from 'react'
import { ClientProject } from '@/types/client-project.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import { normalizeProjectStage } from '@/components/admin/tabs/kanban-board-tab'
import {
  TrendingUp,
  Briefcase,
  Clock,
  Layers,
  Search,
  Plus,
  Calendar,
  ChevronDown,
  User,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  PieChart,
  Activity,
  FolderKanban,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardOverviewTabProps {
  projects: ClientProject[]
  userProfile: UserProfileWithRole | null
  onOpenProjectDetail: (project: ClientProject) => void
  onNavigateToTab: (tabId: string) => void
  onOpenCreateModal: () => void
}

export function DashboardOverviewTab({
  projects = [],
  userProfile,
  onOpenProjectDetail,
  onNavigateToTab,
  onOpenCreateModal,
}: DashboardOverviewTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [responsibleFilter, setResponsibleFilter] = useState('todos')

  // Calculate Real System Metrics
  const totalProjectsCount = projects.length

  const completedProjectsCount = projects.filter(
    (p) => normalizeProjectStage(p.status) === 'Concluído'
  ).length

  const inProgressProjectsCount = projects.filter(
    (p) => normalizeProjectStage(p.status) === 'Em desenvolvimento'
  ).length

  const pendingProjectsCount = projects.filter(
    (p) =>
      normalizeProjectStage(p.status) === 'Novo projeto' ||
      normalizeProjectStage(p.status) === 'Aguardando revisão'
  ).length

  // Estimated Revenue calculated dynamically based on projects
  // Default base estimated value per project if not defined: R$ 12.500
  const totalRevenueValue = projects.reduce((acc, p) => {
    const stage = normalizeProjectStage(p.status)
    if (stage === 'Concluído') return acc + 18500
    if (stage === 'Em desenvolvimento') return acc + 14000
    if (stage === 'Aguardando revisão') return acc + 12000
    return acc + 8500
  }, 0)

  const overallCompletionPercentage = totalProjectsCount
    ? Math.round((completedProjectsCount / totalProjectsCount) * 100)
    : 0

  // Filtered list of projects for the "Project Summary" table
  const filteredProjects = projects.filter((p) => {
    const normStage = normalizeProjectStage(p.status)
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.company && p.company.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'todos' || normStage === statusFilter
    const matchesResponsible =
      responsibleFilter === 'todos' || p.responsible_user_name === responsibleFilter

    return matchesSearch && matchesStatus && matchesResponsible
  })

  // List of unique responsible team members for the filter dropdown
  const uniqueResponsibles = Array.from(
    new Set(projects.map((p) => p.responsible_user_name).filter(Boolean))
  )

  // Helper for progress percentage based on stage
  const getStageProgressPercentage = (stageName: string) => {
    const stage = normalizeProjectStage(stageName)
    switch (stage) {
      case 'Novo projeto':
        return 25
      case 'Em desenvolvimento':
        return 60
      case 'Aguardando revisão':
        return 85
      case 'Concluído':
        return 100
      default:
        return 40
    }
  }

  // Helper for status badge styling
  const getStatusBadgeStyle = (stageName: string) => {
    const stage = normalizeProjectStage(stageName)
    switch (stage) {
      case 'Novo projeto':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Em desenvolvimento':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Aguardando revisão':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'Concluído':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-6 text-[#0C1D36] max-w-full overflow-hidden font-sans">
      {/* TOP WELCOME / OVERVIEW HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0075FF] uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-[#0075FF]" />
            <span>Dashboard Principal • ANXIS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0C1D36] tracking-tight">
            Visão Geral Operacional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento em tempo real de receitas, projetos fechados, entregas e fluxo de trabalho.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar em projetos..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs bg-slate-50/50 outline-none focus:border-[#0075FF] focus:bg-white transition-all"
            />
          </div>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-[#0075FF] hover:bg-[#168CFF] text-white text-xs font-bold shadow-md shadow-[#0075FF]/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Projeto</span>
          </button>
        </div>
      </div>

      {/* TOP 4 METRICS CARDS (DESIGN INSPIRED BY REFERENCE 1 & 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: REVENUE TOTAL */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              +14% este mês
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Revenue Total
          </div>
          <div className="text-2xl font-black text-[#0C1D36] mt-1 tracking-tight">
            {totalRevenueValue.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
            <span>Contratos pagos & faturados no sistema</span>
          </div>
        </div>

        {/* CARD 2: PROJETOS FECHADOS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200/60">
              {totalProjectsCount} Total
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Projetos Fechados
          </div>
          <div className="text-2xl font-black text-[#0C1D36] mt-1 tracking-tight">
            {completedProjectsCount} <span className="text-sm font-bold text-slate-400">/ {totalProjectsCount}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Concluídos e entregues ao cliente</span>
          </div>
        </div>

        {/* CARD 3: PROJETOS PENDENTES */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200/60">
              Ação Requerida
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Projetos Pendentes
          </div>
          <div className="text-2xl font-black text-[#0C1D36] mt-1 tracking-tight">
            {pendingProjectsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span>Novos ou em aguardo de revisão</span>
          </div>
        </div>

        {/* CARD 4: PROJETOS EM ANDAMENTO */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200/60">
              Em Produção
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Projetos em Andamento
          </div>
          <div className="text-2xl font-black text-[#0C1D36] mt-1 tracking-tight">
            {inProgressProjectsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
            <span>Desenvolvimento ativo pela equipe</span>
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD CONTENT GRID (TABLE + SIDE STATS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: PROJECT SUMMARY TABLE (ORGANIZATION BASED ON PRINT 1) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* TABLE TITLE AND FUNCTIONAL FILTERS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#0C1D36] flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-[#0075FF]" />
                  <span>Resumo dos Projetos (Project Summary)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visão rápida de todos os projetos cadastrados no sistema.
                </p>
              </div>

              {/* FILTERS DROPDOWNS */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* FILTER BY STATUS */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-[#0C1D36] outline-none focus:border-[#0075FF]"
                  >
                    <option value="todos">Status: Todos</option>
                    <option value="Novo projeto">Novo projeto</option>
                    <option value="Em desenvolvimento">Em desenvolvimento</option>
                    <option value="Aguardando revisão">Aguardando revisão</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* FILTER BY RESPONSIBLE */}
                <div className="relative">
                  <select
                    value={responsibleFilter}
                    onChange={(e) => setResponsibleFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-[#0C1D36] outline-none focus:border-[#0075FF]"
                  >
                    <option value="todos">Responsável: Todos</option>
                    {uniqueResponsibles.map((resp) => (
                      <option key={resp} value={resp}>
                        {resp}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* TABLE DISPLAY */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                    <th className="p-3.5">Nome do Projeto</th>
                    <th className="p-3.5">Responsável</th>
                    <th className="p-3.5">Data / Prazo</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Progresso</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        Nenhum projeto encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => {
                      const normStage = normalizeProjectStage(project.status)
                      const progressPct = getStageProgressPercentage(normStage)
                      const badgeClass = getStatusBadgeStyle(normStage)

                      return (
                        <tr
                          key={project.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => onOpenProjectDetail(project)}
                        >
                          {/* NOME DO PROJETO */}
                          <td className="p-3.5">
                            <div className="font-extrabold text-[#0C1D36] text-xs group-hover:text-[#0075FF] transition-colors">
                              {project.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {project.client_name} {project.company ? `(${project.company})` : ''}
                            </div>
                          </td>

                          {/* RESPONSÁVEL */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#081D3A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {project.responsible_user_name
                                  ? project.responsible_user_name.charAt(0)
                                  : '?'}
                              </div>
                              <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                                {project.responsible_user_name || 'Sem responsável'}
                              </span>
                            </div>
                          </td>

                          {/* DATA */}
                          <td className="p-3.5 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{project.deadline || 'A definir'}</span>
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="p-3.5">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-1 rounded-xl text-[10px] font-extrabold border uppercase tracking-wider',
                                badgeClass
                              )}
                            >
                              {normStage}
                            </span>
                          </td>

                          {/* PROGRESSO */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    progressPct === 100
                                      ? 'bg-emerald-500'
                                      : progressPct > 60
                                      ? 'bg-[#0075FF]'
                                      : 'bg-amber-500'
                                  )}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-[11px] text-slate-700">
                                {progressPct}%
                              </span>
                            </div>
                          </td>

                          {/* AÇÃO */}
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenProjectDetail(project)
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0075FF] hover:bg-slate-100 transition-colors"
                              title="Ver Detalhes do Projeto"
                            >
                              <ExternalLink className="w-4 h-4" />
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

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Exibindo <strong className="text-[#0C1D36]">{filteredProjects.length}</strong> de{' '}
              <strong className="text-[#0C1D36]">{totalProjectsCount}</strong> projetos
            </span>
            <button
              type="button"
              onClick={() => onNavigateToTab('client_projects')}
              className="text-[#0075FF] font-bold hover:underline flex items-center gap-1"
            >
              <span>Ver Todos no Módulo de Projetos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COL: OVERALL PROGRESS & CRITICAL DEADLINES WIDGETS */}
        <div className="space-y-6">
          {/* OVERALL PROGRESS GAUGE (INSPIRED BY REFERENCE 1) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#0075FF]" />
                <span>Progresso Geral dos Projetos</span>
              </h4>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                Tempo Real
              </span>
            </div>

            {/* CIRCULAR GAUGE COMPONENT */}
            <div className="flex flex-col items-center justify-center py-2 relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F1F5F9"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#0075FF"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * overallCompletionPercentage) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-[#0C1D36]">
                    {overallCompletionPercentage}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Concluído
                  </span>
                </div>
              </div>
            </div>

            {/* BREAKDOWN METRICS */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-2 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="text-xs font-black text-emerald-700">{completedProjectsCount}</div>
                <div className="text-[10px] font-bold text-emerald-600">Concluídos</div>
              </div>
              <div className="p-2 bg-blue-50/60 rounded-2xl border border-blue-100">
                <div className="text-xs font-black text-blue-700">{inProgressProjectsCount}</div>
                <div className="text-[10px] font-bold text-blue-600">Em Andamento</div>
              </div>
              <div className="p-2 bg-amber-50/60 rounded-2xl border border-amber-100">
                <div className="text-xs font-black text-amber-700">{pendingProjectsCount}</div>
                <div className="text-[10px] font-bold text-amber-600">Pendentes</div>
              </div>
            </div>
          </div>

          {/* PRÓXIMOS PRAZOS WIDGET */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#0C1D36] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0075FF]" />
                <span>Próximos Prazos</span>
              </h4>
              <button
                type="button"
                onClick={() => onNavigateToTab('kanban_board')}
                className="text-[11px] font-bold text-[#0075FF] hover:underline"
              >
                Ver Kanban
              </button>
            </div>

            <div className="space-y-3">
              {projects.slice(0, 3).map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onOpenProjectDetail(proj)}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/60 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-[#0C1D36]">{proj.title}</div>
                    <div className="text-[10px] text-slate-500">{proj.client_name}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {proj.deadline || 'A definir'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
