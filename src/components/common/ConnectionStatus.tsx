import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useOfflineSync } from '@/hooks'

export function ConnectionStatus() {
  const { online, pendingItems, syncPending, isSyncing } = useOfflineSync()
  const [showStatus, setShowStatus] = useState(false)

  // Mostrar status quando estiver offline ou houver itens pendentes
  useEffect(() => {
    if (!online || pendingItems.length > 0) {
      setShowStatus(true)
    } else {
      // Esconder após um tempo quando voltar online e não houver itens pendentes
      const timer = setTimeout(() => {
        setShowStatus(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [online, pendingItems])

  if (!showStatus) return null

  return (
    <div className={`fixed bottom-4 left-4 z-50 rounded-lg p-3 shadow-lg flex items-center gap-2 ${
      online ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
      'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
    }`}>
      {online ? (
        <Wifi className="h-5 w-5 text-green-500 dark:text-green-400" />
      ) : (
        <WifiOff className="h-5 w-5 text-red-500 dark:text-red-400" />
      )}
      
      <div className="text-sm">
        {!online && (
          <p className="font-medium text-red-700 dark:text-red-300">
            Você está offline
          </p>
        )}
        
        {online && pendingItems.length > 0 && (
          <div className="flex flex-col">
            <p className="font-medium text-green-700 dark:text-green-300">
              Online
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {pendingItems.length} {pendingItems.length === 1 ? 'coleta pendente' : 'coletas pendentes'}
            </p>
          </div>
        )}
        
        {online && pendingItems.length > 0 && !isSyncing && (
          <button 
            onClick={() => syncPending()}
            className="mt-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
          >
            Sincronizar agora
          </button>
        )}
        
        {isSyncing && (
          <div className="flex items-center gap-1 mt-1">
            <div className="animate-spin h-3 w-3 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <span className="text-xs text-green-600 dark:text-green-400">Sincronizando...</span>
          </div>
        )}
      </div>
    </div>
  )
} 