import { useState } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, UserCheck, UserX } from 'lucide-react'
import { useOperators } from '@/hooks/useOperators'
import { useAuthContext } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/formatters'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { Operator } from '@/types'

// Componentes UI simples
function Button({ children, variant = 'default', size = 'default', onClick, className = '' }: {
  children: React.ReactNode
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  onClick?: () => void
  className?: string
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variantClasses = variant === 'outline' 
    ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
    : 'bg-green-600 text-white hover:bg-green-700'
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Input({ placeholder, value, onChange, className = '' }: {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-green-500 ${className}`}
    />
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' }) {
  const classes = variant === 'secondary' 
    ? 'bg-gray-100 text-gray-800' 
    : 'bg-green-100 text-green-800'
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes}`}>
      {children}
    </span>
  )
}

export function Operators() {
  const { userType, clientContext, user } = useAuthContext()
  const { 
    operators, 
    isLoading, 
    isDeleting,
    deleteOperator,
    updateOperator,
    error,
    clearError 
  } = useOperators()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null)

  // Filtrar operadores baseado no contexto do cliente
  const filteredOperators = operators.filter(operator => {
    // Para admin: vê todos os operadores
    if (userType === 'admin') {
      return true
    }
    
    // Para supervisor: vê apenas operadores do seu cliente
    const currentClientId = clientContext || user?.clientId
    if (!currentClientId || operator.clientId !== currentClientId) {
      return false
    }
    
    return true
  }).filter(operator => {
    // Filtro de busca
    const matchesSearch = !searchTerm || 
      operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (operator.email && operator.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Filtro de status
    const matchesStatus = showInactive || operator.active
    
    return matchesSearch && matchesStatus
  })

  const handleDeleteOperator = async (operator: Operator) => {
    try {
      await deleteOperator(operator.id)
      setShowDeleteDialog(false)
      setOperatorToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir operador:', error)
    }
  }

  const handleToggleStatus = async (operator: Operator) => {
    try {
      await updateOperator(operator.id, { active: !operator.active })
    } catch (error) {
      console.error('Erro ao alterar status do operador:', error)
    }
  }

  const stats = {
    total: filteredOperators.length,
    active: filteredOperators.filter(o => o.active).length,
    inactive: filteredOperators.filter(o => !o.active).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operadores</h1>
          <p className="text-gray-600 mt-1">
            {userType === 'admin' 
              ? 'Gerencie todos os operadores do sistema'
              : 'Gerencie sua equipe de campo'
            }
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Operador
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inativos</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
            <UserX className="h-8 w-8 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showInactive ? "default" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showInactive ? 'Todos' : 'Incluir Inativos'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <Button variant="outline" size="sm" onClick={clearError}>
              Fechar
            </Button>
          </div>
        </Card>
      )}

      {/* Operators List */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Lista de Operadores ({filteredOperators.length})
          </h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOperators.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum operador encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando um novo operador'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOperators.map((operator) => (
                <div key={operator.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      {operator.avatar ? (
                        <img src={operator.avatar} alt={operator.name} className="w-12 h-12 rounded-full" />
                      ) : (
                        <span className="text-white font-medium">
                          {operator.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{operator.name}</h4>
                      <p className="text-sm text-gray-500">{operator.email || 'Email não informado'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={operator.active ? "default" : "secondary"}>
                          {operator.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {operator.lastLogin && (
                          <span className="text-xs text-gray-500">
                            Último acesso: {formatDate(operator.lastLogin)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(operator)}
                    >
                      {operator.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOperator(operator)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOperatorToDelete(operator)
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Operador"
        message={`Tem certeza que deseja excluir o operador "${operatorToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => operatorToDelete && handleDeleteOperator(operatorToDelete)}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
} 