import { checked, type DatabaseClient } from './base.ts'
import type { Job } from '../types/index.ts'
export async function listJobs(db: DatabaseClient, campaignId: string, leadId?: string) {
  let q = db
    .from('prospecting_jobs')
    .select(
      'id,campaign_id,campaign_lead_id,type,status,attempts,max_attempts,error_message,run_after,payload,locked_by'
    )
    .eq('campaign_id', campaignId)
  if (leadId) q = q.eq('campaign_lead_id', leadId)
  return checked(
    await q
      .in('status', ['pending', 'processing', 'failed'])
      .order('created_at', { ascending: false })
      .limit(20)
  ) as Job[]
}
