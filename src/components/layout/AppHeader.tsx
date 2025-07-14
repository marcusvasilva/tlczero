import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useSidebar } from './AppLayout'

// Mapeamento de títulos das páginas
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clientes',
  '/spaces': 'Espaços',
  '/collections': 'Coletas',
  '/operators': 'Operadores',
  '/user-management': 'Gestão de Usuários',
  '/reports': 'Relatórios',
  '/settings': 'Configurações'
}

// Breadcrumbs simulados
const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = []
  
  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    const title = pageTitles[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({
      title,
      href: currentPath,
      isLast: currentPath === pathname
    })
  }
  
  return breadcrumbs
}

export function AppHeader() {
  const location = useLocation()
  const { user, logout } = useAuthContext()
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebar()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const currentPageTitle = pageTitles[location.pathname] || 'TLC Zero'
  const breadcrumbs = getBreadcrumbs(location.pathname)

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const getRoleName = (role: string) => {
    const roleNames = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      operador: 'Operador'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch)
  }

  return (
    <header className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 sticky top-0 z-40">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Mobile Menu Button + Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-initial">
          {/* Menu Mobile */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Título da Página */}
          <div className="min-w-0 flex-1 lg:flex-initial">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {currentPageTitle}
            </h1>
            {/* Breadcrumbs - oculto em mobile */}
            {breadcrumbs.length > 0 && (
              <nav className="hidden sm:flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <span>Início</span>
                {breadcrumbs.map((crumb) => (
                  <div key={crumb.href} className="flex items-center">
                    <span className="mx-1">/</span>
                    <span className={crumb.isLast ? 'text-gray-900 dark:text-white font-medium' : ''}>
                      {crumb.title}
                    </span>
                  </div>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Desktop Search */}
        <div className="hidden lg:flex flex-1 max-w-lg mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes, espaços, coletas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Search Toggle */}
          <button
            onClick={toggleMobileSearch}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">{getRoleName(user?.role || '')}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configurações
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes, espaços, coletas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Overlay para fechar menus */}
      {(showUserMenu || showMobileSearch) && (
          <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false)
            setShowMobileSearch(false)
          }}
          />
        )}
    </header>
  )
} 