import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Report, ReportInsert, MonthlyStatistics } from '@/lib/supabase'

interface UseReportsOptions {
  accountId?: string  // Mudando de clientId para accountId
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
  monthlyStatistics: MonthlyStatistics[]
  
  // Loading states
  isLoading: boolean
  isGenerating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // Operations
  generateReport: (data: Omit<ReportInsert, 'id'>) => Promise<Report>
  deleteReport: () => Promise<void>
  getReport: (id: string) => Report | undefined
  getReportsByClient: (clientId: string) => Report[]
  
  // Utilities
  clearError: () => void
  refreshReports: () => void
  refreshStatistics: () => void
}

export const useReports = (options: UseReportsOptions = {}): UseReportsReturn => {
  const [reports, setReports] = useState<Report[]>([])
  const [monthlyStatistics, setMonthlyStatistics] = useState<MonthlyStatistics[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          accounts!inner (
            company_name,
            contact_person
          ),
          spaces (
            name
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (options.accountId) {
        query = query.eq('account_id', options.accountId)
      }
      if (options.spaceId) {
        query = query.eq('space_id', options.spaceId)
      }
      if (options.reportType) {
        query = query.eq('report_type', options.reportType)
      }
      if (options.dateRange) {
        query = query
          .gte('start_date', options.dateRange.start.toISOString())
          .lte('end_date', options.dateRange.end.toISOString())
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setReports(data || [])
    } catch (err) {
      console.error('Erro ao buscar relatórios:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [options.accountId, options.spaceId, options.reportType, options.dateRange])

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
    fetchMonthlyStatistics()
  }, [fetchReports, fetchMonthlyStatistics])

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
      if (!data.account_id) {
        throw new Error('Cliente é obrigatório')
      }
      if (!data.start_date || !data.end_date) {
        throw new Error('Período é obrigatório')
      }
      
      // Calculate totals based on collections in the period
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('weight_collected')
        .eq('space_id', data.space_id || '')
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
          account_id: data.account_id,
          space_id: data.space_id || null,
          report_type: data.report_type || 'monthly',
          start_date: data.start_date,
          end_date: data.end_date,
          total_weight: totalWeight,
          total_collections: totalCollections
        }])
        .select(`
          *,
          accounts!inner (
            company_name,
            contact_person
          ),
          spaces (
            name
          )
        `)
        .single()

      if (error) {
        throw error
      }

      // Update local state
      setReports(prev => [newReport, ...prev])
      
      return newReport
    } catch (err) {
      console.error('Erro ao gerar relatório:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatório'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // Get reports by client
  const getReportsByClient = useCallback((clientId: string): Report[] => {
    return reports.filter(report => report.account_id === clientId)
  }, [reports])

  return {
    // Data
    reports,
    monthlyStatistics,
    
    // Loading states
    isLoading,
    isGenerating,
    isDeleting: false, // Removed setIsDeleting
    
    // Error states
    error,
    
    // Operations
    generateReport,
    deleteReport: () => Promise.resolve(),
    getReport: (id: string) => reports.find(r => r.id === id),
    getReportsByClient,
    
    // Utilities
    clearError,
    refreshReports: fetchReports,
    refreshStatistics: fetchMonthlyStatistics
  }
} 