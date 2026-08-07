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
import { DashboardOverviewTab } from '@/components/admin/tabs/dashboard-overview-tab'
import { HomePortfolioTab } from '@/components/admin/tabs/home-portfolio-tab'
import { ClientProjectsTab } from '@/components/admin/tabs/client-projects-tab'
import { KanbanBoardTab } from '@/components/admin/tabs/kanban-board-tab'
import { PricingCalculatorTab } from '@/components/admin/tabs/pricing-calculator-tab'
import { QuotesTab } from '@/components/admin/tabs/quotes-tab'
import { UsersPermissionsTab } from '@/components/admin/tabs/users-permissions-tab'
import { FinanceTab } from '@/components/admin/tabs/finance-tab'
import { CommissionsSubtab } from '@/components/admin/tabs/commissions-subtab'
import { LeadsTab } from '@/components/admin/tabs/leads-tab'
import { saveClientProjectAction, deleteClientProjectAction } from '@/lib/actions/client-projects'
import { getContractByProjectId, downloadContractAction } from '@/lib/actions/contracts'
import { Contract } from '@/types/contract.types'
import {
  getPaymentByProjectIdAction,
  createPaymentLinkAction,
  checkPaymentStatusAction,
} from '@/lib/actions/payments'
import { Payment } from '@/types/payment.types'
import { saveQuoteAction } from '@/lib/actions/quotes'
import { saveHomeProjectAction, deleteHomeProjectAction } from '@/lib/actions/projects'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare01Icon,
  Globe02Icon,
  FolderKanbanIcon,
  KanbanIcon,
  Calculator01Icon,
  Shield01Icon,
  Logout01Icon,
  ExternalLinkIcon,
  AlertCircleIcon,
  Loading01Icon,
  Cancel01Icon,
  File01Icon,
  Attachment01Icon,
  Link01Icon,
  Download01Icon,
  Mail01Icon,
  UserIcon,
  Calendar01Icon,
  Task01Icon,
  Delete02Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  Dollar01Icon,
  Briefcase01Icon,
  PieChartIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const router = useRouter()

  // Unified Auth & Permission Loading Guard
  const [authResolved, setAuthResolved] = useState<boolean>(false)
  const [userProfile, setUserProfile] = useState<UserProfileWithRole | null>(null)
  const [activeTab, setActiveTab] = useState<string>('dashboard')

  // Live state from Supabase DB
  const [homeProjects, setHomeProjects] = useState<Project[]>([])
  const [clientProjects, setClientProjects] = useState<ClientProject[]>([])
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([])
  const [teamUsers, setTeamUsers] = useState<UserProfileWithRole[]>([])
  const [paymentsList, setPaymentsList] = useState<Payment[]>([])
  const [contractsList, setContractsList] = useState<Contract[]>([])
  const [calculatorInitialData, setCalculatorInitialData] = useState<QuoteFormData | undefined>()

  // Project Modal & Detail Drawer State
  const [selectedDetailProject, setSelectedDetailProject] = useState<ClientProject | null>(null)
  const [drawerTab, setDrawerTab] = useState<'geral' | 'contato' | 'escopo' | 'orcamento_escopo' | 'links_arquivos' | 'contrato' | 'pagamento'>('geral')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const [prefilledFromQuote, setPrefilledFromQuote] = useState<SavedQuote | null>(null)
  const [drawerContract, setDrawerContract] = useState<Contract | null>(null)
  const [isLoadingDrawerContract, setIsLoadingDrawerContract] = useState<boolean>(false)
  const [drawerPayment, setDrawerPayment] = useState<Payment | null>(null)
  const [isLoadingDrawerPayment, setIsLoadingDrawerPayment] = useState<boolean>(false)
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState<boolean>(false)

  // Deployment skew detection: tracks whether a "Failed to find Server Action" error
  // has occurred, which means the browser has JS/HTML from a previous build while the
  // server is already serving a new build. We show a non-invasive reload banner
  // instead of silently breaking. This is NOT triggered by real db/auth/permission errors.
  const [staleDeployDetected, setStaleDeployDetected] = useState<boolean>(false)

  // Helper to wrap Server Action calls and detect deployment skew errors.
  // Only surfaces the stale-deploy banner for the specific Next.js error message.
  // All other errors are propagated normally so real failures aren't hidden.
  const withStaleDetection = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('Failed to find Server Action') || message.includes('older or newer deployment')) {
        setStaleDeployDetected(true)
      }
      throw err
    }
  }

  useEffect(() => {
    if (selectedDetailProject) {
      setIsLoadingDrawerContract(true)
      getContractByProjectId(selectedDetailProject.id).then((contract) => {
        setDrawerContract(contract)
        setIsLoadingDrawerContract(false)
      })

      setIsLoadingDrawerPayment(true)
      getPaymentByProjectIdAction(selectedDetailProject.id).then((payment) => {
        setDrawerPayment(payment)
        setIsLoadingDrawerPayment(false)
      })
    } else {
      setDrawerContract(null)
      setDrawerPayment(null)
    }
  }, [selectedDetailProject])

  useEffect(() => {
    initAdminSession()

    // Real-time subscription to update profile & permissions when changed by admin
    const supabase = createClient()
    const channel = supabase
      .channel('profile_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          initAdminSession()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Ensure activeTab is always an allowed tab for the current user
  useEffect(() => {
    if (authResolved && userProfile) {
      const allowedTabIds = navSections.flatMap((s) => s.items).filter((t) => t.allowed).map((t) => t.id)
      if (allowedTabIds.length > 0 && !allowedTabIds.includes(activeTab)) {
        setActiveTab(allowedTabIds[0])
      }
    }
  }, [authResolved, userProfile, activeTab])

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
          // Block inactive users from accessing admin shell
          if (profile.is_active === false) {
            await supabase.auth.signOut()
            router.push('/admin/login?error=inactive')
            return
          }

          const userRoleSlug = (profile as any).roles?.slug || ''
          const isSuperAdmin = Boolean((profile as any).is_super_admin || profile.email === 'contato@anxis.com.br')

          setUserProfile({
            id: profile.id,
            user_id: user.id,
            full_name: profile.full_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            role_slug: userRoleSlug,
            is_super_admin: isSuperAdmin,
            is_active: profile.is_active ?? true,
            custom_permissions: (profile as any).custom_permissions || {},
          })

          // Update last access timestamp in Supabase
          await supabase
            .from('profiles')
            .update({ last_access_at: new Date().toISOString() })
            .eq('user_id', user.id)
        } else {
          // Profile row does not exist in Supabase DB yet - Auto provision profile (unassigned role)
          const newProfileData = {
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            role_id: null,
            is_active: true,
            custom_permissions: {},
          }

          try {
            await supabase.from('profiles').upsert(newProfileData, { onConflict: 'user_id' })
          } catch (err) {
            console.warn('Could not auto-provision profile:', err)
          }

          setUserProfile({
            id: user.id,
            user_id: user.id,
            full_name: newProfileData.full_name,
            email: newProfileData.email,
            role_slug: '',
            is_active: true,
            custom_permissions: {},
          })
        }
      } else {
        router.push('/admin/login')
        return
      }

      // Fetch live home projects, client projects, saved quotes, payments & contracts from Supabase DB
      const [
        { data: pData },
        { data: cpData },
        { data: qData },
        { data: teamData },
        { data: paymentsData },
        { data: contractsData }
      ] = await Promise.all([
        supabase.from('projects').select('*').order('display_order', { ascending: true }),
        supabase.from('client_projects').select('*').order('updated_at', { ascending: false }),
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*, roles(slug)').eq('is_active', true).order('full_name', { ascending: true }),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('contracts').select('*').order('created_at', { ascending: false }),
      ])

      setHomeProjects(pData || [])
      setClientProjects((cpData as any) || [])
      setSavedQuotes((qData as any) || [])
      setPaymentsList((paymentsData as any) || [])
      setContractsList((contractsData as any) || [])

      // Map team users for the responsible user selector
      if (teamData && teamData.length > 0) {
        setTeamUsers(
          teamData.map((p: any) => ({
            id: p.id,
            user_id: p.user_id,
            full_name: p.full_name || p.email?.split('@')[0] || 'Usuário',
            email: p.email,
            role_slug: (p as any).roles?.slug || '',
            is_active: p.is_active ?? true,
            custom_permissions: p.custom_permissions || {},
          }))
        )
      }
    } catch (e) {
      console.warn('Supabase DB connection error:', e)
    } finally {
      setAuthResolved(true)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleDeleteProjectFromDrawer = async (projectId: string, projectTitle: string) => {
    const canDelete = isSuperAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_DELETE)
    if (!canDelete) {
      alert('Você não possui permissão para excluir projetos.')
      return
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o projeto "${projectTitle}"? Esta ação não pode ser desfeita.`
    )
    if (!confirmDelete) return

    setClientProjects((prev) => prev.filter((p) => p.id !== projectId))
    setSelectedDetailProject(null)
    try {
      const res = await withStaleDetection(() => deleteClientProjectAction(projectId))
      if (res.success) {
        alert(`Projeto "${projectTitle}" excluído com sucesso!`)
      } else {
        alert(`Erro: ${res.message}`)
        initAdminSession()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (!message.includes('Failed to find Server Action') && !message.includes('older or newer deployment')) {
        alert(`Erro inesperado ao excluir o projeto.`)
        initAdminSession()
      }
    }
  }

  const handleContinueToProjectForm = (quote: SavedQuote) => {
    const canCreate = isSuperAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_CREATE)
    if (!canCreate) {
      alert('Você não possui permissão para criar novos projetos.')
      return
    }

    setPrefilledFromQuote(quote)
    setActiveTab('client_projects')
  }

  // SKELETON SCREEN DURING AUTH RESOLUTION
  if (!authResolved) {
    return (
      <div className="min-h-screen bg-[#081D3A] text-white flex flex-col items-center justify-center p-6 space-y-5 font-sans relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0075FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative w-72 h-20 sm:w-96 sm:h-24 animate-pulse">
          <Image src="/images/logo-transparente.png" alt="ANXIS Logo" fill className="object-contain" priority />
        </div>
        <div className="flex items-center gap-2.5 text-slate-300 text-xs font-semibold bg-white/10 px-5 py-2.5 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
          <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin text-[#0075FF]" strokeWidth={1.5} />
          <span>Verificando autenticação e permissões do sistema...</span>
        </div>
      </div>
    )
  }

  // Real Supabase Administrator check (Cargo is strictly organizational and DOES NOT GRANT permissions)
  const isSuperAdmin = userProfile?.is_super_admin === true

  const navSections = [
    {
      title: 'Visão Geral',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: DashboardSquare01Icon,
          allowed: true, // Dashboard is available to all active authenticated users
        },
      ],
    },
    {
      title: 'Gestão de Projetos',
      items: [
        {
          id: 'client_projects',
          label: 'Projetos',
          icon: FolderKanbanIcon,
          allowed: isSuperAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW),
        },
        {
          id: 'kanban_board',
          label: 'Kanban',
          icon: KanbanIcon,
          allowed: isSuperAdmin || hasPermission(userProfile, PERMISSIONS.KANBAN_VIEW) || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW),
        },
      ],
    },
    {
      title: 'Comercial',
      items: [
        {
          id: 'leads_overview',
          label: 'Leads',
          icon: Mail01Icon,
          allowed: isSuperAdmin || hasPermission(userProfile, PERMISSIONS.LEADS_VIEW),
        },
      ],
    },
    {
      title: 'Orçamentos',
      items: [
        {
          id: 'pricing_calculator',
          label: 'Precificação',
          icon: Calculator01Icon,
          allowed: isSuperAdmin || hasPermission(userProfile, PERMISSIONS.PRICING_VIEW),
        },
        {
          id: 'quotes_history',
          label: 'Histórico',
          icon: File01Icon,
          allowed: isSuperAdmin || hasPermission(userProfile, PERMISSIONS.PRICING_VIEW_HISTORY) || hasPermission(userProfile, PERMISSIONS.PRICING_VIEW),
        },
      ],
    },
    {
      title: 'Conteúdo & Website',
      items: [
        {
          id: 'portfolio_home',
          label: 'Portfólio',
          icon: Globe02Icon,
          allowed: isSuperAdmin || hasPermission(userProfile, PERMISSIONS.PORTFOLIO_VIEW),
        },
      ],
    },
    {
      title: 'Financeiro',
      items: [
        {
          id: 'finance_overview',
          label: 'Financeiro',
          icon: Dollar01Icon,
          allowed: isSuperAdmin || hasPermission(userProfile, PERMISSIONS.FINANCE_VIEW),
        },
        {
          id: 'commissions_overview',
          label: 'Comissões',
          icon: PieChartIcon,
          allowed: isSuperAdmin || hasPermission(userProfile, PERMISSIONS.COMMISSIONS_VIEW),
        },
      ],
    },
    {
      title: 'Configurações',
      items: [
        {
          id: 'users_permissions',
          label: 'Permissões',
          icon: Shield01Icon,
          allowed: isSuperAdmin || hasPermission(userProfile, PERMISSIONS.USERS_VIEW),
        },
      ],
    },
  ]

  // Flattened allowed tabs for active check
  const allAllowedTabs = navSections.flatMap((s) => s.items).filter((t) => t.allowed)
  const currentTabObj = allAllowedTabs.find((t) => t.id === activeTab) || allAllowedTabs[0]

  return (
    <div className="min-h-screen bg-[#F0F3F7] text-[#0C1D36] flex font-sans max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">

      {/* STALE DEPLOY BANNER — shown only when a Server Action from a previous build
          is detected. This is a deployment skew issue: the user's browser has HTML/JS
          from build N but the server is now on build N+1.
          Reloading fetches the new HTML and resolves the issue without data loss
          since all data is already persisted in Supabase. */}
      {staleDeployDetected && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl px-5 py-3 shadow-xl text-xs font-semibold max-w-md w-full animate-in slide-in-from-top-2">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={2} />
          <span className="flex-1">
            Nova versão do sistema disponível. Recarregue para continuar usando o painel.
          </span>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
          >
            Recarregar
          </button>
          <button
            onClick={() => setStaleDeployDetected(false)}
            className="text-amber-600 hover:text-amber-800 transition-colors"
            title="Fechar aviso"
            aria-label="Fechar aviso de atualização"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      )}
      {/* FLOATING LIGHT SIDEBAR */}
      <aside
        className={cn(
          'bg-white text-[#0C1D36] rounded-[32px] border border-slate-200/80 shadow-md flex flex-col justify-between transition-all duration-300 ease-in-out z-40 fixed top-6 left-6 bottom-6 h-[calc(100vh-48px)] hidden md:flex overflow-y-auto',
          isSidebarCollapsed ? 'w-20 p-3.5' : 'w-64 p-6'
        )}
      >
        <div className="space-y-4">
          {/* BRAND LOGO & COLLAPSE TOGGLE */}
          <div className={cn('flex items-center pb-4 border-b border-slate-100', isSidebarCollapsed ? 'justify-center' : 'justify-between')}>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 shrink-0">
                  <Image src="/images/Icon--Colorido.png" alt="ANXIS Logo" fill className="object-contain" priority />
                </div>
                <span className="font-black text-lg text-[#0C1D36] tracking-tight">ANXIS</span>
              </div>
            )}

            {/* TOP COLLAPSE TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-xl text-slate-400 hover:text-[#0C1D36] hover:bg-slate-100 transition-all border border-slate-200/60 cursor-pointer"
              title={isSidebarCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
            >
              {isSidebarCollapsed ? (
                <HugeiconsIcon icon={PanelLeftOpenIcon} className="w-5 h-5 text-[#0C1D36]" strokeWidth={1.5} />
              ) : (
                <HugeiconsIcon icon={PanelLeftCloseIcon} className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
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
                      const tabIcon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          title={isSidebarCollapsed ? `${section.title}: ${tab.label}` : undefined}
                          className={cn(
                            'w-full flex items-center rounded-2xl text-xs font-bold transition-all text-left group cursor-pointer',
                            isSidebarCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3',
                            isActive
                              ? 'bg-[#0C1D36] text-white shadow-lg shadow-[#0C1D36]/20 font-extrabold'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-[#0C1D36]'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <HugeiconsIcon
                              icon={tabIcon}
                              strokeWidth={1.5}
                              className={cn(
                                'w-5 h-5 shrink-0',
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
                  <div className="text-[10px] text-slate-400 capitalize">{userProfile?.role_slug || 'Usuário'}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sair da Conta"
              >
                <HugeiconsIcon icon={Logout01Icon} className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs mx-auto border border-rose-100 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Sair da Conta"
            >
              <HugeiconsIcon icon={Logout01Icon} className="w-5 h-5" strokeWidth={1.5} />
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
              <HugeiconsIcon icon={AlertCircleIcon} className="w-12 h-12 text-rose-500 mx-auto" strokeWidth={1.5} />
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
                  canEdit={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.PORTFOLIO_EDIT)}
                  canDelete={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.PORTFOLIO_DELETE)}
                  canCreate={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.PORTFOLIO_CREATE)}
                />
              )}

              {/* TAB 2: PROJETOS DE CLIENTES */}
              {activeTab === 'client_projects' && (
                <ClientProjectsTab
                  projects={clientProjects}
                  onUpdateProjects={setClientProjects}
                  userProfile={userProfile}
                  teamUsers={teamUsers}
                  canCreate={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_CREATE)}
                  canEdit={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_EDIT)}
                  canDelete={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_DELETE)}
                  canAssignResponsible={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_ASSIGN_RESPONSIBLE)}
                  canViewAll={
                    isSuperAdmin ||
                    hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW_ALL) ||
                    !hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW_ASSIGNED)
                  }
                  onOpenProjectDetail={(p) => {
                    setSelectedDetailProject(p)
                    setDrawerTab('geral')
                  }}
                  prefilledFromQuote={prefilledFromQuote}
                  onClearPrefilledQuote={() => setPrefilledFromQuote(null)}
                  onStaleDeployDetected={() => setStaleDeployDetected(true)}
                />
              )}

              {/* TAB 3: KANBAN DE PROJETOS */}
              {activeTab === 'kanban_board' && (
                <KanbanBoardTab
                  projects={clientProjects}
                  onUpdateProjects={setClientProjects}
                  userProfile={userProfile}
                  canMoveKanban={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_MOVE_KANBAN)}
                  canViewAll={
                    isSuperAdmin ||
                    hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW_ALL) ||
                    !hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_VIEW_ASSIGNED)
                  }
                  onOpenProjectDetail={(p) => {
                    setSelectedDetailProject(p)
                    setDrawerTab('geral')
                  }}
                />
              )}

              {/* TAB 4: HISTÓRICO DE ORÇAMENTOS */}
              {activeTab === 'quotes_history' && (
                <QuotesTab
                  quotes={savedQuotes}
                  userProfile={userProfile}
                  onUpdateQuotes={setSavedQuotes}
                  onEditQuoteInCalculator={(quote) => {
                    setCalculatorInitialData(quote.form_data)
                    setActiveTab('pricing_calculator')
                  }}
                  onConvertToProject={handleContinueToProjectForm}
                  onOpenCreateQuote={() => {
                    setCalculatorInitialData(undefined)
                    setActiveTab('pricing_calculator')
                  }}
                />
              )}

              {/* TAB 5: CALCULADORA DE PRECIFICAÇÃO */}
              {activeTab === 'pricing_calculator' && (
                <PricingCalculatorTab
                  canManageSettings={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.PRICING_MANAGE_SETTINGS)}
                  canSaveQuote={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.PRICING_SAVE_QUOTE)}
                  onSaveQuote={(newQuote) => {
                    setSavedQuotes((prev) => [newQuote, ...prev])
                  }}
                  onContinueToProjectForm={(newQuote) => {
                    setSavedQuotes((prev) => [newQuote, ...prev])
                    handleContinueToProjectForm(newQuote)
                  }}
                  initialData={calculatorInitialData}
                />
              )}

              {/* TAB 6: USUÁRIOS E PERMISSÕES */}
              {activeTab === 'users_permissions' && (
                <UsersPermissionsTab
                  currentUserId={userProfile?.user_id}
                  canEditUser={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.USERS_EDIT)}
                  canManageRoles={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.USERS_MANAGE_ROLES)}
                  canManagePermissions={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.USERS_MANAGE_PERMISSIONS)}
                  onProfilePermissionsUpdated={() => {
                    initAdminSession()
                  }}
                />
              )}

              {/* TAB 7: MÓDULO FINANCEIRO */}
              {activeTab === 'finance_overview' && (
                <FinanceTab
                  projects={clientProjects}
                  quotes={savedQuotes}
                  contracts={contractsList}
                  payments={paymentsList}
                  teamUsers={teamUsers}
                  userProfile={userProfile}
                  canViewValues={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.FINANCE_VIEW_VALUES)}
                  canViewPayments={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.FINANCE_VIEW_PAYMENTS)}
                  onOpenProjectDetail={(p) => {
                    setSelectedDetailProject(p)
                    setDrawerTab('geral')
                  }}
                />
              )}

              {/* TAB 8: MÓDULO DE COMISSÕES */}
              {activeTab === 'commissions_overview' && (
                <CommissionsSubtab
                  projects={clientProjects}
                  teamUsers={teamUsers}
                  userProfile={userProfile}
                  canViewValues={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.COMMISSIONS_VIEW_VALUES)}
                  canManageRules={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.COMMISSIONS_MANAGE_RULES)}
                  canRegisterPayment={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.COMMISSIONS_REGISTER_PAYMENT)}
                  onOpenProjectDetail={(p) => {
                    setSelectedDetailProject(p)
                    setDrawerTab('geral')
                  }}
                />
              )}

              {/* TAB 9: MÓDULO DE LEADS */}
              {activeTab === 'leads_overview' && (
                <LeadsTab
                  teamUsers={teamUsers}
                  userProfile={userProfile}
                  canViewAll={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.LEADS_VIEW_ALL)}
                  canCreate={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.LEADS_CREATE)}
                  canEdit={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.LEADS_EDIT)}
                  canDelete={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.LEADS_DELETE)}
                  canAssign={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.LEADS_ASSIGN)}
                  canChangeStatus={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.LEADS_CHANGE_STATUS)}
                  canCreateQuote={isSuperAdmin || hasPermission(userProfile, PERMISSIONS.LEADS_CREATE_QUOTE)}
                  onStartQuoteForLead={(lead) => {
                    setActiveTab('pricing_calculator')
                  }}
                  onStartProjectForLead={(lead, quote) => {
                    setActiveTab('client_projects')
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* PROJECT DETAIL DRAWER */}
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
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" strokeWidth={1.5} />
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
                  { id: 'contrato', label: 'Contrato' },
                  { id: 'pagamento', label: 'Pagamento' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDrawerTab(t.id as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer',
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
                    <div className="col-span-2 pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1 font-bold text-[#0075FF]">Endereço Completo do Cliente:</span>
                      <p className="font-semibold text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                        {selectedDetailProject.client_contact_json?.street || 'N/A'}
                        {selectedDetailProject.client_contact_json?.number ? `, nº ${selectedDetailProject.client_contact_json.number}` : ''}
                        {selectedDetailProject.client_contact_json?.neighborhood ? ` — Bairro ${selectedDetailProject.client_contact_json.neighborhood}` : ''}
                        {selectedDetailProject.client_contact_json?.city ? `, ${selectedDetailProject.client_contact_json.city}` : ''}
                        {selectedDetailProject.client_contact_json?.state ? ` / ${selectedDetailProject.client_contact_json.state}` : ''}
                        {selectedDetailProject.client_contact_json?.cep ? ` (CEP: ${selectedDetailProject.client_contact_json.cep})` : ''}
                      </p>
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

              {/* DRAWER TAB 4: ORÇAMENTO E ESCOPO */}
              {drawerTab === 'orcamento_escopo' && (
                <div className="space-y-4 text-xs">
                  {selectedDetailProject.quote_data ? (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-sm text-[#0C1D36] flex items-center gap-1.5">
                          <HugeiconsIcon icon={Dollar01Icon} className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />
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
                      <HugeiconsIcon icon={File01Icon} className="w-8 h-8 text-slate-400 mx-auto" strokeWidth={1.5} />
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
                      <HugeiconsIcon icon={Link01Icon} className="w-4 h-4" strokeWidth={1.5} />
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
                          <HugeiconsIcon icon={ExternalLinkIcon} className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="font-bold text-sm text-[#0075FF] flex items-center gap-1.5">
                      <HugeiconsIcon icon={Attachment01Icon} className="w-4 h-4" strokeWidth={1.5} />
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0075FF] text-white font-bold text-xs hover:bg-[#168CFF] cursor-pointer"
                          >
                            <HugeiconsIcon icon={Download01Icon} className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Baixar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* DRAWER TAB 6: CONTRATO */}
              {drawerTab === 'contrato' && (
                <div className="space-y-4 text-xs">
                  {isLoadingDrawerContract ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <HugeiconsIcon icon={Loading01Icon} className="w-6 h-6 animate-spin text-[#0075FF] mx-auto" strokeWidth={1.5} />
                      <p className="text-xs font-semibold text-slate-600">Buscando informações do contrato...</p>
                    </div>
                  ) : drawerContract ? (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-sm text-[#0C1D36] flex items-center gap-1.5">
                          <HugeiconsIcon icon={File01Icon} className="w-4 h-4 text-[#0075FF]" strokeWidth={1.5} />
                          <span>Contrato de Prestação de Serviços</span>
                        </h4>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                            drawerContract.status === 'completed'
                              ? "bg-emerald-100 text-emerald-800"
                              : drawerContract.status === 'failed'
                              ? "bg-rose-100 text-rose-800"
                              : "bg-purple-100 text-purple-800"
                          )}
                        >
                          {drawerContract.status === 'completed'
                            ? 'Concluído'
                            : drawerContract.status === 'failed'
                            ? 'Falhou'
                            : 'Processando'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-slate-700">
                        <div>
                          <span className="text-slate-500 block">ID do Contrato:</span>
                          <span className="font-mono text-[10px] font-bold text-[#0C1D36] truncate block">{drawerContract.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Versão:</span>
                          <span className="font-bold">v{drawerContract.version}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Valor Contratado:</span>
                          <span className="font-bold text-[#0075FF]">
                            {drawerContract.final_value
                              ? drawerContract.final_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                              : 'R$ 0,00'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Data de Geração:</span>
                          <span className="font-bold">
                            {drawerContract.generated_at
                              ? new Date(drawerContract.generated_at).toLocaleDateString('pt-BR')
                              : 'Em processamento'}
                          </span>
                        </div>
                      </div>

                      {drawerContract.file_name && (
                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#0C1D36] block">{drawerContract.file_name}</span>
                            <span className="text-[10px] text-slate-400">
                              {drawerContract.file_size ? `${Math.round(drawerContract.file_size / 1024)} KB` : 'PDF'}
                            </span>
                          </div>
                          {drawerContract.status === 'completed' && (
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await downloadContractAction(drawerContract.id)
                                if (res.success && res.signedUrl) {
                                  const a = document.createElement('a')
                                  a.href = res.signedUrl
                                  a.download = res.fileName || 'contrato.pdf'
                                  a.target = '_blank'
                                  document.body.appendChild(a)
                                  a.click()
                                  document.body.removeChild(a)
                                } else {
                                  alert(`Erro ao baixar contrato: ${res.message}`)
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0075FF] text-white font-bold text-xs hover:bg-[#168CFF] cursor-pointer shadow-sm"
                            >
                              <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" strokeWidth={1.5} />
                              Baixar PDF
                            </button>
                          )}
                        </div>
                      )}

                      {drawerContract.error_message && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                          <span className="font-bold block mb-1">Erro na Geração:</span>
                          <p>{drawerContract.error_message}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <HugeiconsIcon icon={File01Icon} className="w-8 h-8 text-slate-400 mx-auto" strokeWidth={1.5} />
                      <p className="text-sm font-bold text-slate-600">Nenhum contrato gerado para este projeto.</p>
                      <p className="text-xs text-slate-400">
                        O contrato é gerado automaticamente no salvamento do projeto.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* DRAWER TAB 7: PAGAMENTO (INFINITEPAY CHECKOUT INTEGRADO) */}
              {drawerTab === 'pagamento' && (
                <div className="space-y-4 text-xs">
                  {isLoadingDrawerPayment ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <HugeiconsIcon icon={Loading01Icon} className="w-6 h-6 animate-spin text-[#0075FF] mx-auto" strokeWidth={1.5} />
                      <p className="text-xs font-semibold text-slate-600">Buscando informações do pagamento InfinitePay...</p>
                    </div>
                  ) : drawerPayment ? (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h4 className="font-extrabold text-sm text-[#0C1D36] flex items-center gap-1.5">
                          <HugeiconsIcon icon={Dollar01Icon} className="w-4 h-4 text-[#0075FF]" strokeWidth={1.5} />
                          <span>Cobrança Checkout Integrado InfinitePay</span>
                        </h4>
                        <span
                          className={cn(
                            "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border",
                            drawerPayment.status === 'Pago'
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : drawerPayment.status === 'Pendente'
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-rose-100 text-rose-800 border-rose-200"
                          )}
                        >
                          {drawerPayment.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-slate-700">
                        <div>
                          <span className="text-slate-500 block">Identificador (Order NSU):</span>
                          <span className="font-mono text-[10px] font-bold text-[#0C1D36] truncate block">{drawerPayment.order_nsu}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Valor da Cobrança:</span>
                          <span className="font-bold text-[#0075FF] text-sm font-mono">
                            {(drawerPayment.expected_amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Data de Geração:</span>
                          <span className="font-bold">
                            {drawerPayment.generated_at ? new Date(drawerPayment.generated_at).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                        {drawerPayment.status === 'Pago' && (
                          <>
                            <div>
                              <span className="text-slate-500 block">Data do Pagamento:</span>
                              <span className="font-bold text-emerald-700">
                                {drawerPayment.paid_at ? new Date(drawerPayment.paid_at).toLocaleDateString('pt-BR') : 'Confirmado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Forma de Pagamento:</span>
                              <span className="font-bold">{drawerPayment.capture_method || 'Cartão/Pix InfinitePay'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Parcelas:</span>
                              <span className="font-bold">{drawerPayment.installments || 1}x</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* PAYMENT LINK ACTIONS (Oculto se status for Pago) */}
                      {drawerPayment.payment_url && drawerPayment.status !== 'Pago' && (
                        <div className="pt-3 border-t border-slate-200 space-y-3">
                          <span className="font-bold text-slate-700 block">Link de Pagamento Oficial:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={drawerPayment.payment_url}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-600 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(drawerPayment.payment_url!)
                                alert('Link de pagamento da InfinitePay copiado!')
                              }}
                              className="px-3 py-2 rounded-xl bg-[#0075FF] text-white font-bold text-xs hover:bg-[#168CFF] cursor-pointer shrink-0 shadow-sm"
                            >
                              Copiar Link
                            </button>
                            <a
                              href={drawerPayment.payment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-2 rounded-xl bg-[#081D3A] text-white font-bold text-xs hover:bg-[#0075FF] cursor-pointer shrink-0 shadow-sm"
                            >
                              Abrir Checkout
                            </a>
                          </div>
                        </div>
                      )}

                      {/* VERIFY / RE-CHECK PAYMENT STATUS BUTTON */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await checkPaymentStatusAction(drawerPayment.id)
                            if (res.success) {
                              if (res.isPaid) {
                                alert('Pagamento confirmado com sucesso na InfinitePay!')
                                setDrawerPayment(res.payment || null)
                              } else {
                                alert(res.message || 'O pagamento continua pendente.')
                              }
                            } else {
                              alert(`Erro ao consultar status: ${res.message}`)
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <span>Consultar Pagamento (InfinitePay)</span>
                        </button>

                        {drawerPayment.receipt_url && (
                          <a
                            href={drawerPayment.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer shadow-sm"
                          >
                            Ver Comprovante
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                      <HugeiconsIcon icon={Dollar01Icon} className="w-8 h-8 text-slate-400 mx-auto" strokeWidth={1.5} />
                      <p className="text-sm font-bold text-slate-600">Nenhum link de pagamento gerado ainda.</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Certifique-se de que o contrato em PDF foi gerado para criar a cobrança via InfinitePay.
                      </p>

                      <button
                        type="button"
                        disabled={isCreatingPaymentLink}
                        onClick={async () => {
                          setIsCreatingPaymentLink(true)
                          const res = await createPaymentLinkAction({ projectId: selectedDetailProject.id })
                          setIsCreatingPaymentLink(false)
                          if (res.success) {
                            alert('Link de pagamento gerado com sucesso!')
                            setDrawerPayment(res.payment || null)
                          } else {
                            alert(`Erro ao gerar link de pagamento: ${res.message}`)
                          }
                        }}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-[#0075FF] text-white font-bold text-xs hover:bg-[#168CFF] cursor-pointer shadow-md inline-flex items-center gap-2"
                      >
                        {isCreatingPaymentLink ? (
                          <>
                            <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin text-white" strokeWidth={1.5} />
                            <span>Gerando link de pagamento...</span>
                          </>
                        ) : (
                          <span>Gerar Link de Pagamento InfinitePay</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DRAWER FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {(isSuperAdmin || hasPermission(userProfile, PERMISSIONS.CLIENT_PROJECTS_DELETE)) && (
                <button
                  type="button"
                  onClick={() => handleDeleteProjectFromDrawer(selectedDetailProject.id, selectedDetailProject.title)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" strokeWidth={1.5} />
                  <span>Excluir Projeto</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedDetailProject(null)}
                className="px-4 py-2 rounded-xl bg-[#0C1D36] text-white text-xs font-bold hover:bg-[#0075FF] cursor-pointer"
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
