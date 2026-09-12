import { parseHTML } from 'linkedom'
import robotsParser from 'robots-parser'
// The package exposes CommonJS at runtime; its ambient declaration differs in Deno.
const parseRobots = robotsParser as unknown as (
  url: string,
  text: string
) => { isAllowed(url: string, agent: string): boolean | undefined }
import type { DigitalPresence } from '../types/index.ts'
import { fetchWebsite, validateWebsiteURL } from './safe-http.ts'
import { pageSpeed } from './pagespeed.service.ts'
export function parseWebsite(html: string, url: string): DigitalPresence {
  const { document } = parseHTML(html)
  const scripts = [...document.querySelectorAll('script')]
    .map((s) => `${s.getAttribute('src') ?? ''} ${s.textContent}`)
    .join(' ')
  document.querySelectorAll('script,style,noscript,template').forEach((el) => el.remove())
  const text = (document.body?.textContent ?? '').replace(/\s+/g, ' ').trim()
  const links = [...document.querySelectorAll('a[href]')].map((a) => ({
    href: a.getAttribute('href') ?? '',
    text: a.textContent ?? '',
  }))
  const meaningful = text.length >= 200
  const observed = (value: boolean) => (value ? true : meaningful ? false : undefined)
  const whatsapp = links.filter((a) =>
    /(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(a.href)
  )
  const booking =
    links.some((a) =>
      /agend|reserv|marcar consulta|book|calendly|doctoralia/i.test(a.href + ' ' + a.text)
    ) ||
    [...document.querySelectorAll('iframe')].some((f) =>
      /calendly|doctoralia|agenda/i.test(f.getAttribute('src') ?? '')
    )
  const form = Boolean(
    document.querySelector(
      'form input:not([type="search"]):not([type="hidden"]),form textarea,form select'
    )
  )
  const ctaLinks = links.filter(
    (a) =>
      /agend|orçamento|contato|fale|comprar|contratar|solicitar|whatsapp|reserv/i.test(a.text) ||
      /^(tel:|mailto:)|wa\.me|whatsapp\.com/.test(a.href)
  )
  const nonWhatsAppCTA = ctaLinks.some((a) => !whatsapp.includes(a))
  const technologies: string[] = []
  const source = html.toLowerCase()
  for (const [name, regex] of [
    ['WordPress', /wp-content|wp-includes/],
    ['Wix', /wixstatic|wix\.com/],
    ['Shopify', /cdn\.shopify|shopify\.theme/],
    ['Webflow', /webflow\.com|data-wf-page/],
    ['Next.js', /__next|_next\/static/],
  ] as const)
    if (regex.test(source)) technologies.push(name)
  const analytics: string[] = []
  if (/google-analytics|gtag\(|googletagmanager\.com\/gtag/i.test(scripts))
    analytics.push('Google Analytics')
  if (/GTM-[A-Z0-9]+/i.test(scripts)) analytics.push('Google Tag Manager')
  if (/connect\.facebook\.net|fbq\(/i.test(scripts)) analytics.push('Meta Pixel')
  const mail =
    links
      .find((a) => a.href.startsWith('mailto:'))
      ?.href.slice(7)
      .split('?')[0] ?? text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
  return {
    websiteKind: 'website',
    title: document.querySelector('title')?.textContent?.trim() || null,
    description:
      document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
    h1: document.querySelector('h1')?.textContent?.trim().slice(0, 500) || null,
    https: new URL(url).protocol === 'https:',
    hasViewport: observed(Boolean(document.querySelector('meta[name="viewport"]'))),
    hasForm: observed(form),
    hasWhatsapp: observed(whatsapp.length > 0),
    hasPhone: observed(links.some((a) => a.href.startsWith('tel:'))),
    email: mail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? mail.slice(0, 254) : null,
    hasCTA: observed(ctaLinks.length > 0 || form),
    hasBooking: observed(booking),
    hasLogin: observed(links.some((a) => /login|entrar|sign.in/i.test(a.href + ' ' + a.text))),
    hasClientArea: observed(
      links.some((a) =>
        /área do (cliente|aluno|paciente)|portal do|area.do.cliente/i.test(a.href + ' ' + a.text)
      )
    ),
    whatsappOnly: observed(whatsapp.length > 0 && !nonWhatsAppCTA && !form && !booking),
    technologies,
    analytics,
    crawlStatus: meaningful ? 'success' : 'partial',
    finalUrl: url,
    crawledAt: new Date().toISOString(),
    warnings: meaningful
      ? [
          'Detecções limitadas ao HTML da página inicial; não comprovam ausência em páginas internas.',
        ]
      : [
          'Conteúdo insuficiente ou renderizado por JavaScript. Recursos não observados permanecem desconhecidos.',
        ],
  }
}
export type AuditFailureCode =
  | 'WEBSITE_DNS_FAILURE'
  | 'WEBSITE_TLS_ERROR'
  | 'WEBSITE_UNREACHABLE'
  | 'AUDIT_BLOCKED'
  | 'WEBSITE_HTTP_ERROR'

export interface AuditTerminalFailureResult {
  auditFailed: true
  failureCode: AuditFailureCode
  failureDetail: string
  signals: { code: string; source: string; evidence?: Record<string, unknown> }[]
  digital: DigitalPresence
}

export type AuditWebsiteResult = DigitalPresence | AuditTerminalFailureResult

export function classifyAuditError(err: unknown): {
  terminal: boolean
  code: AuditFailureCode
  detail: string
} {
  const msg = err instanceof Error ? err.message : String(err)

  // 1. DNS / NXDOMAIN / ENOTFOUND / URL Inválida -> Terminal
  if (
    /ENOTFOUND|NXDOMAIN|EAI_NONAME|EAI_NODATA|Domínio não encontrado|Endereço de website não permitido|Endereço de website não público|DNS não público/i.test(
      msg
    )
  ) {
    return {
      terminal: true,
      code: 'WEBSITE_DNS_FAILURE',
      detail: 'Domínio não encontrado ou DNS inválido',
    }
  }

  // 2. TLS / Certificado inválido -> Terminal
  if (/TLS|SSL|certificate|CERT_|DEPTH_|SELF_SIGNED|UNABLE_TO_VERIFY/i.test(msg)) {
    return {
      terminal: true,
      code: 'WEBSITE_TLS_ERROR',
      detail: 'Certificado TLS/SSL inválido ou expirado',
    }
  }

  // 3. ECONNREFUSED -> Terminal
  if (/ECONNREFUSED|Conexão recusada/i.test(msg)) {
    return {
      terminal: true,
      code: 'WEBSITE_UNREACHABLE',
      detail: 'Servidor recusou conexão (ECONNREFUSED)',
    }
  }

  // 4. HTTP 403 / Bot protection / robots.txt -> Terminal / Bloqueado
  if (/HTTP 403|HTTP 401|não autorizou a leitura de robots|não permitida pelo robots/i.test(msg)) {
    return {
      terminal: true,
      code: 'AUDIT_BLOCKED',
      detail: 'Acesso bloqueado por proteção de bot ou política robots.txt',
    }
  }

  // 5. HTTP 404 / 410 -> Terminal
  if (/HTTP 404|HTTP 410/i.test(msg)) {
    return {
      terminal: true,
      code: 'WEBSITE_HTTP_ERROR',
      detail: 'Página não encontrada (HTTP 404)',
    }
  }

  // 6. Redirection loop / Não HTML -> Terminal
  if (/limite de redirecionamentos|não retornou uma página HTML/i.test(msg)) {
    return {
      terminal: true,
      code: 'WEBSITE_HTTP_ERROR',
      detail: msg,
    }
  }

  // 7. Transient / temporários: Timeout, ECONNRESET, HTTP 429, HTTP 5xx
  return {
    terminal: false,
    code: 'WEBSITE_UNREACHABLE',
    detail: msg,
  }
}

export async function auditWebsite(
  website: string,
  key: string | undefined
): Promise<AuditWebsiteResult> {
  try {
    validateWebsiteURL(website)
    const deadline = Date.now() + 20000
    const policies = new Map<string, ReturnType<typeof parseRobots>>()
    const response = await fetchWebsite(website, 0, deadline, async (url) => {
      if (!policies.has(url.origin)) {
        const robotsURL = new URL('/robots.txt', url).href
        const robots = await fetchWebsite(robotsURL, 0, deadline)
        if (robots.status >= 500 || [429].includes(robots.status))
          throw new Error(`Website retornou HTTP ${robots.status} ao consultar robots.txt.`)
        if ([401, 403].includes(robots.status))
          throw new Error('Website não autorizou a leitura de robots.txt.')
        policies.set(url.origin, parseRobots(robotsURL, robots.status === 200 ? robots.body : ''))
      }
      if (policies.get(url.origin)?.isAllowed(url.href, 'AnxisProspecting') === false)
        throw new Error('Auditoria não permitida pelo robots.txt deste website.')
    })
    if (response.status < 200 || response.status >= 300)
      throw new Error(`Website retornou HTTP ${response.status}.`)
    if (!/text\/html|application\/xhtml\+xml/i.test(response.type))
      throw new Error('O endereço não retornou uma página HTML.')
    const digital = parseWebsite(response.body, response.url)
    const speed = await pageSpeed(key, response.url)
    return {
      ...digital,
      ...speed,
      warnings: [
        ...(digital.warnings ?? []),
        ...('warning' in speed && speed.warning ? [speed.warning] : []),
      ],
      badWebsite:
        (speed.performance !== null && speed.performance < 50) ||
        (speed.seo !== null && speed.seo < 50) ||
        digital.https === false ||
        digital.hasViewport === false,
    }
  } catch (err) {
    const classified = classifyAuditError(err)
    if (classified.terminal) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      return {
        auditFailed: true,
        failureCode: classified.code,
        failureDetail: classified.detail,
        signals: [
          {
            code: classified.code,
            source: 'website_audit',
            evidence: { detail: classified.detail, error: rawMsg },
          },
        ],
        digital: {
          websiteKind: 'website',
          crawlStatus: 'failed',
          warnings: [classified.detail],
          finalUrl: website,
          crawledAt: new Date().toISOString(),
          auditFailureCode: classified.code,
          dnsFailure: classified.code === 'WEBSITE_DNS_FAILURE',
          tlsError: classified.code === 'WEBSITE_TLS_ERROR',
          unreachable: classified.code === 'WEBSITE_UNREACHABLE',
          httpError: classified.code === 'WEBSITE_HTTP_ERROR',
          badWebsite: classified.code !== 'AUDIT_BLOCKED',
        },
      }
    }
    // Erros temporários continuam sendo lançados para permitir retries automáticos com backoff
    throw err
  }
}
