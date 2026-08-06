'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAuditEventAction } from '@/lib/actions/audit'
import { createContractForProject } from '@/lib/actions/contracts'

export async function getClientProjectsAction() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('client_projects')
    .select(`
      *,
      files:client_project_files(*),
      links:client_project_links(*),
      tasks:client_project_tasks(*),
      activity_history:client_project_activity(*)
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching client projects:', error)
    return []
  }
  return data || []
}

export async function saveClientProjectAction(projectData: any) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Usuário não autenticado.' }

  const isEdit = !!projectData.id && !projectData.id.startsWith('cp-temp-') && !projectData.id.startsWith('temp-') && !projectData.id.startsWith('cp-')

  const payload = {
    title: projectData.title,
    client_name: projectData.client_name,
    company: projectData.company || null,
    email: projectData.email || null,
    phone: projectData.phone || null,
    whatsapp: projectData.whatsapp || null,
    project_type: projectData.project_type,
    platform: projectData.platform || 'Next.js',
    status: projectData.status || 'Novo projeto',
    kanban_stage_id: projectData.kanban_stage_id || null,
    kanban_position: projectData.kanban_position || 0,
    priority: projectData.priority || 'Normal',
    responsible_user_id: projectData.responsible_user_id || null,
    responsible_user_name: projectData.responsible_user_name || null,
    responsible_user_email: projectData.responsible_user_email || null,
    quote_id: projectData.quote_id || null,
    quote_data: projectData.quote_data || {},
    approved_value: projectData.quote_data?.final_value || projectData.approved_value || 0,
    paid_value: projectData.paid_value || 0,
    payment_status: projectData.payment_status || 'Pendente',
    payment_link: projectData.payment_link || null,
    payment_method: projectData.payment_method || null,
    start_date: projectData.start_date || null,
    deadline: projectData.deadline || null,
    description: projectData.description || null,
    internal_notes: projectData.internal_notes || null,
    client_contact_json: projectData.client_contact_json || {},
    scope_briefing_json: projectData.scope_briefing_json || {},
    content_copy_json: projectData.content_copy_json || {},
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }

  let savedProjectId: string

  if (isEdit) {
    savedProjectId = projectData.id
    const { error: updateError } = await supabase
      .from('client_projects')
      .update(payload)
      .eq('id', savedProjectId)

    if (updateError) {
      console.error('Error updating client project:', updateError)
      return { success: false, message: updateError.message }
    }

    await logAuditEventAction({
      action: 'edit_client_project',
      module: 'client_projects',
      recordId: savedProjectId,
      newData: payload,
    })
  } else {
    const { data: newProj, error: insertError } = await supabase
      .from('client_projects')
      .insert({ ...payload, created_by: user.id })
      .select('id')
      .single()

    if (insertError || !newProj) {
      console.error('Error inserting client project:', insertError)
      return { success: false, message: insertError?.message || 'Falha ao inserir o projeto no banco de dados.' }
    }

    savedProjectId = newProj.id

    await logAuditEventAction({
      action: 'create_client_project',
      module: 'client_projects',
      recordId: savedProjectId,
      newData: payload,
    })
  }

  // SYNC RELATED LINKS
  if (Array.isArray(projectData.links)) {
    // Delete existing links for this project
    await supabase.from('client_project_links').delete().eq('project_id', savedProjectId)

    if (projectData.links.length > 0) {
      const linksToInsert = projectData.links.map((link: any) => ({
        project_id: savedProjectId,
        label: link.label || 'Link sem título',
        url: link.url || '',
        category: link.category || 'Outro',
        description: link.description || null,
        created_by: user.id,
      }))

      const { error: linksError } = await supabase.from('client_project_links').insert(linksToInsert)
      if (linksError) {
        console.error('Error syncing client project links:', linksError)
        return { success: false, message: `Erro ao salvar links: ${linksError.message}` }
      }
    }
  }

  // SYNC RELATED FILES
  if (Array.isArray(projectData.files)) {
    // Delete existing files for this project
    await supabase.from('client_project_files').delete().eq('project_id', savedProjectId)

    if (projectData.files.length > 0) {
      const filesToInsert = projectData.files.map((file: any) => ({
        project_id: savedProjectId,
        file_name: file.file_name || 'Arquivo sem nome',
        storage_path: file.storage_path || `projects/${savedProjectId}/${file.file_name}`,
        file_type: file.file_type || 'application/octet-stream',
        file_size: file.file_size || 0,
        category: file.category || 'Geral',
        description: file.description || null,
        uploaded_by: user.id,
      }))

      const { error: filesError } = await supabase.from('client_project_files').insert(filesToInsert)
      if (filesError) {
        console.error('Error syncing client project files:', filesError)
        return { success: false, message: `Erro ao salvar arquivos: ${filesError.message}` }
      }
    }
  }

  // QUERY BACK FROM SUPABASE TO CONFIRM PERSISTENCE
  const { data: verifiedProject, error: fetchError } = await supabase
    .from('client_projects')
    .select(`
      *,
      files:client_project_files(*),
      links:client_project_links(*),
      tasks:client_project_tasks(*)
    `)
    .eq('id', savedProjectId)
    .single()

  if (fetchError || !verifiedProject) {
    console.error('Error verifying persisted client project:', fetchError)
    return {
      success: false,
      message: fetchError?.message || 'Falha ao confirmar a persistência do projeto no banco de dados.',
    }
  }

  // Trigger contract creation for new projects automatically
  let contractId: string | undefined = undefined
  if (!isEdit) {
    try {
      const contractRes = await createContractForProject(savedProjectId)
      if (contractRes.success) {
        contractId = contractRes.contractId
      }
    } catch (contractErr) {
      console.error('Error triggering contract creation:', contractErr)
    }
  }

  revalidatePath('/admin')
  return {
    success: true,
    isEdit,
    project: verifiedProject,
    contractId,
  }
}

export async function moveKanbanStageAction(
  projectId: string,
  newStageId: string,
  newStatusName: string,
  newPosition: number,
  previousStatusName: string
) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Não autenticado.' }

  const { error } = await supabase
    .from('client_projects')
    .update({
      kanban_stage_id: newStageId,
      status: newStatusName,
      kanban_position: newPosition,
      last_activity_at: new Date().toISOString(),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (error) return { success: false, message: error.message }

  // Log activity record
  await supabase.from('client_project_activity').insert({
    project_id: projectId,
    user_id: user.id,
    user_name: user.email?.split('@')[0] || 'Usuário',
    action: `Moveu o projeto de "${previousStatusName}" para "${newStatusName}"`,
    previous_data: { status: previousStatusName },
    new_data: { status: newStatusName, stage_id: newStageId },
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function generateSignedDownloadUrlAction(storagePath: string) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.storage
    .from('client-project-files')
    .createSignedUrl(storagePath, 3600) // 1 hour expiration

  if (error) {
    console.error('Error generating signed URL:', error)
    return { success: false, message: error.message }
  }

  return { success: true, signedUrl: data.signedUrl }
}

export async function deleteClientProjectAction(id: string) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Não autenticado.' }

  const { error } = await supabase.from('client_projects').delete().eq('id', id)

  if (error) return { success: false, message: error.message }

  await logAuditEventAction({
    action: 'delete_client_project',
    module: 'client_projects',
    recordId: id,
  })

  revalidatePath('/admin')
  return { success: true, message: 'Projeto excluído com sucesso.' }
}
