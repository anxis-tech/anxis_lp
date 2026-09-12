import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'
import { checked } from '../../../modules/prospecting/repositories/base.ts'
import { getCampaign } from '../../../modules/prospecting/repositories/campaign.repository.ts'
import { getLead } from '../../../modules/prospecting/repositories/lead.repository.ts'
import type { Job } from '../../../modules/prospecting/types/index.ts'
import { discoverPlaces } from './handlers/discover-places.ts'
import { enrichLead } from './handlers/enrich-lead.ts'
import { auditLead } from './handlers/audit-website.ts'
import { scoreLead } from './handlers/calculate-score.ts'
import { analyzeLead } from './handlers/analyze-ai.ts'
const handlers = {
  discover_places: discoverPlaces,
  enrich_lead: enrichLead,
  refresh_lead: enrichLead,
  audit_website: auditLead,
  calculate_score: scoreLead,
  analyze_ai: analyzeLead,
}
Deno.serve(async (request) => {
  const secret = Deno.env.get('PROSPECTING_WORKER_SECRET')
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  const expectedBytes = new TextEncoder().encode(secret ?? '')
  const suppliedBytes = new TextEncoder().encode(supplied)
  if (
    !secret ||
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  )
    return new Response('Unauthorized', { status: 401 })
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return new Response('Worker não configurado', { status: 503 })
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const worker = crypto.randomUUID()
  try {
    const jobs = checked(
      await db.rpc('prospecting_claim_jobs', { p_worker: worker, p_limit: 40 })
    ) as Job[]
    const results = await Promise.allSettled(
      jobs.map(async (job) => {
        try {
          const campaign = await getCampaign(db, job.campaign_id)
          const lead = job.campaign_lead_id ? await getLead(db, job.campaign_lead_id) : undefined
          const result = await handlers[job.type]({
            db,
            job,
            campaign,
            lead,
            env: {
              places: Deno.env.get('GOOGLE_PLACES_API_KEY'),
              pagespeed: Deno.env.get('GOOGLE_PAGESPEED_API_KEY'),
              gemini: Deno.env.get('GEMINI_API_KEY'),
              model: Deno.env.get('GEMINI_MODEL'),
            },
          })
          checked(
            await db.rpc('prospecting_complete_job', {
              p_id: job.id,
              p_worker: worker,
              p_result: result,
            })
          )
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message.slice(0, 600)
              : 'Falha inesperada no processamento.'
          console.error(
            JSON.stringify({ jobId: job.id, type: job.type, attempt: job.attempts, message })
          )
          checked(
            await db.rpc('prospecting_fail_job', {
              p_id: job.id,
              p_worker: worker,
              p_error: message,
            })
          )
          throw new Error(message)
        }
      })
    )
    return Response.json({
      claimed: jobs.length,
      completed: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    })
  } catch {
    return Response.json(
      { error: 'Não foi possível processar o lote. Verifique migrations e logs.' },
      { status: 500 }
    )
  }
})
