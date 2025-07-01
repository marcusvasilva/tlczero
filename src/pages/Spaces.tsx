import { useState, useMemo } from 'react'
import { Search, Plus, Edit, QrCode, Trash2, Building2, MapPin } from 'lucide-react'
import { mockSpaces } from '@/data/mockSpaces'
import { mockClients } from '@/data/mockClients'
import { formatDate } from '@/lib/formatters'
import { useLocalStorage } from '@/hooks'
import { SpaceForm, ConfirmDialog } from '@/components'
import type { Space, CreateSpaceData, Client } from '@/types'

export function Spaces() {
  const [spaces, setSpaces] = useLocalStorage<Space[]>('tlc-spaces', mockSpaces)
  const [clients] = useLocalStorage<Client[]>('tlc-clients', mockClients)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Criar um mapa de clientes para lookup rápido
  const clientsMap = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.id] = client
      return acc
    }, {} as Record<string, Client>)
  }, [clients])

  // Filtrar espaços baseado na busca
  const filteredSpaces = useMemo(() => {
    if (!searchTerm) return spaces

    return spaces.filter(space => {
      const client = clientsMap[space.clientId]
      return (
        space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        space.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        space.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [spaces, searchTerm, clientsMap])

  // Função para criar espaço
  const handleCreateSpace = async (data: CreateSpaceData) => {
    setIsLoading(true)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newSpace: Space = {
        id: Date.now().toString(),
        ...data,
        qrCode: `QR${Date.now()}`,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setSpaces(prev => [...prev, newSpace])
      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao criar espaço:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para atualizar espaço
  const handleUpdateSpace = async (data: CreateSpaceData) => {
    if (!editingSpace) return
    
    setIsLoading(true)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSpaces(prev => prev.map(space => 
        space.id === editingSpace.id 
          ? { ...space, ...data, updatedAt: new Date() }
          : space
      ))
      
      setIsFormOpen(false)
      setEditingSpace(null)
    } catch (error) {
      console.error('Erro ao atualizar espaço:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para excluir espaço
  const handleDeleteSpace = async () => {
    if (!deletingSpace) return
    
    setIsLoading(true)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSpaces(prev => prev.filter(space => space.id !== deletingSpace.id))
      setDeletingSpace(null)
    } catch (error) {
      console.error('Erro ao excluir espaço:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para abrir formulário de edição
  const handleEdit = (space: Space) => {
    setEditingSpace(space)
    setIsFormOpen(true)
  }

  // Função para abrir formulário de criação
  const handleCreate = () => {
    setEditingSpace(null)
    setIsFormOpen(true)
  }

  // Função para fechar formulário
  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingSpace(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Espaços</h1>
          <p className="text-gray-600">
            Gestão de espaços e locais de coleta
          </p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Espaço</span>
        </button>
      </div>

      {/* Busca e Estatísticas */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar espaços, clientes, localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Total: <strong>{filteredSpaces.length}</strong></span>
            <span>Ativos: <strong>{filteredSpaces.filter(s => s.active).length}</strong></span>
          </div>
        </div>

        {/* Lista de Espaços */}
        {filteredSpaces.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum espaço encontrado' : 'Nenhum espaço cadastrado'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Tente buscar com outros termos ou limpe o filtro.'
                : 'Comece criando o primeiro espaço para monitoramento.'
              }
            </p>
            {!searchTerm && (
              <button 
                onClick={handleCreate}
                className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeiro Espaço</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpaces.map((space) => {
              const client = clientsMap[space.clientId]
              
              return (
                <div key={space.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{space.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      space.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {space.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                      <span><strong>Cliente:</strong> {client?.name || 'Cliente não encontrado'}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span><strong>Local:</strong> {space.location || 'Não informado'}</span>
                    </div>
                    <p><strong>QR Code:</strong> {space.qrCode}</p>
                    <p><strong>Tipo:</strong> {space.attractiveType === 'moscas' ? 'Moscas' : 'Outros'}</p>
                    <p><strong>Instalado:</strong> {formatDate(space.installationDate)}</p>
                    {space.lastMaintenanceDate && (
                      <p><strong>Manutenção:</strong> {formatDate(space.lastMaintenanceDate)}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(space)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center space-x-1 bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200 transition-colors">
                      <QrCode className="w-3 h-3" />
                      <span>QR</span>
                    </button>
                    <button 
                      onClick={() => setDeletingSpace(space)}
                      className="flex items-center justify-center bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Formulário de Espaço */}
      <SpaceForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingSpace ? handleUpdateSpace : handleCreateSpace}
        initialData={editingSpace}
        clients={clients.filter(client => client.active)}
        isLoading={isLoading}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!deletingSpace}
        onCancel={() => setDeletingSpace(null)}
        onConfirm={handleDeleteSpace}
        title="Excluir Espaço"
        message={`Tem certeza que deseja excluir o espaço "${deletingSpace?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  )
} 