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

  // Quadro Kanban
  KANBAN_VIEW: 'kanban_board.view',

  // Calculadora de Precificação
  PRICING_VIEW: 'pricing.view',
  PRICING_USE: 'pricing.use',
  PRICING_SAVE_QUOTE: 'pricing.save_quote',
  PRICING_VIEW_HISTORY: 'quotes_history.view',
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
  role_slug: string // Purely organizational tag ('comercial', 'designer', etc.) - DOES NOT GRANT PERMISSIONS
  is_super_admin?: boolean // Real Supabase Primary Administrator (unrestricted access)
  is_active: boolean
  custom_permissions?: Record<string, boolean>
}

/**
 * Centralized authorization check:
 * - Real Supabase Primary Administrator (is_super_admin === true) has full access to everything.
 * - Roles (Cargo) are strictly organizational tags and DO NOT grant, block or alter any permissions.
 * - All non-super-admin users rely strictly on individual custom_permissions saved in Supabase.
 */
export function hasPermission(
  user: UserProfileWithRole | null,
  permissionKey: PermissionKey
): boolean {
  if (!user || !user.is_active) return false

  // Real Supabase Administrator has full access to everything
  if (user.is_super_admin === true) return true

  // For all other users, access is determined strictly by custom_permissions
  if (user.custom_permissions) {
    if (permissionKey in user.custom_permissions) {
      return Boolean(user.custom_permissions[permissionKey])
    }

    // Helper aliases for viewing modules/tabs
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

  // Users without explicit custom permission return false
  return false
}

