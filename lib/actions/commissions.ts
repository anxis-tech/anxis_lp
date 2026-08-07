'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export interface CommissionRule {
  id: string
  recipient_type: 'professional' | 'commercial'
  project_type: string
  calculation_type: 'percentage' | 'fixed'
  value: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommissionRecord {
  id: string
  project_id: string
  user_id: string
  user_name: string
  recipient_type: 'professional' | 'commercial'
  reference_month: string // 'YYYY-MM'
  project_title: string
  client_name: string
  project_type: string
  base_value: number
  rule_type: 'percentage' | 'fixed'
  rule_value: number
  calculated_amount: number
  status: 'Pendente' | 'Pago'
  paid_at?: string | null
  paid_by?: string | null
  paid_by_name?: string | null
  payment_reference_id?: string | null
  created_at: string
  updated_at: string
}

export interface CommissionPaymentHistory {
  id: string
  user_id: string
  user_name: string
  reference_month: string
  total_paid: number
  paid_at: string
  paid_by?: string | null
  paid_by_name?: string | null
  notes?: string | null
  created_at: string
}

// -----------------------------------------------------------------------------
// 1. GET ALL COMMISSION RULES
// -----------------------------------------------------------------------------
export async function getCommissionRulesAction() {
  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('commission_rules')
      .select('*')
      .order('project_type', { ascending: true })

    if (error) throw error
    return { success: true, rules: (data as CommissionRule[]) || [] }
  } catch (err: any) {
    console.error('Error fetching commission rules:', err)
    return { success: false, rules: [], message: err?.message || 'Erro ao carregar regras de comissão.' }
  }
}

// -----------------------------------------------------------------------------
// 2. UPSERT COMMISSION RULE
// -----------------------------------------------------------------------------
export async function upsertCommissionRuleAction(ruleData: {
  recipient_type: 'professional' | 'commercial'
  project_type: string
  calculation_type: 'percentage' | 'fixed'
  value: number
}) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, message: 'Sessão inválida ou não autenticada.' }

    const { error } = await supabase
      .from('commission_rules')
      .upsert(
        {
          recipient_type: ruleData.recipient_type,
          project_type: ruleData.project_type,
          calculation_type: ruleData.calculation_type,
          value: Number(ruleData.value) || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'recipient_type,project_type' }
      )

    if (error) throw error
    revalidatePath('/admin')
    return { success: true, message: 'Regra de comissão salva com sucesso!' }
  } catch (err: any) {
    console.error('Error saving commission rule:', err)
    return { success: false, message: err?.message || 'Erro ao salvar regra de comissão.' }
  }
}

// -----------------------------------------------------------------------------
// 3. GET AND SYNC COMMISSIONS FOR A GIVEN REFERENCE MONTH ('YYYY-MM')
// -----------------------------------------------------------------------------
export async function getCommissionsForMonthAction(referenceMonth: string) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { success: false, commissions: [], paymentsHistory: [], message: 'Não autenticado.' }
    }

    // 1. Fetch rules
    const { data: rulesData } = await supabase.from('commission_rules').select('*')
    const rulesMap: Record<string, CommissionRule> = {}
    ;(rulesData || []).forEach((r: any) => {
      rulesMap[`${r.recipient_type}_${r.project_type}`] = r
    })

    // 2. Fetch projects matching the reference month
    // referenceMonth is YYYY-MM (e.g. '2026-07')
    const [year, month] = referenceMonth.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

    const { data: projectsData, error: projErr } = await supabase
      .from('client_projects')
      .select('*')

    if (projErr) throw projErr

    const filteredProjects = (projectsData || []).filter((p: any) => {
      const dateToUse = p.updated_at || p.created_at || p.start_date
      if (!dateToUse) return false
      const d = new Date(dateToUse)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })

    // 3. Fetch existing commissions for this month to check status ('Pago' vs 'Pendente')
    const { data: existingCommissions } = await supabase
      .from('commissions')
      .select('*')
      .eq('reference_month', referenceMonth)

    const existingMap: Record<string, any> = {}
    ;(existingCommissions || []).forEach((c: any) => {
      existingMap[`${c.project_id}_${c.user_id}_${c.recipient_type}`] = c
    })

    // 4. Calculate and sync for each project
    const newOrUpdatedCommissions: any[] = []

    for (const p of filteredProjects) {
      const baseVal = p.approved_value || p.paid_value || 0

      // Professional Commission
      const profId = p.professional_user_id || p.responsible_user_id
      const profName = p.professional_user_name || p.responsible_user_name || 'Profissional'
      if (profId) {
        const key = `${p.id}_${profId}_professional`
        const existing = existingMap[key]

        // Do NOT overwrite if already marked as 'Pago'
        if (!existing || existing.status !== 'Pago') {
          const ruleKey = `professional_${p.project_type}`
          const rule = rulesMap[ruleKey]

          let calcAmount = 0
          let ruleType: 'percentage' | 'fixed' = 'percentage'
          let ruleVal = 0

          if (rule && rule.value > 0) {
            ruleType = rule.calculation_type
            ruleVal = Number(rule.value)
            if (ruleType === 'percentage') {
              calcAmount = (baseVal * ruleVal) / 100
            } else {
              calcAmount = ruleVal
            }
          }

          newOrUpdatedCommissions.push({
            project_id: p.id,
            user_id: profId,
            user_name: profName,
            recipient_type: 'professional',
            reference_month: referenceMonth,
            project_title: p.title,
            client_name: p.client_name,
            project_type: p.project_type,
            base_value: baseVal,
            rule_type: ruleType,
            rule_value: ruleVal,
            calculated_amount: calcAmount,
            status: existing ? existing.status : 'Pendente',
            updated_at: new Date().toISOString(),
          })
        }
      }

      // Commercial Commission
      const commId = p.commercial_user_id
      const commName = p.commercial_user_name || 'Comercial'
      if (commId) {
        const key = `${p.id}_${commId}_commercial`
        const existing = existingMap[key]

        // Do NOT overwrite if already marked as 'Pago'
        if (!existing || existing.status !== 'Pago') {
          const ruleKey = `commercial_${p.project_type}`
          const rule = rulesMap[ruleKey]

          let calcAmount = 0
          let ruleType: 'percentage' | 'fixed' = 'percentage'
          let ruleVal = 0

          if (rule && rule.value > 0) {
            ruleType = rule.calculation_type
            ruleVal = Number(rule.value)
            if (ruleType === 'percentage') {
              calcAmount = (baseVal * ruleVal) / 100
            } else {
              calcAmount = ruleVal
            }
          }

          newOrUpdatedCommissions.push({
            project_id: p.id,
            user_id: commId,
            user_name: commName,
            recipient_type: 'commercial',
            reference_month: referenceMonth,
            project_title: p.title,
            client_name: p.client_name,
            project_type: p.project_type,
            base_value: baseVal,
            rule_type: ruleType,
            rule_value: ruleVal,
            calculated_amount: calcAmount,
            status: existing ? existing.status : 'Pendente',
            updated_at: new Date().toISOString(),
          })
        }
      }
    }

    // Upsert newly computed commissions (without modifying 'Pago' items)
    if (newOrUpdatedCommissions.length > 0) {
      await supabase
        .from('commissions')
        .upsert(newOrUpdatedCommissions, { onConflict: 'project_id,user_id,recipient_type,reference_month' })
    }

    // 5. Query final list from DB
    const { data: finalCommissions } = await supabase
      .from('commissions')
      .select('*')
      .eq('reference_month', referenceMonth)
      .order('created_at', { ascending: false })

    const { data: paymentsHist } = await supabase
      .from('commission_payments')
      .select('*')
      .eq('reference_month', referenceMonth)
      .order('paid_at', { ascending: false })

    return {
      success: true,
      commissions: (finalCommissions as CommissionRecord[]) || [],
      paymentsHistory: (paymentsHist as CommissionPaymentHistory[]) || [],
    }
  } catch (err: any) {
    console.error('Error fetching/syncing commissions for month:', err)
    return {
      success: false,
      commissions: [],
      paymentsHistory: [],
      message: err?.message || 'Erro ao sincronizar comissões do mês.',
    }
  }
}

// -----------------------------------------------------------------------------
// 4. MARK ALL COMMISSIONS FOR A USER AS PAID FOR A REFERENCE MONTH
// -----------------------------------------------------------------------------
export async function markUserCommissionsAsPaidAction(
  userId: string,
  referenceMonth: string,
  notes?: string
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user: adminUser } } = await supabase.auth.getUser()

    if (!adminUser) return { success: false, message: 'Sessão inválida ou não autenticada.' }

    const adminName = adminUser.user_metadata?.full_name || adminUser.email || 'Administrador'

    // 1. Get pending commissions for user in that month
    const { data: pendingComms, error: commErr } = await supabase
      .from('commissions')
      .select('*')
      .eq('user_id', userId)
      .eq('reference_month', referenceMonth)

    if (commErr) throw commErr

    if (!pendingComms || pendingComms.length === 0) {
      return { success: false, message: 'Nenhuma comissão pendente encontrada para este usuário no mês.' }
    }

    const userName = pendingComms[0]?.user_name || 'Funcionário'
    const totalPaid = pendingComms.reduce((acc: number, c: any) => acc + (Number(c.calculated_amount) || 0), 0)
    const paidTimestamp = new Date().toISOString()

    // 2. Insert into commission_payments table
    const { data: paymentRecord, error: payErr } = await supabase
      .from('commission_payments')
      .upsert(
        {
          user_id: userId,
          user_name: userName,
          reference_month: referenceMonth,
          total_paid: totalPaid,
          paid_at: paidTimestamp,
          paid_by: adminUser.id,
          paid_by_name: adminName,
          notes: notes || null,
        },
        { onConflict: 'user_id,reference_month' }
      )
      .select()
      .single()

    if (payErr) throw payErr

    // 3. Mark all commissions for this user & month as 'Pago' with paid timestamp and admin info
    const { error: updateErr } = await supabase
      .from('commissions')
      .update({
        status: 'Pago',
        paid_at: paidTimestamp,
        paid_by: adminUser.id,
        paid_by_name: adminName,
        payment_reference_id: paymentRecord?.id || null,
        updated_at: paidTimestamp,
      })
      .eq('user_id', userId)
      .eq('reference_month', referenceMonth)

    if (updateErr) throw updateErr

    revalidatePath('/admin')
    return {
      success: true,
      message: `Comissão do mês ${referenceMonth} marcada como PAGA para ${userName}! (Total: R$ ${totalPaid.toFixed(2)})`,
    }
  } catch (err: any) {
    console.error('Error marking commissions as paid:', err)
    return { success: false, message: err?.message || 'Erro ao registrar pagamento de comissão.' }
  }
}
