import { useState } from 'react'
import { Search, Building2, Users, MapPin, Plus } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { formatPhone } from '@/lib/formatters'
import { ClientForm } from '@/components/forms/ClientForm'
import { useToast } from '@/contexts/ToastContext'
import type { Account } from '@/types'

export function Clients() {
  const { clients, isLoading, createClient, updateClient } = useClients()
  const { toast } = useToast()
  
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Account | null>(null)
  
  // Filtrar clientes
  const filteredClients = clients.filter(client => 
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Funções para o modal
  const openCreateForm = () => {
    setEditingClient(null)
    setShowForm(true)
  }

  const openEditForm = (client: Account) => {
    setEditingClient(client)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingClient(null)
  }

  // Função para criar/atualizar cliente
  const handleSubmit = async (data: Partial<Account>) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data)
        toast({ title: 'Cliente atualizado com sucesso!', variant: 'success' })
      } else {
        await createClient(data as Omit<Account, 'id' | 'created_at' | 'updated_at'>)
        toast({ title: 'Cliente criado com sucesso!', variant: 'success' })
      }
      closeForm()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      toast({ title: 'Erro ao salvar cliente', variant: 'destructive' })
      throw error // Re-lançar para que o form saiba que falhou
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 max-w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Clientes</h1>
            <p className="text-gray-600 dark:text-gray-400">Gerencie os clientes do sistema</p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={openCreateForm}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Adicionar Cliente
            </button>
          </div>
        </div>

                {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total de Clientes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Clientes Ativos</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {clients.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Localidades</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(clients.map(c => c.city).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Empresa
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Contato
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Telefone
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center min-w-0">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {client.company_name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                            {client.email || 'Sem email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{client.contact_person}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {client.phone ? formatPhone(client.phone) : '-'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        client.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openEditForm(client)}
                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal do formulário */}
        {showForm && (
          <ClientForm
            client={editingClient || undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        )}
      </div>
    </div>
  )
} 