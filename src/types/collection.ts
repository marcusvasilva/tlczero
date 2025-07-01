export interface Collection {
  id: string
  spaceId: string
  operatorId: string
  weight: number
  photoUrl?: string
  observations?: string
  collectedAt: Date
  weatherCondition?: 'ensolarado' | 'nublado' | 'chuvoso' | 'ventoso'
  temperature?: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateCollectionData {
  spaceId: string
  operatorId: string
  weight: number
  photoUrl?: string
  observations?: string
  collectedAt: Date
  weatherCondition?: 'ensolarado' | 'nublado' | 'chuvoso' | 'ventoso'
  temperature?: number
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
  }
  operator: {
    id: string
    name: string
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
} 