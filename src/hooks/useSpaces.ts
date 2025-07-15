import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Space as SupabaseSpace } from '@/lib/supabase'
import type { Space, CreateSpaceData } from '@/types'
import { mapSupabaseSpaceToLegacy, mapLegacySpaceToSupabase } from '@/lib/typeMappers'
import { useAuthContext } from '@/contexts/AuthContext'

interface UseSpacesOptions {
  searchTerm?: string
  sortBy?: 'name' | 'client_id' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  filterActive?: boolean
  clientId?: string
}

interface UseSpacesReturn {
  // Data
  spaces: Space[]
  filteredSpaces: Space[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createSpace: (data: CreateSpaceData) => Promise<Space>
  updateSpace: (id: string, data: Partial<CreateSpaceData>) => Promise<Space>
  deleteSpace: (id: string) => Promise<void>
  getSpace: (id: string) => Space | undefined
  getSpacesByClient: (clientId: string) => Space[]
  
  // Utilities
  searchSpaces: (term: string) => void
  sortSpaces: (field: 'name' | 'client_id' | 'created_at', order?: 'asc' | 'desc') => void
  clearError: () => void
  refreshSpaces: () => void
  
  // Stats
  totalSpaces: number
  activeSpaces: number
  inactiveSpaces: number
}

export const useSpaces = (options: UseSpacesOptions = {}): UseSpacesReturn => {
  const { user, userType, accountContext } = useAuthContext()
  const [supabaseSpaces, setSupabaseSpaces] = useState<SupabaseSpace[]>([])
  const [isLoading, setIsLoading] = useState(true) // Iniciar como true para evitar flash
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm] = useState(options.searchTerm || '')
  const [sortBy, setSortBy] = useState<'name' | 'client_id' | 'created_at'>(options.sortBy || 'name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.sortOrder || 'asc')
  
  // Refs para controle
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)

  // Mapear espaços Supabase para frontend
  const spaces = useMemo(() => {
    return supabaseSpaces.map(mapSupabaseSpaceToLegacy)
  }, [supabaseSpaces])

  // Fetch spaces from Supabase
  const fetchSpaces = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (fetchingRef.current) {
      console.log('⚠️ Fetch já em andamento, pulando...')
      return
    }
    
    fetchingRef.current = true
    setIsLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from('spaces')
        .select(`
          *,
          accounts!inner (
            id,
            company_name,
            email,
            status
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply automatic client filtering based on user context
      const targetAccountId = options.clientId || accountContext || user?.account_id
      
      // For non-admin users, filter by their account
      if (userType !== 'admin' && targetAccountId) {
        query = query.eq('account_id', targetAccountId)
              } else if (options.clientId) {
        // For admin users, respect explicit clientId filter
        query = query.eq('account_id', options.clientId)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Verificar se o componente ainda está montado antes de atualizar o estado
      if (!isMountedRef.current) {
        console.log('⚠️ Componente desmontado, cancelando atualização de estado')
        return
      }

      setSupabaseSpaces(data || [])
    } catch (err) {
      console.error('Erro ao buscar espaços:', err)
      
      // Verificar se ainda está montado antes de definir erro
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar espaços'
        setError(errorMessage)
      }
    } finally {
      fetchingRef.current = false
      
      // Verificar se ainda está montado antes de definir loading
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [sortBy, sortOrder, options.clientId, userType, accountContext, user?.account_id])

  // Initial load e cleanup
  useEffect(() => {
    // Resetar flags ao montar
    isMountedRef.current = true
    fetchingRef.current = false
    
    // Chamar fetchSpaces
    fetchSpaces()
    
    // Cleanup ao desmontar
    return () => {
      isMountedRef.current = false
      fetchingRef.current = false
    }
  }, [fetchSpaces])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Create space
  const createSpace = useCallback(async (data: CreateSpaceData): Promise<Space> => {
    console.log('🎯 Iniciando createSpace com dados:', data)
    setIsCreating(true)
    setError(null)
    
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!data.clientId) {
        throw new Error('Cliente é obrigatório')
      }
      
      // Validate environment type
      if (data.environmentType && !['indoor', 'outdoor', 'mixed'].includes(data.environmentType)) {
        throw new Error('Tipo de ambiente inválido')
      }
      
      console.log('✅ Validação passou, convertendo dados...')
      const supabaseData = mapLegacySpaceToSupabase({ ...data, active: true })
      
      console.log('📡 Fazendo insert no Supabase...')
      const { data: newSpace, error } = await supabase
        .from('spaces')
        .insert([supabaseData])
        .select(`
          *,
          accounts!inner (
            id,
            company_name,
            email,
            status
          )
        `)
        .single()

      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw error
      }

      console.log('✅ Espaço criado no Supabase:', newSpace)
      
      // Mapear de volta para tipo frontend
      const mappedSpace = mapSupabaseSpaceToLegacy(newSpace)
      console.log('🔄 Espaço mapeado para frontend:', mappedSpace)

      // Refresh spaces list
      await fetchSpaces()
      
      return mappedSpace
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar espaço'
      console.error('💥 Erro geral ao criar espaço:', err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [fetchSpaces])

  // Update space
  const updateSpace = useCallback(async (id: string, data: Partial<CreateSpaceData>): Promise<Space> => {
    console.log('🎯 Iniciando updateSpace com dados:', data)
    setIsUpdating(true)
    setError(null)
    
    try {
      // Validate required fields if provided
      if (data.name !== undefined && !data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      
      // Validate environment type if provided
      if (data.environmentType && !['indoor', 'outdoor', 'mixed'].includes(data.environmentType)) {
        throw new Error('Tipo de ambiente inválido')
      }
      
      console.log('✅ Validação passou, convertendo dados...')
      const supabaseData = mapLegacySpaceToSupabase({ ...data, active: true })
      
      console.log('📡 Fazendo update no Supabase...')
      const { data: updatedSpace, error } = await supabase
        .from('spaces')
        .update(supabaseData)
        .eq('id', id)
        .select(`
          *,
          accounts!inner (
            id,
            company_name,
            email,
            status
          )
        `)
        .single()

      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw error
      }

      console.log('✅ Espaço atualizado no Supabase:', updatedSpace)
      
      // Mapear de volta para tipo frontend
      const mappedSpace = mapSupabaseSpaceToLegacy(updatedSpace)
      console.log('🔄 Espaço mapeado para frontend:', mappedSpace)

      // Refresh spaces list
      await fetchSpaces()
      
      return mappedSpace
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar espaço'
      console.error('💥 Erro geral ao atualizar espaço:', err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [fetchSpaces])

  // Delete space (soft delete)
  const deleteSpace = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ status: 'inactive' })
        .eq('id', id)

      if (error) {
        throw error
      }
      
      // Refresh spaces list
      await fetchSpaces()
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir espaço'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }, [fetchSpaces])

  // Get space by ID
  const getSpace = useCallback((id: string): Space | undefined => {
    return spaces.find(space => space.id === id)
  }, [spaces])

  // Get spaces by client
  const getSpacesByClient = useCallback((clientId: string): Space[] => {
    return spaces.filter(space => space.clientId === clientId && space.active)
  }, [spaces])

  // Search spaces
  const searchSpaces = useCallback((searchTerm: string, options: {
    filterActive?: boolean
  } = {}) => {
    let filtered = spaces

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(space =>
        space.name.toLowerCase().includes(term) ||
        space.description?.toLowerCase().includes(term) ||
        space.environmentType?.toLowerCase().includes(term) ||
        (space as any).client?.name?.toLowerCase().includes(term)
      )
    }

    if (options.filterActive !== undefined) {
      filtered = filtered.filter(space =>
        options.filterActive ? space.active : !space.active
      )
    }

    return filtered
  }, [spaces])

  // Sort spaces
  const sortSpaces = useCallback((field: 'name' | 'client_id' | 'created_at', order: 'asc' | 'desc' = 'asc') => {
    setSortBy(field)
    setSortOrder(order)
  }, [])

  // Refresh spaces
  const refreshSpaces = useCallback(() => {
    fetchSpaces()
  }, [fetchSpaces])

  // Filter and sort spaces
  const filteredSpaces = useMemo(() => {
    let filtered = spaces

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(space =>
        space.name.toLowerCase().includes(term) ||
        space.description?.toLowerCase().includes(term) ||
        space.environmentType?.toLowerCase().includes(term) ||
        (space as any).client?.name?.toLowerCase().includes(term)
      )
    }

    // Apply active filter
    if (options.filterActive !== undefined) {
      filtered = filtered.filter(space => 
        options.filterActive ? space.active : !space.active
      )
    }

    return filtered
  }, [spaces, searchTerm, options.filterActive])

  // Stats
  const totalSpaces = spaces.length
  const activeSpaces = spaces.filter(space => space.active).length
  const inactiveSpaces = spaces.filter(space => !space.active).length

  return {
    // Data
    spaces,
    filteredSpaces,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    error,
    
    // CRUD operations
    createSpace,
    updateSpace,
    deleteSpace,
    getSpace,
    getSpacesByClient,
    
    // Utilities
    searchSpaces,
    sortSpaces,
    clearError,
    refreshSpaces,
    
    // Stats
    totalSpaces,
    activeSpaces,
    inactiveSpaces
  }
}

// Hook wrapper que aplica automaticamente filtro por cliente
export const useClientSpaces = (options: Omit<UseSpacesOptions, 'clientId'> = {}) => {
  const { userType, accountContext, user } = useAuthContext()
  
  // Para admin: não aplica filtro de cliente (vê todos)
  // Para supervisor/operador: aplica filtro do cliente atual
  const clientId = userType === 'admin' ? undefined : (accountContext || user?.account_id || undefined)
  
  return useSpaces({
    ...options,
    clientId
  })
} 