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
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export const TAB_PERMISSION_KEYS = [
  // Visão Geral
  { key: 'dashboard.view', label: 'Visualizar Dashboard', category: 'Visão Geral' },

  // Gestão de Projetos
  { key: 'client_projects.view', label: 'Visualizar Lista de Projetos', category: 'Gestão de Projetos' },
  { key: 'client_projects.view_assigned', label: 'Visualizar Apenas Projetos Atribuídos', category: 'Gestão de Projetos' },
  { key: 'client_projects.create', label: 'Criar Novos Projetos de Clientes', category: 'Gestão de Projetos' },
  { key: 'client_projects.edit', label: 'Editar Projetos de Clientes', category: 'Gestão de Projetos' },
  { key: 'client_projects.delete', label: 'Excluir Projetos de Clientes', category: 'Gestão de Projetos' },
  { key: 'kanban_board.view', label: 'Visualizar Quadro Kanban', category: 'Gestão de Projetos' },
  { key: 'client_projects.move_kanban', label: 'Mover Cards no Kanban', category: 'Gestão de Projetos' },

  // Orçamentos
  { key: 'pricing.view', label: 'Visualizar Precificação (Calculadora)', category: 'Orçamentos' },
  { key: 'pricing.save_quote', label: 'Salvar e Converter Orçamentos', category: 'Orçamentos' },
  { key: 'quotes_history.view', label: 'Visualizar Histórico de Orçamentos', category: 'Orçamentos' },

  // Conteúdo & Website
  { key: 'portfolio.view', label: 'Visualizar Portfólio da Home', category: 'Conteúdo & Website' },
  { key: 'portfolio.edit', label: 'Criar / Editar Cases do Portfólio', category: 'Conteúdo & Website' },
  { key: 'portfolio.delete', label: 'Excluir Cases do Portfólio', category: 'Conteúdo & Website' },

  // Configurações
  { key: 'users.view', label: 'Visualizar Permissões e Usuários', category: 'Configurações' },
  { key: 'users.manage_permissions', label: 'Gerenciar Permissões da Equipe', category: 'Configurações' },
]

interface UsersPermissionsTabProps {
  currentUserId?: string
  canEditUser?: boolean
  canManageRoles?: boolean
  canManagePermissions?: boolean
}

export function UsersPermissionsTab({
  currentUserId,
  canEditUser = true,
  canManageRoles = true,
  canManagePermissions = true,
}: UsersPermissionsTabProps) {
  const [userList, setUserList] = useState<UserProfileWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')

  useEffect(() => {
    fetchRealUsers()
  }, [])

  const fetchRealUsers = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      // Sync auth.users to profiles first
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
      alert(`Cargo alterado para "${newRoleSlug ? newRoleSlug.toUpperCase() : 'SEM CARGO'}". Lembre-se: o cargo é apenas organizacional e não altera as permissões de abas.`)
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

  const handleSavePermissions = async () => {
    if (!editingUserPerms) return

    const res = await updateUserPermissionsAction(editingUserPerms.user_id, customPerms)
    if (res.success) {
      setUserList((prev) =>
        prev.map((u) =>
          u.id === editingUserPerms.id ? { ...u, custom_permissions: { ...customPerms } } : u
        )
      )
      setEditingUserPerms(null)
      alert(`Ações de permissão atualizadas com sucesso para ${editingUserPerms.full_name}!`)
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
            <HugeiconsIcon icon={Shield01Icon} className="w-5 h-5 text-[#0075FF]"  strokeWidth={1.5} />
            <span>Gerenciamento de Usuários e Permissões</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cargos são organizacionais. As abas e ações de cada usuário são controladas estritamente pelas <strong className="text-[#0075FF]">Ações de Permissão</strong>.
          </p>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <HugeiconsIcon icon={Search01Icon} className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"  strokeWidth={1.5} />
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
              <th className="p-3.5 whitespace-nowrap">Cargo</th>
              <th className="p-3.5 whitespace-nowrap">Permissões de Abas</th>
              <th className="p-3.5 text-right whitespace-nowrap">Ações de Permissão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#0075FF] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Carregando usuários do Supabase...</span>
                  </div>
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <HugeiconsIcon icon={CancelCircleIcon} className="w-8 h-8 text-rose-400"  strokeWidth={1.5} />
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
                    <HugeiconsIcon icon={UserIcon} className="w-8 h-8 text-slate-300"  strokeWidth={1.5} />
                    <span className="text-sm font-bold text-slate-500">
                      {userList.length === 0 ? 'Nenhum usuário cadastrado.' : 'Nenhum resultado para o filtro aplicado.'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {userList.length === 0
                        ? 'Os usuários aparecerão aqui após serem criados no Supabase Auth.'
                        : 'Tente alterar os filtros de busca ou cargo.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5">
                    <div className="font-extrabold text-[#0C1D36] text-xs flex items-center gap-1.5">
                      {user.role_slug === 'admin' && <HugeiconsIcon icon={CrownIcon} className="w-3.5 h-3.5 text-amber-500"  strokeWidth={1.5} />}
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
                            ? 'bg-rose-50 text-rose-700 border-rose-300 focus:ring-rose-400'
                            : user.role_slug === 'comercial'
                            ? 'bg-blue-50 text-blue-700 border-blue-300 focus:ring-blue-400'
                            : user.role_slug === 'designer'
                            ? 'bg-purple-50 text-purple-700 border-purple-300 focus:ring-purple-400'
                            : user.role_slug === 'desenvolvedor'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-400'
                            : 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-400'
                        )}
                      >
                        <option value="">Sem cargo cadastrado</option>
                        <option value="comercial">Comercial</option>
                        <option value="designer">Designer</option>
                        <option value="desenvolvedor">Desenvolvedor</option>
                        <option value="admin">Administrador (Supabase)</option>
                      </select>
                    ) : (
                      <span
                        className={cn(
                          'inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider',
                          user.role_slug === 'admin'
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        )}
                      >
                        {user.role_slug ? user.role_slug : 'Sem cargo'}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5">
                    {user.role_slug === 'admin' ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-700 font-extrabold px-2.5 py-1 rounded-md border border-emerald-200">
                        Acesso Total (Administrador Supabase)
                      </span>
                    ) : Object.values(user.custom_permissions || {}).filter(Boolean).length > 0 ? (
                      <span className="text-[10px] bg-amber-500/10 text-amber-700 font-bold px-2.5 py-1 rounded-md border border-amber-200">
                        {Object.values(user.custom_permissions || {}).filter(Boolean).length} ações / abas ativas
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2.5 py-1 rounded-md">
                        Sem permissões (Apenas Dashboard)
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {canManagePermissions && user.role_slug !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleOpenPermissionsModal(user)}
                          className="w-8 h-8 rounded-xl bg-[#0075FF] text-white hover:bg-[#168CFF] flex items-center justify-center shadow-sm transition-all cursor-pointer"
                          title="Editar Ações de Permissão"
                        >
                          <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4"  strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* GRANULAR TAB & ACTION PERMISSION MATRIX MODAL */}
      {editingUserPerms && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0C1D36] flex items-center gap-2">
                  <HugeiconsIcon icon={Shield01Icon} className="w-4 h-4 text-[#0075FF]"  strokeWidth={1.5} />
                  <span>Ações de Permissão: {editingUserPerms.full_name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione quais abas e funcionalidades este usuário pode visualizar e executar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUserPerms(null)}
                className="text-slate-400 hover:text-[#0C1D36] font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              {['Visão Geral', 'Gestão de Projetos', 'Orçamentos', 'Conteúdo & Website', 'Configurações'].map((cat) => {
                const catKeys = TAB_PERMISSION_KEYS.filter((k) => k.category === cat)
                if (catKeys.length === 0) return null

                return (
                  <div key={cat} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-[#0C1D36] border-b border-slate-200 pb-1.5 uppercase text-[10px] tracking-wider text-[#0075FF]">
                      Sessão: {cat}
                    </h4>
                    <div className="space-y-2 pt-1">
                      {catKeys.map((item) => {
                        const isChecked = Boolean(customPerms[item.key])
                        return (
                          <label key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-[#0075FF] transition-colors">
                            <span className="font-bold text-[#0C1D36]">{item.label}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermissionKey(item.key)}
                              className="w-4.5 h-4.5 rounded text-[#0075FF] focus:ring-[#0075FF] cursor-pointer"
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUserPerms(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-xl bg-[#0075FF] text-white text-xs font-extrabold hover:bg-[#168CFF] shadow-md transition-all"
              >
                Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
