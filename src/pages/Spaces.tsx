import { useState, useMemo } from 'react'
import { useSpaces } from '@/hooks/useSpaces'
import { useClients } from '@/hooks/useClients'
import { useAuthContext } from '@/contexts/AuthContext'
import { SpaceForm } from '@/components/forms/SpaceForm'
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Edit2, 
  Trash2, 
  QrCode,
  Activity,
  Home,
  Trees,
  Building 
} from 'lucide-react'
import type { Space } from '@/types'

export default function Spaces() {
  const { user, userType } = useAuthContext()
  const { 
    filteredSpaces, 
    isLoading, 
    error, 
    createSpace, 
    updateSpace, 
    deleteSpace,
    totalSpaces,
    activeSpaces 
  } = useSpaces()
  const { filteredClients } = useClients()
  
  // Estados
  const [showSpaceForm, setShowSpaceForm] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEnvironment, setFilterEnvironment] = useState<'all' | 'indoor' | 'outdoor' | 'mixed'>('all')

  // Permissões
  const canCreate = userType === 'admin' || userType === 'supervisor'
  const canEdit = userType === 'admin' || userType === 'supervisor'
  const canDelete = userType === 'admin'

  // Filtrar espaços
  const displayedSpaces = useMemo(() => {
    let spaces = filteredSpaces

    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      spaces = spaces.filter(space => 
        space.name.toLowerCase().includes(search) ||
        space.description?.toLowerCase().includes(search)
      )
    }

    // Filtro de ambiente
    if (filterEnvironment !== 'all') {
      spaces = spaces.filter(space => space.environmentType === filterEnvironment)
    }

    return spaces
  }, [filteredSpaces, searchTerm, filterEnvironment])

  // Handlers
  const handleCreateSpace = async (data: any) => {
    try {
      await createSpace(data)
      setShowSpaceForm(false)
    } catch (error) {
      console.error('Erro ao criar espaço:', error)
    }
  }

  const handleUpdateSpace = async (data: any) => {
    if (!editingSpace) return
    
    try {
      await updateSpace(editingSpace.id, data)
      setEditingSpace(null)
      setShowSpaceForm(false)
    } catch (error) {
      console.error('Erro ao atualizar espaço:', error)
    }
  }

  const handleDeleteSpace = async () => {
    if (!deletingSpace) return
    
    try {
      await deleteSpace(deletingSpace.id)
      setDeletingSpace(null)
    } catch (error) {
      console.error('Erro ao excluir espaço:', error)
    }
  }

  // Estados de carregamento e erro
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando espaços...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Espaços</h1>
          <p className="text-gray-600 mt-1">Gerencie os locais de coleta</p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setEditingSpace(null)
              setShowSpaceForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Espaço
          </button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Espaços</p>
              <p className="text-2xl font-bold text-gray-900">{totalSpaces}</p>
            </div>
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Espaços Ativos</p>
              <p className="text-2xl font-bold text-green-600">{activeSpaces}</p>
            </div>
            <Activity className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ambientes Internos</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredSpaces.filter(s => s.environmentType === 'indoor').length}
              </p>
            </div>
            <Home className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Com QR Code</p>
              <p className="text-2xl font-bold text-orange-600">
                {filteredSpaces.filter(s => s.qrCodeEnabled).length}
              </p>
            </div>
            <QrCode className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar espaços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Filtro de Ambiente */}
          <select
            value={filterEnvironment}
            onChange={(e) => setFilterEnvironment(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todos os Ambientes</option>
            <option value="indoor">Interno</option>
            <option value="outdoor">Externo</option>
            <option value="mixed">Misto</option>
          </select>
        </div>
      </div>

      {/* Lista de Espaços */}
      {displayedSpaces.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum espaço encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterEnvironment !== 'all' 
              ? 'Tente ajustar os filtros de busca' 
              : 'Comece criando um novo espaço'}
          </p>
          {canCreate && !searchTerm && filterEnvironment === 'all' && (
            <button
              onClick={() => {
                setEditingSpace(null)
                setShowSpaceForm(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Espaço
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedSpaces.map((space) => {
            // Buscar cliente
            const client = filteredClients.find(c => c.id === space.clientId)
            
            return (
              <div key={space.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header do Card */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {space.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {client?.company_name || 'Cliente não encontrado'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      space.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {space.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 mb-4">
                    {space.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {space.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {space.environmentType && (
                        <div className="flex items-center gap-1">
                          {space.environmentType === 'indoor' && <Home className="w-4 h-4" />}
                          {space.environmentType === 'outdoor' && <Trees className="w-4 h-4" />}
                          {space.environmentType === 'mixed' && <Building className="w-4 h-4" />}
                          <span>
                            {space.environmentType === 'indoor' && 'Interno'}
                            {space.environmentType === 'outdoor' && 'Externo'}
                            {space.environmentType === 'mixed' && 'Misto'}
                          </span>
                        </div>
                      )}
                      
                      {space.areaSize && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{space.areaSize} m²</span>
                        </div>
                      )}
                    </div>

                    {space.qrCodeEnabled && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <QrCode className="w-4 h-4" />
                        <span>QR Code ativo</span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 pt-4 border-t">
                    {space.publicToken && space.qrCodeEnabled && (
                      <QRCodeDisplay
                        spaceId={space.id}
                        spaceName={space.name}
                        publicToken={space.publicToken}
                      />
                    )}
                    
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditingSpace(space)
                          setShowSpaceForm(true)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                    )}
                    
                    {canDelete && (
                      <button
                        onClick={() => setDeletingSpace(space)}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulário de Espaço */}
      {showSpaceForm && (
        <SpaceForm
          isOpen={showSpaceForm}
          onClose={() => {
            setShowSpaceForm(false)
            setEditingSpace(null)
          }}
          onSubmit={editingSpace ? handleUpdateSpace : handleCreateSpace}
          initialData={editingSpace || undefined}
          clients={filteredClients.map(client => ({
            id: client.id,
            company_name: client.company_name,
            cnpj: client.cnpj || undefined,
            contact_person: client.contact_person || '',
            phone: client.phone || undefined,
            address: client.address || undefined,
            status: client.status || 'active'
          }))}
          isLoading={false}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!deletingSpace}
        onCancel={() => setDeletingSpace(null)}
        onConfirm={handleDeleteSpace}
        title="Excluir Espaço"
        message={`Tem certeza que deseja excluir o espaço "${deletingSpace?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </div>
  )
} 