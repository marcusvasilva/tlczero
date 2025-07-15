import { useState, useCallback, useMemo, useEffect } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { User as SupabaseUser } from '@/lib/supabase'
import type { Operator, CreateOperatorData, OperatorCreationResult } from '@/types'
import { mapSupabaseUserToLegacy, mapLegacyUserToSupabase } from '@/lib/typeMappers'
import { useAuthContext } from '@/contexts/AuthContext'
import { generateTemporaryPassword, isValidEmail } from '@/lib/utils'

interface UseOperatorsOptions {
  searchTerm?: string
  sortBy?: 'name' | 'email' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  filterActive?: boolean
}

interface UseOperatorsReturn {
  // Data
  operators: Operator[]
  filteredOperators: Operator[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createOperator: (data: CreateOperatorData) => Promise<OperatorCreationResult>
  updateOperator: (id: string, data: Partial<CreateOperatorData>) => Promise<Operator>
  deleteOperator: (id: string) => Promise<void>
  getOperator: (id: string) => Operator | undefined
  
  // Utilities
  searchOperators: (term: string) => void
  sortOperators: (field: 'name' | 'email' | 'created_at', order?: 'asc' | 'desc') => void
  clearError: () => void
  refreshOperators: () => void
  
  // Stats
  totalOperators: number
  activeOperators: number
  inactiveOperators: number
}

export const useOperators = (options: UseOperatorsOptions & { accountId?: string } = {}): UseOperatorsReturn => {
  const { user, userType, accountContext } = useAuthContext()
  const [supabaseUsers, setSupabaseUsers] = useState<SupabaseUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(options.searchTerm || '')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>(options.sortBy || 'name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.sortOrder || 'asc')

  // Mapear usuários Supabase para operadores do frontend
  const operators = useMemo(() => {
    return supabaseUsers.map(user => mapSupabaseUserToLegacy(user) as Operator)
  }, [supabaseUsers])

  // Fetch operators (users with role supervisor/operator) from Supabase
  const fetchOperators = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Buscando operadores na nova estrutura...')
      
      let query = supabase
        .from('users')
        .select('*')
        .in('role', ['supervisor', 'operator'])
        .eq('status', 'active')
        .order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply automatic account filtering based on user context or provided accountId
      const targetAccountId = options.accountId || accountContext || user?.account_id
      
      // For non-admin users or when accountId is provided, filter by their account
      if ((userType !== 'admin' && targetAccountId) || options.accountId) {
        query = query.eq('account_id', targetAccountId!)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao carregar operadores:', error)
        throw error
      }

      console.log('✅ Operadores carregados:', data?.length || 0)
      setSupabaseUsers(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar operadores'
      setError(errorMessage)
      console.error('Erro ao buscar operadores:', err)
    } finally {
      setIsLoading(false)
    }
  }, [sortBy, sortOrder, userType, accountContext, user?.account_id, options.accountId])

  // Initial load
  useEffect(() => {
    fetchOperators()
  }, [fetchOperators])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Create operator with automatic user creation
  const createOperator = useCallback(async (data: CreateOperatorData): Promise<OperatorCreationResult> => {
    console.log('🎯 Iniciando createOperator com dados:', data)
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
      
      const accountId = data.account_id
      
      // Gerar email se não fornecido
      let operatorEmail = data.email
      if (!operatorEmail) {
        // Gerar email baseado no nome + timestamp
        const cleanName = data.name.toLowerCase()
          .replace(/\s+/g, '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        operatorEmail = `${cleanName}${Date.now()}@tlcagro.com.br`
        console.log('📧 Email gerado automaticamente:', operatorEmail)
      }
      
      // Usar senha fornecida ou gerar automaticamente
      let operatorPassword = data.password
      if (!operatorPassword) {
        operatorPassword = generateTemporaryPassword(12)
        console.log('🔐 Senha gerada automaticamente')
      } else {
        console.log('🔐 Usando senha fornecida pelo usuário')
      }
      
      // Validar email
      if (!isValidEmail(operatorEmail)) {
        throw new Error('Email inválido')
      }
      
      // Check if email already exists
      const { data: existingUser, error: checkUserError } = await supabase
        .from('users')
        .select('id')
        .eq('email', operatorEmail)
        .single()

      if (checkUserError && checkUserError.code !== 'PGRST116') {
        throw checkUserError
      }

      if (existingUser) {
        throw new Error('Email já está em uso por outro usuário')
      }
      
      console.log('✅ Validação passou, convertendo dados...')
      
      // Criar dados do usuário com email definido
      const userData = {
        ...data,
        email: operatorEmail,
        account_id: accountId,
        status: 'active'
      }
      
      const supabaseData = mapLegacyUserToSupabase(userData)
      
      console.log('📡 Fazendo insert do usuário no Supabase...')
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([supabaseData])
        .select()
        .single()

      if (userError) {
        console.error('❌ Erro ao criar usuário:', userError)
        throw userError
      }

      console.log('✅ Usuário criado no Supabase:', newUser)
      
      // Criar usuário no Supabase Auth automaticamente
      let credentials: OperatorCreationResult['credentials'] = undefined
      
      try {
        console.log('🔐 Criando usuário no Supabase Auth...')
        console.log('📧 Email a ser usado:', operatorEmail)
        
        // Verificar se o admin está disponível
        if (!supabaseAdmin.auth.admin) {
          throw new Error('Supabase Auth Admin não está disponível')
        }
        
        console.log('✅ Supabase Auth Admin está disponível')
        
        const authPayload = {
          email: operatorEmail,
          password: operatorPassword,
          user_metadata: {
            name: data.name,
            role: data.role,
            phone: data.phone || null,
            account_id: accountId
          },
          email_confirm: true // Confirmar email automaticamente
        }
        
        console.log('📤 Payload para criação do usuário:', {
          ...authPayload,
          password: '[HIDDEN]'
        })
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(authPayload)

        if (authError) {
          console.error('❌ Erro detalhado ao criar usuário no Auth:', {
            message: authError.message,
            code: authError.code,
            status: authError.status,
            details: authError
          })
          console.warn('⚠️ Erro ao criar usuário no Auth (usuário já foi criado):', authError.message)
          // Não falhar completamente, apenas avisar
          credentials = {
            email: operatorEmail,
            password: operatorPassword,
            userCreated: false
          }
        } else {
          console.log('✅ Usuário criado no Supabase Auth com sucesso!')
          console.log('👤 Dados do usuário criado:', {
            id: authData.user?.id,
            email: authData.user?.email,
            user_metadata: authData.user?.user_metadata
          })
          credentials = {
            email: operatorEmail,
            password: operatorPassword,
            userCreated: true
          }
        }
        
      } catch (authErr) {
        console.error('💥 Erro capturado na criação do usuário:', authErr)
        console.warn('⚠️ Falha na criação do usuário (operador criado com sucesso):', authErr)
        credentials = {
          email: operatorEmail,
          password: operatorPassword,
          userCreated: false
        }
      }
      
      // Mapear usuário de volta para tipo operador frontend
      const mappedOperator = mapSupabaseUserToLegacy(newUser) as Operator
      console.log('🔄 Operador mapeado para frontend:', mappedOperator)

      // Refresh operators list
      await fetchOperators()
      
      return {
        operator: mappedOperator,
        credentials
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar operador'
      console.error('💥 Erro geral ao criar operador:', err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [fetchOperators])

  // Update operator
  const updateOperator = useCallback(async (id: string, data: Partial<CreateOperatorData>): Promise<Operator> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      // Validate required fields if provided
      if (data.name !== undefined && !data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      
      // Check if email already exists (excluding current user)
      if (data.email) {
        const { data: existing, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', data.email)
          .neq('id', id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError
        }

        if (existing) {
          throw new Error('Email já está em uso')
        }
      }
      
      // Converter dados frontend para Supabase usando mapeador
      const supabaseData = mapLegacyUserToSupabase(data)

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(supabaseData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Mapear de volta para tipo operador frontend
      const mappedOperator = mapSupabaseUserToLegacy(updatedUser) as Operator

      // Refresh operators list
      await fetchOperators()
      
      return mappedOperator
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar operador'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [fetchOperators])

  // Delete operator (soft delete)
  const deleteOperator = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', id)

      if (error) {
        throw error
      }
      
      // Refresh operators list
      await fetchOperators()
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir operador'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }, [fetchOperators])

  // Get operator by ID
  const getOperator = useCallback((id: string): Operator | undefined => {
    return operators.find(operator => operator.id === id)
  }, [operators])

  // Search operators
  const searchOperators = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Sort operators
  const sortOperators = useCallback((field: 'name' | 'email' | 'created_at', order: 'asc' | 'desc' = 'asc') => {
    setSortBy(field)
    setSortOrder(order)
  }, [])

  // Refresh operators
  const refreshOperators = useCallback(() => {
    fetchOperators()
  }, [fetchOperators])

  // Filter and sort operators
  const filteredOperators = useMemo(() => {
    let filtered = operators

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(operator =>
        operator.name.toLowerCase().includes(term) ||
        operator.email?.toLowerCase().includes(term) ||
        operator.phone?.toLowerCase().includes(term)
      )
    }

    // Apply active filter
    if (options.filterActive !== undefined) {
      filtered = filtered.filter(operator => 
        options.filterActive ? operator.status === 'active' : operator.status !== 'active'
      )
    }

    return filtered
  }, [operators, searchTerm, options.filterActive])

  // Stats
  const totalOperators = operators.length
  const activeOperators = operators.filter(operator => operator.status === 'active').length
  const inactiveOperators = operators.filter(operator => operator.status !== 'active').length

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
    inactiveOperators
  }
} 