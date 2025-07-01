import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { hasPermission } from '@/data'
import type { ProtectedRouteProps } from '@/types'

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, user, isLoading } = useAuthContext()
  const location = useLocation()

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
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

  const hasAccess = hasPermission(user.role, resource, action)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Hook para verificar permissões em componentes
export const usePermissions = () => {
  const { user } = useAuthContext()

  const checkPermission = (resource: string, action: string): boolean => {
    if (!user) return false
    return hasPermission(user.role, resource, action)
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