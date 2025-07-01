import type { Operator } from '@/types'

export const mockOperators: Operator[] = [
  {
    id: '1',
    name: 'José da Silva',
    email: 'jose.silva@tlczero.com.br',
    phone: '(11) 9876-5432',
    cpf: '123.456.789-01',
    role: 'operador',
    active: true,
    hireDate: new Date('2024-01-10'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@tlczero.com.br',
    phone: '(11) 8765-4321',
    cpf: '234.567.890-12',
    role: 'operador',
    active: true,
    hireDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@tlczero.com.br',
    phone: '(11) 7654-3210',
    cpf: '345.678.901-23',
    role: 'supervisor',
    active: true,
    hireDate: new Date('2023-12-01'),
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-01')
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana.costa@tlczero.com.br',
    phone: '(11) 6543-2109',
    cpf: '456.789.012-34',
    role: 'operador',
    active: true,
    hireDate: new Date('2024-02-01'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '5',
    name: 'Roberto Ferreira',
    email: 'roberto.ferreira@tlczero.com.br',
    phone: '(11) 5432-1098',
    cpf: '567.890.123-45',
    role: 'admin',
    active: true,
    hireDate: new Date('2023-11-15'),
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2023-11-15')
  },
  {
    id: '6',
    name: 'Fernanda Lima',
    email: 'fernanda.lima@tlczero.com.br',
    phone: '(11) 4321-0987',
    cpf: '678.901.234-56',
    role: 'operador',
    active: false,
    hireDate: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-03-15')
  }
] 