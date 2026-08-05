'use client'

import { useState, useEffect } from 'react'
import { PERMISSIONS, UserProfileWithRole } from '@/lib/auth/permissions'
import { updateUserRoleAction, updateUserPermissionsAction, syncAuthUsersToProfilesAction } from '@/lib/actions/users'
import { Icon } from '@/components/ui/icon'
import { PermissionsNavIcon } from '@/lib/icons/navigation'
import {
  ConfigActionIcon,
  SearchActionIcon,
  SaveActionIcon,
  CancelActionIcon,
} from '@/lib/icons/actions'
import { MetricUserIcon } from '@/lib/icons/dashboard'
import {
  AdminStatusIcon,
  ActiveUserStatusIcon,
  SuspendedUserStatusIcon,
  SuccessStatusIcon,
  ErrorStatusIcon,
  SpinnerStatusIcon,
} from '@/lib/icons/status'
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

  // Configurações & Usuários
  { key: 'users.view', label: 'Visualizar Usuários & Permissões', category: 'Configurações' },
  { key: 'users.edit_roles', label: 'Gerenciar Cargos e Permissões de Usuários', category: 'Configurações' },
]

interface UsersPermissionsTabProps {
  users: UserProfileWithRole[]
  onUpdateUsers: (users: UserProfileWithRole[]) => void
  userProfile: UserProfileWithRole | null
}

export function UsersPermissionsTab({
  users = [],
  onUpdateUsers,
  userProfile,
}: UsersPermissionsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<UserProfileWithRole | null>(null)
  const [editingPerms, setEditingPerms] = useState<Record<string, boolean>>({})
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  // Trigger sync on component mount to guarantee all auth users exist in profiles
  useEffect(() => {
    handleSyncAuthUsers()
  }, [])

  const handleSyncAuthUsers = async () => {
    setSyncing(true)
    try {
      await syncAuthUsersToProfilesAction()
      const supabase = createClient()
      const { data: updatedProfiles } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (updatedProfiles && updatedProfiles.length > 0) {
        onUpdateUsers(updatedProfiles as UserProfileWithRole[])
      }
    } catch (err) {
      console.error('Error syncing auth users:', err)
    } finally {
      setSyncing(false)
    }
  }

  // Filter users by search term
  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role_slug?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRoleChange = async (userId: string, newRoleSlug: string) => {
    setSavingUserId(userId)

    const updated = users.map((u) => (u.user_id === userId ? { ...u, role_slug: newRoleSlug } : u))
    onUpdateUsers(updated)

    await updateUserRoleAction(userId, newRoleSlug)
    setSavingUserId(null)
  }

  const handleOpenPermsModal = (user: UserProfileWithRole) => {
    setSelectedUserForPerms(user)

    // Build permissions map from existing custom permissions
    const currentPerms: Record<string, boolean> = {}
    TAB_PERMISSION_KEYS.forEach((item) => {
      if (user.custom_permissions && item.key in user.custom_permissions) {
        currentPerms[item.key] = Boolean(user.custom_permissions[item.key])
      } else {
        currentPerms[item.key] = false
      }
    })

    setEditingPerms(currentPerms)
  }

  const handleTogglePerm = (key: string) => {
    setEditingPerms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSavePermissions = async () => {
    if (!selectedUserForPerms) return

    setSavingUserId(selectedUserForPerms.user_id)

    const updatedUsers = users.map((u) => {
      if (u.user_id === selectedUserForPerms.user_id) {
        return {
          ...u,
          custom_permissions: editingPerms,
        }
      }
      return u
    })

    onUpdateUsers(updatedUsers)
    await updateUserPermissionsAction(selectedUserForPerms.user_id, editingPerms)

    setSelectedUserForPerms(null)
    setSavingUserId(null)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-6 max-w-full overflow-hidden font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0C1D36] flex items-center gap-2">
            <Icon icon={PermissionsNavIcon} size={20} className="text-[#0075FF]" />
            <span>Gerenciamento de Usuários & Permissões</span>
          </h2>
          <p className="text-xs text-slate-500">
            Controle de cargos e permissões individuais salvas no Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncAuthUsers}
          disabled={syncing}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors flex items-center gap-2"
        >
          <Icon icon={SpinnerStatusIcon} size={16} className={cn('text-[#0075FF]', syncing && 'animate-spin')} />
          <span>{syncing ? 'Sincronizando...' : 'Sincronizar Usuários'}</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative w-full sm:w-80">
        <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400">
          <Icon icon={SearchActionIcon} size={16} />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar usuário por nome, e-mail..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#0075FF]"
        />
      </div>

      {/* USERS TABLE */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Icon icon={MetricUserIcon} size={40} className="text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-[#0C1D36]">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl max-w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#081D3A] text-white border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 whitespace-nowrap">Usuário</th>
                <th className="p-3.5 whitespace-nowrap">Cargo</th>
                <th className="p-3.5 whitespace-nowrap">Permissões de Acesso</th>
                <th className="p-3.5 whitespace-nowrap">Status</th>
                <th className="p-3.5 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.map((user) => {
                const isAdmin = user.role_slug === 'admin'
                const activePermsCount = user.custom_permissions
                  ? Object.values(user.custom_permissions).filter(Boolean).length
                  : 0

                return (
                  <tr key={user.id || user.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#081D3A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {user.full_name ? user.full_name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-[#0C1D36] text-sm flex items-center gap-1.5">
                            <span>{user.full_name || 'Sem nome'}</span>
                            {isAdmin && (
                              <span title="Administrador Principal">
                                <Icon icon={AdminStatusIcon} size={14} className="text-amber-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* CARGO (ESTRITAMENTE ORGANIZACIONAL) */}
                    <td className="p-3.5">
                      <select
                        value={user.role_slug || ''}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        disabled={savingUserId === user.user_id}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#0C1D36] outline-none"
                      >
                        <option value="">Sem cargo definido</option>
                        <option value="admin">Administrador</option>
                        <option value="comercial">Comercial</option>
                        <option value="designer">Designer UI/UX</option>
                        <option value="desenvolvedor">Desenvolvedor Frontend</option>
                        <option value="suporte">Suporte ao Cliente</option>
                        <option value="outro">Outro</option>
                      </select>
                    </td>

                    {/* STATUS DE PERMISSÕES */}
                    <td className="p-3.5 whitespace-nowrap">
                      {isAdmin ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                          <Icon icon={AdminStatusIcon} size={12} />
                          <span>Acesso Total (Administrador)</span>
                        </span>
                      ) : activePermsCount > 0 ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800">
                          {activePermsCount} permissões / abas ativas
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
                          Sem permissões (Apenas Dashboard)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[#10B981] font-bold text-[11px]">
                          <Icon icon={ActiveUserStatusIcon} size={14} />
                          <span>Ativo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[11px]">
                          <Icon icon={SuspendedUserStatusIcon} size={14} />
                          <span>Inativo</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenPermsModal(user)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-[#0075FF] hover:bg-slate-50 text-[#0075FF] font-bold text-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <Icon icon={ConfigActionIcon} size={14} />
                        <span>Ações de Permissão</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PERMISSIONS MATRIX MODAL */}
      {selectedUserForPerms && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 border border-slate-200 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-[#0C1D36]">
                  Ações de Permissão: {selectedUserForPerms.full_name}
                </h3>
                <p className="text-xs text-slate-400">
                  Marque as abas e ações que este usuário tem autorização para acessar no painel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForPerms(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <Icon icon={CancelActionIcon} size={18} />
              </button>
            </div>

            {/* CHECKBOX MATRIX GROUPED BY CATEGORY */}
            <div className="flex-1 overflow-y-auto space-y-5 p-1 text-xs">
              {selectedUserForPerms.role_slug === 'admin' ? (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-semibold space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Icon icon={AdminStatusIcon} size={16} />
                    <span>Este usuário é Administrador Supabase</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Administradores possuem acesso total automático a todas as abas e ações do sistema.
                  </p>
                </div>
              ) : (
                ['Visão Geral', 'Gestão de Projetos', 'Orçamentos', 'Conteúdo & Website', 'Configurações'].map((cat) => {
                  const catItems = TAB_PERMISSION_KEYS.filter((item) => item.category === cat)
                  if (catItems.length === 0) return null

                  return (
                    <div key={cat} className="space-y-2 border-b border-slate-100 pb-3">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#0075FF]">
                        {cat}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {catItems.map((item) => {
                          const isChecked = Boolean(editingPerms[item.key])
                          return (
                            <label
                              key={item.key}
                              className={cn(
                                'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer',
                                isChecked
                                  ? 'bg-[#0075FF]/10 border-[#0075FF]/40 text-[#0075FF] font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePerm(item.key)}
                                className="w-4 h-4 rounded text-[#0075FF] focus:ring-0"
                              />
                              <span>{item.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedUserForPerms(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 text-xs hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-6 py-2.5 rounded-xl bg-[#0075FF] hover:bg-[#168CFF] text-white font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                <Icon icon={SaveActionIcon} size={16} />
                <span>Salvar Permissões</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
