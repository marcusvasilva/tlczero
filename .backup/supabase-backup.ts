import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { getPerformanceConfig } from '../config/performance'

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Validar se as variáveis de ambiente estão configuradas
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL não encontrada nas variáveis de ambiente')
}
if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY não encontrada nas variáveis de ambiente')
}
if (!supabaseServiceRoleKey) {
  throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente')
}

// Singleton para evitar múltiplas instâncias durante hot reload
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null

// Cliente Supabase principal seguindo padrão da documentação oficial
export const supabase = supabaseInstance || (supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'tlc-zero-auth',
    // Adicionar configurações para melhor gerenciamento de sessão
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key)
        }
        return null
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value)
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key)
        }
      }
    },
    // Refresh token 1 minuto antes de expirar
    autoRefreshThreshold: 60
  },
  global: {
    // Adicionar headers customizados para melhor debugging
    headers: {
      'x-app-version': '0.0.0',
      'x-client-info': 'tlc-zero-web'
    }
  },
  db: {
    // Configurações de retry para queries do banco
    schema: 'public'
  },
  // Adicionar realtime desabilitado por padrão para economizar recursos
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}))

if (!supabaseInstance) {
  console.log('✅ Cliente Supabase inicializado com configurações otimizadas')
}

// Cliente admin para operações administrativas
export const supabaseAdmin = supabaseAdminInstance || (supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: 'tlc-zero-admin-auth', // Usar uma chave diferente para evitar conflitos
    storage: {
      getItem: () => null, // Admin não precisa persistir sessão
      setItem: () => {},
      removeItem: () => {}
    }
  }
}))

if (!supabaseAdminInstance) {
  console.log('✅ Cliente Supabase Admin inicializado')
}

// Tipos para a função utilitária
interface QueryOptions {
  timeout?: number
  maxRetries?: number
  retryDelay?: number
  context?: string
}

interface QueryResult<T> {
  data: T | null
  error: any
  success: boolean
}

// Função para timeout de promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Query timeout após ${timeoutMs}ms`))
    }, timeoutMs)
    
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId))
  })
}

// Função para delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Verificar se o erro é relacionado à autenticação
function isAuthError(error: any): boolean {
  if (!error) return false
  const message = error.message?.toLowerCase() || ''
  return message.includes('jwt') || 
         message.includes('token') || 
         message.includes('authorization') ||
         message.includes('authentication') ||
         message.includes('session')
}

// Verificar se o erro é relacionado à conectividade
function isConnectivityError(error: any): boolean {
  if (!error) return false
  const message = error.message?.toLowerCase() || ''
  return message.includes('network') ||
         message.includes('connection') ||
         message.includes('fetch') ||
         message.includes('timeout') ||
         error.code === 'NETWORK_ERROR'
}

/**
 * Função utilitária para executar queries do Supabase com timeout, retry e melhor tratamento de erros
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const perfConfig = getPerformanceConfig()
  const {
    timeout = perfConfig.timeouts.query,
    maxRetries = perfConfig.retry.maxAttempts,
    retryDelay = perfConfig.retry.initialDelay,
    context = 'Query'
  } = options

  // Verificar e renovar sessão antes de executar a query
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.warn(`⚠️ ${context} - Erro ao verificar sessão:`, sessionError)
    } else if (!session) {
      console.warn(`⚠️ ${context} - Sem sessão ativa, tentando refresh...`)
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.error(`❌ ${context} - Erro ao renovar sessão:`, refreshError)
        return {
          data: null,
          error: refreshError,
          success: false
        }
      }
    } else {
      // Verificar se o token está próximo de expirar (menos de 5 minutos)
      const expiresAt = session.expires_at || 0
      const now = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = expiresAt - now
      
      if (timeUntilExpiry < 300) { // 5 minutos
        console.log(`🔄 ${context} - Token expirando em ${timeUntilExpiry}s, renovando...`)
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.warn(`⚠️ ${context} - Erro ao renovar token:`, refreshError)
        }
      }
    }
  } catch (authCheckError) {
    console.error(`❌ ${context} - Erro ao verificar autenticação:`, authCheckError)
  }

  let lastError: any = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${context} - Tentativa ${attempt}/${maxRetries}`)
      
      // Executar query com timeout
      const result = await withTimeout(queryFn(), timeout)
      
      // Verificar se houve erro no resultado
      if (result.error) {
        lastError = result.error
        console.error(`❌ ${context} - Erro na tentativa ${attempt}:`, result.error)
        
        // Se é erro de auth, tentar refresh antes de desistir
        if (isAuthError(result.error)) {
          console.error(`🔐 ${context} - Erro de autenticação detectado`)
          
          // Tentar refresh uma vez
          if (attempt === 1) {
            console.log(`🔄 ${context} - Tentando refresh de sessão...`)
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (!refreshError) {
              console.log(`✅ ${context} - Sessão renovada, tentando novamente...`)
              continue
            }
          }
          
          break
        }
        
        // Se é erro de conectividade e não é a última tentativa, retry
        if (isConnectivityError(result.error) && attempt < maxRetries) {
          const backoffDelay = Math.min(
            retryDelay * Math.pow(perfConfig.retry.backoffMultiplier, attempt - 1), 
            perfConfig.retry.maxDelay
          )
          console.warn(`🌐 ${context} - Erro de conectividade, tentando novamente em ${backoffDelay}ms`)
          await delay(backoffDelay)
          continue
        }
        
        // Para outros tipos de erro, não fazer retry
        break
      }
      
      // Sucesso
      console.log(`✅ ${context} - Sucesso na tentativa ${attempt}`)
      return {
        data: result.data,
        error: null,
        success: true
      }
      
    } catch (error) {
      lastError = error
      console.error(`❌ ${context} - Erro na tentativa ${attempt}:`, error)
      
      // Se é timeout ou erro de conectividade e não é a última tentativa, retry
      if (attempt < maxRetries && (
        error instanceof Error && (
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('fetch')
        )
      )) {
        const backoffDelay = Math.min(
          retryDelay * Math.pow(perfConfig.retry.backoffMultiplier, attempt - 1), 
          perfConfig.retry.maxDelay
        )
        console.warn(`⏱️ ${context} - Timeout/conectividade, tentando novamente em ${backoffDelay}ms`)
        await delay(backoffDelay)
        continue
      }
      
      // Para outros erros, não fazer retry
      break
    }
  }
  
  // Todas as tentativas falharam
  console.error(`💥 ${context} - Todas as tentativas falharam. Último erro:`, lastError)
  
  return {
    data: null,
    error: lastError,
    success: false
  }
}

// Função otimizada para verificar conectividade com Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Usar uma abordagem mais leve - verificar apenas a sessão ativa
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('⚠️ Erro na verificação de sessão:', error)
      return false
    }
    
    // Se há sessão ativa, considerar conectado
    if (session) {
      return true
    }
    
    // Se não há sessão, fazer uma verificação mínima no banco
    // Usar uma query muito simples que não consome recursos
    const config = getPerformanceConfig()
    const result = await executeQuery(
      async () => {
        return await supabase
          .from('accounts')
          .select('id')
          .limit(1)
      },
      {
        timeout: config.timeouts.quickCheck,
        maxRetries: 1,
        context: 'Connection Check'
      }
    )
    
    return result.success
  } catch (error) {
    console.error('❌ Erro na verificação de conectividade:', error)
    return false
  }
}

// Função para verificação de conectividade ainda mais leve (apenas para usuários anônimos)
export async function checkBasicConnectivity(): Promise<boolean> {
  try {
    // Verificar apenas se consegue fazer uma requisição básica
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey
      },
      signal: AbortSignal.timeout(2000) // Timeout de 2 segundos
    })
    
    return response.ok
  } catch (error) {
    console.warn('⚠️ Verificação básica de conectividade falhou:', error)
    return false
  }
}

// Função para refresh de sessão se necessário
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Erro ao verificar sessão:', error)
      return false
    }
    
    // Se não há sessão, tentar refresh
    if (!session) {
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.error('❌ Erro ao refresh da sessão:', refreshError)
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro no refresh da sessão:', error)
    return false
  }
}

// Função para limpar dados obsoletos do localStorage
export async function cleanupObsoleteAuthData(): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    
    // Não limpar se há uma sessão ativa
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      console.log('🔒 Sessão ativa detectada, ignorando limpeza de tokens')
      return
    }
    
    const keysToCheck = ['tlc-zero-auth', 'sb-auth-token', 'supabase.auth.token']
    
    for (const key of keysToCheck) {
      const data = localStorage.getItem(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          // Verificar se o token expirou
          if (parsed.expires_at) {
            const expiresAt = new Date(parsed.expires_at).getTime()
            // Adicionar uma margem de segurança de 5 minutos
            if (expiresAt < Date.now() - (5 * 60 * 1000)) {
              console.log(`🧹 Removendo token expirado: ${key}`)
              localStorage.removeItem(key)
            }
          }
        } catch (e) {
          // Se não conseguir fazer parse, verificar se não é o token atual
          if (key !== 'tlc-zero-auth') {
            console.log(`🧹 Removendo token inválido: ${key}`)
            localStorage.removeItem(key)
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao limpar dados obsoletos:', error)
  }
}

// Função para forçar renovação de sessão
export async function forceSessionRefresh(): Promise<boolean> {
  try {
    console.log('🔄 Forçando renovação de sessão...')
    
    // Limpar dados obsoletos primeiro
    await cleanupObsoleteAuthData()
    
    // Tentar refresh
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('❌ Erro ao forçar refresh:', error)
      
      // Se falhou, tentar fazer logout e pedir novo login
      if (error.message?.includes('refresh_token') || error.message?.includes('invalid')) {
        console.log('🔄 Token inválido, fazendo logout...')
        await supabase.auth.signOut()
        return false
      }
    }
    
    if (data?.session) {
      console.log('✅ Sessão renovada com sucesso')
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ Erro ao forçar refresh de sessão:', error)
    return false
  }
}

// Tipos auxiliares para facilitar o uso
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Tipos específicos das tabelas
export type User = Tables<'users'>
export type Account = Tables<'accounts'>  // Mudando de Client para Account
export type Space = Tables<'spaces'>
export type Collection = Tables<'collections'>
export type Report = Tables<'reports'>

// Tipos para inserção
export type UserInsert = Inserts<'users'>
export type AccountInsert = Inserts<'accounts'>  // Mudando de Client para Account
export type AccountUpdate = Updates<'accounts'>  // Mudando de Client para Account
export type SpaceInsert = Inserts<'spaces'>
export type SpaceUpdate = Updates<'spaces'>
export type CollectionInsert = Inserts<'collections'>
export type CollectionUpdate = Updates<'collections'>
export type ReportInsert = Inserts<'reports'>
export type ReportUpdate = Updates<'reports'>

// Views
export type MonthlyStatistics = Database['public']['Views']['monthly_statistics']['Row'] 