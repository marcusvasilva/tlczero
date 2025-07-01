import type { Client } from '@/types'

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Supermercado Central',
    email: 'contato@supercentral.com.br',
    phone: '(11) 3456-7890',
    address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
    cnpj: '12.345.678/0001-90',
    contactPerson: 'Maria Silva',
    active: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Restaurante Bella Vista',
    email: 'gerencia@bellavista.com.br',
    phone: '(11) 2345-6789',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    cnpj: '23.456.789/0001-01',
    contactPerson: 'João Santos',
    active: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '3',
    name: 'Padaria do Bairro',
    email: 'padaria@dobairro.com.br',
    phone: '(11) 4567-8901',
    address: 'Rua Augusta, 456 - Consolação, São Paulo - SP',
    cnpj: '34.567.890/0001-12',
    contactPerson: 'Ana Costa',
    active: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: '4',
    name: 'Hotel Executivo',
    email: 'reservas@hotelexecutivo.com.br',
    phone: '(11) 5678-9012',
    address: 'Rua Oscar Freire, 789 - Jardins, São Paulo - SP',
    cnpj: '45.678.901/0001-23',
    contactPerson: 'Carlos Oliveira',
    active: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: '5',
    name: 'Cafeteria Aroma',
    email: 'contato@cafeteriaaroma.com.br',
    phone: '(11) 6789-0123',
    address: 'Rua da Consolação, 321 - Centro, São Paulo - SP',
    cnpj: '56.789.012/0001-34',
    contactPerson: 'Fernanda Lima',
    active: true,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: '6',
    name: 'Mercado São José',
    email: 'admin@mercadosj.com.br',
    phone: '(11) 7890-1234',
    address: 'Rua Barão de Itapetininga, 654 - República, São Paulo - SP',
    cnpj: '67.890.123/0001-45',
    contactPerson: 'Roberto Ferreira',
    active: false,
    createdAt: new Date('2024-01-30'),
    updatedAt: new Date('2024-04-01')
  }
] 