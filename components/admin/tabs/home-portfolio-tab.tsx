'use client'

import { useState } from 'react'
import { Project } from '@/types/database.types'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Star, Sparkles, Globe } from 'lucide-react'
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

  const handleDelete = async (id: string) => {
    if (!canDelete) return
    if (confirm('Tem certeza que deseja remover este projeto da landing page?')) {
      const updated = projects.filter((p) => p.id !== id)
      onUpdateProjects(updated)
      await deleteHomeProjectAction(id)
    }
  }

  const handleSave = async () => {
    if (!editingProject?.title || !canEdit) return

    let targetProj: any = editingProject

    if (editingProject.id) {
      const updated = projects.map((p) =>
        p.id === editingProject.id ? ({ ...p, ...editingProject } as Project) : p
      )
      onUpdateProjects(updated)
    } else {
      const newP: Project = {
        id: `proj-${Date.now()}`,
        title: editingProject.title || 'Novo Projeto',
        client: editingProject.client || 'Cliente',
        category: editingProject.category || 'institucional',
        short_description: editingProject.short_description || '',
        desktop_image_url:
          editingProject.desktop_image_url ||
          'https://images.unsplash.com/photo-1618221195710-dd6b41faAEA6?q=80&w=1200&auto=format&fit=crop',
        project_url: editingProject.project_url || 'https://anxis.com.br',
        button_label: editingProject.button_label || 'Ver Projeto',
        open_new_tab: editingProject.open_new_tab ?? true,
        technologies: editingProject.technologies || ['Next.js', 'Tailwind CSS'],
        year: editingProject.year || '2026',
        accent_color: editingProject.accent_color || '#0075FF',
        is_featured: editingProject.is_featured ?? false,
        is_visible: editingProject.is_visible ?? true,
        display_order: projects.length + 1,
      }
      targetProj = newP
      onUpdateProjects([...projects, newP])
    }

    await saveHomeProjectAction({
      ...targetProj,
      image_url: targetProj.desktop_image_url || targetProj.image_url,
      description: targetProj.short_description || targetProj.description,
      live_url: targetProj.project_url || targetProj.live_url,
      is_published: targetProj.is_visible ?? targetProj.is_published ?? true,
    })

    setIsModalOpen(false)
    setEditingProject(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0075FF]" />
            <span>Portfólio da Home</span>
          </h2>
          <p className="text-xs text-[#596579]">
            Gerencie os cases demonstrativos exibidos publicamente na landing page da ANXIS.
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
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Adicionar Projeto à Home</span>
          </button>
        )}
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
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
                      <Star className="w-3 h-3 fill-current" /> Destaque
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
                        'p-2 rounded-lg border text-xs font-bold transition-colors',
                        project.is_featured
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-white border-slate-200 text-slate-400'
                      )}
                      title="Alternar Destaque"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(project.id)}
                      className={cn(
                        'p-2 rounded-lg border text-xs font-bold transition-colors',
                        project.is_visible
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-rose-50 border-rose-200 text-rose-600'
                      )}
                      title={project.is_visible ? 'Publicado' : 'Oculto'}
                    >
                      {project.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(project)
                        setIsModalOpen(true)
                      }}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#0075FF]"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-[#0C1D36]">
              {editingProject.id ? 'Editar Projeto do Portfólio' : 'Novo Projeto no Portfólio'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Título do Case</label>
                <input
                  type="text"
                  value={editingProject.title || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

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
                  <option value="institucional">Site Institucional</option>
                  <option value="e-commerce">Loja Virtual</option>
                  <option value="landing-page">Landing Page</option>
                  <option value="personalizado">Projeto Sob Medida</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">URL da Screenshot Vertical</label>
                <input
                  type="text"
                  value={editingProject.desktop_image_url || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, desktop_image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
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
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#0075FF] text-white text-xs font-bold hover:bg-[#168CFF]"
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
