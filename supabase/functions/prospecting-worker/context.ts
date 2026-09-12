import type { SupabaseClient } from '@supabase/supabase-js'
import type { Campaign, Job, LeadRow } from '../../../modules/prospecting/types/index.ts'
export interface WorkerContext {
  db: SupabaseClient
  job: Job
  campaign: Campaign
  lead?: LeadRow
  env: { places?: string; pagespeed?: string; gemini?: string; model?: string }
}
