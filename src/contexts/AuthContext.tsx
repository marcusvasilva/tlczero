import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks'
import type { AuthContextType } from '@/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth()

  // Verificar sessão expirada periodicamente (a cada 5 minutos)
  useEffect(() => {
    if (!auth.isAuthenticated) return

    const checkSession = () => {
      if (auth.isSessionExpiringSoon()) {
        // Avisar que a sessão está expirando
        console.log('Sessão expirando em breve...')
        
        // Aqui poderia mostrar um modal perguntando se quer renovar
        // Por agora, vamos renovar automaticamente se o usuário estiver ativo
        auth.renewSession()
      }
    }

    const interval = setInterval(checkSession, 5 * 60 * 1000) // 5 minutos
    
    return () => clearInterval(interval)
  }, [auth.isAuthenticated])

  // Renovar sessão em atividade do usuário
  useEffect(() => {
    if (!auth.isAuthenticated) return

    const handleUserActivity = () => {
      if (auth.isSessionExpiringSoon()) {
        auth.renewSession()
      }
    }

    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
    }
  }, [auth.isAuthenticated])

  // Memoizar o valor do contexto para evitar re-renderizações desnecessárias
  const contextValue: AuthContextType = useMemo(() => ({
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    login: auth.login,
    logout: auth.logout,
    clearError: auth.clearError,
    updateUser: auth.updateUser
  }), [
    auth.user,
    auth.isAuthenticated,
    auth.isLoading,
    auth.error,
    auth.login,
    auth.logout,
    auth.clearError,
    auth.updateUser
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider')
  }
  return context
} 