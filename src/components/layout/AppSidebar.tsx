import { Link, useLocation } from 'react-router-dom'
import { useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Bug,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
  MapPin
} from 'lucide-react'
import { APP_CONFIG } from '@/lib/constants'
import { useAuthContext } from '@/contexts/AuthContext'
import { useSidebar } from './AppLayout'
import { hasPermission } from '@/data'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
  resource?: string
  action?: string
  allowedRoles?: string[]
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral e métricas',
    resource: 'dashboard',
    action: 'read'
  },
  {
    title: 'Clientes',
    href: '/clients',
    icon: Users,
    description: 'Gestão de clientes',
    resource: 'clients',
    action: 'read',
    allowedRoles: ['admin']
  },
  {
    title: 'Espaços',
    href: '/spaces',
    icon: Building2,
    description: 'Locais de coleta',
    resource: 'spaces',
    action: 'read'
  },
  {
    title: 'Coletas',
    href: '/collections',
    icon: Bug,
    description: 'Registro de coletas',
    resource: 'collections',
    action: 'read'
  },
  {
    title: 'Operadores',
    href: '/operators',
    icon: MapPin,
    description: 'Equipe de campo',
    resource: 'operators',
    action: 'read',
    allowedRoles: ['admin', 'supervisor']
  },
  {
    title: 'Relatórios',
    href: '/reports',
    icon: FileText,
    description: 'Análises e exports',
    resource: 'reports',
    action: 'read',
    allowedRoles: ['admin', 'supervisor']
  }
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuthContext()
  const { isCollapsed, setIsCollapsed } = useSidebar()

  // Memoizar o cálculo dos itens visíveis
  const visibleItems = useMemo(() => {
    if (!user) return []
    
    return navigationItems.filter(item => {
      // Verificar se o usuário tem a role necessária
      if (item.allowedRoles && !item.allowedRoles.includes(user.role)) {
        return false
      }
      
      // Verificar permissão específica
      if (item.resource && item.action) {
        return hasPermission(user.role, item.resource, item.action)
      }
      
      return true
    })
  }, [user])

  // Memoizar a função getRoleBadge
  const getRoleBadge = useCallback((role: string) => {
    const badges = {
      admin: { text: 'Admin', color: 'bg-red-100 text-red-800' },
      supervisor: { text: 'Supervisor', color: 'bg-blue-100 text-blue-800' },
      operador: { text: 'Operador', color: 'bg-green-100 text-green-800' }
    }
    return badges[role as keyof typeof badges] || { text: role, color: 'bg-gray-100 text-gray-800' }
  }, [])

  // Memoizar o toggle da sidebar
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed, setIsCollapsed])

  // Memoizar a verificação de permissão para configurações
  const canAccessSettings = useMemo(() => {
    return user ? hasPermission(user.role, 'settings', 'read') : false
  }, [user])

  return (
    <div className={cn(
      "fixed left-0 top-0 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen z-40",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header da Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Bug className="h-6 w-6 text-green-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {APP_CONFIG.name}
              </h1>
              <p className="text-xs text-gray-500">
                v{APP_CONFIG.version}
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={toggleCollapsed}
          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md flex items-center justify-center"
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Info do Usuário */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(user.role).color}`}>
                  {getRoleBadge(user.role).text}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegação Principal */}
      <nav className="p-2 space-y-1 flex-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 h-10 px-3 rounded-md transition-colors",
                  isActive 
                    ? "bg-green-100 text-green-900" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.title}</div>
                    {item.description && (
                      <div className="text-xs opacity-60">{item.description}</div>
                    )}
                  </div>
                )}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Separador */}
      <div className="mx-2 border-t border-gray-200"></div>

      {/* Seção de Configurações */}
      {user && canAccessSettings && (
        <div className="p-2">
          <Link to="/settings">
            <div
              className={cn(
                "flex items-center gap-3 h-10 px-3 rounded-md transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                isCollapsed && "justify-center"
              )}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="font-medium">Configurações</div>
                  <div className="text-xs opacity-60">Ajustes do sistema</div>
                </div>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* Rodapé da Sidebar */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {APP_CONFIG.description}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              © 2024 TLC Zero
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 