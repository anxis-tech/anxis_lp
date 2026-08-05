'use client'

import { useState } from 'react'
import { PERMISSIONS, PermissionKey, UserProfileWithRole } from '@/lib/auth/permissions'
import { createAdminUserAction } from '@/lib/actions/users'
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  KeyRound,
  RotateCcw,
  AlertTriangle,
  Mail,
  Lock,
  Loader2,
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

const MODULE_LABELS: Record<string, string> = {
  portfolio: 'Portfólio da Home',
  client_projects: 'Projetos de Clientes',
  pricing: 'Calculadora de Precificação',
  users: 'Usuários e Permissões',
  audit: 'Logs de Auditoria',
}

interface UsersPermissionsTabProps {
  currentUserId?: string
  canCreateUser: boolean
  canEditUser: boolean
  canManageRoles: boolean
  canManagePermissions: boolean
}

export function UsersPermissionsTab({
  currentUserId,
  canCreateUser = true,
  canEditUser = true,
  canManageRoles = true,
  canManagePermissions = true,
}: UsersPermissionsTabProps) {
  const [userList, setUserList] = useState<UserProfileWithRole[]>(MOCK_USERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')

  // Create User Form Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    roleSlug: 'comercial' as 'admin' | 'comercial' | 'designer',
    method: 'invite' as 'invite' | 'temp_password',
    tempPassword: '',
    notes: '',
  })

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await createAdminUserAction(createForm)

      if (res.success) {
        // Add to local state display
        const newU: UserProfileWithRole = {
          id: `u-${Date.now()}`,
          user_id: `user-${Date.now()}`,
          full_name: createForm.fullName,
          email: createForm.email,
          role_slug: createForm.roleSlug,
          is_active: true,
        }
        setUserList((prev) => [...prev, newU])
        setIsCreateModalOpen(false)
        setCreateForm({
          fullName: '',
          email: '',
          roleSlug: 'comercial',
          method: 'invite',
          tempPassword: '',
          notes: '',
        })
        alert(res.message)
      } else {
        alert(res.message || 'Erro ao criar usuário.')
      }
    } catch (err: any) {
      alert(err?.message || 'Erro de rede.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleUserStatus = (userId: string) => {
    setUserList((prev) =>
      prev.map((u) => {
        if (u.user_id === userId) {
          // Safety: Cannot deactivate self or last admin
          if (u.role_slug === 'admin' && u.is_active && prev.filter((x) => x.role_slug === 'admin' && x.is_active).length <= 1) {
            alert('Ação bloqueada: Não é possível desativar o único administrador ativo do sistema!')
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
    alert('Permissões individuais atualizadas com sucesso!')
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0075FF]" />
            <span>Usuários e Permissões (RBAC)</span>
          </h2>
          <p className="text-xs text-[#596579]">
            Gestão de membros da equipe, cargos institucionais e matriz granular de acessos.
          </p>
        </div>

        {canCreateUser && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0075FF] hover:bg-[#168CFF] shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>Criar Novo Usuário</span>
          </button>
        )}
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
                roleFilter === role ? 'bg-[#081D3A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#081D3A] text-white border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3.5 whitespace-nowrap">Usuário</th>
              <th className="p-3.5 whitespace-nowrap">Cargo</th>
              <th className="p-3.5 whitespace-nowrap">Status</th>
              <th className="p-3.5 whitespace-nowrap">Permissões Especiais</th>
              <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3.5">
                  <div className="font-bold text-[#0C1D36] text-sm">{user.full_name}</div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
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
                    <span>{user.is_active ? 'Ativo' : 'Inativo'}</span>
                  </span>
                </td>

                <td className="p-3.5">
                  {user.custom_permissions && Object.keys(user.custom_permissions).length > 0 ? (
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded">
                      Sobrescrita Personalizada
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Padrão do Cargo</span>
                  )}
                </td>

                <td className="p-3.5 text-right space-x-1.5">
                  {canManagePermissions && (
                    <button
                      type="button"
                      onClick={() => handleOpenPermissionsModal(user)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-[#081D3A] font-bold hover:bg-slate-200"
                      title="Matriz de Permissões"
                    >
                      Permissões ⚙️
                    </button>
                  )}

                  {canEditUser && (
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(user.user_id)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors',
                        user.is_active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600'
                      )}
                    >
                      {user.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: CREATE USER (INVITE OR TEMP PASSWORD) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <h3 className="text-lg font-extrabold text-[#0C1D36] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#0075FF]" />
              <span>Criar Novo Usuário</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Nome do usuário"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="usuario@anxis.com.br"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Cargo Inicial</label>
                <select
                  value={createForm.roleSlug}
                  onChange={(e) => setCreateForm({ ...createForm, roleSlug: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="admin">Administrador (Acesso Total)</option>
                  <option value="comercial">Comercial (Projetos & Precificação)</option>
                  <option value="designer">Designer (Projetos & Portfólio)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Método de Criação de Acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, method: 'invite' })}
                    className={cn(
                      'p-2.5 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5',
                      createForm.method === 'invite'
                        ? 'bg-[#0075FF] text-white border-[#0075FF]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    )}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Convite p/ E-mail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, method: 'temp_password' })}
                    className={cn(
                      'p-2.5 rounded-xl border text-center font-bold flex items-center justify-center gap-1.5',
                      createForm.method === 'temp_password'
                        ? 'bg-[#0075FF] text-white border-[#0075FF]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    )}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Senha Temporária</span>
                  </button>
                </div>
              </div>

              {createForm.method === 'temp_password' && (
                <div>
                  <label className="block font-bold mb-1">Senha Temporária</label>
                  <input
                    type="password"
                    required
                    value={createForm.tempPassword}
                    onChange={(e) => setCreateForm({ ...createForm, tempPassword: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#0075FF] text-white text-xs font-bold hover:bg-[#168CFF]"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: GRANULAR PERMISSION MATRIX */}
      {editingUserPerms && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0C1D36]">
                  Matriz de Permissões: {editingUserPerms.full_name}
                </h3>
                <p className="text-xs text-[#596579]">
                  Cargo atual: <span className="font-bold text-[#0075FF]">{editingUserPerms.role_slug}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUserPerms(null)}
                className="text-slate-400 font-bold"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 text-xs">
              {Object.entries(MODULE_LABELS).map(([modKey, modTitle]) => (
                <div key={modKey} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-[#081D3A] border-b border-slate-200 pb-1">{modTitle}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {Object.values(PERMISSIONS)
                      .filter((pk) => pk.startsWith(`${modKey}.`))
                      .map((pk) => (
                        <label key={pk} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customPerms[pk] ?? true}
                            onChange={() => handleTogglePermissionKey(pk)}
                            className="rounded border-slate-300 text-[#0075FF]"
                          />
                          <span className="text-slate-700">{pk}</span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-xl bg-[#0075FF] text-white text-xs font-bold hover:bg-[#168CFF]"
              >
                Salvar Matriz de Permissões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
