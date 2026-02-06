import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Edit2, Trash2, Shield, Plus, Search, UserPlus, Crown, Mail } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useUsers } from '@/hooks/useUsers'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import UserForm from '@/components/forms/UserForm'
import { useMobile } from '@/hooks/use-mobile'
import type { User } from '@/types'

// Componente Modal simples
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <UserX className="w-6 h-6" />
            </button>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function UserManagement() {
  const { user, userType } = useAuthContext()
  const { toast } = useToast()
  const isMobile = useMobile()
  const {
    users,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createUser,
    updateUser,
    deleteUser,
    clearError,
    totalUsers,
    activeUsers,
    supervisorUsers,
    operatorUsers
  } = useUsers()
  
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null)
  
  // Verificar se o usuário tem permissão para acessar esta página
  if (!user || (userType !== 'admin' && userType !== 'supervisor')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h2>
          <p className="text-gray-600 dark:text-gray-400">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Filtrar usuários
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Limpar erros quando houver mudanças
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Handlers
  const handleCreateUser = () => {
    setEditingUser(undefined)
    setShowForm(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingUser) {
        toast({
          title: 'Atualizando usuário...',
          description: 'Salvando alterações',
          variant: 'default'
        })
        
        await updateUser(editingUser.id, data)
        
        toast({
          title: 'Usuário atualizado!',
          description: 'As informações foram salvas com sucesso',
          variant: 'success'
        })
      } else {
        toast({
          title: 'Criando usuário...',
          description: 'Salvando dados do usuário',
          variant: 'default'
        })
        
        const result = await createUser(data)
        
        // Mostrar credenciais se foram geradas
        if (result.credentials) {
          setGeneratedCredentials({
            email: result.credentials.email,
            password: result.credentials.password
          })
          setShowCredentialsDialog(true)
        }
        
        toast({
          title: 'Usuário criado!',
          description: 'Usuário adicionado com sucesso',
          variant: 'success'
        })
      }
      
      setShowForm(false)
      setEditingUser(undefined)
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      toast({
        title: 'Erro ao salvar usuário',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingUser(undefined)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      toast({
        title: 'Excluindo usuário...',
        description: `Removendo ${userToDelete.name}`,
        variant: 'default'
      })
      
      await deleteUser(userToDelete.id)
      
      toast({
        title: 'Usuário excluído!',
        description: `${userToDelete.name} foi removido com sucesso`,
        variant: 'success'
      })
      
      setShowDeleteDialog(false)
      setUserToDelete(undefined)
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast({
        title: 'Erro ao excluir usuário',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />
      case 'supervisor': return <UserCheck className="w-4 h-4" />
      case 'operator': return <Users className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'supervisor': return 'Supervisor'
      case 'operator': return 'Operador'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
      case 'supervisor': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
      case 'operator': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Usuários</h1>
          <Button onClick={handleCreateUser}>
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {userType === 'admin' 
            ? 'Gerencie todos os usuários do sistema'
            : 'Gerencie usuários da sua empresa'
          }
        </p>
      </div>

      {/* Mostrar erro se houver */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">Erro:</p>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Supervisores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{supervisorUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <UserPlus className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Operadores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{operatorUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Lista de usuários */}
      {isMobile ? (
        // Visualização em Cards para Mobile
        <div className="grid grid-cols-1 gap-3">
          {filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                    user.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                  }`}>
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Empresa:</span> {user.role === 'admin' ? 'Todas as empresas' : user.account_id || 'Não definida'}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="secondary"
                    onClick={() => handleEditUser(user)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteUser(user)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Visualização em Tabela para Desktop
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.role === 'admin' ? 'Todas as empresas' : user.account_id || 'Não definida'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                    }`}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        title="Editar usuário"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal do Formulário */}
      <Modal isOpen={showForm} onClose={handleFormCancel}>
        <UserForm
          user={editingUser}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir o usuário "${userToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDeleteUser}
        onCancel={() => {
          setShowDeleteDialog(false)
          setUserToDelete(undefined)
        }}
        isLoading={isDeleting}
      />

      {/* Dialog de Credenciais Geradas */}
      <Modal isOpen={showCredentialsDialog} onClose={() => setShowCredentialsDialog(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Usuário Criado com Sucesso!
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">Credenciais de Acesso:</p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-green-700">
                  <strong>Email:</strong> {generatedCredentials?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">
                  <strong>Senha:</strong> {generatedCredentials?.password}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowCredentialsDialog(false)}
            >
              Entendi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 