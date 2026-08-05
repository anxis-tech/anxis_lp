'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAuditEventAction } from '@/lib/actions/audit'

export async function getPublishedHomeProjectsAction() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching published projects:', error)
    return []
  }
  return data
}

export async function getAllHomeProjectsAction() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching all home projects:', error)
    return []
  }
  return data
}

export async function saveHomeProjectAction(projectData: any) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Usuário não autenticado.' }

  const isEdit = !!projectData.id

  if (isEdit) {
    const { error } = await supabase
      .from('projects')
      .update({
        title: projectData.title,
        description: projectData.description,
        client: projectData.client,
        year: projectData.year,
        image_url: projectData.image_url,
        tags: projectData.tags,
        live_url: projectData.live_url,
        is_published: projectData.is_published ?? true,
        is_featured: projectData.is_featured ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectData.id)

    if (error) return { success: false, message: error.message }

    await logAuditEventAction({
      action: 'edit_portfolio_project',
      module: 'portfolio',
      recordId: projectData.id,
      newData: projectData,
    })
  } else {
    const { error } = await supabase.from('projects').insert({
      title: projectData.title,
      description: projectData.description,
      client: projectData.client,
      year: projectData.year,
      image_url: projectData.image_url,
      tags: projectData.tags || [],
      live_url: projectData.live_url,
      is_published: projectData.is_published ?? true,
      is_featured: projectData.is_featured ?? false,
      display_order: projectData.display_order || 0,
    })

    if (error) return { success: false, message: error.message }

    await logAuditEventAction({
      action: 'create_portfolio_project',
      module: 'portfolio',
      newData: projectData,
    })
  }

  revalidatePath('/')
  revalidatePath('/admin')
  return { success: true, message: 'Projeto salvo no Portfólio com sucesso!' }
}

export async function deleteHomeProjectAction(id: string) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Usuário não autenticado.' }

  const { error } = await supabase.from('projects').delete().eq('id', id)

  if (error) return { success: false, message: error.message }

  await logAuditEventAction({
    action: 'delete_portfolio_project',
    module: 'portfolio',
    recordId: id,
  })

  revalidatePath('/')
  revalidatePath('/admin')
  return { success: true, message: 'Projeto removido do Portfólio.' }
}
