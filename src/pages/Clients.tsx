import { useState } from 'react'
import { mockClients } from '@/data/mockClients'
import { formatPhone, formatCNPJ } from '@/lib/formatters'
import { useLocalStorage } from '@/hooks'
import { DataTable, type TableColumn, commonActions } from '@/components/common/DataTable'
import { ClientForm } from '@/components/forms/ClientForm'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Plus, Search } from 'lucide-react'
import type { Client } from '@/types'

export function Clients() {
  const [clients, setClients] = useLocalStorage('clients', mockClients)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingClient, setDeletingClient] = useState<Client | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  // Filtrar clientes baseado na busca
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.cnpj && client.cnpj.includes(searchTerm))
  )

  // Colunas da tabela
  const columns: TableColumn<Client>[] = [
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (value, client) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{client.email}</div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Telefone',
      render: (value) => value ? formatPhone(value) : '-'
    },
    {
      key: 'cnpj',
      label: 'CNPJ',
      render: (value) => value ? formatCNPJ(value) : '-'
    },
    {
      key: 'contactPerson',
      label: 'Contato',
      render: (value) => value || '-'
    },
    {
      key: 'active',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Ativo' : 'Inativo'}
        </span>
      )
    }
  ]

  // Ações da tabela
  const actions = [
    commonActions.edit((client: Client) => {
      setEditingClient(client)
      setShowForm(true)
    }),
    commonActions.delete((client: Client) => {
      setDeletingClient(client)
      setShowDeleteDialog(true)
    })
  ]

  // Criar novo cliente
  const handleCreate = () => {
    setEditingClient(undefined)
    setShowForm(true)
  }

  // Salvar cliente (criar ou editar)
  const handleSave = async (data: Partial<Client>) => {
    setIsLoading(true)
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      if (editingClient) {
        // Editar cliente existente
        setClients(prev => prev.map(client => 
          client.id === editingClient.id 
            ? { ...client, ...data }
            : client
        ))
      } else {
        // Criar novo cliente
        const newClient: Client = {
          ...data as Client,
          id: String(Date.now()),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setClients(prev => [...prev, newClient])
      }
      
      setShowForm(false)
      setEditingClient(undefined)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Excluir cliente
  const handleDelete = async () => {
    if (!deletingClient) return
    
    setIsLoading(true)
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      setClients(prev => prev.filter(client => client.id !== deletingClient.id))
      setShowDeleteDialog(false)
      setDeletingClient(undefined)
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cancelar operações
  const handleCancel = () => {
    setShowForm(false)
    setEditingClient(undefined)
    setShowDeleteDialog(false)
    setDeletingClient(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-gray-600">
            Gestão de clientes cadastrados no sistema ({filteredClients.length} de {clients.length})
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

      {/* Barra de busca */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabela de clientes */}
      <DataTable
        data={filteredClients}
        columns={columns}
        actions={actions}
        emptyMessage={
          searchTerm 
            ? `Nenhum cliente encontrado para "${searchTerm}"`
            : 'Nenhum cliente cadastrado ainda'
        }
      />

      {/* Formulário de cliente */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={handleSave}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      )}

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${deletingClient?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={handleCancel}
        isLoading={isLoading}
        variant="danger"
      />
    </div>
  )
} 