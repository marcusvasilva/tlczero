import { useState, useEffect, useCallback } from 'react'

// Sistema de cache local para reduzir chamadas ao banco
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live em ms
}

class LocalCache {
  private cache: Map<string, CacheItem<any>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  // Salvar no cache
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    }
    this.cache.set(key, item)
    
    // Também salvar no localStorage para persistência entre recarregamentos
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item))
    } catch (error) {
      console.warn('Erro ao salvar cache no localStorage:', error)
    }
  }

  // Buscar do cache
  get<T>(key: string): T | null {
    // Primeiro tentar buscar da memória
    let item = this.cache.get(key)
    
    // Se não estiver na memória, tentar buscar do localStorage
    if (!item) {
      try {
        const stored = localStorage.getItem(`cache_${key}`)
        if (stored) {
          item = JSON.parse(stored) as CacheItem<T>
          // Restaurar na memória
          this.cache.set(key, item)
        }
      } catch (error) {
        console.warn('Erro ao buscar cache do localStorage:', error)
      }
    }
    
    if (!item) return null
    
    // Verificar se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key)
      return null
    }
    
    return item.data as T
  }

  // Deletar do cache
  delete(key: string): void {
    this.cache.delete(key)
    try {
      localStorage.removeItem(`cache_${key}`)
    } catch (error) {
      console.warn('Erro ao deletar cache do localStorage:', error)
    }
  }

  // Limpar todo o cache
  clear(): void {
    this.cache.clear()
    // Limpar apenas itens de cache do localStorage
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Erro ao limpar cache do localStorage:', error)
    }
  }
  
  // Forçar limpeza completa do cache de dados (NÃO mexe em autenticação)
  forceCompleteCleanup(): void {
    console.log('🧹 Executando limpeza completa do cache de dados...')
    this.clear()
    // IMPORTANTE: NÃO mexer em tokens de autenticação
    // O Supabase gerencia isso automaticamente
  }

  // Invalidar cache por padrão
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = []
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.delete(key))
  }

  // Verificar se existe no cache (sem verificar expiração)
  has(key: string): boolean {
    return this.cache.has(key) || localStorage.getItem(`cache_${key}`) !== null
  }

  // Obter idade do cache em ms
  getAge(key: string): number | null {
    const item = this.cache.get(key)
    if (!item) return null
    return Date.now() - item.timestamp
  }
}

// Instância singleton do cache
export const cache = new LocalCache()

// Helper para gerar chaves de cache consistentes
export function getCacheKey(prefix: string, params?: Record<string, any>): string {
  if (!params) return prefix
  
  // Ordenar parâmetros para garantir consistência
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('_')
  
  return `${prefix}_${sortedParams}`
}

// Hook para usar cache com queries
export function useCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options?: {
    ttl?: number
    staleWhileRevalidate?: boolean
    onError?: (error: Error) => void
  }
): {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRevalidating, setIsRevalidating] = useState(false)

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Se não forçar refresh, tentar buscar do cache primeiro
      if (!forceRefresh) {
        const cached = cache.get<T>(key)
        if (cached) {
          setData(cached)
          setIsLoading(false)
          
          // Se staleWhileRevalidate, buscar dados frescos em background
          if (options?.staleWhileRevalidate && !isRevalidating) {
            setIsRevalidating(true)
            queryFn().then(fresh => {
              cache.set(key, fresh, options.ttl)
              setData(fresh)
              setIsRevalidating(false)
            }).catch(err => {
              console.warn('Erro ao revalidar cache:', err)
              setIsRevalidating(false)
            })
          }
          
          return
        }
      }
      
      // Buscar dados frescos
      setIsLoading(true)
      setError(null)
      
      const result = await queryFn()
      
      // Salvar no cache
      cache.set(key, result, options?.ttl)
      
      setData(result)
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(error)
      options?.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [key, queryFn, options, isRevalidating])

  useEffect(() => {
    fetchData()
  }, [key]) // Refetch quando a chave mudar

  const refetch = useCallback(() => fetchData(true), [fetchData])

  return { data, isLoading, error, refetch }
}

// Função para pré-carregar dados no cache
export async function preloadCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<void> {
  try {
    const data = await queryFn()
    cache.set(key, data, ttl)
  } catch (error) {
    console.warn(`Erro ao pré-carregar cache para ${key}:`, error)
  }
}

// Limpar cache expirado periodicamente (apenas em runtime, não no build)
if (typeof window !== 'undefined') {
  setInterval(() => {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          const item = localStorage.getItem(key)
          if (item) {
            const parsed = JSON.parse(item) as CacheItem<any>
            if (Date.now() - parsed.timestamp > parsed.ttl) {
              localStorage.removeItem(key)
            }
          }
        }
      })
    } catch (error) {
      console.warn('Erro ao limpar cache expirado:', error)
    }
  }, 60000) // A cada minuto
}