import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Report, ReportInsert, ClientStatistics, MonthlyStatistics } from '@/lib/supabase'

interface UseReportsOptions {
  clientId?: string
  spaceId?: string
  reportType?: 'monthly' | 'quarterly' | 'yearly' | 'custom'
  dateRange?: {
    start: Date
    end: Date
  }
}

interface UseReportsReturn {
  // Data
  reports: Report[]
  clientStatistics: ClientStatistics[]
  monthlyStatistics: MonthlyStatistics[]
  
  // Loading states
  isLoading: boolean
  isGenerating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // Operations
  generateReport: (data: Omit<ReportInsert, 'id'>) => Promise<Report>
  generateMonthlyReport: (clientId: string, month: string) => Promise<string>
  deleteReport: (id: string) => Promise<void>
  getReport: (id: string) => Report | undefined
  getReportsByClient: (clientId: string) => Report[]
  
  // Utilities
  clearError: () => void
  refreshReports: () => void
  refreshStatistics: () => void
  
  // Analytics
  getClientTotalWeight: (clientId: string, startDate: Date, endDate: Date) => Promise<number>
  getClientCollectionsCount: (clientId: string, startDate: Date, endDate: Date) => Promise<number>
  getSpaceEffectiveness: (spaceId: string, startDate: Date, endDate: Date) => Promise<number>
}

export const useReports = (options: UseReportsOptions = {}): UseReportsReturn => {
  const [reports, setReports] = useState<Report[]>([])
  const [clientStatistics, setClientStatistics] = useState<ClientStatistics[]>([])
  const [monthlyStatistics, setMonthlyStatistics] = useState<MonthlyStatistics[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch reports from Supabase
  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          clients!inner (
            id,
            name,
            email
          ),
          spaces (
            id,
            name
          )
        `)
        .order('generated_at', { ascending: false })

      // Apply filters
      if (options.clientId) {
        query = query.eq('client_id', options.clientId)
      }
      if (options.spaceId) {
        query = query.eq('space_id', options.spaceId)
      }
      if (options.reportType) {
        query = query.eq('report_type', options.reportType)
      }
      if (options.dateRange) {
        query = query
          .gte('start_date', options.dateRange.start.toISOString().split('T')[0])
          .lte('end_date', options.dateRange.end.toISOString().split('T')[0])
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setReports(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar relatórios'
      setError(errorMessage)
      console.error('Erro ao buscar relatórios:', err)
    } finally {
      setIsLoading(false)
    }
  }, [options.clientId, options.spaceId, options.reportType, options.dateRange])

  // Fetch client statistics
  const fetchClientStatistics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('client_statistics')
        .select('*')
        .order('total_weight_collected', { ascending: false })

      if (error) {
        throw error
      }

      setClientStatistics(data || [])
    } catch (err) {
      console.error('Erro ao buscar estatísticas dos clientes:', err)
    }
  }, [])

  // Fetch monthly statistics
  const fetchMonthlyStatistics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_statistics')
        .select('*')
        .order('month', { ascending: false })

      if (error) {
        throw error
      }

      setMonthlyStatistics(data || [])
    } catch (err) {
      console.error('Erro ao buscar estatísticas mensais:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchReports()
    fetchClientStatistics()
    fetchMonthlyStatistics()
  }, [fetchReports, fetchClientStatistics, fetchMonthlyStatistics])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Generate report
  const generateReport = useCallback(async (data: Omit<ReportInsert, 'id'>): Promise<Report> => {
    setIsGenerating(true)
    setError(null)
    
    try {
      // Validate required fields
      if (!data.client_id) {
        throw new Error('Cliente é obrigatório')
      }
      if (!data.start_date || !data.end_date) {
        throw new Error('Período é obrigatório')
      }
      
      // Calculate totals based on collections in the period
      const { data: collections, error: collectionsError } = await supabase
        .from('collections_detailed')
        .select('weight_collected')
        .eq('client_id', data.client_id)
        .gte('collection_date', data.start_date)
        .lte('collection_date', data.end_date)

      if (collectionsError) {
        throw collectionsError
      }

      const totalWeight = collections?.reduce((sum, c) => sum + (c.weight_collected || 0), 0) || 0
      const totalCollections = collections?.length || 0

      const { data: newReport, error } = await supabase
        .from('reports')
        .insert([{
          client_id: data.client_id,
          space_id: data.space_id || null,
          report_type: data.report_type || 'monthly',
          start_date: data.start_date,
          end_date: data.end_date,
          total_weight: totalWeight,
          total_collections: totalCollections
        }])
        .select(`
          *,
          clients!inner (
            id,
            name,
            email
          ),
          spaces (
            id,
            name
          )
        `)
        .single()

      if (error) {
        throw error
      }

      // Refresh reports list
      await fetchReports()
      
      return newReport
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatório'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }, [fetchReports])

  // Generate monthly report using database function
  const generateMonthlyReport = useCallback(async (clientId: string, month: string): Promise<string> => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .rpc('generate_monthly_report', {
          client_uuid: clientId,
          report_month: month
        })

      if (error) {
        throw error
      }

      // Refresh reports list
      await fetchReports()
      
      return data as string
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatório mensal'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }, [fetchReports])

  // Delete report
  const deleteReport = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      // Refresh reports list
      await fetchReports()
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir relatório'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }, [fetchReports])

  // Get report by ID
  const getReport = useCallback((id: string): Report | undefined => {
    return reports.find(report => report.id === id)
  }, [reports])

  // Get reports by client
  const getReportsByClient = useCallback((clientId: string): Report[] => {
    return reports.filter(report => report.client_id === clientId)
  }, [reports])

  // Refresh reports
  const refreshReports = useCallback(() => {
    fetchReports()
  }, [fetchReports])

  // Refresh statistics
  const refreshStatistics = useCallback(() => {
    fetchClientStatistics()
    fetchMonthlyStatistics()
  }, [fetchClientStatistics, fetchMonthlyStatistics])

  // Analytics functions using database functions
  const getClientTotalWeight = useCallback(async (clientId: string, startDate: Date, endDate: Date): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('get_client_total_weight', {
          client_uuid: clientId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        })

      if (error) {
        throw error
      }

      return data as number
    } catch (err) {
      console.error('Erro ao buscar peso total do cliente:', err)
      return 0
    }
  }, [])

  const getClientCollectionsCount = useCallback(async (clientId: string, startDate: Date, endDate: Date): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('get_client_collections_count', {
          client_uuid: clientId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        })

      if (error) {
        throw error
      }

      return data as number
    } catch (err) {
      console.error('Erro ao buscar número de coletas do cliente:', err)
      return 0
    }
  }, [])

  const getSpaceEffectiveness = useCallback(async (spaceId: string, startDate: Date, endDate: Date): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('get_space_effectiveness', {
          space_uuid: spaceId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        })

      if (error) {
        throw error
      }

      return data as number
    } catch (err) {
      console.error('Erro ao buscar efetividade do espaço:', err)
      return 0
    }
  }, [])

  return {
    // Data
    reports,
    clientStatistics,
    monthlyStatistics,
    
    // Loading states
    isLoading,
    isGenerating,
    isDeleting,
    
    // Error states
    error,
    
    // Operations
    generateReport,
    generateMonthlyReport,
    deleteReport,
    getReport,
    getReportsByClient,
    
    // Utilities
    clearError,
    refreshReports,
    refreshStatistics,
    
    // Analytics
    getClientTotalWeight,
    getClientCollectionsCount,
    getSpaceEffectiveness
  }
} 