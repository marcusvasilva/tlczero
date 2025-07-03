import React, { useState, useMemo } from 'react'
import { 
  Users, 
  Building2, 
  Bug, 
  Weight,
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  MapPin,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { getDataCounts, mockCollections, mockSpaces, mockClients } from '@/data'
import { formatWeight, formatDate, formatPercentage } from '@/lib/formatters'
import { useCollections, useSpaces, useClients } from '@/hooks'

// Tipos para filtros
type PeriodFilter = '7d' | '30d' | '90d' | '1y'
type MetricType = 'collections' | 'weight' | 'spaces' | 'performance'

export function Dashboard() {
  // Estados
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d')
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('collections')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Hooks para dados
  const { filteredCollections } = useCollections()
  const { filteredSpaces } = useSpaces()
  const { filteredClients } = useClients()

  // Dados base
  const dataCounts = getDataCounts()

  // Filtrar dados por período
  const filteredData = useMemo(() => {
    const now = new Date()
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }

    const cutoffDate = new Date(now.getTime() - periodDays[selectedPeriod] * 24 * 60 * 60 * 1000)
    
    return filteredCollections.filter(collection => 
      new Date(collection.collectedAt) >= cutoffDate
    )
  }, [filteredCollections, selectedPeriod])

  // Calcular métricas principais
  const metrics = useMemo(() => {
    const totalWeight = filteredData.reduce((sum, c) => sum + c.weight, 0)
    const averageWeight = filteredData.length > 0 ? totalWeight / filteredData.length : 0
    const activeSpaces = filteredSpaces.filter(s => s.active).length
    const collectionsWithPhotos = filteredData.filter(c => c.photoUrl).length
    const photoRate = filteredData.length > 0 ? (collectionsWithPhotos / filteredData.length) * 100 : 0

    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }

    // Calcular tendências (comparação com período anterior)
    const previousPeriodStart = new Date(Date.now() - (2 * periodDays[selectedPeriod] * 24 * 60 * 60 * 1000))
    const currentPeriodStart = new Date(Date.now() - (periodDays[selectedPeriod] * 24 * 60 * 60 * 1000))
    
    const previousPeriodData = filteredCollections.filter(c => {
      const date = new Date(c.collectedAt)
      return date >= previousPeriodStart && date < currentPeriodStart
    })

    const previousWeight = previousPeriodData.reduce((sum, c) => sum + c.weight, 0)
    const weightTrend = previousWeight > 0 ? ((totalWeight - previousWeight) / previousWeight) * 100 : 0
    const collectionsTrend = previousPeriodData.length > 0 ? ((filteredData.length - previousPeriodData.length) / previousPeriodData.length) * 100 : 0

    return [
      {
        title: 'Total de Coletas',
        value: filteredData.length,
        icon: Bug,
        change: `${collectionsTrend >= 0 ? '+' : ''}${collectionsTrend.toFixed(1)}%`,
        trend: collectionsTrend >= 0 ? 'up' as const : 'down' as const,
        description: `Últimos ${periodDays[selectedPeriod]} dias`,
        color: 'blue'
      },
      {
        title: 'Peso Total Coletado',
        value: formatWeight(totalWeight),
        icon: Weight,
        change: `${weightTrend >= 0 ? '+' : ''}${weightTrend.toFixed(1)}%`,
        trend: weightTrend >= 0 ? 'up' as const : 'down' as const,
        description: 'Peso acumulado',
        color: 'green'
      },
      {
        title: 'Espaços Ativos',
        value: activeSpaces,
        icon: Building2,
        change: '+5%',
        trend: 'up' as const,
        description: 'Locais monitorados',
        color: 'purple'
      },
      {
        title: 'Taxa de Fotos',
        value: `${photoRate.toFixed(1)}%`,
        icon: Target,
        change: `${photoRate >= 90 ? '+' : ''}${(photoRate - 85).toFixed(1)}%`,
        trend: photoRate >= 90 ? 'up' as const : 'down' as const,
        description: 'Coletas com foto',
        color: 'orange'
      }
    ]
  }, [filteredData, filteredSpaces, selectedPeriod, filteredCollections])

  // Dados para gráficos
  const chartData = useMemo(() => {
    // Agrupar dados por dia para gráfico de linha
    const dailyData = new Map()
    
    filteredData.forEach(collection => {
      const date = new Date(collection.collectedAt).toISOString().split('T')[0]
      if (!dailyData.has(date)) {
        dailyData.set(date, { date, collections: 0, weight: 0 })
      }
      const dayData = dailyData.get(date)
      dayData.collections += 1
      dayData.weight += collection.weight
    })

    const lineChartData = Array.from(dailyData.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Últimos 30 pontos
      .map(item => ({
        ...item,
        date: formatDate(new Date(item.date)),
        weight: Number(item.weight.toFixed(2))
      }))

    // Dados por espaço para gráfico de barras
    const spaceData = new Map()
    filteredData.forEach(collection => {
      const space = filteredSpaces.find(s => s.id === collection.spaceId)
      const spaceName = space?.name || `Espaço ${collection.spaceId}`
      
      if (!spaceData.has(spaceName)) {
        spaceData.set(spaceName, { name: spaceName, collections: 0, weight: 0 })
      }
      const data = spaceData.get(spaceName)
      data.collections += 1
      data.weight += collection.weight
    })

    const barChartData = Array.from(spaceData.values())
      .sort((a, b) => b.collections - a.collections)
      .slice(0, 10)
      .map(item => ({
        ...item,
        weight: Number(item.weight.toFixed(2))
      }))

    // Dados por cliente para gráfico de pizza
    const clientData = new Map()
    filteredData.forEach(collection => {
      const space = filteredSpaces.find(s => s.id === collection.spaceId)
      const client = filteredClients.find(c => c.id === space?.clientId)
      const clientName = client?.name || 'Cliente Desconhecido'
      
      if (!clientData.has(clientName)) {
        clientData.set(clientName, { name: clientName, value: 0 })
      }
      clientData.get(clientName).value += collection.weight
    })

    const pieChartData = Array.from(clientData.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map(item => ({
        ...item,
        value: Number(item.value.toFixed(2))
      }))

    return { lineChartData, barChartData, pieChartData }
  }, [filteredData, filteredSpaces, filteredClients])

  // Cores para gráficos
  const colors = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    red: '#EF4444',
    indigo: '#6366F1',
    pink: '#EC4899',
    teal: '#14B8A6'
  }

  const pieColors = [colors.blue, colors.green, colors.purple, colors.orange, colors.red, colors.indigo, colors.pink, colors.teal]

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleExport = () => {
    // Implementar exportação
    console.log('Exportando dados do dashboard...')
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Visão geral do sistema de controle de pragas
          </p>
        </div>
        
        {/* Controles */}
        <div className="flex items-center gap-3">
          {/* Filtro de Período */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as PeriodFilter[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {period === '7d' && '7 dias'}
                {period === '30d' && '30 dias'}
                {period === '90d' && '90 dias'}
                {period === '1y' && '1 ano'}
              </button>
            ))}
          </div>

          {/* Botões de Ação */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.title} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900`}>
                  <Icon className={`h-5 w-5 text-${metric.color}-600 dark:text-${metric.color}-400`} />
                </div>
                <span className={`flex items-center text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metric.change}
                </span>
              </div>
              
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {metric.value}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {metric.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Coletas ao Longo do Tempo */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Coletas ao Longo do Tempo
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Evolução diária das coletas e peso
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.lineChartData}>
                <defs>
                  <linearGradient id="collectionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.blue} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.blue} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.green} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.green} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <YAxis 
                  yAxisId="collections"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <YAxis 
                  yAxisId="weight"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Area
                  yAxisId="collections"
                  type="monotone"
                  dataKey="collections"
                  stroke={colors.blue}
                  fillOpacity={1}
                  fill="url(#collectionsGradient)"
                  name="Coletas"
                />
                <Area
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weight"
                  stroke={colors.green}
                  fillOpacity={1}
                  fill="url(#weightGradient)"
                  name="Peso (kg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza - Distribuição por Cliente */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Distribuição por Cliente
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Peso coletado por cliente
              </p>
            </div>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData.pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(1)}%)`}
                >
                  {chartData.pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} kg`, 'Peso']}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico de Barras - Top Espaços */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top 10 Espaços por Coletas
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Espaços com maior número de coletas no período
            </p>
          </div>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.barChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis 
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
                width={120}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar 
                dataKey="collections" 
                fill={colors.purple}
                name="Coletas"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seção Inferior - Atividades e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividades Recentes */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Atividades Recentes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Últimas coletas realizadas
              </p>
            </div>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {filteredData.slice(0, 6).map((collection) => {
              const space = filteredSpaces.find(s => s.id === collection.spaceId)
              const client = filteredClients.find(c => c.id === space?.clientId)
              
              return (
                <div key={collection.id} className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Bug className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {space?.name || `Espaço ${collection.spaceId}`}
                      </p>
                      {collection.photoUrl && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {client?.name || 'Cliente não identificado'} • {formatDate(collection.collectedAt)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatWeight(collection.weight)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Op. {collection.operatorId}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status e Alertas */}
        <div className="space-y-6">
          {/* Status do Sistema */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status do Sistema
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">API</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Operacional</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Banco de Dados</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Operacional</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Storage</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-yellow-600">Manutenção</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alertas
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  3 espaços sem coleta há 7+ dias
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                  Verificar espaços inativos
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Meta mensal: 85% atingida
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Faltam 15% para a meta
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 