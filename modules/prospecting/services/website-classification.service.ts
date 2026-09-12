import { validateWebsiteURL, isPublicAddress } from './safe-http.ts'
import { lookup } from 'node:dns/promises'

export type WebsiteKind =
  | 'website'
  | 'social_only'
  | 'messaging_only'
  | 'link_aggregator'
  | 'shortener_unresolved'
  | 'none'

export interface WebsiteClassification {
  kind: WebsiteKind
  originalUrl: string | null
  finalUrl: string | null
  redirected: boolean
  domain: string | null
  notes?: string
  error?: string
}

const MESSAGING_DOMAINS = [
  'wa.me',
  'whatsapp.com',
  'api.whatsapp.com',
  'chat.whatsapp.com',
  'web.whatsapp.com',
  't.me',
  'telegram.me',
  'telegram.org',
  'm.me',
]

const SOCIAL_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'fb.com',
  'fb.me',
  'tiktok.com',
  'linkedin.com',
  'youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'threads.net',
  'pinterest.com',
  'pinterest.com.br',
]

const LINK_AGGREGATOR_DOMAINS = [
  'linktr.ee',
  'linktree.com',
  'beacons.ai',
  'beacons.page',
  'bio.site',
  'linkbio.co',
  'campsite.bio',
  'taplink.cc',
  'instabio.cc',
  'allmylinks.com',
  'snipfeed.co',
  'contactinbio.com',
  'lnk.bio',
  'manylink.co',
  'heylink.me',
]

const SHORTENER_DOMAINS = [
  'bit.ly',
  'bitly.com',
  'tinyurl.com',
  't.co',
  'cutt.ly',
  'is.gd',
  'goo.gl',
  'ow.ly',
  'buff.ly',
  'rebrand.ly',
  'shorturl.at',
  'tiny.cc',
  'shorte.st',
  'encurtador.com.br',
  'abre.ai',
  'tiny.one',
  'v.gd',
  's.id',
]

function matchesDomainList(host: string, list: string[]): boolean {
  return list.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

export function classifyHostname(host: string): WebsiteKind {
  const normalized = host.toLowerCase()
  if (matchesDomainList(normalized, MESSAGING_DOMAINS)) return 'messaging_only'
  if (matchesDomainList(normalized, SOCIAL_DOMAINS)) return 'social_only'
  if (matchesDomainList(normalized, LINK_AGGREGATOR_DOMAINS)) return 'link_aggregator'
  return 'website'
}

export function isShortener(host: string): boolean {
  return matchesDomainList(host.toLowerCase(), SHORTENER_DOMAINS)
}

/**
 * Safely resolves shorteners following HTTP redirects up to maxRedirects.
 * Uses strict timeouts and SSRF validation on target hostnames.
 */
export async function resolveShortener(
  rawUrl: string,
  maxRedirects = 4,
  timeoutMs = 4000
): Promise<{ finalUrl: string; redirected: boolean; error?: string }> {
  let current = rawUrl
  let redirected = false

  for (let step = 0; step < maxRedirects; step++) {
    try {
      const parsed = validateWebsiteURL(current)
      const host = parsed.hostname.replace(/^\[|\]$/g, '')

      // SSRF safety check on hostname
      try {
        const addresses = await Promise.race([
          lookup(host, { all: true }),
          new Promise<never>((_, reject) => {
            const timer = setTimeout(() => reject(new Error('Timeout DNS.')), 3000)
            timer.unref?.()
          }),
        ])
        if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address))) {
          return { finalUrl: current, redirected, error: 'Endereço privado bloqueado.' }
        }
      } catch (dnsErr: any) {
        return {
          finalUrl: current,
          redirected,
          error: dnsErr?.message ?? 'Falha de DNS ao resolver encurtador.',
        }
      }

      // Fetch head or get without following redirects automatically
      const res = await fetch(current, {
        method: 'GET',
        headers: {
          'User-Agent': 'AnxisProspecting/1.0 (link resolver)',
          Accept: 'text/html,*/*',
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      })

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location')
        if (!location) break
        const resolved = new URL(location, current).href
        redirected = true
        current = resolved

        // If the redirected location is no longer a shortener, we can stop early
        const nextHost = new URL(resolved).hostname
        if (!isShortener(nextHost)) {
          break
        }
      } else {
        // Did not redirect; current is final
        break
      }
    } catch (err: any) {
      return {
        finalUrl: current,
        redirected,
        error: err?.message ?? 'Erro ao seguir redirecionamento.',
      }
    }
  }

  return { finalUrl: current, redirected }
}

/**
 * Classifies a website URL considering direct hostnames and following shorteners.
 */
export async function classifyWebsite(
  rawWebsite?: string | null,
  resolver: typeof resolveShortener = resolveShortener
): Promise<WebsiteClassification> {
  if (!rawWebsite || !rawWebsite.trim()) {
    return {
      kind: 'none',
      originalUrl: null,
      finalUrl: null,
      redirected: false,
      domain: null,
    }
  }

  let parsed: URL
  try {
    const withProto = /^https?:\/\//i.test(rawWebsite) ? rawWebsite : `https://${rawWebsite}`
    parsed = new URL(withProto)
  } catch {
    return {
      kind: 'none',
      originalUrl: rawWebsite,
      finalUrl: rawWebsite,
      redirected: false,
      domain: null,
      error: 'URL com formato inválido',
    }
  }

  const host = parsed.hostname.toLowerCase()

  // 1. Direct match on messaging, social, or aggregator
  const directKind = classifyHostname(host)
  if (directKind !== 'website') {
    return {
      kind: directKind,
      originalUrl: rawWebsite,
      finalUrl: rawWebsite,
      redirected: false,
      domain: host,
    }
  }

  // 2. Shortener resolution
  if (isShortener(host)) {
    const resolved = await resolver(rawWebsite)
    if (resolved.error && !resolved.redirected) {
      return {
        kind: 'shortener_unresolved',
        originalUrl: rawWebsite,
        finalUrl: rawWebsite,
        redirected: false,
        domain: host,
        error: resolved.error,
      }
    }

    try {
      const finalParsed = new URL(resolved.finalUrl)
      const finalHost = finalParsed.hostname.toLowerCase()
      const targetKind = classifyHostname(finalHost)

      return {
        kind: targetKind,
        originalUrl: rawWebsite,
        finalUrl: resolved.finalUrl,
        redirected: resolved.redirected,
        domain: finalHost,
        notes: resolved.redirected ? `Redirecionado de ${host} para ${finalHost}` : undefined,
      }
    } catch {
      return {
        kind: 'shortener_unresolved',
        originalUrl: rawWebsite,
        finalUrl: resolved.finalUrl,
        redirected: resolved.redirected,
        domain: host,
        error: 'URL de destino inválida',
      }
    }
  }

  // 3. Normal website
  return {
    kind: 'website',
    originalUrl: rawWebsite,
    finalUrl: rawWebsite,
    redirected: false,
    domain: host,
  }
}
