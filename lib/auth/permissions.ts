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
 * Centralized authorization check
 */
export function hasPermission(
  user: UserProfileWithRole | null,
  permissionKey: PermissionKey
): boolean {
  if (!user || !user.is_active) return false

  // Administrador has full access to everything
  if (user.role_slug === 'admin') return true

  // Check individual custom permission override first
  if (user.custom_permissions && permissionKey in user.custom_permissions) {
    return user.custom_permissions[permissionKey]
  }

  // Fallback to role default permissions
  switch (user.role_slug) {
    case 'comercial':
      return (
        permissionKey.startsWith('client_projects.') ||
        permissionKey.startsWith('pricing.') ||
        permissionKey === 'portfolio.view'
      )
    case 'designer':
      return (
        permissionKey === 'client_projects.view_assigned' ||
        permissionKey === 'client_projects.view' ||
        permissionKey === 'client_projects.move_kanban' ||
        permissionKey === 'client_projects.upload_files' ||
        permissionKey.startsWith('portfolio.')
      )
    default:
      return false
  }
}
