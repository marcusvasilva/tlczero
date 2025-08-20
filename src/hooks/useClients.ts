import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { supabase, executeQuery } from '../lib/supabase'
import { handleError } from '../lib/utils'
import { cache, getCacheKey } from '../lib/cache'
import { useApiConnectionMonitor } from './useConnectionMonitor'
import { useAuthContext } from '../contexts/AuthContext'
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
  
  // Hook para monitorar conexão
  const { reportApiError } = useApiConnectionMonitor()
  
  // Contexto de autenticação para verificar role do usuário
  const { user } = useAuthContext()
  
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
  const fetchClients = useCallback(async (forceRefresh = false) => {
    // Evitar múltiplas chamadas simultâneas
    if (fetchingRef.current) {
      console.log('⚠️ Fetch já em andamento, pulando...')
      return
    }
    console.log('📋 Iniciando fetchClients...')
    console.log('📋 Opções de filtro:', options)
    console.log('📋 sortBy:', sortBy, 'sortOrder:', sortOrder)
    
    fetchingRef.current = true
    
    // Gerar chave de cache baseada nos parâmetros
    const cacheKey = getCacheKey('clients', {
      sortBy,
      sortOrder,
      filterActive: options.filterActive
    })
    
    // Tentar buscar do cache primeiro (se não for forçado refresh)
    if (!forceRefresh) {
      const cachedData = cache.get<Account[]>(cacheKey)
      if (cachedData) {
        console.log('📦 Dados encontrados no cache')
        setClients(cachedData)
        setIsLoading(false)
        setError(null)
        fetchingRef.current = false
        
        // Revalidar em background após 30 segundos
        const cacheAge = cache.getAge(cacheKey)
        if (cacheAge && cacheAge > 30000) { // 30 segundos
          console.log('🔄 Cache antigo, revalidando em background...')
          // Não esperar, apenas iniciar a revalidação
          fetchClients(true).catch(console.error)
        }
        
        return
      }
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Usar função RPC otimizada quando possível
      const result = await executeQuery(
        async () => {
          if (user?.id) {
            console.log('🚀 Usando RPC otimizada para buscar contas')
            
            // Tentar usar função RPC otimizada primeiro
            const rpcResult = await supabase.rpc('get_accounts_by_context', {
              requesting_user_id: user.id,
              requesting_role: user.role,
              account_filter: (user.role === 'supervisor' || user.role === 'operator') ? user.account_id : null
            })
            
            if (!rpcResult.error) {
              let data = rpcResult.data || []
              
              // Aplicar filtros de status se especificado
              if (options.filterActive !== undefined) {
                const targetStatus = options.filterActive ? 'active' : 'inactive'
                data = data.filter(account => account.status === targetStatus)
                console.log('📋 Filtro de status aplicado na RPC:', targetStatus)
              }
              
              // Aplicar ordenação
              data.sort((a, b) => {
                const aValue = a[sortBy] || ''
                const bValue = b[sortBy] || ''
                if (sortOrder === 'asc') {
                  return aValue.localeCompare(bValue)
                } else {
                  return bValue.localeCompare(aValue)
                }
              })
              
              console.log('✅ RPC bem-sucedida:', data.length, 'contas')
              return { data, error: null }
            } else {
              console.warn('⚠️ RPC falhou, usando fallback:', rpcResult.error)
            }
          }
          
          // Fallback para query tradicional
          console.log('🔄 Usando query tradicional como fallback')
          let query = supabase
            .from('accounts')
            .select('*')
            .order(sortBy, { ascending: sortOrder === 'asc' })

          // IMPORTANTE: Sempre adicionar filtros diretos para otimizar RLS
          if (user) {
            if (user.role === 'admin') {
              console.log('📋 Admin - sem filtros adicionais')
            } else if (user.role === 'distributor') {
              console.log('📋 Aplicando filtro de distribuidor:', user.id)
              query = query.eq('distributor_id', user.id)
            } else if (user.role === 'supervisor' || user.role === 'operator') {
              if (user.account_id) {
                console.log('📋 Aplicando filtro de conta:', user.account_id)
                query = query.eq('id', user.account_id)
              }
            }
          }

          // Apply status filters
          if (options.filterActive !== undefined) {
            console.log('📋 Aplicando filtro de status:', options.filterActive ? 'active' : 'inactive')
            query = query.eq('status', options.filterActive ? 'active' : 'inactive')
          }

          console.log('📋 Query tradicional construída, executando...')
          return await query
        },
        {
          timeout: 15000,
          maxRetries: 3,
          context: 'Fetch Clients'
        }
      )

      if (!result.success) {
        // Reportar erro de API para o monitor de conexão
        reportApiError()
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

      const clientsData = result.data || []
      
      // Salvar no cache
      cache.set(cacheKey, clientsData, 5 * 60 * 1000) // Cache por 5 minutos
      
      setClients(clientsData)
      setError(null)
      
    } catch (err) {
      console.error('❌ Erro ao buscar clientes:', err)
      
      // Reportar erro se for problema de conexão
      if (err instanceof Error && 
          (err.message.includes('timeout') || 
           err.message.includes('network') || 
           err.message.includes('fetch'))) {
        reportApiError()
      }
      
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
    fetchClients(false) // Não forçar refresh no load inicial
    
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
              status: data.status || 'active',
              // Se for distribuidor, vincular a conta a ele
              distributor_id: user?.role === 'distributor' ? user.id : null
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

      if (!result.data) {
        throw new Error('Erro ao criar cliente: dados não retornados')
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

      if (!result.data) {
        throw new Error('Erro ao atualizar cliente: dados não retornados')
      }

      console.log('✅ Cliente atualizado no Supabase:', result.data)
      
      // Atualizar no estado local
      if (isMountedRef.current) {
        setClients(prev => 
          prev.map(client => 
            client.id === id ? result.data! : client
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
    filteredClients,
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