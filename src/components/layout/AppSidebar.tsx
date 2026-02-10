import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  MapPin,
  ClipboardList,
  Users,
  UserCog,
  FileText,
  X,
  User,
  LogOut,
  ChevronUp
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Logo } from '@/components/common/Logo'
import { SimpleThemeToggle } from '@/components/common/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AppSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  roles?: ('admin' | 'distributor' | 'supervisor' | 'operator')[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Building2, label: 'Clientes', roles: ['admin', 'distributor'] },
  { to: '/spaces', icon: MapPin, label: 'Espaços' },
  { to: '/collections', icon: ClipboardList, label: 'Coletas' },
  { to: '/operators', icon: Users, label: 'Operadores', roles: ['admin', 'distributor', 'supervisor'] },
  { to: '/user-management', icon: UserCog, label: 'Usuários', roles: ['admin', 'distributor'] },
  { to: '/reports', icon: FileText, label: 'Relatórios', roles: ['admin', 'distributor', 'supervisor'] },
]

const roleBadges: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  distributor: { label: 'Distribuidor', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  supervisor: { label: 'Supervisor', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  operator: { label: 'Operador', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { user, userType, logout } = useAuthContext()
  const badge = roleBadges[userType] || roleBadges.operator

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userType)
  })

  const sidebarClass = isOpen ? 'translate-x-0' : '-translate-x-full'

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={"fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 " + sidebarClass}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">TLC Zero</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors " +
                (isActive
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800')
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center justify-between mb-2">
            <SimpleThemeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="h-8 w-8 shrink-0 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <User className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'Usuário'}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <div className="px-2 py-1.5">
                <div className="font-medium text-sm">{user?.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
              <DropdownMenuItem onClick={() => logout()} className="text-red-600 dark:text-red-400 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}
