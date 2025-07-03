import { useState, useMemo } from 'react'
import { 
  Users, 
  Building2, 
  Bug, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  MapPin,
  Clock,
  Zap,
  Eye,
  Target
} from 'lucide-react'
import {
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
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { formatWeight, formatDate, formatNumber } from '@/lib/formatters'
import { useClientCollections, useClientSpaces, useClients } from '@/hooks'
import { useAuthContext } from '@/contexts/AuthContext'

// Componente Card simples
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

// Componente Button simples
function Button({ 
  children, 
  variant = 'default', 
  size = 'default', 
  onClick, 
  className = '' 
}: { 
  children: React.ReactNode
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  onClick?: () => void
  className?: string
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variantClasses = variant === 'outline' 
    ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
    : 'bg-green-600 text-white hover:bg-green-700'
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Componente Badge simples
function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' }) {
  const classes = variant === 'secondary' 
    ? 'bg-gray-100 text-gray-800' 
    : 'bg-green-100 text-green-800'
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes}`}>
      {children}
    </span>
  )
}

// Tipos para filtros
type PeriodFilter = '7d' | '30d' | '90d' | '1y'

// Função para calcular moscas mortas aproximadas (baseado em peso médio de mosca: ~0.012g)
function calculateFliesKilled(weightInKg: number): number {
  const averageFlyWeight = 0.000012 // 0.012g em kg
  return Math.round(weightInKg / averageFlyWeight)
}

// Componente Dashboard para Admin
function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d')
  
  const { collections } = useClientCollections()
  const { spaces } = useClientSpaces()
  const { clients } = useClients()

  // Cálculos de métricas para admin
  const metrics = useMemo(() => {
    const now = new Date()
    const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))
    
    const currentCollections = collections.filter(c => new Date(c.collectedAt) >= startDate)
    const currentWeight = currentCollections.reduce((sum, c) => sum + c.weight, 0)
    const activeSpaces = spaces.filter(s => s.active).length
    const activeClients = clients.filter(c => c.active).length
    
    return {
      totalCollections: currentCollections.length,
      totalWeight: currentWeight,
      activeSpaces,
      activeClients
    }
  }, [collections, spaces, clients, selectedPeriod])

  // Dados para gráficos
  const chartData = useMemo(() => {
    // Distribuição por cliente
    const clientDistribution = clients.map(client => {
      const clientCollections = collections.filter(c => c.clientId === client.id)
      return {
        name: client.name,
        coletas: clientCollections.length,
        peso: clientCollections.reduce((sum, c) => sum + c.weight, 0)
      }
    }).filter(item => item.coletas > 0)

    return { clientDistribution }
  }, [collections, clients])

  const colors = ['#059669', '#0d9488', '#0891b2', '#0284c7', '#3b82f6', '#6366f1']

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-1">Visão geral de todos os clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <div className="flex gap-2 mb-6">
        {(['7d', '30d', '90d', '1y'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === '7d' && '7 dias'}
            {period === '30d' && '30 dias'}
            {period === '90d' && '90 dias'}
            {period === '1y' && '1 ano'}
          </Button>
        ))}
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total de Coletas</h3>
            <Bug className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatNumber(metrics.totalCollections)}</div>
          <div className="flex items-center text-xs text-gray-500">
            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            vs período anterior
          </div>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Peso Total</h3>
            <Zap className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatWeight(metrics.totalWeight)}</div>
          <div className="flex items-center text-xs text-gray-500">
            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            vs período anterior
          </div>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Clientes Ativos</h3>
            <Users className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatNumber(metrics.activeClients)}</div>
          <p className="text-xs text-gray-500">
            {clients.length} total
          </p>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Espaços Ativos</h3>
            <Building2 className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatNumber(metrics.activeSpaces)}</div>
          <p className="text-xs text-gray-500">
            {spaces.length} total
          </p>
        </Card>
      </div>

      {/* Gráfico de Distribuição por Cliente */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Distribuição por Cliente</h3>
          <p className="text-sm text-gray-600">Coletas por cliente</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={chartData.clientDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="coletas"
            >
              {chartData.clientDistribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </Card>
    </>
  )
}

// Componente Dashboard para Cliente
function ClientDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d')
  const { collections } = useClientCollections()
  const { spaces } = useClientSpaces()

  // Dados já filtrados por cliente pelos hooks useClientCollections e useClientSpaces
  const clientData = useMemo(() => {
    return {
      collections,
      spaces
    }
  }, [collections, spaces])

  // Cálculos de métricas específicas do cliente
  const metrics = useMemo(() => {
    const now = new Date()
    const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))
    
    const periodCollections = clientData.collections.filter(c => new Date(c.collectedAt) >= startDate)
    const totalWeight = periodCollections.reduce((sum, c) => sum + c.weight, 0)
    const activeSpaces = clientData.spaces.filter(s => s.active).length
    const avgWeightPerCollection = periodCollections.length > 0 ? totalWeight / periodCollections.length : 0
    
    return {
      totalCollections: periodCollections.length,
      totalWeight,
      totalFliesKilled: calculateFliesKilled(totalWeight),
      activeSpaces,
      avgWeightPerCollection,
      lastCollection: periodCollections.length > 0 
        ? Math.max(...periodCollections.map(c => new Date(c.collectedAt).getTime()))
        : null
    }
  }, [clientData, selectedPeriod])

  // Dados para gráficos
  const chartData = useMemo(() => {
    const now = new Date()
    const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))
    
    // Gráfico de evolução temporal
    const timeSeriesData = []
    const intervalDays = periodDays <= 7 ? 1 : periodDays <= 30 ? 2 : periodDays <= 90 ? 7 : 30
    
    for (let i = 0; i < periodDays; i += intervalDays) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
      const endDate = new Date(date.getTime() + (intervalDays * 24 * 60 * 60 * 1000))
      
      const periodCollections = clientData.collections.filter(c => {
        const collectionDate = new Date(c.collectedAt)
        return collectionDate >= date && collectionDate < endDate
      })
      
      const weight = periodCollections.reduce((sum, c) => sum + c.weight, 0)
      const flies = calculateFliesKilled(weight)
      
      timeSeriesData.push({
        date: formatDate(date).substring(0, 5), // DD/MM
        coletas: periodCollections.length,
        peso: Number(weight.toFixed(2)),
        moscas: flies,
        eficacia: periodCollections.length > 0 ? Number((weight / periodCollections.length * 1000).toFixed(1)) : 0 // g por coleta
      })
    }

    // Performance por espaço
    const spacePerformance = clientData.spaces.map(space => {
      const spaceCollections = clientData.collections.filter(c => 
        c.spaceId === space.id && 
        new Date(c.collectedAt) >= startDate
      )
      const weight = spaceCollections.reduce((sum, c) => sum + c.weight, 0)
      
      return {
        name: space.name.length > 15 ? space.name.substring(0, 15) + '...' : space.name,
        coletas: spaceCollections.length,
        peso: Number(weight.toFixed(2)),
        moscas: calculateFliesKilled(weight),
        eficacia: spaceCollections.length > 0 ? Number((weight / spaceCollections.length * 1000).toFixed(1)) : 0
      }
    }).filter(item => item.coletas > 0).slice(0, 8) // Top 8 espaços

    return { timeSeriesData, spacePerformance }
  }, [clientData, selectedPeriod])

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Eficácia</h1>
          <p className="text-gray-600 mt-1">Resultados do mata-moscas TLC Agro nos seus espaços</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver Relatório
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <div className="flex gap-2 mb-6">
        {(['7d', '30d', '90d', '1y'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === '7d' && '7 dias'}
            {period === '30d' && '30 dias'}
            {period === '90d' && '90 dias'}
            {period === '1y' && '1 ano'}
          </Button>
        ))}
      </div>

      {/* Cards de Métricas do Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Coletas Realizadas</h3>
            <Bug className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatNumber(metrics.totalCollections)}</div>
          <p className="text-xs text-gray-500">
            nos últimos {selectedPeriod === '7d' ? '7 dias' : selectedPeriod === '30d' ? '30 dias' : selectedPeriod === '90d' ? '90 dias' : '1 ano'}
          </p>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Moscas Eliminadas</h3>
            <Target className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatNumber(metrics.totalFliesKilled)}</div>
          <p className="text-xs text-gray-500">
            {formatWeight(metrics.totalWeight)} coletados
          </p>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Espaços Ativos</h3>
            <Building2 className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatNumber(metrics.activeSpaces)}</div>
          <p className="text-xs text-gray-500">
            {clientData.spaces.length} total
          </p>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Última Coleta</h3>
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">
            {metrics.lastCollection 
              ? formatDate(new Date(metrics.lastCollection)).substring(0, 5)
              : 'N/A'
            }
          </div>
          <p className="text-xs text-gray-500">
            {metrics.lastCollection 
              ? `${Math.floor((Date.now() - metrics.lastCollection) / (1000 * 60 * 60 * 24))} dias atrás`
              : 'Nenhuma coleta'
            }
          </p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Evolução Temporal */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Evolução da Eficácia</h3>
            <p className="text-sm text-gray-600">Curva de melhorias do mata-moscas ao longo do tempo</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'moscas' ? formatNumber(Number(value)) : 
                  name === 'peso' ? `${value}kg` :
                  name === 'eficacia' ? `${value}g/coleta` : value,
                  name === 'moscas' ? 'Moscas Eliminadas' :
                  name === 'peso' ? 'Peso Coletado' :
                  name === 'eficacia' ? 'Eficácia' : name
                ]}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="moscas" 
                stroke="#059669" 
                strokeWidth={2}
                name="moscas"
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="eficacia" 
                stroke="#0891b2" 
                strokeWidth={2}
                name="eficacia"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Performance por Espaço */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Performance por Espaço</h3>
            <p className="text-sm text-gray-600">Eficácia do mata-moscas em cada local</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.spacePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'moscas' ? formatNumber(Number(value)) + ' moscas' : 
                  name === 'peso' ? `${value}kg` :
                  name === 'eficacia' ? `${value}g/coleta` : value,
                  name === 'moscas' ? 'Moscas Eliminadas' :
                  name === 'peso' ? 'Peso Coletado' :
                  name === 'eficacia' ? 'Eficácia Média' : name
                ]}
              />
              <Bar dataKey="moscas" fill="#059669" name="moscas" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Lista de Espaços */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Meus Espaços</h3>
          <p className="text-sm text-gray-600">Status e eficácia do mata-moscas em cada local</p>
        </div>
        <div className="space-y-4">
          {clientData.spaces.map((space) => {
            const spaceCollections = clientData.collections.filter(c => c.spaceId === space.id)
            const spaceWeight = spaceCollections.reduce((sum, c) => sum + c.weight, 0)
            const spaceFlies = calculateFliesKilled(spaceWeight)
            const lastCollection = spaceCollections.length > 0 
              ? Math.max(...spaceCollections.map(c => new Date(c.collectedAt).getTime()))
              : null

            return (
              <div key={space.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <h4 className="font-medium">{space.name}</h4>
                      <p className="text-sm text-gray-500">{space.location}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">{spaceCollections.length} coletas</p>
                    <p className="text-xs text-gray-500">{formatNumber(spaceFlies)} moscas eliminadas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatWeight(spaceWeight)}</p>
                    <p className="text-xs text-gray-500">peso coletado</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {lastCollection 
                        ? formatDate(new Date(lastCollection))
                        : 'Sem coletas'
                      }
                    </p>
                    <p className="text-xs text-gray-500">última coleta</p>
                  </div>
                  <Badge variant={space.active ? 'default' : 'secondary'}>
                    {space.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

// Componente principal que decide qual dashboard mostrar
export default function Dashboard() {
  const { userType } = useAuthContext()

  return (
    <div className="space-y-6">
      {userType === 'admin' ? <AdminDashboard /> : <ClientDashboard />}
    </div>
  )
} 