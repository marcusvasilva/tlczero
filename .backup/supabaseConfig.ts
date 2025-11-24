import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a single supabase client for interacting with your database
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to handle auth errors
export async function handleAuthError(error: any) {
  if (error?.message?.includes('refresh_token_not_found')) {
    // Token expired, force logout
    await supabaseClient.auth.signOut()
    window.location.href = '/login'
  }
}