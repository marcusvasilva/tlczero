import React, { useEffect, useRef } from 'react'
import { X, MapPin, Calendar, Building2, QrCode } from 'lucide-react'
import { useForm } from '@/hooks'
import { spaceSchema } from '@/lib/validations'
import type { Space, CreateSpaceData, Client } from '@/types'

interface SpaceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateSpaceData) => void
  initialData?: Space | null
  clients: Client[]
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
      location: '',
      attractiveType: 'moscas',
      installationDate: new Date()
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
      setFieldValue('location', initialData.location || '')
      setFieldValue('attractiveType', initialData.attractiveType)
      setFieldValue('installationDate', initialData.installationDate)
    } else if (!initialData && previousInitialDataRef.current) {
      previousInitialDataRef.current = null
      reset()
    }
  }, [initialData]) // Removido setFieldValue e reset das dependências

  const handleSubmit = (e: React.FormEvent) => {
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

    onSubmit(values)
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
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.clientId && touched.clientId
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            >
              <option value="">Selecione um cliente</option>
              {clients
                .filter(client => client.active)
                .map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
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
                  <strong>CNPJ:</strong> {selectedClient.cnpj}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Contato:</strong> {selectedClient.contactPerson} - {selectedClient.phone}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Endereço:</strong> {selectedClient.address}
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
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.name && touched.name
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {errors.name && touched.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Localização *
            </label>
            <input
              type="text"
              value={values.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Descrição específica da localização"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.location && touched.location
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {errors.location && touched.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Ex: Próximo ao freezer, Parede norte do depósito, Entrada principal
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={values.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Informações adicionais sobre o espaço..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Tipo de Atrativo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Atrativo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  name="attractiveType"
                  value="moscas"
                  checked={values.attractiveType === 'moscas'}
                  onChange={(e) => handleInputChange('attractiveType', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  values.attractiveType === 'moscas'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="text-center">
                    <div className="text-2xl mb-2">🪰</div>
                    <div className="font-medium text-gray-900">Moscas</div>
                    <div className="text-sm text-gray-500">Atrativo para moscas</div>
                  </div>
                </div>
              </label>
              
              <label className="relative">
                <input
                  type="radio"
                  name="attractiveType"
                  value="outros"
                  checked={values.attractiveType === 'outros'}
                  onChange={(e) => handleInputChange('attractiveType', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  values.attractiveType === 'outros'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="text-center">
                    <div className="text-2xl mb-2">🐛</div>
                    <div className="font-medium text-gray-900">Outros</div>
                    <div className="text-sm text-gray-500">Outros tipos de pragas</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Data de Instalação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data de Instalação
            </label>
            <input
              type="date"
              value={values.installationDate.toISOString().split('T')[0]}
              onChange={(e) => handleInputChange('installationDate', new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* QR Code Info */}
          {initialData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">QR Code</h4>
              </div>
              <p className="text-sm text-blue-700">
                Código: <span className="font-mono bg-white px-2 py-1 rounded">{initialData.qrCode}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                O QR Code é gerado automaticamente e pode ser usado para acessar este espaço
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Criar Espaço')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 