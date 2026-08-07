'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SavedQuote, PricingConfig } from '@/types/pricing.types'
import { revalidatePath } from 'next/cache'
import { logAuditEventAction } from '@/lib/actions/audit'

export async function getSavedQuotesAction() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quotes:', error)
    return []
  }
  return data || []
}

export async function saveQuoteAction(quote: SavedQuote) {
  const supabase = await createServerSupabase()
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const validId = quote.id && uuidRegex.test(quote.id) ? quote.id : null

  const payload: any = {
    lead_id: quote.lead_id && uuidRegex.test(quote.lead_id) ? quote.lead_id : null,
    client_name: quote.client_name,
    company: quote.company || null,
    project_name: quote.project_name,
    project_type: quote.project_type,
    platform: quote.platform || null,
    status: quote.status || 'Pendente',
    subtotal: quote.subtotal || 0,
    discount: quote.discount || 0,
    final_value: quote.final_value || 0,
    form_data: quote.form_data || {},
    pricing_snapshot: quote.pricing_snapshot || {},
    calculation_breakdown: quote.calculation_breakdown || {},
    notes: quote.notes || null,
    updated_at: new Date().toISOString(),
  }

  if (validId) {
    payload.id = validId
  }

  const { data, error } = await supabase
    .from('quotes')
    .upsert(payload)
    .select('*')
    .single()

  if (error) {
    console.error('Error saving quote:', error)
    return { success: false, message: error.message }
  }

  // If quote is linked to a lead, update lead status to 'Orçamento' and log activity
  if (payload.lead_id) {
    const { data: { user } } = await supabase.auth.getUser()
    const userName = user?.user_metadata?.full_name || user?.email || 'Usuário'

    await supabase
      .from('leads')
      .update({
        status: 'Orçamento',
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.lead_id)

    await supabase.from('lead_activities').insert({
      lead_id: payload.lead_id,
      user_id: user?.id || null,
      user_name: userName,
      activity_type: 'orcamento_criado',
      description: `Orçamento de R$ ${(quote.final_value || 0).toFixed(2)} gerado via Calculadora por ${userName}.`,
    })
  }

  revalidatePath('/admin')
  return { success: true, quote: data as SavedQuote }
}

export async function deleteQuoteAction(quoteId: string) {
  const supabase = await createServerSupabase()
  const { error } = await supabase.from('quotes').delete().eq('id', quoteId)

  if (error) {
    console.error('Error deleting quote:', error)
    return { success: false, message: error.message }
  }

  revalidatePath('/admin')
  return { success: true, message: 'Orçamento removido.' }
}

export async function getPricingSettingsAction(): Promise<PricingConfig | null> {
  let dbClient: any
  try {
    dbClient = createAdminClient()
  } catch (err) {
    dbClient = await createServerSupabase()
  }

  const { data, error } = await dbClient
    .from('pricing_settings')
    .select('settings_json')
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data || !data.settings_json) return null
  return data.settings_json as PricingConfig
}

export async function savePricingSettingsAction(newConfig: PricingConfig) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Não autenticado.' }

  let dbClient: any
  try {
    dbClient = createAdminClient()
  } catch (err) {
    console.warn('Admin client fallback to server supabase client:', err)
    dbClient = supabase
  }

  // 1. Get current highest settings version
  const { data: current } = await dbClient
    .from('pricing_settings')
    .select('id, version, settings_json')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (current?.version || 0) + 1

  // 2. Mark all existing active settings inactive
  await dbClient
    .from('pricing_settings')
    .update({ is_active: false })
    .eq('is_active', true)

  // 3. Insert new active settings version
  const { data: inserted, error } = await dbClient
    .from('pricing_settings')
    .insert({
      settings_json: newConfig,
      version: nextVersion,
      is_active: true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error inserting pricing_settings:', error)
    return { success: false, message: error.message }
  }

  await logAuditEventAction({
    action: 'update_pricing_settings',
    module: 'pricing',
    oldData: current?.settings_json,
    newData: newConfig,
  })

  revalidatePath('/admin')
  return { success: true, message: 'Configurações de precificação salvas permanentemente no banco de dados!' }
}
