import { mockCollections } from '@/data/mockCollections'
import { formatWeight, formatDateTime, formatTemperature } from '@/lib/formatters'
import { usePagination } from '@/hooks'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export function Collections() {
  const {
    currentPage,
    totalPages,
    itemsPerPage,
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
  } = usePagination({
    totalItems: mockCollections.length,
    itemsPerPage: 10,
    initialPage: 1,
  })

  const visibleCollections = getVisibleItems(mockCollections)
  const pageNumbers = getPageNumbers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coletas</h1>
          <p className="text-gray-600">
            Registro de todas as coletas realizadas ({mockCollections.length} total)
          </p>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          Nova Coleta
        </button>
      </div>

      {/* Controles de paginação superiores */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, mockCollections.length)} de {mockCollections.length} coletas
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToFirstPage}
            disabled={!hasPreviousPage}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={previousPage}
            disabled={!hasPreviousPage}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex gap-1">
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`px-3 py-1 rounded text-sm ${
                  pageNum === currentPage
                    ? 'bg-green-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={goToLastPage}
            disabled={!hasNextPage}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Histórico de Coletas</h2>
          <div className="space-y-4">
            {visibleCollections.map((collection) => (
              <div key={collection.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
                        #{collection.id}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">Espaço #{collection.spaceId}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(collection.collectedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatWeight(collection.weight)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Operador #{collection.operatorId}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Condição Climática:</strong>
                    <div className="flex items-center gap-1 mt-1">
                      {collection.weatherCondition === 'ensolarado' && '☀️'}
                      {collection.weatherCondition === 'nublado' && '☁️'}
                      {collection.weatherCondition === 'chuvoso' && '🌧️'}
                      {collection.weatherCondition === 'ventoso' && '💨'}
                      <span className="capitalize">{collection.weatherCondition}</span>
                    </div>
                  </div>
                  
                  {collection.temperature && (
                    <div>
                      <strong>Temperatura:</strong>
                      <p className="mt-1">{formatTemperature(collection.temperature)}</p>
                    </div>
                  )}
                  
                  {collection.photoUrl && (
                    <div>
                      <strong>Foto:</strong>
                      <p className="mt-1 text-green-600">✓ Disponível</p>
                    </div>
                  )}
                </div>

                {collection.observations && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <strong className="text-sm">Observações:</strong>
                    <p className="text-sm text-gray-700 mt-1">{collection.observations}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Paginação inferior */}
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={!hasPreviousPage}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={previousPage}
                disabled={!hasPreviousPage}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={nextPage}
                disabled={!hasNextPage}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={!hasNextPage}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 