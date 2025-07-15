import { Link, useLocation } from 'react-router-dom'
import { useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
  MapPin,
  Shield, // Novo ícone para gestão de usuários
  X,
  ClipboardList
} from 'lucide-react'
import { APP_CONFIG } from '@/lib/constants'
import { useAuthContext } from '@/contexts/AuthContext'
import { useSidebar } from './AppLayout'
import { useMobile } from '@/hooks/use-mobile'
// Função de permissões inline (substituindo import removido)
const rolePermissions = {
  admin: [
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'operators', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'spaces', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'collections', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'dashboard', actions: ['read'] }
  ],
  supervisor: [
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'operators', actions: ['read'] },
    { resource: 'spaces', actions: ['create', 'read', 'update'] },
    { resource: 'collections', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] }
  ],
  operador: [
    { resource: 'collections', actions: ['create', 'read'] },
    { resource: 'spaces', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] }
  ]
}

const hasPermission = (role: 'admin' | 'supervisor' | 'operador', resource: string, action: string): boolean => {
  const permissions = rolePermissions[role]
  const resourcePermission = permissions.find(p => p.resource === resource)
  return resourcePermission?.actions.includes(action) ?? false
}

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
    icon: ClipboardList,
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
    title: 'Gestão de Usuários',
    href: '/user-management',
    icon: Shield,
    description: 'Gerenciar usuários e senhas',
    allowedRoles: ['admin']
  },
  {
    title: 'Relatórios',
    href: '/reports',
    icon: FileText,
    description: 'Análises e exports',
    resource: 'reports',
    action: 'read',
    allowedRoles: ['admin', 'supervisor']
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuthContext()
  const { isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen } = useSidebar()
  const isMobile = useMobile()

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
        return hasPermission(user.role as 'admin' | 'supervisor' | 'operador', item.resource, item.action)
      }
      
      return true
    })
  }, [user])

  // Memoizar a função getRoleBadge
  const getRoleBadge = useCallback((role: 'admin' | 'supervisor' | 'operador') => {
    const badges = {
      admin: { text: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      supervisor: { text: 'Supervisor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      operador: { text: 'Operador', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' }
    }
    return badges[role] || { text: role, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
  }, [])

  // Memoizar o toggle da sidebar
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed, setIsCollapsed])

  // Fechar menu mobile ao clicar em um link
  const handleLinkClick = useCallback((itemTitle: string, itemHref: string) => {
    return () => {
      console.log(`🔗 Clique no link: ${itemTitle} -> ${itemHref}`)
      if (isMobile) {
        setIsMobileMenuOpen(false)
      }
    }
  }, [isMobile, setIsMobileMenuOpen])

  // Fechar menu mobile
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [setIsMobileMenuOpen])

  // Memoizar a verificação de permissão para configurações
  const canAccessSettings = useMemo(() => {
    return user ? hasPermission(user.role as 'admin' | 'supervisor' | 'operador', 'settings', 'read') : false
  }, [user])

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col h-full",
      // Desktop styles
      "lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-40",
      !isMobile && (isCollapsed ? "lg:w-16" : "lg:w-64"),
      // Mobile styles - precisa estar hidden por padrão e só aparecer quando aberto
      isMobile && isMobileMenuOpen && "fixed inset-y-0 left-0 z-50 w-64",
      isMobile && !isMobileMenuOpen && "hidden"
    )}>
      {/* Header da Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Logo - sempre mostrar em mobile, condicional em desktop */}
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-2 flex-1">
            <img src="/logo.svg" alt="TLC Zero" className="h-6 w-6 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {APP_CONFIG.name}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                v{APP_CONFIG.version}
              </p>
            </div>
          </div>
        )}
        
        {/* Botões de controle */}
        <div className="flex items-center gap-2">
          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={closeMobileMenu}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Desktop Toggle Button */}
          {!isMobile && (
        <button
          onClick={toggleCollapsed}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target"
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
          )}
        </div>
      </div>

      {/* Info do Usuário - apenas no desktop quando não colapsado */}
      {!isMobile && !isCollapsed && user && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(user.role as 'admin' | 'supervisor' | 'operador').color}`}>
                  {getRoleBadge(user.role as 'admin' | 'supervisor' | 'operador').text}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegação Principal */}
      <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.href} to={item.href} onClick={handleLinkClick(item.title, item.href)}>
              <div
                className={cn(
                  "flex items-center gap-3 h-12 px-3 rounded-md transition-colors touch-target",
                  isActive 
                    ? "bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-400" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
                  isCollapsed && !isMobile && "justify-center"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {(!isCollapsed || isMobile) && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                    {item.description && (
                        <div className="text-xs opacity-60 truncate">{item.description}</div>
                    )}
                  </div>
                    {item.badge && (
                      <span className="ml-auto px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full flex-shrink-0">
                    {item.badge}
                  </span>
                    )}
                  </>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Separador */}
      <div className="mx-2 border-t border-gray-200 dark:border-gray-700"></div>

      {/* Seção de Configurações */}
      {user && canAccessSettings && (
        <div className="p-2">
          <Link to="/settings" onClick={handleLinkClick("Configurações", "/settings")}>
            <div
              className={cn(
                "flex items-center gap-3 h-12 px-3 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white touch-target",
                isCollapsed && !isMobile && "justify-center"
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && (
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium truncate">Configurações</div>
                  <div className="text-xs opacity-60 truncate">Ajustes do sistema</div>
                </div>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* Rodapé da Sidebar - apenas desktop quando não colapsado */}
      {!isMobile && !isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {APP_CONFIG.description}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              © 2024 TLC Zero
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 