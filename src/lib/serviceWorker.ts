import { registerSW } from 'virtual:pwa-register'

// Função para registrar o service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Registra o service worker com atualização automática
    const updateSW = registerSW({
      onNeedRefresh() {
        // Quando há uma nova versão disponível
        if (confirm('Nova versão disponível. Atualizar agora?')) {
          updateSW(true)
        }
      },
      onOfflineReady() {
        console.log('Aplicativo pronto para uso offline')
      },
    })
  }
}

// Função para verificar se o dispositivo está online
export function isOnline(): boolean {
  return navigator.onLine
}

// Função para armazenar dados no cache para uso offline
export function storeDataForOffline<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Erro ao armazenar dados offline:', error)
  }
}

// Função para recuperar dados do cache
export function getOfflineData<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Erro ao recuperar dados offline:', error)
    return null
  }
}

// Interface para coletas pendentes de sincronização
export interface PendingCollection {
  id: string;
  spaceId: string;
  operatorId: string;
  clientId: string;
  weight: number;
  photo?: string; // Base64 da imagem
  notes?: string;
  createdAt: string;
  pendingSync: boolean;
}

// Função para armazenar coletas pendentes de sincronização
export function storePendingCollection(collection: PendingCollection): void {
  const pendingCollections = getPendingCollections()
  pendingCollections.push(collection)
  storeDataForOffline('pendingCollections', pendingCollections)
}

// Função para recuperar coletas pendentes
export function getPendingCollections(): PendingCollection[] {
  return getOfflineData<PendingCollection[]>('pendingCollections') || []
}

// Função para remover uma coleta pendente após sincronização
export function removePendingCollection(id: string): void {
  const pendingCollections = getPendingCollections()
  const updatedCollections = pendingCollections.filter(collection => collection.id !== id)
  storeDataForOffline('pendingCollections', updatedCollections)
}

// Função para sincronizar coletas pendentes quando online
export async function syncPendingCollections(
  syncFunction: (collection: PendingCollection) => Promise<boolean>
): Promise<{ success: number; failed: number }> {
  if (!isOnline()) {
    return { success: 0, failed: 0 }
  }

  const pendingCollections = getPendingCollections()
  let success = 0
  let failed = 0

  for (const collection of pendingCollections) {
    try {
      const result = await syncFunction(collection)
      if (result) {
        removePendingCollection(collection.id)
        success++
      } else {
        failed++
      }
    } catch (error) {
      console.error('Erro ao sincronizar coleta:', error)
      failed++
    }
  }

  return { success, failed }
} 