import type { User as DatabaseUser } from './operator'

// Usando o tipo User da nova estrutura de database
export type AuthUser = DatabaseUser

// Interfaces para autenticação
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role: 'admin' | 'supervisor' | 'operator'
  phone?: string
  account_id?: string
  supervisor_id?: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  clearError: () => void
  updateUser: (userData: Partial<AuthUser>) => void
  userType: 'admin' | 'supervisor' | 'operator'
  accountContext: string | null
  setAccountContext: (accountId: string | null) => void
}

export interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: AuthUser['role'][]
  redirectTo?: string
}

export interface SessionData {
  user: AuthUser
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
  operator: Permission[]
}

// Para compatibilidade temporária
export interface User extends AuthUser {
  clientId?: string
  active?: boolean
  lastLogin?: Date
  createdAt?: Date
  updatedAt?: Date
} 