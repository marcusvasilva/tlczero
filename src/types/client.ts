// Import Account from supabase types
import type { Account } from '../lib/supabase'

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  cnpj?: string
  contactPerson?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateClientData {
  name: string
  email?: string
  phone?: string
  address?: string
  cnpj?: string
  contactPerson?: string
}

export interface UpdateClientData extends Partial<CreateClientData> {
  active?: boolean
}

// Re-export Account type from supabase
export type { Account }

// Hook options interface
export interface UseClientsOptions {
  searchTerm?: string
  sortBy?: 'company_name' | 'email' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  filterActive?: boolean
}

// Hook return interface
export interface UseClientsReturn {
  // Data
  clients: Account[]
  filteredClients: Account[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createClient: (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<Account>
  updateClient: (id: string, data: Partial<Account>) => Promise<Account>
  deleteClient: (id: string) => Promise<void>
  
  // Utilities
  clearError: () => void
  refreshClients: () => void
} 