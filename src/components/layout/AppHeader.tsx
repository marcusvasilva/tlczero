import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell,
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

  return (
    <header className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 sticky-header z-40">
      <div className="flex h-16 items-center justify-between mobile-container">
        {/* Mobile Menu Button + Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-initial">
          {/* Menu Mobile */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden touch-target -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors touch-effect"
            aria-label="Toggle menu"
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



        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="relative touch-target text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors touch-effect"
            aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 touch-target text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors touch-effect"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden xs:block text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 xs:w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 slide-in-right">
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
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configurações
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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



      {/* Overlay para fechar menus */}
      {showUserMenu && (
          <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
          onClick={() => {
            setShowUserMenu(false)
          }}
          />
        )}
    </header>
  )
} 