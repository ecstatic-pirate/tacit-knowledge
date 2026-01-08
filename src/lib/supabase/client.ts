import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

// Use a symbol key on window to persist client across HMR
const SUPABASE_CLIENT_KEY = '__supabase_client__' as const

declare global {
  interface Window {
    [SUPABASE_CLIENT_KEY]?: ReturnType<typeof createBrowserClient<Database>>
  }
}

/**
 * Creates a Supabase client for use in browser/client components.
 * This client handles authentication state via cookies automatically.
 * Uses window-based singleton to persist across HMR (Hot Module Replacement).
 */
export function createClient() {
  // In SSR context, create a new client each time
  if (typeof window === 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  // In browser, use window-based singleton to survive HMR
  if (window[SUPABASE_CLIENT_KEY]) {
    return window[SUPABASE_CLIENT_KEY]
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  const client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  window[SUPABASE_CLIENT_KEY] = client

  return client
}
