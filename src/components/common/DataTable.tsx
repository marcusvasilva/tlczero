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
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = 'Nenhum item encontrado',
  onSort,
  sortColumn,
  sortDirection
}: DataTableProps<T>) {
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return
    
    const newDirection = 
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(column.key, newDirection)
  }

  const getActionStyles = (variant: TableAction<T>['variant'] = 'secondary') => {
    const styles = {
      primary: 'text-green-600 hover:text-green-800 hover:bg-green-50',
      secondary: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
      danger: 'text-red-600 hover:text-red-800 hover:bg-red-50'
    }
    return styles[variant]
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border">
        <div className="p-8 text-center text-gray-500">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-green-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {actions.map((action, actionIndex) => {
                        if (action.show && !action.show(item)) return null
                        
                        const Icon = action.icon
                        return (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(item)}
                            className={`p-2 rounded-full transition-colors ${getActionStyles(action.variant)}`}
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