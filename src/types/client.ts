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