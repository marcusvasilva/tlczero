import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import { useApiConnectionMonitor } from '@/hooks/useConnectionMonitor'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export function ConnectionAlert() {
  const { status, isHealthy, forceRefresh } = useApiConnectionMonitor()
  const [isReconnecting, setIsReconnecting] = useState(false)
  
  // Verificar se status está disponível
  if (!status) {
    return null
  }
  
  // Não mostrar se está tudo bem
  if (isHealthy && status.consecutiveFailures === 0) {
    return null
  }
  
  const handleReconnect = async () => {
    setIsReconnecting(true)
    try {
      // Apenas verificar sessão - o Supabase faz refresh automático
      await supabase.auth.getSession()
      // Forçar refresh da conexão
      await forceRefresh()
    } catch (error) {
      console.error('Erro ao reconectar:', error)
    } finally {
      setIsReconnecting(false)
    }
  }
  
  // Se está sem internet
  if (!status.isOnline) {
    return (
      <div className="fixed bottom-4 right-4 w-auto max-w-md z-50 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-4">
        <div className="flex items-start gap-3">
          <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Sem conexão com a internet. Verifique sua rede.
          </p>
        </div>
      </div>
    )
  }
  
  // Se está com problemas de conexão com o Supabase
  if (!status.isSupabaseConnected || status.consecutiveFailures > 2) {
    return (
      <div className="fixed bottom-4 right-4 w-auto max-w-md z-50 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200 mb-2">
              Problemas de conexão com o servidor.
            </p>
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isReconnecting ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Reconectando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reconectar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return null
}