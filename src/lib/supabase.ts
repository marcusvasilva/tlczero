// Cliente Supabase - Configuração seguindo documentação oficial
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const authStorage = typeof window !== 'undefined' ? window.localStorage : undefined
const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || 'tlc-zero'
const authStorageKey = `sb-${projectRef}-auth-token`

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL não encontrada nas variáveis de ambiente')
}
if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY não encontrada nas variáveis de ambiente')
}

// Cliente principal - Singleton
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: authStorage,
    storageKey: authStorageKey, // Usa projectRef para evitar conflito entre ambientes
  },
})

// Cliente admin (se disponível)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Tipos para queries
interface QueryOptions {
  context?: string
}

interface QueryResult<T> {
  data: T | null
  error: any
  success: boolean
}

// executeQuery simplificado
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const { context = 'Query' } = options

  try {
    const result = await queryFn()

    if (result.error) {
      console.error(`❌ ${context}:`, result.error.message)
      return { data: null, error: result.error, success: false }
    }

    return { data: result.data, error: null, success: true }
  } catch (error) {
    console.error(`❌ ${context} - Erro inesperado:`, error)
    return { data: null, error, success: false }
  }
}

// Verificação de conexão
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('accounts').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// Tipos auxiliares
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Aliases para compatibilidade
export type User = Tables<'users'>
export type Account = Tables<'accounts'>
export type Space = Tables<'spaces'>
export type Collection = Tables<'collections'>
export type Report = Tables<'reports'>

export type UserInsert = Inserts<'users'>
export type AccountInsert = Inserts<'accounts'>
export type AccountUpdate = Updates<'accounts'>
export type SpaceInsert = Inserts<'spaces'>
export type SpaceUpdate = Updates<'spaces'>
export type CollectionInsert = Inserts<'collections'>
export type CollectionUpdate = Updates<'collections'>
export type ReportInsert = Inserts<'reports'>
export type ReportUpdate = Updates<'reports'>

// Views
export type MonthlyStatistics = Database['public']['Views']['monthly_statistics']['Row']

// Funções removidas - mantidas para compatibilidade
export async function refreshSessionIfNeeded(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  return !!data.session
}

export async function cleanupObsoleteAuthData(): Promise<void> {
  // Não fazer nada - Supabase gerencia automaticamente
}

export async function forceSessionRefresh(): Promise<boolean> {
  const { data } = await supabase.auth.refreshSession()
  return !!data.session
}
