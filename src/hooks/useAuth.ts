import { useState, useEffect, useCallback, useMemo } from 'react'
import { mockUsers, mockCredentials } from '@/data'
import { useLocalStorage } from './useLocalStorage'
import type { User, LoginCredentials, AuthState, SessionData } from '@/types'

const SESSION_KEY = 'tlc-session'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 horas em ms

export function useAuth() {
  const [sessionData, setSessionData] = useLocalStorage<SessionData | null>(SESSION_KEY, null)
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  })

  // Verificar se a sessão está próxima do vencimento (30 minutos)
  const isSessionExpiringSoon = useCallback((): boolean => {
    if (!sessionData) return false
    
    const now = new Date()
    const expiresAt = new Date(sessionData.expiresAt)
    const thirtyMinutes = 30 * 60 * 1000
    
    return (expiresAt.getTime() - now.getTime()) < thirtyMinutes
  }, [sessionData])

  // Renovar sessão
  const renewSession = useCallback(() => {
    if (!sessionData) return

    const now = new Date()
    const newExpiresAt = new Date(now.getTime() + SESSION_DURATION)
    const updatedSession = { ...sessionData, expiresAt: newExpiresAt }
    
    setSessionData(updatedSession)
  }, [sessionData, setSessionData])

  // Verificar sessão ao inicializar - usando useMemo para evitar recálculos
  const sessionStatus = useMemo(() => {
    if (!sessionData) return { isValid: false, isExpired: false }
    
    const now = new Date()
    const expiresAt = new Date(sessionData.expiresAt)
    
    return {
      isValid: now < expiresAt,
      isExpired: now >= expiresAt
    }
  }, [sessionData])

  // Efeito para verificar sessão apenas quando sessionData muda
  useEffect(() => {
    if (sessionData) {
      if (sessionStatus.isValid) {
        // Sessão válida
        setAuthState({
          user: sessionData.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      } else if (sessionStatus.isExpired) {
        // Sessão expirada
        setSessionData(null)
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Sessão expirada. Faça login novamente.'
        })
      }
    } else {
      // Sem sessão
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    }
  }, [sessionData, sessionStatus.isValid, sessionStatus.isExpired, setSessionData])

  // Função de login
  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500))

      const { email, password, rememberMe } = credentials

      // Verificar credenciais
      const storedPassword = mockCredentials[email as keyof typeof mockCredentials]
      if (!storedPassword || storedPassword !== password) {
        throw new Error('Email ou senha incorretos')
      }

      // Buscar usuário
      const user = mockUsers.find(u => u.email === email && u.active)
      if (!user) {
        throw new Error('Usuário não encontrado ou inativo')
      }

      // Criar sessão
      const now = new Date()
      const duration = rememberMe ? SESSION_DURATION * 7 : SESSION_DURATION // 7 dias se lembrar
      const expiresAt = new Date(now.getTime() + duration)
      
      const session: SessionData = {
        user: {
          ...user,
          lastLogin: now
        },
        token: `token_${user.id}_${now.getTime()}`, // Token simples para demo
        expiresAt
      }

      // Salvar sessão
      setSessionData(session)

      // Atualizar estado
      setAuthState({
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw error
    }
  }, [setSessionData])

  // Função de logout
  const logout = useCallback(() => {
    setSessionData(null)
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
  }, [setSessionData])

  // Limpar erro
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  // Atualizar dados do usuário
  const updateUser = useCallback((userData: Partial<User>) => {
    if (!authState.user || !sessionData) return

    const updatedUser = { ...authState.user, ...userData, updatedAt: new Date() }
    const updatedSession = { ...sessionData, user: updatedUser }
    
    setSessionData(updatedSession)
    setAuthState(prev => ({ ...prev, user: updatedUser }))
  }, [authState.user, sessionData, setSessionData])

  // Verificar se o usuário tem permissão
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!authState.user) return false
    
    const { rolePermissions } = require('@/data')
    const permissions = rolePermissions[authState.user.role]
    const resourcePermission = permissions.find((p: any) => p.resource === resource)
    return resourcePermission?.actions.includes(action) ?? false
  }, [authState.user])

  return {
    ...authState,
    login,
    logout,
    clearError,
    updateUser,
    hasPermission,
    isSessionExpiringSoon,
    renewSession,
    sessionExpiresAt: sessionData?.expiresAt
  }
} 