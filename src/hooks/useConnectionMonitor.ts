import { useState, useEffect, useCallback, useRef } from 'react'
import { checkSupabaseConnection, refreshSessionIfNeeded } from '../lib/supabase'

export interface ConnectionStatus {
  isOnline: boolean
  isSupabaseConnected: boolean
  lastChecked: Date | null
  consecutiveFailures: number
  isChecking: boolean
}

export interface UseConnectionMonitorOptions {
  checkInterval?: number
  maxConsecutiveFailures?: number
  onConnectionLost?: () => void
  onConnectionRestored?: () => void
}

export interface UseConnectionMonitorReturn {
  status: ConnectionStatus
  checkConnection: () => Promise<void>
  forceRefresh: () => Promise<void>
  isHealthy: boolean
}

export function useConnectionMonitor(options: UseConnectionMonitorOptions = {}): UseConnectionMonitorReturn {
  const {
    checkInterval = 30000, // 30 segundos
    maxConsecutiveFailures = 3,
    onConnectionLost,
    onConnectionRestored
  } = options

  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    isSupabaseConnected: false,
    lastChecked: null,
    consecutiveFailures: 0,
    isChecking: false
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const lastHealthyRef = useRef(true)

  // Verificar conexão com Supabase
  const checkConnection = useCallback(async () => {
    if (!isMountedRef.current || status.isChecking) return

    setStatus(prev => ({ ...prev, isChecking: true }))

    try {
      // Verificar se está online
      const isOnline = navigator.onLine
      
      // Verificar conexão com Supabase
      const isSupabaseConnected = await checkSupabaseConnection()
      
      const now = new Date()
      const wasConnected = status.isSupabaseConnected

      setStatus(prev => ({
        ...prev,
        isOnline,
        isSupabaseConnected,
        lastChecked: now,
        consecutiveFailures: isSupabaseConnected ? 0 : prev.consecutiveFailures + 1,
        isChecking: false
      }))

      // Callbacks para mudanças de estado
      if (!wasConnected && isSupabaseConnected && onConnectionRestored) {
        onConnectionRestored()
      } else if (wasConnected && !isSupabaseConnected && onConnectionLost) {
        onConnectionLost()
      }

    } catch (error) {
      console.error('Erro ao verificar conexão:', error)
      setStatus(prev => ({
        ...prev,
        consecutiveFailures: prev.consecutiveFailures + 1,
        isChecking: false
      }))
    }
  }, [status.isChecking, status.isSupabaseConnected, onConnectionLost, onConnectionRestored])

  // Forçar refresh da sessão
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Forçando refresh da sessão...')
    try {
      await refreshSessionIfNeeded()
      await checkConnection()
    } catch (error) {
      console.error('Erro ao forçar refresh:', error)
    }
  }, [checkConnection])

  // Verificar se a conexão está saudável
  const isHealthy = status.isOnline && 
                   status.isSupabaseConnected && 
                   status.consecutiveFailures < maxConsecutiveFailures

  // Monitorar mudanças no status de saúde
  useEffect(() => {
    if (lastHealthyRef.current !== isHealthy) {
      console.log(`🔔 Status da conexão mudou: ${isHealthy ? 'Saudável' : 'Problemática'}`)
      lastHealthyRef.current = isHealthy
    }
  }, [isHealthy])

  // Listeners para eventos de conectividade
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão de internet restaurada')
      setStatus(prev => ({ ...prev, isOnline: true }))
      // Verificar conexão com Supabase quando voltar online
      setTimeout(() => checkConnection(), 1000)
    }

    const handleOffline = () => {
      console.log('⚠️ Conexão de internet perdida')
      setStatus(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection])

  // Intervalo de verificação
  useEffect(() => {
    // Verificação inicial
    checkConnection()

    // Configurar intervalo
    intervalRef.current = setInterval(checkConnection, checkInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkConnection, checkInterval])

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    status,
    checkConnection,
    forceRefresh,
    isHealthy
  }
}

// Hook para mostrar notificações de conexão
export function useConnectionNotifications() {
  const { status, isHealthy } = useConnectionMonitor({
    onConnectionLost: () => {
      console.warn('🔴 Conexão com o servidor perdida')
    },
    onConnectionRestored: () => {
      console.log('🟢 Conexão com o servidor restaurada')
    }
  })

  return {
    status,
    isHealthy,
    shouldShowWarning: !isHealthy && status.consecutiveFailures >= 2
  }
} 