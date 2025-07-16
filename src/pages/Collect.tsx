import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSpaces, useCollections } from '@/hooks'
import { useAuthContext } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/formatters'
import { 
  Camera, 
  QrCode, 
  Scale, 
  MessageSquare, 
  Check, 
  Upload, 
  AlertCircle,
  ArrowLeft,
  MapPin,
  Building2,
  User,
  Calendar,
  Save,
  RefreshCw,
  Trash2
} from 'lucide-react'
import type { CreateCollectionData, Space, Client } from '@/types'

interface FormData {
  weight: string
  photo: File | null
  observations: string
  collectionDate: Date
  spaceId?: string
  operatorId?: string
}

interface ValidationErrors {
  weight?: string
  photo?: string
  operatorId?: string
}

export function Collect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qrCode = searchParams.get('qr')
  
  // Hooks
  const { user } = useAuthContext()
  const { filteredSpaces } = useSpaces()
  const { 
    createCollection, 
    error: collectionError, 
    clearError 
  } = useCollections()

  // Mock function para buscar espaço por QR code
  const getSpaceByQRCode = async (qrCode: string) => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    const supabaseSpace = filteredSpaces.find(space => {
      // Como os dados mockados não têm qrCode, vamos usar o ID como fallback
      return space.id === qrCode || (space as any).qrCode === qrCode
    })
    
    if (!supabaseSpace) return null
    
    // Mapear dados do Supabase para o formato esperado
    const mappedSpace: Space & { client?: Client } = {
      id: supabaseSpace.id,
      clientId: (supabaseSpace as any).client_id || '',
      accountId: (supabaseSpace as any).account_id || '',  // Adicionando accountId
      name: supabaseSpace.name || '',
      description: supabaseSpace.description || undefined,
      areaSize: (supabaseSpace as any).area_size || undefined,
      environmentType: (supabaseSpace as any).environment_type as 'indoor' | 'outdoor' | 'mixed' || 'indoor',
      active: (supabaseSpace as any).status === 'active',
      qrCodeEnabled: (supabaseSpace as any).qr_code_enabled || false,
      createdAt: new Date((supabaseSpace as any).created_at || new Date()),
      updatedAt: new Date((supabaseSpace as any).updated_at || new Date()),
    }
    
    return mappedSpace
  }

  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    weight: '',
    photo: null,
    observations: '',
    collectionDate: new Date()
  })
  
  // Estados da interface
  const [space, setSpace] = useState<(Space & { client?: Client }) | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const weightInputRef = useRef<HTMLInputElement>(null)

  // Carregar dados do espaço baseado no QR code
  useEffect(() => {
    const loadSpace = async () => {
      if (!qrCode) {
        setError('QR Code não fornecido. Escaneie um QR code válido.')
        setIsLoading(false)
        return
      }

      try {
        const spaceData = await getSpaceByQRCode(qrCode)
        if (!spaceData) {
          setError('Espaço não encontrado para este QR Code.')
          setIsLoading(false)
          return
        }

        if (!spaceData.active) {
          setError('Este espaço está inativo e não pode receber coletas.')
          setIsLoading(false)
          return
        }

        setSpace(spaceData)
        setFormData(prev => ({
          ...prev,
          spaceId: spaceData.id,
          operatorId: user?.id || ''
        }))
      } catch (err) {
        setError('Erro ao carregar dados do espaço.')
        console.error('Erro ao carregar espaço:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSpace()
  }, [qrCode, getSpaceByQRCode, user])

  // Handlers do formulário
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpar erros de validação
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setValidationErrors(prev => ({ 
        ...prev, 
        photo: 'Por favor, selecione apenas arquivos de imagem.' 
      }))
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors(prev => ({ 
        ...prev, 
        photo: 'A imagem deve ter no máximo 5MB.' 
      }))
      return
    }

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setPhotoPreview(result)
      }
    }
    reader.readAsDataURL(file)

    handleInputChange('photo', file)
  }

  const handleRemovePhoto = () => {
    setPhotoPreview('')
    handleInputChange('photo', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateForm = () => {
    const errors: ValidationErrors = {}

    // Validar peso
    if (!formData.weight || formData.weight.trim() === '') {
      errors.weight = 'Peso é obrigatório.'
    } else {
      const weight = parseFloat(formData.weight.replace(',', '.'))
      if (isNaN(weight) || weight <= 0) {
        errors.weight = 'Digite um peso válido maior que zero.'
      } else if (weight > 50) {
        errors.weight = 'Peso muito alto. Verifique se está correto.'
      }
    }

    // Validar foto
    if (!formData.photo) {
      errors.photo = 'Foto é obrigatória para registrar a coleta.'
    }

    // Validar operador
    if (!formData.operatorId) {
      errors.operatorId = 'Operador não identificado. Faça login novamente.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Focar no primeiro campo com erro
      const firstError = Object.keys(validationErrors)[0]
      if (firstError === 'weight' && weightInputRef.current) {
        weightInputRef.current.focus()
      }
      return
    }

    setShowConfirmation(true)
  }

  const confirmSubmit = async () => {
    setIsSubmitting(true)
    clearError()

    try {
      const collectionData: CreateCollectionData = {
        spaceId: formData.spaceId || '',
        operatorId: formData.operatorId || '',
        weight: parseFloat(formData.weight.replace(',', '.')) * 1000, // Converter kg para gramas
        photoUrl: formData.photo ? URL.createObjectURL(formData.photo) : undefined,
        observations: formData.observations,
        collectedAt: new Date(),
        clientId: space?.clientId || ''
      }

      // Usar diretamente o collectionData no formato camelCase
      await createCollection(collectionData)
      
      // Sucesso - mostrar feedback e redirecionar
      setShowConfirmation(false)
      // Implementar toast de sucesso aqui
      setTimeout(() => {
        navigate('/collections', { 
          state: { message: 'Coleta registrada com sucesso!' }
        })
      }, 1000)

    } catch (err) {
      setShowConfirmation(false)
      // Erro já está no estado do hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (formData.weight || formData.photo || formData.observations) {
      if (window.confirm('Tem certeza que deseja sair? Os dados não salvos serão perdidos.')) {
        navigate(-1)
      }
    } else {
      navigate(-1)
    }
  }

  // Loading inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-green-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            Carregando dados do espaço...
          </p>
        </div>
      </div>
    )
  }

  // Erro no carregamento
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Erro
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/spaces')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Voltar aos Espaços
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Mobile */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nova Coleta
            </h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Informações do Espaço */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="flex items-center mb-3">
            <QrCode className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Informações do Espaço
            </h2>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <Building2 className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-300">
                <strong>Nome:</strong> {space?.name}
              </span>
            </div>
            
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-300">
                <strong>Cliente:</strong> {(space?.client as any)?.company_name}
              </span>
            </div>
            
            {space?.description && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">
                  <strong>Descrição:</strong> {space.description}
                </span>
              </div>
            )}
            
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-300">
                <strong>Data:</strong> {formatDate(new Date())}
              </span>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload de Foto */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3">
              <Camera className="h-5 w-5 text-green-600 mr-2" />
              <label className="font-semibold text-gray-900 dark:text-white">
                Foto da Coleta *
              </label>
            </div>

            {!photoPreview ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Tire uma foto da coleta realizada
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Foto
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview da coleta"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </div>
            )}

            {validationErrors.photo && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {validationErrors.photo}
              </p>
            )}
          </div>

          {/* Peso */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3">
              <Scale className="h-5 w-5 text-green-600 mr-2" />
              <label className="font-semibold text-gray-900 dark:text-white">
                Peso Coletado *
              </label>
            </div>

            <div className="relative">
              <input
                ref={weightInputRef}
                type="text"
                inputMode="decimal"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="0,0"
                className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  validationErrors.weight 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                kg
              </div>
            </div>

            {validationErrors.weight && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {validationErrors.weight}
              </p>
            )}

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Use vírgula ou ponto para decimais (ex: 1,5 ou 1.5)
            </p>
          </div>

          {/* Observações */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center mb-3">
              <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
              <label className="font-semibold text-gray-900 dark:text-white">
                Observações
              </label>
            </div>

            <textarea
              value={formData.observations || ''}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              placeholder="Observações sobre a coleta (opcional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {(formData.observations || '').length}/500 caracteres
            </p>
          </div>

          {/* Erro de submissão */}
          {collectionError && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {collectionError}
                </p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Botão de Envio Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Registrando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Registrar Coleta
            </>
          )}
        </button>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Check className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirmar Coleta
                </h2>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Espaço:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {space?.name}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Peso:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formData.weight} kg
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Data:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(new Date())}
                  </span>
                </div>
                
                {formData.observations && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Observações:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {formData.observations}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 