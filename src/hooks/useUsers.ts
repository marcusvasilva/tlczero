import { useState, useCallback, useMemo, useEffect } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { User } from '@/types'
import { useAuthContext } from '@/contexts/AuthContext'
import { generateTemporaryPassword, isValidEmail } from '@/lib/utils'

interface CreateUserData {
  name: string
  email: string
  password?: string
  role: 'admin' | 'distributor' | 'supervisor' | 'operator'
  account_id?: string
  phone?: string
  cpf?: string
  supervisor_id?: string
}

interface UserCreationResult {
  user: User
  credentials?: {
    email: string
    password: string
    userCreated: boolean
  }
}

interface UseUsersReturn {
  // Data
  users: User[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createUser: (data: CreateUserData) => Promise<UserCreationResult>
  updateUser: (id: string, data: Partial<CreateUserData>) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  getUser: (id: string) => User | undefined
  
  // Utilities
  clearError: () => void
  refreshUsers: () => void
  
  // Stats
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  adminUsers: number
  supervisorUsers: number
  operatorUsers: number
}

export const useUsers = (): UseUsersReturn => {
  const { user, userType, accountContext } = useAuthContext()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar usuários baseado no contexto
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Buscando usuários...')
      
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      // OTIMIZAÇÃO: Usar função RPC para melhor performance
      // Baseado na documentação do Supabase sobre security definer functions
      
      if (!user?.id) {
        console.log('❌ Usuário não autenticado')
        setUsers([])
        return
      }
      
      console.log(`🔍 Usando função RPC otimizada para ${userType}`)
      
      const { data, error } = await supabase.rpc('get_users_by_context', {
        requesting_user_id: user.id,
        requesting_role: user.role,
        account_filter: (userType === 'supervisor') ? (accountContext || user.account_id) : null
      })

      if (error) {
        console.error('❌ Erro ao carregar usuários via RPC:', error)
        // Fallback para query tradicional em caso de erro na RPC
        console.log('🔄 Tentando fallback para query tradicional...')
        
        let fallbackQuery = supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          
        // Aplicar filtros baseados no tipo de usuário
        if (userType === 'admin') {
          // Admin vê todos
          console.log('👑 Admin fallback - todos os usuários')
        } else if (userType === 'distributor' && user?.id) {
          fallbackQuery = fallbackQuery.eq('account_id', 
            supabase.from('accounts')
              .select('id')
              .eq('distributor_id', user.id)
          )
        } else if (userType === 'supervisor') {
          const currentAccountId = accountContext || user?.account_id
          if (currentAccountId) {
            fallbackQuery = fallbackQuery.eq('account_id', currentAccountId)
          }
        } else {
          setUsers([])
          return
        }
        
        const fallbackResult = await fallbackQuery
        if (fallbackResult.error) {
          console.error('❌ Erro no fallback também:', fallbackResult.error)
          throw fallbackResult.error
        }
        
        console.log('✅ Fallback bem-sucedido:', fallbackResult.data?.length, 'usuários')
        setUsers(fallbackResult.data || [])
        return
      }

      console.log('✅ Usuários carregados:', data?.length || 0)
      setUsers(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários'
      setError(errorMessage)
      console.error('Erro ao buscar usuários:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userType, accountContext, user?.account_id])

  // Carregamento inicial
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Criar usuário
  const createUser = useCallback(async (data: CreateUserData): Promise<UserCreationResult> => {
    console.log('🎯 Iniciando criação de usuário:', data)
    setIsCreating(true)
    setError(null)
    
    try {
      // Validações básicas
      if (!data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!data.email?.trim()) {
        throw new Error('Email é obrigatório')
      }
      if (!data.role) {
        throw new Error('Função é obrigatória')
      }

      // Validar email
      if (!isValidEmail(data.email)) {
        throw new Error('Email inválido')
      }

      // Validações específicas por role
      if (data.role === 'admin') {
        // Admin não precisa de account_id
        data.account_id = undefined
      } else if (data.role === 'distributor') {
        // Distribuidor não precisa de account_id (gerencia múltiplas contas)
        data.account_id = undefined
      } else if (data.role === 'supervisor') {
        // Supervisor precisa de account_id
        if (!data.account_id) {
          throw new Error('Supervisor deve ser associado a uma empresa')
        }
        
        // Validar se o usuário atual pode criar supervisor nesta empresa
        if (userType === 'supervisor') {
          const currentAccountId = accountContext || user?.account_id
          if (data.account_id !== currentAccountId) {
            throw new Error('Você só pode criar supervisores da sua empresa')
          }
        } else if (userType === 'distributor') {
          // Distribuidor deve verificar se a conta é sua
          // Será validado no backend via RLS
          console.log('🔍 Distribuidor criando supervisor para conta:', data.account_id)
        }
      } else if (data.role === 'operator') {
        // Operator precisa de account_id e supervisor_id
        if (!data.account_id) {
          throw new Error('Operador deve ser associado a uma empresa')
        }
        if (!data.supervisor_id) {
          throw new Error('Operador deve ter um supervisor')
        }
        
        // Validar se distribuidor pode criar operador para esta conta
        if (userType === 'distributor') {
          console.log('🔍 Distribuidor criando operador para conta:', data.account_id)
          // Validação será feita no backend via RLS
        }
      }

      // Verificar se email já existe
      const { data: existingUser, error: checkUserError } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single()

      if (checkUserError && checkUserError.code !== 'PGRST116') {
        throw checkUserError
      }

      if (existingUser) {
        throw new Error('Email já está em uso por outro usuário')
      }

      // Gerar senha se não fornecida
      const password = data.password || generateTemporaryPassword(12)
      
      console.log('📧 Email:', data.email)
      console.log('🔐 Senha gerada:', !data.password ? 'Sim' : 'Não')

      // Criar usuário no Supabase Auth primeiro
      let authResult: any = null
      let credentials: UserCreationResult['credentials'] = undefined

      try {
        console.log('🔐 Criando usuário no Supabase Auth...')
        
        if (!supabaseAdmin.auth.admin) {
          throw new Error('Supabase Auth Admin não está disponível')
        }

        const authPayload = {
          email: data.email,
          password: password,
          user_metadata: {
            name: data.name,
            role: data.role,
            phone: data.phone || null,
            account_id: data.account_id || null,
            supervisor_id: data.supervisor_id || null
          },
          email_confirm: true
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(authPayload)

        if (authError) {
          console.error('❌ Erro ao criar usuário no Auth:', authError)
          throw new Error(`Erro ao criar usuário: ${authError.message}`)
        }

        console.log('✅ Usuário criado no Supabase Auth:', authData.user?.id)
        authResult = authData
        credentials = {
          email: data.email,
          password: password,
          userCreated: true
        }

      } catch (authErr) {
        console.error('💥 Erro na criação do usuário Auth:', authErr)
        throw authErr
      }

      // O trigger handle_new_user deve criar o usuário em public.users automaticamente
      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Buscar o usuário criado
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authResult.user.id)
        .single()

      if (userError) {
        console.error('❌ Erro ao buscar usuário criado:', userError)
        throw new Error('Usuário foi criado mas não foi possível recuperar os dados')
      }

      console.log('✅ Usuário criado com sucesso:', newUser)

      // Atualizar lista de usuários
      await fetchUsers()

      return {
        user: newUser,
        credentials
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário'
      console.error('💥 Erro geral ao criar usuário:', err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [userType, accountContext, user?.account_id, fetchUsers])

  // Atualizar usuário
  const updateUser = useCallback(async (id: string, data: Partial<CreateUserData>): Promise<User> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      console.log('🔄 Atualizando usuário:', id, data)

      // Validações específicas por role se role está sendo alterada
      if (data.role) {
        if (data.role === 'admin') {
          data.account_id = undefined
        } else if (data.role === 'distributor') {
          data.account_id = undefined
        } else if (data.role === 'supervisor' && !data.account_id) {
          throw new Error('Supervisor deve ser associado a uma empresa')
        } else if (data.role === 'operator' && (!data.account_id || !data.supervisor_id)) {
          throw new Error('Operador deve ter empresa e supervisor')
        }
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar usuário:', error)
        throw error
      }

      console.log('✅ Usuário atualizado:', updatedUser)
      await fetchUsers()
      return updatedUser

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [fetchUsers])

  // Deletar usuário
  const deleteUser = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      console.log('🗑️ Deletando usuário:', id)

      // Primeiro, deletar do Supabase Auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(id)
        console.log('✅ Usuário deletado do Supabase Auth')
      } catch (authErr) {
        console.warn('⚠️ Erro ao deletar do Auth (continuando):', authErr)
      }

      // Deletar da tabela users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Erro ao deletar usuário:', error)
        throw error
      }

      console.log('✅ Usuário deletado com sucesso')
      await fetchUsers()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar usuário'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }, [fetchUsers])

  // Buscar usuário por ID
  const getUser = useCallback((id: string): User | undefined => {
    return users.find(user => user.id === id)
  }, [users])

  // Refresh usuários
  const refreshUsers = useCallback(() => {
    fetchUsers()
  }, [fetchUsers])

  // Estatísticas
  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      inactiveUsers: users.filter(u => u.status === 'inactive').length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      supervisorUsers: users.filter(u => u.role === 'supervisor').length,
      operatorUsers: users.filter(u => u.role === 'operator').length
    }
  }, [users])

  return {
    // Data
    users,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    error,
    
    // CRUD operations
    createUser,
    updateUser,
    deleteUser,
    getUser,
    
    // Utilities
    clearError,
    refreshUsers,
    
    // Stats
    totalUsers: stats.totalUsers,
    activeUsers: stats.activeUsers,
    inactiveUsers: stats.inactiveUsers,
    adminUsers: stats.adminUsers,
    supervisorUsers: stats.supervisorUsers,
    operatorUsers: stats.operatorUsers
  }
} 