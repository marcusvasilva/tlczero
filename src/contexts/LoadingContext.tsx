import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

interface LoadingState {
  isLoading: boolean
  message?: string
  operations: Set<string>
}

interface LoadingContextType {
  isLoading: boolean
  message?: string
  startLoading: (operation: string, message?: string) => void
  stopLoading: (operation: string) => void
  stopAllLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
  children: React.ReactNode
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: undefined,
    operations: new Set()
  })

  // Ref para manter mensagens por operação
  const messagesRef = useRef<Map<string, string>>(new Map())

  const startLoading = useCallback((operation: string, message?: string) => {
    if (message) {
      messagesRef.current.set(operation, message)
    }

    setLoadingState(prev => {
      const newOperations = new Set(prev.operations)
      newOperations.add(operation)
      
      // Usar a mensagem mais recente ou a primeira disponível
      const currentMessage = message || 
        messagesRef.current.get(operation) || 
        Array.from(messagesRef.current.values())[0] ||
        'Carregando...'

      return {
        isLoading: true,
        message: currentMessage,
        operations: newOperations
      }
    })
  }, [])

  const stopLoading = useCallback((operation: string) => {
    setLoadingState(prev => {
      const newOperations = new Set(prev.operations)
      newOperations.delete(operation)
      messagesRef.current.delete(operation)

      // Se não há mais operações, parar o loading
      if (newOperations.size === 0) {
        return {
          isLoading: false,
          message: undefined,
          operations: newOperations
        }
      }

      // Caso contrário, usar a primeira mensagem disponível
      const remainingMessage = Array.from(messagesRef.current.values())[0] || 'Carregando...'

      return {
        isLoading: true,
        message: remainingMessage,
        operations: newOperations
      }
    })
  }, [])

  const stopAllLoading = useCallback(() => {
    messagesRef.current.clear()
    setLoadingState({
      isLoading: false,
      message: undefined,
      operations: new Set()
    })
  }, [])

  const contextValue: LoadingContextType = {
    isLoading: loadingState.isLoading,
    message: loadingState.message,
    startLoading,
    stopLoading,
    stopAllLoading
  }

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  )
}

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading deve ser usado dentro de um LoadingProvider')
  }
  return context
}

// Hook para gerenciar loading de operações específicas
export const useOperationLoading = (operationName: string) => {
  const { startLoading, stopLoading } = useLoading()

  const start = useCallback((message?: string) => {
    startLoading(operationName, message)
  }, [operationName, startLoading])

  const stop = useCallback(() => {
    stopLoading(operationName)
  }, [operationName, stopLoading])

  return { start, stop }
}

// Hook para operações async com loading automático
export const useAsyncOperation = (operationName: string) => {
  const { start, stop } = useOperationLoading(operationName)

  const execute = useCallback(
    async (operation: () => Promise<any>, message?: string): Promise<any> => {
      try {
        start(message)
        const result = await operation()
        return result
      } finally {
        stop()
      }
    },
    [start, stop]
  )

  return execute
} 