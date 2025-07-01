// Export all mock data
export { mockClients } from './mockClients'
export { mockOperators } from './mockOperators'
export { mockSpaces } from './mockSpaces'
export { mockCollections } from './mockCollections'
export { mockUsers, mockCredentials, rolePermissions, hasPermission } from './mockUsers'

import { mockClients } from './mockClients'
import { mockOperators } from './mockOperators'
import { mockSpaces } from './mockSpaces'
import { mockCollections } from './mockCollections'
import { mockUsers } from './mockUsers'

// Export data generators for testing
export const generateMockData = () => ({
  clients: mockClients,
  operators: mockOperators,
  spaces: mockSpaces,
  collections: mockCollections,
  users: mockUsers
})

// Export data counts for dashboard
export const getDataCounts = () => ({
  totalClients: mockClients.filter(c => c.active).length,
  totalSpaces: mockSpaces.filter(s => s.active).length,
  totalOperators: mockOperators.filter(o => o.active).length,
  totalCollections: mockCollections.length
}) 