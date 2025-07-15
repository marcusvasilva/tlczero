import React from 'react'
import { useConnectionNotifications } from '../../hooks/useConnectionMonitor'
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

export const ConnectionStatus: React.FC = () => {
  const { status, isHealthy, shouldShowWarning } = useConnectionNotifications()

  // Não mostrar nada se a conexão estiver saudável
  if (isHealthy) {
    return null
  }

  // Não mostrar no primeiro check ou se não deve mostrar warning
  if (!shouldShowWarning || !status.lastChecked) {
    return null
  }

  const getStatusMessage = () => {
    if (!status.isOnline) {
      return 'Sem conexão com a internet'
    }
    if (!status.isSupabaseConnected) {
      return 'Problema de conexão com o servidor'
    }
    return 'Problemas de conectividade detectados'
  }

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="h-4 w-4" />
    }
    if (!status.isSupabaseConnected) {
      return <AlertTriangle className="h-4 w-4" />
    }
    return <Wifi className="h-4 w-4" />
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg dark:bg-red-900/20 dark:border-red-800">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-red-800 dark:text-red-300 font-medium">
                {getStatusMessage()}
              </span>
              <button
                onClick={handleRefresh}
                className="ml-2 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Tentar novamente</span>
              </button>
            </div>
            {status.consecutiveFailures > 0 && (
              <div className="text-xs mt-1 text-red-600 dark:text-red-400 opacity-75">
                {status.consecutiveFailures} tentativa(s) falharam
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente mais simples para mostrar apenas o status
export const ConnectionIndicator: React.FC = () => {
  const { status, isHealthy } = useConnectionNotifications()

  if (isHealthy) {
    return (
      <div className="flex items-center space-x-1 text-green-600">
        <Wifi className="h-4 w-4" />
        <span className="text-xs">Online</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1 text-red-600">
      {!status.isOnline ? (
        <WifiOff className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <span className="text-xs">
        {!status.isOnline ? 'Offline' : 'Instável'}
      </span>
    </div>
  )
}

// Hook para usar em outros componentes
export function useConnectionStatus() {
  const { status, isHealthy } = useConnectionNotifications()
  
  return {
    isOnline: status.isOnline,
    isSupabaseConnected: status.isSupabaseConnected,
    isHealthy,
    consecutiveFailures: status.consecutiveFailures,
    lastChecked: status.lastChecked
  }
} 