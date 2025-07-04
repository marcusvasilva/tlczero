import { useState } from 'react'
import { ToastDemo } from '@/components/common/ToastDemo'
import { useOfflineSync } from '@/hooks'

export default function PwaDemo() {
  const { online, pendingItems, addOfflineCollection, syncPending, isSyncing } = useOfflineSync()
  const [weight, setWeight] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')

  const handleAddOfflineCollection = () => {
    if (weight <= 0) return

    addOfflineCollection({
      clientId: "demo-client-1",
      spaceId: 'demo-space-1',
      operatorId: 'demo-operator-1',
      weight,
      notes
    })

    // Limpar formulário
    setWeight(0)
    setNotes('')
  }

  return (
    <div className="space-y-8 p-4">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">Demonstração PWA</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Esta página demonstra as funcionalidades do Progressive Web App implementadas no TLC Zero.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Status de Conexão</h2>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{online ? 'Online' : 'Offline'}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Para testar o modo offline, desative sua conexão de rede ou use as ferramentas de desenvolvedor do navegador para simular o modo offline.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Coleta Offline</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Peso (g)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <button
                onClick={handleAddOfflineCollection}
                disabled={weight <= 0}
                className={`w-full py-2 px-4 rounded ${
                  weight <= 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Salvar Coleta Offline
              </button>
            </div>
          </div>

          <ToastDemo />
        </div>

        <div className="space-y-6">
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Sincronização</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Coletas pendentes:</span>
                <span className="font-semibold">{pendingItems.length}</span>
              </div>
              {pendingItems.length > 0 && (
                <button
                  onClick={() => syncPending()}
                  disabled={!online || isSyncing}
                  className={`w-full py-2 px-4 rounded ${
                    !online || isSyncing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Coletas Pendentes</h2>
            {pendingItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">Nenhuma coleta pendente</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {pendingItems.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <div className="flex justify-between">
                      <span className="font-medium">Peso: {item.weight}g</span>
                      <span className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Instalação do PWA</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Para instalar o TLC Zero como um aplicativo:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>No Chrome/Edge: clique no ícone de instalação na barra de endereço</li>
              <li>No Safari (iOS): use o botão "Compartilhar" e selecione "Adicionar à Tela de Início"</li>
              <li>Ou aguarde o prompt de instalação automático</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
} 