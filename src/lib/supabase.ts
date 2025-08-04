import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { getPerformanceConfig } from '../config/performance'

const supabaseUrl = 'https://nfditawexkrwwhzbqfjt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZGl0YXdleGtyd3doemJxZmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MjM4MzAsImV4cCI6MjA2NzM5OTgzMH0.X7jsQwk7c09RXr_wMnFtg_j-bWA4vuaKA5BiB9ZuDOs'

// Chave de service role para operações administrativas
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZGl0YXdleGtyd3doemJxZmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyMzgzMCwiZXhwIjoyMDY3Mzk5ODMwfQ.M7i7gOlSrdWvHILcW9CfnSZiLYrsYj_deuV0-ciYOyU'

// Singleton para o cliente Supabase principal
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null

// Função para criar ou retornar a instância única do cliente Supabase
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Adicionar timeout de sessão mais longo
        storageKey: 'tlc-zero-auth',
        storage: window.localStorage
      },
      // Adicionar configurações de realtime e fetch
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      },
      global: {
        // Headers customizados para melhor rastreamento
        headers: { 
          'x-client-info': 'tlc-zero-app',
          'x-request-source': 'web-app'
        },
        // Configuração de fetch com timeout reduzido
        fetch: (url, init) => {
          const controller = new AbortController()
          const config = getPerformanceConfig()
          const timeoutId = setTimeout(() => controller.abort(), config.timeouts.query)
          
          return fetch(url, {
            ...init,
            signal: controller.signal,
            // Adicionar retry automático no nível do fetch
            cache: 'no-cache'
          }).finally(() => clearTimeout(timeoutId))
        }
      },
      // Pool de conexões
      db: {
        schema: 'public'
      }
    })
    console.log('✅ Cliente Supabase criado (singleton)')
  }
  return supabaseInstance
})()

// Cliente admin para operações que requerem privilégios administrativos
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('✅ Cliente Supabase Admin criado (singleton)')
  }
  return supabaseAdminInstance
})()

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
        
        // Se é erro de auth, não retry (precisa reautenticar)
        if (isAuthError(result.error)) {
          console.error(`🔐 ${context} - Erro de autenticação detectado, não fazendo retry`)
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