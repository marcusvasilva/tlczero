import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { mockSpaces } from '@/data/mockSpaces'
import { generateQRCode } from '@/lib/formatters'
import type { Space, CreateSpaceData, UpdateSpaceData } from '@/types'

interface UseSpacesOptions {
  clientId?: string
  searchTerm?: string
  sortBy?: 'name' | 'location' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  filterActive?: boolean
  filterType?: 'moscas' | 'outros'
}

interface UseSpacesReturn {
  // Data
  spaces: Space[]
  filteredSpaces: Space[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createSpace: (data: CreateSpaceData) => Promise<Space>
  updateSpace: (id: string, data: UpdateSpaceData) => Promise<Space>
  deleteSpace: (id: string) => Promise<void>
  getSpace: (id: string) => Space | undefined
  getSpacesByClient: (clientId: string) => Space[]
  
  // Utilities
  searchSpaces: (term: string) => void
  sortSpaces: (field: 'name' | 'location' | 'createdAt', order?: 'asc' | 'desc') => void
  filterByClient: (clientId: string) => void
  clearError: () => void
  refreshSpaces: () => void
  
  // Stats
  totalSpaces: number
  activeSpaces: number
  inactiveSpaces: number
  spacesByType: Record<string, number>
}

export const useSpaces = (options: UseSpacesOptions = {}): UseSpacesReturn => {
  const [spaces, setSpaces] = useLocalStorage<Space[]>('tlc-spaces', mockSpaces)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(options.searchTerm || '')
  const [sortBy, setSortBy] = useState<'name' | 'location' | 'createdAt'>(options.sortBy || 'name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.sortOrder || 'asc')
  const [clientFilter, setClientFilter] = useState(options.clientId || '')

  // Simulate API delay
  const simulateDelay = useCallback((ms: number = 800) => 
    new Promise(resolve => setTimeout(resolve, ms)), [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Create space
  const createSpace = useCallback(async (data: CreateSpaceData): Promise<Space> => {
    setIsCreating(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!data.clientId?.trim()) {
        throw new Error('Cliente é obrigatório')
      }
      if (!data.attractiveType) {
        throw new Error('Tipo de atrativo é obrigatório')
      }
      if (!data.installationDate) {
        throw new Error('Data de instalação é obrigatória')
      }
      
      const spaceId = Date.now().toString()
      const qrCode = generateQRCode(spaceId, data.name)
      
      const newSpace: Space = {
        id: spaceId,
        clientId: data.clientId.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || '',
        location: data.location?.trim() || '',
        qrCode,
        attractiveType: data.attractiveType,
        installationDate: data.installationDate,
        lastMaintenanceDate: undefined,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setSpaces(prev => [newSpace, ...prev])
      return newSpace
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar espaço'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [setSpaces, simulateDelay])

  // Update space
  const updateSpace = useCallback(async (id: string, data: UpdateSpaceData): Promise<Space> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      const existingSpace = spaces.find(space => space.id === id)
      if (!existingSpace) {
        throw new Error('Espaço não encontrado')
      }
      
      // Validate required fields if provided
      if (data.name !== undefined && !data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (data.clientId !== undefined && !data.clientId?.trim()) {
        throw new Error('Cliente é obrigatório')
      }
      
      // Generate new QR code if name changed
      let qrCode = existingSpace.qrCode
      if (data.name && data.name !== existingSpace.name) {
        qrCode = generateQRCode(id, data.name)
      }
      
      const updatedSpace: Space = {
        ...existingSpace,
        ...data,
        name: data.name?.trim() || existingSpace.name,
        clientId: data.clientId?.trim() || existingSpace.clientId,
        description: data.description?.trim() || existingSpace.description,
        location: data.location?.trim() || existingSpace.location,
        qrCode,
        updatedAt: new Date()
      }
      
      setSpaces(prev => prev.map(space => 
        space.id === id ? updatedSpace : space
      ))
      
      return updatedSpace
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar espaço'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [spaces, setSpaces, simulateDelay])

  // Delete space
  const deleteSpace = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      const existingSpace = spaces.find(space => space.id === id)
      if (!existingSpace) {
        throw new Error('Espaço não encontrado')
      }
      
      // Soft delete - mark as inactive instead of removing
      setSpaces(prev => prev.map(space => 
        space.id === id 
          ? { ...space, active: false, updatedAt: new Date() }
          : space
      ))
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir espaço'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }, [spaces, setSpaces, simulateDelay])

  // Get single space
  const getSpace = useCallback((id: string): Space | undefined => {
    return spaces.find(space => space.id === id)
  }, [spaces])

  // Get spaces by client
  const getSpacesByClient = useCallback((clientId: string): Space[] => {
    return spaces.filter(space => space.clientId === clientId && space.active)
  }, [spaces])

  // Search spaces
  const searchSpaces = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Sort spaces
  const sortSpaces = useCallback((field: 'name' | 'location' | 'createdAt', order: 'asc' | 'desc' = 'asc') => {
    setSortBy(field)
    setSortOrder(order)
  }, [])

  // Filter by client
  const filterByClient = useCallback((clientId: string) => {
    setClientFilter(clientId)
  }, [])

  // Refresh spaces (reload from storage)
  const refreshSpaces = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      // This would typically refetch from API
      setIsLoading(false)
    }, 500)
  }, [])

  // Filtered and sorted spaces
  const filteredSpaces = useMemo(() => {
    let filtered = spaces

    // Apply client filter
    if (clientFilter) {
      filtered = filtered.filter(space => space.clientId === clientFilter)
    }

    // Apply active filter
    if (options.filterActive !== undefined) {
      filtered = filtered.filter(space => space.active === options.filterActive)
    }

    // Apply type filter
    if (options.filterType) {
      filtered = filtered.filter(space => space.attractiveType === options.filterType)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(space =>
        space.name.toLowerCase().includes(term) ||
        space.description?.toLowerCase().includes(term) ||
        space.location?.toLowerCase().includes(term) ||
        space.qrCode.toLowerCase().includes(term)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | Date
      let bValue: string | Date

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'location':
          aValue = a.location?.toLowerCase() || ''
          bValue = b.location?.toLowerCase() || ''
          break
        case 'createdAt':
          aValue = a.createdAt
          bValue = b.createdAt
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [spaces, clientFilter, searchTerm, sortBy, sortOrder, options.filterActive, options.filterType])

  // Statistics
  const totalSpaces = useMemo(() => spaces.length, [spaces])
  const activeSpaces = useMemo(() => spaces.filter(space => space.active).length, [spaces])
  const inactiveSpaces = useMemo(() => spaces.filter(space => !space.active).length, [spaces])
  
  const spacesByType = useMemo(() => {
    return spaces.reduce((acc, space) => {
      if (space.active) {
        acc[space.attractiveType] = (acc[space.attractiveType] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  }, [spaces])

  return {
    // Data
    spaces,
    filteredSpaces,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    error,
    
    // CRUD operations
    createSpace,
    updateSpace,
    deleteSpace,
    getSpace,
    getSpacesByClient,
    
    // Utilities
    searchSpaces,
    sortSpaces,
    filterByClient,
    clearError,
    refreshSpaces,
    
    // Stats
    totalSpaces,
    activeSpaces,
    inactiveSpaces,
    spacesByType
  }
} 