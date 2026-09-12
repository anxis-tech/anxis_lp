import { enrichPlace } from '../../../../modules/prospecting/services/google-places.service.ts'
import { classifyWebsite } from '../../../../modules/prospecting/services/website-classification.service.ts'
import { checked } from '../../../../modules/prospecting/repositories/base.ts'
import type { Business, DigitalPresence } from '../../../../modules/prospecting/types/index.ts'
import type { WorkerContext } from '../context.ts'
export async function enrichLead({ db, lead, campaign, job, env }: WorkerContext) {
  if (!lead?.google_place_id) throw new Error('Lead sem identificador Google Places.')
  const cached = checked(
    await db
      .from('prospecting_leads')
      .select('business,enriched_at')
      .eq('id', lead.lead_id)
      .single()
  ) as { business: Business; enriched_at: string | null }
  const fresh = cached.enriched_at && Date.now() - Date.parse(cached.enriched_at) < 24 * 3600000
  const business =
    job.type !== 'refresh_lead' && fresh
      ? cached.business
      : await enrichPlace(env.places, lead.google_place_id)
  const normalized = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  const lowFit = Boolean(
    (business.state && business.state !== campaign.state) ||
    (business.city && normalized(business.city) !== normalized(campaign.city))
  )
  const classification = await classifyWebsite(business.website)
  const digital: DigitalPresence = {
    websiteKind: classification.kind,
    finalUrl: classification.finalUrl ?? business.website ?? undefined,
  }
  const signals = []
  if (classification.kind === 'none') {
    signals.push({ code: 'NO_WEBSITE', source: 'google_places' })
  } else if (classification.kind === 'social_only') {
    signals.push({ code: 'SOCIAL_ONLY_WEBSITE', source: 'google_places' })
  } else if (classification.kind === 'messaging_only') {
    signals.push({ code: 'MESSAGING_ONLY_WEBSITE', source: 'google_places' })
    signals.push({ code: 'WHATSAPP_ONLY', source: 'google_places' })
  } else if (classification.kind === 'link_aggregator') {
    signals.push({ code: 'LINK_AGGREGATOR_WEBSITE', source: 'google_places' })
  } else if (classification.kind === 'shortener_unresolved') {
    signals.push({
      code: 'SHORTENER_UNRESOLVED',
      source: 'google_places',
      evidence: { error: classification.error },
    })
  }
  if ((business.reviews ?? 0) >= 300)
    signals.push({ code: 'HIGH_REVIEW_COUNT', value: business.reviews })
  if ((business.rating ?? 0) >= 4.5) signals.push({ code: 'HIGH_RATING', value: business.rating })
  return { business: { ...business, lowFit }, digital, signals }
}
