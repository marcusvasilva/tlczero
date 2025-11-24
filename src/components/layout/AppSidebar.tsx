import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  MapPin,
  ClipboardList,
  PlusCircle,
  Users,
  UserCog,
  FileText,
  X
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Logo } from '@/components/common/Logo'

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
  { to: '/clients', icon: Building2, label: 'Clientes' },
  { to: '/spaces', icon: MapPin, label: 'Espaços' },
  { to: '/collections', icon: ClipboardList, label: 'Coletas' },
  { to: '/collect', icon: PlusCircle, label: 'Nova Coleta' },
  { to: '/operators', icon: Users, label: 'Operadores', roles: ['admin', 'distributor', 'supervisor'] },
  { to: '/user-management', icon: UserCog, label: 'Usuários', roles: ['admin', 'distributor'] },
  { to: '/reports', icon: FileText, label: 'Relatórios', roles: ['admin', 'distributor', 'supervisor'] },
]

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { userType } = useAuthContext()

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

      <aside className={"fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 " + sidebarClass}>
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

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            TLC Zero v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
