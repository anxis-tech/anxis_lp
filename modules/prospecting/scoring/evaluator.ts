import type { Rule, ScoringInput } from './types.ts'
export function factsFor(input: ScoringInput): Record<string, unknown> {
  const { business: b, digital: d, segment: s } = input
  const site = d.websiteKind === 'website'
  return {
    reviews: b.reviews,
    rating: b.rating,
    segmentPriority: s.priority,
    structure: b.multipleLocations === true || b.structure === true || b.regional === true,
    noWebsite: d.websiteKind === 'none',
    socialOnly: d.websiteKind === 'social',
    performance: site ? d.performance : null,
    seo: site ? d.seo : null,
    noForm: site && d.hasForm === false,
    noCTA: site && d.hasCTA === false,
    whatsappOnly: site && d.whatsappOnly === true,
    mobileProblem: site && d.hasViewport === false,
    httpsProblem: site && d.https === false,
    noBooking: site && s.booking && d.hasBooking === false,
    noClientArea: site && s.clientArea && d.hasClientArea === false,
    multipleLocations: b.multipleLocations === true,
    manualForms: d.manualForms === true,
    manualProcesses: d.manualProcesses === true,
    unstructuredCatalog: d.unstructuredCatalog === true,
    integrationNeed: d.integrationNeed === true,
    phone: Boolean(b.phone),
    email: Boolean(d.email),
    accessibleContact: Boolean(b.phone || d.email || d.hasForm || d.hasWhatsapp),
    highTicket: s.highTicket,
    commercialStructure: b.commercialStructure === true,
    excellentWebsite:
      site &&
      (d.performance ?? 0) >= 90 &&
      (d.seo ?? 0) >= 90 &&
      (d.accessibility ?? 0) >= 85 &&
      (d.bestPractices ?? 0) >= 85 &&
      d.hasForm === true &&
      d.hasCTA === true,
    franchise: b.franchise === true,
    lowFit: b.lowFit === true,
  }
}
export function evaluate(rule: Rule, facts: Record<string, unknown>): boolean {
  const value = facts[rule.config.field]
  if (value === undefined || value === null) return false
  const config = rule.config
  if (config.op === 'eq') return value === config.value
  if (typeof value !== 'number' || !Number.isFinite(value) || typeof config.value !== 'number')
    return false
  if (config.op === 'lt') return value < config.value
  if (config.op === 'gte') return value >= config.value
  return value >= config.value && value < (config.max ?? Infinity)
}
export function resolveRules(rules: readonly Rule[], campaignId?: string): Rule[] {
  const merged = new Map<string, Rule>()
  for (const rule of rules) if (rule.campaign_id === null) merged.set(rule.code, rule)
  for (const rule of rules)
    if (campaignId && rule.campaign_id === campaignId) merged.set(rule.code, rule)
  return [...merged.values()].sort(
    (a, b) => a.priority - b.priority || a.code.localeCompare(b.code)
  )
}
