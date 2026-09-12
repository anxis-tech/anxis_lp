import { searchPlaces } from '../../../../modules/prospecting/services/google-places.service.ts'
import type { WorkerContext } from '../context.ts'
export async function discoverPlaces({ campaign, job, env }: WorkerContext) {
  const term = job.payload.term ?? 0
  const page = job.payload.page ?? 0
  const query = campaign.search_terms[term]
  if (!query) return { places: [], next: null }
  const result = await searchPlaces(
    env.places,
    `${query} em ${campaign.city}, ${campaign.state}, Brasil`,
    job.payload.pageToken
  )
  const next =
    result.nextPageToken && page < 2
      ? { term, page: page + 1, pageToken: result.nextPageToken }
      : term + 1 < campaign.search_terms.length
        ? { term: term + 1, page: 0 }
        : null
  return { places: result.places, next }
}
