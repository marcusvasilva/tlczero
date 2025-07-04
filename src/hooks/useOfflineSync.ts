import { useState, useEffect, useCallback } from 'react'
import { 
  isOnline, 
  getPendingCollections, 
  storePendingCollection, 
  removePendingCollection,
  syncPendingCollections,
  type PendingCollection 
} from '@/lib/serviceWorker'
import { useCollections } from './useCollections'
import { generateId } from '@/lib/generators'
import { useAuth } from './useAuth'
import { useToast } from '@/contexts/ToastContext'

interface UseOfflineSyncOptions {
  autoSync?: boolean
  syncInterval?: number // em milissegundos
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}) {
  const { autoSync = true, syncInterval = 30000 } = options
  const [online, setOnline] = useState(isOnline())
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingCollection[]>([])
  const { createCollection } = useCollections()
  const { user } = useAuth()
  const { toast } = useToast()

  // Atualizar estado de conexão
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      if (autoSync) {
        syncPending()
      }
    }
    
    const handleOffline = () => {
      setOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [autoSync])

  // Sincronização automática
  useEffect(() => {
    if (!autoSync || !online) return
    
    // Sincronizar imediatamente se houver itens pendentes
    if (pendingItems.length > 0) {
      syncPending()
    }
    
    // Configurar intervalo de sincronização
    const intervalId = setInterval(() => {
      if (online && pendingItems.length > 0) {
        syncPending()
      }
    }, syncInterval)
    
    return () => clearInterval(intervalId)
  }, [autoSync, online, pendingItems, syncInterval])

  // Carregar itens pendentes
  useEffect(() => {
    setPendingItems(getPendingCollections())
  }, [])

  // Função para adicionar uma coleta offline
  const addOfflineCollection = useCallback((data: Omit<PendingCollection, 'id' | 'createdAt' | 'pendingSync'>) => {
    const newCollection: PendingCollection = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      pendingSync: true
    }
    
    storePendingCollection(newCollection)
    setPendingItems(getPendingCollections())
    
    toast({
      title: 'Coleta salva offline',
      description: 'Será sincronizada quando houver conexão',
      variant: 'default'
    })
    
    return newCollection
  }, [toast])

  // Função para sincronizar itens pendentes
  const syncPending = useCallback(async () => {
    if (isSyncing || !online) return
    
    setIsSyncing(true)
    
    try {
      const result = await syncPendingCollections(async (collection) => {
        try {
          // Converter para o formato esperado pela API
          const collectionData = {
            clientId: collection.clientId || "",
            spaceId: collection.spaceId,
            operatorId: collection.operatorId || user?.id || '',
            weight: collection.weight,
            photoUrl: collection.photo,
            observations: collection.notes,
            collectedAt: new Date(collection.createdAt)
          }
          
          await createCollection(collectionData)
          return true
        } catch (error) {
          console.error('Erro ao sincronizar coleta:', error)
          return false
        }
      })
      
      setLastSyncTime(new Date())
      setPendingItems(getPendingCollections())
      
      if (result.success > 0) {
        toast({
          title: 'Sincronização concluída',
          description: `${result.success} coleta(s) sincronizada(s) com sucesso.`,
          variant: 'success'
        })
      }
      
      if (result.failed > 0) {
        toast({
          title: 'Sincronização parcial',
          description: `${result.failed} coleta(s) não puderam ser sincronizadas.`,
          variant: 'warning'
        })
      }
      
      return result
    } catch (error) {
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar os dados.',
        variant: 'destructive'
      })
      return { success: 0, failed: 0 }
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, online, createCollection, user, toast])

  // Função para limpar um item pendente específico
  const clearPendingItem = useCallback((id: string) => {
    removePendingCollection(id)
    setPendingItems(getPendingCollections())
  }, [])

  return {
    online,
    isSyncing,
    lastSyncTime,
    pendingItems,
    addOfflineCollection,
    syncPending,
    clearPendingItem
  }
} 