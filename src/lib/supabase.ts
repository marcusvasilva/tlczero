import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = 'https://nfditawexkrwwhzbqfjt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZGl0YXdleGtyd3doemJxZmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjM4MzAsImV4cCI6MjA2NzM5OTgzMH0.X7jsQwk7c09RXr_wMnFtg_j-bWA4vuaKA5BiB9ZuDOs'

// Chave de service role para operações administrativas
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZGl0YXdleGtyd3doemJxZmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyMzgzMCwiZXhwIjoyMDY3Mzk5ODMwfQ.M7i7gOlSrdWvHILcW9CfnSZiLYrsYj_deuV0-ciYOyU'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Cliente admin para operações que requerem privilégios administrativos
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Tipos auxiliares para facilitar o uso
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Tipos específicos das tabelas
export type User = Tables<'users'>
export type Client = Tables<'clients'>
export type Operator = Tables<'operators'>
export type Space = Tables<'spaces'>
export type Collection = Tables<'collections'>
export type Report = Tables<'reports'>

// Tipos para inserção
export type UserInsert = Inserts<'users'>
export type ClientInsert = Inserts<'clients'>
export type ClientUpdate = Updates<'clients'>
export type OperatorInsert = Inserts<'operators'>
export type OperatorUpdate = Updates<'operators'>
export type SpaceInsert = Inserts<'spaces'>
export type SpaceUpdate = Updates<'spaces'>
export type CollectionInsert = Inserts<'collections'>
export type CollectionUpdate = Updates<'collections'>
export type ReportInsert = Inserts<'reports'>
export type ReportUpdate = Updates<'reports'>

// Views
export type ClientStatistics = Database['public']['Views']['client_statistics']['Row']
export type CollectionDetailed = Database['public']['Views']['collections_detailed']['Row']
export type MonthlyStatistics = {
  month: string | null
  total_collections: number | null
  total_weight: number | null
  avg_weight: number | null
  active_clients: number | null
} 