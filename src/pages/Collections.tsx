import React, { useState, useMemo, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Scale, 
  Camera, 
  MapPin, 
  Edit2, 
  Trash2, 
  User, 
  Building2, 
  Calendar,
  RefreshCw
} from 'lucide-react'

import { CollectionForm } from '@/components/forms/CollectionForm'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCollections, useClientSpaces, useSimpleOperators } from '@/hooks'
import { formatDate, formatWeight } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import type { Collection, CreateCollectionData, SimpleOperator, Client } from '@/types'

export function Collections() {
  const { userType } = useAuthContext()
  const { 
    collections, 
    filteredCollections, 
    isLoading, 
    error, 
    createCollection, 
    updateCollection, 
    deleteCollection,
    clearError,
    refreshCollections
  } = useCollections()
  
  // Usar hooks sem options para evitar recriações
  const { filteredSpaces, isLoading: spacesLoading } = useClientSpaces()
  const { operators, isLoading: operatorsLoading } = useSimpleOperators()
  const [clients, setClients] = useState<Client[]>([])
  
  const [showForm, setShowForm] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [selectedOperator, setSelectedOperator] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<string>('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // REMOVIDO: useEffect de debug que causava re-renderizações

  // Carregar clientes reais
  useEffect(() => {
    const loadClients = async () => {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .order('company_name')
        
        if (error) throw error
        
        setClients(data || [])
      } catch (err) {
        console.error('❌ Erro ao carregar clientes:', err)
      }
    }
    
    loadClients()
  }, [])

  // Filtros avançados
  const filteredData = useMemo(() => {
    let filtered = filteredCollections

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(collection => 
        collection.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.observations?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por espaço
    if (selectedSpace) {
      filtered = filtered.filter(collection => collection.spaceId === selectedSpace)
    }

    // Filtro por operador
    if (selectedOperator) {
      filtered = filtered.filter(collection => collection.operatorId === selectedOperator)
    }

    return filtered
  }, [filteredCollections, searchTerm, selectedSpace, selectedOperator])

  const handleCreateCollection = async (data: CreateCollectionData) => {
    try {
      await createCollection(data)
      setShowForm(false)
      setToastMessage('Coleta criada com sucesso!')
      setToastType('success')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao criar coleta:', error)
      setToastMessage('Erro ao criar coleta. Tente novamente.')
      setToastType('error')
      setTimeout(() => setToastMessage(''), 3000)
    }
  }

  const handleUpdateCollection = async (data: CreateCollectionData) => {
    if (!editingCollection) return

    try {
      await updateCollection(editingCollection.id, data)
      setEditingCollection(null)
      setToastMessage('Coleta atualizada com sucesso!')
      setToastType('success')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao atualizar coleta:', error)
      setToastMessage('Erro ao atualizar coleta. Tente novamente.')
      setToastType('error')
      setTimeout(() => setToastMessage(''), 3000)
    }
  }

  const handleDeleteCollection = async (collection: Collection) => {
    if (!window.confirm('Tem certeza que deseja excluir esta coleta?')) return

    try {
      await deleteCollection(collection.id)
      setToastMessage('Coleta excluída com sucesso!')
      setToastType('success')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao excluir coleta:', error)
      setToastMessage('Erro ao excluir coleta. Tente novamente.')
      setToastType('error')
      setTimeout(() => setToastMessage(''), 3000)
    }
  }

  const formatOperatorName = (operatorId: string) => {
    const operator = operators.find(op => op.id === operatorId)
    return operator ? operator.name : 'Operador não encontrado'
  }

  const formatSpaceName = (spaceId: string) => {
    const space = filteredSpaces.find((s) => s.id === spaceId)
    return space ? space.name : 'Espaço não encontrado'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Coletas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie todas as coletas de pragas registradas
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshCollections}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Coleta
          </button>
        </div>
      </div>

      {/* Debug Info */}
      {(spacesLoading || operatorsLoading) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Carregando dados... Espaços: {spacesLoading ? 'carregando' : filteredSpaces.length} | Operadores: {operatorsLoading ? 'carregando' : operators.length}
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID ou observações..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filtro por Espaço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Espaço
            </label>
            <select
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos os espaços</option>
              {filteredSpaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Operador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Operador
            </label>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos os operadores</option>
              {operators.map(operator => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Coletas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Espaço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Operador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Peso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Foto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma coleta encontrada
                  </td>
                </tr>
              ) : (
                filteredData.map((collection) => (
                  <tr key={collection.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                      {collection.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {formatSpaceName(collection.spaceId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {formatOperatorName(collection.operatorId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <Scale className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-semibold">{formatWeight(collection.weight)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(collection.collectedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {collection.photoUrl ? (
                        <div className="flex items-center">
                          <Camera className="w-4 h-4 mr-2 text-green-500" />
                          <span className="text-green-600">Sim</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Camera className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-400">Não</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingCollection(collection)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar coleta"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Excluir coleta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast de Notificação */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${
          toastType === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {toastMessage}
        </div>
      )}

      {/* Formulário de Coleta */}
      <CollectionForm
        isOpen={showForm || editingCollection !== null}
        onClose={() => {
          setShowForm(false)
          setEditingCollection(null)
        }}
        onSubmit={editingCollection ? handleUpdateCollection : handleCreateCollection}
        initialData={editingCollection}
        spaces={filteredSpaces}
        operators={operators}
        clients={clients}
        isLoading={isLoading}
      />
    </div>
  )
} 