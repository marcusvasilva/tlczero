// Export all types
export * from './account'  // Nova estrutura de accounts (inclui compatibilidade Client)
export * from './space'
export * from './collection' 
export * from './operator'  // Nova estrutura de users (inclui compatibilidade Operator)
export * from './dashboard'
export type { ProtectedRouteProps } from './auth'  // Exportando apenas ProtectedRouteProps para evitar conflito
export * from './database' // Tipos da database

// Common utility types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FormValidationError {
  field: string
  message: string
}

export interface FilterOptions {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

export interface FileUploadResponse extends ApiResponse<string> {
  url?: string
  filename?: string
  size?: number
} 