import React, { useState, useEffect, useMemo, useRef } from 'react'
import { X, Camera, Upload, Scale, User, Building2, Calendar, FileText } from 'lucide-react'
import { useForm } from '@/hooks'
import { collectionSchema } from '@/lib/validations'
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
      clientId: '',
      weight: 0,
      photoUrl: '',
      observations: '',
      collectedAt: new Date()
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
      setFieldValue('clientId', initialData.clientId)
      setPhotoPreview(initialData.photoUrl || null)
    } else {
      reset()
      setPhotoPreview(null)
    }
  }, [initialData, setFieldValue, reset])

  // Preencher spaceId quando selecionado externamente
  useEffect(() => {
    if (selectedSpaceId && selectedSpaceId !== previousSelectedSpaceRef.current) {
      previousSelectedSpaceRef.current = selectedSpaceId
      setFieldValue('spaceId', selectedSpaceId)
    }
  }, [selectedSpaceId])

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

  const handleClose = () => {
    setPhotoPreview(null)
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {initialData ? 'Editar Coleta' : 'Nova Coleta'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {initialData ? 'Atualize os dados da coleta' : 'Registre uma nova coleta de pragas'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              {/* Seleção de Espaço */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building2 className="w-4 h-4 mr-2" />
                  Espaço *
                </label>
                <select
                  value={values.spaceId}
                  onChange={(e) => handleInputChange('spaceId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Selecione um espaço</option>
                  {spaces.map((space) => {
                    const client = clientsMap[space.clientId]
                    return (
                      <option key={space.id} value={space.id}>
                        {space.name} - {client?.name || 'Cliente não encontrado'}
                      </option>
                    )
                  })}
                </select>
                {errors.spaceId && touched.spaceId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.spaceId}</p>
                )}
                
                {/* Informações do Espaço Selecionado */}
                {selectedSpace && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p><strong>QR Code:</strong> {selectedSpace.qrCode}</p>
                      <p><strong>Tipo:</strong> {selectedSpace.attractiveType}</p>
                      <p><strong>Localização:</strong> {selectedSpace.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Seleção de Operador */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 mr-2" />
                  Operador *
                </label>
                <select
                  value={values.operatorId}
                  onChange={(e) => handleInputChange('operatorId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Selecione um operador</option>
                  {operators.map((operator) => (
                    <option key={operator.id} value={operator.id}>
                      {operator.name} ({operator.role})
                    </option>
                  ))}
                </select>
                {errors.operatorId && touched.operatorId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.operatorId}</p>
                )}
                
                {/* Informações do Operador Selecionado */}
                {selectedOperator && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p><strong>Email:</strong> {selectedOperator.email}</p>
                      <p><strong>Telefone:</strong> {selectedOperator.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Peso */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Scale className="w-4 h-4 mr-2" />
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={values.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: 1,25"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Peso da coleta em quilogramas (0.01 a 50.00 kg)
                </p>
                {errors.weight && touched.weight && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weight}</p>
                )}
              </div>

              {/* Data e Hora */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Data e Hora da Coleta *
                </label>
                <input
                  type="datetime-local"
                  value={values.collectedAt instanceof Date 
                    ? values.collectedAt.toISOString().slice(0, 16) 
                    : ''
                  }
                  onChange={(e) => handleInputChange('collectedAt', new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {errors.collectedAt && touched.collectedAt && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.collectedAt}</p>
                )}
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-6">
              {/* Upload de Foto */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Camera className="w-4 h-4 mr-2" />
                  Foto da Coleta
                </label>
                
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview da coleta"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null)
                        setFieldValue('photoUrl', '')
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Clique para adicionar uma foto
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Selecionar Foto
                    </label>
                  </div>
                )}
                
                {errors.photoUrl && touched.photoUrl && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.photoUrl}</p>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 mr-2" />
                  Observações
                </label>
                <textarea
                  value={values.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  placeholder="Adicione observações sobre a coleta (opcional)..."
                />
                {errors.observations && touched.observations && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.observations}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{initialData ? 'Atualizar' : 'Criar'} Coleta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 