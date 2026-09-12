export async function apiJSON(
  url: string,
  init: RequestInit,
  label: string,
  timeout = 20000
): Promise<unknown> {
  try {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeout),
      redirect: 'error',
    })
    if (!response.ok)
      throw new Error(
        `${label}: HTTP ${response.status}. Verifique credencial, cota e disponibilidade.`
      )
    return await response.json()
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`${label}:`)) throw error
    throw new Error(`${label}: timeout ou falha de comunicação.`)
  }
}
export function requireKey(key: string | undefined, name: string): string {
  if (!key)
    throw new Error(
      `Integração não configurada: ${name}. Configure o secret no worker e tente novamente.`
    )
  return key
}
