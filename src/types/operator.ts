export interface Operator {
  id: string
  name: string
  email?: string
  phone?: string
  cpf?: string
  role: 'operador' | 'supervisor' | 'admin'
  active: boolean
  hireDate: Date
  clientId?: string
  avatar?: string
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateOperatorData {
  name: string
  email?: string
  phone?: string
  cpf?: string
  role: 'operador' | 'supervisor' | 'admin'
  hireDate: Date
}

export interface UpdateOperatorData extends Partial<CreateOperatorData> {
  active?: boolean
}

export interface OperatorPerformance {
  operatorId: string
  operatorName: string
  totalCollections: number
  totalWeight: number
  averageWeight: number
  collectionsThisMonth: number
  weightThisMonth: number
  lastCollectionDate?: Date
  efficiency: number // Porcentagem baseada em metas
} 