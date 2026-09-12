import { auditWebsite } from '../../../../modules/prospecting/services/website-audit.service.ts'
import type { WorkerContext } from '../context.ts'
export async function auditLead({ lead, env }: WorkerContext) {
  if (!lead?.website || lead.website_kind !== 'website')
    throw new Error('Auditoria requer um website próprio.')
  return auditWebsite(lead.website, env.pagespeed)
}
