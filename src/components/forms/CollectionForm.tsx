import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Scale, X, Building2, User, Calendar, Camera, MessageSquare } from 'lucide-react'
import { useForm } from '@/hooks/useForm'
import { useAuthContext } from '@/contexts/AuthContext'
import { collectionSchema } from '@/lib/validations'
import { getCurrentBrazilDate, formatBrazilDateTimeLocal, parseBrazilDateTime } from '@/lib/utils'
import type { CreateCollectionData, Collection, Space, SimpleOperator, Client } from '@/types'

interface CollectionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateCollectionData) => void
  initialData?: Collection | null
  spaces: Space[]
  operators: SimpleOperator[]
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
  const { user, userType, accountContext } = useAuthContext()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const previousSelectedSpaceRef = useRef<string | undefined>(undefined)
  const initialDataRef = useRef<Collection | null>(null)

  // Para admin, clientId fica vazio (será selecionado no formulário)
  // Para supervisor/operator, usa o account_id do usuário
  const clientId = useMemo(() => {
    return userType === 'admin' ? '' : (accountContext || user?.account_id || '')
  }, [userType, accountContext, user?.account_id])

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
      operatorId: userType === 'operator' ? (user?.id || '') : '',
      clientId: clientId,
      weight: 0.01, // Iniciar com valor mínimo válido
      photoUrl: '',
      observations: '',
      collectedAt: getCurrentBrazilDate()
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

  // Preencher formulário quando editando - apenas quando initialData mudar
  useEffect(() => {
    if (initialData && initialData !== initialDataRef.current) {
      initialDataRef.current = initialData
      setFieldValue('spaceId', initialData.spaceId)
      setFieldValue('operatorId', initialData.operatorId)
      // Converter peso de gramas para kg para exibição
      setFieldValue('weight', initialData.weight / 1000)
      setFieldValue('photoUrl', initialData.photoUrl || '')
      setFieldValue('observations', initialData.observations || '')
      setFieldValue('collectedAt', initialData.collectedAt)
      setFieldValue('clientId', initialData.clientId)
      setPhotoPreview(initialData.photoUrl || null)
    } else if (!initialData && initialDataRef.current) {
      initialDataRef.current = null
      reset()
      setPhotoPreview(null)
    }
  }, [initialData, setFieldValue, reset])

  // Preencher spaceId quando selecionado externamente - apenas quando mudar
  useEffect(() => {
    if (selectedSpaceId && selectedSpaceId !== previousSelectedSpaceRef.current) {
      previousSelectedSpaceRef.current = selectedSpaceId
      setFieldValue('spaceId', selectedSpaceId)
    }
  }, [selectedSpaceId, setFieldValue])

  // Filtrar dados baseado no contexto do usuário - memoizado para evitar recálculos
  const targetAccountId = useMemo(() => {
    return accountContext || user?.account_id
  }, [accountContext, user?.account_id])
  
  // Derived state
  const selectedClient = clients.find(c => c.id === values.clientId)
  const filteredSpaces = selectedClient ? spaces.filter(s => s.clientId === selectedClient.id) : []
  const filteredOperators = selectedClient ? operators.filter(o => o.account_id === targetAccountId) : []

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    // Converter peso de kg para gramas antes de validar
    const valuesWithGrams = {
      ...values,
      weight: (values.weight || 0) * 1000 // Converter kg para gramas
    }

    // Validar usando schema
    const result = collectionSchema.safeParse(valuesWithGrams)
    if (!result.success) {
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof CreateCollectionData
        setError(field, error.message)
      })
      return
    }

    onSubmit(valuesWithGrams)
  }, [values, setError, onSubmit])

  const handleInputChange = useCallback((field: keyof CreateCollectionData, value: any) => {
    console.log(`📝 Alterando campo ${field}:`, value)
    setFieldValue(field, value)
    clearError(field)
  }, [setFieldValue, clearError])

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [setError, setFieldValue, clearError])

  const handleClose = useCallback(() => {
    setPhotoPreview(null)
    reset()
    onClose()
  }, [reset, onClose])
  
  // Prevenir event bubbling no modal
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Handle ESC key para fechar modal
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      handleClose()
    }
  }, [isOpen, handleClose])

  // Adicionar/remover event listener para ESC
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
      return () => document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, handleEscKey])

  if (!isOpen) return null

  // Não renderizar até que o contexto de autenticação esteja disponível
  // Para admin, clientId pode estar vazio (será selecionado no formulário)
  // Para supervisor/operator, clientId é obrigatório
  if (!user || (userType !== 'admin' && !clientId)) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-700">Carregando contexto...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={handleModalClick}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Editar Coleta' : 'Nova Coleta'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seleção de Cliente - apenas para admin */}
          {userType === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente *
              </label>
              <select
                value={values.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
              {errors.clientId && touched.clientId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.clientId}</p>
              )}
            </div>
          )}

          {/* Seleção de Espaço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building2 className="inline w-4 h-4 mr-1" />
              Espaço *
            </label>
            <select
              value={values.spaceId}
              onChange={(e) => handleInputChange('spaceId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Selecione um espaço</option>
              {filteredSpaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            {errors.spaceId && touched.spaceId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.spaceId}</p>
            )}
          </div>

          {/* Seleção de Operador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              Operador *
            </label>
            <select
              value={values.operatorId}
              onChange={(e) => handleInputChange('operatorId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
              disabled={userType === 'operator'}
            >
              <option value="">Selecione um operador</option>
              {filteredOperators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
            {errors.operatorId && touched.operatorId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.operatorId}</p>
            )}
          </div>

          {/* Peso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Scale className="inline w-4 h-4 mr-1" />
              Peso Coletado (kg) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={values.weight}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            {errors.weight && touched.weight && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weight}</p>
            )}
          </div>

          {/* Data da Coleta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Data da Coleta *
            </label>
                         <input
               type="datetime-local"
               value={values.collectedAt ? formatBrazilDateTimeLocal(values.collectedAt) : ''}
               onChange={(e) => {
                 const parsedDate = parseBrazilDateTime(e.target.value)
                 handleInputChange('collectedAt', parsedDate)
               }}
               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
               required
             />
            {errors.collectedAt && touched.collectedAt && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.collectedAt}</p>
            )}
          </div>

          {/* Upload de Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Camera className="inline w-4 h-4 mr-1" />
              Foto da Coleta
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="Preview da foto"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
            {errors.photoUrl && touched.photoUrl && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.photoUrl}</p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MessageSquare className="inline w-4 h-4 mr-1" />
              Observações
            </label>
            <textarea
              value={values.observations}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Observações sobre a coleta..."
            />
            {errors.observations && touched.observations && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.observations}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 