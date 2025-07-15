import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { Collection as FrontendCollection, CreateCollectionData } from '@/types/collection'
import { mapSupabaseCollectionToLegacy, mapLegacyCollectionToSupabase } from '@/lib/typeMappers'
import { useAuthContext } from '@/contexts/AuthContext'

type DatabaseCollection = Tables<'collections'>

interface UseCollectionsReturn {
  collections: FrontendCollection[]
  collectionsDetailed: any[] // Usar any temporariamente até definir o tipo correto
  filteredCollections: FrontendCollection[]
  
  // Loading states
  isLoading: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createCollection: (data: CreateCollectionData) => Promise<FrontendCollection>
  updateCollection: (id: string, data: Partial<CreateCollectionData>) => Promise<FrontendCollection>
  deleteCollection: (id: string) => Promise<void>
  getCollection: (id: string) => FrontendCollection | undefined
  getCollectionsBySpace: (spaceId: string) => FrontendCollection[]
  getCollectionsByUser: (userId: string) => FrontendCollection[]
  
  // Utilities
  searchCollections: (term: string) => FrontendCollection[]
  sortCollections: (field: string, order: 'asc' | 'desc') => void
  clearError: () => void
  refreshCollections: () => void
  
  // Stats
  totalCollections: number
  totalWeight: number
  thisMonthWeight: number
}

export const useCollections = (): UseCollectionsReturn => {
  const { userType, accountContext } = useAuthContext()
  const [collections, setCollections] = useState<FrontendCollection[]>([])
  const [collectionsDetailed, setCollectionsDetailed] = useState<any[]>([]) // Usar any temporariamente
  const [isLoading, setIsLoading] = useState(true) // Iniciar como true para evitar flash
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs para controle
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)
  
  // Usar ref para evitar recarregamentos desnecessários
  const lastUserTypeRef = useRef(userType)
  const lastAccountContextRef = useRef(accountContext)

  const loadCollections = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (fetchingRef.current) {
      console.log('⚠️ Fetch já em andamento, pulando...')
      return
    }
    
    try {
      fetchingRef.current = true
      setIsLoading(true)
      console.log('🔄 Carregando coletas...')

      let query = supabase
        .from('collections')
        .select(`
          *,
          spaces!inner(
            id,
            name,
            account_id,
            accounts!inner(
              id,
              company_name
            )
          ),
          users!inner(
            id,
            name,
            role
          )
        `)
        .order('collection_date', { ascending: false })

      // Aplicar filtro por conta se não for admin
      if (userType !== 'admin' && accountContext) {
        const accountId = typeof accountContext === 'string' ? accountContext : (accountContext as any)?.accountId
        if (accountId) {
          query = query.eq('spaces.account_id', accountId)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao carregar coletas:', error)
        throw error
      }

      console.log('📦 Dados brutos do Supabase:', data)

      if (data) {
        // Verificar se o componente ainda está montado antes de atualizar o estado
        if (!isMountedRef.current) {
          console.log('⚠️ Componente desmontado, cancelando atualização de estado')
          return
        }
        
        // Mapear os dados para o tipo frontend
        const mappedData = data.map(item => {
          const mapped = mapSupabaseCollectionToLegacy(item as DatabaseCollection)
          // Adicionar accountId através do join
          mapped.clientId = (item as any).spaces?.accounts?.id || ''
          return mapped
        })
        
        console.log('📤 Coletas mapeadas:', mappedData)
        setCollections(mappedData)
        setCollectionsDetailed(data) // Manter dados brutos para uso detalhado
      }
    } catch (error) {
      console.error('❌ Erro ao carregar coletas:', error)
      
      // Verificar se ainda está montado antes de definir erro
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : 'Erro desconhecido')
      }
    } finally {
      fetchingRef.current = false
      
      // Verificar se ainda está montado antes de definir loading
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, []) // Remover dependências para evitar loops

  // Initial load e cleanup
  useEffect(() => {
    // Resetar flags ao montar
    isMountedRef.current = true
    fetchingRef.current = false
    
    // Chamar loadCollections
    loadCollections()
    
    // Cleanup ao desmontar
    return () => {
      isMountedRef.current = false
      fetchingRef.current = false
    }
  }, [loadCollections])

  // Recarregar quando contexto mudar significativamente
  useEffect(() => {
    // Skip no primeiro render
    if (lastUserTypeRef.current === undefined && lastAccountContextRef.current === undefined) {
      lastUserTypeRef.current = userType
      lastAccountContextRef.current = accountContext
      return
    }

    const shouldReload = 
      lastUserTypeRef.current !== userType || 
      lastAccountContextRef.current !== accountContext

    if (shouldReload) {
      lastUserTypeRef.current = userType
      lastAccountContextRef.current = accountContext
      loadCollections()
    }
  }, [userType, accountContext]) // Remover loadCollections das dependências

  // Refresh collections function
  const refreshCollections = useCallback(() => {
    loadCollections()
  }, [loadCollections])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Create collection
  const createCollection = useCallback(async (data: CreateCollectionData): Promise<FrontendCollection> => {
    console.log('📝 Criando nova coleta:', data)
    
    const supabaseData = mapLegacyCollectionToSupabase(data)
    console.log('📤 Dados para inserção no Supabase:', supabaseData)

    const { data: createdData, error } = await supabase
      .from('collections')
      .insert(supabaseData)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar coleta:', error)
      throw error
    }

    console.log('✅ Coleta criada:', createdData)
    const mappedCollection = mapSupabaseCollectionToLegacy(createdData as DatabaseCollection)
    
    // Atualizar estado local
    setCollections(prev => [mappedCollection, ...prev])
    
    // Recarregar para pegar dados completos com joins
    setTimeout(() => loadCollections(), 100)
    
    return mappedCollection
  }, [loadCollections])

  // Update collection
  const updateCollection = useCallback(async (id: string, data: Partial<CreateCollectionData>): Promise<FrontendCollection> => {
    console.log('📝 Atualizando coleta:', { id, data })
    
    const supabaseData = mapLegacyCollectionToSupabase(data as any)
    console.log('📤 Dados para atualização no Supabase:', supabaseData)

    const { data: updatedData, error } = await supabase
      .from('collections')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar coleta:', error)
      throw error
    }

    console.log('✅ Coleta atualizada:', updatedData)
    const mappedCollection = mapSupabaseCollectionToLegacy(updatedData as DatabaseCollection)
    
    // Atualizar estado local
    setCollections(prev => 
      prev.map(collection => 
        collection.id === id ? mappedCollection : collection
      )
    )
    
    // Recarregar para pegar dados completos
    setTimeout(() => loadCollections(), 100)
    
    return mappedCollection
  }, [loadCollections])

  // Delete collection
  const deleteCollection = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw error
      }
      
      // Refresh collections list
      await loadCollections()
    } catch (error) {
      console.error('❌ Erro ao deletar coleta:', error)
      setError(error instanceof Error ? error.message : 'Erro ao deletar coleta')
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [loadCollections])

  // Get single collection
  const getCollection = useCallback((id: string): FrontendCollection | undefined => {
    return collections.find(collection => collection.id === id)
  }, [collections])

  // Get collections by space
  const getCollectionsBySpace = useCallback((spaceId: string): FrontendCollection[] => {
    return collections.filter(collection => collection.spaceId === spaceId)
  }, [collections])

  // Get collections by user (updated from getCollectionsByOperator)
  const getCollectionsByUser = useCallback((userId: string): FrontendCollection[] => {
    return collections.filter(collection => collection.operatorId === userId)
  }, [collections])

  // Search collections
  const searchCollections = useCallback((term: string): FrontendCollection[] => {
    const searchTerm = term.toLowerCase().trim()
    if (!searchTerm) return collections

    return collections.filter(collection => 
      collection.notes?.toLowerCase().includes(searchTerm) ||
      collection.id.toLowerCase().includes(searchTerm)
    )
  }, [collections])

  // Sort collections
  const sortCollections = useCallback((field: string, order: 'asc' | 'desc') => {
    setCollections(prev => [...prev].sort((a, b) => {
      const aValue = (a as any)[field]
      const bValue = (b as any)[field]
      
      if (aValue < bValue) return order === 'asc' ? -1 : 1
      if (aValue > bValue) return order === 'asc' ? 1 : -1
      return 0
    }))
  }, [])

  // Memoized derived values
  const filteredCollections = useMemo(() => {
    return collections
  }, [collections])

  const totalCollections = useMemo(() => collections.length, [collections])
  
  const totalWeight = useMemo(() => 
    collections.reduce((sum, collection) => sum + (collection.weight || 0), 0), 
    [collections]
  )
  
  const thisMonthWeight = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    return collections
      .filter(collection => {
        const collectionDate = new Date(collection.collectedAt)
        return collectionDate >= startOfMonth
      })
      .reduce((sum, collection) => sum + (collection.weight || 0), 0)
  }, [collections])

  return {
    collections,
    collectionsDetailed,
    filteredCollections,
    isLoading,
    isDeleting,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    getCollection,
    getCollectionsBySpace,
    getCollectionsByUser,
    searchCollections,
    sortCollections,
    clearError,
    refreshCollections,
    totalCollections,
    totalWeight,
    thisMonthWeight
  }
}

 