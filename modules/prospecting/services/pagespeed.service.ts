import { z } from 'zod'
import { apiJSON } from './http.ts'
import { publicAddress, validateWebsiteURL } from './safe-http.ts'
const schema = z.object({
  lighthouseResult: z
    .object({
      categories: z.record(z.string(), z.object({ score: z.number().nullable().optional() })),
    })
    .optional(),
})
export async function pageSpeed(key: string | undefined, website: string) {
  if (!key)
    return {
      performance: null,
      seo: null,
      accessibility: null,
      bestPractices: null,
      warning: 'PageSpeed não configurado. Métricas desconhecidas não geram pontos.',
    }
  await publicAddress(validateWebsiteURL(website))
  const url = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  url.searchParams.set('url', website)
  url.searchParams.set('strategy', 'mobile')
  url.searchParams.set('key', key)
  for (const c of ['performance', 'seo', 'accessibility', 'best-practices'])
    url.searchParams.append('category', c)
  const data = schema.parse(await apiJSON(url.href, {}, 'PageSpeed', 45000))
  const categories = data.lighthouseResult?.categories
  if (!categories) throw new Error('PageSpeed: auditoria indisponível para este website.')
  const score = (name: string) =>
    typeof categories[name]?.score === 'number' ? Math.round(categories[name].score * 100) : null
  return {
    performance: score('performance'),
    seo: score('seo'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
  }
}
