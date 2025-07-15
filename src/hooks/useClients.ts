import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { supabase, executeQuery } from '../lib/supabase'
import { handleError } from '../lib/utils'
import type { Account } from '../types/client'
import type { UseClientsOptions, UseClientsReturn } from '../types/client'

export const useClients = (options: UseClientsOptions = {}): UseClientsReturn => {
  const [clients, setClients] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs para controle de montagem e evitar múltiplas requisições
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)
  
  // Extrair opções para evitar re-renders desnecessários
  const { sortBy = 'company_name', sortOrder = 'asc' } = options

  // Filtrar clientes com base nas opções
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (options.filterActive !== undefined) {
        return options.filterActive 
          ? client.status === 'active'
          : client.status === 'inactive'
      }
      return true
    })
  }, [clients, options.filterActive])

  // Fetch clients from Supabase
  const fetchClients = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (fetchingRef.current) {
      console.log('⚠️ Fetch já em andamento, pulando...')
      return
    }
    console.log('📋 Iniciando fetchClients...')
    console.log('📋 Opções de filtro:', options)
    console.log('📋 sortBy:', sortBy, 'sortOrder:', sortOrder)
    
    fetchingRef.current = true
    setIsLoading(true)
    setError(null)
    
    try {
      // Usar executeQuery com timeout e retry
      const result = await executeQuery(
        async () => {
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
          return await query
        },
        {
          timeout: 15000,
          maxRetries: 3,
          context: 'Fetch Clients'
        }
      )

      if (!result.success) {
        const errorInfo = handleError(result.error, 'Fetch Clients')
        throw new Error(errorInfo.message)
      }

      console.log('📊 Dados brutos do Supabase:', result.data)
      console.log('📊 Número de registros retornados:', result.data?.length || 0)
      
      // Verificar se o componente ainda está montado antes de atualizar o estado
      if (!isMountedRef.current) {
        console.log('⚠️ Componente desmontado, cancelando atualização de estado')
        return
      }

      setClients(result.data || [])
      setError(null)
      
    } catch (err) {
      console.error('❌ Erro ao buscar clientes:', err)
      
      // Verificar se ainda está montado antes de definir erro
      if (isMountedRef.current) {
        const errorInfo = handleError(err, 'Fetch Clients')
        setError(errorInfo.message)
      }
    } finally {
      fetchingRef.current = false
      
      // Verificar se ainda está montado antes de definir loading
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [sortBy, sortOrder, options.filterActive])

  // Initial load e cleanup
  useEffect(() => {
    // Resetar flags ao montar
    isMountedRef.current = true
    fetchingRef.current = false
    
    // Chamar fetchClients
    fetchClients()
    
    // Cleanup ao desmontar
    return () => {
      isMountedRef.current = false
      fetchingRef.current = false
    }
  }, [fetchClients])

  // Refresh clients function
  const refreshClients = useCallback(() => {
    fetchClients()
  }, [fetchClients])

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
      
      const result = await executeQuery(
        async () => {
          return await supabase
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
        },
        {
          timeout: 10000,
          maxRetries: 2,
          context: 'Create Client'
        }
      )

      if (!result.success) {
        const errorInfo = handleError(result.error, 'Create Client')
        throw new Error(errorInfo.message)
      }

      console.log('✅ Cliente criado no Supabase:', result.data)
      console.log('🔄 Atualizando lista de clientes...')
      
      // Refresh clients list apenas se ainda estiver montado
      if (isMountedRef.current) {
        await fetchClients()
        console.log('✅ Lista atualizada, retornando cliente...')
      }
      
      return result.data
    } catch (err) {
      console.error('❌ Erro ao criar cliente:', err)
      const errorInfo = handleError(err, 'Create Client')
      setError(errorInfo.message)
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [fetchClients])

  // Update client
  const updateClient = useCallback(async (id: string, updates: Partial<Account>): Promise<Account> => {
    console.log('🔄 Atualizando cliente:', id, updates)
    setIsUpdating(true)
    setError(null)
    
    try {
      const result = await executeQuery(
        async () => {
          return await supabase
            .from('accounts')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()
        },
        {
          timeout: 10000,
          maxRetries: 2,
          context: 'Update Client'
        }
      )

      if (!result.success) {
        const errorInfo = handleError(result.error, 'Update Client')
        throw new Error(errorInfo.message)
      }

      console.log('✅ Cliente atualizado no Supabase:', result.data)
      
      // Atualizar no estado local
      if (isMountedRef.current) {
        setClients(prev => 
          prev.map(client => 
            client.id === id ? result.data : client
          )
        )
      }
      
      return result.data
    } catch (err) {
      console.error('❌ Erro ao atualizar cliente:', err)
      const errorInfo = handleError(err, 'Update Client')
      setError(errorInfo.message)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Delete client
  const deleteClient = useCallback(async (id: string): Promise<void> => {
    console.log('🗑️ Deletando cliente:', id)
    setIsDeleting(true)
    setError(null)
    
    try {
      const result = await executeQuery(
        async () => {
          return await supabase
            .from('accounts')
            .delete()
            .eq('id', id)
        },
        {
          timeout: 10000,
          maxRetries: 2,
          context: 'Delete Client'
        }
      )

      if (!result.success) {
        const errorInfo = handleError(result.error, 'Delete Client')
        throw new Error(errorInfo.message)
      }

      console.log('✅ Cliente deletado do Supabase')
      
      // Remover do estado local
      if (isMountedRef.current) {
        setClients(prev => prev.filter(client => client.id !== id))
      }
      
    } catch (err) {
      console.error('❌ Erro ao deletar cliente:', err)
      const errorInfo = handleError(err, 'Delete Client')
      setError(errorInfo.message)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return {
    clients: filteredClients,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    refreshClients,
    createClient,
    updateClient,
    deleteClient,
    clearError
  }
} 