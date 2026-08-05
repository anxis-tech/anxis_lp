'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'

export async function logAuditEventAction(params: {
  action: string
  module: string
  recordId?: string
  oldData?: any
  newData?: any
}) {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: params.action,
      module: params.module,
      record_id: params.recordId || null,
      old_data: params.oldData || null,
      new_data: params.newData || null,
    })
  } catch (e) {
    console.warn('Audit log write error:', e)
  }
}
