import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { AuthUser, AuthContextType, LoginCredentials, RegisterData } from '@/types/auth'
import { supabase } from '@/lib/supabase'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
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

  // Refs para controle de estado sem re-renders
  const userRef = useRef<AuthUser | null>(null)
  const isFetchingRef = useRef(false)
  const fetchPromiseRef = useRef<Promise<{ user: AuthUser | null; reason?: 'inactive' | 'error' }> | null>(null)
  const lastFetchedUserRef = useRef<AuthUser | null>(null)
  const lastFetchTimeRef = useRef(0)
  const processedEventsRef = useRef(new Set<string>())
  const profileRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const profileRetryAttemptsRef = useRef(0)

  userRef.current = user

  const userType: 'admin' | 'distributor' | 'supervisor' | 'operator' = useMemo(() => {
    if (!user) return 'operator'
    return user.role
  }, [user])

  const buildFallbackUser = useCallback((supabaseUser: SupabaseUser): AuthUser => {
    const metadata = (supabaseUser.user_metadata || {}) as Record<string, any>

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: metadata.name || supabaseUser.email || 'Usuário',
      role: (metadata.role as AuthUser['role']) || 'operator',
      account_id: metadata.account_id || null,
      supervisor_id: metadata.supervisor_id || null,
      phone: metadata.phone || null,
      cpf: metadata.cpf || null,
      status: (metadata.status as 'active' | 'inactive' | null) || 'active',
      password_change_required: Boolean(metadata.password_change_required),
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at,
    }
  }, [])

  // Atualizar accountContext quando user muda
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'distributor') {
        setAccountContext(null)
      } else {
        setAccountContext(user.account_id)
      }
    } else {
      setAccountContext(null)
    }
  }, [user])

  // Buscar dados do usuário na tabela users (com proteção contra loops)
  const fetchUserData = useCallback(async (
    supabaseUser: SupabaseUser
  ): Promise<{ user: AuthUser | null; reason?: 'inactive' | 'error' }> => {
    // Se já existe uma busca em andamento, reutilizar a mesma promise
    if (isFetchingRef.current && fetchPromiseRef.current) {
      console.log('fetchUserData: reutilizando busca em andamento')
      return fetchPromiseRef.current
    }

    // Proteção contra chamadas em loop - mínimo 500ms entre chamadas
    const now = Date.now()
    if (now - lastFetchTimeRef.current < 500) {
      console.log('fetchUserData: throttled (chamada muito rápida)')
      return { user: lastFetchedUserRef.current || userRef.current || null }
    }

    // Proteção contra chamadas simultâneas
    if (isFetchingRef.current && fetchPromiseRef.current) {
      console.log('fetchUserData: já está buscando')
      return fetchPromiseRef.current
    }

    isFetchingRef.current = true
    lastFetchTimeRef.current = now

    const fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

        if (error || !data) {
          console.error('Erro ao buscar usuário:', error?.message)
          return { user: null, reason: 'error' }
        }

        if (data.status !== 'active') {
          console.log('Usuário inativo')
          return { user: null, reason: 'inactive' }
        }

        const userPayload: AuthUser = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as 'admin' | 'distributor' | 'supervisor' | 'operator',
          account_id: data.account_id,
          supervisor_id: data.supervisor_id,
          phone: data.phone,
          cpf: data.cpf,
          status: data.status,
          password_change_required: data.password_change_required || false,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }

        lastFetchedUserRef.current = userPayload
        return { user: userPayload }
      } catch (err) {
        console.error('Erro inesperado ao buscar usuário:', err)
        return { user: null, reason: 'error' }
      } finally {
        isFetchingRef.current = false
        fetchPromiseRef.current = null
      }
    })()

    fetchPromiseRef.current = fetchPromise
    return fetchPromise
  }, [])

  const resetProfileRetry = useCallback(() => {
    profileRetryAttemptsRef.current = 0
    if (profileRetryTimeoutRef.current) {
      clearTimeout(profileRetryTimeoutRef.current)
      profileRetryTimeoutRef.current = null
    }
  }, [])

  const scheduleProfileRetry = useCallback(() => {
    if (profileRetryTimeoutRef.current || profileRetryAttemptsRef.current >= 3) return

    const attemptRevalidate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { user: refreshedUser, reason } = await fetchUserData(session.user)
          if (refreshedUser) {
            resetProfileRetry()
            setUser(refreshedUser)
            setError(null)
            setIsLoading(false)
            return
          }

          if (reason === 'inactive') {
            resetProfileRetry()
            await supabase.auth.signOut()
            setUser(null)
            setError('Conta desativada. Contate o administrador.')
            return
          }
        }
      } catch (retryError) {
        console.error('Erro ao tentar revalidar perfil:', retryError)
      }

      if (profileRetryAttemptsRef.current < 3) {
        profileRetryTimeoutRef.current = setTimeout(() => {
          profileRetryAttemptsRef.current += 1
          void attemptRevalidate()
        }, 3000)
      } else {
        profileRetryTimeoutRef.current = null
      }
    }

    profileRetryAttemptsRef.current += 1
    profileRetryTimeoutRef.current = setTimeout(() => {
      void attemptRevalidate()
    }, 1500)
  }, [fetchUserData, resetProfileRetry])

  // Processar sessão (chamado por onAuthStateChange)
  const handleSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      resetProfileRetry()
      setUser(null)
      setError(null)
      return
    }

    try {
      const fetchResultPromise = fetchUserData(session.user)
      const fetchResult = await Promise.race([
        fetchResultPromise,
        new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), 5000))
      ])

      if (fetchResult === 'timeout') {
        console.warn('fetchUserData: timeout - usando fallback e revalidando em seguida')
        isFetchingRef.current = false
        fetchPromiseRef.current = null
        const fallbackUser = buildFallbackUser(session.user)
        lastFetchedUserRef.current = fallbackUser
        setUser(prev => prev ?? fallbackUser)
        setError('Não foi possível validar seu perfil agora. Tentaremos novamente em instantes.')
        scheduleProfileRetry()
        return
      }

      const { user: userData, reason } = fetchResult

      if (userData) {
        resetProfileRetry()
        setUser(userData)
        setError(null)
        return
      }

      if (reason === 'inactive') {
        resetProfileRetry()
        await supabase.auth.signOut()
        setUser(null)
        setError('Conta desativada. Contate o administrador.')
        return
      }

      // Falha momentânea de leitura do perfil - manter sessão ativa com dados do token
      const fallbackUser = buildFallbackUser(session.user)
      setUser(prev => prev ?? fallbackUser)
      setError('Não foi possível validar seu perfil agora. Tentaremos novamente em instantes.')
      scheduleProfileRetry()
    } catch (err) {
      console.error('Erro ao processar sessão:', err)
      setError('Erro ao validar sessão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }, [buildFallbackUser, fetchUserData, resetProfileRetry, scheduleProfileRetry])

  const attemptSessionRecovery = useCallback(async () => {
    try {
      const { data: refreshData, error } = await supabase.auth.refreshSession()
      if (error || !refreshData.session) {
        return false
      }

      await handleSession(refreshData.session)
      return true
    } catch (err) {
      console.error('Erro ao tentar recuperar sessão:', err)
      return false
    }
  }, [handleSession])

  // Configurar listener de autenticação (padrão oficial Supabase)
  useEffect(() => {
    // O listener onAuthStateChange é a forma RECOMENDADA de gerenciar sessão
    // Ele emite INITIAL_SESSION na inicialização com a sessão atual (ou null)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Criar chave única para evitar processar mesmo evento múltiplas vezes
        const eventKey = `${event}-${session?.user?.id || 'none'}-${Math.floor(Date.now() / 1000)}`

        // Ignorar eventos já processados no mesmo segundo
        if (processedEventsRef.current.has(eventKey)) {
          console.log('Auth event ignorado (duplicado):', event)
          return
        }

        // Limpar eventos antigos (mais de 5 segundos)
        const now = Math.floor(Date.now() / 1000)
        processedEventsRef.current.forEach(key => {
          const keyTime = parseInt(key.split('-').pop() || '0')
          if (now - keyTime > 5) {
            processedEventsRef.current.delete(key)
          }
        })

        processedEventsRef.current.add(eventKey)
        console.log('Auth event:', event)

        switch (event) {
          case 'INITIAL_SESSION':
            // Sessão inicial ao carregar o app
            await handleSession(session)
            break

          case 'SIGNED_IN':
            // Usuário fez login - só processar se não temos usuário
            if (!userRef.current) {
              await handleSession(session)
            }
            break

          case 'TOKEN_REFRESHED':
            // Token foi renovado automaticamente - atualizar dados do usuário
            await handleSession(session)
            break

          case 'SIGNED_OUT':
            // Usuário fez logout
            setUser(null)
            setError(null)
            setIsLoading(false)
            break

          case 'USER_UPDATED':
            // Dados do usuário foram atualizados
            await handleSession(session)
            break
        }
      }
    )

    // Verificar sessão quando app volta do background (com throttle)
    let lastVisibilityCheck = 0
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Throttle: mínimo 3 segundos entre verificações
        const now = Date.now()
        if (now - lastVisibilityCheck < 3000) {
          console.log('Visibility check: throttled')
          return
        }
        lastVisibilityCheck = now

        console.log('App voltou ao foco - verificando sessão')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Erro ao verificar sessão:', error.message)
          // Tentar refresh apenas se temos um usuário logado
          if (userRef.current) {
            const recovered = await attemptSessionRecovery()
            if (!recovered) {
              setError('Não conseguimos validar sua sessão. Verifique sua conexão.')
            }
          }
          return
        }

        if (!session && userRef.current) {
          // Tinha usuário mas não tem mais sessão - tentar recuperar antes de deslogar
          const recovered = await attemptSessionRecovery()
          if (!recovered) {
            setUser(null)
            setError('Sessão expirada. Faça login novamente.')
          }
        } else if (session && !userRef.current && !isLoading) {
          // Tem sessão mas não tem usuário carregado (e não está carregando)
          await handleSession(session)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      resetProfileRetry()
    }
  }, [attemptSessionRecovery, handleSession, isLoading, resetProfileRetry])

  // Bootstrap inicial para garantir que isLoading seja liberado mesmo se o listener não responder
  useEffect(() => {
    let cancelled = false
    const safetyTimer = setTimeout(() => {
      if (!cancelled && isLoading) {
        console.warn('Tempo limite ao validar sessão inicial. Liberando isLoading.')
        setIsLoading(false)
      }
    }, 8000)

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (cancelled) return

        if (error) {
          console.error('Erro no bootstrap de sessão:', error.message)
          setError('Erro ao validar sessão inicial.')
          setIsLoading(false)
          return
        }

        await handleSession(data.session)
      } catch (err) {
        if (!cancelled) {
          console.error('Erro inesperado no bootstrap de sessão:', err)
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      clearTimeout(safetyTimer)
    }
  }, [handleSession, isLoading])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        let errorMessage = 'Erro ao fazer login'
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos.'
        } else {
          errorMessage = error.message
        }
        throw new Error(errorMessage)
      }

      if (data.user) {
        const { user: userData, reason } = await fetchUserData(data.user)

        if (reason === 'inactive') {
          await supabase.auth.signOut()
          throw new Error('Conta desativada. Contate o administrador.')
        }

        if (userData) {
          resetProfileRetry()
        }

        const resolvedUser = userData || buildFallbackUser(data.user)

        if (!userData) {
          setError('Não conseguimos validar seu perfil agora. Continuando com a sessão e tentando sincronizar.')
          scheduleProfileRetry()
        }

        if (resolvedUser.password_change_required) {
          setTempUser(resolvedUser)
          setPasswordChangeRequired(true)
          setIsLoading(false)
          return
        }

        setUser(resolvedUser)
      }
    } catch (err) {
      console.error('Erro no login:', err)
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
            phone: data.phone,
            account_id: data.account_id,
            supervisor_id: data.supervisor_id
          }
        }
      })

      if (authError) {
        let errorMessage = 'Erro ao registrar'
        if (authError.message.includes('User already registered')) {
          errorMessage = 'Este email já está registrado.'
        } else if (authError.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
        } else {
          errorMessage = authError.message
        }
        throw new Error(errorMessage)
      }

      if (authData.user) {
        // Aguardar trigger criar o usuário
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Verificar se foi criado
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', authData.user.id)
          .single()

        if (!userData) {
          throw new Error('Falha na criação do perfil. Contate o suporte.')
        }

        // Fazer logout após registro
        await supabase.auth.signOut()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar'
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
      resetProfileRetry()
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
    if (!user) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          status: userData.status || 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, ...userData })
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      throw error
    }
  }

  const handlePasswordChanged = async () => {
    if (!tempUser) return

    try {
      setIsChangingPassword(true)

      const { error } = await supabase
        .from('users')
        .update({ password_change_required: false })
        .eq('id', tempUser.id)

      if (error) throw error

      setUser({ ...tempUser, password_change_required: false })
      setTempUser(null)
      setPasswordChangeRequired(false)
      setError(null)
    } catch (err) {
      console.error('Erro ao atualizar status de senha:', err)
      setError('Erro ao finalizar mudança de senha.')
    } finally {
      setIsChangingPassword(false)
    }
  }

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
