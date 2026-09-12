import { lookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import ipaddr from 'ipaddr.js'
export function isPublicAddress(address: string): boolean {
  try {
    return ipaddr.process(address).range() === 'unicast'
  } catch {
    return false
  }
}
export function validateWebsiteURL(raw: string): URL {
  const url = new URL(raw)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !['80', '443'].includes(url.port))
  )
    throw new Error('Endereço de website não permitido.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (
    (!host.includes('.') && !host.includes(':')) ||
    /(?:^|\.)(localhost|local|internal|test|invalid)$/.test(host)
  )
    throw new Error('Endereço de website não público.')
  if (ipaddr.isValid(host) && !isPublicAddress(host))
    throw new Error('Endereço de website não público.')
  return url
}
export async function publicAddress(url: URL): Promise<string> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (ipaddr.isValid(hostname)) {
    if (!isPublicAddress(hostname)) throw new Error('Endereço privado bloqueado.')
    return hostname
  }
  let addresses
  try {
    addresses = await Promise.race([
      lookup(hostname, { all: true }),
      new Promise<never>((_, reject) => {
        const timer = setTimeout(() => reject(new Error('Timeout DNS.')), 5000)
        timer.unref?.()
      }),
    ])
  } catch (err: any) {
    const msg = err?.message || ''
    const code = err?.code || ''
    if (
      code === 'ENOTFOUND' ||
      /ENOTFOUND|EAI_NONAME|EAI_NODATA|NXDOMAIN/i.test(msg)
    ) {
      throw new Error(`Domínio não encontrado no DNS (ENOTFOUND): ${hostname}`)
    }
    throw err
  }
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new Error('DNS não público bloqueado.')
  return addresses[0].address
}
// Connect to the validated IP; retain original Host and TLS SNI/certificate verification.
// No second DNS lookup, cookies, forwarded headers or automatic redirects.
async function pinnedRequest(
  url: URL,
  address: string,
  timeout: number
): Promise<{ status: number; location?: string; type: string; body: string }> {
  return new Promise((resolve, reject) => {
    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(
      {
        protocol: url.protocol,
        hostname: address,
        port: url.port || undefined,
        servername: url.hostname.replace(/^\[|\]$/g, ''),
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          Host: url.host,
          'User-Agent': 'AnxisProspecting/1.0 (website audit)',
          Accept: 'text/html,text/plain',
          'Accept-Encoding': 'identity',
        },
        agent: false,
      },
      (response) => {
        const chunks: Buffer[] = []
        let size = 0
        response.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > 1024 * 1024) {
            response.destroy()
            request.destroy(new Error('Website excedeu o limite de 1 MB.'))
            return
          }
          chunks.push(chunk)
        })
        response.on('error', reject)
        response.on('end', () =>
          resolve({
            status: response.statusCode ?? 0,
            location: response.headers.location,
            type: response.headers['content-type'] ?? '',
            body: Buffer.concat(chunks).toString('utf8'),
          })
        )
      }
    )
    const timer = setTimeout(
      () => request.destroy(new Error('Timeout ao acessar o website.')),
      timeout
    )
    request.on('close', () => clearTimeout(timer))
    request.on('error', (error: any) => {
      const code = error?.code || ''
      const msg = error?.message || ''
      if (msg.startsWith('Timeout') || msg.startsWith('Website excedeu')) {
        reject(new Error(msg))
      } else if (code === 'ECONNREFUSED' || /ECONNREFUSED/i.test(msg)) {
        reject(new Error('Conexão recusada (ECONNREFUSED) ao acessar o website.'))
      } else if (code === 'ECONNRESET' || /ECONNRESET/i.test(msg)) {
        reject(new Error('Conexão reiniciada (ECONNRESET) ao acessar o website.'))
      } else if (code === 'ETIMEDOUT' || /ETIMEDOUT/i.test(msg)) {
        reject(new Error('Timeout de conexão (ETIMEDOUT) ao acessar o website.'))
      } else if (
        /CERT_|DEPTH_|SELF_SIGNED|UNABLE_TO_VERIFY|TLS|SSL/i.test(code) ||
        /certificate|SSL|TLS/i.test(msg)
      ) {
        reject(new Error(`Falha de certificado TLS/SSL (${code || msg}) ao acessar o website.`))
      } else {
        reject(new Error(`Falha de conexão (${code || msg}) ao acessar o website.`))
      }
    })
    request.end()
  })
}
export async function fetchWebsite(
  raw: string,
  redirects = 0,
  deadline = Date.now() + 20000,
  beforeRequest?: (url: URL) => Promise<void>
): Promise<{ url: string; body: string; status: number; type: string }> {
  if (redirects > 3) throw new Error('Website excedeu o limite de redirecionamentos.')
  const url = validateWebsiteURL(raw)
  if (Date.now() >= deadline) throw new Error('Timeout ao acessar o website.')
  if (beforeRequest) await beforeRequest(url)
  const address = await publicAddress(url)
  const timeout = Math.min(12000, deadline - Date.now())
  if (timeout <= 0) throw new Error('Timeout ao acessar o website.')
  const response = await pinnedRequest(url, address, timeout)
  if ([301, 302, 303, 307, 308].includes(response.status) && response.location)
    return fetchWebsite(
      new URL(response.location, url).href,
      redirects + 1,
      deadline,
      beforeRequest
    )
  return { url: url.href, body: response.body, status: response.status, type: response.type }
}
