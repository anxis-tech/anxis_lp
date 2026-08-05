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
  DollarSign,
  Eye,
  MoreHorizontal,
  Bell,
  Globe,
  LogOut,
} from 'lucide-react'
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
  onOpenCreateModal,
  onLogout,
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
  const totalRevenueValue = projects.reduce((acc, p) => {
    const stage = normalizeProjectStage(p.status)
    if (stage === 'Concluído') return acc + 18500
    if (stage === 'Em desenvolvimento') return acc + 14000
    if (stage === 'Aguardando revisão') return acc + 12000
    return acc + 8500
  }, 0)

  const overallCompletionPercentage = totalProjectsCount
    ? Math.round((completedProjectsCount / totalProjectsCount) * 100)
    : 75

  // Filtered list of projects for the "Latest Transactions" table
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

  // Helper for status badge styling in Vision theme
  const getStatusPillStyle = (stageName: string) => {
    const stage = normalizeProjectStage(stageName)
    switch (stage) {
      case 'Novo projeto':
        return 'bg-amber-400 text-white font-extrabold'
      case 'Em desenvolvimento':
        return 'bg-[#0075FF] text-white font-extrabold'
      case 'Aguardando revisão':
        return 'bg-purple-500 text-white font-extrabold'
      case 'Concluído':
        return 'bg-emerald-500 text-white font-extrabold'
      default:
        return 'bg-slate-400 text-white font-extrabold'
    }
  }

  // Mock team members list for the right column matching Vision theme
  const teamMembers = [
    {
      id: 't1',
      name: 'Ana Comercial',
      role: 'Redesign E-commerce Iluminação',
      value: '+R$ 18.500',
      avatarBg: 'from-[#0C1D36] to-[#1E293B]',
    },
    {
      id: 't2',
      name: 'Carlos Designer',
      role: 'Landing Page SaaS AI',
      value: '+R$ 14.000',
      avatarBg: 'from-purple-500 to-indigo-600',
    },
    {
      id: 't3',
      name: 'Administrador ANXIS',
      role: 'Plataforma B2B Next.js',
      value: '+R$ 22.500',
      avatarBg: 'from-[#0075FF] to-cyan-500',
    },
    {
      id: 't4',
      name: 'Mariana Lima',
      role: 'Decor Studio Ltda',
      value: '+R$ 12.000',
      avatarBg: 'from-emerald-400 to-teal-600',
    },
  ]

  return (
    <div className="space-y-6 text-[#0C1D36] max-w-full overflow-hidden font-sans">
      {/* TOP HEADER ROW (VISION DESIGN: ROUNDED-FULL SEARCH + DATE + BADGES) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* ROUNDED-FULL SEARCH BAR */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects, clients or tags..."
            className="w-full pl-11 pr-5 py-3 rounded-full border border-slate-200/80 text-xs bg-white shadow-sm outline-none focus:border-[#0C1D36] focus:ring-1 focus:ring-[#0C1D36] transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* TOP RIGHT CONTROLS */}
        <div className="flex items-center gap-3 shrink-0">
          {/* LIVE SITE BUTTON */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="bg-white hover:bg-slate-100 p-2.5 rounded-full border border-slate-200/80 shadow-sm text-[#0075FF] transition-all"
            title="Ver Site Ao Vivo"
          >
            <Globe className="w-4 h-4" />
          </a>

          {/* LOGOUT BUTTON */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="bg-rose-50 hover:bg-rose-100 p-2.5 rounded-full border border-rose-200 shadow-sm text-rose-600 transition-all"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* HERO ROW (VISION DESIGN: LEFT DARK HERO CARD + RIGHT DARK GOAL CARD) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: DARK HERO CARD ("Hello Stevens 👋") */}
        <div className="lg:col-span-2 bg-[#0C1D36] text-white rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[260px]">
          {/* BACKGROUND DECORATIVE ORB GRADIENT */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-6 top-6 w-32 h-32 rounded-full bg-gradient-to-tr from-slate-700/40 to-slate-900/80 border border-white/10 blur-[1px] hidden sm:block pointer-events-none" />

          {/* TOP HEADLINE */}
          <div className="relative z-10 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
              Dashboard Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Olá, {userProfile?.full_name || 'Administrador'}</span>
              <span className="animate-bounce">👋</span>
            </h2>
          </div>

          {/* 2 INNER FLOATING STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 relative z-10">
            {/* INNER CARD 1: TOTAL SALES */}
            <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 text-white flex items-center gap-4 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase text-slate-300 tracking-wider">
                  Total Sales / Receita
                </div>
                <div className="text-xl font-black tracking-tight text-white mt-0.5">
                  {totalRevenueValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Por Mês Faturado</div>
              </div>
            </div>

            {/* INNER CARD 2: TOTAL VISITORS / PROJECTS */}
            <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 text-white flex items-center gap-4 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase text-slate-300 tracking-wider">
                  Projetos em Andamento
                </div>
                <div className="text-xl font-black tracking-tight text-white mt-0.5">
                  {inProgressProjectsCount} <span className="text-xs text-slate-300 font-bold">Projetos</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Em Produção Ativa</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: DARK GOAL CARD ("Marketing Goal / 75%") */}
        <div className="bg-[#0C1D36] text-white rounded-[32px] p-6 shadow-2xl flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[260px]">
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-slate-300">
              Meta de Entregas
            </span>
            <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>

          {/* CIRCULAR GAUGE COMPONENT */}
          <div className="relative w-32 h-32 flex items-center justify-center my-3">
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

          {/* GOAL SUBTITLE & BUTTON */}
          <div className="w-full space-y-2">
            <div className="text-xs font-bold text-slate-300">
              {totalRevenueValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[10px] text-slate-400">
              Alcançado {completedProjectsCount} de {totalProjectsCount} projetos concluídos
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab('client_projects')}
              className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-100 text-[#0C1D36] font-extrabold text-xs transition-all shadow-lg"
            >
              Ver Todos os Projetos
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW (VISION DESIGN: LEFT LATEST TRANSACTIONS TABLE + RIGHT SALES HISTORY) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: LATEST TRANSACTIONS TABLE */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200/80 p-6 shadow-sm space-y-4">
          {/* HEADER & FILTERS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#0C1D36]">
                Últimos Projetos (Latest Transactions)
              </h3>
              <p className="text-xs text-slate-500">
                Lista recente de entregas e contratos com filtros rápidos.
              </p>
            </div>

            {/* FILTERS DROPDOWNS */}
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

          {/* TABLE MATCHING VISION DESIGN */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[580px]">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="pb-3">Ref ID</th>
                  <th className="pb-3">Nome do Projeto</th>
                  <th className="pb-3">Data / Prazo</th>
                  <th className="pb-3">Estimativa</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Nenhum projeto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project, idx) => {
                    const normStage = normalizeProjectStage(project.status)
                    const pillClass = getStatusPillStyle(normStage)

                    return (
                      <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* REF ID */}
                        <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                          #PRJ/2026/0{idx + 1}
                        </td>

                        {/* NOME DO PROJETO */}
                        <td className="py-3.5">
                          <div className="font-extrabold text-[#0C1D36] text-xs">
                            {project.title}
                          </div>
                          <div className="text-[11px] text-slate-500">{project.client_name}</div>
                        </td>

                        {/* DATA */}
                        <td className="py-3.5 text-slate-600 font-semibold">
                          {project.deadline || '15/08/2026'}
                        </td>

                        {/* ESTIMATIVA */}
                        <td className="py-3.5 font-bold text-emerald-600">
                          +R$ {(14500 + idx * 2500).toLocaleString('pt-BR')}
                        </td>

                        {/* STATUS */}
                        <td className="py-3.5">
                          <span
                            className={cn(
                              'inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-wider',
                              pillClass
                            )}
                          >
                            {normStage}
                          </span>
                        </td>

                        {/* AÇÃO (BLACK PILL BUTTON MATCHING VISION DESIGN) */}
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenProjectDetail(project)}
                            className="px-4 py-1.5 rounded-full bg-[#0C1D36] hover:bg-[#0075FF] text-white text-[11px] font-extrabold transition-colors shadow-sm"
                          >
                            Detail
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

        {/* RIGHT COL: SALES HISTORY / EQUIPE & ATRIBUIÇÕES */}
        <div className="bg-white rounded-[32px] border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-[#0C1D36]">Equipe & Responsáveis</h3>
            <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>

          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-2xl bg-gradient-to-tr text-white flex items-center justify-center font-black text-sm shadow-md shrink-0',
                      member.avatarBg
                    )}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-[#0C1D36]">{member.name}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[130px]">
                      {member.role}
                    </div>
                  </div>
                </div>

                <span className="bg-emerald-50 text-emerald-700 font-extrabold rounded-xl px-3 py-1.5 text-xs border border-emerald-200/60">
                  {member.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
