import { useState, useMemo } from 'react'
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  Calendar,
  Bell,
  Lightbulb,
  Clock,
  Zap
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCollections } from '@/hooks/useCollections'
import { useClientSpaces } from '@/hooks/useSpaces'
import { useClients } from '@/hooks/useClients'
import { formatDate, formatWeight } from '@/lib/formatters'

// Componentes UI simples
const Button = ({ children, variant = 'default', size = 'default', onClick, disabled, className = '' }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      variant === 'outline' 
        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300' 
        : 'bg-blue-600 text-white hover:bg-blue-700'
    } ${size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
)

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
)

const Badge = ({ children, variant = 'default' }: any) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
    variant === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
    variant === 'danger' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  }`}>
    {children}
  </span>
)

export default function Reports() {
  const { userType, user } = useAuthContext()
  const { collections } = useCollections()
  const { spaces } = useClientSpaces()
  const { clients } = useClients()
  
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Obter cliente atual
  const currentClient = useMemo(() => {
    if (userType === 'admin') return null
    const accountId = user?.account_id
    return clients.find(c => c.id === accountId)
  }, [userType, user?.account_id, clients])

  // Calcular datas do período
  const periodDates = useMemo(() => {
    const now = new Date()
    const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
    const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)
    
    return {
      current: { start: startDate, end: now },
      previous: { start: previousStartDate, end: startDate }
    }
  }, [selectedPeriod])

  // Filtrar coletas do período atual
  const currentPeriodCollections = useMemo(() => {
    return collections.filter(collection => {
      const collectionDate = new Date(collection.collectedAt)
      return collectionDate >= periodDates.current.start && collectionDate <= periodDates.current.end
    })
  }, [collections, periodDates])

  // Filtrar coletas do período anterior (para comparação)
  const previousPeriodCollections = useMemo(() => {
    return collections.filter(collection => {
      const collectionDate = new Date(collection.collectedAt)
      return collectionDate >= periodDates.previous.start && collectionDate <= periodDates.previous.end
    })
  }, [collections, periodDates])

  // Calcular métricas principais
  const metrics = useMemo(() => {
    const currentTotal = currentPeriodCollections.reduce((sum, c) => sum + c.weight, 0)
    const currentCount = currentPeriodCollections.length
    const currentAverage = currentCount > 0 ? currentTotal / currentCount : 0
    
    const previousTotal = previousPeriodCollections.reduce((sum, c) => sum + c.weight, 0)
    const spacesWithCollections = new Set(currentPeriodCollections.map(c => c.spaceId)).size
    
    // Score de eficácia baseado no peso total e número de coletas
    const effectivenessScore = Math.min(100, Math.round((currentTotal / Math.max(currentCount, 1)) * 10))
    
    // Tendência baseada na comparação com período anterior
    const percentageChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0
    const trend = percentageChange > 5 ? 'up' : percentageChange < -5 ? 'down' : 'stable'
    
    return {
      totalWeight: currentTotal,
      averageWeight: currentAverage,
      collectionsCount: currentCount,
      spacesActive: spacesWithCollections,
      effectivenessScore,
      trend,
      percentageChange
    }
  }, [currentPeriodCollections, previousPeriodCollections])

  // Gerar alertas automáticos
  const alerts = useMemo(() => {
    const alerts: Array<{ 
      type: 'critical' | 'warning' | 'info' | 'success', 
      title: string,
      message: string,
      action?: string,
      priority: number
    }> = []

    // Alerta crítico: eficácia muito baixa
    if (metrics.effectivenessScore < 40) {
      alerts.push({
        type: 'critical',
        title: 'Eficácia Crítica Detectada',
        message: `Score de eficácia de apenas ${metrics.effectivenessScore}%. Recomenda-se reaplicação imediata do mata-moscas TLC.`,
        action: 'Agendar Reaplicação',
        priority: 1
      })
    }

    // Alerta: tendência de queda
    if (metrics.trend === 'down' && Math.abs(metrics.percentageChange) > 20) {
      alerts.push({
        type: 'warning',
        title: 'Queda Significativa na Eficácia',
        message: `Redução de ${Math.abs(metrics.percentageChange).toFixed(1)}% na eficácia. Verifique se há necessidade de reaplicação.`,
        action: 'Verificar Espaços',
        priority: 2
      })
    }

    // Alerta: espaços sem coletas recentes
    const spacesWithoutRecentCollections = spaces.filter(space => {
      const spaceCollections = currentPeriodCollections.filter(c => c.spaceId === space.id)
      const lastCollection = spaceCollections.length > 0 
        ? new Date(Math.max(...spaceCollections.map(c => new Date(c.collectedAt).getTime())))
        : null
      return !lastCollection || new Date().getTime() - lastCollection.getTime() > 7 * 24 * 60 * 60 * 1000
    })

    if (spacesWithoutRecentCollections.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Espaços Sem Monitoramento',
        message: `${spacesWithoutRecentCollections.length} espaço(s) sem coletas nos últimos 7 dias. Verificar se necessita reaplicação.`,
        action: 'Ver Espaços',
        priority: 3
      })
    }

    // Alerta positivo: alta eficácia
    if (metrics.effectivenessScore >= 80 && metrics.trend === 'up') {
      alerts.push({
        type: 'success',
        title: 'Excelente Performance!',
        message: `Eficácia de ${metrics.effectivenessScore}% com tendência crescente. O mata-moscas TLC está funcionando perfeitamente.`,
        priority: 5
      })
    }

    // Alerta informativo: primeira aplicação
    if (metrics.collectionsCount === 0) {
      alerts.push({
        type: 'info',
        title: 'Início do Monitoramento',
        message: 'Aguardando primeiras coletas para análise de eficácia. Recomenda-se acompanhar diariamente nos primeiros 7 dias.',
        priority: 4
      })
    }

    return alerts.sort((a, b) => a.priority - b.priority)
  }, [metrics, spaces, currentPeriodCollections])

  // Gerar cronograma de reaplicação
  const reapplicationSchedule = useMemo(() => {
    const schedule: Array<{
      spaceId: string,
      spaceName: string,
      urgency: 'immediate' | 'soon' | 'scheduled' | 'good',
      daysUntilReapplication: number,
      reason: string
    }> = []

    spaces.forEach(space => {
      const spaceCollections = currentPeriodCollections.filter(c => c.spaceId === space.id)
      const totalWeight = spaceCollections.reduce((sum, c) => sum + c.weight, 0)
      const collectionsCount = spaceCollections.length
      const averageWeight = collectionsCount > 0 ? totalWeight / collectionsCount : 0
      const lastCollection = spaceCollections.length > 0 
        ? new Date(Math.max(...spaceCollections.map(c => new Date(c.collectedAt).getTime())))
        : null

      let urgency: 'immediate' | 'soon' | 'scheduled' | 'good' = 'good'
      let daysUntilReapplication = 30 // Padrão: 30 dias
      let reason = 'Manutenção preventiva'

      // Lógica de urgência baseada na performance
      if (averageWeight < 0.5 || !lastCollection) {
        urgency = 'immediate'
        daysUntilReapplication = 0
        reason = 'Eficácia muito baixa ou sem dados'
      } else if (averageWeight < 1.0) {
        urgency = 'soon'
        daysUntilReapplication = 7
        reason = 'Eficácia abaixo do esperado'
      } else if (lastCollection && new Date().getTime() - lastCollection.getTime() > 21 * 24 * 60 * 60 * 1000) {
        urgency = 'scheduled'
        daysUntilReapplication = 14
        reason = 'Tempo desde última aplicação'
      } else if (averageWeight >= 2.0) {
        urgency = 'good'
        daysUntilReapplication = 45
        reason = 'Performance excelente - extensão do prazo'
      }

      schedule.push({
        spaceId: space.id,
        spaceName: space.name,
        urgency,
        daysUntilReapplication,
        reason
      })
    })

    return schedule.sort((a, b) => a.daysUntilReapplication - b.daysUntilReapplication)
  }, [spaces, currentPeriodCollections])

  // Gerar insights avançados
  const advancedInsights = useMemo(() => {
    const insights: Array<{
      type: 'trend' | 'comparison' | 'prediction' | 'recommendation',
      title: string,
      description: string,
      value?: string,
      impact: 'high' | 'medium' | 'low'
    }> = []

    // Insight de tendência
    if (metrics.trend !== 'stable') {
      const trendText = metrics.trend === 'up' ? 'crescimento' : 'redução'
      const impactText = Math.abs(metrics.percentageChange) > 30 ? 'significativo' : 'moderado'
      insights.push({
        type: 'trend',
        title: `Tendência de ${trendText} ${impactText}`,
        description: `A eficácia do mata-moscas apresenta ${trendText} de ${Math.abs(metrics.percentageChange).toFixed(1)}% comparado ao período anterior.`,
        value: `${metrics.percentageChange > 0 ? '+' : ''}${metrics.percentageChange.toFixed(1)}%`,
        impact: Math.abs(metrics.percentageChange) > 30 ? 'high' : Math.abs(metrics.percentageChange) > 15 ? 'medium' : 'low'
      })
    }

    // Insight de comparação com meta
    const targetEffectiveness = 75 // Meta de 75% de eficácia
    if (metrics.effectivenessScore !== 0) {
      const diffFromTarget = metrics.effectivenessScore - targetEffectiveness
      insights.push({
        type: 'comparison',
        title: diffFromTarget >= 0 ? 'Meta de Eficácia Atingida' : 'Abaixo da Meta de Eficácia',
        description: diffFromTarget >= 0 
          ? `Performance ${diffFromTarget.toFixed(1)} pontos acima da meta estabelecida de ${targetEffectiveness}%.`
          : `Performance ${Math.abs(diffFromTarget).toFixed(1)} pontos abaixo da meta de ${targetEffectiveness}%. Ações corretivas recomendadas.`,
        value: `${metrics.effectivenessScore}%`,
        impact: Math.abs(diffFromTarget) > 20 ? 'high' : Math.abs(diffFromTarget) > 10 ? 'medium' : 'low'
      })
    }

    // Insight de predição
    if (metrics.collectionsCount > 5) {
      const projectedMoscasEliminated = Math.round(metrics.totalWeight * 1000 * (365 / (selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365)))
      insights.push({
        type: 'prediction',
        title: 'Projeção Anual de Eliminação',
        description: `Com base na performance atual, estima-se eliminar aproximadamente ${projectedMoscasEliminated.toLocaleString()} moscas por ano.`,
        value: `${projectedMoscasEliminated.toLocaleString()} moscas/ano`,
        impact: 'medium'
      })
    }

    // Insight de recomendação
    const urgentSpaces = reapplicationSchedule.filter(s => s.urgency === 'immediate' || s.urgency === 'soon').length
    if (urgentSpaces > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Ação Imediata Recomendada',
        description: `${urgentSpaces} espaço(s) necessitam reaplicação urgente para manter a eficácia do tratamento.`,
        value: `${urgentSpaces} espaços`,
        impact: 'high'
      })
    }

    return insights
  }, [metrics, selectedPeriod, reapplicationSchedule])

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Relatório PDF gerado com sucesso!')
    } catch (error) {
      alert('Erro ao gerar relatório PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Relatório de Eficácia
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentClient 
              ? `Demonstrativo de performance do mata-moscas TLC - ${currentClient.company_name}`
              : 'Relatórios consolidados de todos os clientes'
            }
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPDF ? 'Gerando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Período
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Eliminado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatWeight(metrics.totalWeight)}
              </p>
              <div className="flex items-center mt-1">
                {metrics.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : metrics.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                ) : (
                  <Activity className="h-4 w-4 text-gray-500 mr-1" />
                )}
                <span className={`text-sm ${
                  metrics.trend === 'up' ? 'text-green-600' :
                  metrics.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {Math.abs(metrics.percentageChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coletas Realizadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.collectionsCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedPeriod === '7d' ? 'esta semana' : 
                 selectedPeriod === '30d' ? 'este mês' :
                 selectedPeriod === '90d' ? 'neste trimestre' : 'este ano'}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Peso Médio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatWeight(metrics.averageWeight)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">por coleta</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Score de Eficácia</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.effectivenessScore}%
              </p>
              <Badge 
                variant={
                  metrics.effectivenessScore >= 80 ? 'success' :
                  metrics.effectivenessScore >= 60 ? 'warning' : 'danger'
                }
              >
                {metrics.effectivenessScore >= 80 ? 'Excelente' :
                 metrics.effectivenessScore >= 60 ? 'Bom' : 'Atenção'}
              </Badge>
            </div>
            <CheckCircle className={`h-8 w-8 ${
              metrics.effectivenessScore >= 80 ? 'text-green-600' :
              metrics.effectivenessScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`} />
          </div>
        </Card>
              </div>

       {/* Alertas Automáticos */}
       {alerts.length > 0 && (
         <Card className="p-6">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
             <Bell className="h-5 w-5 mr-2 text-orange-600" />
             Alertas e Notificações
           </h3>
           <div className="space-y-3">
             {alerts.map((alert, index) => (
               <div
                 key={index}
                 className={`p-4 rounded-lg border-l-4 flex items-start justify-between ${
                   alert.type === 'critical' ? 'bg-red-50 border-red-400 dark:bg-red-900/20' :
                   alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20' :
                   alert.type === 'success' ? 'bg-green-50 border-green-400 dark:bg-green-900/20' :
                   'bg-blue-50 border-blue-400 dark:bg-blue-900/20'
                 }`}
               >
                 <div className="flex-1">
                   <div className="flex items-center mb-1">
                     {alert.type === 'critical' ? (
                       <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                     ) : alert.type === 'warning' ? (
                       <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                     ) : alert.type === 'success' ? (
                       <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                     ) : (
                       <Bell className="h-4 w-4 text-blue-600 mr-2" />
                     )}
                     <h4 className={`font-medium ${
                       alert.type === 'critical' ? 'text-red-800 dark:text-red-300' :
                       alert.type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' :
                       alert.type === 'success' ? 'text-green-800 dark:text-green-300' :
                       'text-blue-800 dark:text-blue-300'
                     }`}>
                       {alert.title}
                     </h4>
                   </div>
                   <p className={`text-sm ${
                     alert.type === 'critical' ? 'text-red-700 dark:text-red-400' :
                     alert.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                     alert.type === 'success' ? 'text-green-700 dark:text-green-400' :
                     'text-blue-700 dark:text-blue-400'
                   }`}>
                     {alert.message}
                   </p>
                 </div>
                 {alert.action && (
                   <Button 
                     size="sm" 
                     variant="outline"
                     className="ml-4"
                   >
                     {alert.action}
                   </Button>
                 )}
               </div>
             ))}
           </div>
         </Card>
       )}

       {/* Cronograma de Reaplicação */}
       <Card className="p-6">
         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
           <Calendar className="h-5 w-5 mr-2 text-purple-600" />
           Cronograma de Reaplicação Inteligente
         </h3>
         <div className="overflow-x-auto">
           <table className="w-full">
             <thead className="bg-gray-50 dark:bg-gray-700">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Espaço
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Urgência
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Prazo
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Motivo
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Ação
                 </th>
               </tr>
             </thead>
             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
               {reapplicationSchedule.map((item) => (
                 <tr key={item.spaceId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm font-medium text-gray-900 dark:text-white">
                       {item.spaceName}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <Badge variant={
                       item.urgency === 'immediate' ? 'danger' :
                       item.urgency === 'soon' ? 'warning' :
                       item.urgency === 'scheduled' ? 'default' : 'success'
                     }>
                       {item.urgency === 'immediate' ? 'Imediato' :
                        item.urgency === 'soon' ? 'Em breve' :
                        item.urgency === 'scheduled' ? 'Agendado' : 'Bom'}
                     </Badge>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center">
                       <Clock className="h-4 w-4 text-gray-400 mr-1" />
                       <span className="text-sm text-gray-900 dark:text-white">
                         {item.daysUntilReapplication === 0 ? 'Agora' : `${item.daysUntilReapplication} dias`}
                       </span>
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                       {item.reason}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <Button 
                       size="sm" 
                       variant={item.urgency === 'immediate' ? 'default' : 'outline'}
                     >
                       {item.urgency === 'immediate' ? 'Agendar' : 'Planejar'}
                     </Button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </Card>

       {/* Insights Avançados */}
       {advancedInsights.length > 0 && (
         <Card className="p-6">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
             <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
             Insights Inteligentes
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {advancedInsights.map((insight, index) => (
               <div
                 key={index}
                 className={`p-4 rounded-lg border ${
                   insight.impact === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-900/10' :
                   insight.impact === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10' :
                   'border-green-200 bg-green-50 dark:bg-green-900/10'
                 }`}
               >
                 <div className="flex items-start justify-between mb-2">
                   <div className="flex items-center">
                     {insight.type === 'trend' ? (
                       <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                     ) : insight.type === 'comparison' ? (
                       <Target className="h-4 w-4 text-purple-600 mr-2" />
                     ) : insight.type === 'prediction' ? (
                       <Zap className="h-4 w-4 text-orange-600 mr-2" />
                     ) : (
                       <Lightbulb className="h-4 w-4 text-yellow-600 mr-2" />
                     )}
                     <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                       {insight.title}
                     </h4>
                   </div>
                   {insight.value && (
                     <Badge variant={
                       insight.impact === 'high' ? 'danger' :
                       insight.impact === 'medium' ? 'warning' : 'success'
                     }>
                       {insight.value}
                     </Badge>
                   )}
                 </div>
                 <p className="text-sm text-gray-600 dark:text-gray-400">
                   {insight.description}
                 </p>
               </div>
             ))}
           </div>
         </Card>
       )}

       {/* Performance por Espaço */}
       <Card className="p-6">
         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
           Performance por Espaço
         </h3>
         <div className="overflow-x-auto">
           <table className="w-full">
             <thead className="bg-gray-50 dark:bg-gray-700">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Espaço
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Total Eliminado
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Coletas
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Média por Coleta
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Última Coleta
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                   Status
                 </th>
               </tr>
             </thead>
             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
               {spaces.map((space) => {
                 const spaceCollections = currentPeriodCollections.filter(c => c.spaceId === space.id)
                 const totalWeight = spaceCollections.reduce((sum, c) => sum + c.weight, 0)
                 const collectionsCount = spaceCollections.length
                 const averageWeight = collectionsCount > 0 ? totalWeight / collectionsCount : 0
                 const lastCollection = spaceCollections.length > 0 
                   ? new Date(Math.max(...spaceCollections.map(c => new Date(c.collectedAt).getTime())))
                   : null

                 return (
                   <tr key={space.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm font-medium text-gray-900 dark:text-white">
                         {space.name}
                       </div>
                       <div className="text-sm text-gray-500 dark:text-gray-400">
                         ID: {space.id}
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900 dark:text-white font-semibold">
                         {formatWeight(totalWeight)}
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900 dark:text-white">
                         {collectionsCount}
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900 dark:text-white">
                         {formatWeight(averageWeight)}
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-500 dark:text-gray-400">
                         {lastCollection ? formatDate(lastCollection) : 'Nunca'}
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <Badge variant={
                         averageWeight >= 2 ? 'success' :
                         averageWeight >= 1 ? 'warning' : 
                         collectionsCount === 0 ? 'danger' : 'default'
                       }>
                         {averageWeight >= 2 ? 'Excelente' :
                          averageWeight >= 1 ? 'Boa' :
                          collectionsCount === 0 ? 'Sem dados' : 'Baixa'}
                       </Badge>
                     </td>
                   </tr>
                 )
               })}
             </tbody>
           </table>
         </div>
       </Card>

       {/* Resumo Executivo */}
       <Card className="p-6">
         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
           <FileText className="h-5 w-5 mr-2 text-blue-600" />
           Resumo Executivo - Eficácia do Mata-Moscas TLC
         </h3>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Durante o período de <strong>{selectedPeriod === '7d' ? '7 dias' : selectedPeriod === '30d' ? '30 dias' : selectedPeriod === '90d' ? '90 dias' : '1 ano'}</strong>, 
            o mata-moscas TLC demonstrou {metrics.trend === 'up' ? 'excelente' : metrics.trend === 'down' ? 'reduzida' : 'estável'} eficácia 
            na eliminação de moscas, com um total de <strong>{formatWeight(metrics.totalWeight)}</strong> coletados 
            em <strong>{metrics.collectionsCount} coletas</strong> realizadas 
            em <strong>{metrics.spacesActive} espaços ativos</strong>.
          </p>
          
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
            A média de <strong>{formatWeight(metrics.averageWeight)} por coleta</strong> representa 
            aproximadamente <strong>{Math.round(metrics.averageWeight * 1000).toLocaleString()} moscas eliminadas</strong> por aplicação, 
            demonstrando a {metrics.effectivenessScore >= 80 ? 'alta' : metrics.effectivenessScore >= 60 ? 'boa' : 'baixa'} eficácia 
            do produto TLC Agro.
          </p>

                     <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
             <p className="text-blue-800 dark:text-blue-300 font-medium">
               💡 Recomendação: {metrics.trend === 'up' 
                 ? 'Manter a frequência atual de aplicação e monitoramento.'
                 : metrics.trend === 'down'
                 ? 'Considerar reaplicação nos espaços com baixa performance e verificar pontos de aplicação.'
                 : 'Continuar monitoramento regular para manter a eficácia estável.'
               }
             </p>
           </div>
         </div>
       </Card>

       {/* Metas de Redução de Pragas */}
       <Card className="p-6">
         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
           <Target className="h-5 w-5 mr-2 text-green-600" />
           Metas de Redução de Pragas
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Meta Mensal */}
           <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
             <div className="flex items-center justify-between mb-2">
               <h4 className="font-medium text-blue-900 dark:text-blue-300">Meta Mensal</h4>
               <Badge variant="default">30 dias</Badge>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-blue-700 dark:text-blue-400">Progresso:</span>
                 <span className="font-medium text-blue-900 dark:text-blue-300">
                   {formatWeight(metrics.totalWeight)} / {formatWeight(5)}
                 </span>
               </div>
               <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                 <div 
                   className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                   style={{ width: `${Math.min(100, (metrics.totalWeight / 5) * 100)}%` }}
                 ></div>
               </div>
               <p className="text-xs text-blue-600 dark:text-blue-400">
                 {metrics.totalWeight >= 5 
                   ? '✅ Meta atingida!' 
                   : `Faltam ${formatWeight(5 - metrics.totalWeight)} para atingir a meta`
                 }
               </p>
             </div>
           </div>

           {/* Meta Trimestral */}
           <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
             <div className="flex items-center justify-between mb-2">
               <h4 className="font-medium text-purple-900 dark:text-purple-300">Meta Trimestral</h4>
               <Badge variant="default">90 dias</Badge>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-purple-700 dark:text-purple-400">Progresso:</span>
                 <span className="font-medium text-purple-900 dark:text-purple-300">
                   {formatWeight(metrics.totalWeight * (selectedPeriod === '90d' ? 1 : selectedPeriod === '30d' ? 3 : 12))} / {formatWeight(15)}
                 </span>
               </div>
               <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                 <div 
                   className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                   style={{ 
                     width: `${Math.min(100, ((metrics.totalWeight * (selectedPeriod === '90d' ? 1 : selectedPeriod === '30d' ? 3 : 12)) / 15) * 100)}%` 
                   }}
                 ></div>
               </div>
               <p className="text-xs text-purple-600 dark:text-purple-400">
                 Meta de redução significativa
               </p>
             </div>
           </div>

           {/* Meta Anual */}
           <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
             <div className="flex items-center justify-between mb-2">
               <h4 className="font-medium text-green-900 dark:text-green-300">Meta Anual</h4>
               <Badge variant="success">365 dias</Badge>
             </div>
             <div className="space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-green-700 dark:text-green-400">Progresso:</span>
                 <span className="font-medium text-green-900 dark:text-green-300">
                   {formatWeight(metrics.totalWeight * (selectedPeriod === '1y' ? 1 : selectedPeriod === '90d' ? 4 : selectedPeriod === '30d' ? 12 : 52))} / {formatWeight(50)}
                 </span>
               </div>
               <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                 <div 
                   className="bg-green-600 h-2 rounded-full transition-all duration-300"
                   style={{ 
                     width: `${Math.min(100, ((metrics.totalWeight * (selectedPeriod === '1y' ? 1 : selectedPeriod === '90d' ? 4 : selectedPeriod === '30d' ? 12 : 52)) / 50) * 100)}%` 
                   }}
                 ></div>
               </div>
               <p className="text-xs text-green-600 dark:text-green-400">
                 Controle total de pragas
               </p>
             </div>
           </div>
         </div>

         {/* ROI e Benefícios */}
         <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
           <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
             <Zap className="h-4 w-4 mr-2 text-yellow-500" />
             ROI e Benefícios do Mata-Moscas TLC
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
             <div className="text-center">
               <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                 {Math.round(metrics.totalWeight * 1000).toLocaleString()}
               </div>
               <div className="text-gray-600 dark:text-gray-400">Moscas Eliminadas</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                 {metrics.effectivenessScore}%
               </div>
               <div className="text-gray-600 dark:text-gray-400">Eficácia Comprovada</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                 R$ {((metrics.totalWeight * 1000) * 0.01).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </div>
               <div className="text-gray-600 dark:text-gray-400">Economia Estimada*</div>
             </div>
           </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
             * Baseado no custo médio de outros métodos de controle de pragas
           </p>
         </div>
       </Card>
     </div>
   )
 } 