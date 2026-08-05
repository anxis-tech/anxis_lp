export const PERMISSIONS = {
  // Portfólio da Home
  PORTFOLIO_VIEW: 'portfolio.view',
  PORTFOLIO_CREATE: 'portfolio.create',
  PORTFOLIO_EDIT: 'portfolio.edit',
  PORTFOLIO_DELETE: 'portfolio.delete',
  PORTFOLIO_REORDER: 'portfolio.reorder',
  PORTFOLIO_PUBLISH: 'portfolio.publish',

  // Projetos de Clientes
  CLIENT_PROJECTS_VIEW: 'client_projects.view',
  CLIENT_PROJECTS_VIEW_ALL: 'client_projects.view_all',
  CLIENT_PROJECTS_VIEW_ASSIGNED: 'client_projects.view_assigned',
  CLIENT_PROJECTS_CREATE: 'client_projects.create',
  CLIENT_PROJECTS_EDIT: 'client_projects.edit',
  CLIENT_PROJECTS_DELETE: 'client_projects.delete',
  CLIENT_PROJECTS_ASSIGN_RESPONSIBLE: 'client_projects.assign_responsible',
  CLIENT_PROJECTS_MANAGE_PARTICIPANTS: 'client_projects.manage_participants',
  CLIENT_PROJECTS_MOVE_KANBAN: 'client_projects.move_kanban',
  CLIENT_PROJECTS_UPLOAD_FILES: 'client_projects.upload_files',
  CLIENT_PROJECTS_DELETE_FILES: 'client_projects.delete_files',
  CLIENT_PROJECTS_CHANGE_STATUS: 'client_projects.change_status',

  // Calculadora de Precificação
  PRICING_VIEW: 'pricing.view',
  PRICING_USE: 'pricing.use',
  PRICING_SAVE_QUOTE: 'pricing.save_quote',
  PRICING_VIEW_HISTORY: 'pricing.view_history',
  PRICING_MANAGE_SETTINGS: 'pricing.manage_settings',

  // Usuários e Permissões
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_ACTIVATE: 'users.activate',
  USERS_RESET_PASSWORD: 'users.reset_password',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  USERS_MANAGE_PERMISSIONS: 'users.manage_permissions',
  USERS_DELETE: 'users.delete',

  // Auditoria
  AUDIT_VIEW: 'audit.view',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export interface UserProfileWithRole {
  id: string
  user_id: string
  full_name: string
  email: string
  role_slug: string // 'admin', 'comercial', 'designer'
  is_active: boolean
  custom_permissions?: Record<string, boolean>
}

/**
 * Centralized authorization check:
 * - Supabase Administrator (role_slug === 'admin') has full access to everything.
 * - Roles (Comercial, Designer, Desenvolvedor, etc.) are strictly organizational tags and DO NOT grant permissions.
 * - All non-admin tab and action permissions are strictly controlled by user.custom_permissions.
 */
export function hasPermission(
  user: UserProfileWithRole | null,
  permissionKey: PermissionKey
): boolean {
  if (!user || !user.is_active) return false

  // Administrador defined in Supabase has full access to everything
  if (user.role_slug === 'admin') return true

  // For non-admin users, access is determined strictly by custom_permissions
  if (user.custom_permissions) {
    if (permissionKey in user.custom_permissions) {
      return Boolean(user.custom_permissions[permissionKey])
    }

    // Helper aliases for viewing tabs
    if (permissionKey === 'client_projects.view') {
      return (
        Boolean(user.custom_permissions['client_projects.view']) ||
        Boolean(user.custom_permissions['client_projects.view_all']) ||
        Boolean(user.custom_permissions['client_projects.view_assigned'])
      )
    }

    if (permissionKey === 'pricing.view') {
      return (
        Boolean(user.custom_permissions['pricing.view']) ||
        Boolean(user.custom_permissions['quotes_history.view'])
      )
    }
  }

  // Non-admin users without explicit permission return false
  return false
}
