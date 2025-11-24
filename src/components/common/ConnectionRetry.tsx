import { useState, useEffect } from 'react'
import { RefreshCw, WifiOff, CheckCircle } from 'lucide-react'
import { checkSupabaseConnection } from '@/lib/supabase'
import { cache } from '@/lib/cache'

interface ConnectionRetryProps {
  onRetry?: () => void
  show: boolean
}

export function ConnectionRetry({ onRetry, show }: ConnectionRetryProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!show) {
      setRetryCount(0)
      setIsRetrying(false)
    }
  }, [show])

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    try {
      // Verificar conectividade com Supabase
      const connected = await checkSupabaseConnection()
      
      if (connected) {
        setIsConnected(true)
        // Limpar cache antigo para forçar nova busca
        cache.clear()
        
        // Chamar callback de retry se fornecido
        if (onRetry) {
          await onRetry()
        } else {
          // Recarregar a página se não houver callback
          window.location.reload()
        }
        
        // Esconder após sucesso
        setTimeout(() => {
          setIsConnected(false)
          setRetryCount(0)
        }, 2000)
      } else {
        // Tentar novamente em 3 segundos
        setTimeout(() => {
          if (retryCount < 3) {
            handleRetry()
          } else {
            setIsRetrying(false)
          }
        }, 3000)
      }
    } catch (error) {
      console.error('Erro ao tentar reconectar:', error)
      setIsRetrying(false)
    }
  }

  if (!show && !isConnected) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      show || isConnected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    }`}>
      <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
        isConnected 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {isConnected ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Conexão restaurada!</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">Erro de conexão</p>
              <p className="text-sm opacity-90">
                {isRetrying 
                  ? `Tentando reconectar... (${retryCount}/3)`
                  : 'Não foi possível conectar ao servidor'
                }
              </p>
            </div>
            {!isRetrying && (
              <button
                onClick={handleRetry}
                className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
            )}
            {isRetrying && (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
          </>
        )}
      </div>
    </div>
  )
}