import { useState, useEffect, useCallback, useRef } from 'react'
import { checkSupabaseConnection } from '../lib/supabase'

export interface ConnectionStatus {
  isOnline: boolean
  isSupabaseConnected: boolean
  lastChecked: Date | null
  consecutiveFailures: number
  isChecking: boolean
  lastApiError?: Date | null // Nova propriedade para rastrear erros de API
}

export interface UseConnectionMonitorOptions {
  checkInterval?: number
  maxConsecutiveFailures?: number
  onConnectionLost?: () => void
  onConnectionRestored?: () => void
  enablePassiveMonitoring?: boolean
}

export interface UseConnectionMonitorReturn {
  status: ConnectionStatus
  checkConnection: () => Promise<void>
  forceRefresh: () => Promise<void>
  isHealthy: boolean
  reportApiError: () => void // Nova função para reportar erros de API
}

// Singleton para gerenciar o estado global de conectividade
class ConnectionManager {
  private static instance: ConnectionManager
  private listeners: Set<(status: ConnectionStatus) => void> = new Set()
  private currentStatus: ConnectionStatus = {
    isOnline: navigator.onLine,
    isSupabaseConnected: false,
    lastChecked: null,
    consecutiveFailures: 0,
    isChecking: false,
    lastApiError: null
  }
  private lastCheckTime = 0
  private isChecking = false

  static getInstance() {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  subscribe(listener: (status: ConnectionStatus) => void) {
    this.listeners.add(listener)
    // Enviar status atual imediatamente
    listener(this.currentStatus)
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentStatus))
  }

  private updateStatus(updates: Partial<ConnectionStatus>) {
    this.currentStatus = { ...this.currentStatus, ...updates }
    this.notifyListeners()
  }

  async checkConnection(force = false): Promise<boolean> {
    const now = Date.now()
    
    // Evitar verificações muito frequentes
    if (!force && now - this.lastCheckTime < 5000) {
      return this.currentStatus.isSupabaseConnected
    }

    if (this.isChecking) {
      return this.currentStatus.isSupabaseConnected
    }

    this.isChecking = true
    this.lastCheckTime = now
    this.updateStatus({ isChecking: true })

    try {
      const isOnline = navigator.onLine
      
      if (!isOnline) {
        this.updateStatus({
          isOnline: false,
          isSupabaseConnected: false,
          lastChecked: new Date(),
          consecutiveFailures: this.currentStatus.consecutiveFailures + 1,
          isChecking: false
        })
        return false
      }

      const isSupabaseConnected = await checkSupabaseConnection()
      const newFailures = isSupabaseConnected ? 0 : this.currentStatus.consecutiveFailures + 1

      this.updateStatus({
        isOnline,
        isSupabaseConnected,
        lastChecked: new Date(),
        consecutiveFailures: newFailures,
        isChecking: false
      })

      return isSupabaseConnected
    } catch (error) {
      console.error('Erro ao verificar conexão:', error)
      this.updateStatus({
        consecutiveFailures: this.currentStatus.consecutiveFailures + 1,
        isChecking: false
      })
      return false
    } finally {
      this.isChecking = false
    }
  }

  async reportApiError() {
    this.updateStatus({
      lastApiError: new Date(),
      consecutiveFailures: this.currentStatus.consecutiveFailures + 1
    })
    
    console.log('⚠️ Erro de API reportado, tentando recuperar...')
    
    // Se tiver muitos erros consecutivos, apenas logar
    if (this.currentStatus.consecutiveFailures >= 3) {
      console.log('⚠️ Muitos erros consecutivos detectados')
      // O Supabase gerencia o refresh automaticamente
    }
    
    // Verificar conexão após erro de API
    setTimeout(() => {
      this.checkConnection(true)
    }, 1000)
  }

  getStatus() {
    return this.currentStatus
  }
}

const connectionManager = ConnectionManager.getInstance()

export function useConnectionMonitor(options: UseConnectionMonitorOptions = {}): UseConnectionMonitorReturn {
  const {
    checkInterval = 60000,
    maxConsecutiveFailures = 5,
    onConnectionLost,
    onConnectionRestored,
    enablePassiveMonitoring = true
  } = options

  const [status, setStatus] = useState<ConnectionStatus>(connectionManager.getStatus())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastHealthyRef = useRef(true)
  const isActivelyUsing = useRef(false)

  // Detectar uso ativo da aplicação
  useEffect(() => {
    const handleUserActivity = () => {
      isActivelyUsing.current = true
      
      // Se há problemas de conexão e o usuário está ativo, verificar
      if (!status.isSupabaseConnected && Date.now() - (status.lastChecked?.getTime() || 0) > 10000) {
        connectionManager.checkConnection(true)
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Reset flag de uso ativo periodicamente
    const activityTimer = setInterval(() => {
      isActivelyUsing.current = false
    }, 30000)

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      clearInterval(activityTimer)
    }
  }, [status.isSupabaseConnected, status.lastChecked])

  // Subscrever ao manager global
  useEffect(() => {
    return connectionManager.subscribe(setStatus)
  }, [])

  // Verificação manual
  const checkConnection = useCallback(async () => {
    await connectionManager.checkConnection(true)
  }, [])

  // Forçar verificação de conexão
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Forçando verificação de conexão...')
    await connectionManager.checkConnection(true)
  }, [])

  // Reportar erro de API
  const reportApiError = useCallback(() => {
    connectionManager.reportApiError()
  }, [])

  // Verificar se a conexão está saudável
  const isHealthy = status.isOnline && 
                   status.isSupabaseConnected && 
                   status.consecutiveFailures < maxConsecutiveFailures

  // Monitorar mudanças no status de saúde
  useEffect(() => {
    if (lastHealthyRef.current !== isHealthy) {
      if (!isHealthy && onConnectionLost) {
        onConnectionLost()
      } else if (isHealthy && !lastHealthyRef.current && onConnectionRestored) {
        onConnectionRestored()
      }
      lastHealthyRef.current = isHealthy
    }
  }, [isHealthy, onConnectionLost, onConnectionRestored])

  // Listeners para eventos de conectividade
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão de internet restaurada')
      setTimeout(() => connectionManager.checkConnection(true), 2000)
    }

    const handleOffline = () => {
      console.log('⚠️ Conexão de internet perdida')
      // O manager será atualizado na próxima verificação
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Intervalo de verificação inteligente
  useEffect(() => {
    if (!enablePassiveMonitoring) return

    // Verificação inicial
    connectionManager.checkConnection()

    // Configurar intervalo adaptativo
    const setupInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      let adaptiveInterval = checkInterval
      
      if (!status.isSupabaseConnected) {
        adaptiveInterval = Math.max(30000, checkInterval / 2)
      } else if (status.consecutiveFailures === 0) {
        adaptiveInterval = Math.min(120000, checkInterval * 1.5)
      }

      intervalRef.current = setInterval(() => {
        // Verificar se há necessidade de verificação
        const needsCheck = 
          isActivelyUsing.current || 
          !status.isSupabaseConnected || 
          status.consecutiveFailures > 0 ||
          (status.lastApiError && Date.now() - status.lastApiError.getTime() < 60000)

        if (needsCheck) {
          connectionManager.checkConnection()
        }
      }, adaptiveInterval)
    }

    setupInterval()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkInterval, enablePassiveMonitoring, status.isSupabaseConnected, status.consecutiveFailures, status.lastApiError])

  return {
    status,
    checkConnection,
    forceRefresh,
    isHealthy,
    reportApiError
  }
}

// Hook simplificado para notificações de conexão
export function useConnectionNotifications() {
  const { status, isHealthy, reportApiError } = useConnectionMonitor({
    enablePassiveMonitoring: true,
    checkInterval: 60000,
    maxConsecutiveFailures: 5,
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
    reportApiError,
    shouldShowWarning: !isHealthy && status.consecutiveFailures >= 3
  }
}

// Hook para integrar com APIs
export function useApiConnectionMonitor() {
  const { reportApiError } = useConnectionNotifications()
  
  return {
    reportApiError,
    // Função para wrapper de chamadas de API
    wrapApiCall: async <T>(apiCall: () => Promise<T>): Promise<T> => {
      try {
        return await apiCall()
      } catch (error) {
        // Reportar erro se parece ser de conectividade
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as any).message?.toLowerCase() || ''
          if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
            reportApiError()
          }
        }
        throw error
      }
    }
  }
} 