import { classify } from './classification.ts'
import { evaluate, factsFor, resolveRules } from './evaluator.ts'
import type { Rule, ScoreGroup, ScoreItem, ScoreResult, ScoringInput } from './types.ts'
export const SCORING_VERSION = '1.0'
const caps: Record<ScoreGroup, number> = {
  business: 30,
  site: 50,
  system: 50,
  commercial: 20,
  penalties: Infinity,
}
export function calculateScore(input: ScoringInput, rules: readonly Rule[]): ScoreResult {
  const facts = factsFor(input)
  const items: ScoreItem[] = []
  const totals: Record<ScoreGroup, number> = {
    business: 0,
    site: 0,
    system: 0,
    commercial: 0,
    penalties: 0,
  }
  for (const rule of resolveRules(rules, input.campaignId)) {
    if (!rule.enabled || !Number.isFinite(rule.points) || !evaluate(rule, facts)) continue
    const points =
      rule.score_group === 'penalties' ? -Math.abs(rule.points) : Math.max(0, rule.points)
    totals[rule.score_group] += points
    items.push({
      code: rule.code,
      group: rule.score_group,
      points,
      explanation: `${rule.name} (${String(facts[rule.config.field])})`,
    })
  }
  for (const group of ['business', 'site', 'system', 'commercial'] as const)
    totals[group] = Math.min(caps[group], totals[group])
  const eliminated = Boolean(
    input.business.closed ||
    input.business.duplicate ||
    input.business.spam ||
    input.business.incompatibleCategory
  )
  if (eliminated)
    items.push({
      code: 'ELIMINATED',
      group: 'penalties',
      points: 0,
      explanation:
        'Filtro eliminatório: empresa fechada, duplicada, spam ou categoria incompatível.',
    })
  const opportunity = Math.max(totals.site, totals.system)
  const final = eliminated
    ? 0
    : Math.round(
        Math.max(
          0,
          Math.min(100, totals.business + opportunity + totals.commercial + totals.penalties)
        )
      )
  const classification = classify(final)
  return {
    version: SCORING_VERSION,
    ...totals,
    opportunity,
    final,
    ...classification,
    eliminated,
    items,
    opportunityType:
      totals.site > 0 && totals.system > 0
        ? 'website_and_software'
        : totals.system > totals.site
          ? 'software'
          : input.digital.websiteKind === 'website'
            ? facts.dnsFailure || facts.unreachable
              ? 'website'
              : 'redesign'
            : 'website',
    useAI: !eliminated && final >= 40 && final >= input.aiThreshold,
  }
}
