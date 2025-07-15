import type { Tables, TablesInsert, TablesUpdate } from './database'

// Tipos baseados na nova estrutura da database
export type DatabaseSpace = Tables<'spaces'>
export type CreateSpaceDbData = TablesInsert<'spaces'>
export type UpdateSpaceDbData = TablesUpdate<'spaces'>

export interface Space {
  id: string
  clientId: string // Compatibilidade (maps to account_id)
  accountId: string // Novo campo (maps to account_id)
  name: string
  description?: string
  areaSize?: number // maps to area_size
  environmentType?: 'indoor' | 'outdoor' | 'mixed' // maps to environment_type
  active: boolean // maps to status
  publicToken?: string // maps to public_token
  qrCodeEnabled: boolean // maps to qr_code_enabled
  createdAt: Date
  updatedAt: Date
}

export interface CreateSpaceData {
  clientId?: string // Compatibilidade
  accountId?: string // Novo campo
  name: string
  description?: string
  areaSize?: number
  environmentType?: 'indoor' | 'outdoor' | 'mixed'
  qrCodeEnabled?: boolean
}

export interface UpdateSpaceData extends Partial<CreateSpaceData> {
  active?: boolean
}

export interface SpaceWithClient extends Space {
  client: {
    id: string
    name: string
  }
  account?: {
    id: string
    company_name: string
  }
} 