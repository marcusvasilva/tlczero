import type { Tables, TablesInsert, TablesUpdate } from './database'

// Tipos baseados na nova estrutura da database
export type User = Tables<'users'>
export type CreateUserData = TablesInsert<'users'>
export type UpdateUserData = TablesUpdate<'users'>

// Tipos específicos para diferentes roles
export type AdminUser = User & { role: 'admin'; account_id: null; supervisor_id: null }
export type DistributorUser = User & { role: 'distributor'; account_id: null; supervisor_id: null }
export type SupervisorUser = User & { role: 'supervisor'; account_id: string; supervisor_id: null }
export type OperatorUser = User & { role: 'operator'; account_id: string; supervisor_id: string }

// Interfaces adicionais para facilitar o uso
export interface UserWithRelations extends User {
  account?: {
    id: string
    company_name: string
    contact_person: string
    phone: string
  }
  supervisor?: {
    id: string
    name: string
    email: string
  }
  operators?: OperatorUser[] // Para supervisores
}

export interface UserFormData {
  name: string
  email: string
  phone?: string
  cpf?: string
  role: 'admin' | 'distributor' | 'supervisor' | 'operator'
  account_id?: string
  supervisor_id?: string
  status?: 'active' | 'inactive'
}

export interface UserPerformance {
  userId: string
  userName: string
  totalCollections: number
  totalWeight: number
  averageWeight: number
  collectionsThisMonth: number
  weightThisMonth: number
  lastCollectionDate?: Date
  efficiency: number // Porcentagem baseada em metas
}

// NOVA ESTRUTURA DE OPERADORES SIMPLES
// Operadores são apenas registros para seleção durante coletas
export interface SimpleOperator {
  id: string
  name: string
  email?: string
  phone?: string
  cpf?: string
  role: 'operator' | 'supervisor'
  account_id: string
  avatar_url?: string
  status: 'active' | 'inactive'
  hire_date?: Date
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface CreateSimpleOperatorData {
  name: string
  phone?: string
  cpf?: string
  role: 'operator' | 'supervisor'
  account_id: string
  avatar_url?: string
  status?: 'active' | 'inactive'
  hire_date?: Date
  notes?: string
}

export interface UpdateSimpleOperatorData extends Partial<CreateSimpleOperatorData> {}

export interface SimpleOperatorWithAccount extends SimpleOperator {
  account: {
    id: string
    company_name: string
    contact_person: string
    phone: string
  }
}

// Para compatibilidade temporária com o código existente
export interface Operator extends User {
  clientId?: string
  hireDate?: Date
  avatar?: string
  lastLogin?: Date
  active?: boolean
}

export interface CreateOperatorData {
  name: string
  email: string
  password?: string
  phone?: string
  cpf?: string
  role: 'operator' | 'supervisor'
  account_id: string
  supervisor_id?: string
  active?: boolean
}

export interface OperatorCreationResult {
  operator: User
  credentials?: {
    email: string
    password: string
    userCreated: boolean
  }
}

export interface UpdateOperatorData extends Partial<CreateOperatorData> {
  status?: 'active' | 'inactive'
}

export interface OperatorPerformance extends UserPerformance {} // Alias para compatibilidade 