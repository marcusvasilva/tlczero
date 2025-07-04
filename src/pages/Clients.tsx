import { useState, useMemo } from 'react'
import { useClients, usePagination } from '@/hooks'
import { formatPhone, formatCNPJ, formatDateTime } from '@/lib/formatters'
import { ClientForm } from '@/components/forms/ClientForm'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Download,
  Edit2,
  Trash2
} from 'lucide-react'
import type { Client, CreateClientData } from '@/types'

type SortField = 'name' | 'email' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export function Clients() {
  // Hooks de gerenciamento de estado
  const {
    filteredClients,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    sortClients,
    clearError,
    totalClients,
    activeClients,
    inactiveClients
  } = useClients({ filterActive: true })

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())

  // Paginação
  const ITEMS_PER_PAGE = 10
  const {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    getVisibleItems
  } = usePagination({
    totalItems: filteredClients.length,
    itemsPerPage: ITEMS_PER_PAGE
  })

  // Dados paginados
  const paginatedClients = useMemo(() => {
    return getVisibleItems(filteredClients)
  }, [filteredClients, getVisibleItems])

  // Handlers de busca e filtros
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    searchClients(term)
    goToPage(1) // Volta para primeira página ao buscar
  }

  const handleSort = (field: SortField) => {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortOrder(newOrder)
    sortClients(field, newOrder)
  }

  const handleFilterToggle = () => {
    setShowActiveOnly(!showActiveOnly)
    // Aqui você implementaria o filtro no hook useClients
  }

  // Handlers de CRUD
  const handleCreate = () => {
    setEditingClient(null)
    setShowForm(true)
    clearError()
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setShowForm(true)
    clearError()
  }

  const handleDelete = (client: Client) => {
    setDeletingClient(client)
    setShowDeleteDialog(true)
    clearError()
  }

  const handleSubmit = async (data: Partial<Client>) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data as CreateClientData)
      } else {
        await createClient(data as CreateClientData)
      }
      setShowForm(false)
      setEditingClient(null)
    } catch (err) {
      // Erro já está no estado do hook
    }
  }

  const confirmDelete = async () => {
    if (!deletingClient) return
    
    try {
      await deleteClient(deletingClient.id)
      setShowDeleteDialog(false)
      setDeletingClient(null)
    } catch (err) {
      // Erro já está no estado do hook
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingClient(null)
    setShowDeleteDialog(false)
    setDeletingClient(null)
    clearError()
  }

  // Seleção em massa
  const handleSelectAll = () => {
    if (selectedClients.size === paginatedClients.length) {
      setSelectedClients(new Set())
    } else {
      setSelectedClients(new Set(paginatedClients.map(client => client.id)))
    }
  }

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedClients(newSelected)
  }

  // Exportar dados (placeholder)
  const handleExport = () => {
    // Implementar exportação CSV/Excel
    console.log('Exportar clientes:', selectedClients.size > 0 ? selectedClients : 'todos')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestão completa de clientes cadastrados no sistema
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
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total de Clientes
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalClients}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-green-600" />
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

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserX className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Clientes Inativos
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {inactiveClients}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email, telefone ou CNPJ..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFilterToggle}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border ${
                showActiveOnly
                  ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              {showActiveOnly ? 'Apenas Ativos' : 'Todos'}
            </button>

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
        {selectedClients.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedClients.size} cliente(s) selecionado(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Exportar Selecionados
                </button>
                <button
                  onClick={() => setSelectedClients(new Set())}
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

      {/* Tabela de clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando clientes...</p>
          </div>
        ) : paginatedClients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? `Nenhum resultado para "${searchTerm}"`
                : 'Comece criando um novo cliente.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header da tabela */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedClients.size === paginatedClients.length && paginatedClients.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div className="ml-6 grid grid-cols-12 gap-4 w-full">
                  <div className="col-span-4">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Cliente
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Telefone
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      CNPJ
                    </span>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Cadastrado
                      {sortField === 'createdAt' && (
                        sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Linhas da tabela */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedClients.map((client) => (
                <div key={client.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="ml-6 grid grid-cols-12 gap-4 w-full">
                      {/* Cliente */}
                      <div className="col-span-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {client.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {client.email || 'Sem email'}
                            </div>
                            {client.contactPerson && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                Contato: {client.contactPerson}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Telefone */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {client.phone ? formatPhone(client.phone) : '-'}
                        </div>
                      </div>

                      {/* CNPJ */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {client.cnpj ? formatCNPJ(client.cnpj) : '-'}
                        </div>
                      </div>

                      {/* Data de cadastro */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDateTime(client.createdAt)}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          client.active 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {client.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Editar cliente"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Excluir cliente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} de{' '}
                {filteredClients.length} resultados
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

      {/* Formulário de cliente */}
      {showForm && (
        <ClientForm
          client={editingClient || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isCreating || isUpdating}
        />
      )}

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${deletingClient?.name}"? Esta ação marcará o cliente como inativo e não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={handleCancel}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
} 