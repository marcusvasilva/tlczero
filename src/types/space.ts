export interface Space {
  id: string
  clientId: string
  name: string
  description?: string
  location?: string
  qrCode: string
  attractiveType: 'moscas' | 'outros'
  installationDate: Date
  lastMaintenanceDate?: Date
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSpaceData {
  clientId: string
  name: string
  description?: string
  location?: string
  attractiveType: 'moscas' | 'outros'
  installationDate: Date
}

export interface UpdateSpaceData extends Partial<CreateSpaceData> {
  lastMaintenanceDate?: Date
  active?: boolean
}

export interface SpaceWithClient extends Space {
  client: {
    id: string
    name: string
  }
} 