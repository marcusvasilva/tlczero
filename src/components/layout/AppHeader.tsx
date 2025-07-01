import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'

// Mapeamento de títulos das páginas
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clientes',
  '/spaces': 'Espaços',
  '/collections': 'Coletas',
  '/operators': 'Operadores',
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

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Título da Página e Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentPageTitle}
            </h1>
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-1 text-sm text-gray-500">
                <span>Início</span>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center">
                    <span className="mx-1">/</span>
                    <span className={crumb.isLast ? 'text-gray-900 font-medium' : ''}>
                      {crumb.title}
                    </span>
                  </div>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes, espaços, coletas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Ações do Header */}
        <div className="flex items-center space-x-3">
          {/* Notificações */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Menu do Usuário */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
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
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-green-600 mt-1">{getRoleName(user?.role || '')}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Meu Perfil
                  </button>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configurações
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay para fechar menu */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </div>
    </header>
  )
} 