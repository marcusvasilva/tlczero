import { useState, useMemo } from 'react'
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Users,
  Bug,
  RefreshCw,
  MapPin,
  Scale,
  Info,
  ChevronDown
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

import { useAuthContext } from '@/contexts/AuthContext'
import { useCollections } from '@/hooks/useCollections'
import { useSpaces } from '@/hooks/useSpaces'
import { useOperators } from '@/hooks/useOperators'
import { useClients } from '@/hooks/useClients'
import { Button } from '@/components/ui/button'

// Constantes
const FLY_WEIGHT_GRAMS = 0.002 // Uma mosca pesa aproximadamente 2mg
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

interface DashboardFilters {
  startDate: string
  endDate: string
  clientId?: string
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: string
  info?: string
  isLoading?: boolean
}

function MetricCard({ title, value, subtitle, icon: Icon, color, info, isLoading }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 xs:p-5 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-2 xs:p-3 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
        </div>
        <div className="ml-3 xs:ml-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            {info && (
              <div className="relative">
                <Info 
                  className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" 
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
                {showTooltip && (
                  <div className="absolute z-10 px-3 py-2 text-xs sm:text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6 transform -translate-y-full w-48 xs:w-56 sm:w-64">
                    {info}
                    <div className="absolute top-full left-4 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xl xs:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          {subtitle && (
            <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SimpleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 xs:p-5 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-3 xs:mb-4">
        <h3 className="text-base xs:text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function SimpleSelect({ value, onValueChange, options, placeholder }: {
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.value === value)
  
  return (
    <div className="relative">
      <button
        type="button"
        className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary touch-target"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span>{selectedOption?.label || placeholder}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="p-1">
            {options.map((option) => (
              <button
                key={option.value}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm text-sm"
                onClick={() => {
                  onValueChange(option.value)
                  setIsOpen(false)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user, userType } = useAuthContext()
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    clientId: userType === 'admin' ? '' : undefined
  })

  // Hooks para buscar dados
  const { collections, isLoading: collectionsLoading, refreshCollections } = useCollections()
  const { spaces, isLoading: spacesLoading, refreshSpaces } = useSpaces()
  const { operators, isLoading: operatorsLoading, refreshOperators } = useOperators()
  const { clients, isLoading: clientsLoading, refreshClients } = useClients()

  // Refresh todos os dados
  const refreshAllData = () => {
    refreshCollections()
    refreshSpaces()
    refreshOperators()
    if (userType === 'admin') {
      refreshClients()
    }
  }

  // Filtrar coletas baseado nos filtros
  const filteredCollections = useMemo(() => {
    let filtered = collections

    // Filtro de data
    if (filters.startDate && filters.endDate) {
      const start = startOfDay(parseISO(filters.startDate))
      const end = endOfDay(parseISO(filters.endDate))
      
      filtered = filtered.filter(collection => {
        const collectionDate = new Date(collection.collectedAt)
        return collectionDate >= start && collectionDate <= end
      })
    }

    // Filtro de cliente (apenas para admin)
    if (userType === 'admin' && filters.clientId) {
      filtered = filtered.filter(collection => collection.clientId === filters.clientId)
    }

    return filtered
  }, [collections, filters, userType])

  // Calcular métricas
  const metrics = useMemo(() => {
    const totalWeight = filteredCollections.reduce((sum, collection) => sum + (collection.weight || 0), 0)
    const totalFlies = Math.round(totalWeight / FLY_WEIGHT_GRAMS)
    const totalSpaces = spaces.filter(space => space.active).length
    const totalOperators = operators.filter(op => op.status === 'active').length
    const lastCollection = filteredCollections[0] // Coletas já estão ordenadas por data

    return {
      totalWeight,
      totalFlies,
      totalSpaces,
      totalOperators,
      lastCollection: lastCollection ? format(new Date(lastCollection.collectedAt), 'dd/MM/yyyy', { locale: ptBR }) : 'Nenhuma',
      totalCollections: filteredCollections.length
    }
  }, [filteredCollections, spaces, operators])

  // Dados para gráfico de linha (coletas por data)
  const chartData = useMemo(() => {
    const dataByDate = filteredCollections.reduce((acc, collection) => {
      const date = format(new Date(collection.collectedAt), 'dd/MM')
      
      if (!acc[date]) {
        acc[date] = { date, weight: 0, collections: 0 }
      }
      
      acc[date].weight += collection.weight || 0
      acc[date].collections += 1
      
      return acc
    }, {} as Record<string, { date: string; weight: number; collections: number }>)

    return Object.values(dataByDate).sort((a, b) => {
      const [dayA, monthA] = a.date.split('/')
      const [dayB, monthB] = b.date.split('/')
      return new Date(2024, parseInt(monthA) - 1, parseInt(dayA)).getTime() - 
             new Date(2024, parseInt(monthB) - 1, parseInt(dayB)).getTime()
    })
  }, [filteredCollections])

  // Dados para gráfico de pizza (coletas por espaço)
  const pieData = useMemo(() => {
    const dataBySpace = filteredCollections.reduce((acc, collection) => {
      const space = spaces.find(s => s.id === collection.spaceId)
      const spaceName = space?.name || 'Espaço desconhecido'
      
      if (!acc[spaceName]) {
        acc[spaceName] = { name: spaceName, value: 0, collections: 0 }
      }
      
      acc[spaceName].value += collection.weight || 0
      acc[spaceName].collections += 1
      
      return acc
    }, {} as Record<string, { name: string; value: number; collections: number }>)

    return Object.values(dataBySpace).sort((a, b) => b.value - a.value)
  }, [filteredCollections, spaces])

  // Opções para o select de clientes
  const clientOptions = useMemo(() => {
    const options = [{ value: '', label: 'Todos os clientes' }]
    
    if (userType === 'admin') {
      clients.forEach(client => {
        options.push({
          value: client.id,
          label: client.company_name
        })
      })
    }
    
    return options
  }, [clients, userType])

  const isLoading = collectionsLoading || spacesLoading || operatorsLoading || (userType === 'admin' && clientsLoading)

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard TLC Zero
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Bem-vindo, {user?.name}! Monitore a eficácia do mata-moscas TLC Agro.
          </p>
        </div>
        <Button
          onClick={refreshAllData}
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden xs:inline">Atualizar</span>
        </Button>
      </div>

      {/* Filtros */}
      <SimpleCard title="Filtros">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Data Inicial</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-responsive"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Data Final</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-responsive"
            />
          </div>
          {userType === 'admin' && (
            <div>
              <label className="block text-sm font-medium mb-2">Cliente</label>
              <SimpleSelect
                value={filters.clientId || ''}
                onValueChange={(value) => setFilters(prev => ({ ...prev, clientId: value || undefined }))}
                options={clientOptions}
                placeholder="Selecione um cliente"
              />
            </div>
          )}
        </div>
      </SimpleCard>

      {/* Cards de métricas */}
      <div className="stats-grid">
        <MetricCard
          title="Moscas Eliminadas"
          value={metrics.totalFlies}
          subtitle="Estimativa baseada no peso coletado"
          icon={Bug}
          color="bg-green-600"
          info={`Cálculo baseado no peso total coletado (${metrics.totalWeight.toFixed(2)}g) dividido pelo peso médio de uma mosca (${FLY_WEIGHT_GRAMS}g)`}
          isLoading={isLoading}
        />
        <MetricCard
          title="Peso Coletado"
          value={`${metrics.totalWeight.toFixed(2)}g`}
          subtitle="Total no período selecionado"
          icon={Scale}
          color="bg-blue-600"
          isLoading={isLoading}
        />
        <MetricCard
          title="Espaços Ativos"
          value={metrics.totalSpaces}
          subtitle="Locais de monitoramento"
          icon={MapPin}
          color="bg-purple-600"
          isLoading={isLoading}
        />
        <MetricCard
          title="Operadores"
          value={metrics.totalOperators}
          subtitle="Ativos no sistema"
          icon={Users}
          color="bg-orange-600"
          isLoading={isLoading}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-5 sm:gap-6">
        {/* Gráfico de linha - Coletas por data */}
        <SimpleCard title="Coletas por Data">
          <div className="h-64 xs:h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'weight' ? `${value}g` : value,
                    name === 'weight' ? 'Peso' : 'Coletas'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Peso (g)"
                />
                <Line 
                  type="monotone" 
                  dataKey="collections" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Coletas"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SimpleCard>

        {/* Gráfico de pizza - Coletas por espaço */}
        <SimpleCard title="Distribuição por Espaços">
          <div className="h-64 xs:h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}g`, 'Peso coletado']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SimpleCard>
      </div>

      {/* Resumo do período */}
      <SimpleCard title="Resumo do Período">
        <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 xs:gap-5 sm:gap-6">
          <div className="text-center p-3 xs:p-4">
            <p className="text-2xl xs:text-3xl font-bold text-green-600 dark:text-green-400">
              {metrics.totalCollections}
            </p>
            <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 mt-1">Total de Coletas</p>
          </div>
          <div className="text-center p-3 xs:p-4">
            <p className="text-2xl xs:text-3xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.totalWeight.toFixed(2)}g
            </p>
            <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 mt-1">Peso Total Coletado</p>
          </div>
          <div className="text-center p-3 xs:p-4">
            <p className="text-2xl xs:text-3xl font-bold text-purple-600 dark:text-purple-400">
              {metrics.lastCollection}
            </p>
            <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 mt-1">Última Coleta</p>
          </div>
        </div>
      </SimpleCard>
    </div>
  )
} 