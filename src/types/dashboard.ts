export interface DashboardMetrics {
  totalClients: number
  totalSpaces: number
  totalCollections: number
  totalWeight: number
  averageWeightPerCollection: number
  collectionsThisMonth: number
  weightThisMonth: number
  growthPercentage: number
  activeOperators: number
}

export interface ChartDataPoint {
  date: string
  weight: number
  collections: number
  label?: string
}

export interface SpacePerformance {
  spaceId: string
  spaceName: string
  clientName: string
  totalWeight: number
  totalCollections: number
  averageWeight: number
  lastCollectionDate?: Date
  efficiency: number
  trend: 'up' | 'down' | 'stable'
}

export interface PeriodComparison {
  currentPeriod: {
    start: Date
    end: Date
    totalWeight: number
    totalCollections: number
  }
  previousPeriod: {
    start: Date
    end: Date
    totalWeight: number
    totalCollections: number
  }
  weightGrowth: number
  collectionsGrowth: number
}

export interface RecentActivity {
  id: string
  type: 'collection' | 'space_created' | 'client_created' | 'maintenance'
  title: string
  description: string
  timestamp: Date
  operatorName?: string
  spaceName?: string
  clientName?: string
} 