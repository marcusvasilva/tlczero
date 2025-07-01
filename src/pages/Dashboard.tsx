import { 
  Users, 
  Building2, 
  Bug, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Weight
} from 'lucide-react'
import { getDataCounts, mockCollections } from '@/data'
import { formatWeight, formatDate, formatPercentage } from '@/lib/formatters'

export function Dashboard() {
  const dataCounts = getDataCounts()
  const recentCollections = mockCollections.slice(0, 5)
  
  // Calcular métricas
  const totalWeight = mockCollections.reduce((sum, c) => sum + c.weight, 0)
  const averageWeight = totalWeight / mockCollections.length
  const collectionsThisMonth = mockCollections.filter(c => {
    const collectionDate = new Date(c.collectedAt)
    const now = new Date()
    return collectionDate.getMonth() === now.getMonth() && 
           collectionDate.getFullYear() === now.getFullYear()
  }).length

  const metrics = [
    {
      title: 'Total de Clientes',
      value: dataCounts.totalClients,
      icon: Users,
      change: '+12%',
      trend: 'up' as const,
      description: 'Clientes ativos'
    },
    {
      title: 'Espaços Monitorados',
      value: dataCounts.totalSpaces,
      icon: Building2,
      change: '+8%',
      trend: 'up' as const,
      description: 'Locais de coleta'
    },
    {
      title: 'Coletas Este Mês',
      value: collectionsThisMonth,
      icon: Bug,
      change: '+15%',
      trend: 'up' as const,
      description: 'Coletas realizadas'
    },
    {
      title: 'Peso Total Coletado',
      value: formatWeight(totalWeight),
      icon: Weight,
      change: '+22%',
      trend: 'up' as const,
      description: 'Peso acumulado'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-600">
            Visão geral do sistema de controle de pragas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            <Calendar className="h-4 w-4" />
            Últimos 30 dias
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            Gerar Relatório
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.title} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  {metric.title}
                </h3>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <div className="flex items-center text-xs text-gray-600 mt-1">
                <span className={`flex items-center ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metric.change}
                </span>
                <span className="ml-1">{metric.description}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coletas Recentes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Coletas Recentes</h2>
          <p className="text-sm text-gray-600 mb-4">
            Últimas coletas realizadas no sistema
          </p>
          <div className="space-y-4">
            {recentCollections.map((collection) => (
              <div key={collection.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bug className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Espaço #{collection.spaceId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(collection.collectedAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">
                    {formatWeight(collection.weight)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Op. {collection.operatorId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Estatísticas Rápidas</h2>
          <p className="text-sm text-gray-600 mb-4">
            Métricas importantes do sistema
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Peso Médio por Coleta</span>
              <span className="text-sm font-medium">{formatWeight(averageWeight)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Operadores Ativos</span>
              <span className="text-sm font-medium">{dataCounts.totalOperators}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Coletas com Foto</span>
              <span className="text-sm font-medium">
                {mockCollections.filter(c => c.photoUrl).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxa de Sucesso</span>
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                98.5%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Condição Climática Mais Comum</span>
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded border">
                ☀️ Ensolarado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status dos Sistemas */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-2">Status dos Sistemas</h2>
        <p className="text-sm text-gray-600 mb-4">
          Monitoramento em tempo real dos componentes
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">API Sistema</p>
              <p className="text-xs text-gray-500">Operacional</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">Banco de Dados</p>
              <p className="text-xs text-gray-500">Conectado</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">QR Code Service</p>
              <p className="text-xs text-gray-500">Modo Desenvolvimento</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 