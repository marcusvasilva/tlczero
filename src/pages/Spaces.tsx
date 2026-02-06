import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSpaces } from '@/hooks/useSpaces'
import { useClients } from '@/hooks/useClients'
import { useAuthContext } from '@/contexts/AuthContext'
import { SpaceForm } from '@/components/forms/SpaceForm'
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { Button } from '@/components/ui/button'
import type { Account } from '@/types/client'
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
import type { Space, UpdateSpaceData } from '@/types'

export default function Spaces() {
  const { user, userType } = useAuthContext()
  const [searchParams, setSearchParams] = useSearchParams()
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

  // Auto-open create form from FAB navigation
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowSpaceForm(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEnvironment, setFilterEnvironment] = useState<'all' | 'indoor' | 'outdoor' | 'mixed'>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [togglingSpaceId, setTogglingSpaceId] = useState<string | null>(null)

  // Permissões
  const canCreate = userType === 'admin' || userType === 'supervisor'
  const canEdit = userType === 'admin' || userType === 'supervisor'
  const canDelete = userType === 'admin' || userType === 'supervisor'
  const canToggleStatus = userType === 'admin' || userType === 'supervisor'

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

    // Filtro de cliente
    if (filterClient !== 'all') {
      spaces = spaces.filter(space => space.clientId === filterClient)
    }

    return spaces
  }, [filteredSpaces, searchTerm, filterEnvironment, filterClient])

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

  const handleToggleSpaceStatus = async (space: Space) => {
    if (!canToggleStatus) return
    
    setTogglingSpaceId(space.id)
    
    try {
      const updateData: UpdateSpaceData = { active: !space.active }
      await updateSpace(space.id, updateData)
    } catch (error) {
      console.error('Erro ao alterar status do espaço:', error)
    } finally {
      setTogglingSpaceId(null)
    }
  }

  // Estados de carregamento e erro
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h2>
          <p className="text-gray-600 dark:text-gray-400">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando espaços...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Espaços</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os locais de coleta</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingSpace(null)
              setShowSpaceForm(true)
            }}
          >
            <Plus className="w-5 h-5" />
            Novo Espaço
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Espaços</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSpaces}</p>
            </div>
            <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Espaços Ativos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeSpaces}</p>
            </div>
            <Activity className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ambientes Internos</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {filteredSpaces.filter(s => s.environmentType === 'indoor').length}
              </p>
            </div>
            <Home className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Com QR Code</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {filteredSpaces.filter(s => s.qrCodeEnabled).length}
              </p>
            </div>
            <QrCode className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filtro de Cliente */}
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todas as Empresas</option>
            {filteredClients.map((client: Account) => (
              <option key={client.id} value={client.id}>
                {client.company_name}
              </option>
            ))}
          </select>

          {/* Filtro de Ambiente */}
          <select
            value={filterEnvironment}
            onChange={(e) => setFilterEnvironment(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-gray-700">
          <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum espaço encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || filterEnvironment !== 'all' || filterClient !== 'all'
              ? 'Tente ajustar os filtros de busca' 
              : 'Comece criando um novo espaço'}
          </p>
          {canCreate && !searchTerm && filterEnvironment === 'all' && filterClient === 'all' && (
            <Button
              onClick={() => {
                setEditingSpace(null)
                setShowSpaceForm(true)
              }}
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Espaço
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedSpaces.map((space) => {
            // Buscar cliente
            const client = filteredClients.find((c: Account) => c.id === space.clientId)
            
            return (
              <div key={space.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  {/* Header do Card */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {space.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client?.company_name || 'Cliente não encontrado'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        space.active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {space.active ? 'Ativo' : 'Inativo'}
                      </span>
                      {canToggleStatus && (
                        <ToggleSwitch
                          checked={space.active}
                          onChange={() => handleToggleSpaceStatus(space)}
                          disabled={togglingSpaceId === space.id}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 mb-4">
                    {space.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {space.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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
                      <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <QrCode className="w-4 h-4" />
                        <span>QR Code ativo</span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {space.publicToken && space.qrCodeEnabled && (
                      <QRCodeDisplay
                        spaceId={space.id}
                        spaceName={space.name}
                        publicToken={space.publicToken}
                      />
                    )}
                    
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSpace(space)
                          setShowSpaceForm(true)
                        }}
                        className="flex-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingSpace(space)}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
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
          clients={filteredClients.map((client: Account) => ({
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