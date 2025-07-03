import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { mockClients } from '@/data/mockClients'
import type { Client, CreateClientData, UpdateClientData } from '@/types'

interface UseClientsOptions {
  searchTerm?: string
  sortBy?: 'name' | 'email' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  filterActive?: boolean
}

interface UseClientsReturn {
  // Data
  clients: Client[]
  filteredClients: Client[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createClient: (data: CreateClientData) => Promise<Client>
  updateClient: (id: string, data: UpdateClientData) => Promise<Client>
  deleteClient: (id: string) => Promise<void>
  getClient: (id: string) => Client | undefined
  
  // Utilities
  searchClients: (term: string) => void
  sortClients: (field: 'name' | 'email' | 'createdAt', order?: 'asc' | 'desc') => void
  clearError: () => void
  refreshClients: () => void
  
  // Stats
  totalClients: number
  activeClients: number
  inactiveClients: number
}

export const useClients = (options: UseClientsOptions = {}): UseClientsReturn => {
  const [clients, setClients] = useLocalStorage<Client[]>('tlc-clients', mockClients)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(options.searchTerm || '')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>(options.sortBy || 'name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.sortOrder || 'asc')

  // Simulate API delay
  const simulateDelay = useCallback((ms: number = 800) => 
    new Promise(resolve => setTimeout(resolve, ms)), [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Create client
  const createClient = useCallback(async (data: CreateClientData): Promise<Client> => {
    setIsCreating(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!data.email?.trim()) {
        throw new Error('Email é obrigatório')
      }
      
      // Check if email already exists
      const emailExists = clients.some(client => 
        client.email?.toLowerCase() === data.email?.toLowerCase()
      )
      if (emailExists) {
        throw new Error('Email já está em uso')
      }
      
      const newClient: Client = {
        id: Date.now().toString(),
        name: data.name.trim(),
        email: data.email?.trim() || '',
        phone: data.phone?.trim() || '',
        cnpj: data.cnpj?.trim() || '',
        address: data.address?.trim() || '',
        contactPerson: data.contactPerson?.trim() || '',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setClients(prev => [newClient, ...prev])
      return newClient
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [clients, setClients, simulateDelay])

  // Update client
  const updateClient = useCallback(async (id: string, data: UpdateClientData): Promise<Client> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      const existingClient = clients.find(client => client.id === id)
      if (!existingClient) {
        throw new Error('Cliente não encontrado')
      }
      
      // Validate required fields if provided
      if (data.name !== undefined && !data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (data.email !== undefined && !data.email?.trim()) {
        throw new Error('Email é obrigatório')
      }
      
      // Check if email already exists (excluding current client)
      if (data.email) {
        const emailExists = clients.some(client => 
          client.id !== id && client.email?.toLowerCase() === data.email!.toLowerCase()
        )
        if (emailExists) {
          throw new Error('Email já está em uso')
        }
      }
      
      const updatedClient: Client = {
        ...existingClient,
        ...data,
        name: data.name?.trim() || existingClient.name,
        email: data.email?.trim() || existingClient.email,
        phone: data.phone?.trim() || existingClient.phone,
        cnpj: data.cnpj?.trim() || existingClient.cnpj,
        address: data.address?.trim() || existingClient.address,
        contactPerson: data.contactPerson?.trim() || existingClient.contactPerson,
        updatedAt: new Date()
      }
      
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ))
      
      return updatedClient
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [clients, setClients, simulateDelay])

  // Delete client
  const deleteClient = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      const existingClient = clients.find(client => client.id === id)
      if (!existingClient) {
        throw new Error('Cliente não encontrado')
      }
      
      // Soft delete - mark as inactive instead of removing
      setClients(prev => prev.map(client => 
        client.id === id 
          ? { ...client, active: false, updatedAt: new Date() }
          : client
      ))
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }, [clients, setClients, simulateDelay])

  // Get single client
  const getClient = useCallback((id: string): Client | undefined => {
    return clients.find(client => client.id === id)
  }, [clients])

  // Search clients
  const searchClients = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Sort clients
  const sortClients = useCallback((field: 'name' | 'email' | 'createdAt', order: 'asc' | 'desc' = 'asc') => {
    setSortBy(field)
    setSortOrder(order)
  }, [])

  // Refresh clients (reload from storage)
  const refreshClients = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      // This would typically refetch from API
      setIsLoading(false)
    }, 500)
  }, [])

  // Filtered and sorted clients
  const filteredClients = useMemo(() => {
    let filtered = clients

    // Apply active filter
    if (options.filterActive !== undefined) {
      filtered = filtered.filter(client => client.active === options.filterActive)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.phone?.includes(term) ||
        client.cnpj?.includes(term) ||
        client.address?.toLowerCase().includes(term)
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
        case 'email':
          aValue = a.email?.toLowerCase() || ''
          bValue = b.email?.toLowerCase() || ''
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
  }, [clients, searchTerm, sortBy, sortOrder, options.filterActive])

  // Statistics
  const totalClients = useMemo(() => clients.length, [clients])
  const activeClients = useMemo(() => clients.filter(client => client.active).length, [clients])
  const inactiveClients = useMemo(() => clients.filter(client => !client.active).length, [clients])

  return {
    // Data
    clients,
    filteredClients,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    error,
    
    // CRUD operations
    createClient,
    updateClient,
    deleteClient,
    getClient,
    
    // Utilities
    searchClients,
    sortClients,
    clearError,
    refreshClients,
    
    // Stats
    totalClients,
    activeClients,
    inactiveClients
  }
} 