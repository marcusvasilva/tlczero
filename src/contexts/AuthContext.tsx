import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { User, AuthContextType, LoginCredentials } from '@/types/auth'
import { mockUsers, mockCredentials } from '@/data/mockUsers'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientContext, setClientContext] = useState<string | null>(null)

  // Determinar o tipo de usuário baseado no role
  const userType: 'admin' | 'client' | 'operator' = useMemo(() => {
    if (!user) return 'operator'
    return user.role === 'admin' 
      ? 'admin' 
      : user.role === 'supervisor' 
        ? 'client' 
        : 'operator'
  }, [user])

  // Verificar sessão expirada periodicamente (a cada 5 minutos)
  useEffect(() => {
    const checkSession = () => {
      const savedUser = localStorage.getItem('user')
      const sessionExpiry = localStorage.getItem('sessionExpiry')
      
      if (savedUser && sessionExpiry) {
        const now = new Date().getTime()
        const expiry = parseInt(sessionExpiry)
        
        if (now > expiry) {
          // Sessão expirada
          logout()
          setError('Sua sessão expirou. Faça login novamente.')
        }
      }
    }

    const interval = setInterval(checkSession, 5 * 60 * 1000) // 5 minutos
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const savedUser = localStorage.getItem('user')
    const savedClientContext = localStorage.getItem('clientContext')
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
        if (savedClientContext) {
          setClientContext(savedClientContext)
        }
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('clientContext')
        localStorage.removeItem('sessionExpiry')
      }
    }
    
    setIsLoading(false)
  }, [])

  // Atualizar clientContext quando usuário mudar
  useEffect(() => {
    if (user) {
      if (user.role === 'supervisor' || user.role === 'operador') {
        // Para supervisores e operadores, definir o contexto do cliente automaticamente
        const newClientContext = user.clientId || null
        setClientContext(newClientContext)
        if (newClientContext) {
          localStorage.setItem('clientContext', newClientContext)
        } else {
          localStorage.removeItem('clientContext')
        }
      } else if (user.role === 'admin') {
        // Admin pode não ter contexto de cliente ou pode alternar
        // Manter o contexto atual se existir
      }
    } else {
      setClientContext(null)
      localStorage.removeItem('clientContext')
    }
  }, [user])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar credenciais
      const password = mockCredentials[credentials.email as keyof typeof mockCredentials]
      if (!password || password !== credentials.password) {
        throw new Error('Email ou senha incorretos')
      }
      
      // Buscar usuário nos dados mockados
      const foundUser = mockUsers.find(u => u.email === credentials.email)
      
      if (!foundUser) {
        throw new Error('Usuário não encontrado')
      }

      if (!foundUser.active) {
        throw new Error('Usuário inativo. Entre em contato com o administrador.')
      }
      
      // Atualizar último login
      const updatedUser = {
        ...foundUser,
        lastLogin: new Date()
      }
      
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      // Definir expiração da sessão (24 horas)
      const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000)
      localStorage.setItem('sessionExpiry', expirationTime.toString())
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no login'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setClientContext(null)
    setError(null)
    localStorage.removeItem('user')
    localStorage.removeItem('clientContext')
    localStorage.removeItem('sessionExpiry')
  }

  const clearError = () => {
    setError(null)
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData, updatedAt: new Date() }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const handleSetClientContext = (clientId: string | null) => {
    setClientContext(clientId)
    if (clientId) {
      localStorage.setItem('clientContext', clientId)
    } else {
      localStorage.removeItem('clientContext')
    }
  }

  const contextValue: AuthContextType = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    clearError,
    updateUser,
    userType,
    clientContext,
    setClientContext: handleSetClientContext
  }), [
    user,
    isLoading,
    error,
    userType,
    clientContext
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
} 