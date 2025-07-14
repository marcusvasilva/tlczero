import { useState, useCallback, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { SimpleOperator, CreateSimpleOperatorData, UpdateSimpleOperatorData } from '@/types/operator'
import { useAuthContext } from '@/contexts/AuthContext'

interface UseSimpleOperatorsOptions {
  searchTerm?: string
  sortBy?: 'name' | 'email' | 'role' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  filterActive?: boolean
  filterByRole?: 'operator' | 'supervisor'
}

interface UseSimpleOperatorsReturn {
  // Data
  operators: SimpleOperator[]
  filteredOperators: SimpleOperator[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createOperator: (data: CreateSimpleOperatorData) => Promise<SimpleOperator>
  updateOperator: (id: string, data: UpdateSimpleOperatorData) => Promise<SimpleOperator>
  deleteOperator: (id: string) => Promise<void>
  getOperator: (id: string) => SimpleOperator | undefined
  
  // Utilities
  searchOperators: (term: string) => void
  sortOperators: (field: 'name' | 'email' | 'role' | 'created_at', order?: 'asc' | 'desc') => void
  clearError: () => void
  refreshOperators: () => void
  
  // Stats
  totalOperators: number
  activeOperators: number
  inactiveOperators: number
  operatorsByRole: Record<string, number>
}

export const useSimpleOperators = (options: UseSimpleOperatorsOptions = {}): UseSimpleOperatorsReturn => {
  const { user, userType, accountContext } = useAuthContext()
  const [operators, setOperators] = useState<SimpleOperator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(options.searchTerm || '')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'created_at'>(options.sortBy || 'name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.sortOrder || 'asc')

  // Fetch operators using Supabase client
  const fetchOperators = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Buscando operadores simples...')
      
      let query = supabase
        .from('users')
        .select('*')
        .in('role', ['supervisor', 'operator'])
      
      // Apply automatic account filtering based on user context
      const targetAccountId = accountContext || user?.account_id
      
      // For non-admin users, filter by their account
      if (userType !== 'admin' && targetAccountId) {
        query = query.eq('account_id', targetAccountId)
      }

      // Apply role filter if specified
      if (options.filterByRole) {
        query = query.eq('role', options.filterByRole)
      }

      // Add ordering
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) {
        throw error
      }

      console.log('✅ Operadores carregados:', data?.length || 0)
      
      // Transform data to match interface (agora usando estrutura da tabela 'users')
      const transformedOperators: SimpleOperator[] = data?.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email || undefined,
        phone: user.phone || undefined,
        cpf: user.cpf || undefined,
        role: user.role as 'operator' | 'supervisor',
        account_id: user.account_id || '',
        avatar_url: undefined, // Campo não existe na tabela users
        status: (user.status as 'active' | 'inactive') || 'active',
        hire_date: undefined, // Campo não existe na tabela users
        notes: undefined, // Campo não existe na tabela users
        created_at: new Date(user.created_at!),
        updated_at: new Date(user.updated_at!)
      })) || []

      setOperators(transformedOperators)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar operadores'
      setError(errorMessage)
      console.error('Erro ao buscar operadores:', err)
    } finally {
      setIsLoading(false)
    }
  }, [sortBy, sortOrder, userType, accountContext, user?.account_id, options.filterByRole])

  // Initial load
  useEffect(() => {
    fetchOperators()
  }, []) // Removido fetchOperators das dependências para evitar loops

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Create operator using Supabase client
  const createOperator = useCallback(async (data: CreateSimpleOperatorData): Promise<SimpleOperator> => {
    console.log('🎯 Criando operador simples:', data)
    setIsCreating(true)
    setError(null)
    
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!data.account_id) {
        throw new Error('Conta é obrigatória')
      }
      if (!data.role) {
        throw new Error('Função é obrigatória')
      }
      
      // Gerar email único baseado no nome e timestamp
      const cleanName = data.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
        .substring(0, 20) // Limitar tamanho
      const timestamp = Date.now()
      const generatedEmail = `${cleanName}${timestamp}@tlcagro.local`
      
      // Preparar dados para inserção
      const insertData: any = {
        name: data.name,
        email: generatedEmail,
        phone: data.phone || null,
        cpf: data.cpf || null,
        role: data.role,
        account_id: data.account_id,
        status: data.status || 'active'
      }
      
      // Se for operador, precisa buscar um supervisor na mesma conta
      if (data.role === 'operator') {
        const { data: supervisors, error: supervisorError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'supervisor')
          .eq('account_id', data.account_id)
          .eq('status', 'active')
          .limit(1)
        
        if (supervisorError) {
          console.error('❌ Erro ao buscar supervisor:', supervisorError)
          throw new Error('Erro ao buscar supervisor para o operador')
        }
        
        if (!supervisors || supervisors.length === 0) {
          throw new Error('Não há supervisores ativos nesta conta. Crie um supervisor primeiro ou altere a função para "Supervisor".')
        }
        
        insertData.supervisor_id = supervisors[0].id
      }
      
      console.log('📝 Dados preparados para inserção:', insertData)

      const { data: result, error: createError } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single()

      if (createError) {
        console.error('❌ Erro ao criar operador:', createError)
        
        // Melhorar mensagens de erro
        let errorMessage = 'Erro ao criar operador'
        if (createError.message.includes('duplicate key')) {
          errorMessage = 'Já existe um usuário com este email ou CPF'
        } else if (createError.message.includes('check constraint')) {
          errorMessage = 'Dados inválidos. Verifique as informações fornecidas.'
        } else {
          errorMessage = createError.message
        }
        
        throw new Error(errorMessage)
      }

      console.log('✅ Operador criado:', result)
      
              // Transform result to match interface (estrutura da tabela 'users')
        const newOperator: SimpleOperator = {
          id: result.id,
          name: result.name,
          email: result.email || undefined,
          phone: result.phone || undefined,
          cpf: result.cpf || undefined,
          role: result.role as 'operator' | 'supervisor',
          account_id: result.account_id || '',
          avatar_url: undefined, // Campo não existe na tabela users
          status: (result.status as 'active' | 'inactive') || 'active',
          hire_date: undefined, // Campo não existe na tabela users
          notes: undefined, // Campo não existe na tabela users
          created_at: new Date(result.created_at!),
          updated_at: new Date(result.updated_at!)
        }

      // Update local state
      setOperators(prev => [...prev, newOperator])
      
      return newOperator
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar operador'
      setError(errorMessage)
      console.error('Erro ao criar operador:', err)
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [])

  // Update operator using Supabase client
  const updateOperator = useCallback(async (id: string, data: UpdateSimpleOperatorData): Promise<SimpleOperator> => {
    console.log('🔄 Atualizando operador:', id, data)
    setIsUpdating(true)
    setError(null)
    
    try {
              // Ready to update operator
        
        const updateData = {
          ...data,
          updated_at: new Date().toISOString()
        }

        const { data: result, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar operador:', updateError)
        throw updateError
      }

      console.log('✅ Operador atualizado:', result)
      
              // Transform result to match interface (estrutura da tabela 'users')
        const updatedOperator: SimpleOperator = {
          id: result.id,
          name: result.name,
          email: result.email || undefined,
          phone: result.phone || undefined,
          cpf: result.cpf || undefined,
          role: result.role as 'operator' | 'supervisor',
          account_id: result.account_id || '',
          avatar_url: undefined, // Campo não existe na tabela users
          status: (result.status as 'active' | 'inactive') || 'active',
          hire_date: undefined, // Campo não existe na tabela users
          notes: undefined, // Campo não existe na tabela users
          created_at: new Date(result.created_at!),
          updated_at: new Date(result.updated_at!)
        }

      // Update local state
      setOperators(prev => prev.map(op => op.id === id ? updatedOperator : op))
      
      return updatedOperator
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar operador'
      setError(errorMessage)
      console.error('Erro ao atualizar operador:', err)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Delete operator using Supabase client
  const deleteOperator = useCallback(async (id: string): Promise<void> => {
    console.log('🗑️ Excluindo operador:', id)
    setIsDeleting(true)
    setError(null)
    
    try {
              const { error: deleteError } = await supabase
          .from('users')
          .update({ status: 'inactive' })
          .eq('id', id)

      if (deleteError) {
        console.error('❌ Erro ao excluir operador:', deleteError)
        throw deleteError
      }

      console.log('✅ Operador excluído')
      
      // Update local state
      setOperators(prev => prev.filter(op => op.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir operador'
      setError(errorMessage)
      console.error('Erro ao excluir operador:', err)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // Get operator by ID
  const getOperator = useCallback((id: string): SimpleOperator | undefined => {
    return operators.find(op => op.id === id)
  }, [operators])

  // Search operators
  const searchOperators = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Sort operators
  const sortOperators = useCallback((field: 'name' | 'email' | 'role' | 'created_at', order: 'asc' | 'desc' = 'asc') => {
    setSortBy(field)
    setSortOrder(order)
  }, [])

  // Refresh operators
  const refreshOperators = useCallback(() => {
    fetchOperators()
  }, [fetchOperators])

  // Filtered operators based on search and filters
  const filteredOperators = useMemo(() => {
    let filtered = operators

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(op => 
        op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (op.email && op.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (op.phone && op.phone.includes(searchTerm))
      )
    }

    // Apply active filter
    if (options.filterActive !== undefined) {
      filtered = filtered.filter(op => 
        options.filterActive ? op.status === 'active' : op.status === 'inactive'
      )
    }

    return filtered
  }, [operators, searchTerm, options.filterActive])

  // Statistics
  const totalOperators = operators.length
  const activeOperators = operators.filter(op => op.status === 'active').length
  const inactiveOperators = operators.filter(op => op.status === 'inactive').length
  const operatorsByRole = operators.reduce((acc, op) => {
    acc[op.role] = (acc[op.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    // Data
    operators,
    filteredOperators,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    error,
    
    // CRUD operations
    createOperator,
    updateOperator,
    deleteOperator,
    getOperator,
    
    // Utilities
    searchOperators,
    sortOperators,
    clearError,
    refreshOperators,
    
    // Stats
    totalOperators,
    activeOperators,
    inactiveOperators,
    operatorsByRole
  }
} 