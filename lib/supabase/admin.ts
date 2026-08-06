import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the service_role key for server-side admin operations
 * that need to bypass RLS (e.g., uploading files to Storage).
 * 
 * IMPORTANT: Never expose this client or the service_role key to the browser.
 * Only use this in Server Actions or API Routes.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin operations.'
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
