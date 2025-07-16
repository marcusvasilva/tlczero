import { useState, useCallback } from 'react'
import { useApiConnectionMonitor } from './useConnectionMonitor'
import type { ApiResponse } from '@/types'

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface UseApiActions<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

/**
 * Hook para gerenciar chamadas de API com estado de loading, erro e dados
 * Integra automaticamente o monitoramento de erros de conectividade
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>
): UseApiState<T> & UseApiActions<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const { wrapApiCall } = useApiConnectionMonitor()

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        // Envolver a chamada da API com monitoramento de conectividade
        const response = await wrapApiCall(() => apiFunction(...args))
        
        if (response.success) {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
          })
          return response.data || null
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || 'Erro desconhecido',
          })
          return null
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro na requisição'
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        })
        return null
      }
    },
    [apiFunction, wrapApiCall]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

/**
 * Hook para múltiplas chamadas de API simultâneas
 */
export function useMultipleApi<T extends Record<string, any>>(
  apiCalls: Record<keyof T, (...args: any[]) => Promise<ApiResponse<any>>>
) {
  const [states, setStates] = useState<Record<keyof T, UseApiState<any>>>(() => {
    const initialStates = {} as Record<keyof T, UseApiState<any>>
    Object.keys(apiCalls).forEach(key => {
      initialStates[key as keyof T] = {
        data: null,
        loading: false,
        error: null,
      }
    })
    return initialStates
  })

  const { wrapApiCall } = useApiConnectionMonitor()

  const executeAll = useCallback(
    async (args: Record<keyof T, any[]> = {} as Record<keyof T, any[]>) => {
      const keys = Object.keys(apiCalls) as (keyof T)[]
      
      // Marcar todos como loading
      setStates(prev => {
        const newStates = { ...prev }
        keys.forEach(key => {
          newStates[key] = { ...newStates[key], loading: true, error: null }
        })
        return newStates
      })

      // Executar todas as chamadas com monitoramento
      const promises = keys.map(async key => {
        try {
          const response = await wrapApiCall(() => apiCalls[key](...(args[key] || [])))
          return { key, response }
        } catch (error) {
          return { 
            key, 
            response: { 
              success: false, 
              error: error instanceof Error ? error.message : 'Erro na requisição' 
            } 
          }
        }
      })

      const results = await Promise.all(promises)

      // Atualizar estados
      setStates(prev => {
        const newStates = { ...prev }
        results.forEach(({ key, response }) => {
          if (response.success) {
            newStates[key] = {
              data: response.data || null,
              loading: false,
              error: null,
            }
          } else {
            newStates[key] = {
              data: null,
              loading: false,
              error: response.error || 'Erro desconhecido',
            }
          }
        })
        return newStates
      })

      return results
    },
    [apiCalls, wrapApiCall]
  )

  const execute = useCallback(
    async (key: keyof T, ...args: any[]) => {
      setStates(prev => ({
        ...prev,
        [key]: { ...prev[key], loading: true, error: null }
      }))

      try {
        const response = await wrapApiCall(() => apiCalls[key](...args))
        
        if (response.success) {
          setStates(prev => ({
            ...prev,
            [key]: {
              data: response.data || null,
              loading: false,
              error: null,
            }
          }))
          return response.data || null
        } else {
          setStates(prev => ({
            ...prev,
            [key]: {
              data: null,
              loading: false,
              error: response.error || 'Erro desconhecido',
            }
          }))
          return null
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro na requisição'
        setStates(prev => ({
          ...prev,
          [key]: {
            data: null,
            loading: false,
            error: errorMessage,
          }
        }))
        return null
      }
    },
    [apiCalls, wrapApiCall]
  )

  const reset = useCallback((key?: keyof T) => {
    if (key) {
      setStates(prev => ({
        ...prev,
        [key]: {
          data: null,
          loading: false,
          error: null,
        }
      }))
    } else {
      setStates(prev => {
        const newStates = { ...prev }
        Object.keys(newStates).forEach(k => {
          newStates[k as keyof T] = {
            data: null,
            loading: false,
            error: null,
          }
        })
        return newStates
      })
    }
  }, [])

  return {
    states,
    execute,
    executeAll,
    reset,
  }
}

/**
 * Hook utilitário para executar chamadas de API com retry automático
 */
export function useApiWithRetry<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: {
    maxRetries?: number
    retryDelay?: number
    shouldRetry?: (error: any) => boolean
  } = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = (error) => {
      const message = error?.message?.toLowerCase() || ''
      return message.includes('network') || message.includes('timeout') || message.includes('connection')
    }
  } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const { wrapApiCall } = useApiConnectionMonitor()

  const execute = useCallback(
    async (...args: any[]) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      let lastError: any = null
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await wrapApiCall(() => apiFunction(...args))
          
          if (response.success) {
            setState({
              data: response.data || null,
              loading: false,
              error: null,
            })
            return response.data || null
          } else {
            lastError = new Error(response.error || 'Erro desconhecido')
            
            // Se não deve fazer retry ou é a última tentativa
            if (!shouldRetry(lastError) || attempt === maxRetries) {
              break
            }
            
            // Aguardar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
          }
        } catch (error) {
          lastError = error
          
          // Se não deve fazer retry ou é a última tentativa
          if (!shouldRetry(error) || attempt === maxRetries) {
            break
          }
          
          // Aguardar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        }
      }
      
      // Se chegou aqui, todas as tentativas falharam
      const errorMessage = lastError instanceof Error ? lastError.message : 'Erro na requisição'
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })
      return null
    },
    [apiFunction, wrapApiCall, maxRetries, retryDelay, shouldRetry]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
} 