import { checked, type DatabaseClient } from './base.ts'
import type { LeadFilters } from '../schemas/lead.schema.ts'
import type { LeadRow } from '../types/index.ts'
export const PAGE_SIZE = 25
export async function listLeads(db: DatabaseClient, filters: LeadFilters) {
  let q = db.from('prospecting_lead_list').select('*', { count: 'exact' })
  if (filters.campaignId) q = q.eq('campaign_id', filters.campaignId)
  if (filters.minScore !== undefined) q = q.gte('current_score', filters.minScore)
  if (filters.maxScore !== undefined) q = q.lte('current_score', filters.maxScore)
  if (filters.classification === 'discarded')
    q = q.or('classification.eq.discarded,manually_discarded.eq.true')
  else if (filters.classification)
    q = q.eq('classification', filters.classification).eq('manually_discarded', false)
  if (filters.opportunity) q = q.eq('opportunity_type', filters.opportunity)
  if (filters.segment) q = q.eq('segment', filters.segment)
  if (filters.city) q = q.eq('city', filters.city)
  if (filters.state) q = q.eq('state', filters.state)
  if (filters.website === 'yes') q = q.eq('website_kind', 'website')
  if (filters.website === 'none' || filters.website === 'social')
    q = q.eq('website_kind', filters.website)
  if (filters.website === 'bad') q = q.eq('bad_website', true)
  if (filters.minRating !== undefined) q = q.gte('rating', filters.minRating)
  if (filters.minReviews !== undefined) q = q.gte('reviews', filters.minReviews)
  if (filters.pipeline) q = q.eq('pipeline_stage', filters.pipeline)
  if (filters.ai) q = q.eq('ai_analyzed', filters.ai === 'yes')
  if (filters.since) q = q.gte('created_at', `${filters.since}T00:00:00Z`)
  if (filters.quick === 'high') q = q.gte('current_score', 85).eq('manually_discarded', false)
  if (filters.quick === 'none') q = q.eq('website_kind', 'none')
  if (filters.quick === 'bad') q = q.eq('bad_website', true)
  if (filters.quick === 'booking') q = q.eq('has_booking', false)
  if (filters.quick === 'whatsapp') q = q.eq('whatsapp_only', true)
  if (filters.quick === 'ai') q = q.eq('ai_analyzed', true)
  const column = {
    score: 'current_score',
    reviews: 'reviews',
    rating: 'rating',
    performance: 'performance',
    recent: 'created_at',
  }[filters.sort]
  const result = await q
    .order(column, { ascending: filters.sort === 'performance', nullsFirst: false })
    .order('id')
    .range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE - 1)
  return { leads: checked(result) as LeadRow[], total: result.count ?? 0 }
}
export async function getLead(db: DatabaseClient, id: string) {
  return checked(
    await db.from('prospecting_lead_list').select('*').eq('id', id).single()
  ) as LeadRow
}
