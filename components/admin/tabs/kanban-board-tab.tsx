'use client'

import { useState } from 'react'
import { ClientProject, ClientProjectStatus, KanbanStage } from '@/types/client-project.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import { Icon } from '@/components/ui/icon'
import { KanbanNavIcon, PermissionsNavIcon } from '@/lib/icons/navigation'
import { SearchActionIcon } from '@/lib/icons/actions'
import { MetricUserIcon } from '@/lib/icons/dashboard'
import {
  DateStatusIcon,
  FileAttachmentStatusIcon,
  CheckedSquareStatusIcon,
} from '@/lib/icons/status'
import { cn } from '@/lib/utils'
import {
  ListFilter,
  Kanban,
  Calendar,
  BarChart2,
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  Paperclip,
  MessageSquare,
  Flag,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react'

// Date Formatter Helper (converts 2026-08-30 to 30/08/2026)
export function formatDateBR(dateStr?: string) {
  if (!dateStr) return '-'
  if (dateStr.includes('/')) return dateStr
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

// EXPORT INITIAL_KANBAN_STAGES FOR BACKWARD COMPATIBILITY
export const INITIAL_KANBAN_STAGES: KanbanStage[] = [
  { id: 'ks-1', name: 'Novo projeto', slug: 'novo-projeto', color: '#0075FF', display_order: 1, is_active: true, is_initial: true },
  { id: 'ks-2', name: 'Em desenvolvimento', slug: 'em-desenvolvimento', color: '#3B82F6', display_order: 2, is_active: true },
  { id: 'ks-3', name: 'Aguardando revisão', slug: 'aguardando-revisao', color: '#F59E0B', display_order: 3, is_active: true },
  { id: 'ks-4', name: 'Concluído', slug: 'concluido', color: '#10B981', display_order: 4, is_active: true, is_completed: true },
]

export function normalizeProjectStage(statusString?: string): string {
  if (!statusString) return 'Novo projeto'
  const lower = statusString.toLowerCase().trim()
  if (lower.includes('novo') || lower.includes('briefing') || lower.includes('início') || lower.includes('aberto')) return 'Novo projeto'
  if (lower.includes('desenvolv') || lower.includes('produção') || lower.includes('andamento') || lower.includes('design') || lower.includes('wireframe')) return 'Em desenvolvimento'
  if (lower.includes('revis') || lower.includes('aprov') || lower.includes('test') || lower.includes('homolog')) return 'Aguardando revisão'
  if (lower.includes('conclu') || lower.includes('entreg') || lower.includes('finaliz') || lower.includes('publicad')) return 'Concluído'
  return 'Novo projeto'
}

// CLICKUP STATUS STAGES
export const KANBAN_STAGES_CLICKUP: { name: string; key: string; color: string; badgeBgLight: string; badgeBgDark: string; textHex: string }[] = [
  { name: 'PENDENTE', key: 'pendente', color: '#EAB308', badgeBgLight: 'bg-amber-50 text-amber-700 border-amber-200', badgeBgDark: 'bg-amber-500/20 text-amber-300 border-amber-500/40', textHex: '#F59E0B' },
  { name: 'EM PROGRESSO', key: 'em-progresso', color: '#8B5CF6', badgeBgLight: 'bg-purple-50 text-purple-700 border-purple-200', badgeBgDark: 'bg-purple-500/20 text-purple-300 border-purple-500/40', textHex: '#A855F7' },
  { name: 'FEITO', key: 'feito', color: '#10B981', badgeBgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeBgDark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', textHex: '#10B981' },
  { name: 'CONCLUÍDO', key: 'concluido', color: '#06B6D4', badgeBgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200', badgeBgDark: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', textHex: '#06B6D4' },
]

export function normalizeClickUpStage(statusString?: string): string {
  if (!statusString) return 'PENDENTE'
  const lower = statusString.toLowerCase().trim()
  if (lower.includes('conclui') || lower.includes('concluíd') || lower.includes('finaliz')) return 'CONCLUÍDO'
  if (lower.includes('feito') || lower.includes('entreg') || lower.includes('aprov')) return 'FEITO'
  if (lower.includes('desenvolv') || lower.includes('progresso') || lower.includes('andamento') || lower.includes('revis')) return 'EM PROGRESSO'
  return 'PENDENTE'
}

interface KanbanBoardTabProps {
  projects: ClientProject[]
  onUpdateProjects: (updated: ClientProject[]) => void
  userProfile: UserProfileWithRole | null
  teamUsers?: UserProfileWithRole[]
  canMoveKanban?: boolean
  canViewAll?: boolean
  onOpenProjectDetail?: (project: ClientProject) => void
  isDarkMode?: boolean
}

export function KanbanBoardTab({
  projects = [],
  onUpdateProjects,
  userProfile,
  teamUsers = [],
  canMoveKanban = true,
  canViewAll = true,
  onOpenProjectDetail,
  isDarkMode = false,
}: KanbanBoardTabProps) {
  const [viewMode, setViewMode] = useState<'quadro' | 'lista'>('quadro')
  const [searchTerm, setSearchTerm] = useState('')
  const [quickFilter, setQuickFilter] = useState('todos')
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const currentUserId = userProfile?.user_id

  // Base list depending on view scope
  const scopedProjects = canViewAll
    ? projects
    : projects.filter((p) => p.responsible_user_id === currentUserId)

  // Filtered projects by search and quick filter presets
  const filteredProjects = scopedProjects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (quickFilter === 'meus') {
      return p.responsible_user_id === currentUserId
    }
    if (quickFilter === 'sem_responsavel') {
      return !p.responsible_user_name || p.responsible_user_name.trim() === ''
    }
    if (quickFilter === 'atrasados') {
      if (!p.deadline) return false
      const deadlineDate = new Date(p.deadline)
      const now = new Date()
      return deadlineDate < now && p.status !== 'Concluído'
    }

    return true
  })

  // DRAG & DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    if (!canMoveKanban) return
    setDraggedProjectId(projectId)
    e.dataTransfer.setData('text/plain', projectId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!canMoveKanban) return
    e.preventDefault()
  }

  const handleDropOnStage = (e: React.DragEvent, stageName: string) => {
    if (!canMoveKanban) return
    e.preventDefault()
    const projectId = e.dataTransfer.getData('text/plain') || draggedProjectId
    if (!projectId) return

    let statusMapped: ClientProjectStatus = 'Novo projeto'
    if (stageName === 'EM PROGRESSO') statusMapped = 'Em desenvolvimento'
    if (stageName === 'FEITO') statusMapped = 'Aguardando revisão'
    if (stageName === 'CONCLUÍDO') statusMapped = 'Concluído'

    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          kanban_stage_name: stageName,
          status: statusMapped,
          updated_at: new Date().toISOString(),
        }
      }
      return p
    })

    onUpdateProjects(updated)
    setDraggedProjectId(null)
  }

  const toggleGroupCollapse = (stageName: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [stageName]: !prev[stageName] }))
  }

  return (
    <div
      className={cn(
        'rounded-3xl border transition-colors duration-300 space-y-4 p-4 sm:p-6 font-sans min-h-[750px]',
        isDarkMode
          ? 'bg-[#12141A] text-white border-slate-800 shadow-2xl'
          : 'bg-white text-[#0C1D36] border-slate-200/80 shadow-sm'
      )}
    >
      {/* 1. CLICKUP TOP HEADER & VIEW SWITCHER */}
      <div
        className={cn(
          'flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4',
          isDarkMode ? 'border-slate-800' : 'border-slate-100'
        )}
      >
        {/* LEFT VIEW SWITCHER TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold select-none">
          <span className={cn('font-mono text-[11px] mr-2 flex items-center gap-1 shrink-0', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            <Icon icon={KanbanNavIcon} size={16} className="text-[#0099FF]" />
            <span>Espaço da equipe / <strong>Projetos</strong></span>
          </span>

          <button
            type="button"
            onClick={() => setViewMode('lista')}
            className={cn(
              'px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer',
              viewMode === 'lista'
                ? isDarkMode
                  ? 'bg-white/10 text-white font-bold border border-white/20'
                  : 'bg-[#0C1D36] text-white font-bold shadow-md'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-[#0C1D36] hover:bg-slate-100'
            )}
          >
            <ListFilter className="w-4 h-4 text-emerald-400" />
            <span>Lista</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('quadro')}
            className={cn(
              'px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer',
              viewMode === 'quadro'
                ? isDarkMode
                  ? 'bg-[#0099FF] text-white font-bold shadow-md'
                  : 'bg-[#0C1D36] text-white font-bold shadow-md'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-[#0C1D36] hover:bg-slate-100'
            )}
          >
            <Kanban className="w-4 h-4 text-white" />
            <span>Quadro</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl text-slate-400 flex items-center gap-1.5 cursor-not-allowed opacity-60 shrink-0"
            title="Visualização Calendário"
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Calendário</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl text-slate-400 flex items-center gap-1.5 cursor-not-allowed opacity-60 shrink-0"
            title="Visualização Gantt"
          >
            <BarChart2 className="w-4 h-4 text-rose-500" />
            <span>Gantt</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl text-slate-400 flex items-center gap-1.5 cursor-not-allowed opacity-60 shrink-0"
            title="Visualização Tabela"
          >
            <TableIcon className="w-4 h-4 text-cyan-500" />
            <span>Tabela</span>
          </button>
        </div>

        {/* RIGHT CLICKUP ACTIONS: SEARCH & ADD TASK */}
        <div className="flex items-center gap-3">
          {/* SEARCH INPUT */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar tarefas..."
              className={cn(
                'w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-[#0075FF]',
                isDarkMode
                  ? 'bg-[#1A1E26] border border-slate-700/80 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border border-slate-200 text-[#0C1D36] placeholder:text-slate-400'
              )}
            />
          </div>

          {/* ADD TASK BUTTON */}
          {onOpenProjectDetail && (
            <button
              type="button"
              onClick={() => filteredProjects[0] && onOpenProjectDetail(filteredProjects[0])}
              className="px-3.5 py-1.5 rounded-xl bg-[#0099FF] hover:bg-[#00939E] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tarefa</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TOOLBAR PRESETS & FILTERS */}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2.5 py-1 rounded-lg border text-[11px] font-semibold',
              isDarkMode
                ? 'bg-[#1A1E26] border-slate-700 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            )}
          >
            Grupo: Status
          </span>
          <span
            className={cn(
              'px-2.5 py-1 rounded-lg border text-[11px] font-medium',
              isDarkMode
                ? 'bg-[#1A1E26] border-slate-700 text-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            )}
          >
            Subtarefas
          </span>
        </div>

        {/* QUICK PRESETS */}
        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'meus', label: 'Meus Projetos' },
            { id: 'sem_responsavel', label: 'Sem Responsável' },
            { id: 'atrasados', label: 'Atrasados ⚠️' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setQuickFilter(preset.id)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 cursor-pointer',
                quickFilter === preset.id
                  ? isDarkMode
                    ? 'bg-white/15 text-white border border-white/20 font-bold'
                    : 'bg-[#0C1D36] text-white font-bold shadow-sm'
                  : isDarkMode
                    ? 'bg-[#1A1E26] text-slate-400 hover:text-white border border-slate-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE VIEW MODE: QUADRO (KANBAN) VS LISTA (CLICKUP LIST VIEW) */}
      {viewMode === 'quadro' ? (
        /* ================= QUADRO (KANBAN VIEW) ================= */
        <div className="w-full overflow-x-auto pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[850px] lg:min-w-0">
            {KANBAN_STAGES_CLICKUP.map((stage) => {
              const stageProjects = filteredProjects.filter((p) => {
                const normalized = normalizeClickUpStage(p.status)
                return normalized === stage.name
              })

              const badgeStyle = isDarkMode ? stage.badgeBgDark : stage.badgeBgLight

              return (
                <div
                  key={stage.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnStage(e, stage.name)}
                  className={cn(
                    'rounded-2xl border p-3.5 flex flex-col justify-between space-y-3 min-h-[550px] shadow-sm',
                    isDarkMode
                      ? 'bg-[#181B22] border-slate-800/80 shadow-lg'
                      : 'bg-slate-50/80 border-slate-200/80'
                  )}
                >
                  {/* CLICKUP STAGE COLUMN HEADER */}
                  <div className={cn('flex items-center justify-between border-b pb-3', isDarkMode ? 'border-slate-800' : 'border-slate-200/80')}>
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border', badgeStyle)}>
                        {stage.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {stageProjects.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                      title="Opções de Coluna"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ADD TASK TOP BUTTON */}
                  <button
                    type="button"
                    onClick={() => onOpenProjectDetail && filteredProjects[0] && onOpenProjectDetail(filteredProjects[0])}
                    className={cn(
                      'w-full py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-dashed',
                      isDarkMode
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-slate-700/80'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                    )}
                  >
                    <Plus className="w-3.5 h-3.5 text-[#0099FF]" />
                    <span>Adicionar Tarefa</span>
                  </button>

                  {/* CARDS LIST */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[580px] pr-1">
                    {stageProjects.length === 0 ? (
                      <div className="h-32 rounded-xl border border-dashed border-slate-300/60 flex items-center justify-center text-[11px] text-slate-400 font-medium italic">
                        Nenhuma tarefa nesta etapa
                      </div>
                    ) : (
                      stageProjects.map((project) => (
                        <div
                          key={project.id}
                          draggable={canMoveKanban}
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          onClick={() => onOpenProjectDetail && onOpenProjectDetail(project)}
                          className={cn(
                            'p-4 rounded-xl border shadow-sm hover:border-[#0099FF] hover:shadow-md transition-all space-y-3 cursor-pointer relative group',
                            isDarkMode
                              ? 'bg-[#202530] border-slate-700/80'
                              : 'bg-white border-slate-200',
                            draggedProjectId === project.id ? 'opacity-40 border-dashed border-[#0099FF]' : ''
                          )}
                        >
                          {/* TASK TITLE */}
                          <div className="space-y-1">
                            <h4
                              className={cn(
                                'font-extrabold text-xs group-hover:text-[#0099FF] transition-colors leading-snug',
                                isDarkMode ? 'text-white' : 'text-[#0C1D36]'
                              )}
                            >
                              {project.title}
                            </h4>
                            <div className="text-[11px] text-slate-400 truncate font-medium">
                              Em [{project.client_name}] - {(project as any).segment || (project as any).niche || 'Projeto Web'}
                            </div>
                          </div>

                          {/* CLICKUP ICONS & METADATA BAR */}
                          <div className={cn('flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t', isDarkMode ? 'border-slate-800' : 'border-slate-100')}>
                            <div className="flex items-center gap-2.5">
                              {/* ATTACHMENT COUNT */}
                              <div className="flex items-center gap-1 text-slate-400" title="Anexos">
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>{project.files?.length || 1}</span>
                              </div>

                              {/* COMMENTS COUNT */}
                              <div className="flex items-center gap-1 text-slate-400" title="Comentários">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>3</span>
                              </div>

                              {/* PRIORITY FLAG */}
                              <div className="flex items-center gap-1 text-blue-400" title="Prioridade Normal">
                                <Flag className="w-3.5 h-3.5 fill-blue-400" />
                              </div>
                            </div>

                            {/* DUE DATE BADGE */}
                            {project.deadline && (
                              <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] font-bold">
                                <Clock className="w-3 h-3" />
                                <span>{formatDateBR(project.deadline)}</span>
                              </div>
                            )}
                          </div>

                          {/* USER AVATAR & QUICK STAGE SELECTOR */}
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-[#0099FF] text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow">
                                {project.responsible_user_name ? project.responsible_user_name.charAt(0) : 'A'}
                              </div>
                              <span className={cn('font-semibold truncate max-w-[100px] text-[10px]', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                                {project.responsible_user_name || 'Sem resp.'}
                              </span>
                            </div>

                            {canMoveKanban && (
                              <select
                                value={stage.name}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleDropOnStage(e as any, e.target.value)
                                }}
                                className={cn(
                                  'text-[10px] font-bold rounded px-2 py-0.5 border outline-none',
                                  isDarkMode
                                    ? 'bg-[#16181D] text-slate-300 border-slate-700'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                )}
                              >
                                {KANBAN_STAGES_CLICKUP.map((s) => (
                                  <option key={s.key} value={s.name}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ================= LISTA (CLICKUP LIST VIEW) ================= */
        <div className="space-y-6 pt-2 overflow-x-auto">
          {KANBAN_STAGES_CLICKUP.map((stage) => {
            const stageProjects = filteredProjects.filter((p) => {
              const normalized = normalizeClickUpStage(p.status)
              return normalized === stage.name
            })

            const isCollapsed = collapsedGroups[stage.name]
            const badgeStyle = isDarkMode ? stage.badgeBgDark : stage.badgeBgLight

            return (
              <div
                key={stage.key}
                className={cn(
                  'rounded-2xl border overflow-hidden shadow-sm',
                  isDarkMode ? 'bg-[#181B22] border-slate-800' : 'bg-white border-slate-200'
                )}
              >
                {/* STAGE LIST GROUP HEADER */}
                <div
                  onClick={() => toggleGroupCollapse(stage.name)}
                  className={cn(
                    'px-4 py-3 border-b flex items-center justify-between cursor-pointer select-none',
                    isDarkMode ? 'bg-[#1C202B] border-slate-800' : 'bg-slate-100/90 border-slate-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    <span className={cn('px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border', badgeStyle)}>
                      {stage.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {stageProjects.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenProjectDetail && filteredProjects[0] && onOpenProjectDetail(filteredProjects[0])
                    }}
                    className="text-xs font-bold text-[#0099FF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Tarefa</span>
                  </button>
                </div>

                {/* TABLE OF TASKS IN STAGE */}
                {!isCollapsed && (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans border-collapse">
                      <thead>
                        <tr
                          className={cn(
                            'border-b text-[11px] font-mono uppercase tracking-wider',
                            isDarkMode
                              ? 'border-slate-800 text-slate-400 bg-[#13161C]'
                              : 'border-slate-200 text-slate-500 bg-slate-50'
                          )}
                        >
                          <th className="py-3 px-4 font-bold">Nome</th>
                          <th className="py-3 px-4 font-bold">Responsável</th>
                          <th className="py-3 px-4 font-bold">Vencimento</th>
                          <th className="py-3 px-4 font-bold">Prioridade</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 font-bold">Comentários</th>
                          <th className="py-3 px-4 font-bold text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className={cn('divide-y', isDarkMode ? 'divide-slate-800/80' : 'divide-slate-100')}>
                        {stageProjects.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400 italic text-xs">
                              Nenhuma tarefa registrada nesta etapa.
                            </td>
                          </tr>
                        ) : (
                          stageProjects.map((project) => (
                            <tr
                              key={project.id}
                              onClick={() => onOpenProjectDetail && onOpenProjectDetail(project)}
                              className={cn(
                                'transition-colors cursor-pointer group',
                                isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                              )}
                            >
                              {/* NAME COLUMN */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-[#0099FF] transition-colors" />
                                  <div>
                                    <span
                                      className={cn(
                                        'font-extrabold text-xs group-hover:text-[#0099FF] transition-colors',
                                        isDarkMode ? 'text-white' : 'text-[#0C1D36]'
                                      )}
                                    >
                                      {project.title}
                                    </span>
                                    <div className="text-[10px] text-slate-400">
                                      Em [{project.client_name}]
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* RESPONSIBLE */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#0099FF] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {project.responsible_user_name ? project.responsible_user_name.charAt(0) : 'A'}
                                  </div>
                                  <span className={cn('font-semibold text-xs', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                                    {project.responsible_user_name || 'Sem resp.'}
                                  </span>
                                </div>
                              </td>

                              {/* DUE DATE */}
                              <td className="py-3 px-4 font-mono text-emerald-500 font-bold text-xs">
                                {formatDateBR(project.deadline)}
                              </td>

                              {/* PRIORITY */}
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold">
                                  <Flag className="w-3 h-3 fill-blue-500" />
                                  <span>Normal</span>
                                </span>
                              </td>

                              {/* STATUS */}
                              <td className="py-3 px-4">
                                <span className={cn('px-2.5 py-0.5 rounded text-[10px] font-extrabold border', badgeStyle)}>
                                  {stage.name}
                                </span>
                              </td>

                              {/* COMMENTS */}
                              <td className="py-3 px-4 text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>3</span>
                                </div>
                              </td>

                              {/* ACTION */}
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onOpenProjectDetail && onOpenProjectDetail(project)
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
