import type { User, RolePermissions } from '@/types'

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin Sistema',
    email: 'admin@tlczero.com.br',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin+Sistema&background=059669&color=fff',
    active: true,
    lastLogin: new Date('2024-12-05T10:30:00'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-05T10:30:00')
  },
  {
    id: '2',
    name: 'Carlos Supervisor',
    email: 'supervisor@tlczero.com.br',
    role: 'supervisor',
    avatar: 'https://ui-avatars.com/api/?name=Carlos+Supervisor&background=059669&color=fff',
    active: true,
    lastLogin: new Date('2024-12-05T09:15:00'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-05T09:15:00'),
    clientId: '1'
  },
  {
    id: '3',
    name: 'Maria Operadora',
    email: 'operador@tlczero.com.br',
    role: 'operador',
    avatar: 'https://ui-avatars.com/api/?name=Maria+Operadora&background=059669&color=fff',
    active: true,
    lastLogin: new Date('2024-12-05T08:45:00'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-12-05T08:45:00'),
    clientId: '1'
  },
  {
    id: '4',
    name: 'João Silva',
    email: 'joao.silva@tlczero.com.br',
    role: 'operador',
    avatar: 'https://ui-avatars.com/api/?name=João+Silva&background=059669&color=fff',
    active: true,
    lastLogin: new Date('2024-12-04T16:20:00'),
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-12-04T16:20:00'),
    clientId: '2'
  },
  {
    id: '5',
    name: 'Ana Costa',
    email: 'ana.costa@tlczero.com.br',
    role: 'supervisor',
    avatar: 'https://ui-avatars.com/api/?name=Ana+Costa&background=059669&color=fff',
    active: true,
    lastLogin: new Date('2024-12-04T14:10:00'),
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-12-04T14:10:00'),
    clientId: '3'
  },
  {
    id: '6',
    name: 'Pedro Inativo',
    email: 'pedro.inativo@tlczero.com.br',
    role: 'operador',
    avatar: 'https://ui-avatars.com/api/?name=Pedro+Inativo&background=6b7280&color=fff',
    active: false,
    lastLogin: new Date('2024-11-15T12:00:00'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-11-20T10:00:00'),
    clientId: '1'
  }
]

// Credenciais mockadas (em produção seria hash)
export const mockCredentials = {
  'admin@tlczero.com.br': 'admin123',
  'supervisor@tlczero.com.br': 'super123',
  'operador@tlczero.com.br': 'oper123',
  'joao.silva@tlczero.com.br': 'joao123',
  'ana.costa@tlczero.com.br': 'ana123'
}

// Definição de permissões por role
export const rolePermissions: RolePermissions = {
  admin: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'spaces', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'collections', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'operators', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] }
  ],
  supervisor: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'spaces', actions: ['create', 'read', 'update'] },
    { resource: 'collections', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'operators', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read'] }
  ],
  operador: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'spaces', actions: ['read'] },
    { resource: 'collections', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] }
  ]
}

// Função para verificar permissão
export const hasPermission = (userRole: User['role'], resource: string, action: string): boolean => {
  const permissions = rolePermissions[userRole]
  const resourcePermission = permissions.find(p => p.resource === resource)
  return resourcePermission?.actions.includes(action) ?? false
} 