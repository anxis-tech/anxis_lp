'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { z } from 'zod'

const createUserSchema = z.object({
  fullName: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  roleSlug: z.enum(['comercial', 'designer', 'desenvolvedor']),
  method: z.enum(['invite', 'temp_password']),
  tempPassword: z.string().optional(),
  notes: z.string().optional(),
})

export async function createAdminUserAction(formData: unknown) {
  try {
    // 1. Verify current session in server
    const serverSupabase = await createServerSupabase()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()

    if (!currentUser) {
      return { success: false, message: 'Sessão inválida ou não autenticada.' }
    }

    // 2. Parse & Validate Input
    const validated = createUserSchema.parse(formData)

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      return {
        success: false,
        message: 'Erro de configuração: SUPABASE_SERVICE_ROLE_KEY não está definida no servidor. Contate o administrador.',
      }
    }

    // 3. Initialize Admin Supabase Client with Service Role Key
    const supabaseAdmin = createAdminSupabase(supabaseUrl, serviceRoleKey)

    // 4. Create Auth User
    let newUserId: string

    if (validated.method === 'invite') {
      const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        validated.email,
        { data: { full_name: validated.fullName } }
      )
      if (inviteErr) throw inviteErr
      newUserId = inviteData.user.id
    } else {
      if (!validated.tempPassword || validated.tempPassword.length < 6) {
        return { success: false, message: 'Senha temporária deve ter pelo menos 6 caracteres.' }
      }
      const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: validated.email,
        password: validated.tempPassword,
        email_confirm: true,
        user_metadata: { full_name: validated.fullName },
      })
      if (createErr) throw createErr
      newUserId = createData.user.id
    }

    // 5. Get Role ID
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('slug', validated.roleSlug)
      .single()

    // 6. Insert Profile
    await supabaseAdmin.from('profiles').insert({
      user_id: newUserId,
      full_name: validated.fullName,
      email: validated.email,
      role_id: roleData?.id || null,
      is_active: true,
      must_change_password: validated.method === 'temp_password',
      notes: validated.notes || null,
      created_by: currentUser.id,
    })

    // 7. Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: currentUser.id,
      user_email: currentUser.email,
      action: 'create_user',
      module: 'users',
      record_id: newUserId,
      new_data: { email: validated.email, role: validated.roleSlug, method: validated.method },
    })

    return {
      success: true,
      message: `Usuário ${validated.fullName} criado com sucesso!`,
    }
  } catch (err: any) {
    console.error('Error creating user:', err)
    return {
      success: false,
      message: err?.message || 'Erro ao criar usuário.',
    }
  }
}

export async function updateUserRoleAction(userId: string, roleSlug: string) {
  try {
    if (roleSlug === 'admin') {
      return {
        success: false,
        message: 'O cargo de Administrador Principal não é selecionável no painel. Ele deve ser atribuído exclusivamente via script no Supabase SQL Editor.',
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey || !supabaseUrl) {
      return { success: false, message: 'Erro de configuração: SUPABASE_SERVICE_ROLE_KEY não está definida no servidor.' }
    }

    const supabaseAdmin = createAdminSupabase(supabaseUrl, serviceRoleKey)

    let roleId: string | null = null

    if (roleSlug) {
      const { data: roleData, error: roleErr } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('slug', roleSlug)
        .single()

      if (roleErr || !roleData) {
        return { success: false, message: 'Cargo não encontrado no banco de dados.' }
      }
      roleId = roleData.id
    }

    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ role_id: roleId })
      .or(`user_id.eq.${userId},id.eq.${userId}`)

    if (updateErr) throw updateErr

    return { success: true, message: `Cargo alterado com sucesso!` }
  } catch (err: any) {
    console.error('Error updating user role:', err)
    return { success: false, message: err?.message || 'Erro ao atualizar cargo.' }
  }
}

export async function setUserAsAdminByEmailAction(email: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey || !supabaseUrl) {
      return { success: false, message: 'Erro de configuração: SUPABASE_SERVICE_ROLE_KEY não está definida no servidor.' }
    }

    const supabaseAdmin = createAdminSupabase(supabaseUrl, serviceRoleKey)

    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('slug', 'admin')
      .single()

    if (!roleData) return { success: false, message: 'Cargo de Administrador não encontrado.' }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role_id: roleData.id, is_active: true })
      .eq('email', email)

    if (error) throw error

    return { success: true, message: `Usuário ${email} promovido a Administrador (Controle Total)!` }
  } catch (err: any) {
    console.error('Error setting admin by email:', err)
    return { success: false, message: err?.message || 'Erro ao atribuir permissão de administrador.' }
  }
}

export async function updateUserPermissionsAction(
  targetUserId: string,
  customPermissions: Record<string, boolean>
) {
  try {
    const serverSupabase = await createServerSupabase()
    const { data: { user: currentUser } } = await serverSupabase.auth.getUser()

    if (!currentUser) {
      return { success: false, message: 'Sessão inválida ou não autenticada.' }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey || !supabaseUrl) {
      return { success: false, message: 'Erro de configuração: SUPABASE_SERVICE_ROLE_KEY não está definida no servidor.' }
    }

    const supabaseAdmin = createAdminSupabase(supabaseUrl, serviceRoleKey)

    // Update custom_permissions on profiles matching user_id OR profile id
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ custom_permissions: customPermissions, updated_at: new Date().toISOString() })
      .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)

    if (updateErr) throw updateErr

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: currentUser.id,
      user_email: currentUser.email,
      action: 'update_permissions',
      module: 'users',
      record_id: targetUserId,
      new_data: { custom_permissions: customPermissions },
    })

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/admin')

    return { success: true, message: 'Permissões salvas com sucesso no Supabase!' }
  } catch (err: any) {
    console.error('Error updating user permissions:', err)
    return { success: false, message: err?.message || 'Erro ao salvar permissões.' }
  }
}

export async function syncAuthUsersToProfilesAction() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey || !supabaseUrl) {
      return { success: false, message: 'Service key missing' }
    }

    const supabaseAdmin = createAdminSupabase(supabaseUrl, serviceRoleKey)

    // Fetch all auth users
    const { data: authUsersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers()
    if (listErr || !authUsersData?.users) {
      return { success: false, message: listErr?.message || 'Failed to list auth users' }
    }

    // Fetch existing profile user_ids
    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id')

    const existingUserIds = new Set((existingProfiles || []).map((p) => p.user_id))

    // Insert profiles for auth users who don't have one
    const missingUsers = authUsersData.users.filter((u) => !existingUserIds.has(u.id))

    if (missingUsers.length > 0) {
      const newProfiles = missingUsers.map((u) => ({
        user_id: u.id,
        full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuário',
        email: u.email || '',
        role_id: null,
        is_active: true,
        custom_permissions: {},
      }))

      await supabaseAdmin.from('profiles').insert(newProfiles)
    }

    return { success: true, syncedCount: missingUsers.length }
  } catch (err: any) {
    console.error('Error syncing auth users:', err)
    return { success: false, message: err?.message }
  }
}

