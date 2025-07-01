// Export all types
export * from './client'
export * from './space'
export * from './collection'
export * from './operator'
export * from './dashboard'
export * from './auth'

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