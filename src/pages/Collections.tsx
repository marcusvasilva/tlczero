import { useState, useMemo } from 'react'
import { useCollections } from '@/hooks/useCollections'
import { useSpaces } from '@/hooks/useSpaces'
import { useSimpleOperators } from '@/hooks/useSimpleOperators'
import { useClients } from '@/hooks/useClients'
import { useAuthContext } from '@/contexts/AuthContext'
import { CollectionForm } from '@/components/forms/CollectionForm'
import { DataTable } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { formatDate, formatWeight } from '@/lib/formatters'
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye,
  Scale,
  Calendar,
  Download
} from 'lucide-react'
import type { Collection, CreateCollectionData } from '@/types'

export default function Collections() {
  const { userType } = useAuthContext()
  const { 
    filteredCollections,
    isLoading, 
    error, 
    createCollection, 
    updateCollection, 
    deleteCollection,
    totalCollections,
    totalWeight,
    thisMonthWeight,
    clearError
  } = useCollections()
  const { filteredSpaces } = useSpaces()
  const { operators } = useSimpleOperators()
  const { filteredClients } = useClients()
  
  // Estados
  const [showCollectionForm, setShowCollectionForm] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [filterSpace, setFilterSpace] = useState<string>('all')

  // Permissões
  const canCreate = userType === 'admin' || userType === 'supervisor' || userType === 'operator'
  const canEdit = userType === 'admin' || userType === 'supervisor'
  const canDelete = userType === 'admin'

  // Filtrar coletas
  const displayedCollections = useMemo(() => {
    let filtered = filteredCollections

    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(collection => 
        collection.observations?.toLowerCase().includes(search) ||
        collection.operatorId?.toLowerCase().includes(search) ||
        collection.spaceId?.toLowerCase().includes(search)
      )
    }

    // Filtro por período
    if (filterPeriod !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(startOfDay)
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      filtered = filtered.filter(collection => {
        const collectionDate = new Date(collection.collectedAt)
        
        switch (filterPeriod) {
          case 'today':
            return collectionDate >= startOfDay
          case 'week':
            return collectionDate >= startOfWeek
          case 'month':
            return collectionDate >= startOfMonth
          default:
            return true
        }
      })
    }

    // Filtro por espaço
    if (filterSpace !== 'all') {
      filtered = filtered.filter(collection => collection.spaceId === filterSpace)
    }

    return filtered.sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime())
  }, [filteredCollections, searchTerm, filterPeriod, filterSpace])

  // Handlers
  const handleCreateCollection = () => {
    setEditingCollection(null)
    setShowCollectionForm(true)
  }

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection)
    setShowCollectionForm(true)
  }

  const handleDeleteCollection = (collection: Collection) => {
    setDeletingCollection(collection)
  }

  const handleFormSubmit = async (data: CreateCollectionData) => {
    try {
      if (editingCollection) {
        await updateCollection(editingCollection.id, data)
      } else {
        await createCollection(data)
      }
      setShowCollectionForm(false)
      setEditingCollection(null)
    } catch (error) {
      console.error('Erro ao salvar coleta:', error)
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingCollection) {
      try {
        await deleteCollection(deletingCollection.id)
        setDeletingCollection(null)
      } catch (error) {
        console.error('Erro ao excluir coleta:', error)
      }
    }
  }

  // Configurações da tabela
  const columns = [
    {
      key: 'collectedAt',
      label: 'Data/Hora',
      render: (value: string) => formatDate(new Date(value)),
      sortable: true
    },
    {
      key: 'spaceId',
      label: 'Espaço',
      render: (value: string) => {
        const space = filteredSpaces.find(s => s.id === value)
        return space ? space.name : 'Espaço não encontrado'
      }
    },
    {
      key: 'operatorId',
      label: 'Operador',
      render: (value: string) => {
        const operator = operators.find(o => o.id === value)
        return operator ? operator.name : 'Operador não encontrado'
      }
    },
    {
      key: 'weight',
      label: 'Peso',
      render: (value: number) => formatWeight(value),
      sortable: true
    },
    {
      key: 'photoUrl',
      label: 'Foto',
      render: (value: string) => (
        value ? (
          <button 
            onClick={() => window.open(value, '_blank')}
            className="text-blue-600 hover:text-blue-800"
          >
            <Eye className="h-4 w-4" />
          </button>
        ) : (
          <span className="text-gray-400">Sem foto</span>
        )
      )
    },
    {
      key: 'observations',
      label: 'Observações',
      render: (value: string) => value ? (
        <span className="truncate max-w-xs" title={value}>
          {value.length > 30 ? `${value.substring(0, 30)}...` : value}
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      )
    }
  ]

  const actions = [
    ...(canEdit ? [{
      icon: Edit2,
      label: 'Editar',
      onClick: handleEditCollection,
      variant: 'primary' as const
    }] : []),
    ...(canDelete ? [{
      icon: Trash2,
      label: 'Excluir',
      onClick: handleDeleteCollection,
      variant: 'danger' as const
    }] : [])
  ]

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="responsive-flex mb-4 xs:mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5 xs:h-6 xs:w-6 text-gray-400 flex-shrink-0" />
          <h1 className="mobile-header">
            Coletas
          </h1>
        </div>
        {canCreate && (
          <button
            onClick={handleCreateCollection}
            className="mobile-button bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Coleta
          </button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 mb-4 xs:mb-5 sm:mb-6">
        <div className="mobile-card">
          <div className="flex items-center">
            <div className="p-2 xs:p-2.5 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
              <ClipboardList className="h-4 w-4 xs:h-5 xs:h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                Total
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {totalCollections}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mobile-card">
          <div className="flex items-center">
            <div className="p-2 xs:p-2.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
              <Scale className="h-4 w-4 xs:h-5 xs:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                Peso
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {formatWeight(totalWeight)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mobile-card">
          <div className="flex items-center">
            <div className="p-2 xs:p-2.5 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
              <Calendar className="h-4 w-4 xs:h-5 xs:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                Mês
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {formatWeight(thisMonthWeight)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 xs:p-4 mb-4 xs:mb-5 sm:mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar coletas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 input-responsive"
            />
          </div>

          {/* Filtro por período */}
          <div>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="select-responsive"
            >
              <option value="all">Todos os períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
            </select>
          </div>

          {/* Filtro por espaço */}
          <div>
            <select
              value={filterSpace}
              onChange={(e) => setFilterSpace(e.target.value)}
              className="select-responsive"
            >
              <option value="all">Todos os espaços</option>
              {filteredSpaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botão de exportação */}
          <div>
            <button
              onClick={() => {
                // TODO: Implementar exportação
                console.log('Exportar coletas')
              }}
              className="mobile-button bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 w-full flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <DataTable
        data={displayedCollections}
        columns={columns}
        actions={actions}
        loading={isLoading}
        emptyMessage="Nenhuma coleta encontrada"
        mobileCard={(collection) => (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(new Date(collection.collectedAt))}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredSpaces.find(s => s.id === collection.spaceId)?.name || 'Espaço não encontrado'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-primary">
                  {formatWeight(collection.weight)}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p>Operador: {operators.find(o => o.id === collection.operatorId)?.name || 'Não encontrado'}</p>
              {collection.observations && (
                <p className="truncate">Obs: {collection.observations}</p>
              )}
            </div>
            {collection.photoUrl && (
              <button 
                onClick={() => window.open(collection.photoUrl, '_blank')}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Ver foto
              </button>
            )}
          </div>
        )}
      />

      {/* Formulário de coleta */}
      {showCollectionForm && (
        <CollectionForm
          isOpen={showCollectionForm}
          onClose={() => {
            setShowCollectionForm(false)
            setEditingCollection(null)
          }}
          onSubmit={handleFormSubmit}
          initialData={editingCollection}
          spaces={filteredSpaces}
          operators={operators}
          clients={filteredClients}
          isLoading={isLoading}
        />
      )}

      {/* Confirmação de exclusão */}
      {deletingCollection && (
        <ConfirmDialog
          isOpen={!!deletingCollection}
          onCancel={() => setDeletingCollection(null)}
          onConfirm={handleConfirmDelete}
          title="Excluir Coleta"
          message={`Tem certeza que deseja excluir a coleta de ${formatWeight(deletingCollection.weight)} realizada em ${formatDate(new Date(deletingCollection.collectedAt))}?`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
        />
      )}
    </div>
  )
} 