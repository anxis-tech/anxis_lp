'use client'

import { useState } from 'react'
import { Project } from '@/types/database.types'
import { Icon } from '@/components/ui/icon'
import { PortfolioNavIcon } from '@/lib/icons/navigation'
import {
  AddActionIcon,
  EditActionIcon,
  DeleteActionIcon,
  ViewActionIcon,
  HideActionIcon,
  SearchActionIcon,
  StarActionIcon,
  CancelActionIcon,
} from '@/lib/icons/actions'
import { cn } from '@/lib/utils'
import { saveHomeProjectAction, deleteHomeProjectAction } from '@/lib/actions/projects'

interface HomePortfolioTabProps {
  projects: Project[]
  onUpdateProjects: (updated: Project[]) => void
  canEdit: boolean
  canDelete: boolean
  canCreate: boolean
}

export function HomePortfolioTab({
  projects = [],
  onUpdateProjects,
  canEdit = true,
  canDelete = true,
  canCreate = true,
}: HomePortfolioTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleToggleVisibility = (id: string) => {
    if (!canEdit) return
    const updated = projects.map((p) => (p.id === id ? { ...p, is_visible: !p.is_visible } : p))
    onUpdateProjects(updated)
  }

  const handleToggleFeatured = (id: string) => {
    if (!canEdit) return
    const updated = projects.map((p) => (p.id === id ? { ...p, is_featured: !p.is_featured } : p))
    onUpdateProjects(updated)
  }

  const handleSaveModal = async () => {
    if (!editingProject?.title) {
      alert('Preencha o título do projeto.')
      return
    }

    const payload: Project = {
      id: editingProject.id || `proj-${Date.now()}`,
      title: editingProject.title || '',
      category: (editingProject.category as any) || 'institucional',
      client: editingProject.client || '',
      year: editingProject.year || '2026',
      short_description: editingProject.short_description || '',
      full_description: editingProject.full_description || '',
      desktop_image_url: editingProject.desktop_image_url || '/images/hero-desktop.webp',
      mobile_image_url: editingProject.mobile_image_url || '/images/hero-mobile.webp',
      project_url: editingProject.project_url || '',
      technologies: editingProject.technologies || ['Next.js'],
      is_visible: editingProject.is_visible !== undefined ? editingProject.is_visible : true,
      is_featured: editingProject.is_featured !== undefined ? editingProject.is_featured : false,
      display_order: editingProject.display_order || 1,
      created_at: editingProject.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await saveHomeProjectAction(payload)

    if (editingProject.id) {
      onUpdateProjects(projects.map((p) => (p.id === payload.id ? payload : p)))
    } else {
      onUpdateProjects([payload, ...projects])
    }

    setIsModalOpen(false)
    setEditingProject(null)
  }

  const handleDeleteProject = async (id: string) => {
    if (!canDelete) return
    if (!confirm('Deseja excluir este projeto do portfólio público?')) return

    await deleteHomeProjectAction(id)
    onUpdateProjects(projects.filter((p) => p.id !== id))
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-6 max-w-full overflow-hidden font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Icon icon={PortfolioNavIcon} size={20} className="text-[#0075FF]" />
            <span>Portfólio da Home</span>
          </h2>
          <p className="text-xs text-slate-500">
            Gerenciamento dos cases e projetos em destaque na página inicial.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setEditingProject({
                category: 'institucional',
                is_visible: true,
                is_featured: false,
                technologies: ['Next.js', 'Tailwind CSS'],
              })
              setIsModalOpen(true)
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <Icon icon={AddActionIcon} size={16} />
            <span>Adicionar Projeto à Home</span>
          </button>
        )}
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Icon icon={SearchActionIcon} size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0075FF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['todos', 'institucional', 'e-commerce', 'landing-page', 'personalizado'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap',
                selectedCategory === cat
                  ? 'bg-[#081D3A] text-white'
                  : 'bg-slate-100 text-[#596579] hover:bg-slate-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PROJECT LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((project) => (
          <div
            key={project.id}
            className="bg-[#F7F8FA] border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="space-y-3">
              {/* IMAGE PREVIEW */}
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                <img
                  src={project.desktop_image_url}
                  alt={project.title}
                  className="w-full h-full object-cover object-top"
                />
                <span className="absolute top-3 left-3 bg-[#081D3A]/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                  {project.category}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#0C1D36]">{project.title}</h3>
                  {project.is_featured && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <Icon icon={StarActionIcon} size={12} /> Destaque
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#596579] mt-1 line-clamp-2">{project.short_description}</p>
              </div>

              <div className="flex flex-wrap gap-1">
                {project.technologies.map((t, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* CARD ACTIONS */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-[#596579] font-medium">{project.client} • {project.year}</span>

              <div className="flex items-center gap-1.5">
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(project.id)}
                      className={cn(
                        'p-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center',
                        project.is_featured
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-white border-slate-200 text-slate-400'
                      )}
                      title="Alternar Destaque"
                    >
                      <Icon icon={StarActionIcon} size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(project.id)}
                      className={cn(
                        'p-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center',
                        project.is_visible
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-rose-50 border-rose-200 text-rose-600'
                      )}
                      title={project.is_visible ? 'Publicado' : 'Oculto'}
                    >
                      {project.is_visible ? (
                        <Icon icon={ViewActionIcon} size={14} />
                      ) : (
                        <Icon icon={HideActionIcon} size={14} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(project)
                        setIsModalOpen(true)
                      }}
                      className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-[#0075FF] transition-colors flex items-center justify-center"
                      title="Editar"
                    >
                      <Icon icon={EditActionIcon} size={14} />
                    </button>
                  </>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center justify-center"
                    title="Excluir"
                  >
                    <Icon icon={DeleteActionIcon} size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0C1D36]">
                {editingProject.id ? 'Editar Case do Portfólio' : 'Adicionar Novo Case à Home'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <Icon icon={CancelActionIcon} size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Título do Projeto *</label>
                <input
                  type="text"
                  value={editingProject.title || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  placeholder="Ex: Decor Studio - E-commerce de Luxo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Cliente</label>
                  <input
                    type="text"
                    value={editingProject.client || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Categoria</label>
                  <select
                    value={editingProject.category || 'institucional'}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="institucional">Institucional</option>
                    <option value="e-commerce">E-commerce</option>
                    <option value="landing-page">Landing Page</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Descrição Curta</label>
                <textarea
                  rows={2}
                  value={editingProject.short_description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, short_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">URL Imagem Desktop</label>
                <input
                  type="text"
                  value={editingProject.desktop_image_url || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, desktop_image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2 rounded-xl bg-[#0075FF] hover:bg-[#168CFF] text-white font-bold text-xs shadow-md"
              >
                Salvar Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
