// Componentes comuns
export * from './common/DataTable'
export * from './common/ConfirmDialog'
export * from './common/MultiSelect'

// Formulários
export * from './forms/ClientForm'
export * from './forms/SpaceForm'
export * from './forms/CollectionForm'

// Layout
export * from './layout/SimpleLayout'

// Layout components
export { AppLayout } from './layout/AppLayout'
export { AppHeader } from './layout/AppHeader'
export { AppSidebar } from './layout/AppSidebar'

// Auth components
export { ProtectedRoute, PermissionGuard, usePermissions } from './auth/ProtectedRoute' 