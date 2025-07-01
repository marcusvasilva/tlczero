import { useState, useCallback } from 'react'
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
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>
): UseApiState<T> & UseApiActions<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        const response = await apiFunction(...args)
        
        if (response.success) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          })
          return response.data
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
    [apiFunction]
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

      // Executar todas as chamadas
      const promises = keys.map(async key => {
        try {
          const response = await apiCalls[key](...(args[key] || []))
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
              data: response.data,
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
    [apiCalls]
  )

  const execute = useCallback(
    async (key: keyof T, ...args: any[]) => {
      setStates(prev => ({
        ...prev,
        [key]: { ...prev[key], loading: true, error: null }
      }))

      try {
        const response = await apiCalls[key](...args)
        
        if (response.success) {
          setStates(prev => ({
            ...prev,
            [key]: {
              data: response.data,
              loading: false,
              error: null,
            }
          }))
          return response.data
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
    [apiCalls]
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