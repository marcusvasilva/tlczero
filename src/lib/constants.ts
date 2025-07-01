// Constantes da aplicação TLC Zero

export const APP_CONFIG = {
  name: 'TLC Zero',
  version: '1.0.0',
  description: 'Controle de Pragas PWA'
} as const

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000
} as const

export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50, 100]
} as const

export const WEIGHT_LIMITS = {
  min: 0.01, // 10g mínimo
  max: 10.0, // 10kg máximo
  step: 0.01
} as const

export const PHOTO_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  quality: 0.8
} as const

export const QR_CODE_CONFIG = {
  size: 256,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
} as const

export const WEATHER_CONDITIONS = [
  { value: 'ensolarado', label: 'Ensolarado', icon: '☀️' },
  { value: 'nublado', label: 'Nublado', icon: '☁️' },
  { value: 'chuvoso', label: 'Chuvoso', icon: '🌧️' },
  { value: 'ventoso', label: 'Ventoso', icon: '💨' }
] as const

export const OPERATOR_ROLES = [
  { value: 'operador', label: 'Operador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Administrador' }
] as const

export const ATTRACTIVE_TYPES = [
  { value: 'moscas', label: 'Moscas' },
  { value: 'outros', label: 'Outros' }
] as const

export const DATE_FORMATS = {
  display: 'dd/MM/yyyy',
  displayWithTime: 'dd/MM/yyyy HH:mm',
  iso: 'yyyy-MM-dd',
  filename: 'yyyyMMdd_HHmmss'
} as const

export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4'
} as const

export const COLLECTION_GOALS = {
  daily: 5, // coletas por dia
  weekly: 35, // coletas por semana
  monthly: 150, // coletas por mês
  weightTarget: 50 // kg por mês
} as const

export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  clients: '/clients',
  spaces: '/spaces',
  collections: '/collections',
  operators: '/operators',
  reports: '/reports',
  collect: '/collect/:spaceId'
} as const 