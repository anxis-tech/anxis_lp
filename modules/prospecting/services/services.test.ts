import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseWebsite } from './website-audit.service.ts'
import { isPublicAddress, validateWebsiteURL, fetchWebsite } from './safe-http.ts'
import { searchPlaces, enrichPlace, websiteKind } from './google-places.service.ts'
import { analyzeWithGemini } from './gemini.service.ts'
import { pageSpeed } from './pagespeed.service.ts'
import { calculateScore } from '../scoring/engine.ts'
import rules from '../scoring/default-rules.json'
import type { Rule } from '../scoring/types.ts'
const fixture = `<!doctype html><html><head><title>Clínica Alfa</title><meta name="description" content="Saúde"><meta name="viewport" content="width=device-width, initial-scale=1"><script src="/wp-content/test.js"></script><script>fbq('init','test');</script></head><body><h1>Clínica Alfa</h1><p>${'Informações sobre a clínica e seus serviços. '.repeat(10)}</p><a href="https://wa.me/5584999999999">Fale no WhatsApp</a><a href="mailto:contato@clinica.example">E-mail</a><a href="tel:+5584999999999">Telefone</a></body></html>`
test('crawler extracts structured evidence and no scores', () => {
  const result = parseWebsite(fixture, 'https://clinica.example')
  assert.equal(result.title, 'Clínica Alfa')
  assert.equal(result.description, 'Saúde')
  assert.equal(result.hasForm, false)
  assert.equal(result.hasBooking, false)
  assert.equal(result.hasWhatsapp, true)
  assert.equal(result.whatsappOnly, false)
  assert.equal(result.email, 'contato@clinica.example')
  assert.equal(result.hasPhone, true)
  assert.equal(result.https, true)
  assert.deepEqual(result.technologies, ['WordPress'])
  assert.deepEqual(result.analytics, ['Meta Pixel'])
  assert.equal('score' in result, false)
})
test('scripts cannot masquerade as booking or CTA; JS shells remain unknown', () => {
  const result = parseWebsite(
    '<html><head><script>const label="Agendamento"</script></head><body><div id="app"></div></body></html>',
    'https://clinica.example'
  )
  assert.equal(result.hasBooking, undefined)
  assert.equal(result.hasForm, undefined)
  assert.equal(result.crawlStatus, 'partial')
})
test('social domains are matched exactly, not substrings', () => {
  assert.equal(websiteKind('https://www.instagram.com/clinic'), 'social_only')
  assert.equal(websiteKind('https://instagram.com.evil.example'), 'website')
  assert.equal(websiteKind(null), 'none')
})
test('SSRF blocks loopback, private, mapped, metadata, credentials, ports and protocols', async () => {
  for (const address of [
    '127.0.0.1',
    '10.0.0.1',
    '192.168.1.1',
    '172.16.0.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    'fc00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
  ])
    assert.equal(isPublicAddress(address), false, address)
  assert.equal(isPublicAddress('8.8.8.8'), true)
  for (const url of [
    'http://127.1',
    'http://2130706433',
    'http://[::1]',
    'http://localhost',
    'file:///etc/passwd',
    'https://a:b@example.com',
    'http://example.com:8080',
    'http://metadata.internal',
  ])
    assert.throws(() => validateWebsiteURL(url), { name: 'Error' }, url)
  await assert.rejects(fetchWebsite('http://169.254.169.254/latest/meta-data'))
})
test('Places uses server headers and minimal discovery mask; enrichment maps real location', async () => {
  const original = globalThis.fetch
  const calls: { url: string; init: RequestInit }[] = []
  try {
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} })
      return Response.json(
        calls.length === 1
          ? { places: [{ id: 'place' }], nextPageToken: 'next' }
          : {
              id: 'place',
              displayName: { text: 'Clínica' },
              rating: 4.8,
              userRatingCount: 400,
              addressComponents: [
                { longText: 'Natal', types: ['administrative_area_level_2'] },
                { shortText: 'RN', types: ['administrative_area_level_1'] },
              ],
            }
      )
    }
    assert.equal((await searchPlaces('fake-key', 'clínica em Natal')).nextPageToken, 'next')
    assert.equal(
      new Headers(calls[0].init.headers).get('X-Goog-FieldMask'),
      'places.id,places.displayName,nextPageToken'
    )
    assert.equal(calls[0].url.includes('fake-key'), false)
    const business = await enrichPlace('fake-key', 'place')
    assert.equal(business.city, 'Natal')
    assert.equal(business.state, 'RN')
    assert.equal(business.website, null)
  } finally {
    globalThis.fetch = original
  }
})
test('missing API configuration fails clearly or returns unknown metrics', async () => {
  await assert.rejects(searchPlaces(undefined, 'test'), /GOOGLE_PLACES_API_KEY/)
  assert.equal((await pageSpeed(undefined, 'https://example.com')).performance, null)
  await assert.rejects(analyzeWithGemini(undefined, 'test', {}), /GEMINI_API_KEY/)
})
test('Gemini uses structured JSON, validates output and cannot mutate deterministic score', async () => {
  const original = globalThis.fetch
  const score = calculateScore(
    {
      business: { name: 'test', rating: 4.8, reviews: 400 },
      digital: { websiteKind: 'none' },
      segment: { priority: 8, booking: true, clientArea: false, highTicket: true },
      aiThreshold: 85,
    },
    rules as Rule[]
  )
  const before = JSON.stringify(score)
  try {
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body))
      assert.equal(body.generationConfig.responseMimeType, 'application/json')
      assert.ok(body.generationConfig.responseJsonSchema)
      return Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    opportunityType: 'website',
                    commercialPotential: 'high',
                    mainProblem: 'Sem site',
                    recommendedSolution: 'Site',
                    salesAngle: 'Melhorar presença',
                    summary: 'Revisar com vendedor',
                    confidence: 0.8,
                  }),
                },
              ],
            },
          },
        ],
      })
    }
    const result = await analyzeWithGemini('fake', 'test-model', { score })
    assert.equal(result.analysis.confidence, 0.8)
    assert.equal(JSON.stringify(score), before)
    globalThis.fetch = async () =>
      Response.json({ candidates: [{ content: { parts: [{ text: '{"confidence":2}' }] } }] })
    await assert.rejects(analyzeWithGemini('fake', 'test-model', {}))
  } finally {
    globalThis.fetch = original
  }
})

test('classifyWebsite categorizes normal, messaging, social, link aggregator, and shorteners', async () => {
  const { classifyWebsite } = await import('./website-classification.service.ts')

  // 1. Normal URL -> website
  const normal = await classifyWebsite('https://empresa.com.br')
  assert.equal(normal.kind, 'website')
  assert.equal(normal.redirected, false)

  // 2. WhatsApp -> messaging_only
  const wa = await classifyWebsite('https://wa.me/5584999999999')
  assert.equal(wa.kind, 'messaging_only')

  const waApi = await classifyWebsite('https://api.whatsapp.com/send?phone=5584999999999')
  assert.equal(waApi.kind, 'messaging_only')

  // 3. Instagram -> social_only
  const ig = await classifyWebsite('https://instagram.com/empresa')
  assert.equal(ig.kind, 'social_only')

  // 4. Linktree -> link_aggregator
  const linktree = await classifyWebsite('https://linktr.ee/empresa')
  assert.equal(linktree.kind, 'link_aggregator')

  const beacons = await classifyWebsite('https://beacons.ai/empresa')
  assert.equal(beacons.kind, 'link_aggregator')

  // 5. Shortener -> WhatsApp (mock resolver)
  const mockResolverToWhatsApp = async (url: string) => ({
    finalUrl: 'https://wa.me/5584999999999',
    redirected: true,
  })
  const shortenerToWa = await classifyWebsite('https://bit.ly/3FdeLZq', mockResolverToWhatsApp)
  assert.equal(shortenerToWa.kind, 'messaging_only')
  assert.equal(shortenerToWa.redirected, true)
  assert.equal(shortenerToWa.finalUrl, 'https://wa.me/5584999999999')

  // 6. Shortener -> Real Site (mock resolver)
  const mockResolverToSite = async (url: string) => ({
    finalUrl: 'https://empresa.com.br',
    redirected: true,
  })
  const shortenerToSite = await classifyWebsite('https://bit.ly/empresa123', mockResolverToSite)
  assert.equal(shortenerToSite.kind, 'website')
  assert.equal(shortenerToSite.redirected, true)
  assert.equal(shortenerToSite.finalUrl, 'https://empresa.com.br')

  // 7. Shortener -> Unresolved
  const mockResolverFailed = async (url: string) => ({
    finalUrl: url,
    redirected: false,
    error: 'Timeout DNS ao resolver',
  })
  const shortenerFailed = await classifyWebsite('https://bit.ly/quebrado', mockResolverFailed)
  assert.equal(shortenerFailed.kind, 'shortener_unresolved')
})

test('classifyAuditError accurately separates terminal errors from transient retries', async () => {
  const { classifyAuditError } = await import('./website-audit.service.ts')

  // ENOTFOUND / NXDOMAIN -> terminal, WEBSITE_DNS_FAILURE
  const dns = classifyAuditError(new Error('getaddrinfo ENOTFOUND empresa-inexistente.com'))
  assert.equal(dns.terminal, true)
  assert.equal(dns.code, 'WEBSITE_DNS_FAILURE')

  // TLS error -> terminal, WEBSITE_TLS_ERROR
  const tls = classifyAuditError(new Error('Falha de certificado TLS/SSL (CERT_HAS_EXPIRED)'))
  assert.equal(tls.terminal, true)
  assert.equal(tls.code, 'WEBSITE_TLS_ERROR')

  // ECONNREFUSED -> terminal, WEBSITE_UNREACHABLE
  const refused = classifyAuditError(new Error('Conexão recusada (ECONNREFUSED)'))
  assert.equal(refused.terminal, true)
  assert.equal(refused.code, 'WEBSITE_UNREACHABLE')

  // HTTP 403 / bot blocked -> terminal, AUDIT_BLOCKED
  const blocked = classifyAuditError(new Error('Website não autorizou a leitura de robots.txt.'))
  assert.equal(blocked.terminal, true)
  assert.equal(blocked.code, 'AUDIT_BLOCKED')

  // Timeout -> transient (terminal: false)
  const timeout = classifyAuditError(new Error('Timeout ao acessar o website.'))
  assert.equal(timeout.terminal, false)

  // ECONNRESET -> transient (terminal: false)
  const reset = classifyAuditError(new Error('Conexão reiniciada (ECONNRESET)'))
  assert.equal(reset.terminal, false)
})
