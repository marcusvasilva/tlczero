import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import type { ProtectedRouteProps } from '@/types'
import AuthEmergencyReset from './AuthEmergencyReset'

// Função de permissões inline (substituindo import removido)
const rolePermissions = {
  admin: [
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'operators', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'spaces', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'collections', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['create', 'read', 'update', 'delete'] }
  ],
  distributor: [
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'operators', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'spaces', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'collections', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'settings', actions: ['read'] }
  ],
  supervisor: [
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'operators', actions: ['read'] },
    { resource: 'spaces', actions: ['create', 'read', 'update'] },
    { resource: 'collections', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] }
  ],
  operator: [
    { resource: 'collections', actions: ['create', 'read'] },
    { resource: 'spaces', actions: ['read'] }
  ]
}

const hasPermission = (role: 'admin' | 'distributor' | 'supervisor' | 'operator', resource: string, action: string): boolean => {
  const permissions = rolePermissions[role]
  const resourcePermission = permissions.find(p => p.resource === resource)
  return resourcePermission?.actions.includes(action) ?? false
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, user, isLoading, error } = useAuthContext()
  const location = useLocation()
  const [showEmergency, setShowEmergency] = useState(false)
  const [loadingStartTime] = useState(Date.now())

  // Detectar loading muito longo e mostrar opções de emergência
  useEffect(() => {
    if (!isLoading) {
      setShowEmergency(false)
      return
    }

    const timer = setTimeout(() => {
      setShowEmergency(true)
    }, 10000) // 10 segundos

    return () => clearTimeout(timer)
  }, [isLoading])

  const handleEmergencyReset = () => {
    setShowEmergency(false)
    window.location.reload()
  }

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando autenticação...</p>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {Math.floor((Date.now() - loadingStartTime) / 1000)}s
            </p>
          </div>
        </div>
        
        <AuthEmergencyReset
          isVisible={showEmergency}
          onReset={handleEmergencyReset}
        />
      </>
    )
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Verificar permissões de role se especificadas
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <p className="text-sm text-gray-500">
              Role necessária: {allowedRoles.join(', ')} | Sua role: {user.role}
            </p>
          </div>
        </div>
      )
    }
  }

  // Renderizar componente se tudo ok
  return <>{children}</>
}

// Componente para verificar permissões específicas
interface PermissionGuardProps {
  children: React.ReactNode
  resource: string
  action: string
  fallback?: React.ReactNode
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  fallback = null
}) => {
  const { user } = useAuthContext()

  if (!user) {
    return <>{fallback}</>
  }

  const hasAccess = hasPermission(user.role as 'admin' | 'distributor' | 'supervisor' | 'operator', resource, action)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Hook para verificar permissões em componentes
export const usePermissions = () => {
  const { user } = useAuthContext()

  const checkPermission = (resource: string, action: string): boolean => {
    if (!user) return false
    return hasPermission(user.role as 'admin' | 'distributor' | 'supervisor' | 'operator', resource, action)
  }

  const canCreate = (resource: string) => checkPermission(resource, 'create')
  const canRead = (resource: string) => checkPermission(resource, 'read')
  const canUpdate = (resource: string) => checkPermission(resource, 'update')
  const canDelete = (resource: string) => checkPermission(resource, 'delete')

  return {
    checkPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    userRole: user?.role
  }
} 