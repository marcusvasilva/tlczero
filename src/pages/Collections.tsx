import { useState, useMemo } from 'react'
import { mockCollections } from '@/data/mockCollections'
import { mockSpaces } from '@/data/mockSpaces'
import { mockOperators } from '@/data/mockOperators'
import { mockClients } from '@/data/mockClients'
import { formatWeight, formatDateTime } from '@/lib/formatters'
import { usePagination, useLocalStorage } from '@/hooks'
import { CollectionForm } from '@/components'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus } from 'lucide-react'
import type { Collection, CreateCollectionData, Space, Operator } from '@/types'

export function Collections() {
  const [collections, setCollections] = useLocalStorage<Collection[]>('tlc-collections', mockCollections)
  const [spaces] = useLocalStorage<Space[]>('tlc-spaces', mockSpaces)
  const [operators] = useLocalStorage<Operator[]>('tlc-operators', mockOperators)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage,
    getPageNumbers,
    getVisibleItems,
  } = usePagination({
    totalItems: collections.length,
    itemsPerPage: 10,
    initialPage: 1,
  })

  const visibleCollections = getVisibleItems(collections)
  const pageNumbers = getPageNumbers()

  // Criar mapas para lookup rápido
  const spacesMap = useMemo(() => {
    return spaces.reduce((acc, space) => {
      acc[space.id] = space
      return acc
    }, {} as Record<string, Space>)
  }, [spaces])

  const operatorsMap = useMemo(() => {
    return operators.reduce((acc, operator) => {
      acc[operator.id] = operator
      return acc
    }, {} as Record<string, Operator>)
  }, [operators])

  // Função para criar coleta
  const handleCreateCollection = async (data: CreateCollectionData) => {
    setIsLoading(true)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newCollection: Collection = {
        id: Date.now().toString(),
        ...data,
        collectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setCollections(prev => [newCollection, ...prev])
      setIsFormOpen(false)
    } catch (error) {
      console.error('Erro ao criar coleta:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para atualizar coleta
  const handleUpdateCollection = async (data: CreateCollectionData) => {
    if (!editingCollection) return
    
    setIsLoading(true)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCollections(prev => prev.map(collection => 
        collection.id === editingCollection.id 
          ? { ...collection, ...data, updatedAt: new Date() }
          : collection
      ))
      
      setIsFormOpen(false)
      setEditingCollection(null)
    } catch (error) {
      console.error('Erro ao atualizar coleta:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para abrir formulário de edição
  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection)
    setIsFormOpen(true)
  }

  // Função para abrir formulário de criação
  const handleCreate = () => {
    setEditingCollection(null)
    setIsFormOpen(true)
  }

  // Função para fechar formulário
  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingCollection(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Coletas</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Registro de todas as coletas realizadas ({collections.length} total)
          </p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Coleta</span>
        </button>
      </div>

      {/* Controles de paginação superiores */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, collections.length)} de {collections.length} coletas
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 text-sm"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToFirstPage}
            disabled={!hasPreviousPage}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={previousPage}
            disabled={!hasPreviousPage}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex gap-1">
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`px-3 py-1 rounded text-sm ${
                  pageNum === currentPage
                    ? 'bg-green-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={goToLastPage}
            disabled={!hasNextPage}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Histórico de Coletas</h2>
          <div className="space-y-4">
            {visibleCollections.map((collection) => {
              const space = spacesMap[collection.spaceId]
              const operator = operatorsMap[collection.operatorId]
              
              return (
                <div key={collection.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                          #{collection.id}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {space ? space.name : `Espaço #${collection.spaceId}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDateTime(collection.collectedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatWeight(collection.weight)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {operator ? operator.name : `Op. #${collection.operatorId}`}
                      </p>
                    </div>
                  </div>

                  {collection.photoUrl && (
                    <div className="mt-3">
                      <strong className="text-sm text-gray-900 dark:text-white">Foto:</strong>
                      <p className="mt-1 text-green-600 dark:text-green-400">✓ Disponível</p>
                    </div>
                  )}

                  {collection.observations && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <strong className="text-sm text-gray-900 dark:text-white">Observações:</strong>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{collection.observations}</p>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(collection)}
                      className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Paginação inferior */}
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={!hasPreviousPage}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={previousPage}
                disabled={!hasPreviousPage}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={nextPage}
                disabled={!hasNextPage}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={!hasNextPage}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal do Formulário */}
      {isFormOpen && (
        <CollectionForm
          isOpen={isFormOpen}
          spaces={spaces}
          operators={operators}
          clients={mockClients}
          initialData={editingCollection}
          onSubmit={editingCollection ? handleUpdateCollection : handleCreateCollection}
          onClose={handleCloseForm}
          isLoading={isLoading}
        />
      )}
    </div>
  )
} 