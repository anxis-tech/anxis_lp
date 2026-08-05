'use client'

import { useState, useEffect } from 'react'
import { PERMISSIONS, UserProfileWithRole } from '@/lib/auth/permissions'
import { updateUserRoleAction } from '@/lib/actions/users'
import {
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  Lock,
  User,
  UserX,
  UserCheck,
  Info,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { createClient } from '@/lib/supabase/client'

export const TAB_PERMISSION_KEYS = [
  { key: 'dashboard.view', label: 'Visualizar Dashboard', category: 'Visão Geral' },
  { key: 'client_projects.view', label: 'Visualizar Projetos', category: 'Gestão de Projetos' },
  { key: 'client_projects.view_assigned', label: 'Visualizar Apenas Projetos Atribuídos', category: 'Gestão de Projetos' },
  { key: 'kanban_board.view', label: 'Visualizar Quadro Kanban', category: 'Gestão de Projetos' },
  { key: 'pricing.view', label: 'Visualizar Precificação (Calculadora)', category: 'Orçamentos' },
  { key: 'quotes_history.view', label: 'Visualizar Histórico de Orçamentos', category: 'Orçamentos' },
  { key: 'portfolio.view', label: 'Visualizar Portfólio da Home', category: 'Conteúdo & Website' },
  { key: 'users.view', label: 'Visualizar Permissões e Usuários', category: 'Configurações' },
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
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')

  const fallbackUsers: UserProfileWithRole[] = [
    {
      id: 'u-main-admin',
      user_id: currentUserId || 'usr-admin-principal',
      full_name: 'Usuário Principal (Administrador)',
      email: 'admin@anxis.com.br',
      role_slug: 'admin',
      is_active: true,
    },
  ]

  useEffect(() => {
    fetchRealUsers()
  }, [])

  const fetchRealUsers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*, roles(slug)')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching user profiles:', error)
        setUserList(fallbackUsers)
        return
      }

      if (data && data.length > 0) {
        const mappedUsers: UserProfileWithRole[] = data.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name || p.email?.split('@')[0] || 'Usuário',
          email: p.email,
          role_slug: p.roles?.slug || 'admin',
          is_active: p.is_active ?? true,
        }))
        setUserList(mappedUsers)
      } else {
        setUserList(fallbackUsers)
      }
    } catch (e) {
      console.warn('Could not fetch user profiles:', e)
      setUserList(fallbackUsers)
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
      alert(`Cargo atualizado para "${newRoleSlug.toUpperCase()}" (Controle Total ativado se Admin)!`)
    } else {
      alert(`Aviso: ${res.message}`)
    }
  }

  const handleToggleUserStatus = (userId: string) => {
    setUserList((prev) =>
      prev.map((u) => {
        if (u.user_id === userId) {
          if (u.role_slug === 'admin' && u.is_active && prev.filter((x) => x.role_slug === 'admin' && x.is_active).length <= 1) {
            alert('Ação bloqueada: Não é possível desativar o único administrador do sistema!')
            return u
          }
          return { ...u, is_active: !u.is_active }
        }
        return u
      })
    )
  }

  const handleOpenPermissionsModal = (user: UserProfileWithRole) => {
    setEditingUserPerms(user)
    setCustomPerms(user.custom_permissions || {})
  }

  const handleGrantFullAdmin = async (userId: string) => {
    await handleRoleChange(userId, 'admin')
    if (editingUserPerms && editingUserPerms.user_id === userId) {
      setEditingUserPerms((prev) => (prev ? { ...prev, role_slug: 'admin' } : null))
    }
  }

  const handleTogglePermissionKey = (permKey: string) => {
    setCustomPerms((prev) => {
      const currentVal = prev[permKey] ?? true
      return { ...prev, [permKey]: !currentVal }
    })
  }

  const handleSavePermissions = () => {
    if (!editingUserPerms) return

    setUserList((prev) =>
      prev.map((u) =>
        u.id === editingUserPerms.id ? { ...u, custom_permissions: { ...customPerms } } : u
      )
    )

    setEditingUserPerms(null)
    alert(`Permissões de visualização atualizadas para ${editingUserPerms.full_name}!`)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 font-sans text-[#0C1D36]">
      {/* HEADER */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#0075FF]" />
          <span>Gestão de Permissões e Controle de Acesso</span>
        </h2>
        <p className="text-xs text-[#596579] mt-1">
          Gerencie cargos e atribua controle total (Administrador) ou permissões específicas por aba aos usuários.
        </p>
      </div>

      {/* SEARCH & CARGO FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0075FF]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['todos', 'admin', 'comercial', 'designer'].map((role) => (
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
              <th className="p-3.5 whitespace-nowrap">Cargo / Nível de Acesso</th>
              <th className="p-3.5 whitespace-nowrap">Status do Acesso</th>
              <th className="p-3.5 whitespace-nowrap">Permissões de Abas</th>
              <th className="p-3.5 text-right whitespace-nowrap">Ações de Permissão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3.5">
                  <div className="font-extrabold text-[#0C1D36] text-xs flex items-center gap-1.5">
                    {user.role_slug === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
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
                          : 'bg-purple-50 text-purple-700 border-purple-300 focus:ring-purple-400'
                      )}
                    >
                      <option value="admin">★ Admin (Controle Total)</option>
                      <option value="comercial">Comercial</option>
                      <option value="designer">Designer</option>
                    </select>
                  ) : (
                    <span
                      className={cn(
                        'inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider',
                        user.role_slug === 'admin'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-200'
                          : user.role_slug === 'comercial'
                          ? 'bg-[#0075FF]/10 text-[#0075FF] border border-[#0075FF]/20'
                          : 'bg-purple-500/10 text-purple-600 border border-purple-200'
                      )}
                    >
                      {user.role_slug === 'admin' ? 'Admin (Controle Total)' : user.role_slug}
                    </span>
                  )}
                </td>

                <td className="p-3.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-bold text-[11px]',
                      user.is_active ? 'text-emerald-600' : 'text-rose-500'
                    )}
                  >
                    {user.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{user.is_active ? 'Acesso Ativo' : 'Acesso Suspenso'}</span>
                  </span>
                </td>

                <td className="p-3.5">
                  {user.custom_permissions && Object.keys(user.custom_permissions).length > 0 ? (
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded border border-amber-200">
                      Personalizado ({Object.values(user.custom_permissions).filter(Boolean).length} abas ativas)
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                      Padrão do Cargo ({user.role_slug})
                    </span>
                  )}
                </td>

                <td className="p-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {canManagePermissions && (
                      <button
                        type="button"
                        onClick={() => handleOpenPermissionsModal(user)}
                        className="w-8 h-8 rounded-xl bg-[#0075FF] text-white hover:bg-[#168CFF] flex items-center justify-center shadow-sm transition-all"
                        title="Editar Permissões de Abas"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}

                    {canEditUser && (
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(user.user_id)}
                        className={cn(
                          'w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm transition-all',
                          user.is_active
                            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                        )}
                        title={user.is_active ? 'Suspender Acesso' : 'Reativar Acesso'}
                      >
                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GRANULAR TAB PERMISSION MATRIX MODAL */}
      {editingUserPerms && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0C1D36] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0075FF]" />
                  <span>Permissões de Abas: {editingUserPerms.full_name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Cargo: <span className="font-bold text-[#0075FF] uppercase">{editingUserPerms.role_slug}</span> • {editingUserPerms.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {editingUserPerms.role_slug !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleGrantFullAdmin(editingUserPerms.user_id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-extrabold text-[11px] hover:bg-amber-600 shadow-sm flex items-center gap-1"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Conceder Controle Total (Admin)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingUserPerms(null)}
                  className="text-slate-400 hover:text-[#0C1D36] font-bold p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
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
                        const isChecked = customPerms[item.key] ?? true
                        return (
                          <label key={item.key} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 cursor-pointer hover:border-[#0075FF] transition-colors">
                            <span className="font-bold text-[#0C1D36]">{item.label}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermissionKey(item.key)}
                              className="w-4 h-4 rounded text-[#0075FF] focus:ring-[#0075FF]"
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
                className="px-5 py-2 rounded-xl bg-[#0075FF] text-white text-xs font-extrabold hover:bg-[#168CFF] shadow-md"
              >
                Salvar Permissões de Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
