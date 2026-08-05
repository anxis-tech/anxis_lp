'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Não autenticado.' }

  const isEdit = !!quote.id && !quote.id.startsWith('quote-')

  const payload = {
    client_name: quote.client_name,
    company: quote.company || null,
    project_name: quote.project_name,
    project_type: quote.project_type,
    platform: quote.platform || null,
    form_data: quote.form_data,
    pricing_snapshot: quote.pricing_snapshot,
    calculation_breakdown: quote.calculation_breakdown,
    subtotal: quote.subtotal,
    discount: quote.discount,
    additional_costs: quote.additional_costs,
    taxes: quote.taxes,
    final_value: quote.final_value,
    status: quote.status,
    notes: quote.notes || null,
    created_by_name: quote.created_by_name || 'Admin',
    created_by: user.id,
    linked_project_id: quote.linked_project_id || null,
    updated_at: new Date().toISOString(),
  }

  if (isEdit) {
    const { error } = await supabase
      .from('quotes')
      .update(payload)
      .eq('id', quote.id)

    if (error) return { success: false, message: error.message }
  } else {
    const { error } = await supabase.from('quotes').insert(payload)

    if (error) return { success: false, message: error.message }
  }

  await logAuditEventAction({
    action: isEdit ? 'edit_quote' : 'save_quote',
    module: 'pricing',
    newData: { project_name: quote.project_name, final_value: quote.final_value },
  })

  revalidatePath('/admin')
  return { success: true, message: 'Orçamento salvo com sucesso no banco de dados!' }
}

export async function deleteQuoteAction(id: string) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Não autenticado.' }

  const { error } = await supabase.from('quotes').delete().eq('id', id)

  if (error) return { success: false, message: error.message }

  await logAuditEventAction({
    action: 'delete_quote',
    module: 'pricing',
    recordId: id,
  })

  revalidatePath('/admin')
  return { success: true, message: 'Orçamento removido.' }
}

export async function getPricingSettingsAction() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('pricing_settings')
    .select('settings_json')
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data.settings_json as PricingConfig
}

export async function savePricingSettingsAction(newConfig: PricingConfig) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Não autenticado.' }

  // 1. Get current active settings
  const { data: current } = await supabase
    .from('pricing_settings')
    .select('id, version, settings_json')
    .eq('is_active', true)
    .single()

  const currentVersion = current?.version || 1

  // 2. Insert new settings version
  const { data: inserted, error } = await supabase
    .from('pricing_settings')
    .insert({
      settings_json: newConfig,
      version: currentVersion + 1,
      is_active: true,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { success: false, message: error.message }

  // 3. Mark old settings inactive
  if (current?.id) {
    await supabase.from('pricing_settings').update({ is_active: false }).eq('id', current.id)
  }

  await logAuditEventAction({
    action: 'update_pricing_settings',
    module: 'pricing',
    oldData: current?.settings_json,
    newData: newConfig,
  })

  revalidatePath('/admin')
  return { success: true, message: 'Configurações de precificação atualizadas no banco!' }
}
