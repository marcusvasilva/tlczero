import { useState, useMemo } from 'react'
import { useSpaces, useClients, usePagination } from '@/hooks'
import { formatDate } from '@/lib/formatters'
import { SpaceForm } from '@/components/forms/SpaceForm'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { 
  Plus, 
  Search, 
  SortAsc, 
  SortDesc, 
  Building2,
  MapPin,
  QrCode,
  Users,
  RefreshCw,
  Download,
  Edit2,
  Trash2,
  Calendar,
  Target,
  Zap,
  Activity,
  X
} from 'lucide-react'
import type { Space, CreateSpaceData, Client } from '@/types'

type SortField = 'name' | 'location' | 'createdAt'
type SortOrder = 'asc' | 'desc'
type FilterClient = 'all' | string // 'all' ou clientId específico
type FilterStatus = 'all' | 'active' | 'inactive'
type FilterAttractive = 'all' | 'moscas' | 'outros'

export function Spaces() {
  // Hooks de gerenciamento de estado
  const {
    filteredSpaces,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createSpace,
    updateSpace,
    deleteSpace,
    searchSpaces,
    sortSpaces,
    clearError,
    totalSpaces,
    activeSpaces,
    // getSpacesByClient
  } = useSpaces()

  const {
    filteredClients: clients,
    activeClients
  } = useClients({ filterActive: true })

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filterClient, setFilterClient] = useState<FilterClient>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterAttractive, setFilterAttractive] = useState<FilterAttractive>('all')
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null)
  const [viewingQRSpace, setViewingQRSpace] = useState<Space | null>(null)
  const [selectedSpaces, setSelectedSpaces] = useState<Set<string>>(new Set())

  // Paginação
  const ITEMS_PER_PAGE = 12 // Grid de 3x4
  const {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    getVisibleItems
  } = usePagination({
    totalItems: filteredSpaces.length,
    itemsPerPage: ITEMS_PER_PAGE
  })

  // Mapa de clientes para lookup rápido
  const clientsMap = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.id] = client
      return acc
    }, {} as Record<string, Client>)
  }, [clients])

  // Dados paginados
  const paginatedSpaces = useMemo(() => {
    return getVisibleItems(filteredSpaces)
  }, [filteredSpaces, getVisibleItems])

  // Estatísticas por tipo de atrativo
  const attractiveStats = useMemo(() => {
    const stats = { moscas: 0, outros: 0 }
    filteredSpaces.forEach(space => {
      if (space.attractiveType === 'moscas') {
        stats.moscas++
      } else {
        stats.outros++
      }
    })
    return stats
  }, [filteredSpaces])

  // Handlers de busca e filtros
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    searchSpaces(term)
    goToPage(1)
  }

  const handleSort = (field: SortField) => {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortOrder(newOrder)
    sortSpaces(field, newOrder)
  }

  const handleFilterClient = (clientId: FilterClient) => {
    setFilterClient(clientId)
    // Implementar filtro no hook se necessário
    goToPage(1)
  }

  const handleFilterStatus = (status: FilterStatus) => {
    setFilterStatus(status)
    // Implementar filtro no hook se necessário
    goToPage(1)
  }

  const handleFilterAttractive = (type: FilterAttractive) => {
    setFilterAttractive(type)
    // Implementar filtro no hook se necessário
    goToPage(1)
  }

  // Handlers de CRUD
  const handleCreate = () => {
    setEditingSpace(null)
    setShowForm(true)
    clearError()
  }

  const handleEdit = (space: Space) => {
    setEditingSpace(space)
    setShowForm(true)
    clearError()
  }

  const handleDelete = (space: Space) => {
    setDeletingSpace(space)
    setShowDeleteDialog(true)
    clearError()
  }

  const handleViewQR = (space: Space) => {
    setViewingQRSpace(space)
    setShowQRDialog(true)
  }

  const handleSubmit = async (data: CreateSpaceData) => {
    try {
      if (editingSpace) {
        await updateSpace(editingSpace.id, data)
      } else {
        await createSpace(data)
      }
      setShowForm(false)
      setEditingSpace(null)
    } catch (err) {
      // Erro já está no estado do hook
    }
  }

  const confirmDelete = async () => {
    if (!deletingSpace) return
    
    try {
      await deleteSpace(deletingSpace.id)
      setShowDeleteDialog(false)
      setDeletingSpace(null)
    } catch (err) {
      // Erro já está no estado do hook
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingSpace(null)
    setShowDeleteDialog(false)
    setDeletingSpace(null)
    setShowQRDialog(false)
    setViewingQRSpace(null)
    clearError()
  }

  // Seleção em massa
  const handleSelectAll = () => {
    if (selectedSpaces.size === paginatedSpaces.length) {
      setSelectedSpaces(new Set())
    } else {
      setSelectedSpaces(new Set(paginatedSpaces.map(space => space.id)))
    }
  }

  const handleSelectSpace = (spaceId: string) => {
    const newSelected = new Set(selectedSpaces)
    if (newSelected.has(spaceId)) {
      newSelected.delete(spaceId)
    } else {
      newSelected.add(spaceId)
    }
    setSelectedSpaces(newSelected)
  }

  // Exportar dados (placeholder)
  const handleExport = () => {
    console.log('Exportar espaços:', selectedSpaces.size > 0 ? selectedSpaces : 'todos')
  }

  // Download de QR Code
  const handleDownloadQR = (space: Space) => {
    // Implementar geração e download do QR code
    console.log('Download QR Code para espaço:', space.name, space.qrCode)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Espaços
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestão completa de espaços e locais de coleta
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Novo Espaço
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total de Espaços
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalSpaces}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Espaços Ativos
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeSpaces}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Atrativos Moscas
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {attractiveStats.moscas || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Clientes Ativos
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeClients}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, localização, cliente ou QR code..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por Cliente */}
            <select
              value={filterClient}
              onChange={(e) => handleFilterClient(e.target.value as FilterClient)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos os Clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            {/* Filtro por Status */}
            <select
              value={filterStatus}
              onChange={(e) => handleFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Apenas Ativos</option>
              <option value="inactive">Apenas Inativos</option>
            </select>

            {/* Filtro por Tipo de Atrativo */}
            <select
              value={filterAttractive}
              onChange={(e) => handleFilterAttractive(e.target.value as FilterAttractive)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="moscas">Moscas</option>
              <option value="outros">Outros</option>
            </select>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Seleção em massa */}
        {selectedSpaces.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedSpaces.size} espaço(s) selecionado(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Exportar Selecionados
                </button>
                <button
                  onClick={() => setSelectedSpaces(new Set())}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Limpar Seleção
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={clearError}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Grid de espaços */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando espaços...</p>
          </div>
        ) : paginatedSpaces.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {searchTerm ? 'Nenhum espaço encontrado' : 'Nenhum espaço cadastrado'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? `Nenhum resultado para "${searchTerm}"`
                : 'Comece criando um novo espaço.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Espaço
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header com seleção em massa */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSpaces.size === paginatedSpaces.length && paginatedSpaces.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selecionar todos
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Nome
                    {sortField === 'name' && (
                      sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Data
                    {sortField === 'createdAt' && (
                      sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Grid de cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedSpaces.map((space) => {
                  const client = clientsMap[space.clientId]
                  
                  return (
                    <div 
                      key={space.id} 
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition-shadow bg-white dark:bg-gray-700"
                    >
                      {/* Header do card */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedSpaces.has(space.id)}
                            onChange={() => handleSelectSpace(space.id)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {space.name}
                          </h3>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          space.active 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {space.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      {/* Informações do espaço */}
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">
                            <strong>Cliente:</strong> {client?.name || 'Cliente não encontrado'}
                          </span>
                        </div>
                        
                        {space.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="truncate">
                              <strong>Local:</strong> {space.location}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <QrCode className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">
                            <strong>QR:</strong> {space.qrCode}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            <strong>Tipo:</strong> {space.attractiveType === 'moscas' ? 'Moscas' : 'Outros'}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            <strong>Instalado:</strong> {formatDate(space.installationDate)}
                          </span>
                        </div>
                        
                        {space.lastMaintenanceDate && (
                          <div className="flex items-center">
                            <Zap className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              <strong>Manutenção:</strong> {formatDate(space.lastMaintenanceDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(space)}
                          className="flex-1 flex items-center justify-center gap-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                          title="Editar espaço"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Editar</span>
                        </button>
                        
                        <button 
                          onClick={() => handleViewQR(space)}
                          className="flex-1 flex items-center justify-center gap-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-3 py-2 rounded text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                          title="Visualizar QR Code"
                        >
                          <QrCode className="h-3 w-3" />
                          <span>QR</span>
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(space)}
                          className="flex items-center justify-center bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-3 py-2 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                          title="Excluir espaço"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span>
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredSpaces.length)} de{' '}
                {filteredSpaces.length} resultados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={previousPage}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === totalPages
                          ? 'bg-green-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de espaço */}
      <SpaceForm
        isOpen={showForm}
        onClose={handleCancel}
        onSubmit={handleSubmit}
        initialData={editingSpace}
        clients={clients.filter(client => client.active)}
        isLoading={isCreating || isUpdating}
      />

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Espaço"
        message={`Tem certeza que deseja excluir o espaço "${deletingSpace?.name}"? Esta ação não pode ser desfeita e removerá todas as coletas associadas.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={handleCancel}
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Diálogo de visualização de QR Code */}
      {showQRDialog && viewingQRSpace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                QR Code - {viewingQRSpace.name}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 text-center">
              {/* Placeholder para QR Code - implementar com biblioteca de QR */}
              <div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    QR Code: {viewingQRSpace.qrCode}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                <p><strong>Espaço:</strong> {viewingQRSpace.name}</p>
                <p><strong>Cliente:</strong> {clientsMap[viewingQRSpace.clientId]?.name}</p>
                <p><strong>Localização:</strong> {viewingQRSpace.location || 'Não informada'}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDownloadQR(viewingQRSpace)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <Download className="h-4 w-4 inline mr-2" />
                  Download
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 