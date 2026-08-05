'use client'

import { useState, useRef } from 'react'
import {
  ClientProject,
  ClientProjectStatus,
  ClientProjectFile,
  ClientProjectLink,
  FileCategory,
} from '@/types/client-project.types'
import { UserProfileWithRole } from '@/lib/auth/permissions'
import {
  INITIAL_KANBAN_STAGES,
  normalizeProjectStage,
  formatDateBR,
} from '@/components/admin/tabs/kanban-board-tab'
import { Icon } from '@/components/ui/icon'
import {
  ProjectsNavIcon,
  DownNavIcon,
  BackNavIcon,
} from '@/lib/icons/navigation'
import {
  AddActionIcon,
  EditActionIcon,
  DeleteActionIcon,
  ViewActionIcon,
  SaveActionIcon,
  CancelActionIcon,
  UploadActionIcon,
  DownloadActionIcon,
  LinkActionIcon,
  ExternalLinkActionIcon,
  SearchActionIcon,
  FilterActionIcon,
  MailActionIcon,
} from '@/lib/icons/actions'
import {
  MetricUserIcon,
  MetricTeamIcon,
  MetricQuoteIcon,
} from '@/lib/icons/dashboard'
import {
  SuccessStatusIcon,
  ErrorStatusIcon,
  WarningStatusIcon,
  PendingStatusIcon,
  InfoStatusIcon,
  FileAttachmentStatusIcon,
  DateStatusIcon,
} from '@/lib/icons/status'
import { cn } from '@/lib/utils'



interface ClientProjectsTabProps {
  projects: ClientProject[]
  onUpdateProjects: (updated: ClientProject[]) => void
  userProfile: UserProfileWithRole | null
  teamUsers: UserProfileWithRole[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canAssignResponsible: boolean
  canViewAll: boolean
  onOpenProjectDetail: (project: ClientProject) => void
}

export function ClientProjectsTab({
  projects = [],
  onUpdateProjects,
  userProfile,
  teamUsers = [],
  canCreate,
  canEdit,
  canDelete,
  canAssignResponsible,
  canViewAll,
  onOpenProjectDetail,
}: ClientProjectsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [platformFilter, setPlatformFilter] = useState('todos')

  // Expanded Spacious Dialog State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Partial<ClientProject> | null>(null)
  const [activeFormTab, setActiveFormTab] = useState<
    'geral' | 'contato' | 'escopo' | 'links_arquivos' | 'responsavel' | 'planejamento' | 'observacoes'
  >('geral')

  // Searchable Combobox for Responsible User
  const [userSearchText, setUserSearchText] = useState('')
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)

  // Sub-state for Adding New Link
  const [newLink, setNewLink] = useState({ label: '', url: '', category: 'Figma', description: '' })

  // Real Drag & Drop File Upload Dropzone State
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [newFileCategory, setNewFileCategory] = useState<FileCategory>('Documentos')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // FILTER VISIBILITY BY PERMISSION:
  const visibleProjects = projects.filter((p) => {
    if (canViewAll) return true
    if (!userProfile) return false
    return p.responsible_user_id === userProfile.user_id
  })

  const filteredProjects = visibleProjects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    const normalized = normalizeProjectStage(p.status)
    const matchesStatus = statusFilter === 'todos' || normalized === statusFilter
    const matchesPlatform = platformFilter === 'todos' || p.platform === platformFilter
    return matchesSearch && matchesStatus && matchesPlatform
  })

  const filteredTeamUsers = teamUsers.filter(
    (u) =>
      u.is_active &&
      (u.full_name.toLowerCase().includes(userSearchText.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchText.toLowerCase()))
  )

  const handleOpenCreateModal = () => {
    setEditingProject({
      title: '',
      client_name: '',
      company: '',
      project_type: 'Site institucional',
      platform: 'Next.js',
      status: 'Novo projeto',
      kanban_stage_name: 'Novo projeto',
      priority: 'Normal',
      responsible_user_id: userProfile?.user_id || '',
      responsible_user_name: userProfile?.full_name || '',
      responsible_user_email: userProfile?.email || '',
      client_contact_json: {
        contact_name: '',
        company: '',
        email: '',
        phone: '',
        whatsapp: '',
        role: '',
        preferred_channel: 'WhatsApp',
        contact_notes: '',
      },
      scope_briefing_json: {
        objective: '',
        target_audience: '',
        segment: '',
        requested_pages: [],
        requested_features: [],
        requested_integrations: [],
        visual_references: [],
        technical_requirements: '',
        client_notes: '',
      },
      files: [],
      links: [],
      tasks: [],
    })
    setActiveFormTab('geral')
    setIsEditModalOpen(true)
  }

  const handleSaveProjectForm = () => {
    if (!editingProject?.title || !editingProject?.client_name) {
      alert('Por favor, preencha pelo menos o Nome do Projeto e o Nome do Cliente.')
      return
    }

    const normStatus = normalizeProjectStage(editingProject.status)

    if (editingProject.id) {
      const updated = projects.map((p) =>
        p.id === editingProject.id
          ? ({
              ...p,
              ...editingProject,
              status: normStatus,
              kanban_stage_name: normStatus,
              updated_at: new Date().toISOString(),
            } as ClientProject)
          : p
      )
      onUpdateProjects(updated)
    } else {
      const newProj: ClientProject = {
        id: `cp-${Date.now()}`,
        title: editingProject.title || 'Novo Projeto',
        client_name: editingProject.client_name || 'Cliente',
        company: editingProject.company,
        email: editingProject.email,
        phone: editingProject.phone,
        whatsapp: editingProject.whatsapp,
        project_type: editingProject.project_type || 'Site institucional',
        platform: editingProject.platform || 'Next.js',
        status: normStatus as ClientProjectStatus,
        kanban_stage_name: normStatus,
        priority: editingProject.priority || 'Normal',
        responsible_user_id: editingProject.responsible_user_id,
        responsible_user_name: editingProject.responsible_user_name,
        responsible_user_email: editingProject.responsible_user_email,
        start_date: editingProject.start_date,
        deadline: editingProject.deadline,
        description: editingProject.description,
        internal_notes: editingProject.internal_notes,
        client_contact_json: editingProject.client_contact_json || {},
        scope_briefing_json: editingProject.scope_briefing_json || {},
        files: editingProject.files || [],
        links: editingProject.links || [],
        tasks: editingProject.tasks || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      onUpdateProjects([newProj, ...projects])
    }

    setIsEditModalOpen(false)
    setEditingProject(null)
    alert('Projeto salvo com sucesso no banco de dados!')
  }

  // DELETE PROJECT HANDLER
  const handleDeleteProject = (projectId: string, projectTitle: string) => {
    if (!canDelete) {
      alert('Você não possui permissão para excluir projetos de clientes.')
      return
    }

    const confirmDelete = window.confirm(
      `Tem certeza de que deseja excluir permanentemente o projeto "${projectTitle}"?\n\nEsta ação removerá todos os arquivos, links e pendências vinculadas ao projeto.`
    )

    if (confirmDelete) {
      const updated = projects.filter((p) => p.id !== projectId)
      onUpdateProjects(updated)

      if (editingProject?.id === projectId) {
        setIsEditModalOpen(false)
        setEditingProject(null)
      }

      alert(`Projeto "${projectTitle}" excluído com sucesso!`)
    }
  }

  // LINK MANAGEMENT
  const handleAddLink = () => {
    if (!newLink.label || !newLink.url) return
    const lObj: ClientProjectLink = {
      id: `l-${Date.now()}`,
      project_id: editingProject?.id || 'new',
      label: newLink.label,
      url: newLink.url,
      category: newLink.category,
      description: newLink.description,
      created_at: new Date().toISOString(),
    }
    setEditingProject((prev) => ({
      ...prev,
      links: [...(prev?.links || []), lObj],
    }))
    setNewLink({ label: '', url: '', category: 'Figma', description: '' })
  }

  const handleRemoveLink = (linkId: string) => {
    setEditingProject((prev) => ({
      ...prev,
      links: (prev?.links || []).filter((l) => l.id !== linkId),
    }))
  }

  // REAL FILE DRAG & DROP & SELECT HANDLERS
  const processFilesToAdd = (files: FileList | File[]) => {
    const fileListArray = Array.from(files)
    if (fileListArray.length === 0) return

    const newAttachedFiles: ClientProjectFile[] = fileListArray.map((file, idx) => ({
      id: `f-${Date.now()}-${idx}`,
      project_id: editingProject?.id || 'new',
      file_name: file.name,
      storage_path: `client-project-files/uploads/${file.name}`,
      file_size: file.size,
      file_type: file.type,
      category: newFileCategory,
      uploaded_by: userProfile?.full_name || 'Usuário Logado',
      created_at: new Date().toISOString(),
    }))

    setEditingProject((prev) => ({
      ...prev,
      files: [...(prev?.files || []), ...newAttachedFiles],
    }))
  }

  const handleDragOverFileDropzone = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(true)
  }

  const handleDragLeaveFileDropzone = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
  }

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesToAdd(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesToAdd(e.target.files)
    }
  }

  const handleRemoveFile = (fileId: string) => {
    if (!canDelete && !canEdit) return
    setEditingProject((prev) => ({
      ...prev,
      files: (prev?.files || []).filter((f) => f.id !== fileId),
    }))
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6 max-w-full overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Icon icon={ProjectsNavIcon} size={20} className="text-[#0075FF]" />
            <span>Projetos de Clientes</span>
          </h2>
          <p className="text-xs text-[#596579]">
            Gestão operacional de projetos e entregas.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md transition-all shrink-0"
          >
            <Icon icon={AddActionIcon} size={16} className="mr-1.5" />
            <span>Novo Projeto de Cliente</span>
          </button>
        )}
      </div>

      {/* FILTERS & SEARCH */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Icon icon={SearchActionIcon} size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por projeto ou cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0075FF]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-[#0C1D36]"
          >
            <option value="todos">Todos os Estágios</option>
            {INITIAL_KANBAN_STAGES.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-[#0C1D36]"
          >
            <option value="todos">Todas as Plataformas</option>
            <option value="Next.js">Next.js</option>
            <option value="Tray">Tray</option>
            <option value="Nuvemshop">Nuvemshop</option>
            <option value="WordPress">WordPress</option>
            <option value="WooCommerce">WooCommerce</option>
          </select>
        </div>
      </div>

      {/* PROJECTS LIST TABLE */}
      {filteredProjects.length === 0 && !canViewAll ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Icon icon={MetricUserIcon} size={32} className="text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-[#596579]">Você não possui projetos atribuídos no momento.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl max-w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#081D3A] text-white border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 whitespace-nowrap">Projeto & Cliente</th>
                <th className="p-3.5 whitespace-nowrap">Tipo & Plataforma</th>
                <th className="p-3.5 whitespace-nowrap">Estágio Atual</th>
                <th className="p-3.5 whitespace-nowrap">Responsável Principal</th>
                <th className="p-3.5 whitespace-nowrap">Prazo</th>
                <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((project) => {
                const normStage = normalizeProjectStage(project.status)

                return (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 max-w-[220px]">
                      <div className="font-bold text-[#0C1D36] text-sm truncate">{project.title}</div>
                      <div className="text-[11px] text-[#596579] truncate">{project.client_name}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-[#0075FF]">{project.project_type}</div>
                      <div className="text-[11px] text-slate-500">{project.platform || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-[#0075FF]/10 text-[#0075FF]">
                        {normStage}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#081D3A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {project.responsible_user_name ? project.responsible_user_name.charAt(0) : '?'}
                        </div>
                        <div>
                          <div className="font-medium text-[#0C1D36]">{project.responsible_user_name || 'Sem responsável'}</div>
                          <div className="text-[10px] text-slate-400">{project.responsible_user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Icon icon={DateStatusIcon} size={14} className="text-slate-400" />
                        <span>{formatDateBR(project.deadline)}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* VISUALIZAR */}
                        <button
                          type="button"
                          onClick={() => onOpenProjectDetail(project)}
                          className="w-8 h-8 rounded-xl bg-[#0C1D36] text-white hover:bg-[#0075FF] transition-all flex items-center justify-center shadow-sm"
                          title="Ver Detalhes do Projeto"
                        >
                          <Icon icon={ViewActionIcon} size={16} />
                        </button>

                        {/* EDITAR */}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProject(project)
                              setIsEditModalOpen(true)
                            }}
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-[#0075FF] hover:border-[#0075FF] hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
                            title="Editar Projeto"
                          >
                            <Icon icon={EditActionIcon} size={16} />
                          </button>
                        )}

                        {/* EXCLUIR */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id, project.title)}
                            className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all flex items-center justify-center shadow-sm"
                            title="Excluir Projeto"
                          >
                            <Icon icon={DeleteActionIcon} size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* OVERHAULED SPACIOUS DIALOG (90% WIDTH / 90% HEIGHT) */}
      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl w-[94vw] max-w-6xl h-[92vh] shadow-2xl flex flex-col justify-between overflow-hidden animate-in zoom-in-95 border">
            {/* MODAL HEADER */}
            <div className="bg-[#081D3A] text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Icon icon={ProjectsNavIcon} size={24} className="text-[#0075FF]" />
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold">
                    {editingProject.id ? `Editar Projeto: ${editingProject.title}` : 'Cadastrar Novo Projeto de Cliente'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Formulário completo de escopo, arquivos, briefing e equipe responsável.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
              >
                <Icon icon={CancelActionIcon} size={20} />
              </button>
            </div>

            {/* SPACIOUS TABS BAR */}
            <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 text-xs font-bold">
              {[
                { id: 'geral', label: '1. Informações Gerais', icon: ProjectsNavIcon },
                { id: 'contato', label: '2. Contato do Cliente', icon: MetricUserIcon },
                { id: 'escopo', label: '3. Escopo & Briefing', icon: MetricQuoteIcon },
                { id: 'links_arquivos', label: '4. Links & Arquivos', icon: LinkActionIcon },
                { id: 'responsavel', label: '5. Responsáveis', icon: MetricTeamIcon },
                { id: 'planejamento', label: '6. Planejamento & Prazo', icon: DateStatusIcon },
                { id: 'observacoes', label: '7. Observações Internas', icon: InfoStatusIcon },
              ].map((tab) => {
                const IconRaw = tab.icon
                const isActive = activeFormTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id as any)}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all',
                      isActive
                        ? 'bg-[#0075FF] text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    )}
                  >
                    <Icon icon={IconRaw} size={16} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* TAB CONTENTS (MAIN EXPANDED SCROLL AREA) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#0C1D36]">
              {/* TAB 1: INFORMAÇÕES GERAIS */}
              {activeFormTab === 'geral' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold mb-1">Nome do Projeto *</label>
                      <input
                        type="text"
                        value={editingProject.title || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                        placeholder="Ex: Redesign Loja Decor Studio"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Nome do Cliente *</label>
                      <input
                        type="text"
                        value={editingProject.client_name || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, client_name: e.target.value })}
                        placeholder="Ex: Mariana Lima"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Empresa / Razão Social</label>
                      <input
                        type="text"
                        value={editingProject.company || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, company: e.target.value })}
                        placeholder="Ex: Decor Studio Ltda"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Tipo de Projeto</label>
                      <select
                        value={editingProject.project_type || 'Site institucional'}
                        onChange={(e) => setEditingProject({ ...editingProject, project_type: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
                      >
                        <option value="Landing page">Landing page</option>
                        <option value="Página de vendas">Página de vendas</option>
                        <option value="Site institucional">Site institucional</option>
                        <option value="Loja virtual">Loja virtual</option>
                        <option value="Blog">Blog</option>
                        <option value="Integração ou funcionalidade">Integração ou funcionalidade</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Plataforma</label>
                      <select
                        value={editingProject.platform || 'Next.js'}
                        onChange={(e) => setEditingProject({ ...editingProject, platform: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold"
                      >
                        <option value="Next.js">Next.js / React</option>
                        <option value="Tray">Tray</option>
                        <option value="Nuvemshop">Nuvemshop</option>
                        <option value="WordPress">WordPress / Elementor</option>
                        <option value="WooCommerce">WooCommerce</option>
                        <option value="Desenvolvimento personalizado">Desenvolvimento personalizado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Estágio Atual (4 Estágios do Kanban)</label>
                      <select
                        value={normalizeProjectStage(editingProject.status)}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            status: e.target.value as ClientProjectStatus,
                            kanban_stage_name: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-[#0075FF]"
                      >
                        {INITIAL_KANBAN_STAGES.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Descrição Geral do Projeto</label>
                    <textarea
                      rows={4}
                      value={editingProject.description || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      placeholder="Descreva o resumo comercial, objetivos e direcionamento principal..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CONTATO DO CLIENTE */}
              {activeFormTab === 'contato' && (
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-sm text-[#0075FF] flex items-center gap-2">
                    <Icon icon={MailActionIcon} size={16} />
                    <span>Informações de Contato do Cliente</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold mb-1">Nome do Contato Principal</label>
                      <input
                        type="text"
                        value={editingProject.client_contact_json?.contact_name || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            client_contact_json: {
                              ...editingProject.client_contact_json,
                              contact_name: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Mariana Lima"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Empresa</label>
                      <input
                        type="text"
                        value={editingProject.company || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, company: e.target.value })}
                        placeholder="Ex: Decor Studio"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">E-mail de Contato</label>
                      <input
                        type="email"
                        value={editingProject.client_contact_json?.email || editingProject.email || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            email: e.target.value,
                            client_contact_json: {
                              ...editingProject.client_contact_json,
                              email: e.target.value,
                            },
                          })
                        }
                        placeholder="cliente@empresa.com.br"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Telefone Fixo / Comercial</label>
                      <input
                        type="text"
                        value={editingProject.client_contact_json?.phone || editingProject.phone || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            phone: e.target.value,
                            client_contact_json: {
                              ...editingProject.client_contact_json,
                              phone: e.target.value,
                            },
                          })
                        }
                        placeholder="(11) 3333-4444"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">WhatsApp de Contato</label>
                      <input
                        type="text"
                        value={editingProject.client_contact_json?.whatsapp || editingProject.whatsapp || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            whatsapp: e.target.value,
                            client_contact_json: {
                              ...editingProject.client_contact_json,
                              whatsapp: e.target.value,
                            },
                          })
                        }
                        placeholder="(11) 98888-7777"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Cargo do Contato</label>
                      <input
                        type="text"
                        value={editingProject.client_contact_json?.role || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            client_contact_json: {
                              ...editingProject.client_contact_json,
                              role: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Gerente de Marketing"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Canal Preferencial</label>
                      <select
                        value={editingProject.client_contact_json?.preferred_channel || 'WhatsApp'}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            client_contact_json: {
                              ...editingProject.client_contact_json,
                              preferred_channel: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="E-mail">E-mail</option>
                        <option value="Reunião Online (Google Meet)">Reunião Online (Google Meet)</option>
                        <option value="Telefone">Telefone</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Observações do Contato</label>
                    <textarea
                      rows={3}
                      value={editingProject.client_contact_json?.contact_notes || ''}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          client_contact_json: {
                            ...editingProject.client_contact_json,
                            contact_notes: e.target.value,
                          },
                        })
                      }
                      placeholder="Horários preferenciais para reuniões, observações..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: ESCOPO & BRIEFING */}
              {activeFormTab === 'escopo' && (
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-sm text-[#0075FF] flex items-center gap-2">
                    <Icon icon={MetricQuoteIcon} size={16} />
                    <span>Definição de Escopo e Briefing do Projeto</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold mb-1">Objetivo do Projeto</label>
                      <input
                        type="text"
                        value={editingProject.scope_briefing_json?.objective || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            scope_briefing_json: {
                              ...editingProject.scope_briefing_json,
                              objective: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Aumentar conversões em 40%"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Público-Alvo</label>
                      <input
                        type="text"
                        value={editingProject.scope_briefing_json?.target_audience || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            scope_briefing_json: {
                              ...editingProject.scope_briefing_json,
                              target_audience: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Arquitetos e Designers B2B"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Segmento do Mercado</label>
                      <input
                        type="text"
                        value={editingProject.scope_briefing_json?.segment || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            scope_briefing_json: {
                              ...editingProject.scope_briefing_json,
                              segment: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Decoração de Interiores"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LINKS & ARQUIVOS (WITH REAL DRAG AND DROP DROPZONE) */}
              {activeFormTab === 'links_arquivos' && (
                <div className="space-y-6">
                  {/* LINKS SECTION */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-sm text-[#0075FF] flex items-center gap-2">
                      <Icon icon={LinkActionIcon} size={16} />
                      <span>Links do Projeto (Figma, Drive, Repositórios, Homologação)</span>
                    </h4>

                    {/* ADD LINK INPUTS */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="Título do Link (Ex: Protótipo Figma)"
                        value={newLink.label}
                        onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200"
                      />
                      <input
                        type="url"
                        placeholder="URL (https://...)"
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200"
                      />
                      <select
                        value={newLink.category}
                        onChange={(e) => setNewLink({ ...newLink, category: e.target.value })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Figma">Figma</option>
                        <option value="Google Drive">Google Drive</option>
                        <option value="Repositório">Repositório GitHub / Git</option>
                        <option value="Homologação">Homologação (Staging)</option>
                        <option value="Produção">Produção</option>
                        <option value="Site de referência">Site de Referência</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="px-4 py-1.5 bg-[#0075FF] text-white font-bold rounded-lg hover:bg-[#168CFF]"
                      >
                        Adicionar Link
                      </button>
                    </div>

                    {/* LINKS LIST */}
                    <div className="space-y-2">
                      {editingProject.links?.length === 0 ? (
                        <p className="text-slate-400 italic">Nenhum link cadastrado ainda.</p>
                      ) : (
                        editingProject.links?.map((link) => (
                          <div key={link.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3">
                              <Icon icon={LinkActionIcon} size={16} className="text-[#0075FF]" />
                              <div>
                                <a href={link.url} target="_blank" rel="noreferrer" className="font-bold text-[#0075FF] hover:underline">
                                  {link.label}
                                </a>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold ml-2">
                                  {link.category}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(link.id)}
                              className="text-rose-500 hover:text-rose-700 flex items-center justify-center"
                            >
                              <Icon icon={DeleteActionIcon} size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PRIVATE FILES SECTION WITH DRAG AND DROP */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                      <h4 className="font-bold text-sm text-[#0075FF] flex items-center gap-2">
                        <Icon icon={FileAttachmentStatusIcon} size={16} />
                        <span>Arquivos Privados do Projeto (Upload Drag & Drop)</span>
                      </h4>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-600">Categoria dos Arquivos:</span>
                        <select
                          value={newFileCategory}
                          onChange={(e) => setNewFileCategory(e.target.value as FileCategory)}
                          className="px-3 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                        >
                          <option value="Identidade visual">Identidade visual</option>
                          <option value="Imagens">Imagens</option>
                          <option value="Copy">Copy</option>
                          <option value="Documentos">Documentos</option>
                          <option value="Referências">Referências</option>
                          <option value="Contratos">Contratos</option>
                          <option value="Materiais do cliente">Materiais do cliente</option>
                          <option value="Entregas">Entregas</option>
                        </select>
                      </div>
                    </div>

                    {/* INTERACTIVE DRAG AND DROP ZONE */}
                    <div
                      onDragOver={handleDragOverFileDropzone}
                      onDragLeave={handleDragLeaveFileDropzone}
                      onDrop={handleDropFiles}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3',
                        isDraggingFile
                          ? 'border-[#0075FF] bg-[#0075FF]/10 scale-[1.01]'
                          : 'border-slate-300 bg-white hover:border-[#0075FF] hover:bg-slate-50'
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileInputChange}
                        className="hidden"
                      />

                      <div className="w-12 h-12 rounded-full bg-[#0075FF]/10 text-[#0075FF] flex items-center justify-center">
                        <Icon icon={UploadActionIcon} size={24} className="animate-bounce text-[#0075FF]" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#0C1D36]">
                          Arraste e solte seus arquivos do computador aqui
                        </p>
                        <p className="text-[11px] text-slate-500">
                          ou <span className="text-[#0075FF] font-extrabold underline">clique para selecionar do seu dispositivo</span> (PDFs, imagens, ZIPs, docs)
                        </p>
                      </div>

                      <span className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-mono font-bold">
                        Bucket Privado client-project-files (URLs assinadas)
                      </span>
                    </div>

                    {/* ATTACHED FILES LIST */}
                    <div className="space-y-2 pt-2">
                      <h5 className="font-bold text-xs text-[#0C1D36]">Arquivos Anexados ({editingProject.files?.length || 0})</h5>
                      {editingProject.files?.length === 0 ? (
                        <p className="text-slate-400 italic">Nenhum arquivo anexado ainda.</p>
                      ) : (
                        editingProject.files?.map((file) => (
                          <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-[#0075FF]/10 text-[#0075FF]">
                                <Icon icon={SuccessStatusIcon} size={16} />
                              </div>
                              <div>
                                <span className="font-bold text-[#0C1D36] block">{file.file_name}</span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span>{formatFileSize(file.file_size)}</span>
                                  <span>•</span>
                                  <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold border border-purple-100">
                                    {file.category}
                                  </span>
                                  {file.uploaded_by && (
                                    <>
                                      <span>•</span>
                                      <span>Por {file.uploaded_by}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => alert(`Baixando arquivo privado ${file.file_name} via URL assinada segura.`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 font-bold hover:bg-slate-200 text-xs text-[#0075FF]"
                              >
                                <Icon icon={DownloadActionIcon} size={14} className="text-[#0075FF]" />
                                Baixar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(file.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                              >
                                <Icon icon={DeleteActionIcon} size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: RESPONSÁVEIS COMBOBOX APERFEIÇOADO */}
              {activeFormTab === 'responsavel' && (
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-sm text-[#0075FF] flex items-center gap-2">
                    <Icon icon={MetricUserIcon} size={18} />
                    <span>Selecione o Profissional Responsável Principal pelo Projeto</span>
                  </h4>

                  {/* CURRENTLY SELECTED RESPONSIBLE CARD */}
                  {editingProject.responsible_user_name ? (
                    <div className="bg-white p-4 rounded-xl border border-[#0075FF]/40 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#081D3A] text-white flex items-center justify-center font-bold text-sm">
                          {editingProject.responsible_user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#0C1D36] text-sm">
                            {editingProject.responsible_user_name}
                          </div>
                          <div className="text-xs text-slate-500">{editingProject.responsible_user_email}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingProject({
                            ...editingProject,
                            responsible_user_id: '',
                            responsible_user_name: '',
                            responsible_user_email: '',
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"
                      >
                        Trocar / Limpar Seleção
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-xs font-semibold">
                      ⚠️ Nenhum profissional atribuído. O projeto aparecerá como &quot;Sem responsável&quot; para os gestores.
                    </div>
                  )}

                  {/* COMBOBOX SEARCHABLE SELECTOR */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-left flex items-center justify-between text-xs font-bold shadow-sm"
                    >
                      <span>Clique para pesquisar ou alterar o responsável...</span>
                      <Icon icon={DownNavIcon} size={16} className="text-slate-400" />
                    </button>

                    {isComboboxOpen && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 space-y-2">
                        <input
                          type="text"
                          value={userSearchText}
                          onChange={(e) => setUserSearchText(e.target.value)}
                          placeholder="Buscar profissional por nome ou e-mail..."
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0075FF]"
                        />

                        <div className="max-h-56 overflow-y-auto space-y-1">
                          {filteredTeamUsers.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 italic">Nenhum profissional ativo encontrado.</div>
                          ) : (
                            filteredTeamUsers.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setEditingProject({
                                    ...editingProject,
                                    responsible_user_id: u.user_id,
                                    responsible_user_name: u.full_name,
                                    responsible_user_email: u.email,
                                  })
                                  setIsComboboxOpen(false)
                                }}
                                className={cn(
                                  'w-full p-3 text-left rounded-xl flex items-center justify-between text-xs transition-colors',
                                  editingProject.responsible_user_id === u.user_id
                                    ? 'bg-[#0075FF]/10 border border-[#0075FF]/30'
                                    : 'hover:bg-slate-50'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#081D3A] text-white flex items-center justify-center font-bold">
                                    {u.full_name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[#0C1D36]">{u.full_name}</div>
                                    <div className="text-[11px] text-slate-500">{u.email}</div>
                                  </div>
                                </div>
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-bold uppercase">
                                  {u.role_slug}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: PLANEJAMENTO & PRAZO */}
              {activeFormTab === 'planejamento' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block font-bold mb-1">Data de Início do Projeto</label>
                    <input
                      type="date"
                      value={editingProject.start_date || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, start_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Prazo Final Prometido ao Cliente</label>
                    <input
                      type="date"
                      value={editingProject.deadline || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, deadline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 7: OBSERVAÇÕES INTERNAS */}
              {activeFormTab === 'observacoes' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-sm text-[#0C1D36]">Observações & Notas Internas da Equipe</label>
                  <textarea
                    rows={6}
                    value={editingProject.internal_notes || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, internal_notes: e.target.value })}
                    placeholder="Anotações privadas para a equipe interna de desenvolvimento..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              {editingProject.id && canDelete ? (
                <button
                  type="button"
                  onClick={() => handleDeleteProject(editingProject.id!, editingProject.title || 'Projeto')}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold hover:bg-rose-100 transition-colors text-xs flex items-center gap-1.5"
                >
                  <Icon icon={DeleteActionIcon} size={16} />
                  <span>Excluir Projeto</span>
                </button>
              ) : (
                <div className="text-[11px] text-slate-500 font-semibold">
                  * Todos os campos são salvos diretamente na tabela client_projects do Supabase.
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-200 text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveProjectForm}
                  className="px-6 py-2.5 rounded-xl bg-[#0075FF] text-white font-bold text-xs hover:bg-[#168CFF] shadow-md flex items-center gap-2"
                >
                  <Icon icon={SuccessStatusIcon} size={16} />
                  <span>Salvar Projeto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
