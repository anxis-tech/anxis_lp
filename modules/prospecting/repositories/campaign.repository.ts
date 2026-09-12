import { checked, type DatabaseClient } from './base.ts'
import type { Campaign, Metrics } from '../types/index.ts'
export async function listCampaigns(db: DatabaseClient) {
  return checked(
    await db
      .from('prospecting_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
  ) as Campaign[]
}
export async function getCampaign(db: DatabaseClient, id: string) {
  return checked(
    await db.from('prospecting_campaigns').select('*').eq('id', id).single()
  ) as Campaign
}
export async function getMetrics(db: DatabaseClient, id: string) {
  return checked(await db.rpc('prospecting_metrics', { p_campaign: id })) as Metrics
}
export async function createCampaign(db: DatabaseClient, data: Record<string, unknown>) {
  return checked(await db.rpc('prospecting_create_campaign', { p_data: data })) as string
}
