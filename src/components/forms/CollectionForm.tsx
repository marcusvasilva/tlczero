import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X, Camera, Upload, Thermometer, Cloud, Calendar, Scale, User, Building2 } from 'lucide-react'
import { useForm } from '@/hooks'
import { collectionSchema } from '@/lib/validations'
import { formatWeight, formatDateTime } from '@/lib/formatters'
import { WEIGHT_LIMITS, WEATHER_CONDITIONS } from '@/lib/constants'
import type { Collection, CreateCollectionData, Space, Operator, Client } from '@/types'

interface CollectionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateCollectionData) => void
  initialData?: Collection | null
  spaces: Space[]
  operators: Operator[]
  clients: Client[]
  selectedSpaceId?: string
  isLoading?: boolean
}

export const CollectionForm: React.FC<CollectionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  spaces,
  operators,
  clients,
  selectedSpaceId,
  isLoading = false
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const previousSelectedSpaceRef = useRef<string | undefined>(undefined)

  const {
    values,
    errors,
    touched,
    setFieldValue,
    setError,
    clearError,
    reset,
    isValid
  } = useForm<CreateCollectionData>({
    initialValues: {
      spaceId: selectedSpaceId || '',
      operatorId: '',
      weight: 0,
      photoUrl: '',
      observations: '',
      collectedAt: new Date(),
      weatherCondition: 'ensolarado',
      temperature: 25
    },
    validate: (values) => {
      const result = collectionSchema.safeParse(values)
      if (!result.success) {
        const errors: Partial<Record<keyof CreateCollectionData, string>> = {}
        result.error.errors.forEach((error) => {
          const field = error.path[0] as keyof CreateCollectionData
          errors[field] = error.message
        })
        return errors
      }
      return {}
    }
  })

  // Preencher formulário quando editando
  useEffect(() => {
    if (initialData) {
      setFieldValue('spaceId', initialData.spaceId)
      setFieldValue('operatorId', initialData.operatorId)
      setFieldValue('weight', initialData.weight)
      setFieldValue('photoUrl', initialData.photoUrl || '')
      setFieldValue('observations', initialData.observations || '')
      setFieldValue('collectedAt', initialData.collectedAt)
      setFieldValue('weatherCondition', initialData.weatherCondition)
      setFieldValue('temperature', initialData.temperature)
      setPhotoPreview(initialData.photoUrl || null)
    } else {
      reset()
      setPhotoPreview(null)
    }
  }, [initialData, setFieldValue, reset])

  // Preencher spaceId quando selecionado externamente - usando ref para evitar loops
  useEffect(() => {
    if (selectedSpaceId && selectedSpaceId !== previousSelectedSpaceRef.current) {
      previousSelectedSpaceRef.current = selectedSpaceId
      setFieldValue('spaceId', selectedSpaceId)
    }
  }, [selectedSpaceId]) // Removido setFieldValue das dependências

  // Mapas para lookup rápido
  const spacesMap = useMemo(() => {
    return spaces.reduce((acc, space) => {
      acc[space.id] = space
      return acc
    }, {} as Record<string, Space>)
  }, [spaces])

  const clientsMap = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.id] = client
      return acc
    }, {} as Record<string, Client>)
  }, [clients])

  const selectedSpace = spacesMap[values.spaceId]
  const selectedOperator = operators.find(operator => operator.id === values.operatorId)
  const selectedClient = selectedSpace ? clientsMap[selectedSpace.clientId] : null

  const weatherOptions = [
    { value: 'ensolarado', label: 'Ensolarado', icon: '☀️' },
    { value: 'nublado', label: 'Nublado', icon: '☁️' },
    { value: 'chuvoso', label: 'Chuvoso', icon: '🌧️' },
    { value: 'ventoso', label: 'Ventoso', icon: '💨' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validar usando schema
    const result = collectionSchema.safeParse(values)
    if (!result.success) {
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof CreateCollectionData
        setError(field, error.message)
      })
      return
    }

    onSubmit(values)
  }

  const handleInputChange = (field: keyof CreateCollectionData, value: any) => {
    setFieldValue(field, value)
    clearError(field)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho e tipo
      if (file.size > 5 * 1024 * 1024) {
        setError('photoUrl', 'Arquivo muito grande. Máximo 5MB.')
        return
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('photoUrl', 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.')
        return
      }

      // Criar preview
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setPhotoPreview(dataUrl)
        setFieldValue('photoUrl', dataUrl)
        clearError('photoUrl')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setCurrentStep(1)
    setPhotoPreview(null)
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {initialData ? 'Editar Coleta' : 'Nova Coleta'}
              </h2>
              <p className="text-sm text-gray-500">
                {initialData ? 'Atualize os dados da coleta' : 'Registre uma nova coleta de pragas'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              {/* Espaço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Espaço *
                </label>
                <select
                  value={values.spaceId}
                  onChange={(e) => handleInputChange('spaceId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.spaceId && touched.spaceId
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um espaço</option>
                  {spaces
                    .filter(space => space.active)
                    .map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name} - {space.location}
                      </option>
                    ))
                  }
                </select>
                {errors.spaceId && touched.spaceId && (
                  <p className="mt-1 text-sm text-red-600">{errors.spaceId}</p>
                )}
                {selectedSpace && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      <strong>QR Code:</strong> {selectedSpace.qrCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Tipo:</strong> {selectedSpace.attractiveType}
                    </p>
                  </div>
                )}
              </div>

              {/* Operador */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Operador *
                </label>
                <select
                  value={values.operatorId}
                  onChange={(e) => handleInputChange('operatorId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.operatorId && touched.operatorId
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um operador</option>
                  {operators
                    .filter(operator => operator.active)
                    .map((operator) => (
                      <option key={operator.id} value={operator.id}>
                        {operator.name} ({operator.role})
                      </option>
                    ))
                  }
                </select>
                {errors.operatorId && touched.operatorId && (
                  <p className="mt-1 text-sm text-red-600">{errors.operatorId}</p>
                )}
                {selectedOperator && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> {selectedOperator.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Telefone:</strong> {selectedOperator.phone}
                    </p>
                  </div>
                )}
              </div>

              {/* Peso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={values.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.weight && touched.weight
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
                {errors.weight && touched.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Peso da coleta em quilogramas (0.01 a 50.00 kg)
                </p>
              </div>

              {/* Data da Coleta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data e Hora da Coleta *
                </label>
                <input
                  type="datetime-local"
                  value={values.collectedAt.toISOString().slice(0, 16)}
                  onChange={(e) => handleInputChange('collectedAt', new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {errors.collectedAt && touched.collectedAt && (
                  <p className="mt-1 text-sm text-red-600">{errors.collectedAt}</p>
                )}
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-6">
              {/* Upload de Foto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Camera className="w-4 h-4 inline mr-1" />
                  Foto da Coleta
                </label>
                
                {!photoPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Clique para selecionar uma foto
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG até 5MB
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview da foto"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null)
                        setFieldValue('photoUrl', '')
                        clearError('photoUrl')
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {errors.photoUrl && touched.photoUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.photoUrl}</p>
                )}
              </div>

              {/* Condições Climáticas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Cloud className="w-4 h-4 inline mr-1" />
                  Condições Climáticas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {weatherOptions.map((option) => (
                    <label key={option.value} className="relative">
                      <input
                        type="radio"
                        name="weatherCondition"
                        value={option.value}
                        checked={values.weatherCondition === option.value}
                        onChange={(e) => handleInputChange('weatherCondition', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                        values.weatherCondition === option.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="text-lg mb-1">{option.icon}</div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Temperatura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Thermometer className="w-4 h-4 inline mr-1" />
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  min="-10"
                  max="50"
                  value={values.temperature || ''}
                  onChange={(e) => handleInputChange('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Ex: 25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {errors.temperature && touched.temperature && (
                  <p className="mt-1 text-sm text-red-600">{errors.temperature}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Temperatura ambiente no momento da coleta (-10°C a 50°C)
                </p>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={values.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder="Informações adicionais sobre a coleta..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {errors.observations && touched.observations && (
                  <p className="mt-1 text-sm text-red-600">{errors.observations}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Máximo 500 caracteres
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Registrar Coleta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 