import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react'
import type { AuthUser, AuthContextType, LoginCredentials, RegisterData } from '@/types/auth'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { PasswordChangeRequired } from '../components/auth/PasswordChangeRequired'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accountContext, setAccountContext] = useState<string | null>(null)
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false)
  const [tempUser, setTempUser] = useState<AuthUser | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Referências para controle de estado
  const isInitializing = useRef(true)

  // Determinar o tipo de usuário baseado no role
  const userType: 'admin' | 'distributor' | 'supervisor' | 'operator' = useMemo(() => {
    if (!user) return 'operator'
    if (user.role === 'admin') return 'admin'
    if (user.role === 'distributor') return 'distributor'
    if (user.role === 'supervisor') return 'supervisor'
    return 'operator'
  }, [user])

  // Definir accountContext automaticamente baseado no usuário logado
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'distributor') {
        // Admin e distribuidor vêem dados filtrados por suas permissões
        setAccountContext(null)
      } else {
        // Supervisor e operador veem apenas dados da sua conta
        setAccountContext(user.account_id)
      }
    } else {
      setAccountContext(null)
    }
  }, [user])


  // Função otimizada para buscar dados do usuário no Supabase
  const fetchUserData = async (supabaseUser: SupabaseUser): Promise<AuthUser | null> => {
    try {
      console.log('🔍 Buscando dados do usuário (RPC otimizada):', supabaseUser.id)
      
      if (!supabaseUser.id) {
        console.log('❌ ID do usuário não encontrado')
        return null
      }

      // Tentar usar função RPC otimizada primeiro, mas com fallback robusto
      let dbUserData = null
      let useRPC = true
      
      try {
        const rpcResult = await supabase
          .rpc('get_user_data', { user_id: supabaseUser.id })
          .single()
          
        if (rpcResult.error) {
          console.warn('⚠️ RPC get_user_data falhou:', rpcResult.error.message)
          useRPC = false
        } else {
          dbUserData = rpcResult.data
          console.log('✅ RPC get_user_data bem-sucedida')
        }
      } catch (rpcError) {
        console.warn('⚠️ Erro na chamada RPC:', rpcError)
        useRPC = false
      }
      
      // Fallback para query tradicional se RPC falhou
      if (!useRPC || !dbUserData) {
        console.log('🔄 Usando query tradicional...')
        
        const fallbackResult = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single()
          
        if (fallbackResult.error) {
          console.error('❌ Erro na query tradicional:', fallbackResult.error.message)
          return null
        }
        
        dbUserData = fallbackResult.data
        console.log('✅ Query tradicional bem-sucedida')
      }

      if (!dbUserData) {
        console.log('❌ Dados do usuário não encontrados')
        return null
      }
      
      // Verificar se o usuário está ativo
      if (dbUserData.status !== 'active') {
        console.log('❌ Usuário inativo:', dbUserData.status)
        return null
      }

      const userData: AuthUser = {
        id: dbUserData.id,
        email: dbUserData.email,
        name: dbUserData.name,
        role: dbUserData.role as 'admin' | 'distributor' | 'supervisor' | 'operator',
        account_id: dbUserData.account_id,
        supervisor_id: dbUserData.supervisor_id,
        phone: dbUserData.phone,
        cpf: dbUserData.cpf,
        status: dbUserData.status,
        password_change_required: dbUserData.password_change_required || false,
        created_at: dbUserData.created_at,
        updated_at: dbUserData.updated_at,
      }

      console.log('✅ Dados do usuário carregados:', { 
        id: userData.id, 
        role: userData.role, 
        status: userData.status,
        method: useRPC ? 'RPC' : 'Traditional Query'
      })
      return userData
    } catch (err) {
      console.error('❌ Erro inesperado ao buscar dados do usuário:', err)
      return null
    }
  }

  // Verificar sessão inicial simplificada
  useEffect(() => {
    let isMounted = true
    
    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticação...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao obter sessão:', error)
          throw error
        }
        
        if (!isMounted) return
        
        if (session?.user) {
          const userData = await fetchUserData(session.user)
          
          if (!isMounted) return
          
          if (userData?.status === 'active') {
            setUser(userData)
            setError(null)
          } else {
            await supabase.auth.signOut()
            setError('Conta inativa. Contate o administrador.')
          }
        }
      } catch (err) {
        console.error('Erro na inicialização:', err)
        if (isMounted) {
          setError('Erro ao verificar autenticação.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
          isInitializing.current = false
        }
      }
    }

    initializeAuth()

    // Listener simplificado de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        console.log('Auth state change:', event)
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setError(null)
          return
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const userData = await fetchUserData(session.user)
            
            if (!isMounted) return
            
            if (userData?.status === 'active') {
              setUser(userData)
              setError(null)
            } else {
              await supabase.auth.signOut()
              setError('Conta inativa.')
            }
          } catch (err) {
            console.error('Erro no processamento de sessão:', err)
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        // Melhorar as mensagens de erro baseadas no código/tipo de erro
        let errorMessage = 'Erro ao fazer login'
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos. Verifique seus dados e tente novamente.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada e confirme seu email.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.'
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Usuário não encontrado. Verifique o email ou crie uma nova conta.'
        } else if (error.message.includes('Network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
        } else {
          errorMessage = error.message
        }
        
        throw new Error(errorMessage)
      }
      
      if (data.user) {
        const userData = await fetchUserData(data.user)
        if (!userData) {
          throw new Error('Perfil de usuário não encontrado no sistema. Entre em contato com o suporte.')
        }
        if (userData.status !== 'active') {
          await supabase.auth.signOut()
          throw new Error('Conta desativada. Entre em contato com o administrador.')
        }
        
        // Verificar se o usuário precisa alterar a senha
        if (userData.password_change_required) {
          setTempUser(userData)
          setPasswordChangeRequired(true)
          setIsLoading(false)
          return
        }
        
        setUser(userData)
        console.log('✅ Login realizado com sucesso')
      }
    } catch (err) {
      console.error('❌ Erro no login:', err)
      setError(err instanceof Error ? err.message : 'Erro inesperado ao fazer login')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Iniciando registro de usuário:', data.email)

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role, // Usar role diretamente sem mapear
            phone: data.phone,
            account_id: data.account_id,
            supervisor_id: data.supervisor_id
          }
        }
      })

      if (authError) {
        console.error('❌ Erro no registro Auth:', authError)
        
        // Melhorar mensagens de erro
        let errorMessage = 'Erro ao registrar usuário'
        
        if (authError.message.includes('User already registered')) {
          errorMessage = 'Este email já está registrado. Tente fazer login.'
        } else if (authError.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
        } else if (authError.message.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique o formato do email.'
        } else if (authError.message.includes('Email rate limit exceeded')) {
          errorMessage = 'Muitas tentativas de registro. Aguarde alguns minutos.'
        } else {
          errorMessage = authError.message
        }
        
        throw new Error(errorMessage)
      }

      if (authData.user) {
        console.log('✅ Usuário criado no Auth:', authData.user.id)
        
        // Aguardar um pouco para o trigger processar
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verificar se o usuário foi criado na tabela users pelo trigger
        let attempts = 0
        const maxAttempts = 5
        let userCreated = false
        
        while (!userCreated && attempts < maxAttempts) {
          attempts++
          
          const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('id, email, name, role')
            .eq('id', authData.user.id)
            .single()

          if (userData) {
            console.log('✅ Usuário criado automaticamente na tabela users:', userData)
            userCreated = true
            break
          }
          
          if (fetchError && !fetchError.message.includes('No rows')) {
            console.error(`Tentativa ${attempts} - Erro ao verificar usuário:`, fetchError)
          }
          
          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 500 * attempts))
        }

        if (!userCreated) {
          console.error('❌ Usuário não foi criado automaticamente após', maxAttempts, 'tentativas')
          throw new Error('Falha na criação automática do perfil. O trigger pode não estar funcionando. Contate o suporte.')
        }

        // Fazer logout após registro (usuário precisa fazer login)
        await supabase.auth.signOut()
        
        console.log('✅ Registro concluído com sucesso')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar usuário'
      console.error('❌ Erro no registro:', err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setUser(null)
      setAccountContext(null)
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = (): void => {
    setError(null)
  }

  const updateUser = async (userData: Partial<AuthUser>): Promise<void> => {
    if (user) {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            name: userData.name,
            status: userData.status || 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) {
          throw error
        }

      const updatedUser = { ...user, ...userData, updatedAt: new Date() }
      setUser(updatedUser)
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error)
        throw error
      }
    }
  }

  // Função para lidar com a mudança de senha bem-sucedida
  const handlePasswordChanged = async () => {
    if (!tempUser) return
    
    try {
      setIsChangingPassword(true)
      
      // Atualizar o campo password_change_required para false
      const { error } = await supabase
        .from('users')
        .update({ password_change_required: false })
        .eq('id', tempUser.id)
      
      if (error) {
        throw error
      }
      
      // Atualizar o usuário e limpar estados temporários
      const updatedUser = { ...tempUser, password_change_required: false }
      setUser(updatedUser)
      setTempUser(null)
      setPasswordChangeRequired(false)
      setError(null)
      
    } catch (err) {
      console.error('Erro ao atualizar status de mudança de senha:', err)
      setError('Erro ao finalizar mudança de senha. Tente novamente.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Função para lidar com erros na mudança de senha
  const handlePasswordChangeError = (error: string) => {
    setError(error)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    userType,
    accountContext,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    updateUser,
    setAccountContext,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {passwordChangeRequired && tempUser && (
        <PasswordChangeRequired
          user={tempUser}
          onPasswordChanged={handlePasswordChanged}
          onError={handlePasswordChangeError}
          isLoading={isChangingPassword}
        />
      )}
    </AuthContext.Provider>
  )
}

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
} 