import { useState } from 'react'
import { Search, Building2, Users, MapPin, Plus, Edit, Phone, Mail } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { formatPhone } from '@/lib/formatters'
import { ClientForm } from '@/components/forms/ClientForm'
import { useToast } from '@/contexts/ToastContext'
import { useMobile } from '@/hooks/use-mobile'
import type { Account } from '@/types'

export function Clients() {
  const { clients, isLoading, createClient, updateClient } = useClients()
  const { toast } = useToast()
  const isMobile = useMobile()
  
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
    <div className="page-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie os clientes do sistema</p>
        </div>
        <button
          onClick={openCreateForm}
          className="btn-md btn-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Adicionar Cliente
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="mobile-card">
          <div className="flex items-center">
            <div className="p-2 xs:p-2.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
              <Building2 className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Total</p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
            </div>
          </div>
        </div>

        <div className="mobile-card">
          <div className="flex items-center">
            <div className="p-2 xs:p-2.5 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
              <Users className="w-4 h-4 xs:w-5 xs:h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Ativos</p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {clients.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="mobile-card">
          <div className="flex items-center">
            <div className="p-2 xs:p-2.5 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex-shrink-0">
              <MapPin className="w-4 h-4 xs:w-5 xs:h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Cidades</p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(clients.map(c => c.city).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 input-responsive"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      {isMobile ? (
          // Visualização em Cards para Mobile
          <div className="grid grid-cols-1 gap-3">
            {filteredClients.map((client) => (
              <div key={client.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {client.company_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.contact_person}
                      </p>
                    </div>
                  </div>
                  <span className={`badge-responsive flex-shrink-0 ${
                    client.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {client.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{formatPhone(client.phone)}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => openEditForm(client)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Visualização em Tabela para Desktop
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Telefone
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
                  {filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {client.company_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {client.email || 'Sem email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{client.contact_person}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {client.phone ? formatPhone(client.phone) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {client.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openEditForm(client)}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
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
        )}

      {/* Modal do formulário */}
      {showForm && (
        <ClientForm
          client={editingClient || undefined}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}
    </div>
  )
} 