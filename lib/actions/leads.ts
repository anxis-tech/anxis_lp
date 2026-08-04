'use server'

import { leadFormSchema, LeadFormData } from '@/lib/validations/lead-schema'
import { createClient } from '@/lib/supabase/server'
import { UTMData } from '@/lib/analytics/utm'

export async function submitLeadAction(formData: LeadFormData, utmParams: UTMData) {
  try {
    // 1. Validate Form Data
    const validatedData = leadFormSchema.parse(formData)

    // 2. Check Honeypot field
    if (validatedData.website_hp && validatedData.website_hp.length > 0) {
      return { success: false, message: 'Solicitação recusada.' }
    }

    // 3. Prepare payload for DB
    const leadPayload = {
      name: validatedData.name,
      company: validatedData.company || null,
      email: validatedData.email,
      whatsapp: validatedData.whatsapp,
      project_type: validatedData.project_type,
      current_platform: validatedData.current_platform || null,
      budget_range: validatedData.budget_range || null,
      desired_deadline: validatedData.desired_deadline || null,
      message: validatedData.message || null,
      consent: validatedData.consent,
      utm_source: utmParams.utm_source || null,
      utm_medium: utmParams.utm_medium || null,
      utm_campaign: utmParams.utm_campaign || null,
      utm_content: utmParams.utm_content || null,
      utm_term: utmParams.utm_term || null,
      gclid: utmParams.gclid || null,
      fbclid: utmParams.fbclid || null,
      landing_page: utmParams.landing_page || '/',
      referrer: utmParams.referrer || null,
      status: 'novo',
    }

    // 4. Save lead in Supabase DB if client is active
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = await createClient()
      const { error } = await supabase.from('leads').insert(leadPayload)

      if (error) {
        console.error('Supabase error saving lead:', error)
      }
    }

    // Log proposal submission for admin monitoring
    console.log('[ANXIS Lead Capturado]:', leadPayload)

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
