import { useState, useMemo, useCallback } from 'react'

export interface UsePaginationOptions {
  totalItems: number
  itemsPerPage?: number
  initialPage?: number
}

export interface UsePaginationReturn {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  setItemsPerPage: (items: number) => void
  getPageNumbers: () => number[]
  getVisibleItems: <T>(items: T[]) => T[]
}

/**
 * Hook para gerenciar paginação
 */
export function usePagination({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1,
}: UsePaginationOptions): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage)

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPageState)
  }, [totalItems, itemsPerPageState])

  // Calcular índices
  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPageState
  }, [currentPage, itemsPerPageState])

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPageState - 1, totalItems - 1)
  }, [startIndex, itemsPerPageState, totalItems])

  // Verificar se há próxima/anterior página
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  // Ir para página específica
  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(targetPage)
  }, [totalPages])

  // Próxima página
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasNextPage])

  // Página anterior
  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [hasPreviousPage])

  // Primeira página
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  // Última página
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages)
  }, [totalPages])

  // Alterar itens por página
  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items)
    setCurrentPage(1) // Reset para primeira página
  }, [])

  // Obter números das páginas para exibição
  const getPageNumbers = useCallback(() => {
    const pages: number[] = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Se há poucas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas relevantes
      const halfVisible = Math.floor(maxVisiblePages / 2)
      let startPage = Math.max(1, currentPage - halfVisible)
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      
      // Ajustar se estamos próximos do final
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }, [currentPage, totalPages])

  // Obter itens visíveis na página atual
  const getVisibleItems = useCallback(<T>(items: T[]): T[] => {
    return items.slice(startIndex, startIndex + itemsPerPageState)
  }, [startIndex, itemsPerPageState])

  return {
    currentPage,
    totalPages,
    itemsPerPage: itemsPerPageState,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage,
    getPageNumbers,
    getVisibleItems,
  }
}

/**
 * Hook para paginação infinita (scroll infinito)
 */
export function useInfiniteScroll<T>({
  items,
  itemsPerPage = 10,
}: {
  items: T[]
  itemsPerPage?: number
}) {
  const [visibleCount, setVisibleCount] = useState(itemsPerPage)

  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount)
  }, [items, visibleCount])

  const hasMore = visibleCount < items.length

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount(prev => Math.min(prev + itemsPerPage, items.length))
    }
  }, [hasMore, itemsPerPage, items.length])

  const reset = useCallback(() => {
    setVisibleCount(itemsPerPage)
  }, [itemsPerPage])

  return {
    visibleItems,
    hasMore,
    loadMore,
    reset,
    visibleCount,
    totalCount: items.length,
  }
} 