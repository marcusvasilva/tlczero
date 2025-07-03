import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { mockCollections } from '@/data/mockCollections'
import type { Collection, CreateCollectionData, UpdateCollectionData } from '@/types'

interface UseCollectionsOptions {
  spaceId?: string
  operatorId?: string
  clientId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  sortBy?: 'collectedAt' | 'weight' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  minWeight?: number
  maxWeight?: number
}

interface UseCollectionsReturn {
  // Data
  collections: Collection[]
  filteredCollections: Collection[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createCollection: (data: CreateCollectionData) => Promise<Collection>
  updateCollection: (id: string, data: UpdateCollectionData) => Promise<Collection>
  deleteCollection: (id: string) => Promise<void>
  getCollection: (id: string) => Collection | undefined
  getCollectionsBySpace: (spaceId: string) => Collection[]
  getCollectionsByOperator: (operatorId: string) => Collection[]
  getCollectionsByDateRange: (start: Date, end: Date) => Collection[]
  
  // Utilities
  filterBySpace: (spaceId: string) => void
  filterByOperator: (operatorId: string) => void
  filterByDateRange: (start: Date, end: Date) => void
  filterByWeightRange: (min: number, max: number) => void
  sortCollections: (field: 'collectedAt' | 'weight' | 'createdAt', order?: 'asc' | 'desc') => void
  clearFilters: () => void
  clearError: () => void
  refreshCollections: () => void
  
  // Stats
  totalCollections: number
  totalWeight: number
  averageWeight: number
  collectionsToday: number
  collectionsThisWeek: number
  collectionsThisMonth: number
  weightToday: number
  weightThisWeek: number
  weightThisMonth: number
}

export const useCollections = (options: UseCollectionsOptions = {}): UseCollectionsReturn => {
  const [collections, setCollections] = useLocalStorage<Collection[]>('tlc-collections', mockCollections)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spaceFilter, setSpaceFilter] = useState(options.spaceId || '')
  const [operatorFilter, setOperatorFilter] = useState(options.operatorId || '')
  const [dateRangeFilter, setDateRangeFilter] = useState(options.dateRange)
  const [weightRangeFilter, setWeightRangeFilter] = useState({
    min: options.minWeight,
    max: options.maxWeight
  })
  const [sortBy, setSortBy] = useState<'collectedAt' | 'weight' | 'createdAt'>(options.sortBy || 'collectedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.sortOrder || 'desc')

  // Simulate API delay
  const simulateDelay = useCallback((ms: number = 800) => 
    new Promise(resolve => setTimeout(resolve, ms)), [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Create collection
  const createCollection = useCallback(async (data: CreateCollectionData): Promise<Collection> => {
    setIsCreating(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      // Validate required fields
      if (!data.spaceId?.trim()) {
        throw new Error('Espaço é obrigatório')
      }
      if (!data.operatorId?.trim()) {
        throw new Error('Operador é obrigatório')
      }
      if (!data.weight || data.weight <= 0) {
        throw new Error('Peso deve ser maior que zero')
      }
      if (!data.collectedAt) {
        throw new Error('Data da coleta é obrigatória')
      }
      
      const newCollection: Collection = {
        id: Date.now().toString(),
        spaceId: data.spaceId.trim(),
        operatorId: data.operatorId.trim(),
        weight: data.weight,
        photoUrl: data.photoUrl?.trim() || undefined,
        observations: data.observations?.trim() || undefined,
        collectedAt: data.collectedAt,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setCollections(prev => [newCollection, ...prev])
      return newCollection
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar coleta'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [setCollections, simulateDelay])

  // Update collection
  const updateCollection = useCallback(async (id: string, data: UpdateCollectionData): Promise<Collection> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      const existingCollection = collections.find(collection => collection.id === id)
      if (!existingCollection) {
        throw new Error('Coleta não encontrada')
      }
      
      // Validate required fields if provided
      if (data.spaceId !== undefined && !data.spaceId?.trim()) {
        throw new Error('Espaço é obrigatório')
      }
      if (data.operatorId !== undefined && !data.operatorId?.trim()) {
        throw new Error('Operador é obrigatório')
      }
      if (data.weight !== undefined && (!data.weight || data.weight <= 0)) {
        throw new Error('Peso deve ser maior que zero')
      }
      
      const updatedCollection: Collection = {
        ...existingCollection,
        ...data,
        spaceId: data.spaceId?.trim() || existingCollection.spaceId,
        operatorId: data.operatorId?.trim() || existingCollection.operatorId,
        photoUrl: data.photoUrl?.trim() || existingCollection.photoUrl,
        observations: data.observations?.trim() || existingCollection.observations,
        updatedAt: new Date()
      }
      
      setCollections(prev => prev.map(collection => 
        collection.id === id ? updatedCollection : collection
      ))
      
      return updatedCollection
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar coleta'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [collections, setCollections, simulateDelay])

  // Delete collection
  const deleteCollection = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      const existingCollection = collections.find(collection => collection.id === id)
      if (!existingCollection) {
        throw new Error('Coleta não encontrada')
      }
      
      // Hard delete for collections (unlike clients/spaces)
      setCollections(prev => prev.filter(collection => collection.id !== id))
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir coleta'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }, [collections, setCollections, simulateDelay])

  // Get single collection
  const getCollection = useCallback((id: string): Collection | undefined => {
    return collections.find(collection => collection.id === id)
  }, [collections])

  // Get collections by space
  const getCollectionsBySpace = useCallback((spaceId: string): Collection[] => {
    return collections.filter(collection => collection.spaceId === spaceId)
  }, [collections])

  // Get collections by operator
  const getCollectionsByOperator = useCallback((operatorId: string): Collection[] => {
    return collections.filter(collection => collection.operatorId === operatorId)
  }, [collections])

  // Get collections by date range
  const getCollectionsByDateRange = useCallback((start: Date, end: Date): Collection[] => {
    return collections.filter(collection => {
      const collectedAt = new Date(collection.collectedAt)
      return collectedAt >= start && collectedAt <= end
    })
  }, [collections])

  // Filter by space
  const filterBySpace = useCallback((spaceId: string) => {
    setSpaceFilter(spaceId)
  }, [])

  // Filter by operator
  const filterByOperator = useCallback((operatorId: string) => {
    setOperatorFilter(operatorId)
  }, [])

  // Filter by date range
  const filterByDateRange = useCallback((start: Date, end: Date) => {
    setDateRangeFilter({ start, end })
  }, [])

  // Filter by weight range
  const filterByWeightRange = useCallback((min: number, max: number) => {
    setWeightRangeFilter({ min, max })
  }, [])

  // Sort collections
  const sortCollections = useCallback((field: 'collectedAt' | 'weight' | 'createdAt', order: 'asc' | 'desc' = 'desc') => {
    setSortBy(field)
    setSortOrder(order)
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSpaceFilter('')
    setOperatorFilter('')
    setDateRangeFilter(undefined)
    setWeightRangeFilter({ min: undefined, max: undefined })
  }, [])

  // Refresh collections (reload from storage)
  const refreshCollections = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      // This would typically refetch from API
      setIsLoading(false)
    }, 500)
  }, [])

  // Filtered and sorted collections
  const filteredCollections = useMemo(() => {
    let filtered = collections

    // Apply space filter
    if (spaceFilter) {
      filtered = filtered.filter(collection => collection.spaceId === spaceFilter)
    }

    // Apply operator filter
    if (operatorFilter) {
      filtered = filtered.filter(collection => collection.operatorId === operatorFilter)
    }

    // Apply date range filter
    if (dateRangeFilter) {
      filtered = filtered.filter(collection => {
        const collectedAt = new Date(collection.collectedAt)
        return collectedAt >= dateRangeFilter.start && collectedAt <= dateRangeFilter.end
      })
    }

    // Apply weight range filter
    if (weightRangeFilter.min !== undefined) {
      filtered = filtered.filter(collection => collection.weight >= weightRangeFilter.min!)
    }
    if (weightRangeFilter.max !== undefined) {
      filtered = filtered.filter(collection => collection.weight <= weightRangeFilter.max!)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number | Date
      let bValue: number | Date

      switch (sortBy) {
        case 'weight':
          aValue = a.weight
          bValue = b.weight
          break
        case 'collectedAt':
          aValue = new Date(a.collectedAt)
          bValue = new Date(b.collectedAt)
          break
        case 'createdAt':
          aValue = a.createdAt
          bValue = b.createdAt
          break
        default:
          aValue = new Date(a.collectedAt)
          bValue = new Date(b.collectedAt)
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [collections, spaceFilter, operatorFilter, dateRangeFilter, weightRangeFilter, sortBy, sortOrder])

  // Statistics
  const totalCollections = useMemo(() => collections.length, [collections])
  
  const totalWeight = useMemo(() => {
    return collections.reduce((sum, collection) => sum + collection.weight, 0)
  }, [collections])
  
  const averageWeight = useMemo(() => {
    return totalCollections > 0 ? totalWeight / totalCollections : 0
  }, [totalWeight, totalCollections])

  // Date-based statistics
  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const thisWeekStart = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day
    return new Date(now.getFullYear(), now.getMonth(), diff)
  }, [])

  const thisMonthStart = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }, [])

  const collectionsToday = useMemo(() => {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return collections.filter(collection => {
      const collectedAt = new Date(collection.collectedAt)
      return collectedAt >= today && collectedAt < tomorrow
    }).length
  }, [collections, today])

  const collectionsThisWeek = useMemo(() => {
    return collections.filter(collection => {
      const collectedAt = new Date(collection.collectedAt)
      return collectedAt >= thisWeekStart
    }).length
  }, [collections, thisWeekStart])

  const collectionsThisMonth = useMemo(() => {
    return collections.filter(collection => {
      const collectedAt = new Date(collection.collectedAt)
      return collectedAt >= thisMonthStart
    }).length
  }, [collections, thisMonthStart])

  const weightToday = useMemo(() => {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return collections
      .filter(collection => {
        const collectedAt = new Date(collection.collectedAt)
        return collectedAt >= today && collectedAt < tomorrow
      })
      .reduce((sum, collection) => sum + collection.weight, 0)
  }, [collections, today])

  const weightThisWeek = useMemo(() => {
    return collections
      .filter(collection => {
        const collectedAt = new Date(collection.collectedAt)
        return collectedAt >= thisWeekStart
      })
      .reduce((sum, collection) => sum + collection.weight, 0)
  }, [collections, thisWeekStart])

  const weightThisMonth = useMemo(() => {
    return collections
      .filter(collection => {
        const collectedAt = new Date(collection.collectedAt)
        return collectedAt >= thisMonthStart
      })
      .reduce((sum, collection) => sum + collection.weight, 0)
  }, [collections, thisMonthStart])

  return {
    // Data
    collections,
    filteredCollections,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    error,
    
    // CRUD operations
    createCollection,
    updateCollection,
    deleteCollection,
    getCollection,
    getCollectionsBySpace,
    getCollectionsByOperator,
    getCollectionsByDateRange,
    
    // Utilities
    filterBySpace,
    filterByOperator,
    filterByDateRange,
    filterByWeightRange,
    sortCollections,
    clearFilters,
    clearError,
    refreshCollections,
    
    // Stats
    totalCollections,
    totalWeight,
    averageWeight,
    collectionsToday,
    collectionsThisWeek,
    collectionsThisMonth,
    weightToday,
    weightThisWeek,
    weightThisMonth
  }
} 