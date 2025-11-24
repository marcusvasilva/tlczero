// VERSÃO CORRIGIDA - Baseada no projeto funcional
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente SIMPLES - igual ao projeto que funciona
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Admin client (opcional)
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey)
  : null

// Helper para erros de auth
export async function handleAuthError(error: any) {
  if (error?.message?.includes('refresh_token_not_found') || 
      error?.message?.includes('JWT')) {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
}

// executeQuery SIMPLIFICADO
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any; success: boolean }> {
  try {
    const result = await queryFn()
    
    if (result.error) {
      console.error('Query error:', result.error)
      
      // Verificar se é erro de auth
      if (result.error.message?.includes('JWT') || 
          result.error.message?.includes('token')) {
        handleAuthError(result.error)
      }
    }
    
    return {
      data: result.data,
      error: result.error,
      success: !result.error
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

// Funções auxiliares básicas
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('accounts').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.refreshSession()
    return !error
  } catch {
    return false
  }
}

// Types helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']