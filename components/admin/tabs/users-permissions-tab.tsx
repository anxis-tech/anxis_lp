'use client'

import { useState } from 'react'
import { PERMISSIONS, UserProfileWithRole } from '@/lib/auth/permissions'
import {
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  Lock,
  User,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MOCK_USERS: UserProfileWithRole[] = [
  {
    id: 'u-1',
    user_id: 'user-admin-uuid',
    full_name: 'Administrador ANXIS',
    email: 'admin@anxis.com.br',
    role_slug: 'admin',
    is_active: true,
  },
  {
    id: 'u-2',
    user_id: 'user-comercial-uuid',
    full_name: 'Ana Comercial',
    email: 'comercial@anxis.com.br',
    role_slug: 'comercial',
    is_active: true,
  },
  {
    id: 'u-3',
    user_id: 'user-designer-uuid',
    full_name: 'Carlos Designer',
    email: 'designer@anxis.com.br',
    role_slug: 'designer',
    is_active: true,
  },
]

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
  const [userList, setUserList] = useState<UserProfileWithRole[]>(MOCK_USERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0075FF]" />
            <span>Gestão de Permissões de Acesso por Usuário</span>
          </h2>
          <p className="text-xs text-[#596579]">
            Configure as permissões de visualização de cada aba do painel para os usuários cadastrados no banco de dados.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-[11px] text-slate-500 font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-[#0075FF]" />
          <span>Criação de novos usuários realizada via Banco de Dados (Supabase Auth).</span>
        </div>
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
              <th className="p-3.5 whitespace-nowrap">Cargo Institucional</th>
              <th className="p-3.5 whitespace-nowrap">Status do Acesso</th>
              <th className="p-3.5 whitespace-nowrap">Permissões de Abas</th>
              <th className="p-3.5 text-right whitespace-nowrap">Ações de Permissão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3.5">
                  <div className="font-extrabold text-[#0C1D36] text-xs">{user.full_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                </td>

                <td className="p-3.5">
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
                    {user.role_slug}
                  </span>
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

                <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                  {canManagePermissions && (
                    <button
                      type="button"
                      onClick={() => handleOpenPermissionsModal(user)}
                      className="px-3 py-1.5 rounded-xl bg-[#0075FF] text-white font-extrabold hover:bg-[#168CFF] shadow-sm transition-all inline-flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Editar Permissões de Abas</span>
                    </button>
                  )}

                  {canEditUser && (
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(user.user_id)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                        user.is_active
                          ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      )}
                    >
                      {user.is_active ? 'Suspender' : 'Ativar'}
                    </button>
                  )}
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
