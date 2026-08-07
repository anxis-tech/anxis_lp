'use client'

import { useState, useEffect } from 'react'
import { PERMISSIONS, UserProfileWithRole } from '@/lib/auth/permissions'
import { updateUserRoleAction, updateUserPermissionsAction, syncAuthUsersToProfilesAction } from '@/lib/actions/users'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Shield01Icon,
  Search01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Settings01Icon,
  UserIcon,
  CrownIcon,
  Cancel01Icon,
  RefreshIcon,
  Tick01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export interface PermissionItem {
  key: string
  label: string
  description: string
  category: 'Gestão de Projetos' | 'Orçamentos' | 'Conteúdo & Website' | 'Configurações'
}

export const TAB_PERMISSION_KEYS: PermissionItem[] = [
  // Gestão de Projetos
  {
    key: 'client_projects.view',
    label: 'Visualizar Módulo de Projetos',
    description: 'Permite acessar a aba e a lista de Projetos de Clientes.',
    category: 'Gestão de Projetos',
  },
  {
    key: 'client_projects.view_all',
    label: 'Visualizar Todos os Projetos da Equipe',
    description: 'Permite visualizar projetos que não foram atribuídos ao próprio usuário.',
    category: 'Gestão de Projetos',
  },
  {
    key: 'client_projects.view_assigned',
    label: 'Visualizar Apenas Projetos Atribuídos',
    description: 'Restringe a visualização estritamente aos projetos onde o usuário é o responsável.',
    category: 'Gestão de Projetos',
  },
  {
    key: 'client_projects.create',
    label: 'Criar Novos Projetos de Clientes',
    description: 'Permite cadastrar novos projetos no painel.',
    category: 'Gestão de Projetos',
  },
  {
    key: 'client_projects.edit',
    label: 'Editar Projetos de Clientes',
    description: 'Permite alterar dados, escopo, links, arquivos e briefing dos projetos.',
    category: 'Gestão de Projetos',
  },
  {
    key: 'client_projects.delete',
    label: 'Excluir Projetos de Clientes',
    description: 'Permite remover projetos permanentemente do sistema.',
    category: 'Gestão de Projetos',
  },
  {
    key: 'client_projects.assign_responsible',
    label: 'Atribuir Responsável por Projeto',
    description: 'Permite alterar quem é o usuário responsável por um projeto.',
    category: 'Gestão de Projetos',
  },
  {
    key: 'kanban_board.view',
    label: 'Visualizar Quadro Kanban',
    description: 'Permite acessar a aba e a visualização em fluxo do Quadro Kanban.',
    category: 'Gestão de Projetos',
  },
  {
    key: 'client_projects.move_kanban',
    label: 'Mover Cards no Kanban',
    description: 'Permite arrastar e alterar a etapa Kanban dos projetos.',
    category: 'Gestão de Projetos',
  },

  // Orçamentos
  {
    key: 'pricing.view',
    label: 'Visualizar Calculadora de Precificação',
    description: 'Permite acessar a ferramenta de cálculo de orçamentos.',
    category: 'Orçamentos',
  },
  {
    key: 'pricing.save_quote',
    label: 'Salvar e Converter Orçamentos',
    description: 'Permite salvar novos orçamentos e convertê-los em projetos.',
    category: 'Orçamentos',
  },
  {
    key: 'pricing.manage_settings',
    label: 'Gerenciar Configurações de Preço Base',
    description: 'Permite alterar taxas base, horas e parâmetros de precificação.',
    category: 'Orçamentos',
  },
  {
    key: 'quotes_history.view',
    label: 'Visualizar Histórico de Orçamentos',
    description: 'Permite consultar o histórico de orçamentos gerados e salvos.',
    category: 'Orçamentos',
  },

  // Conteúdo & Website
  {
    key: 'portfolio.view',
    label: 'Visualizar Portfólio da Home',
    description: 'Permite consultar os cases cadastrados para o site principal.',
    category: 'Conteúdo & Website',
  },
  {
    key: 'portfolio.create',
    label: 'Criar Cases no Portfólio',
    description: 'Permite cadastrar novos trabalhos e cases na home.',
    category: 'Conteúdo & Website',
  },
  {
    key: 'portfolio.edit',
    label: 'Editar Cases no Portfólio',
    description: 'Permite modificar informações dos cases exibidos no site.',
    category: 'Conteúdo & Website',
  },
  {
    key: 'portfolio.delete',
    label: 'Excluir Cases do Portfólio',
    description: 'Permite remover cases do portfólio da home.',
    category: 'Conteúdo & Website',
  },

  // Configurações
  {
    key: 'users.view',
    label: 'Visualizar Equipe e Usuários',
    description: 'Permite acessar o painel de gestão de membros e cargos.',
    category: 'Configurações',
  },
  {
    key: 'users.create',
    label: 'Criar Novos Usuários na Equipe',
    description: 'Permite cadastrar novos membros com acesso ao painel.',
    category: 'Configurações',
  },
  {
    key: 'users.edit',
    label: 'Editar Dados de Usuários',
    description: 'Permite alterar informações cadastrais dos usuários da equipe.',
    category: 'Configurações',
  },
  {
    key: 'users.manage_roles',
    label: 'Alterar Cargos da Equipe',
    description: 'Permite alterar o rótulo organizacional do usuário (Designer, Comercial, etc.).',
    category: 'Configurações',
  },
  {
    key: 'users.manage_permissions',
    label: 'Gerenciar Permissões da Equipe',
    description: 'Permite abrir este modal e alterar permissões individuais de outros membros.',
    category: 'Configurações',
  },
]

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  label?: string
}

function SwitchControl({ checked, onCheckedChange, disabled, id, label }: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Alternar permissão'}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0075FF] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[#0075FF]' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

interface UsersPermissionsTabProps {
  currentUserId?: string
  canEditUser?: boolean
  canManageRoles?: boolean
  canManagePermissions?: boolean
  onProfilePermissionsUpdated?: () => void
}

export function UsersPermissionsTab({
  currentUserId,
  canEditUser = true,
  canManageRoles = true,
  canManagePermissions = true,
  onProfilePermissionsUpdated,
}: UsersPermissionsTabProps) {
  const [userList, setUserList] = useState<UserProfileWithRole[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('todos')
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    fetchRealUsers()
  }, [])

  const fetchRealUsers = async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      // Sync auth users to profiles first if missing
      await syncAuthUsersToProfilesAction()

      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles(slug)')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching user profiles:', error)
        setFetchError(`Erro ao carregar usuários: ${error.message}`)
        setUserList([])
        return
      }

      if (data && data.length > 0) {
        const mappedUsers: UserProfileWithRole[] = data.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name || p.email?.split('@')[0] || 'Usuário',
          email: p.email,
          role_slug: p.roles?.slug || '',
          is_super_admin: Boolean(p.is_super_admin || p.email === 'contato@anxis.com.br'),
          is_active: p.is_active ?? true,
          custom_permissions: p.custom_permissions || {},
        }))
        setUserList(mappedUsers)
      } else {
        setUserList([])
      }
    } catch (e: any) {
      console.error('Could not fetch user profiles:', e)
      setFetchError(`Erro de conexão: ${e?.message || 'Falha ao conectar com o Supabase.'}`)
      setUserList([])
    } finally {
      setIsLoading(false)
    }
  }

  // Permission Matrix Edit Modal State
  const [editingUserPerms, setEditingUserPerms] = useState<UserProfileWithRole | null>(null)
  const [customPerms, setCustomPerms] = useState<Record<string, boolean>>({})

  const filteredUsers = userList.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'todos' || u.role_slug === roleFilter
    return matchesSearch && matchesRole
  })

  const handleRoleChange = async (userId: string, newRoleSlug: string) => {
    setUserList((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role_slug: newRoleSlug } : u))
    )
    const res = await updateUserRoleAction(userId, newRoleSlug)
    if (res.success) {
      alert(`Cargo alterado para "${newRoleSlug ? newRoleSlug.toUpperCase() : 'SEM CARGO'}". Lembre-se: o cargo é estritamente organizacional e não altera as permissões individuais de abas ou ações.`)
    } else {
      alert(`Aviso: ${res.message}`)
    }
  }

  const handleOpenPermissionsModal = (user: UserProfileWithRole) => {
    setEditingUserPerms(user)
    setCustomPerms(user.custom_permissions ? { ...user.custom_permissions } : {})
  }

  const handleTogglePermissionKey = (permKey: string) => {
    setCustomPerms((prev) => {
      const currentVal = Boolean(prev[permKey])
      return { ...prev, [permKey]: !currentVal }
    })
  }

  const handleSelectAllGlobal = (select: boolean) => {
    const newPerms: Record<string, boolean> = {}
    TAB_PERMISSION_KEYS.forEach((item) => {
      newPerms[item.key] = select
    })
    setCustomPerms(newPerms)
  }

  const handleSelectCategory = (category: string, select: boolean) => {
    const catKeys = TAB_PERMISSION_KEYS.filter((item) => item.category === category).map((i) => i.key)
    setCustomPerms((prev) => {
      const updated = { ...prev }
      catKeys.forEach((key) => {
        updated[key] = select
      })
      return updated
    })
  }

  const handleSavePermissions = async () => {
    if (!editingUserPerms) return

    const targetId = editingUserPerms.user_id || editingUserPerms.id
    const res = await updateUserPermissionsAction(targetId, customPerms)

    if (res.success) {
      setUserList((prev) =>
        prev.map((u) =>
          u.id === editingUserPerms.id || u.user_id === editingUserPerms.user_id
            ? { ...u, custom_permissions: { ...customPerms } }
            : u
        )
      )

      setEditingUserPerms(null)

      // Notify parent page to re-sync permissions live
      onProfilePermissionsUpdated?.()

      alert(`Permissões individuais de ${editingUserPerms.full_name} salvas com sucesso no Supabase!`)
    } else {
      alert(`Erro ao salvar permissões: ${res.message}`)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 font-sans text-[#0C1D36]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-extrabold text-[#0C1D36] flex items-center gap-2">
            <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5 text-[#0075FF]" strokeWidth={1.5} />
            <span>Gerenciamento de Usuários e Permissões</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cargos são estritamente <strong className="text-slate-700">organizacionais</strong>. O acesso de cada usuário a abas e ações é controlado exclusivamente por suas <strong className="text-[#0075FF]">Permissões Individuais</strong> salvas no banco.
          </p>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#0075FF] outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {['todos', 'admin', 'comercial', 'designer', 'desenvolvedor'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors',
                roleFilter === role ? 'bg-[#0C1D36] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#081D3A] text-white border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3.5 whitespace-nowrap">Usuário</th>
              <th className="p-3.5 whitespace-nowrap">Cargo Organizacional</th>
              <th className="p-3.5 whitespace-nowrap">Status das Permissões</th>
              <th className="p-3.5 text-right whitespace-nowrap">Ações de Permissão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#0075FF] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Carregando usuários...</span>
                  </div>
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <HugeiconsIcon icon={CancelCircleIcon} className="w-8 h-8 text-rose-400" strokeWidth={1.5} />
                    <span className="text-xs text-rose-600 font-bold">{fetchError}</span>
                    <button
                      type="button"
                      onClick={fetchRealUsers}
                      className="mt-2 px-4 py-1.5 rounded-lg bg-[#0075FF] text-white text-xs font-bold hover:bg-[#168CFF]"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <HugeiconsIcon icon={UserIcon} className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-slate-500">
                      {userList.length === 0 ? 'Nenhum usuário cadastrado.' : 'Nenhum resultado para o filtro aplicado.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const activePermCount = Object.values(user.custom_permissions || {}).filter(Boolean).length

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-extrabold text-[#0C1D36] text-xs flex items-center gap-1.5">
                        {user.is_super_admin && <HugeiconsIcon icon={CrownIcon} className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />}
                        <span>{user.full_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                    </td>

                    <td className="p-3.5">
                      {canManageRoles ? (
                        <select
                          value={user.role_slug}
                          onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-[11px] font-extrabold border outline-none cursor-pointer shadow-sm transition-all',
                            user.role_slug === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-300 focus:ring-purple-400'
                              : user.role_slug === 'comercial'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 focus:ring-blue-400'
                              : user.role_slug === 'designer'
                              ? 'bg-amber-50 text-amber-700 border-amber-300 focus:ring-amber-400'
                              : user.role_slug === 'desenvolvedor'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-400'
                              : 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-400'
                          )}
                        >
                          <option value="">Sem cargo cadastrado</option>
                          <option value="comercial">Comercial</option>
                          <option value="designer">Designer</option>
                          <option value="desenvolvedor">Desenvolvedor</option>
                          <option value="admin">Administrador (Organizacional)</option>
                        </select>
                      ) : (
                        <span
                          className={cn(
                            'inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider',
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          )}
                        >
                          {user.role_slug ? user.role_slug : 'Sem cargo'}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      {user.is_super_admin ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-800 font-extrabold px-2.5 py-1 rounded-md border border-amber-300 flex items-center gap-1.5 w-fit">
                          <HugeiconsIcon icon={CrownIcon} className="w-3 h-3 text-amber-500" strokeWidth={2} />
                          <span>Administrador Principal (Acesso Total)</span>
                        </span>
                      ) : activePermCount > 0 ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-700 font-bold px-2.5 py-1 rounded-md border border-emerald-200">
                          {activePermCount} de {TAB_PERMISSION_KEYS.length} permissões ativas
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2.5 py-1 rounded-md">
                          Apenas Dashboard (Sem permissões extras)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {canManagePermissions && !user.is_super_admin && (
                          <button
                            type="button"
                            onClick={() => handleOpenPermissionsModal(user)}
                            className="w-8 h-8 rounded-xl bg-[#0075FF] text-white hover:bg-[#168CFF] flex items-center justify-center shadow-sm transition-all cursor-pointer"
                            title="Editar Ações de Permissão"
                          >
                            <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PERMISSION MATRIX EDIT MODAL WITH SWITCHES */}
      {editingUserPerms && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0C1D36] flex items-center gap-2">
                  <HugeiconsIcon icon={Shield01Icon} className="w-4.5 h-4.5 text-[#0075FF]" strokeWidth={1.5} />
                  <span>Permissões Individuais: {editingUserPerms.full_name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cargo atual: <strong className="text-slate-700 uppercase">{editingUserPerms.role_slug || 'Sem cargo'}</strong> (Rótulo organizacional). Ative ou desative as chaves abaixo para liberar ou bloquear o acesso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUserPerms(null)}
                className="text-slate-400 hover:text-[#0C1D36] font-bold p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* GLOBAL SELECT ALL / DESELECT ALL CONTROLS */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Controles Globais:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllGlobal(true)}
                  className="px-3 py-1 rounded-lg bg-[#0075FF] text-white text-[11px] font-bold hover:bg-[#168CFF] transition-colors"
                >
                  Selecionar Todas as Permissões
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAllGlobal(false)}
                  className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-300 transition-colors"
                >
                  Desmarcar Todas
                </button>
              </div>
            </div>

            {/* PERMISSION CATEGORIES AND SWITCHES */}
            <div className="space-y-5 overflow-y-auto pr-1 text-xs flex-1">
              {(['Gestão de Projetos', 'Orçamentos', 'Conteúdo & Website', 'Configurações'] as const).map((cat) => {
                const catKeys = TAB_PERMISSION_KEYS.filter((k) => k.category === cat)
                if (catKeys.length === 0) return null

                const allCatSelected = catKeys.every((item) => Boolean(customPerms[item.key]))

                return (
                  <div key={cat} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-extrabold text-[#0C1D36] uppercase text-[11px] tracking-wider text-[#0075FF]">
                        {cat}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(cat, !allCatSelected)}
                          className="text-[10px] text-[#0075FF] font-extrabold hover:underline"
                        >
                          {allCatSelected ? 'Desmarcar Categoria' : 'Selecionar Todos'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {catKeys.map((item) => {
                        const isChecked = Boolean(customPerms[item.key])
                        return (
                          <div
                            key={item.key}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-xl border transition-all',
                              isChecked
                                ? 'bg-blue-50/50 border-blue-200/80 shadow-xs'
                                : 'bg-white border-slate-200/80 hover:border-slate-300'
                            )}
                          >
                            <div className="pr-4 space-y-0.5">
                              <div className="font-bold text-[#0C1D36] text-xs flex items-center gap-2">
                                <span>{item.label}</span>
                                {isChecked && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.2 rounded">
                                    ON
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug">{item.description}</p>
                            </div>

                            <SwitchControl
                              id={`switch-${item.key}`}
                              checked={isChecked}
                              onCheckedChange={() => handleTogglePermissionKey(item.key)}
                              label={item.label}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">
                {Object.values(customPerms).filter(Boolean).length} de {TAB_PERMISSION_KEYS.length} permissões ativadas
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUserPerms(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-5 py-2 rounded-xl bg-[#0075FF] text-white text-xs font-extrabold hover:bg-[#168CFF] shadow-md transition-all flex items-center gap-1.5"
                >
                  <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4" strokeWidth={2} />
                  <span>Salvar Permissões no Supabase</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
