import { useState, useCallback, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/types'

interface UseClientsOptions {
  searchTerm?: string
  sortBy?: 'company_name' | 'email' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  filterActive?: boolean
}

interface UseClientsReturn {
  // Data
  clients: Account[]
  filteredClients: Account[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createClient: (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<Account>
  updateClient: (id: string, data: Partial<Account>) => Promise<Account>
  deleteClient: (id: string) => Promise<void>
  getClient: (id: string) => Account | undefined
  
  // Utilities
  searchClients: (term: string) => void
  sortClients: (field: 'company_name' | 'email' | 'created_at', order?: 'asc' | 'desc') => void
  clearError: () => void
  refreshClients: () => void
  
  // Stats
  totalClients: number
  activeClients: number
  inactiveClients: number
}

export const useClients = (options: UseClientsOptions = {}): UseClientsReturn => {
  const [clients, setClients] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(options.searchTerm || '')
  const [sortBy, setSortBy] = useState<'company_name' | 'email' | 'created_at'>(options.sortBy || 'company_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.sortOrder || 'asc')

  // Fetch clients from Supabase
  const fetchClients = useCallback(async () => {
    console.log('📋 Iniciando fetchClients...')
    console.log('📋 Opções de filtro:', options)
    console.log('📋 sortBy:', sortBy, 'sortOrder:', sortOrder)
    setIsLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('accounts')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply filters
      if (options.filterActive !== undefined) {
        console.log('📋 Aplicando filtro de status:', options.filterActive ? 'active' : 'inactive')
        query = query.eq('status', options.filterActive ? 'active' : 'inactive')
      } else {
        console.log('📋 Sem filtro de status aplicado')
      }

      console.log('📋 Query construída, executando...')
      const { data, error } = await query

      if (error) {
        console.error('❌ Erro na query do Supabase:', error)
        throw error
      }

      console.log('📊 Dados brutos do Supabase:', data)
      console.log('📊 Número de registros retornados:', data?.length || 0)
      
      // Mapear dados para formato compatível
      const mappedClients: Account[] = (data || []).map(account => ({
        id: account.id,
        company_name: account.company_name,
        contact_person: account.contact_person,
        phone: account.phone,
        email: account.email || null,
        address: account.address || null,
        city: account.city || null,
        state: account.state || null,
        cep: account.cep || null,
        cnpj: account.cnpj || null,
        status: account.status as 'active' | 'inactive',
        created_at: account.created_at,
        updated_at: account.updated_at
      }))

      setClients(mappedClients)
      console.log('✅ fetchClients concluído com sucesso, clientes:', mappedClients.length)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes'
      setError(errorMessage)
      console.error('Erro ao buscar clientes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [sortBy, sortOrder, options.filterActive])

  // Initial load
  useEffect(() => {
    fetchClients()
  }, []) // Removido fetchClients das dependências para evitar loops

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Create client
  const createClient = useCallback(async (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> => {
          console.log('🎯 Criando cliente:', data)
    setIsCreating(true)
    setError(null)
    
    try {
      // Validate required fields
      if (!data.company_name?.trim()) {
        throw new Error('Nome da empresa é obrigatório')
      }
      if (!data.contact_person?.trim()) {
        throw new Error('Pessoa de contato é obrigatória')
      }
      if (!data.phone?.trim()) {
        throw new Error('Telefone é obrigatório')
      }
      
      console.log('🚀 Validação passou, fazendo insert no Supabase...')
      const { data: newClient, error } = await supabase
        .from('accounts')
        .insert([{
          company_name: data.company_name,
          contact_person: data.contact_person,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          state: data.state,
          cep: data.cep,
          cnpj: data.cnpj,
          status: data.status || 'active'
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw error
      }

      console.log('✅ Cliente criado no Supabase:', newClient)
      console.log('🔄 Atualizando lista de clientes...')
      
      // Refresh clients list
      await fetchClients()
      console.log('✅ Lista atualizada, retornando cliente...')
      
      return {
        id: newClient.id,
        company_name: newClient.company_name,
        contact_person: newClient.contact_person,
        phone: newClient.phone,
        email: newClient.email,
        address: newClient.address,
        city: newClient.city,
        state: newClient.state,
        cep: newClient.cep,
        cnpj: newClient.cnpj,
        status: newClient.status as 'active' | 'inactive',
        created_at: newClient.created_at,
        updated_at: newClient.updated_at
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente'
      console.error('💥 Erro ao criar cliente:', errorMessage, err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [fetchClients])

  // Update client
  const updateClient = useCallback(async (id: string, data: Partial<Account>): Promise<Account> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      // Validate required fields if provided
      if (data.company_name !== undefined && !data.company_name?.trim()) {
        throw new Error('Nome da empresa é obrigatório')
      }
      if (data.contact_person !== undefined && !data.contact_person?.trim()) {
        throw new Error('Pessoa de contato é obrigatória')
      }
      if (data.phone !== undefined && !data.phone?.trim()) {
        throw new Error('Telefone é obrigatório')
      }

      const updateData: any = {}
      if (data.company_name !== undefined) updateData.company_name = data.company_name
      if (data.contact_person !== undefined) updateData.contact_person = data.contact_person
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.email !== undefined) updateData.email = data.email
      if (data.address !== undefined) updateData.address = data.address
      if (data.city !== undefined) updateData.city = data.city
      if (data.state !== undefined) updateData.state = data.state
      if (data.cep !== undefined) updateData.cep = data.cep
      if (data.cnpj !== undefined) updateData.cnpj = data.cnpj
      if (data.status !== undefined) updateData.status = data.status

      const { data: updatedClient, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Refresh clients list
      await fetchClients()
      
      return {
        id: updatedClient.id,
        company_name: updatedClient.company_name,
        contact_person: updatedClient.contact_person,
        phone: updatedClient.phone,
        email: updatedClient.email,
        address: updatedClient.address,
        city: updatedClient.city,
        state: updatedClient.state,
        cep: updatedClient.cep,
        cnpj: updatedClient.cnpj,
        status: updatedClient.status as 'active' | 'inactive',
        created_at: updatedClient.created_at,
        updated_at: updatedClient.updated_at
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [fetchClients])

  // Delete client
  const deleteClient = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
      
      // Refresh clients list
      await fetchClients()
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }, [fetchClients])

  // Get client by ID
  const getClient = useCallback((id: string): Account | undefined => {
    return clients.find(client => client.id === id)
  }, [clients])

  // Search clients
  const searchClients = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Sort clients
  const sortClients = useCallback((field: 'company_name' | 'email' | 'created_at', order: 'asc' | 'desc' = 'asc') => {
    setSortBy(field)
    setSortOrder(order)
  }, [])

  // Refresh clients
  const refreshClients = useCallback(() => {
    fetchClients()
  }, [fetchClients])

  // Filter clients
  const filteredClients = useMemo(() => {
    let filtered = clients

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(client =>
        client.company_name.toLowerCase().includes(term) ||
        (client.email && client.email.toLowerCase().includes(term)) ||
        (client.cnpj && client.cnpj.toLowerCase().includes(term)) ||
        client.contact_person.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [clients, searchTerm])

  // Stats
  const totalClients = clients.length
  const activeClients = clients.filter(client => client.status === 'active').length
  const inactiveClients = clients.filter(client => client.status === 'inactive').length

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