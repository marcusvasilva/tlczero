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
  
  // Referencias para controle de timeout e debug
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializing = useRef(true)
  const lastSessionCheck = useRef<number>(0)
  const isProcessing = useRef(false)

  // Determinar o tipo de usuário baseado no role
  const userType: 'admin' | 'supervisor' | 'operator' = useMemo(() => {
    if (!user) return 'operator'
    if (user.role === 'admin') return 'admin'
    if (user.role === 'supervisor') return 'supervisor'
    return 'operator'
  }, [user])

  // Definir accountContext automaticamente baseado no usuário logado
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        // Admin vê todos os dados
        setAccountContext(null)
      } else {
        // Supervisor e operador veem apenas dados da sua conta
        setAccountContext(user.account_id)
      }
    } else {
      setAccountContext(null)
    }
  }, [user])

  // Timeout de segurança reduzido para evitar loading infinito
  const setAuthTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      console.warn('⚠️ Timeout na verificação de autenticação (10s) - forçando reset')
      setIsLoading(false)
      isProcessing.current = false
      setError('Timeout na verificação de autenticação. Tente recarregar a página.')
    }, 10000) // Reduzido para 10 segundos
  }

  const clearAuthTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Função para buscar dados do usuário no Supabase
  const fetchUserData = async (supabaseUser: SupabaseUser): Promise<AuthUser | null> => {
    try {
      console.log('🔍 Buscando dados do usuário:', supabaseUser.id)
      
      if (!supabaseUser.id) {
        console.log('❌ ID do usuário não encontrado')
        return null
      }

      // Busca simples sem lógica complexa
      const { data: dbUserData, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          account_id,
          supervisor_id,
          phone,
          cpf,
          status,
          password_change_required,
          created_at,
          updated_at
        `)
        .eq('id', supabaseUser.id)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar usuário na tabela:', error.message)
        return null
      }

      if (!dbUserData) {
        console.log('❌ Dados do usuário não encontrados na tabela public.users')
        return null
      }

      const userData: AuthUser = {
        id: dbUserData.id,
        email: dbUserData.email,
        name: dbUserData.name,
        role: dbUserData.role as 'admin' | 'supervisor' | 'operator',
        account_id: dbUserData.account_id,
        supervisor_id: dbUserData.supervisor_id,
        phone: dbUserData.phone,
        cpf: dbUserData.cpf,
        status: dbUserData.status,
        password_change_required: dbUserData.password_change_required || false,
        created_at: dbUserData.created_at,
        updated_at: dbUserData.updated_at,
      }

      console.log('✅ Dados do usuário carregados:', { id: userData.id, role: userData.role, status: userData.status })
      return userData
    } catch (err) {
      console.error('❌ Erro inesperado ao buscar dados do usuário:', err)
      return null
    }
  }

  // Verificar sessão inicial com proteções otimizadas
  useEffect(() => {
    let isMounted = true
    
    const checkSession = async () => {
      // Evitar múltiplas verificações simultâneas
      if (isProcessing.current) {
        console.log('⏭️ Verificação de sessão já em andamento')
        return
      }
      
      const now = Date.now()
      
      // Evitar múltiplas verificações muito próximas
      if (now - lastSessionCheck.current < 2000 && !isInitializing.current) {
        console.log('⏭️ Pulando verificação de sessão (muito recente)')
        return
      }
      
      isProcessing.current = true
      lastSessionCheck.current = now
      
      try {
        console.log('🔄 Verificando sessão inicial...')
        setAuthTimeout() // Iniciar timeout de segurança
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão:', sessionError)
          throw sessionError
        }
    
        if (!isMounted) return // Componente foi desmontado
        
        if (session?.user) {
          console.log('👤 Sessão encontrada, buscando dados do usuário')
          const userData = await fetchUserData(session.user)
          
          if (!isMounted) return
          
          if (userData && userData.status === 'active') {
            console.log('✅ Usuário autenticado com sucesso')
            setUser(userData)
            setError(null)
          } else {
            console.log('❌ Usuário inativo ou dados inválidos, fazendo logout')
            await supabase.auth.signOut()
            setUser(null)
            setError('Conta inativa. Contate o administrador.')
          }
        } else {
          console.log('❌ Nenhuma sessão encontrada')
          setUser(null)
          setError(null)
        }
      } catch (err) {
        console.error('❌ Erro ao verificar sessão:', err)
        if (isMounted) {
          setUser(null)
          setError('Erro ao verificar autenticação. Tente fazer login novamente.')
        }
      } finally {
        if (isMounted) {
          clearAuthTimeout()
          setIsLoading(false)
          isInitializing.current = false
          isProcessing.current = false
          console.log('✅ Verificação de sessão concluída')
        }
      }
    }

    checkSession()

    // Escutar mudanças na autenticação com proteções otimizadas
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted || isProcessing.current) return
        
        console.log('🔔 Auth state change:', event)
        
        // Evitar processar eventos duplicados muito próximos
        const now = Date.now()
        if (now - lastSessionCheck.current < 1000 && event !== 'SIGNED_OUT') {
          console.log('⏭️ Ignorando evento auth duplicado')
          return
        }
        
        isProcessing.current = true
        lastSessionCheck.current = now
        
        try {
          if (session?.user && event !== 'SIGNED_OUT') {
            console.log('👤 Processando nova sessão')
            const userData = await fetchUserData(session.user)
            
            if (!isMounted) return
            
            if (userData && userData.status === 'active') {
              setUser(userData)
              setError(null)
            } else {
              console.log('❌ Dados inválidos na mudança de auth, fazendo logout')
              setUser(null)
            }
          } else {
            console.log('🚪 Usuário deslogado')
            setUser(null)
            setError(null)
          }
        } catch (err) {
          console.error('❌ Erro no auth state change:', err)
          if (isMounted) {
            setUser(null)
          }
        } finally {
          if (isMounted) {
            isProcessing.current = false
            if (isInitializing.current) {
              setIsLoading(false)
              isInitializing.current = false
            }
          }
        }
      }
    )

    return () => {
      isMounted = false
      clearAuthTimeout()
      isProcessing.current = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    if (isProcessing.current) {
      console.log('⏭️ Login já em andamento')
      return
    }
    
    setIsLoading(true)
    setError(null)
    isProcessing.current = true
    
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
      isProcessing.current = false
    }
  }

  const register = async (data: RegisterData): Promise<void> => {
    if (isProcessing.current) {
      console.log('⏭️ Registro já em andamento')
      return
    }

    setIsLoading(true)
    setError(null)
    isProcessing.current = true

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
      isProcessing.current = false
    }
  }

  const logout = async (): Promise<void> => {
    if (isProcessing.current) {
      console.log('⏭️ Logout já em andamento')
      return
    }

    setIsLoading(true)
    isProcessing.current = true
    try {
      await supabase.auth.signOut()
    setUser(null)
    setAccountContext(null)
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    } finally {
      setIsLoading(false)
      isProcessing.current = false
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