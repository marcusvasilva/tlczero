import type { Collection } from '@/types'

// Função helper para gerar datas nos últimos 30 dias
const getRandomDate = (daysAgo: number) => {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  return date
}

// Função helper para gerar peso realista (0.1kg a 2.5kg)
const getRandomWeight = () => {
  return Math.round((Math.random() * 2.4 + 0.1) * 100) / 100
}

export const mockCollections: Collection[] = [
  {
    id: '1',
    spaceId: '1',
    operatorId: '1',
    weight: 1.25,
    photoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
    observations: 'Coleta normal, boa quantidade capturada',
    collectedAt: getRandomDate(2),
    weatherCondition: 'ensolarado',
    temperature: 28,
    createdAt: getRandomDate(2),
    updatedAt: getRandomDate(2)
  },
  {
    id: '2',
    spaceId: '2',
    operatorId: '1',
    weight: 2.10,
    photoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
    observations: 'Maior concentração de moscas na área do açougue',
    collectedAt: getRandomDate(3),
    weatherCondition: 'ensolarado',
    temperature: 26,
    createdAt: getRandomDate(3),
    updatedAt: getRandomDate(3)
  },
  {
    id: '3',
    spaceId: '3',
    operatorId: '2',
    weight: 0.85,
    photoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
    observations: 'Coleta realizada após limpeza da cozinha',
    collectedAt: getRandomDate(1),
    weatherCondition: 'nublado',
    temperature: 24,
    createdAt: getRandomDate(1),
    updatedAt: getRandomDate(1)
  },
  {
    id: '4',
    spaceId: '4',
    operatorId: '2',
    weight: 0.45,
    photoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
    observations: 'Área externa com menor incidência',
    collectedAt: getRandomDate(4),
    weatherCondition: 'ventoso',
    temperature: 22,
    createdAt: getRandomDate(4),
    updatedAt: getRandomDate(4)
  },
  {
    id: '5',
    spaceId: '5',
    operatorId: '4',
    weight: 1.75,
    photoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
    observations: 'Produção de pães atraiu mais moscas',
    collectedAt: getRandomDate(2),
    weatherCondition: 'ensolarado',
    temperature: 30,
    createdAt: getRandomDate(2),
    updatedAt: getRandomDate(2)
  },
  {
    id: '6',
    spaceId: '6',
    operatorId: '4',
    weight: 0.95,
    photoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
    observations: 'Vitrine bem vedada, pouca incidência',
    collectedAt: getRandomDate(5),
    weatherCondition: 'nublado',
    temperature: 25,
    createdAt: getRandomDate(5),
    updatedAt: getRandomDate(5)
  },
  {
    id: '7',
    spaceId: '7',
    operatorId: '1',
    weight: 1.40,
    photoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
    observations: 'Restaurante com movimento normal',
    collectedAt: getRandomDate(3),
    weatherCondition: 'ensolarado',
    temperature: 27,
    createdAt: getRandomDate(3),
    updatedAt: getRandomDate(3)
  },
  {
    id: '8',
    spaceId: '8',
    operatorId: '2',
    weight: 2.35,
    photoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
    observations: 'Cozinha industrial com alta atividade',
    collectedAt: getRandomDate(1),
    weatherCondition: 'ensolarado',
    temperature: 29,
    createdAt: getRandomDate(1),
    updatedAt: getRandomDate(1)
  },
  {
    id: '9',
    spaceId: '9',
    operatorId: '4',
    weight: 0.65,
    photoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400',
    observations: 'Cafeteria com controle eficiente',
    collectedAt: getRandomDate(6),
    weatherCondition: 'chuvoso',
    temperature: 20,
    createdAt: getRandomDate(6),
    updatedAt: getRandomDate(6)
  },
  {
    id: '10',
    spaceId: '1',
    operatorId: '2',
    weight: 1.15,
    observations: 'Segunda coleta da semana na área de frios',
    collectedAt: getRandomDate(7),
    weatherCondition: 'nublado',
    temperature: 23,
    createdAt: getRandomDate(7),
    updatedAt: getRandomDate(7)
  },
  // Adicionar mais coletas para ter dados suficientes para gráficos
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `${11 + i}`,
    spaceId: String((i % 9) + 1),
    operatorId: String((i % 4) + 1),
    weight: getRandomWeight(),
    photoUrl: Math.random() > 0.3 ? 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400' : undefined,
    observations: Math.random() > 0.5 ? 'Coleta de rotina' : undefined,
    collectedAt: getRandomDate(30),
    weatherCondition: ['ensolarado', 'nublado', 'chuvoso', 'ventoso'][Math.floor(Math.random() * 4)] as 'ensolarado' | 'nublado' | 'chuvoso' | 'ventoso',
    temperature: Math.floor(Math.random() * 15) + 18, // 18-32°C
    createdAt: getRandomDate(30),
    updatedAt: getRandomDate(30)
  }))
] 