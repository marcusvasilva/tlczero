// Cliente Supabase MÍNIMO - exatamente como o projeto funcional
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nfditawexkrwwhzbqfjt.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cliente idêntico ao projeto funcional
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Nada mais - sem tipos, sem helpers, sem nada