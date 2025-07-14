import type { Tables, TablesInsert, TablesUpdate } from './database'

// Tipos baseados na nova estrutura da database
export type Account = Tables<'accounts'>
export type CreateAccountData = TablesInsert<'accounts'>
export type UpdateAccountData = TablesUpdate<'accounts'>

// Interfaces adicionais para facilitar o uso
export interface AccountWithStats extends Account {
  totalSpaces?: number
  totalCollections?: number
  totalWeight?: number
  activeSpaces?: number
}

export interface AccountFormData {
  company_name: string
  contact_person: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  cep?: string
  cnpj?: string
}

// Para compatibilidade temporária com o código existente
export interface Client extends Account {}
export interface CreateClientData extends CreateAccountData {}
export interface UpdateClientData extends UpdateAccountData {} 