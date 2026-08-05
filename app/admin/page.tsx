'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  UserProfileWithRole,
  hasPermission,
  PERMISSIONS,
} from '@/lib/auth/permissions'
import { Project } from '@/types/database.types'
import { ClientProject } from '@/types/client-project.types'
import { SavedQuote, QuoteFormData } from '@/types/pricing.types'
import { INITIAL_PROJECTS } from '@/lib/constants/initial-data'
import { DashboardOverviewTab } from '@/components/admin/tabs/dashboard-overview-tab'
import { HomePortfolioTab } from '@/components/admin/tabs/home-portfolio-tab'
import { ClientProjectsTab, MOCK_CLIENT_PROJECTS_FULL } from '@/components/admin/tabs/client-projects-tab'
import { KanbanBoardTab } from '@/components/admin/tabs/kanban-board-tab'
import { PricingCalculatorTab } from '@/components/admin/tabs/pricing-calculator-tab'
import { QuotesTab, MOCK_SAVED_QUOTES } from '@/components/admin/tabs/quotes-tab'
import { UsersPermissionsTab } from '@/components/admin/tabs/users-permissions-tab'
import {
  LayoutDashboard,
  Globe,
  FolderKanban,
  Kanban,
  Calculator,
  Shield,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Loader2,
  X,
  FileText,
  Paperclip,
  Link as LinkIcon,
  Download,
  Mail,
  User,
  Calendar,
  CheckSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  DollarSign,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const router = useRouter()

  // Unified Auth & Permission Loading Guard
  const [authResolved, setAuthResolved] = useState<boolean>(false)
  const [userProfile, setUserProfile] = useState<UserProfileWithRole | null>(null)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)

  // Live state
  const [homeProjects, setHomeProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [clientProjects, setClientProjects] = useState<ClientProject[]>(MOCK_CLIENT_PROJECTS_FULL)
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>(MOCK_SAVED_QUOTES)
  const [calculatorInitialData, setCalculatorInitialData] = useState<QuoteFormData | undefined>()

  // Project Modal & Detail Drawer State
  const [selectedDetailProject, setSelectedDetailProject] = useState<ClientProject | null>(null)
  const [drawerTab, setDrawerTab] = useState<'geral' | 'contato' | 'escopo' | 'orcamento_escopo' | 'links_arquivos'>('geral')

  useEffect(() => {
    initAdminSession()
  }, [])

  const initAdminSession = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        router.push('/admin/login')
        return
      }

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, roles(slug)')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          setUserProfile({
            id: profile.id,
            user_id: user.id,
            full_name: profile.full_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            role_slug: (profile as any).roles?.slug || 'admin',
            is_active: profile.is_active ?? true,
          })
        } else {
          setUserProfile({
            id: 'admin-fallback-id',
            user_id: user.id,
            full_name: user.email?.split('@')[0] || 'Administrador',
            email: user.email || '',
            role_slug: 'admin',
            is_active: true,
          })
        }
      } else {
        // Local Demo / Offline Mode Fallback
        setUserProfile({
          id: 'demo-admin-id',
          user_id: 'demo-user-id',
          full_name: 'Administrador ANXIS (Demo)',
          email: 'admin@anxis.com.br',
          role_slug: 'admin',
          is_active: true,
        })
      }

      // Fetch live home projects & client projects
      const [
        { data: pData },
        { data: cpData }
      ] = await Promise.all([
        supabase.from('projects').select('*').order('display_order', { ascending: true }),
        supabase.from('client_projects').select('*').order('updated_at', { ascending: false }),
      ])

      if (pData && pData.length > 0) setHomeProjects(pData)
      if (cpData && cpData.length > 0) setClientProjects(cpData as any)
    } catch (e) {
      console.warn('Running admin in offline/demo mode.')
      setUserProfile({
        id: 'demo-admin-id',
        user_id: 'demo-user-id',
        full_name: 'Administrador ANXIS (Demo)',
        email: 'admin@anxis.com.br',
        role_slug: 'admin',
        is_active: true,
      })
    } finally {
      setAuthResolved(true)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleDeleteProjectFromDrawer = (projectId: string, projectTitle: string) => {
    const canDelete = isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_DELETE)
    if (!canDelete) {
      alert('Você não possui permissão para excluir projetos.')
      return
    }

    const confirmDelete = window.confirm(
      `Tem certeza de que deseja excluir permanentemente o projeto "${projectTitle}"?\n\nEsta ação removerá todos os arquivos, links e pendências vinculadas ao projeto.`
    )

    if (confirmDelete) {
      setClientProjects((prev) => prev.filter((p) => p.id !== projectId))
      setSelectedDetailProject(null)
      alert(`Projeto "${projectTitle}" excluído com sucesso!`)
    }
  }

  // Convert Quote into a Client Project
  const handleConvertQuoteToProject = (quote: SavedQuote) => {
    const newProject: ClientProject = {
      id: `cp-converted-${Date.now()}`,
      title: quote.project_name,
      client_name: quote.client_name,
      company: quote.company,
      project_type: quote.project_type,
      platform: quote.platform || 'Next.js',
      status: 'Novo projeto',
      kanban_stage_name: 'Novo projeto',
      priority: 'Normal',
      responsible_user_name: userProfile?.full_name || 'Admin',
      responsible_user_email: userProfile?.email || 'admin@anxis.com.br',
      deadline: 'A definir',
      description: `Projeto convertido a partir do Orçamento #${quote.id}.`,
      quote_id: quote.id,
      quote_data: {
        quote_id: quote.id,
        project_type: quote.project_type,
        page_count: quote.form_data.pageCount,
        additional_page_count: quote.form_data.additionalPageCount,
        content_option: quote.form_data.contentOption,
        urgency: quote.form_data.urgency,
        base_value: quote.calculation_breakdown.baseValue,
        discount_amount: quote.discount,
        additional_costs: quote.additional_costs,
        tax_amount: quote.taxes,
        final_value: quote.final_value,
        notes: quote.notes,
        created_at: quote.created_at,
      },
      files: [],
      links: [],
      tasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Add to project list
    setClientProjects((prev) => [newProject, ...prev])

    // Update quote status
    setSavedQuotes((prev) =>
      prev.map((q) =>
        q.id === quote.id ? { ...q, status: 'Convertido em Projeto', linked_project_id: newProject.id } : q
      )
    )

    alert(`Projeto "${quote.project_name}" criado com sucesso a partir do orçamento! Redirecionando para os Projetos.`)
    setActiveTab('client_projects')
  }

  // SKELETON SCREEN DURING AUTH RESOLUTION
  if (!authResolved) {
    return (
      <div className="min-h-screen bg-[#0C1D36] text-white flex flex-col items-center justify-center p-6 space-y-4 font-sans">
        <div className="relative w-40 h-10 animate-pulse">
          <Image src="/images/logo-dark.svg" alt="ANXIS Logo" fill className="object-contain" />
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-xs font-bold bg-white/10 px-4 py-2 rounded-full border border-white/10">
          <Loader2 className="w-4 h-4 animate-spin text-[#0075FF]" />
          <span>Verificando autenticação e permissões do sistema...</span>
        </div>
      </div>
    )
  }

  const isAdmin = userProfile?.role_slug === 'admin'

  const navSections = [
    {
      title: 'Visão Geral',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          allowed: true,
        },
      ],
    },
    {
      title: 'Gestão de Projetos',
      items: [
        {
          id: 'client_projects',
          label: 'Projetos',
          icon: FolderKanban,
          allowed: isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW) || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW_ASSIGNED),
        },
        {
          id: 'kanban_board',
          label: 'Kanban',
          icon: Kanban,
          allowed: isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW) || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW_ASSIGNED),
        },
      ],
    },
    {
      title: 'Orçamentos',
      items: [
        {
          id: 'pricing_calculator',
          label: 'Precificação',
          icon: Calculator,
          allowed: isAdmin || hasPermission(userProfile, PERMISSIONS.PRICING_VIEW),
        },
        {
          id: 'quotes_history',
          label: 'Histórico',
          icon: FileText,
          allowed: isAdmin || hasPermission(userProfile, PERMISSIONS.PRICING_VIEW),
        },
      ],
    },
    {
      title: 'Conteúdo & Website',
      items: [
        {
          id: 'portfolio_home',
          label: 'Portfólio',
          icon: Globe,
          allowed: isAdmin || hasPermission(userProfile, PERMISSIONS.PORTFOLIO_VIEW),
        },
      ],
    },
    {
      title: 'Configurações',
      items: [
        {
          id: 'users_permissions',
          label: 'Permissões',
          icon: Shield,
          allowed: isAdmin || hasPermission(userProfile, PERMISSIONS.USERS_VIEW),
        },
      ],
    },
  ]

  // Flattened allowed tabs for active check
  const allAllowedTabs = navSections.flatMap((s) => s.items).filter((t) => t.allowed)
  const currentTabObj = allAllowedTabs.find((t) => t.id === activeTab) || allAllowedTabs[0]

  return (
    <div className="min-h-screen bg-[#F0F3F7] text-[#0C1D36] flex font-sans max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">
      {/* FLOATING LIGHT SIDEBAR */}
      <aside
        className={cn(
          'bg-white text-[#0C1D36] rounded-[32px] border border-slate-200/80 shadow-md flex flex-col justify-between transition-all duration-300 ease-in-out z-40 fixed top-6 left-6 bottom-6 h-[calc(100vh-48px)] hidden md:flex overflow-y-auto',
          isSidebarCollapsed ? 'w-20 p-3.5' : 'w-64 p-6'
        )}
      >
        <div className="space-y-4">
          {/* BRAND LOGO & COLLAPSE TOGGLE */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0C1D36] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  A
                </div>
                <div>
                  <div className="font-extrabold text-base text-[#0C1D36] tracking-tight">ANXIS</div>
                  <div className="text-[10px] text-slate-400 font-mono font-semibold uppercase">Painel Admin</div>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#0C1D36] text-white flex items-center justify-center font-black text-lg shadow-md mx-auto">
                A
              </div>
            )}

            {/* TOP COLLAPSE TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={cn(
                'p-2 rounded-xl text-slate-400 hover:text-[#0C1D36] hover:bg-slate-100 transition-all border border-slate-200/60',
                isSidebarCollapsed && 'mt-3 mx-auto'
              )}
              title={isSidebarCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-[#0C1D36]" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>

          {/* CATEGORIZED NAV SECTIONS */}
          <nav className="space-y-4">
            {navSections.map((section) => {
              const allowedItems = section.items.filter((i) => i.allowed)
              if (allowedItems.length === 0) return null

              return (
                <div key={section.title} className="space-y-1.5">
                  {!isSidebarCollapsed && (
                    <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-400 px-3 pt-2">
                      {section.title}
                    </div>
                  )}

                  <div className="space-y-1">
                    {allowedItems.map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          title={isSidebarCollapsed ? `${section.title}: ${tab.label}` : undefined}
                          className={cn(
                            'w-full flex items-center rounded-2xl text-xs font-bold transition-all text-left group',
                            isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3',
                            isActive
                              ? 'bg-[#0C1D36] text-white shadow-lg shadow-[#0C1D36]/20 font-extrabold'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-[#0C1D36]'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={cn(
                                'w-4 h-4 shrink-0',
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#0C1D36]'
                              )}
                            />
                            {!isSidebarCollapsed && <span>{tab.label}</span>}
                          </div>

                          {!isSidebarCollapsed && isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* SIDEBAR FOOTER USER CARD */}
        <div className="pt-4 border-t border-slate-100">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#0C1D36] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {userProfile?.full_name?.charAt(0) || 'A'}
                </div>
                <div className="overflow-hidden text-xs">
                  <div className="font-bold text-[#0C1D36] truncate">{userProfile?.full_name}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{userProfile?.role_slug}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs mx-auto border border-rose-100 hover:bg-rose-100 transition-colors"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE MAIN CONTAINER */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out max-w-full overflow-hidden',
          isSidebarCollapsed ? 'md:pl-24' : 'md:pl-72'
        )}
      >
        {/* MAIN MODULE CONTENT */}
        <main className="flex-1 space-y-6 max-w-full">
          {!currentTabObj ? (
            <div className="bg-white rounded-[32px] border border-rose-200 p-8 text-center space-y-4 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-xl font-bold text-rose-700">Acesso Negado (HTTP 403)</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Você não possui permissão suficiente para acessar este módulo.
              </p>
            </div>
          ) : (
            <>
              {/* TAB 0: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <DashboardOverviewTab
                  projects={clientProjects}
                  userProfile={userProfile}
                  onOpenProjectDetail={(p) => {
                    setSelectedDetailProject(p)
                    setDrawerTab('geral')
                  }}
                  onNavigateToTab={(tId) => setActiveTab(tId)}
                  onOpenCreateModal={() => {
                    setActiveTab('client_projects')
                  }}
                  onLogout={handleLogout}
                />
              )}

              {/* TAB 1: PORTFÓLIO DA HOME */}
              {activeTab === 'portfolio_home' && (
                <HomePortfolioTab
                  projects={homeProjects}
                  onUpdateProjects={setHomeProjects}
                  canEdit={isAdmin || hasPermission(userProfile, PERMISSIONS.PORTFOLIO_EDIT)}
                  canDelete={isAdmin || hasPermission(userProfile, PERMISSIONS.PORTFOLIO_DELETE)}
                  canCreate={isAdmin || hasPermission(userProfile, PERMISSIONS.PORTFOLIO_CREATE)}
                />
              )}

              {/* TAB 2: PROJETOS DE CLIENTES */}
              {activeTab === 'client_projects' && (
                <ClientProjectsTab
                  projects={clientProjects}
                  onUpdateProjects={setClientProjects}
                  userProfile={userProfile}
                  canCreate={isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_CREATE)}
                  canEdit={isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_EDIT)}
                  canDelete={isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_DELETE)}
                  canAssignResponsible={isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_ASSIGN_RESPONSIBLE)}
                  canViewAll={isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW_ALL)}
                  onOpenProjectDetail={(p) => {
                    setSelectedDetailProject(p)
                    setDrawerTab('geral')
                  }}
                />
              )}

              {/* TAB 3: KANBAN DE PROJETOS */}
              {activeTab === 'kanban_board' && (
                <KanbanBoardTab
                  projects={clientProjects}
                  onUpdateProjects={setClientProjects}
                  userProfile={userProfile}
                  canMoveKanban={isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_MOVE_KANBAN)}
                  canViewAll={isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW_ALL)}
                  onOpenProjectDetail={(p) => {
                    setSelectedDetailProject(p)
                    setDrawerTab('geral')
                  }}
                />
              )}

              {/* TAB 4: HISTÓRICO DE ORÇAMENTOS (NOVA ABA) */}
              {activeTab === 'quotes_history' && (
                <QuotesTab
                  quotes={savedQuotes}
                  userProfile={userProfile}
                  onUpdateQuotes={setSavedQuotes}
                  onEditQuoteInCalculator={(quote) => {
                    setCalculatorInitialData(quote.form_data)
                    setActiveTab('pricing_calculator')
                  }}
                  onConvertToProject={handleConvertQuoteToProject}
                  onOpenCreateQuote={() => {
                    setCalculatorInitialData(undefined)
                    setActiveTab('pricing_calculator')
                  }}
                />
              )}

              {/* TAB 5: CALCULADORA DE PRECIFICAÇÃO */}
              {activeTab === 'pricing_calculator' && (
                <PricingCalculatorTab
                  canManageSettings={isAdmin || hasPermission(userProfile, PERMISSIONS.PRICING_MANAGE_SETTINGS)}
                  canSaveQuote={isAdmin || hasPermission(userProfile, PERMISSIONS.PRICING_SAVE_QUOTE)}
                  onSaveQuote={(newQuote) => {
                    setSavedQuotes((prev) => [newQuote, ...prev])
                  }}
                  onConvertToProject={(newQuote) => {
                    setSavedQuotes((prev) => [newQuote, ...prev])
                    handleConvertQuoteToProject(newQuote)
                  }}
                  initialData={calculatorInitialData}
                />
              )}

              {/* TAB 6: USUÁRIOS E PERMISSÕES */}
              {activeTab === 'users_permissions' && (
                <UsersPermissionsTab
                  currentUserId={userProfile?.user_id}
                  canEditUser={isAdmin || hasPermission(userProfile, PERMISSIONS.USERS_EDIT)}
                  canManageRoles={isAdmin || hasPermission(userProfile, PERMISSIONS.USERS_MANAGE_ROLES)}
                  canManagePermissions={isAdmin || hasPermission(userProfile, PERMISSIONS.USERS_MANAGE_PERMISSIONS)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* PROJECT DETAIL DRAWER (WITH ORÇAMENTO E ESCOPO SUB-TAB) */}
      {selectedDetailProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end font-sans">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="p-6 space-y-6 flex-1">
              {/* DRAWER HEADER */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0075FF] bg-[#0075FF]/10 px-2.5 py-0.5 rounded">
                    {selectedDetailProject.project_type} • {selectedDetailProject.platform}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#0C1D36] mt-1">{selectedDetailProject.title}</h3>
                  <p className="text-xs text-[#596579]">{selectedDetailProject.client_name} ({selectedDetailProject.company || 'N/A'})</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailProject(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DRAWER SUB-NAVIGATION TABS */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
                {[
                  { id: 'geral', label: 'Geral' },
                  { id: 'contato', label: 'Contato' },
                  { id: 'escopo', label: 'Escopo & Briefing' },
                  { id: 'orcamento_escopo', label: 'Orçamento e Escopo' },
                  { id: 'links_arquivos', label: 'Links & Arquivos' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDrawerTab(t.id as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap',
                      drawerTab === t.id ? 'bg-[#0C1D36] text-white' : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* DRAWER TAB 1: GERAL */}
              {drawerTab === 'geral' && (
                <div className="space-y-4 text-xs text-[#0C1D36]">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>Estágio Atual:</span>
                      <span className="text-[#0075FF]">{selectedDetailProject.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Responsável Principal:</span>
                      <span className="font-bold">{selectedDetailProject.responsible_user_name || 'Sem responsável'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>E-mail do Responsável:</span>
                      <span className="text-slate-500 font-mono">{selectedDetailProject.responsible_user_email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prazo Final:</span>
                      <span className="font-bold text-rose-600">{selectedDetailProject.deadline || 'Sem prazo'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-[#0C1D36]">Descrição do Projeto</h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedDetailProject.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>
                </div>
              )}

              {/* DRAWER TAB 2: CONTATO DO CLIENTE */}
              {drawerTab === 'contato' && (
                <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-sm text-[#0075FF]">Contato do Cliente</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block">Nome do Contato:</span>
                      <span className="font-bold">{selectedDetailProject.client_contact_json?.contact_name || selectedDetailProject.client_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Empresa:</span>
                      <span className="font-bold">{selectedDetailProject.company || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">E-mail:</span>
                      <span className="font-bold font-mono">{selectedDetailProject.client_contact_json?.email || selectedDetailProject.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">WhatsApp:</span>
                      <span className="font-bold">{selectedDetailProject.client_contact_json?.whatsapp || selectedDetailProject.whatsapp || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DRAWER TAB 3: ESCOPO & BRIEFING */}
              {drawerTab === 'escopo' && (
                <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-sm text-[#0075FF]">Escopo & Briefing</h4>
                  <div>
                    <span className="text-slate-500 block">Objetivo:</span>
                    <p className="font-semibold text-slate-700">{selectedDetailProject.scope_briefing_json?.objective || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Público-Alvo:</span>
                    <p className="font-semibold text-slate-700">{selectedDetailProject.scope_briefing_json?.target_audience || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* DRAWER TAB 4: ORÇAMENTO E ESCOPO (NOVA ABA DE DETALHES) */}
              {drawerTab === 'orcamento_escopo' && (
                <div className="space-y-4 text-xs">
                  {selectedDetailProject.quote_data ? (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-sm text-[#0C1D36] flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span>Resumo Financeiro & Escopo Aprovado</span>
                        </h4>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                          Orçamento Vinculado #{selectedDetailProject.quote_data.quote_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-slate-700">
                        <div>
                          <span className="text-slate-500 block">Tipo de Projeto:</span>
                          <span className="font-bold text-[#0C1D36]">{selectedDetailProject.quote_data.project_type}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Páginas Padrão:</span>
                          <span className="font-bold">{selectedDetailProject.quote_data.page_count} pág.</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Páginas Adicionais:</span>
                          <span className="font-bold">{selectedDetailProject.quote_data.additional_page_count} pág.</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Conteúdo & Copy:</span>
                          <span className="font-bold">{selectedDetailProject.quote_data.content_option}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Nível de Urgência:</span>
                          <span className="font-bold">{selectedDetailProject.quote_data.urgency}</span>
                        </div>
                      </div>

                      {/* DETALHAMENTO FINANCEIRO */}
                      <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Valor Base:</span>
                          <span>R$ {selectedDetailProject.quote_data.base_value?.toLocaleString('pt-BR')}</span>
                        </div>
                        {selectedDetailProject.quote_data.discount_amount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>Desconto Aplicado:</span>
                            <span>- R$ {selectedDetailProject.quote_data.discount_amount?.toLocaleString('pt-BR')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[#0C1D36] text-sm font-extrabold pt-2 border-t border-slate-200">
                          <span>Valor Final Aprovado:</span>
                          <span className="text-[#0075FF]">
                            {selectedDetailProject.quote_data.final_value?.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                        </div>
                      </div>

                      {selectedDetailProject.quote_data.notes && (
                        <div className="pt-2 border-t border-slate-200/80">
                          <span className="text-slate-500 block mb-1">Observações do Orçamento:</span>
                          <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200 italic">
                            {selectedDetailProject.quote_data.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-600">Nenhum orçamento vinculado a este projeto.</p>
                      <p className="text-xs text-slate-400">
                        Você pode vincular ou criar um orçamento na aba "Orçamentos".
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* DRAWER TAB 5: LINKS & ARQUIVOS */}
              {drawerTab === 'links_arquivos' && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-[#0075FF] flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4" />
                      <span>Links Cadastrados</span>
                    </h4>
                    {selectedDetailProject.links?.length === 0 ? (
                      <p className="text-slate-400 italic">Nenhum link cadastrado.</p>
                    ) : (
                      selectedDetailProject.links?.map((link) => (
                        <div key={link.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <a href={link.url} target="_blank" rel="noreferrer" className="font-bold text-[#0075FF] hover:underline">
                              {link.label}
                            </a>
                            <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-bold ml-2">
                              {link.category}
                            </span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="font-bold text-sm text-[#0075FF] flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4" />
                      <span>Arquivos Privados</span>
                    </h4>
                    {selectedDetailProject.files?.length === 0 ? (
                      <p className="text-slate-400 italic">Nenhum arquivo enviado.</p>
                    ) : (
                      selectedDetailProject.files?.map((file) => (
                        <div key={file.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#0C1D36]">{file.file_name}</span>
                            <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded font-bold ml-2">
                              {file.category}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => alert(`Baixando arquivo privado ${file.file_name} via URL assinada segura.`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0075FF] text-white font-bold text-xs hover:bg-[#168CFF]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Baixar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DRAWER FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {(isAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_DELETE)) && (
                <button
                  type="button"
                  onClick={() => handleDeleteProjectFromDrawer(selectedDetailProject.id, selectedDetailProject.title)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs hover:bg-rose-100 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Projeto</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedDetailProject(null)}
                className="px-4 py-2 rounded-xl bg-[#0C1D36] text-white text-xs font-bold hover:bg-[#0075FF]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
