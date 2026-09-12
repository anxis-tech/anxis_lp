import { z } from 'zod'
import { apiJSON, requireKey } from './http.ts'
import type { Business, DigitalPresence } from '../types/index.ts'
const searchSchema = z.object({
  places: z.array(z.object({ id: z.string() })).default([]),
  nextPageToken: z.string().optional(),
})
const placeSchema = z.object({
  id: z.string(),
  displayName: z.object({ text: z.string() }),
  businessStatus: z.string().optional(),
  primaryType: z.string().optional(),
  websiteUri: z.string().optional(),
  internationalPhoneNumber: z.string().optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().int().optional(),
  location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  addressComponents: z
    .array(
      z.object({
        longText: z.string().optional(),
        shortText: z.string().optional(),
        types: z.array(z.string()),
      })
    )
    .default([]),
  attributions: z
    .array(z.object({ provider: z.string(), providerUri: z.string().optional() }))
    .optional(),
})
export function websiteKind(website?: string | null): NonNullable<DigitalPresence['websiteKind']> {
  if (!website) return 'none'
  try {
    const host = new URL(website).hostname.toLowerCase()
    return [
      'instagram.com',
      'facebook.com',
      'fb.com',
      'linktr.ee',
      'linktree.com',
      'tiktok.com',
      'wa.me',
      'whatsapp.com',
    ].some((domain) => host === domain || host.endsWith(`.${domain}`))
      ? 'social'
      : 'website'
  } catch {
    return 'website'
  }
}
export async function searchPlaces(key: string | undefined, textQuery: string, pageToken?: string) {
  return searchSchema.parse(
    await apiJSON(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': requireKey(key, 'GOOGLE_PLACES_API_KEY'),
          'X-Goog-FieldMask': 'places.id,nextPageToken',
        },
        body: JSON.stringify({
          textQuery,
          pageSize: 20,
          languageCode: 'pt-BR',
          regionCode: 'BR',
          ...(pageToken ? { pageToken } : {}),
        }),
      },
      'Google Places'
    )
  )
}
export async function enrichPlace(key: string | undefined, id: string): Promise<Business> {
  const p = placeSchema.parse(
    await apiJSON(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=pt-BR`,
      {
        headers: {
          'X-Goog-Api-Key': requireKey(key, 'GOOGLE_PLACES_API_KEY'),
          'X-Goog-FieldMask':
            'id,displayName,businessStatus,primaryType,websiteUri,internationalPhoneNumber,rating,userRatingCount,addressComponents,location,attributions',
        },
      },
      'Google Places'
    )
  )
  const component = (type: string, short = false) => {
    const c = p.addressComponents.find((c) => c.types.includes(type))
    return (short ? c?.shortText : c?.longText) ?? null
  }
  return {
    name: p.displayName.text,
    category: p.primaryType,
    website: p.websiteUri ?? null,
    phone: p.internationalPhoneNumber ?? null,
    rating: p.rating ?? null,
    reviews: p.userRatingCount ?? null,
    city: component('administrative_area_level_2') ?? component('locality'),
    state: component('administrative_area_level_1', true),
    country: component('country', true),
    ...p.location,
    closed: p.businessStatus === 'CLOSED_PERMANENTLY' || p.businessStatus === 'CLOSED_TEMPORARILY',
    attributions: p.attributions,
  }
}
