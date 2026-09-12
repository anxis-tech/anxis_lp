import type { SupabaseClient } from '@supabase/supabase-js'
export type DatabaseClient = SupabaseClient
export function checked<T>(result: {
  data: T
  error: { message: string; code?: string } | null
}): T {
  if (result.error)
    throw new Error(
      result.error.code === '42P01' || result.error.code === 'PGRST205'
        ? 'Prospecção ainda não instalada no banco. Aplique as migrations do módulo.'
        : `Não foi possível acessar os dados de Prospecção (${result.error.code ?? 'banco'}).`
    )
  return result.data
}
