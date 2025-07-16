import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, X } from 'lucide-react'
import { useSimpleOperators } from '@/hooks/useSimpleOperators'
import { useAuthContext } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { formatDate } from '@/lib/formatters'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import SimpleOperatorForm from '@/components/forms/SimpleOperatorForm'
import type { SimpleOperator, CreateSimpleOperatorData } from '@/types/operator'

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
    ? 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700' 
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
      className={`block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 focus:border-green-500 focus:outline-none focus:ring-green-500 ${className}`}
    />
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' }) {
  const classes = variant === 'secondary' 
    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' 
    : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes}`}>
      {children}
    </span>
  )
}

// Modal Component
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
          >
            <X className="h-6 w-6" />
          </button>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Operators() {
  const { userType, accountContext, user } = useAuthContext()
  const { toast } = useToast()
  const { 
    operators, 
    isLoading, 
    isDeleting,
    deleteOperator,
    updateOperator,
    createOperator,
    error,
    clearError 
  } = useSimpleOperators()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [operatorToDelete, setOperatorToDelete] = useState<SimpleOperator | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)
  const [editingOperator, setEditingOperator] = useState<SimpleOperator | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtrar operadores baseado no contexto da conta
  const filteredOperators = operators.filter(operator => {
    // Para admin: vê todos os operadores
    if (userType === 'admin') {
      return true
    }
    
    // Para supervisor: vê apenas operadores de sua conta
    const currentAccountId = accountContext || user?.account_id
    if (!currentAccountId || operator.account_id !== currentAccountId) {
      return false
    }
    
    return true
  }).filter(operator => {
    // Filtro de busca
    const matchesSearch = !searchTerm || 
      operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (operator.email && operator.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Filtro de status
    const matchesStatus = showInactive || operator.status === 'active'
    
    return matchesSearch && matchesStatus
  })

  const handleDeleteOperator = async (operator: SimpleOperator) => {
    try {
      toast({
        title: 'Excluindo operador...',
        description: `Removendo ${operator.name}`,
        variant: 'default'
      })
      
      await deleteOperator(operator.id)
      setShowDeleteDialog(false)
      setOperatorToDelete(undefined)
      
      toast({
        title: 'Operador excluído!',
        description: `${operator.name} foi removido com sucesso`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Erro ao excluir operador:', error)
      toast({
        title: 'Erro ao excluir operador',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  const handleToggleStatus = async (operator: SimpleOperator) => {
    try {
      const newStatus = operator.status === 'active' ? 'inactive' : 'active'
      toast({
        title: `${newStatus === 'active' ? 'Ativando' : 'Desativando'} operador...`,
        description: `Alterando status de ${operator.name}`,
        variant: 'default'
      })
      
      await updateOperator(operator.id, { status: newStatus })
      
      toast({
        title: 'Status atualizado!',
        description: `${operator.name} foi ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Erro ao alterar status do operador:', error)
      toast({
        title: 'Erro ao alterar status',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  const handleCreateOperator = () => {
    setEditingOperator(undefined)
    setShowForm(true)
  }

  const handleEditOperator = (operator: SimpleOperator) => {
    setEditingOperator(operator)
    setShowForm(true)
  }

  const handleFormSubmit = async (data: CreateSimpleOperatorData) => {
    console.log('🔥 handleFormSubmit iniciado com dados:', data)
    setIsSubmitting(true)
    
    try {
      if (editingOperator) {
        console.log('🔄 Editando operador existente')
        toast({
          title: 'Atualizando operador...',
          description: 'Salvando alterações',
          variant: 'default'
        })
        
        await updateOperator(editingOperator.id, data)
        setShowForm(false)
        setEditingOperator(undefined)
        
        toast({
          title: 'Operador atualizado!',
          description: 'As informações foram salvas com sucesso',
          variant: 'success'
        })
      } else {
        console.log('🆕 Criando novo operador simples')
        toast({
          title: 'Criando operador...',
          description: 'Salvando dados do operador',
          variant: 'default'
        })
        
        await createOperator(data)
        console.log('✅ Operador criado com sucesso')
        
        setShowForm(false)
        setEditingOperator(undefined)
        
        toast({
          title: 'Operador criado!',
          description: 'Operador adicionado com sucesso',
          variant: 'success'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao salvar operador:', error)
      toast({
        title: 'Erro ao salvar operador',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
      throw error
    } finally {
      console.log('🏁 handleFormSubmit finalizado')
      setIsSubmitting(false)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingOperator(undefined)
  }

  const stats = {
    total: filteredOperators.length,
    active: filteredOperators.filter(o => o.status === 'active').length,
    inactive: filteredOperators.filter(o => o.status === 'inactive').length
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Operadores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {userType === 'admin' 
              ? 'Gerencie todos os operadores do sistema'
              : 'Gerencie sua equipe de campo'
            }
          </p>
        </div>
        <Button onClick={handleCreateOperator}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Operador
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inativos</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.inactive}</p>
            </div>
            <UserX className="h-8 w-8 text-gray-600 dark:text-gray-400" />
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
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Incluir inativos
            </label>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Operators Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Operador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Carregando operadores...
                  </td>
                </tr>
              ) : filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum operador encontrado
                  </td>
                </tr>
              ) : (
                filteredOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {operator.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {operator.name}
                          </div>
                          {operator.email && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {operator.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={operator.role === 'supervisor' ? 'default' : 'secondary'}>
                        {operator.role === 'supervisor' ? 'Supervisor' : 'Operador'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {operator.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={operator.status === 'active' ? 'default' : 'secondary'}>
                        {operator.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(operator.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOperator(operator)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(operator)}
                          className={operator.status === 'active' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
                        >
                          {operator.status === 'active' ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOperatorToDelete(operator)
                            setShowDeleteDialog(true)
                          }}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={handleFormCancel}>
        <SimpleOperatorForm
          operator={editingOperator}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir o operador "${operatorToDelete?.name}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => operatorToDelete && handleDeleteOperator(operatorToDelete)}
        onCancel={() => {
          setShowDeleteDialog(false)
          setOperatorToDelete(undefined)
        }}
        isLoading={isDeleting}
      />
    </div>
  )
}

export default Operators 