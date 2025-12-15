import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

// Singleton client instance
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Creates a Supabase client for use in browser/client components.
 * This client handles authentication state via cookies automatically.
 * Uses singleton pattern to prevent recreation on every render.
 */
export function createClient() {
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return browserClient
}
