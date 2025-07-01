export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'operador'
  avatar?: string
  active: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  clearError: () => void
  updateUser: (userData: Partial<User>) => void
}

export interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: User['role'][]
  redirectTo?: string
}

export interface SessionData {
  user: User
  token: string
  expiresAt: Date
}

export interface Permission {
  resource: string
  actions: string[]
}

export interface RolePermissions {
  admin: Permission[]
  supervisor: Permission[]
  operador: Permission[]
} 