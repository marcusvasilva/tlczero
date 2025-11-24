import { useState, useEffect, useMemo } from 'react'
import { Download, RefreshCw, Filter, FileText, Calendar, MapPin, TrendingUp } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { generateCollectionsReportPdf, type ReportData } from '@/lib/reportPdf'
import { Button } from '@/components/ui/button'
import { useMobile } from '@/hooks/use-mobile'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface CollectionReport {
  collection_number: number
  id: string
  collection_date: string
  weight_collected: number
  notes: string | null
  executor_name: string | null
  space_name: string | null
  space_id: string
  account_id: string
  client_name: string | null
}

interface Account {
  id: string
  company_name: string
}

interface Space {
  id: string
  name: string
  account_id: string
}

// Cores para os gráficos
const CHART_COLORS = [
  '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  '#84cc16', '#65a30d', '#4d7c0f', '#3f6212', '#365314'
]

export default function Reports() {
  const { userType, user } = useAuthContext()
  const isMobile = useMobile()

  // Estados
  const [collections, setCollections] = useState<CollectionReport[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [activeView, setActiveView] = useState<'charts' | 'table'>('charts')

  // Filtros
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Carregar dados iniciais
  useEffect(() => {
    loadAccounts()
    loadSpaces()
  }, [])

  // Carregar coletas quando filtros mudarem
  useEffect(() => {
    if (startDate && endDate) {
      loadCollections()
    }
  }, [selectedAccount, selectedSpace, startDate, endDate])

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('id, company_name')
      .eq('status', 'active')
      .order('company_name')

    setAccounts(data || [])
  }

  const loadSpaces = async () => {
    const { data } = await supabase
      .from('spaces')
      .select('id, name, account_id')
      .eq('status', 'active')
      .order('name')

    setSpaces(data || [])
  }

  const loadCollections = async () => {
    // Validação rigorosa das datas
    if (!startDate || !endDate || startDate.trim() === '' || endDate.trim() === '') {
      console.log('loadCollections: datas inválidas', { startDate, endDate })
      return
    }

    // Validar formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      console.log('loadCollections: formato de data inválido', { startDate, endDate })
      return
    }

    setIsLoading(true)

    try {
      let query = supabase
        .from('collections_report')
        .select('*')
        .gte('collection_date', startDate)
        .lte('collection_date', endDate)
        .order('collection_date', { ascending: false })

      if (selectedAccount) {
        query = query.eq('account_id', selectedAccount)
      }

      if (selectedSpace) {
        query = query.eq('space_id', selectedSpace)
      }

      // Filtrar por account do usuário se não for admin
      if (userType !== 'admin' && user?.account_id) {
        query = query.eq('account_id', user.account_id)
      }

      const { data, error } = await query

      if (error) throw error

      setCollections(data || [])
    } catch (error) {
      console.error('Erro ao carregar coletas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Espaços filtrados por conta selecionada
  const filteredSpaces = useMemo(() => {
    if (!selectedAccount) return spaces
    return spaces.filter(s => s.account_id === selectedAccount)
  }, [spaces, selectedAccount])

  // Resumo geral
  const summary = useMemo(() => {
    const totalCollections = collections.length
    const totalWeight = collections.reduce((sum, c) => sum + Number(c.weight_collected), 0)
    return { totalCollections, totalWeight }
  }, [collections])

  // Resumo por espaço (ranking)
  const summaryBySpace = useMemo(() => {
    const spaceMap = new Map<string, { name: string; weight: number; count: number }>()

    collections.forEach(c => {
      const spaceName = c.space_name || 'Sem espaço'
      const existing = spaceMap.get(spaceName)
      if (existing) {
        existing.weight += Number(c.weight_collected)
        existing.count += 1
      } else {
        spaceMap.set(spaceName, {
          name: spaceName,
          weight: Number(c.weight_collected),
          count: 1
        })
      }
    })

    return Array.from(spaceMap.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10) // Top 10
  }, [collections])

  // Resumo por mês
  const summaryByMonth = useMemo(() => {
    const monthMap = new Map<string, { month: string; monthLabel: string; weight: number; count: number }>()

    collections.forEach(c => {
      const date = new Date(c.collection_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

      const existing = monthMap.get(monthKey)
      if (existing) {
        existing.weight += Number(c.weight_collected)
        existing.count += 1
      } else {
        monthMap.set(monthKey, {
          month: monthKey,
          monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          weight: Number(c.weight_collected),
          count: 1
        })
      }
    })

    return Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [collections])

  // Gerar PDF
  const handleGeneratePDF = async () => {
    if (collections.length === 0) {
      alert('Não há dados para gerar o relatório')
      return
    }

    setIsGeneratingPDF(true)

    try {
      const reportData: ReportData[] = collections.map((c, index) => ({
        collection_number: collections.length - index,
        collection_date: c.collection_date,
        executor_name: c.executor_name,
        client_name: c.client_name,
        space_name: c.space_name,
        weight_collected: Number(c.weight_collected),
        notes: c.notes
      }))

      const filters = {
        clientName: selectedAccount
          ? accounts.find(a => a.id === selectedAccount)?.company_name || ''
          : '',
        spaceName: selectedSpace
          ? spaces.find(s => s.id === selectedSpace)?.name || ''
          : '',
        startDate,
        endDate
      }

      generateCollectionsReportPdf(reportData, filters, summary)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar relatório PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const formatWeight = (weight: number) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(2)} kg`
    }
    return `${weight.toFixed(0)} g`
  }

  const formatWeightShort = (weight: number) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)}kg`
    }
    return `${weight.toFixed(0)}g`
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Relatório de Coletas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análise consolidada das coletas realizadas
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadCollections}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF || collections.length === 0}
          >
            <Download className="h-4 w-4" />
            {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cliente */}
          {userType === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => {
                  setSelectedAccount(e.target.value)
                  setSelectedSpace('')
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os clientes</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Espaço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Espaço
            </label>
            <select
              value={selectedSpace}
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos os espaços</option>
              {filteredSpaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Coletas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalCollections}
              </p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Peso Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatWeight(summary.totalWeight)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Espaços</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryBySpace.length}
              </p>
            </div>
            <MapPin className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Média/Coleta</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalCollections > 0
                  ? formatWeight(summary.totalWeight / summary.totalCollections)
                  : '0 g'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Toggle de Visualização */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'charts' ? 'default' : 'outline'}
          onClick={() => setActiveView('charts')}
          size="sm"
        >
          Gráficos
        </Button>
        <Button
          variant={activeView === 'table' ? 'default' : 'outline'}
          onClick={() => setActiveView('table')}
          size="sm"
        >
          Tabela Detalhada
        </Button>
      </div>

      {activeView === 'charts' && (
        <>
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico por Espaço */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Peso por Espaço (Top 10)
              </h3>
              {summaryBySpace.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Nenhum dado disponível
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summaryBySpace}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => formatWeightShort(v)} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatWeight(value), 'Peso']}
                        labelFormatter={(label) => `Espaço: ${label}`}
                      />
                      <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                        {summaryBySpace.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Gráfico por Mês */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Evolução Mensal
              </h3>
              {summaryByMonth.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Nenhum dado disponível
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summaryByMonth}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => formatWeightShort(v)} />
                      <Tooltip
                        formatter={(value: number) => [formatWeight(value), 'Peso']}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Bar dataKey="weight" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Tabelas de Resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking por Espaço */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Ranking por Espaço
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
                {summaryBySpace.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Nenhum dado</div>
                ) : (
                  summaryBySpace.map((item, index) => (
                    <div key={item.name} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-green-600">
                          {formatWeight(item.weight)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({item.count} coletas)
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {summaryBySpace.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">TOTAL</span>
                    <span className="text-sm font-bold text-green-600">{formatWeight(summary.totalWeight)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Resumo por Mês */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Resumo por Mês
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
                {summaryByMonth.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Nenhum dado</div>
                ) : (
                  summaryByMonth.map((item) => (
                    <div key={item.month} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.monthLabel}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-blue-600">
                          {formatWeight(item.weight)}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({item.count} coletas)
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {summaryByMonth.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">TOTAL</span>
                    <span className="text-sm font-bold text-blue-600">{formatWeight(summary.totalWeight)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeView === 'table' && (
        /* Tabela de Coletas */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Coletas no Período ({collections.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : collections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma coleta encontrada no período selecionado
            </div>
          ) : isMobile ? (
            // Visualização Mobile
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {collections.map((collection, index) => (
                <div key={collection.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-600">
                      #{String(collections.length - index).padStart(4, '0')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(collection.collection_date)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Executor:</span> {collection.executor_name || '-'}</p>
                    <p><span className="text-gray-500">Cliente:</span> {collection.client_name || '-'}</p>
                    <p><span className="text-gray-500">Espaço:</span> {collection.space_name || '-'}</p>
                    <p><span className="text-gray-500">Peso:</span> <span className="font-semibold text-green-600">{formatWeight(Number(collection.weight_collected))}</span></p>
                    {collection.notes && (
                      <p><span className="text-gray-500">Obs:</span> {collection.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Visualização Desktop
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Nº Coleta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Executor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Espaço
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Peso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Observações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {collections.map((collection, index) => (
                    <tr
                      key={collection.id}
                      className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">
                          {String(collections.length - index).padStart(4, '0')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(collection.collection_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {collection.executor_name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {collection.client_name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {collection.space_name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatWeight(Number(collection.weight_collected))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {collection.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
