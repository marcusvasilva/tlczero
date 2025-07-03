import { useState, useCallback, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { mockOperators } from '@/data/mockOperators'
import type { Operator, CreateOperatorData, UpdateOperatorData } from '@/types'

interface UseOperatorsOptions {
  searchTerm?: string
  sortBy?: 'name' | 'email' | 'role' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  filterActive?: boolean
  filterRole?: 'admin' | 'supervisor' | 'operador'
}

interface UseOperatorsReturn {
  // Data
  operators: Operator[]
  filteredOperators: Operator[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // CRUD operations
  createOperator: (data: CreateOperatorData) => Promise<Operator>
  updateOperator: (id: string, data: UpdateOperatorData) => Promise<Operator>
  deleteOperator: (id: string) => Promise<void>
  activateOperator: (id: string) => Promise<Operator>
  deactivateOperator: (id: string) => Promise<Operator>
  getOperator: (id: string) => Operator | undefined
  getOperatorsByRole: (role: 'admin' | 'supervisor' | 'operador') => Operator[]
  
  // Utilities
  searchOperators: (term: string) => void
  sortOperators: (field: 'name' | 'email' | 'role' | 'createdAt', order?: 'asc' | 'desc') => void
  filterByRole: (role: 'admin' | 'supervisor' | 'operador' | '') => void
  clearError: () => void
  refreshOperators: () => void
  
  // Stats
  totalOperators: number
  activeOperators: number
  inactiveOperators: number
  operatorsByRole: Record<string, number>
}

export const useOperators = (options: UseOperatorsOptions = {}): UseOperatorsReturn => {
  const [operators, setOperators] = useLocalStorage<Operator[]>('tlc-operators', mockOperators)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(options.searchTerm || '')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'createdAt'>(options.sortBy || 'name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.sortOrder || 'asc')
  const [roleFilter, setRoleFilter] = useState<'admin' | 'supervisor' | 'operador' | ''>(options.filterRole || '')

  // Simulate API delay
  const simulateDelay = useCallback((ms: number = 800) => 
    new Promise(resolve => setTimeout(resolve, ms)), [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Create operator
  const createOperator = useCallback(async (data: CreateOperatorData): Promise<Operator> => {
    setIsCreating(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!data.role) {
        throw new Error('Função é obrigatória')
      }
      if (!data.clientId?.trim()) {
        throw new Error('Cliente é obrigatório')
      }
      
      // Check if email already exists (only if email is provided)
      if (data.email?.trim()) {
        const emailExists = operators.some(operator => 
          operator.email?.toLowerCase() === data.email?.toLowerCase()
        )
        if (emailExists) {
          throw new Error('Email já está em uso')
        }
      }
      
      const newOperator: Operator = {
        id: Date.now().toString(),
        name: data.name.trim(),
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        cpf: data.cpf?.trim() || undefined,
        role: data.role,
        active: data.active,
        hireDate: new Date(),
        clientId: data.clientId,
        avatar: data.avatar,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setOperators(prev => [newOperator, ...prev])
      return newOperator
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar operador'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [operators, setOperators, simulateDelay])

  // Update operator
  const updateOperator = useCallback(async (id: string, data: UpdateOperatorData): Promise<Operator> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      const existingOperator = operators.find(operator => operator.id === id)
      if (!existingOperator) {
        throw new Error('Operador não encontrado')
      }
      
      // Validate required fields if provided
      if (data.name !== undefined && !data.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (data.email !== undefined && !data.email?.trim()) {
        throw new Error('Email é obrigatório')
      }
      
      // Check if email already exists (excluding current operator)
      if (data.email) {
        const emailExists = operators.some(operator => 
          operator.id !== id && operator.email?.toLowerCase() === data.email!.toLowerCase()
        )
        if (emailExists) {
          throw new Error('Email já está em uso')
        }
      }
      
      const updatedOperator: Operator = {
        ...existingOperator,
        ...data,
        name: data.name?.trim() || existingOperator.name,
        email: data.email?.trim() || existingOperator.email,
        phone: data.phone?.trim() || existingOperator.phone,
        cpf: data.cpf?.trim() || existingOperator.cpf,
        updatedAt: new Date()
      }
      
      setOperators(prev => prev.map(operator => 
        operator.id === id ? updatedOperator : operator
      ))
      
      return updatedOperator
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar operador'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [operators, setOperators, simulateDelay])

  // Delete operator (soft delete)
  const deleteOperator = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      await simulateDelay()
      
      const existingOperator = operators.find(operator => operator.id === id)
      if (!existingOperator) {
        throw new Error('Operador não encontrado')
      }
      
      // Soft delete - mark as inactive
      setOperators(prev => prev.map(operator => 
        operator.id === id 
          ? { ...operator, active: false, updatedAt: new Date() }
          : operator
      ))
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir operador'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }, [operators, setOperators, simulateDelay])

  // Activate operator
  const activateOperator = useCallback(async (id: string): Promise<Operator> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      await simulateDelay(400)
      
      const existingOperator = operators.find(operator => operator.id === id)
      if (!existingOperator) {
        throw new Error('Operador não encontrado')
      }
      
      const updatedOperator = {
        ...existingOperator,
        active: true,
        updatedAt: new Date()
      }
      
      setOperators(prev => prev.map(operator => 
        operator.id === id ? updatedOperator : operator
      ))
      
      return updatedOperator
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao ativar operador'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [operators, setOperators, simulateDelay])

  // Deactivate operator
  const deactivateOperator = useCallback(async (id: string): Promise<Operator> => {
    setIsUpdating(true)
    setError(null)
    
    try {
      await simulateDelay(400)
      
      const existingOperator = operators.find(operator => operator.id === id)
      if (!existingOperator) {
        throw new Error('Operador não encontrado')
      }
      
      const updatedOperator = {
        ...existingOperator,
        active: false,
        updatedAt: new Date()
      }
      
      setOperators(prev => prev.map(operator => 
        operator.id === id ? updatedOperator : operator
      ))
      
      return updatedOperator
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desativar operador'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }, [operators, setOperators, simulateDelay])

  // Get single operator
  const getOperator = useCallback((id: string): Operator | undefined => {
    return operators.find(operator => operator.id === id)
  }, [operators])

  // Get operators by role
  const getOperatorsByRole = useCallback((role: 'admin' | 'supervisor' | 'operador'): Operator[] => {
    return operators.filter(operator => operator.role === role && operator.active)
  }, [operators])

  // Search operators
  const searchOperators = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Sort operators
  const sortOperators = useCallback((field: 'name' | 'email' | 'role' | 'createdAt', order: 'asc' | 'desc' = 'asc') => {
    setSortBy(field)
    setSortOrder(order)
  }, [])

  // Filter by role
  const filterByRole = useCallback((role: 'admin' | 'supervisor' | 'operador' | '') => {
    setRoleFilter(role)
  }, [])

  // Refresh operators (reload from storage)
  const refreshOperators = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      // This would typically refetch from API
      setIsLoading(false)
    }, 500)
  }, [])

  // Filtered and sorted operators
  const filteredOperators = useMemo(() => {
    let filtered = operators

    // Apply active filter
    if (options.filterActive !== undefined) {
      filtered = filtered.filter(operator => operator.active === options.filterActive)
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(operator => operator.role === roleFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(operator =>
        operator.name.toLowerCase().includes(term) ||
        operator.email?.toLowerCase().includes(term) ||
        operator.phone?.includes(term) ||
        operator.cpf?.includes(term) ||
        operator.role.toLowerCase().includes(term)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | Date
      let bValue: string | Date

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'email':
          aValue = a.email?.toLowerCase() || ''
          bValue = b.email?.toLowerCase() || ''
          break
        case 'role':
          aValue = a.role.toLowerCase()
          bValue = b.role.toLowerCase()
          break
        case 'createdAt':
          aValue = a.createdAt
          bValue = b.createdAt
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [operators, searchTerm, sortBy, sortOrder, options.filterActive, roleFilter])

  // Statistics
  const totalOperators = useMemo(() => operators.length, [operators])
  const activeOperators = useMemo(() => operators.filter(operator => operator.active).length, [operators])
  const inactiveOperators = useMemo(() => operators.filter(operator => !operator.active).length, [operators])
  
  const operatorsByRole = useMemo(() => {
    return operators.reduce((acc, operator) => {
      if (operator.active) {
        acc[operator.role] = (acc[operator.role] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  }, [operators])

  return {
    // Data
    operators,
    filteredOperators,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error states
    error,
    
    // CRUD operations
    createOperator,
    updateOperator,
    deleteOperator,
    activateOperator,
    deactivateOperator,
    getOperator,
    getOperatorsByRole,
    
    // Utilities
    searchOperators,
    sortOperators,
    filterByRole,
    clearError,
    refreshOperators,
    
    // Stats
    totalOperators,
    activeOperators,
    inactiveOperators,
    operatorsByRole
  }
} 