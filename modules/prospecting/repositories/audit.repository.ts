import { checked, type DatabaseClient } from './base.ts'
import type { DigitalPresence } from '../types/index.ts'
export async function getAudits(db: DatabaseClient, id: string) {
  return checked(
    await db
      .from('prospecting_audits')
      .select('id,data,created_at')
      .eq('campaign_lead_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
  ) as { id: string; data: DigitalPresence; created_at: string }[]
}
