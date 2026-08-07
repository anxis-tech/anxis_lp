'use server'

import { leadFormSchema, LeadFormData } from '@/lib/validations/lead-schema'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { UTMData } from '@/lib/analytics/utm'
import { Lead, LeadActivity, LeadFilterOptions, LeadStatus, LeadActivityType } from '@/types/lead.types'
import { revalidatePath } from 'next/cache'

// -----------------------------------------------------------------------------
// 1. PUBLIC SUBMIT LEAD FROM LANDING PAGE FORM
// -----------------------------------------------------------------------------
export async function submitLeadAction(formData: LeadFormData, utmParams: UTMData) {
  try {
    // 1. Validate Form Data
    const validatedData = leadFormSchema.parse(formData)

    // 2. Check Honeypot field (Antispam)
    if (validatedData.website_hp && validatedData.website_hp.length > 0) {
      return { success: false, message: 'Solicitação recusada.' }
    }

    const supabase = await createServerSupabase()

    // 3. Prevent duplicate spam entries (Check for same email or whatsapp in last 24h)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, name, email, whatsapp, status')
      .or(`email.eq.${validatedData.email},whatsapp.eq.${validatedData.whatsapp}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingLead) {
      // Record activity on existing lead instead of creating a duplicate
      await supabase.from('lead_activities').insert({
        lead_id: existingLead.id,
        activity_type: 'observacao',
        description: `Formulário reenviado via Landing Page. Tipo de Projeto: ${validatedData.project_type}. Mensagem: ${validatedData.message || 'Nenhuma'}`,
      })

      await supabase
        .from('leads')
        .update({
          last_interaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id)

      return {
        success: true,
        message: 'Recebemos suas informações novamente! Nossa equipe já possui seu contato em atendimento.',
      }
    }

    // 4. Create new Lead
    const leadPayload = {
      name: validatedData.name,
      company: validatedData.company || null,
      email: validatedData.email,
      whatsapp: validatedData.whatsapp,
      project_type: validatedData.project_type,
      current_platform: validatedData.current_platform || null,
      budget_range: validatedData.budget_range || null,
      desired_deadline: validatedData.desired_deadline || null,
      initial_message: validatedData.message || null,
      source: 'Landing Page',
      utm_source: utmParams.utm_source || null,
      utm_medium: utmParams.utm_medium || null,
      utm_campaign: utmParams.utm_campaign || null,
      utm_content: utmParams.utm_content || null,
      utm_term: utmParams.utm_term || null,
      gclid: utmParams.gclid || null,
      fbclid: utmParams.fbclid || null,
      landing_page: utmParams.landing_page || '/',
      referrer: utmParams.referrer || null,
      status: 'Novo',
      last_interaction_at: new Date().toISOString(),
    }

    const { data: newLead, error: insertErr } = await supabase
      .from('leads')
      .insert(leadPayload)
      .select()
      .single()

    if (insertErr) {
      console.error('Supabase error saving lead:', insertErr)
      throw insertErr
    }

    // 5. Log initial system activity
    if (newLead?.id) {
      await supabase.from('lead_activities').insert({
        lead_id: newLead.id,
        activity_type: 'criacao',
        description: `Lead capturado automaticamente via Landing Page (${validatedData.project_type}).`,
      })
    }

    return {
      success: true,
      message: 'Proposta solicitada com sucesso! Nossa equipe entrará em contato em breve.',
    }
  } catch (err: any) {
    console.error('Error submitting lead:', err)
    return {
      success: false,
      message: err?.message || 'Ocorreu um erro ao enviar a solicitação. Tente novamente.',
    }
  }
}

// -----------------------------------------------------------------------------
// 2. GET ALL LEADS (WITH FILTERS & MEUS LEADS)
// -----------------------------------------------------------------------------
export async function getLeadsAction(filters?: LeadFilterOptions) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

    if (filters) {
      // 1. Status Filter
      if (filters.status && filters.status !== 'todos' && filters.status !== 'meus_leads') {
        query = query.eq('status', filters.status)
      }

      // 2. "Meus Leads" Quick Filter
      if (filters.onlyMyLeads || filters.status === 'meus_leads') {
        if (user?.id) {
          query = query.eq('commercial_user_id', user.id)
        }
      } else if (filters.commercialUserId && filters.commercialUserId !== 'todos') {
        query = query.eq('commercial_user_id', filters.commercialUserId)
      }

      // 3. Project Type Filter
      if (filters.projectType && filters.projectType !== 'todos') {
        query = query.eq('project_type', filters.projectType)
      }

      // 4. Source Filter
      if (filters.source && filters.source !== 'todos') {
        query = query.eq('source', filters.source)
      }
    }

    const { data, error } = await query

    if (error) throw error

    let result = (data as Lead[]) || []

    // Filter in JS for Search and Period
    if (filters) {
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.toLowerCase()
        result = result.filter(
          (l) =>
            l.name.toLowerCase().includes(term) ||
            (l.company && l.company.toLowerCase().includes(term)) ||
            l.email.toLowerCase().includes(term) ||
            l.whatsapp.includes(term)
        )
      }

      if (filters.period && filters.period !== 'todos') {
        const now = new Date()
        let cutoff = new Date(0)

        if (filters.period === 'hoje') {
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (filters.period === 'ultimos_7_dias') {
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (filters.period === 'este_mes') {
          cutoff = new Date(now.getFullYear(), now.getMonth(), 1)
        } else if (filters.period === 'mes_anterior') {
          const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
          result = result.filter((l) => {
            const d = new Date(l.created_at)
            return d >= startPrev && d <= endPrev
          })
          cutoff = new Date(0) // bypassed by custom logic
        } else if (filters.period === 'este_ano') {
          cutoff = new Date(now.getFullYear(), 0, 1)
        }

        if (filters.period !== 'mes_anterior') {
          result = result.filter((l) => new Date(l.created_at) >= cutoff)
        }
      }
    }

    return { success: true, leads: result }
  } catch (err: any) {
    console.error('Error fetching leads:', err)
    return { success: false, leads: [], message: err?.message || 'Erro ao carregar leads.' }
  }
}

// -----------------------------------------------------------------------------
// 3. GET LEAD DETAILS (RECORD + ACTIVITIES + RELATED QUOTE + RELATED PROJECT)
// -----------------------------------------------------------------------------
export async function getLeadDetailsAction(leadId: string) {
  try {
    const supabase = await createServerSupabase()

    const [leadRes, actRes, quoteRes, projRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('lead_activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
      supabase.from('quotes').select('*').eq('lead_id', leadId).maybeSingle(),
      supabase.from('client_projects').select('*').eq('lead_id', leadId).maybeSingle(),
    ])

    if (leadRes.error) throw leadRes.error

    return {
      success: true,
      lead: leadRes.data as Lead,
      activities: (actRes.data as LeadActivity[]) || [],
      quote: quoteRes.data || null,
      project: projRes.data || null,
    }
  } catch (err: any) {
    console.error('Error fetching lead details:', err)
    return { success: false, message: err?.message || 'Erro ao buscar detalhes do lead.' }
  }
}

// -----------------------------------------------------------------------------
// 4. CREATE MANUAL LEAD IN ADMIN PANEL
// -----------------------------------------------------------------------------
export async function createLeadManualAction(leadData: {
  name: string
  company?: string
  email: string
  whatsapp: string
  phone?: string
  project_type: string
  current_platform?: string
  budget_range?: string
  desired_deadline?: string
  initial_message?: string
  commercial_user_id?: string
  commercial_user_name?: string
}) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, message: 'Usuário não autenticado.' }

    const adminName = user.user_metadata?.full_name || user.email || 'Administrador'

    const leadPayload = {
      name: leadData.name,
      company: leadData.company || null,
      email: leadData.email,
      whatsapp: leadData.whatsapp,
      phone: leadData.phone || null,
      project_type: leadData.project_type,
      current_platform: leadData.current_platform || null,
      budget_range: leadData.budget_range || null,
      desired_deadline: leadData.desired_deadline || null,
      initial_message: leadData.initial_message || null,
      commercial_user_id: leadData.commercial_user_id || null,
      commercial_user_name: leadData.commercial_user_name || null,
      source: 'Manual',
      status: 'Novo' as LeadStatus,
      created_by: user.id,
      created_by_name: adminName,
      last_interaction_at: new Date().toISOString(),
    }

    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(leadPayload)
      .select()
      .single()

    if (error) throw error

    // Log manual creation activity
    await supabase.from('lead_activities').insert({
      lead_id: newLead.id,
      user_id: user.id,
      user_name: adminName,
      activity_type: 'criacao',
      description: `Lead cadastrado manualmente no painel por ${adminName}.`,
    })

    revalidatePath('/admin')
    return { success: true, lead: newLead as Lead, message: 'Lead cadastrado com sucesso!' }
  } catch (err: any) {
    console.error('Error creating manual lead:', err)
    return { success: false, message: err?.message || 'Erro ao cadastrar lead.' }
  }
}

// -----------------------------------------------------------------------------
// 5. UPDATE LEAD STATUS (E.G. MARK AS LOST OR CLOSED)
// -----------------------------------------------------------------------------
export async function updateLeadStatusAction(
  leadId: string,
  newStatus: LeadStatus,
  lossReason?: string,
  lossNotes?: string
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const adminName = user?.user_metadata?.full_name || user?.email || 'Usuário'

    const payload: any = {
      status: newStatus,
      updated_by: user?.id || null,
      updated_by_name: adminName,
      updated_at: new Date().toISOString(),
      last_interaction_at: new Date().toISOString(),
    }

    if (newStatus === 'Perdido') {
      payload.loss_reason = lossReason || null
      payload.loss_notes = lossNotes || null
    }

    const { error } = await supabase.from('leads').update(payload).eq('id', leadId)

    if (error) throw error

    // Log activity
    let actType: LeadActivityType = 'alteracao_status'
    let desc = `Status alterado para "${newStatus}" por ${adminName}.`

    if (newStatus === 'Perdido') {
      actType = 'perdido'
      desc = `Lead marcado como PERDIDO por ${adminName}. Motivo: ${lossReason || 'Não informado'}. ${lossNotes ? `Obs: ${lossNotes}` : ''}`
    } else if (newStatus === 'Fechado') {
      actType = 'fechamento'
      desc = `Negócio FECHADO com sucesso por ${adminName}!`
    }

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      user_id: user?.id || null,
      user_name: adminName,
      activity_type: actType,
      description: desc,
    })

    revalidatePath('/admin')
    return { success: true, message: `Status alterado para ${newStatus}.` }
  } catch (err: any) {
    console.error('Error updating lead status:', err)
    return { success: false, message: err?.message || 'Erro ao atualizar status.' }
  }
}

// -----------------------------------------------------------------------------
// 6. ASSIGN / CHANGE COMMERCIAL RESPONSIBLE
// -----------------------------------------------------------------------------
export async function assignLeadCommercialAction(
  leadId: string,
  commercialUserId: string,
  commercialUserName: string
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const adminName = user?.user_metadata?.full_name || user?.email || 'Usuário'

    const { error } = await supabase
      .from('leads')
      .update({
        commercial_user_id: commercialUserId,
        commercial_user_name: commercialUserName,
        updated_by: user?.id || null,
        updated_by_name: adminName,
        updated_at: new Date().toISOString(),
        last_interaction_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (error) throw error

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      user_id: user?.id || null,
      user_name: adminName,
      activity_type: 'alteracao_responsavel',
      description: `Comercial responsável alterado para "${commercialUserName}" por ${adminName}.`,
    })

    revalidatePath('/admin')
    return { success: true, message: `Comercial responsável atribuído: ${commercialUserName}.` }
  } catch (err: any) {
    console.error('Error assigning lead commercial:', err)
    return { success: false, message: err?.message || 'Erro ao atribuir comercial.' }
  }
}

// -----------------------------------------------------------------------------
// 7. ADD MANUAL TIMELINE INTERACTION
// -----------------------------------------------------------------------------
export async function addLeadActivityAction(
  leadId: string,
  activityType: LeadActivityType,
  description: string
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    const adminName = user?.user_metadata?.full_name || user?.email || 'Usuário'

    const { error } = await supabase.from('lead_activities').insert({
      lead_id: leadId,
      user_id: user?.id || null,
      user_name: adminName,
      activity_type: activityType,
      description,
    })

    if (error) throw error

    await supabase
      .from('leads')
      .update({
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    revalidatePath('/admin')
    return { success: true, message: 'Interação registrada no histórico!' }
  } catch (err: any) {
    console.error('Error adding lead activity:', err)
    return { success: false, message: err?.message || 'Erro ao registrar interação.' }
  }
}

// -----------------------------------------------------------------------------
// 8. DELETE LEAD RECORD
// -----------------------------------------------------------------------------
export async function deleteLeadAction(leadId: string) {
  try {
    const supabase = await createServerSupabase()
    const { error } = await supabase.from('leads').delete().eq('id', leadId)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true, message: 'Lead excluído com sucesso.' }
  } catch (err: any) {
    console.error('Error deleting lead:', err)
    return { success: false, message: err?.message || 'Erro ao excluir lead.' }
  }
}
