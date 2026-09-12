import { calculateScore } from '../../../../modules/prospecting/scoring/engine.ts'
import { getRules } from '../../../../modules/prospecting/repositories/score.repository.ts'
import { segments, type Segment } from '../../../../modules/prospecting/schemas/campaign.schema.ts'
import type { WorkerContext } from '../context.ts'
export async function scoreLead({ db, lead, campaign }: WorkerContext) {
  if (!lead) throw new Error('Lead não encontrado para cálculo.')
  const rules = await getRules(db, campaign.id)
  if (!rules.length)
    throw new Error('Regras de scoring não instaladas. Aplique a migration de regras.')
  const segment = segments[campaign.segment as Segment] ?? segments.other
  const input = {
    business: lead.business,
    digital: lead.digital,
    segment,
    aiThreshold: campaign.ai_score_threshold,
    campaignId: campaign.id,
  }
  return { input, rules, score: calculateScore(input, rules) }
}
