import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreVertical, Shield, User, UserCheck, UserX, RefreshCw, Edit2, Trash2 } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { Button } from '../../@/components/ui/button'
import { Input } from '../../@/components/ui/input'
import { Label } from '../../@/components/ui/label'
import { Card } from '../../@/components/ui/card'
import { Badge } from '../../@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable } from '@/components/common/DataTable'
import { useToast } from '@/contexts/ToastContext'
import type { AuthUser } from '@/types/auth'
import { supabase } from '@/lib/supabase'

interface UserWithAccount extends AuthUser {
  account_name?: string
  supervisor_name?: string
  last_login?: string
}

interface UserFilters {
  search: string
  role: 'all' | 'admin' | 'supervisor' | 'operator'
  status: 'all' | 'active' | 'inactive'
  account_id: string
  password_change_required: 'all' | 'true' | 'false'
}

export function UserManagement() {
  const { user: currentUser, userType } = useAuthContext()
  const { clients } = useClients()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserWithAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithAccount | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserWithAccount | null>(null)
  const [resettingPassword, setResettingPassword] = useState<UserWithAccount | null>(null)

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    account_id: '',
    password_change_required: 'all'
  })

  // Verificar se o usuário tem permissão para acessar esta página
  if (userType !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Carregar usuários
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          account:accounts(company_name),
          supervisor:users!supervisor_id(name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const usersWithAccount: UserWithAccount[] = data?.map(user => ({
        ...user,
        account_name: user.account?.company_name || 'N/A',
        supervisor_name: user.supervisor?.name || 'N/A',
        last_login: 'N/A' // Implementar depois se necessário
      })) || []

      setUsers(usersWithAccount)
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      setError('Erro ao carregar usuários')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         user.email.toLowerCase().includes(filters.search.toLowerCase())
    const matchesRole = filters.role === 'all' || user.role === filters.role
    const matchesStatus = filters.status === 'all' || user.status === filters.status
    const matchesAccount = !filters.account_id || user.account_id === filters.account_id
    const matchesPasswordChange = filters.password_change_required === 'all' || 
                                 (filters.password_change_required === 'true' && user.password_change_required) ||
                                 (filters.password_change_required === 'false' && !user.password_change_required)

    return matchesSearch && matchesRole && matchesStatus && matchesAccount && matchesPasswordChange
  })

  // Resetar senha de usuário
  const handleResetPassword = async (user: UserWithAccount) => {
    try {
      // Gerar nova senha temporária
      const { generateTemporaryPassword } = await import('@/lib/utils')
      const newPassword = generateTemporaryPassword(12)

      // Atualizar senha no Auth e marcar como requer mudança
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_change_required: true })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Aqui você implementaria o envio da nova senha por email ou notificação
      // Por enquanto, vamos apenas mostrar no toast
      toast({
        title: 'Senha resetada',
        description: `Nova senha para ${user.name}: ${newPassword}`,
        variant: 'success'
      })

      await fetchUsers()
    } catch (err) {
      console.error('Erro ao resetar senha:', err)
      toast({
        title: 'Erro',
        description: 'Erro ao resetar senha',
        variant: 'destructive'
      })
    }
    setResettingPassword(null)
  }

  // Ativar/desativar usuário
  const handleToggleUserStatus = async (user: UserWithAccount) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      toast({
        title: 'Sucesso',
        description: `Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`,
        variant: 'success'
      })

      await fetchUsers()
    } catch (err) {
      console.error('Erro ao alterar status:', err)
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do usuário',
        variant: 'destructive'
      })
    }
  }

  // Excluir usuário
  const handleDeleteUser = async (user: UserWithAccount) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (error) {
        throw error
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso',
        variant: 'success'
      })

      await fetchUsers()
    } catch (err) {
      console.error('Erro ao excluir usuário:', err)
      toast({
        title: 'Erro',
        description: 'Erro ao excluir usuário',
        variant: 'destructive'
      })
    }
    setDeletingUser(null)
  }

  // Definir colunas da tabela
  const columns = [
    {
      key: 'name',
      label: 'Nome',
      render: (user: UserWithAccount) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Função',
             render: (user: UserWithAccount) => {
         const roleConfig: Record<string, { label: string; color: string }> = {
           admin: { label: 'Admin', color: 'bg-red-100 text-red-800' },
           supervisor: { label: 'Supervisor', color: 'bg-blue-100 text-blue-800' },
           operator: { label: 'Operador', color: 'bg-green-100 text-green-800' }
         }
         const config = roleConfig[user.role]
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        )
      }
    },
    {
      key: 'account_name',
      label: 'Empresa',
      render: (user: UserWithAccount) => (
        <span className="text-sm text-gray-900">{user.account_name}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (user: UserWithAccount) => (
        <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {user.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'password_change_required',
      label: 'Senha',
      render: (user: UserWithAccount) => (
        <Badge className={user.password_change_required ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
          {user.password_change_required ? 'Temporária' : 'Definida'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (user: UserWithAccount) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingUser(user)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResettingPassword(user)}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleUserStatus(user)}
            className={user.status === 'active' ? 'text-red-600' : 'text-green-600'}
          >
            {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeletingUser(user)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    tempPassword: users.filter(u => u.password_change_required).length
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
        <p className="text-gray-600 mt-2">Gerencie usuários do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Senha Temp.</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tempPassword}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                placeholder="Nome ou email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="role">Função</Label>
            <select
              id="role"
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="operator">Operador</option>
            </select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          <div>
            <Label htmlFor="account">Empresa</Label>
            <select
              id="account"
              value={filters.account_id}
              onChange={(e) => setFilters(prev => ({ ...prev, account_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <select
              id="password"
              value={filters.password_change_required}
              onChange={(e) => setFilters(prev => ({ ...prev, password_change_required: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="true">Temporária</option>
              <option value="false">Definida</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <DataTable
          data={filteredUsers}
          columns={columns}
          loading={isLoading}
          emptyMessage="Nenhum usuário encontrado"
        />
      </Card>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onCancel={() => setDeletingUser(null)}
        onConfirm={() => deletingUser && handleDeleteUser(deletingUser)}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir o usuário "${deletingUser?.name}"? Esta ação não pode ser desfeita.`}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!resettingPassword}
        onCancel={() => setResettingPassword(null)}
        onConfirm={() => resettingPassword && handleResetPassword(resettingPassword)}
        title="Resetar Senha"
        message={`Tem certeza que deseja resetar a senha de "${resettingPassword?.name}"? Uma nova senha temporária será gerada.`}
        variant="warning"
      />

    </div>
  )
} 