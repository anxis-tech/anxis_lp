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

// Date Formatter Helper (converts 2026-08-30 to 30/08/2026)
export function formatDateBR(dateStr?: string) {
  if (!dateStr) return 'A definir'
  if (dateStr.includes('/')) return dateStr
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

// EXACT 4 STAGES SPECIFIED BY USER
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

interface KanbanBoardTabProps {
  projects: ClientProject[]
  onUpdateProjects: (updated: ClientProject[]) => void
  userProfile: UserProfileWithRole | null
  teamUsers?: UserProfileWithRole[]
  canMoveKanban?: boolean
  canViewAll?: boolean
  onOpenProjectDetail?: (project: ClientProject) => void
}

export function KanbanBoardTab({
  projects = [],
  onUpdateProjects,
  userProfile,
  teamUsers = [],
  canMoveKanban = true,
  canViewAll = true,
  onOpenProjectDetail,
}: KanbanBoardTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [quickFilter, setQuickFilter] = useState('todos')
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)

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
    if (quickFilter === 'em_andamento') {
      return p.status === 'Em desenvolvimento' || p.status === 'Aguardando revisão'
    }
    if (quickFilter === 'concluidos') {
      return p.status === 'Concluído'
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

    const stageObj = INITIAL_KANBAN_STAGES.find((s) => s.name === stageName)

    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          kanban_stage_id: stageObj?.id || p.kanban_stage_id,
          kanban_stage_name: stageName,
          status: stageName as ClientProjectStatus,
          updated_at: new Date().toISOString(),
        }
      }
      return p
    })

    onUpdateProjects(updated)
    setDraggedProjectId(null)
  }

  const handleSelectStageChange = (projectId: string, newStageName: string) => {
    if (!canMoveKanban) return
    const stageObj = INITIAL_KANBAN_STAGES.find((s) => s.name === newStageName)

    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          kanban_stage_id: stageObj?.id || p.kanban_stage_id,
          kanban_stage_name: newStageName,
          status: newStageName as ClientProjectStatus,
          updated_at: new Date().toISOString(),
        }
      }
      return p
    })

    onUpdateProjects(updated)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-6 max-w-full overflow-hidden font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Icon icon={KanbanNavIcon} size={20} className="text-[#0075FF]" />
            <span>Kanban de Projetos</span>
          </h2>
          <p className="text-xs text-[#596579]">
            Acompanhamento do fluxo de trabalho dos projetos.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl shrink-0">
          <Icon icon={PermissionsNavIcon} size={16} className="text-[#0075FF]" />
          <span>{canViewAll ? 'Visão Geral' : 'Seus Projetos Atribuídos'}</span>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Icon icon={SearchActionIcon} size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por projeto ou cliente..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0075FF]"
          />
        </div>

        {/* QUICK PRESETS */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0">
          {[
            { id: 'todos', label: 'Todos os Projetos' },
            { id: 'meus', label: 'Meus Projetos' },
            { id: 'sem_responsavel', label: 'Sem Responsável' },
            { id: 'atrasados', label: 'Atrasados ⚠️' },
            { id: 'em_andamento', label: 'Em Andamento' },
            { id: 'concluidos', label: 'Concluídos' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setQuickFilter(preset.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0',
                quickFilter === preset.id
                  ? 'bg-[#081D3A] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* KANBAN BOARD CONTAINER WITH STRICT INTERNAL SCROLL ONLY */}
      {filteredProjects.length === 0 && !canViewAll ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Icon icon={MetricUserIcon} size={40} className="text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-[#0C1D36]">Nenhum projeto foi atribuído a você no momento.</h3>
          <p className="text-xs text-[#596579] max-w-sm mx-auto">
            Assim que um gestor ou administrador atribuir um projeto à sua conta, ele aparecerá aqui no seu Kanban.
          </p>
        </div>
      ) : (
        /* STRICT WRAPPER: PREVENTS WHOLE-PAGE OVERFLOW, KEEPS INTERNAL SCROLL */
        <div className="w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-[720px] xl:min-w-0">
            {INITIAL_KANBAN_STAGES.map((stage) => {
              const stageProjects = filteredProjects.filter((p) => {
                const normalized = normalizeProjectStage(p.status)
                return normalized === stage.name
              })

              return (
                <div
                  key={stage.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnStage(e, stage.name)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col justify-between space-y-3 min-h-[460px] shadow-sm"
                >
                  {/* STAGE HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="font-extrabold text-[#0C1D36] text-xs uppercase tracking-wider">{stage.name}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {stageProjects.length}
                    </span>
                  </div>

                  {/* CARDS CONTAINER */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[540px] pr-1">
                    {stageProjects.length === 0 ? (
                      <div className="h-32 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400 font-medium italic">
                        Sem projetos nesta etapa
                      </div>
                    ) : (
                      stageProjects.map((project) => (
                        <div
                          key={project.id}
                          draggable={canMoveKanban}
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          onClick={() => onOpenProjectDetail && onOpenProjectDetail(project)}
                          className={cn(
                            'p-3.5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all space-y-2.5 cursor-pointer relative group',
                            draggedProjectId === project.id ? 'opacity-40 border-dashed border-[#0075FF]' : 'border-slate-200 hover:border-[#0075FF]'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-extrabold text-[#0C1D36] text-xs group-hover:text-[#0075FF] transition-colors leading-snug">
                              {project.title}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-medium truncate">
                            {project.client_name}
                          </div>

                          {/* METADATA CHIPS */}
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 pt-1">
                            {project.deadline && (
                              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                <Icon icon={DateStatusIcon} size={12} className="text-slate-400" />
                                <span className="font-mono font-semibold">{formatDateBR(project.deadline)}</span>
                              </div>
                            )}

                            {project.files && project.files.length > 0 && (
                              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                <Icon icon={FileAttachmentStatusIcon} size={12} className="text-slate-400" />
                                <span>{project.files.length}</span>
                              </div>
                            )}

                            {project.tasks && project.tasks.length > 0 && (
                              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                <Icon icon={CheckedSquareStatusIcon} size={12} className="text-slate-400" />
                                <span>
                                  {project.tasks.filter((t) => t.status === 'Concluída').length}/{project.tasks.length}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* FOOTER USER ASSIGNED & QUICK SELECT STAGE */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <div className="w-5 h-5 rounded-full bg-[#081D3A] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                {project.responsible_user_name ? project.responsible_user_name.charAt(0) : '?'}
                              </div>
                              <span className="text-slate-600 font-semibold truncate max-w-[90px]">
                                {project.responsible_user_name || 'Sem resp.'}
                              </span>
                            </div>

                            {/* SELECTOR STAGE FOR MOBILE/TOUCH */}
                            {canMoveKanban && (
                              <select
                                value={stage.name}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleSelectStageChange(project.id, e.target.value)
                                }}
                                className="text-[10px] bg-slate-100 text-[#0C1D36] font-bold rounded px-1.5 py-0.5 border border-slate-200 outline-none"
                              >
                                {INITIAL_KANBAN_STAGES.map((s) => (
                                  <option key={s.id} value={s.name}>
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
      )}
    </div>
  )
}
