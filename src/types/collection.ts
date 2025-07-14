import type { Tables, TablesInsert, TablesUpdate } from './database'

// Tipos baseados na nova estrutura da database
export type DatabaseCollection = Tables<'collections'>
export type CreateCollectionDbData = TablesInsert<'collections'>
export type UpdateCollectionDbData = TablesUpdate<'collections'>

export interface Collection {
  id: string
  spaceId: string
  operatorId: string // Compatibilidade (maps to user_id)
  userId: string // Novo campo (maps to user_id)
  clientId: string
  weight: number // Compatibilidade
  weightCollected: number // Novo campo (maps to weight_collected)
  photoUrl?: string
  observations?: string // Compatibilidade
  notes?: string // Novo campo (maps to notes)
  collectedAt: Date // Compatibilidade
  collectionDate: string // Novo campo (maps to collection_date)
  temperature?: number | null
  humidity?: number | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCollectionData {
  spaceId: string
  operatorId?: string // Compatibilidade
  userId?: string // Novo campo
  clientId?: string
  weight?: number // Compatibilidade
  weightCollected?: number // Novo campo
  photoUrl?: string
  observations?: string // Compatibilidade
  notes?: string // Novo campo
  collectedAt?: Date // Compatibilidade
  collectionDate?: string // Novo campo
  temperature?: number | null
  humidity?: number | null
}

export interface UpdateCollectionData extends Partial<CreateCollectionData> {}

export interface CollectionWithDetails extends Collection {
  space: {
    id: string
    name: string
    client: {
      id: string
      name: string
    }
    account?: {
      id: string
      company_name: string
    }
  }
  operator: {
    id: string
    name: string
  }
  user?: {
    id: string
    name: string
    role: string
  }
}

export interface CollectionSummary {
  totalCollections: number
  totalWeight: number
  averageWeight: number
  period: {
    start: Date
    end: Date
  }
  bySpace: Array<{
    spaceId: string
    spaceName: string
    count: number
    totalWeight: number
  }>
  byOperator: Array<{
    operatorId: string
    operatorName: string
    count: number
    totalWeight: number
  }>
  byUser?: Array<{
    userId: string
    userName: string
    count: number
    totalWeight: number
  }>
} 