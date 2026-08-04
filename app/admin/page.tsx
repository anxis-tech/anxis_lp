'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Project,
  Technology,
  ServiceItem,
  Testimonial,
  FAQItem,
  Lead,
  SiteSettings,
} from '@/types/database.types'
import {
  INITIAL_SITE_SETTINGS,
  INITIAL_SERVICES,
  INITIAL_PROJECTS,
  INITIAL_TECHNOLOGIES,
  INITIAL_FAQS,
  INITIAL_TESTIMONIALS,
} from '@/lib/constants/initial-data'
import {
  LayoutDashboard,
  FolderKanban,
  Cpu,
  Layers,
  MessageSquare,
  HelpCircle,
  Users,
  Settings,
  Globe,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Save,
  Search,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('projetos')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // State entities
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [technologies, setTechnologies] = useState<Technology[]>(INITIAL_TECHNOLOGIES)
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES)
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS)
  const [faqs, setFaqs] = useState<FAQItem[]>(INITIAL_FAQS)
  const [leads, setLeads] = useState<Lead[]>([])

  // Project Modal State
  const [searchProject, setSearchProject] = useState('')
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)

  useEffect(() => {
    fetchInitialAdminData()
  }, [])

  const fetchInitialAdminData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        router.push('/admin/login')
        return
      }

      // Fetch database items if available
      const [
        { data: sData },
        { data: pData },
        { data: tData },
        { data: servData },
        { data: testData },
        { data: fData },
        { data: lData },
      ] = await Promise.all([
        supabase.from('site_settings').select('*').single(),
        supabase.from('projects').select('*').order('display_order', { ascending: true }),
        supabase.from('technologies').select('*').order('display_order', { ascending: true }),
        supabase.from('services').select('*').order('display_order', { ascending: true }),
        supabase.from('testimonials').select('*').order('display_order', { ascending: true }),
        supabase.from('faq_items').select('*').order('display_order', { ascending: true }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
      ])

      if (sData) setSettings(sData)
      if (pData) setProjects(pData)
      if (tData) setTechnologies(tData)
      if (servData) setServices(servData)
      if (testData) setTestimonials(testData)
      if (fData) setFaqs(fData)
      if (lData) setLeads(lData)
    } catch (e) {
      console.log('Running admin in offline/demo mode.')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // --- PROJECT CRUD ACTIONS ---
  const handleSaveProject = () => {
    if (!editingProject?.title) return

    if (editingProject.id) {
      // Update existing
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? ({ ...p, ...editingProject } as Project) : p))
      )
    } else {
      // Create new
      const newProj: Project = {
        id: `p-${Date.now()}`,
        title: editingProject.title || 'Novo Projeto',
        client: editingProject.client || 'Cliente Exemplo',
        category: editingProject.category || 'institucional',
        short_description: editingProject.short_description || '',
        desktop_image_url: editingProject.desktop_image_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faAEA6?q=80&w=1200&auto=format&fit=crop',
        project_url: editingProject.project_url || '#',
        technologies: editingProject.technologies || ['Next.js', 'Tailwind CSS'],
        year: editingProject.year || '2026',
        is_featured: editingProject.is_featured || false,
        is_visible: editingProject.is_visible ?? true,
        display_order: projects.length + 1,
      }
      setProjects((prev) => [...prev, newProj])
    }

    setIsProjectModalOpen(false)
    setEditingProject(null)
    triggerSaveFeedback()
  }

  const toggleProjectVisibility = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_visible: !p.is_visible } : p))
    )
    triggerSaveFeedback()
  }

  const toggleProjectFeatured = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_featured: !p.is_featured } : p))
    )
    triggerSaveFeedback()
  }

  const handleDeleteProject = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
      triggerSaveFeedback()
    }
  }

  const triggerSaveFeedback = () => {
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }, 600)
  }

  const tabs = [
    { id: 'projetos', label: 'Projetos (Cases)', icon: FolderKanban },
    { id: 'tecnologias', label: 'Tecnologias', icon: Cpu },
    { id: 'servicos', label: 'Serviços', icon: Layers },
    { id: 'depoimentos', label: 'Depoimentos', icon: MessageSquare },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'leads', label: 'Leads Capturados', icon: Users, badge: leads.length },
    { id: 'configuracoes', label: 'Configurações & SEO', icon: Settings },
  ]

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchProject.toLowerCase()) ||
      p.client?.toLowerCase().includes(searchProject.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0C1D36] flex flex-col font-sans">
      {/* ADMIN HEADER */}
      <header className="bg-[#081D3A] text-white py-4 px-6 sticky top-0 z-30 shadow-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-8">
            <Image src="/images/logo-dark.svg" alt="ANXIS Admin" fill className="object-contain" />
          </div>
          <span className="text-xs bg-[#0075FF] text-white font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
            PAINEL DE CONTROLE
          </span>
        </div>

        <div className="flex items-center gap-4">
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Alterações Salvas
            </span>
          )}

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 px-3.5 py-2 rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4 mr-1.5 text-[#0075FF]" />
            <span>Ver Site Ao Vivo</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-60" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3.5 py-2 rounded-lg transition-colors border border-rose-500/20"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD BODY */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-8">
        {/* SIDEBAR TABS */}
        <aside className="w-64 shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-fit space-y-2 sticky top-24 hidden md:block">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#596579] px-3 py-1">
            Gerenciamento
          </h3>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left',
                    isActive
                      ? 'bg-[#0075FF] text-white shadow-md'
                      : 'text-[#0C1D36] hover:bg-slate-100 hover:text-[#0075FF]'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-extrabold', isActive ? 'bg-white text-[#0075FF]' : 'bg-slate-200 text-[#0C1D36]')}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 space-y-6">
          {/* TAB 1: PROJETOS (CRUD) */}
          {activeTab === 'projetos' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0C1D36]">Gerenciamento de Projetos</h2>
                  <p className="text-xs text-[#596579]">Adicione, edite, oculte ou reordene os cases do seu portfólio.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProject({
                      category: 'institucional',
                      is_visible: true,
                      is_featured: false,
                      technologies: ['Next.js', 'Tailwind CSS'],
                    })
                    setIsProjectModalOpen(true)
                  }}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md transition-all"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Novo Projeto</span>
                </button>
              </div>

              {/* SEARCH BAR */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchProject}
                  onChange={(e) => setSearchProject(e.target.value)}
                  placeholder="Buscar projeto por título ou cliente..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-[#0C1D36] outline-none focus:border-[#0075FF]"
                />
              </div>

              {/* PROJECTS TABLE / CARDS */}
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 gap-4 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 relative rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-800">
                        <img
                          src={project.desktop_image_url}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#0C1D36]">{project.title}</h4>
                          {project.is_featured && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" /> Destaque
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#596579]">
                          {project.client} • <span className="font-mono text-[#0075FF]">{project.category}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => toggleProjectFeatured(project.id)}
                        className={cn('p-2 rounded-lg border text-xs font-bold transition-colors', project.is_featured ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-400')}
                        title="Alternar Destaque"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleProjectVisibility(project.id)}
                        className={cn('p-2 rounded-lg border text-xs font-bold transition-colors', project.is_visible ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600')}
                        title={project.is_visible ? 'Projeto Visível' : 'Projeto Oculto'}
                      >
                        {project.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(project)
                          setIsProjectModalOpen(true)
                        }}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#0075FF] transition-colors"
                        title="Editar Projeto"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir Projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LEADS */}
          {activeTab === 'leads' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#0C1D36]">Leads & Propostas Capturadas</h2>
                <p className="text-xs text-[#596579]">Lista de propostas recebidas através da landing page com dados de UTM.</p>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#596579]">Nenhuma proposta recebida até o momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <h4 className="text-base font-bold text-[#0C1D36]">{lead.name}</h4>
                          <p className="text-xs text-[#596579]">{lead.company ? `${lead.company} • ` : ''}{lead.email} • {lead.whatsapp}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0075FF]/10 text-[#0075FF] px-2.5 py-1 rounded">
                          {lead.project_type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#596579]">
                        <div><span className="font-semibold text-[#0C1D36]">Plataforma:</span> {lead.current_platform || 'N/I'}</div>
                        <div><span className="font-semibold text-[#0C1D36]">Orçamento:</span> {lead.budget_range || 'N/I'}</div>
                        <div><span className="font-semibold text-[#0C1D36]">Prazo:</span> {lead.desired_deadline || 'N/I'}</div>
                        <div><span className="font-semibold text-[#0C1D36]">Origem:</span> {lead.utm_source || 'Direto'}</div>
                      </div>

                      {lead.message && (
                        <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 italic">
                          "{lead.message}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS & SEO */}
          {activeTab === 'configuracoes' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#0C1D36]">Configurações Gerais & Scripts SEO</h2>
                <p className="text-xs text-[#596579]">Altere contatos, WhatsApp e IDs de pixels de campanhas (GTM/Meta).</p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-1">Empresa</label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-1">WhatsApp (com DDD)</label>
                  <input
                    type="text"
                    value={settings.whatsapp}
                    onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-1">Google Tag Manager ID (ex: GTM-XXXXXX)</label>
                  <input
                    type="text"
                    value={settings.gtm_id || ''}
                    onChange={(e) => setSettings({ ...settings, gtm_id: e.target.value })}
                    placeholder="GTM-XXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0C1D36] mb-1">Meta Pixel ID (Facebook Ads)</label>
                  <input
                    type="text"
                    value={settings.meta_pixel_id || ''}
                    onChange={(e) => setSettings({ ...settings, meta_pixel_id: e.target.value })}
                    placeholder="1234567890"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={triggerSaveFeedback}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md transition-all"
                >
                  <Save className="w-4 h-4 mr-2" />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL EDIT PROJECT */}
      {isProjectModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-extrabold text-[#0C1D36]">
              {editingProject.id ? 'Editar Case de Portfólio' : 'Cadastrar Novo Case'}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Título do Projeto</label>
                <input
                  type="text"
                  value={editingProject.title || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Cliente</label>
                <input
                  type="text"
                  value={editingProject.client || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Categoria</label>
                <select
                  value={editingProject.category || 'institucional'}
                  onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="institucional">Site Institucional</option>
                  <option value="e-commerce">Loja Virtual</option>
                  <option value="landing-page">Landing Page</option>
                  <option value="personalizado">Projeto Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">URL da Screenshot Vertical</label>
                <input
                  type="text"
                  value={editingProject.desktop_image_url || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, desktop_image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0C1D36] mb-1">Descrição Curta</label>
                <textarea
                  rows={3}
                  value={editingProject.short_description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, short_description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#596579] hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProject}
                className="px-5 py-2.5 rounded-xl bg-[#0075FF] text-white text-xs font-bold hover:bg-[#168CFF] shadow-md"
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
