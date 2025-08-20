import { useMobile } from '@/hooks/use-mobile'
import { DataTable, TableColumn, TableAction } from './DataTable'

interface MobileDataViewProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  actions?: TableAction<T>[]
  loading?: boolean
  emptyMessage?: string
  renderMobileCard: (item: T) => React.ReactNode
}

/**
 * Componente que renderiza dados como tabela no desktop e cards no mobile
 * Otimizado para PWA com melhor UX/UI
 */
export function MobileDataView<T extends { id: string | number }>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = 'Nenhum item encontrado',
  renderMobileCard
}: MobileDataViewProps<T>) {
  const isMobile = useMobile()

  if (loading) {
    return (
      <div className="loading-mobile">
        <div className="spinner animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    )
  }

  // Renderizar cards em mobile, tabela em desktop
  if (isMobile) {
    return (
      <div className="mobile-card-list">
        {data.map(item => (
          <div key={item.id} className="mobile-card-item">
            {renderMobileCard(item)}
          </div>
        ))}
      </div>
    )
  }

  // Desktop - usar DataTable existente
  return (
    <div className="table-container">
      <DataTable 
        data={data}
        columns={columns}
        actions={actions}
        loading={loading}
        emptyMessage={emptyMessage}
      />
    </div>
  )
}

/**
 * Componente helper para renderizar actions em mobile cards
 */
interface MobileCardActionsProps<T> {
  item: T
  actions: TableAction<T>[]
}

export function MobileCardActions<T>({ item, actions }: MobileCardActionsProps<T>) {
  const visibleActions = actions.filter(action => 
    action.show ? action.show(item) : true
  )

  if (visibleActions.length === 0) return null

  return (
    <div className="mobile-card-actions">
      {visibleActions.map((action, index) => {
        const Icon = action.icon
        const styles = {
          primary: 'text-primary hover:text-primary/80 hover:bg-primary/10',
          secondary: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          danger: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
        }
        
        return (
          <button
            key={index}
            onClick={() => action.onClick(item)}
            className={`touch-sm rounded-md transition-colors ${styles[action.variant || 'secondary']}`}
            title={action.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}