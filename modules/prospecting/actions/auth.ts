import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { hasPermission, PERMISSIONS, type UserProfileWithRole } from '@/lib/auth/permissions'
export async function authorizeProspecting(manage = false) {
  const db = await createClient()
  const {
    data: { user },
    error,
  } = await db.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Entre novamente para acessar Prospecção.')
  const { data, error: profileError } = await db
    .from('profiles')
    .select('id,user_id,full_name,email,is_active,is_super_admin,custom_permissions')
    .eq('user_id', user.id)
    .single()
  if (profileError || !data) throw new Error('Perfil de acesso não encontrado.')
  const profile = { ...data, role_slug: '' } as UserProfileWithRole
  if (
    !hasPermission(profile, PERMISSIONS.PROSPECTING_VIEW) ||
    (manage && !hasPermission(profile, PERMISSIONS.PROSPECTING_MANAGE))
  ) {
    throw new Error('Seu usuário não possui permissão para esta ação em Prospecção.')
  }
  return { db, profile, canManage: hasPermission(profile, PERMISSIONS.PROSPECTING_MANAGE) }
}
