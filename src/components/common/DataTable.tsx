import { Edit, Trash2, Eye } from 'lucide-react'

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  render?: (value: any, item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface TableAction<T> {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: (item: T) => void
  variant?: 'primary' | 'secondary' | 'danger'
  show?: (item: T) => boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  actions?: TableAction<T>[]
  loading?: boolean
  emptyMessage?: string
  onSort?: (column: keyof T | string, direction: 'asc' | 'desc') => void
  sortColumn?: keyof T | string
  sortDirection?: 'asc' | 'desc'
  mobileCard?: (item: T) => React.ReactNode
  className?: string
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = 'Nenhum item encontrado',
  onSort,
  sortColumn,
  sortDirection,
  mobileCard,
  className = ''
}: DataTableProps<T>) {
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return
    
    const newDirection = 
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(column.key, newDirection)
  }

  const getActionStyles = (variant: TableAction<T>['variant'] = 'secondary') => {
    const styles = {
      primary: 'text-primary hover:text-primary/80 hover:bg-primary/10 dark:hover:bg-primary/20',
      secondary: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
      danger: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
    }
    return styles[variant]
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      </div>
    )
  }

  // Renderização mobile com cards
  if (mobileCard) {
    return (
      <div className={`grid grid-cols-1 gap-3 xs:gap-4 ${className}`}>
        {data.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            {mobileCard(item)}
            {actions.length > 0 && (
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {actions.map((action, actionIndex) => {
                  if (action.show && !action.show(item)) return null
                  
                  const Icon = action.icon
                  return (
                    <button
                      key={actionIndex}
                      onClick={() => action.onClick(item)}
                      className={`touch-target rounded-lg transition-colors ${getActionStyles(action.variant)}`}
                      title={action.label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Renderização desktop com tabela
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-3 xs:px-4 sm:px-6 py-2 xs:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-green-600 dark:text-green-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-3 xs:px-4 sm:px-6 py-2 xs:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-3 xs:px-4 sm:px-6 py-3 xs:py-4 whitespace-nowrap mobile-text text-gray-900 dark:text-white">
                    {column.render 
                      ? column.render(
                          typeof column.key === 'string' && column.key.includes('.') 
                            ? column.key.split('.').reduce((obj: any, key: any) => obj?.[key], item)
                            : item[column.key as keyof T], 
                          item
                        )
                      : String(
                          typeof column.key === 'string' && column.key.includes('.') 
                            ? column.key.split('.').reduce((obj: any, key: any) => obj?.[key], item)
                            : item[column.key as keyof T] || ''
                        )
                    }
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-3 xs:px-4 sm:px-6 py-3 xs:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {actions.map((action, actionIndex) => {
                        if (action.show && !action.show(item)) return null
                        
                        const Icon = action.icon
                        return (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(item)}
                            className={`touch-target rounded-lg transition-colors ${getActionStyles(action.variant)}`}
                            title={action.label}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        )
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Ações pré-definidas comuns
export const commonActions = {
  view: (onClick: (item: any) => void): TableAction<any> => ({
    icon: Eye,
    label: 'Visualizar',
    onClick,
    variant: 'secondary'
  }),
  edit: (onClick: (item: any) => void): TableAction<any> => ({
    icon: Edit,
    label: 'Editar',
    onClick,
    variant: 'primary'
  }),
  delete: (onClick: (item: any) => void): TableAction<any> => ({
    icon: Trash2,
    label: 'Excluir',
    onClick,
    variant: 'danger'
  })
} 