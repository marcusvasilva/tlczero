import React, { useCallback } from 'react'
import { useConnectionNotifications } from '../../hooks/useConnectionMonitor'
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react'

export const ConnectionStatus: React.FC = () => {
  const { status, isHealthy, shouldShowWarning } = useConnectionNotifications()

  // Função para tentar reconectar
  const handleReconnect = useCallback(() => {
    console.log('🔄 Tentando reconectar...')
    
    // Recarregar a página como última opção
    window.location.reload()
  }, [])

  // Não mostrar nada se a conexão estiver saudável
  if (isHealthy) {
    return null
  }

  // Só mostrar warning se realmente necessário
  if (!shouldShowWarning || !status.lastChecked) {
    return null
  }

  // Não mostrar para falhas únicas - pode ser instabilidade momentânea
  if (status.consecutiveFailures < 3) {
    return null
  }

  const getStatusMessage = () => {
    if (!status.isOnline) {
      return 'Sem conexão com a internet'
    }
    if (!status.isSupabaseConnected) {
      if (status.consecutiveFailures >= 5) {
        return 'Problema persistente de conexão com o servidor'
      }
      return 'Problema temporário de conexão com o servidor'
    }
    return 'Problemas de conectividade detectados'
  }

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }
    if (!status.isSupabaseConnected) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
    return <Wifi className="h-4 w-4 text-yellow-500" />
  }

  const getStatusColor = () => {
    if (!status.isOnline) {
      return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    }
    if (status.consecutiveFailures >= 5) {
      return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    }
    return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
  }

  const getTextColor = () => {
    if (!status.isOnline || status.consecutiveFailures >= 5) {
      return 'text-red-800 dark:text-red-300'
    }
    return 'text-orange-800 dark:text-orange-300'
  }

  const getButtonColor = () => {
    if (!status.isOnline || status.consecutiveFailures >= 5) {
      return 'bg-red-600 hover:bg-red-700'
    }
    return 'bg-orange-600 hover:bg-orange-700'
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className={`${getStatusColor()} rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 duration-300`}>
        <div className="flex items-start space-x-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className={`${getTextColor()} font-medium text-sm`}>
                {getStatusMessage()}
              </span>
              <button
                onClick={handleReconnect}
                className={`${getButtonColor()} text-white text-xs px-3 py-1 rounded-md flex items-center space-x-1 hover:scale-105 transition-transform`}
                title="Tentar reconectar"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reconectar</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between text-xs opacity-75">
              <span className={getTextColor()}>
                {status.consecutiveFailures} tentativa{status.consecutiveFailures !== 1 ? 's' : ''} falharam
              </span>
              {status.lastChecked && (
                <span className={`${getTextColor()} opacity-60`}>
                  {new Date(status.lastChecked).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            {/* Dicas baseadas no tipo de problema */}
            {!status.isOnline && (
              <div className={`${getTextColor()} text-xs mt-2 opacity-80`}>
                💡 Verifique sua conexão com a internet
              </div>
            )}
            
            {status.isOnline && !status.isSupabaseConnected && status.consecutiveFailures >= 5 && (
              <div className={`${getTextColor()} text-xs mt-2 opacity-80`}>
                💡 Possível problema no servidor. Tente novamente em alguns minutos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente minimalista para mostrar apenas o status na interface
export const ConnectionIndicator: React.FC = () => {
  const { status, isHealthy } = useConnectionNotifications()

  if (isHealthy) {
    return (
      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Online</span>
      </div>
    )
  }

  if (!status.isOnline) {
    return (
      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
        <WifiOff className="h-4 w-4" />
        <span className="text-xs font-medium">Offline</span>
      </div>
    )
  }

  if (!status.isSupabaseConnected) {
    return (
      <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-medium">
          Instável ({status.consecutiveFailures})
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
      <Wifi className="h-4 w-4" />
      <span className="text-xs font-medium">Verificando...</span>
    </div>
  )
}

// Hook otimizado para usar em outros componentes
export function useConnectionStatus() {
  const { status, isHealthy } = useConnectionNotifications()
  
  return {
    isOnline: status.isOnline,
    isSupabaseConnected: status.isSupabaseConnected,
    isHealthy,
    consecutiveFailures: status.consecutiveFailures,
    lastChecked: status.lastChecked,
    // Indica se há um problema que precisa de atenção
    needsAttention: !isHealthy && status.consecutiveFailures >= 3,
    // Indica se é um problema crítico
    isCritical: !isHealthy && status.consecutiveFailures >= 5
  }
} 