import {
  enrichPlace,
  websiteKind,
} from '../../../../modules/prospecting/services/google-places.service.ts'
import { checked } from '../../../../modules/prospecting/repositories/base.ts'
import type { Business } from '../../../../modules/prospecting/types/index.ts'
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
  const digital = { websiteKind: websiteKind(business.website) }
  const signals = []
  if (digital.websiteKind === 'none') signals.push({ code: 'NO_WEBSITE', source: 'google_places' })
  if (digital.websiteKind === 'social')
    signals.push({ code: 'SOCIAL_ONLY_WEBSITE', source: 'google_places' })
  if ((business.reviews ?? 0) >= 300)
    signals.push({ code: 'HIGH_REVIEW_COUNT', value: business.reviews })
  if ((business.rating ?? 0) >= 4.5) signals.push({ code: 'HIGH_RATING', value: business.rating })
  return { business: { ...business, lowFit }, digital, signals }
}
