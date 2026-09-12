import { checked, type DatabaseClient } from './base.ts'
import type { ScoreResult, Rule } from '../scoring/types.ts'
export interface ScoreRun {
  id: string
  scoring_version: string
  result: ScoreResult
  created_at: string
}
export async function getScoreHistory(db: DatabaseClient, id: string) {
  return checked(
    await db
      .from('prospecting_score_runs')
      .select('id,scoring_version,result,created_at')
      .eq('campaign_lead_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
  ) as ScoreRun[]
}
export async function getRules(db: DatabaseClient, campaignId: string) {
  return checked(
    await db
      .from('prospecting_scoring_rules')
      .select('*')
      .or(`campaign_id.is.null,campaign_id.eq.${campaignId}`)
      .order('priority')
  ) as Rule[]
}
