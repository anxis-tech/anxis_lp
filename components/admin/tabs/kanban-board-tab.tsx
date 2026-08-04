'use client'

import { useState } from 'react'
import { ClientProject, ClientProjectStatus, KanbanStage } from '@/types/client-project.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import {
  Kanban,
  Search,
  User,
  Calendar,
  Paperclip,
  CheckSquare,
  Clock,
  UserCheck,
  Shield,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// EXACT 4 STAGES SPECIFIED BY USER
export const INITIAL_KANBAN_STAGES: KanbanStage[] = [
  { id: 'ks-1', name: 'Novo projeto', slug: 'novo-projeto', color: '#0075FF', display_order: 1, is_active: true, is_initial: true },
  { id: 'ks-2', name: 'Em desenvolvimento', slug: 'em-desenvolvimento', color: '#3B82F6', display_order: 2, is_active: true },
  { id: 'ks-3', name: 'Aguardando revisão', slug: 'aguardando-revisao', color: '#F59E0B', display_order: 3, is_active: true },
  { id: 'ks-4', name: 'Concluído', slug: 'concluido', color: '#10B981', display_order: 4, is_active: true, is_completed: true },
]

// MAPPING HELPER FOR LEGACY / MIGRATED STAGES
export function normalizeProjectStage(rawStatus?: string): ClientProjectStatus {
  if (!rawStatus) return 'Novo projeto'

  const s = rawStatus.toLowerCase().trim()

  if (s.includes('novo') || s.includes('briefing') || s.includes('informações') || s.includes('planejamento')) {
    return 'Novo projeto'
  }
  if (s.includes('design') || s.includes('desenvolvimento') || s.includes('ajuste')) {
    return 'Em desenvolvimento'
  }
  if (s.includes('revisão') || s.includes('aprovação') || s.includes('cliente')) {
    return 'Aguardando revisão'
  }
  if (s.includes('aprovado') || s.includes('publicação') || s.includes('concluído') || s.includes('pausado') || s.includes('cancelado')) {
    return 'Concluído'
  }

  return 'Novo projeto'
}

interface KanbanBoardTabProps {
  projects: ClientProject[]
  onUpdateProjects: (updated: ClientProject[]) => void
  userProfile: UserProfileWithRole | null
  canMoveKanban: boolean
  canViewAll: boolean
  onOpenProjectDetail: (project: ClientProject) => void
}

export function KanbanBoardTab({
  projects,
  onUpdateProjects,
  userProfile,
  canMoveKanban = true,
  canViewAll = true,
  onOpenProjectDetail,
}: KanbanBoardTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [quickFilter, setQuickFilter] = useState<string>('todos')
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)

  // FILTER BY USER PERMISSIONS:
  const visibleProjects = projects.filter((p) => {
    if (canViewAll) return true
    if (!userProfile) return false
    const isAssigned = p.responsible_user_id === userProfile.user_id
    const isParticipant = p.participants?.some((part) => part.user_id === userProfile.user_id)
    return isAssigned || isParticipant
  })

  // APPLY SEARCH & QUICK FILTERS
  const filteredProjects = visibleProjects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (quickFilter === 'meus') {
      return p.responsible_user_id === userProfile?.user_id
    }
    if (quickFilter === 'sem_responsavel') {
      return !p.responsible_user_id
    }
    if (quickFilter === 'atrasados') {
      return p.deadline_status === 'Atrasado'
    }
    if (quickFilter === 'em_andamento') {
      const normalized = normalizeProjectStage(p.status)
      return normalized !== 'Concluído'
    }
    if (quickFilter === 'concluidos') {
      const normalized = normalizeProjectStage(p.status)
      return normalized === 'Concluído'
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
    e.preventDefault()
  }

  const handleDropStage = (e: React.DragEvent, stage: KanbanStage) => {
    e.preventDefault()
    if (!draggedProjectId || !canMoveKanban) return

    const updated = projects.map((p) => {
      if (p.id === draggedProjectId) {
        return {
          ...p,
          kanban_stage_id: stage.id,
          kanban_stage_name: stage.name,
          status: stage.name as ClientProjectStatus,
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
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6 max-w-full overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Kanban className="w-5 h-5 text-[#0075FF]" />
            <span>Kanban de Projetos (4 Estágios)</span>
          </h2>
          <p className="text-xs text-[#596579]">
            Acompanhamento do fluxo de trabalho em 4 estágios essenciais: Novo projeto, Em desenvolvimento, Aguardando revisão e Concluído.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl shrink-0">
          <Shield className="w-4 h-4 text-[#0075FF]" />
          <span>{canViewAll ? 'Visão Geral (Todos os Projetos)' : 'Seus Projetos Atribuídos'}</span>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
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
          <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
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
                  onDrop={(e) => handleDropStage(e, stage)}
                  className="bg-[#F7F8FA] border border-slate-200 rounded-2xl p-3 flex flex-col justify-between space-y-3 min-h-[500px]"
                >
                  {/* COLUMN HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                      <h3 className="text-xs font-extrabold text-[#0C1D36]">{stage.name}</h3>
                    </div>
                    <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                      {stageProjects.length}
                    </span>
                  </div>

                  {/* COLUMN CARDS */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {stageProjects.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-slate-400 italic border border-dashed border-slate-200 rounded-xl">
                        Nenhum projeto neste estágio
                      </div>
                    ) : (
                      stageProjects.map((project) => {
                        const isOverdue = project.deadline_status === 'Atrasado'
                        const isNear = project.deadline_status === 'Próximo do prazo'

                        return (
                          <div
                            key={project.id}
                            draggable={canMoveKanban}
                            onDragStart={(e) => handleDragStart(e, project.id)}
                            onClick={() => onOpenProjectDetail(project)}
                            className={cn(
                              'bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer group',
                              isOverdue
                                ? 'border-rose-300 hover:border-rose-400 bg-rose-50/20'
                                : 'border-slate-200 hover:border-[#0075FF]'
                            )}
                          >
                            {/* TAGS & PRIORITY */}
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold uppercase tracking-wider text-[#0075FF] bg-[#0075FF]/10 px-2 py-0.5 rounded">
                                {project.project_type}
                              </span>

                              <span
                                className={cn(
                                  'font-bold px-2 py-0.5 rounded uppercase',
                                  project.priority === 'Urgente'
                                    ? 'bg-rose-500 text-white'
                                    : project.priority === 'Alta'
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-slate-100 text-slate-600'
                                )}
                              >
                                {project.priority}
                              </span>
                            </div>

                            {/* PROJECT TITLE & CLIENT */}
                            <div>
                              <h4 className="text-xs font-bold text-[#0C1D36] group-hover:text-[#0075FF] transition-colors leading-tight">
                                {project.title}
                              </h4>
                              <p className="text-[11px] text-[#596579] mt-0.5">{project.client_name}</p>
                            </div>

                            {/* DEADLINE BADGE */}
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Clock
                                className={cn(
                                  'w-3.5 h-3.5',
                                  isOverdue ? 'text-rose-600' : isNear ? 'text-amber-500' : 'text-slate-400'
                                )}
                              />
                              <span
                                className={cn(
                                  'font-semibold',
                                  isOverdue ? 'text-rose-600 font-bold' : isNear ? 'text-amber-600 font-bold' : 'text-slate-600'
                                )}
                              >
                                {project.deadline || 'Sem prazo'}
                              </span>
                            </div>

                            {/* RESPONSIBLE & METRICS */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#596579]">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-[#081D3A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {project.responsible_user_name ? project.responsible_user_name.charAt(0) : '?'}
                                </div>
                                <span className="font-medium text-slate-700 truncate max-w-[90px]">
                                  {project.responsible_user_name || 'Sem resp.'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 font-bold text-slate-500">
                                {project.files && project.files.length > 0 && (
                                  <span className="flex items-center gap-0.5" title="Arquivos">
                                    <Paperclip className="w-3 h-3" />
                                    {project.files.length}
                                  </span>
                                )}
                                {project.tasks && project.tasks.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-[#0075FF]" title="Pendências">
                                    <CheckSquare className="w-3 h-3" />
                                    {project.tasks.length}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* MOBILE ACCESSIBLE SELECT FOR STAGE CHANGE */}
                            <div className="md:hidden pt-2 border-t border-slate-100">
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">Mover Etapa:</label>
                              <select
                                value={normalizeProjectStage(project.status)}
                                onChange={(e) => handleSelectStageChange(project.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs py-1 px-2 rounded border border-slate-200 bg-white"
                              >
                                {INITIAL_KANBAN_STAGES.map((s) => (
                                  <option key={s.id} value={s.name}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )
                      })
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
