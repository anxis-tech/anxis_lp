'use server'
import { z } from 'zod'
import { authorizeProspecting } from './auth.ts'
import { campaignSchema, segments } from '../schemas/campaign.schema.ts'
import { filterSchema, stageSchema, leadControlSchema } from '../schemas/lead.schema.ts'
import {
  createCampaign,
  listCampaigns,
  getMetrics,
  getCampaign,
} from '../repositories/campaign.repository.ts'
import { listLeads, getLead } from '../repositories/lead.repository.ts'
import { getScoreHistory } from '../repositories/score.repository.ts'
import { getAudits } from '../repositories/audit.repository.ts'
import { listJobs } from '../repositories/job.repository.ts'
import { checked } from '../repositories/base.ts'
import { emptyMetrics } from '../types/index.ts'
import { aiAnalysisSchema } from '../schemas/ai-analysis.schema.ts'

async function actionResult<T>(
  work: () => Promise<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await work() }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof z.ZodError
          ? (error.issues[0]?.message ?? 'Dados inválidos.')
          : error instanceof Error
            ? error.message
            : 'Não foi possível concluir a ação.',
    }
  }
}

export async function createCampaignAction(raw: unknown) {
  return actionResult(async () => {
    const { db } = await authorizeProspecting(true)
    const data = campaignSchema.parse(raw)
    const id = await createCampaign(db, {
      ...data,
      search_terms: data.segment === 'other' ? [data.customSegment] : segments[data.segment].terms,
    })
    return id
  })
}

export async function campaignControlAction(raw: unknown) {
  return actionResult(async () => {
    const { db } = await authorizeProspecting(true)
    const input = z.object({ id: z.uuid(), status: z.enum(['running', 'paused']) }).parse(raw)
    checked(
      await db.rpc('prospecting_campaign_control', { p_id: input.id, p_status: input.status })
    )
  })
}

export async function changePipelineAction(raw: unknown) {
  return actionResult(async () => {
    const { db } = await authorizeProspecting(true)
    const input = stageSchema.parse(raw)
    checked(await db.rpc('prospecting_change_stage', { p_ids: input.ids, p_stage: input.stage }))
  })
}

export async function leadControlAction(raw: unknown) {
  return actionResult(async () => {
    const { db } = await authorizeProspecting(true)
    const input = leadControlSchema.parse(raw)
    checked(await db.rpc('prospecting_lead_control', { p_id: input.id, p_action: input.action }))
  })
}

export async function retryDiscoveryAction(raw: unknown) {
  return actionResult(async () => {
    const { db } = await authorizeProspecting(true)
    const id = z.uuid().parse(raw)
    checked(await db.rpc('prospecting_retry_discovery', { p_id: id }))
  })
}

export async function loadProspectingAction(raw: unknown) {
  return actionResult(async () => {
    const { db } = await authorizeProspecting()
    const filters = filterSchema.parse(raw)
    const campaigns = await listCampaigns(db)
    const campaign = filters.campaignId
      ? (campaigns.find((c) => c.id === filters.campaignId) ??
        (await getCampaign(db, filters.campaignId)))
      : campaigns[0]
    if (!campaign)
      return { campaigns, campaign: null, leads: [], total: 0, metrics: emptyMetrics, jobs: [] }
    const [listing, metrics, jobs] = await Promise.all([
      listLeads(db, { ...filters, campaignId: campaign.id }),
      getMetrics(db, campaign.id),
      listJobs(db, campaign.id),
    ])
    return { campaigns, campaign, ...listing, metrics, jobs }
  })
}

/**
 * Fetch a single lead row from prospecting_lead_list.
 * Used as a targeted invalidation fetch when Realtime signals a row change.
 * Does NOT reload the full lead list.
 */
export async function getLeadRowAction(id: string) {
  return actionResult(async () => {
    const { db } = await authorizeProspecting()
    return getLead(db, id)
  })
}

/**
 * Lightweight aggregate refresh — campaign status, metrics and pending jobs only.
 * Used by the 30-second polling interval while a campaign is running.
 * Does NOT reload the lead list.
 */
export async function refreshAggregatesAction(campaignId: string) {
  return actionResult(async () => {
    const { db } = await authorizeProspecting()
    const id = z.uuid().parse(campaignId)
    const [campaign, metrics, jobs] = await Promise.all([
      getCampaign(db, id),
      getMetrics(db, id),
      listJobs(db, id),
    ])
    return { campaign, metrics, jobs }
  })
}

export async function leadDetailsAction(raw: unknown) {
  return actionResult(async () => {
    const { db } = await authorizeProspecting()
    const id = z.uuid().parse(raw)
    const lead = await getLead(db, id)
    const [scores, audits, jobs, analyses, events] = await Promise.all([
      getScoreHistory(db, id),
      getAudits(db, id),
      listJobs(db, lead.campaign_id, id),
      db
        .from('prospecting_ai_analyses')
        .select('analysis,model,created_at,score_run_id')
        .eq('campaign_lead_id', id)
        .order('created_at', { ascending: false })
        .limit(1),
      db
        .from('prospecting_pipeline_events')
        .select('id,from_stage,to_stage,created_at')
        .eq('campaign_lead_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    const analysisRows = checked(analyses) as {
      analysis: unknown
      model: string
      created_at: string
      score_run_id: string
    }[]
    const latest = analysisRows[0]
    return {
      lead,
      scores,
      audits,
      jobs,
      analysis: latest ? { ...latest, analysis: aiAnalysisSchema.parse(latest.analysis) } : null,
      events: checked(events) as {
        id: string
        from_stage: string
        to_stage: string
        created_at: string
      }[],
    }
  })
}
