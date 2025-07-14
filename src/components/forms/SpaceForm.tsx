import React, { useRef, useEffect } from 'react'
import { useForm } from '@/hooks'
import { z } from 'zod'
import type { Space, CreateSpaceData } from '@/types'
import { X, Building2 } from 'lucide-react'

// Schema de validação
const spaceSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  areaSize: z.number().positive('Área deve ser positiva').optional(),
  environmentType: z.enum(['indoor', 'outdoor', 'mixed']).optional()
})

interface SpaceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSpaceData) => Promise<void>
  initialData?: Space
  clients: Array<{ id: string; company_name: string; cnpj?: string; contact_person?: string; phone?: string; address?: string; status: string }>
  isLoading?: boolean
}

export const SpaceForm: React.FC<SpaceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  clients,
  isLoading = false
}) => {
  const previousInitialDataRef = useRef<Space | null>(null)
  
  const {
    values,
    errors,
    touched,
    setFieldValue,
    setError,
    clearError,
    reset
  } = useForm<CreateSpaceData>({
    initialValues: {
      clientId: '',
      name: '',
      description: '',
      areaSize: undefined,
      environmentType: 'indoor'
    },
    validate: (values) => {
      const result = spaceSchema.safeParse(values)
      if (!result.success) {
        const errors: Partial<Record<keyof CreateSpaceData, string>> = {}
        result.error.errors.forEach((error) => {
          const field = error.path[0] as keyof CreateSpaceData
          errors[field] = error.message
        })
        return errors
      }
      return {}
    }
  })

  // Preencher formulário quando editando - usando ref para evitar loops
  useEffect(() => {
    if (initialData && initialData !== previousInitialDataRef.current) {
      previousInitialDataRef.current = initialData
      setFieldValue('clientId', initialData.clientId)
      setFieldValue('name', initialData.name)
      setFieldValue('description', initialData.description || '')
      setFieldValue('areaSize', initialData.areaSize)
      setFieldValue('environmentType', initialData.environmentType || 'indoor')
    } else if (!initialData && previousInitialDataRef.current) {
      previousInitialDataRef.current = null
      reset()
    }
  }, [initialData]) // Removido setFieldValue e reset das dependências

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar usando schema
    const result = spaceSchema.safeParse(values)
    if (!result.success) {
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof CreateSpaceData
        setError(field, error.message)
      })
      return
    }

    console.log('🚀 Iniciando criação de espaço:', values)
    try {
      await onSubmit(values)
      console.log('✅ Espaço criado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao criar espaço:', error)
    }
  }

  const handleInputChange = (field: keyof CreateSpaceData, value: any) => {
    setFieldValue(field, value)
    clearError(field)
  }

  const selectedClient = clients.find(client => client.id === values.clientId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {initialData ? 'Editar Espaço' : 'Novo Espaço'}
              </h2>
              <p className="text-sm text-gray-500">
                {initialData ? 'Atualize as informações do espaço' : 'Cadastre um novo espaço monitorado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              value={values.clientId}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white ${
                errors.clientId && touched.clientId
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            >
              <option value="">Selecione um cliente</option>
              {clients
                .filter(client => client.status === 'active')
                .map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))
              }
            </select>
            {errors.clientId && touched.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
            )}
            {selectedClient && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>CNPJ:</strong> {selectedClient.cnpj || 'Não informado'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Contato:</strong> {selectedClient.contact_person || 'Não informado'} - {selectedClient.phone || 'Não informado'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Endereço:</strong> {selectedClient.address || 'Não informado'}
                </p>
              </div>
            )}
          </div>

          {/* Nome do Espaço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Espaço *
            </label>
            <input
              type="text"
              value={values.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Área de Estoque, Cozinha Principal, Depósito A"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400 ${
                errors.name && touched.name
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {errors.name && touched.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={values.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Informações adicionais sobre o espaço..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
            />
          </div>

          {/* Área e Tipo de Ambiente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Área */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área (m²)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={values.areaSize || ''}
                onChange={(e) => handleInputChange('areaSize', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Ex: 50.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white placeholder-gray-400"
              />
              {errors.areaSize && touched.areaSize && (
                <p className="mt-1 text-sm text-red-600">{errors.areaSize}</p>
              )}
            </div>

            {/* Tipo de Ambiente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Ambiente
              </label>
              <select
                value={values.environmentType || 'indoor'}
                onChange={(e) => handleInputChange('environmentType', e.target.value as 'indoor' | 'outdoor' | 'mixed')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              >
                <option value="indoor">Interno</option>
                <option value="outdoor">Externo</option>
                <option value="mixed">Misto</option>
              </select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              onClick={() => console.log('🔥 Botão submit espaço clicado, dados:', values, 'errors:', errors)}
            >
              {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 