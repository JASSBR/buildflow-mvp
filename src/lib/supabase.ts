import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './supabase-types'

// Type-safe client creation with explicit return typing
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Server-side Supabase client with explicit typing
export const createSupabaseServer = () => {
  return createServerComponentClient<Database>({ cookies })
}

// Export Database type for use in components
export type { Database }