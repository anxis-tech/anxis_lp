import { analyzeWithGemini } from '../../../../modules/prospecting/services/gemini.service.ts'
import { checked } from '../../../../modules/prospecting/repositories/base.ts'
import type { ScoreResult, ScoringInput } from '../../../../modules/prospecting/scoring/types.ts'
import type { WorkerContext } from '../context.ts'
export async function analyzeLead({ db, job, campaign, env }: WorkerContext) {
  if (!job.payload.scoreRunId) throw new Error('Análise sem histórico de score.')
  const existing = checked(
    await db
      .from('prospecting_ai_analyses')
      .select('model,analysis')
      .eq('score_run_id', job.payload.scoreRunId)
      .maybeSingle()
  )
  if (existing) return existing
  const run = checked(
    await db
      .from('prospecting_score_runs')
      .select('result,input')
      .eq('id', job.payload.scoreRunId)
      .single()
  ) as { result: ScoreResult; input: ScoringInput }
  if (!run.result.useAI || run.result.final < campaign.ai_score_threshold || run.result.eliminated)
    throw new Error('Lead abaixo do threshold para IA.')
  const { business, digital } = run.input
  return analyzeWithGemini(env.gemini, env.model, {
    business: {
      segment: campaign.segment,
      rating: business.rating,
      reviews: business.reviews,
      category: business.category,
    },
    digitalPresence: {
      website: digital.websiteKind,
      performance: digital.performance,
      seo: digital.seo,
      hasForm: digital.hasForm,
      hasWhatsapp: digital.hasWhatsapp,
      hasBooking: digital.hasBooking,
      hasClientArea: digital.hasClientArea,
    },
    score: {
      business: run.result.business,
      opportunity: run.result.opportunity,
      commercial: run.result.commercial,
      final: run.result.final,
    },
    signals: run.result.items.map((i) => ({ code: i.code, explanation: i.explanation })),
  })
}
