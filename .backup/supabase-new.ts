import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente simples e direto - igual ao projeto funcional
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
}

// Função executeQuery simplificada
interface QueryResult<T> {
  data: T | null
  error: any
  success: boolean
}

export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<QueryResult<T>> {
  try {
    const result = await queryFn()
    
    if (result.error) {
      console.error('Query error:', result.error)
      await handleAuthError(result.error)
      return {
        data: null,
        error: result.error,
        success: false
      }
    }
    
    return {
      data: result.data,
      error: null,
      success: true
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      data: null,
      error,
      success: false
    }
  }
}

// Admin client apenas se necessário
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Re-export types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']