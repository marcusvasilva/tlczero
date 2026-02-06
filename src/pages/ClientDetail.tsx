import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  ClipboardList,

  Plus,
  Edit2,
  Trash2,

  Phone,
  Mail,
  User as UserIcon,
  Home,
  Trees,
  Activity,
  QrCode
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { useSpaces } from '@/hooks/useSpaces'
import { useSimpleOperators } from '@/hooks/useSimpleOperators'
import { useCollections } from '@/hooks/useCollections'
import { useToast } from '@/contexts/ToastContext'

import { useUsers } from '@/hooks/useUsers'
import { ClientForm } from '@/components/forms/ClientForm'
import { SpaceForm } from '@/components/forms/SpaceForm'
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay'
import SimpleOperatorForm from '@/components/forms/SimpleOperatorForm'
import UserForm from '@/components/forms/UserForm'
import UserTypeSelectionModal from '@/components/common/UserTypeSelectionModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import type { Space, CreateSpaceData, UpdateSpaceData } from '@/types'
import type { SimpleOperator, CreateSimpleOperatorData } from '@/types/operator'

function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

const environmentLabels: Record<string, string> = {
  indoor: 'Interno',
  outdoor: 'Externo',
  mixed: 'Misto',
}

const environmentIcons: Record<string, React.ElementType> = {
  indoor: Home,
  outdoor: Trees,
  mixed: Activity,
}

type TabKey = 'spaces' | 'operators' | 'collections'

export default function ClientDetail() {
  const { id: clientId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userType } = useAuthContext()
  const { toast } = useToast()

  // Data fetching
  const { clients, updateClient, isLoading: isLoadingClients } = useClients()
  const client = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId])

  const {
    filteredSpaces: spaces,
    createSpace,
    updateSpace,
    deleteSpace,
    isLoading: isLoadingSpaces,
  } = useSpaces({ clientId })

  const {
    operators: allOperators,
    createOperator,
    updateOperator,
    deleteOperator,
    refreshOperators,
    isLoading: isLoadingOperators,
  } = useSimpleOperators()

  const { createUser, isCreating: isCreatingUser } = useUsers()

  const operators = useMemo(
    () => allOperators.filter(op => op.account_id === clientId),
    [allOperators, clientId],
  )

  const { collections: allCollections, isLoading: isLoadingCollections } = useCollections()
  const spaceIds = useMemo(() => new Set(spaces.map(s => s.id)), [spaces])
  const clientCollections = useMemo(
    () =>
      allCollections
        .filter(c => spaceIds.has(c.spaceId))
        .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime())
        .slice(0, 20),
    [allCollections, spaceIds],
  )

  // UI state
  const [showClientForm, setShowClientForm] = useState(false)

  // Space state
  const [showSpaceForm, setShowSpaceForm] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null)

  // Operator state
  const [showOperatorForm, setShowOperatorForm] = useState(false)
  const [editingOperator, setEditingOperator] = useState<SimpleOperator | undefined>(undefined)
  const [deletingOperator, setDeletingOperator] = useState<SimpleOperator | undefined>(undefined)
  const [isSubmittingOperator, setIsSubmittingOperator] = useState(false)

  // User type selection & supervisor creation state
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(false)
  const [showSupervisorForm, setShowSupervisorForm] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)

  // Permissions
  const canManage = userType === 'admin' || userType === 'distributor' || userType === 'supervisor'

  // Stats
  const activeSpaces = spaces.filter(s => s.active).length
  const activeOperators = operators.filter(o => o.status === 'active').length
  const totalWeight = clientCollections.reduce((sum, c) => sum + (c.weight || 0), 0)

  // Space name lookup for collections tab
  const spaceMap = useMemo(() => new Map(spaces.map(s => [s.id, s.name])), [spaces])

  // --- Space handlers ---
  const handleCreateSpace = async (data: CreateSpaceData) => {
    try {
      await createSpace(data)
      setShowSpaceForm(false)
      toast({ title: 'Espaço criado!', variant: 'success' })
    } catch (err) {
      console.error('Erro ao criar espaço:', err)
      toast({ title: 'Erro ao criar espaço', variant: 'destructive' })
    }
  }

  const handleUpdateSpace = async (data: CreateSpaceData) => {
    if (!editingSpace) return
    try {
      await updateSpace(editingSpace.id, data as UpdateSpaceData)
      setEditingSpace(null)
      setShowSpaceForm(false)
      toast({ title: 'Espaço atualizado!', variant: 'success' })
    } catch (err) {
      console.error('Erro ao atualizar espaço:', err)
      toast({ title: 'Erro ao atualizar espaço', variant: 'destructive' })
    }
  }

  const handleDeleteSpace = async () => {
    if (!deletingSpace) return
    try {
      await deleteSpace(deletingSpace.id)
      setDeletingSpace(null)
      toast({ title: 'Espaço excluído!', variant: 'success' })
    } catch (err) {
      console.error('Erro ao excluir espaço:', err)
      toast({ title: 'Erro ao excluir espaço', variant: 'destructive' })
    }
  }

  // --- Operator handlers ---
  const handleOperatorSubmit = async (data: CreateSimpleOperatorData) => {
    setIsSubmittingOperator(true)
    try {
      if (editingOperator?.id) {
        await updateOperator(editingOperator.id, data)
        toast({ title: 'Operador atualizado!', variant: 'success' })
      } else {
        await createOperator(data)
        toast({ title: 'Operador criado!', variant: 'success' })
      }
      setShowOperatorForm(false)
      setEditingOperator(undefined)
    } catch (err) {
      console.error('Erro ao salvar operador:', err)
      toast({
        title: 'Erro ao salvar operador',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      })
      throw err
    } finally {
      setIsSubmittingOperator(false)
    }
  }

  const handleDeleteOperator = async () => {
    if (!deletingOperator) return
    try {
      await deleteOperator(deletingOperator.id)
      setDeletingOperator(undefined)
      toast({ title: 'Operador excluído!', variant: 'success' })
    } catch (err) {
      console.error('Erro ao excluir operador:', err)
      toast({ title: 'Erro ao excluir operador', variant: 'destructive' })
    }
  }

  // --- Client handler ---
  const handleUpdateClient = async (data: any) => {
    if (!clientId) return
    try {
      await updateClient(clientId, data)
      setShowClientForm(false)
      toast({ title: 'Cliente atualizado!', variant: 'success' })
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err)
      toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' })
    }
  }

  // SpaceForm expects a clients array — lock to current client
  const spaceFormClients = client
    ? [{
        id: client.id,
        company_name: client.company_name,
        cnpj: client.cnpj || undefined,
        contact_person: client.contact_person || '',
        phone: client.phone || undefined,
        address: client.address || undefined,
        status: client.status || 'active',
      }]
    : []

  // --- Loading state ---
  const isLoading = isLoadingClients || isLoadingSpaces || isLoadingOperators || isLoadingCollections

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados do cliente...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cliente não encontrado</h2>
        <p className="text-gray-500 dark:text-gray-400">O cliente solicitado não existe ou você não tem acesso.</p>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Clientes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Clientes
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.company_name}</h1>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      client.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {client.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                  {client.contact_person && (
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5" />
                      {client.contact_person}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {client.phone}
                    </span>
                  )}
                  {client.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {client.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {canManage && (
              <Button variant="outline" size="sm" onClick={() => setShowClientForm(true)}>
                <Edit2 className="w-4 h-4 mr-1.5" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ===== SPACES COLUMN ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Espaços</h2>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {activeSpaces}
              </span>
            </div>
            {canManage && (
              <button
                onClick={() => { setEditingSpace(null); setShowSpaceForm(true) }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-3 flex-1 overflow-y-auto max-h-[500px] space-y-2">
            {spaces.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Nenhum espaço</p>
              </div>
            ) : (
              spaces.map((space) => {
                const EnvIcon = environmentIcons[space.environmentType || 'mixed'] || Activity
                return (
                  <div
                    key={space.id}
                    className="border border-gray-100 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <EnvIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{space.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          space.active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {space.active ? 'Ativo' : 'Inativo'}
                        </span>
                        {space.qrCodeEnabled && <QrCode className="w-3 h-3 text-green-500" title="QR Code ativo" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex gap-2">
                        <span>{environmentLabels[space.environmentType || 'mixed']}</span>
                        {space.areaSize && <span>{space.areaSize} m²</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {space.publicToken && space.qrCodeEnabled && (
                          <QRCodeDisplay
                            spaceId={space.id}
                            spaceName={space.name}
                            publicToken={space.publicToken}
                          />
                        )}
                        {canManage && (
                          <>
                            <button
                              onClick={() => { setEditingSpace(space); setShowSpaceForm(true) }}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingSpace(space)}
                              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ===== USERS COLUMN ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Usuários</h2>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {activeOperators}
              </span>
            </div>
            {canManage && (
              <button
                onClick={() => setShowUserTypeSelection(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-3 flex-1 overflow-y-auto max-h-[500px] space-y-2">
            {operators.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Nenhum usuário</p>
              </div>
            ) : (
              operators.map((op) => (
                <div
                  key={op.id}
                  className="border border-gray-100 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{op.name}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                      op.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {op.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pl-9">
                    <span className={`px-1.5 py-0.5 rounded-full ${
                      op.role === 'supervisor'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {op.role === 'supervisor' ? 'Supervisor' : 'Operador'}
                    </span>
                    {canManage && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingOperator(op); setShowOperatorForm(true) }}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingOperator(op)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ===== COLLECTIONS COLUMN ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Coletas</h2>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {clientCollections.length}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{totalWeight.toFixed(1)}g total</span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto max-h-[500px] space-y-2">
            {clientCollections.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <ClipboardList className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Nenhuma coleta</p>
              </div>
            ) : (
              clientCollections.map((col) => (
                <div
                  key={col.id}
                  className="border border-gray-100 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {spaceMap.get(col.spaceId) || 'Espaço removido'}
                    </span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400 shrink-0 ml-2">
                      {col.weight?.toFixed(1)}g
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(col.collectedAt).toLocaleDateString('pt-BR')}</span>
                    {col.observations && (
                      <span className="truncate ml-2 max-w-[120px]">{col.observations}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Client edit form */}
      {showClientForm && client && (
        <ClientForm
          client={client}
          onSubmit={handleUpdateClient}
          onCancel={() => setShowClientForm(false)}
        />
      )}

      {/* Space form */}
      {showSpaceForm && (
        <SpaceForm
          isOpen={showSpaceForm}
          onClose={() => { setShowSpaceForm(false); setEditingSpace(null) }}
          onSubmit={editingSpace ? handleUpdateSpace : handleCreateSpace}
          initialData={editingSpace || undefined}
          clients={spaceFormClients}
          defaultClientId={clientId}
        />
      )}

      {/* User type selection modal */}
      <UserTypeSelectionModal
        isOpen={showUserTypeSelection}
        onClose={() => setShowUserTypeSelection(false)}
        onSelect={(type) => {
          setShowUserTypeSelection(false)
          if (type === 'operator') {
            setEditingOperator(undefined)
            setShowOperatorForm(true)
          } else {
            setShowSupervisorForm(true)
          }
        }}
      />

      {/* Operator form */}
      <Modal isOpen={showOperatorForm} onClose={() => { setShowOperatorForm(false); setEditingOperator(undefined) }}>
        <SimpleOperatorForm
          operator={editingOperator}
          defaultAccountId={clientId}
          lockedRole={editingOperator ? editingOperator.role : 'operator'}
          onSubmit={handleOperatorSubmit}
          onCancel={() => { setShowOperatorForm(false); setEditingOperator(undefined) }}
          isLoading={isSubmittingOperator}
        />
      </Modal>

      {/* Supervisor form */}
      <Modal isOpen={showSupervisorForm} onClose={() => setShowSupervisorForm(false)}>
        <UserForm
          defaultAccountId={clientId}
          defaultRole="supervisor"
          onSubmit={async (data) => {
            try {
              const result = await createUser(data)
              setShowSupervisorForm(false)
              if (result.credentials) {
                setGeneratedCredentials({
                  email: result.credentials.email,
                  password: result.credentials.password,
                })
                setShowCredentialsDialog(true)
              } else {
                toast({ title: 'Supervisor criado!', variant: 'success' })
              }
              refreshOperators()
            } catch (err) {
              console.error('Erro ao criar supervisor:', err)
              toast({
                title: 'Erro ao criar supervisor',
                description: err instanceof Error ? err.message : 'Erro desconhecido',
                variant: 'destructive',
              })
            }
          }}
          onCancel={() => setShowSupervisorForm(false)}
          isLoading={isCreatingUser}
        />
      </Modal>

      {/* Credentials dialog */}
      {showCredentialsDialog && generatedCredentials && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => { setShowCredentialsDialog(false); setGeneratedCredentials(null) }} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Supervisor criado com sucesso!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Anote as credenciais de acesso abaixo. A senha não poderá ser visualizada novamente.
              </p>
              <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</span>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{generatedCredentials.email}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Senha</span>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{generatedCredentials.password}</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => { setShowCredentialsDialog(false); setGeneratedCredentials(null) }}
                  className="px-4 py-2 rounded-md font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete space confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSpace}
        title="Excluir Espaço"
        message={`Tem certeza que deseja excluir o espaço "${deletingSpace?.name}"?`}
        onConfirm={handleDeleteSpace}
        onCancel={() => setDeletingSpace(null)}
      />

      {/* Delete operator confirmation */}
      <ConfirmDialog
        isOpen={!!deletingOperator}
        title="Excluir Operador"
        message={`Tem certeza que deseja excluir o operador "${deletingOperator?.name}"?`}
        onConfirm={handleDeleteOperator}
        onCancel={() => setDeletingOperator(undefined)}
      />
    </div>
  )
}
