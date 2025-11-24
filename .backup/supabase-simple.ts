// Versão simplificada do cliente Supabase para teste
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente mais simples possível - configuração padrão
export const supabaseSimple = createClient<Database>(supabaseUrl, supabaseAnonKey)

console.log('✅ Cliente Supabase Simples inicializado')

// Função de teste básica
export async function testSimpleConnection() {
  try {
    console.log('🧪 Testando conexão simples...')
    
    // Teste 1: Verificar sessão
    const { data: { session }, error: sessionError } = await supabaseSimple.auth.getSession()
    console.log('📍 Sessão:', session ? 'Ativa' : 'Inativa', sessionError || '')
    
    // Teste 2: Query simples
    const { data, error } = await supabaseSimple
      .from('accounts')
      .select('id')
      .limit(1)
    
    console.log('📍 Query teste:', data ? 'Sucesso' : 'Falhou', error || '')
    
    return { success: !error, session, error }
  } catch (err) {
    console.error('❌ Erro no teste:', err)
    return { success: false, error: err }
  }
}