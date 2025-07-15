import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/formatters'
import { useOperators } from '@/hooks/useOperators'
import { 
  Scale, 
  Camera, 
  MessageSquare, 
  Check, 
  Upload,
  AlertCircle,
  Building2,
  Loader2,
  User
} from 'lucide-react'

interface SpaceInfo {
  spaceId: string
  spaceName: string
  accountName: string
  accountId: string
  qrEnabled: boolean
}

export function AnonymousCollect() {
  const { token } = useParams<{ token: string }>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const weightInputRef = useRef<HTMLInputElement>(null)

  // Estados
  const [spaceInfo, setSpaceInfo] = useState<SpaceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Form data
  const [weight, setWeight] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  
  // Validação
  const [validationErrors, setValidationErrors] = useState<{
    weight?: string
    operatorId?: string
  }>({})

  // Hook para buscar operadores (com accountId do espaço quando disponível)
  const { operators, isLoading: isLoadingOperators } = useOperators({
    accountId: spaceInfo?.accountId
  })

  // Buscar informações do espaço pelo token
  useEffect(() => {
    const fetchSpaceInfo = async () => {
      if (!token) {
        setError('Token inválido')
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .rpc('get_space_by_token' as any, { token })
          .single()

        if (error || !data) {
          throw new Error('Espaço não encontrado ou QR Code desativado')
        }

        const spaceData = data as {
          space_id: string
          space_name: string
          account_name: string
          account_id: string
          qr_enabled: boolean
        }

        setSpaceInfo({
          spaceId: spaceData.space_id,
          spaceName: spaceData.space_name,
          accountName: spaceData.account_name,
          accountId: spaceData.account_id,
          qrEnabled: spaceData.qr_enabled
        })
      } catch (err) {
        console.error('Erro ao buscar espaço:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar espaço')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSpaceInfo()
  }, [token])

  // Filtrar operadores pela conta do espaço (já filtrado no hook, mas garantindo)
  const availableOperators = spaceInfo ? operators.filter(op => op.account_id === spaceInfo.accountId) : []
  
  // Debug: verificar se operadores foram carregados
  useEffect(() => {
    if (spaceInfo && !isLoadingOperators) {
      console.log('🔍 Operadores carregados para conta:', spaceInfo.accountId)
      console.log('📋 Operadores disponíveis:', availableOperators)
      console.log('🎯 Operador selecionado atual:', operatorId)
    }
  }, [spaceInfo, isLoadingOperators, availableOperators, operatorId])

  // Manipular upload de foto
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('A foto deve ter no máximo 5MB')
        return
      }
      
      setPhoto(file)
      
      // Criar preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Validar formulário
  const validateForm = () => {
    const errors: typeof validationErrors = {}
    
    const weightValue = parseFloat(weight.replace(',', '.'))
    
    if (!weight) {
      errors.weight = 'Peso é obrigatório'
    } else if (isNaN(weightValue) || weightValue <= 0) {
      errors.weight = 'Peso deve ser maior que zero'
    } else if (weightValue > 50) {
      errors.weight = 'Peso não pode exceder 50kg'
    }
    
    if (!operatorId) {
      errors.operatorId = 'Operador é obrigatório'
    } else {
      console.log('✅ Operador válido:', operatorId)
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submeter coleta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !spaceInfo) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const weightValue = parseFloat(weight.replace(',', '.'))
      
      // Upload da foto se houver
      let photoUrl = null
      if (photo) {
        // Determinar extensão do arquivo baseado no tipo MIME
        const fileExtension = photo.type.split('/')[1] || 'jpg'
        const fileName = `collections/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
        
        console.log('📸 Fazendo upload da foto:', fileName, 'tamanho:', photo.size)
        
        const { error: uploadError } = await supabase.storage
          .from('collection-photos')
          .upload(fileName, photo)
        
        if (uploadError) {
          console.error('❌ Erro no upload da foto:', uploadError)
          throw uploadError
        }
        
        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('collection-photos')
          .getPublicUrl(fileName)
        
        photoUrl = publicUrl
        console.log('✅ Foto enviada com sucesso:', photoUrl)
      }

      // Inserir coleta na tabela principal collections
      const collectionData = {
        space_id: spaceInfo.spaceId,
        user_id: operatorId,
        weight_collected: weightValue,
        photo_url: photoUrl,
        notes: notes || null,
        collection_date: new Date().toISOString().split('T')[0]
      }
      
      console.log('📝 Inserindo coleta:', collectionData)
      
      const { error: insertError } = await supabase
        .from('collections')
        .insert(collectionData)

      if (insertError) {
        console.error('❌ Erro ao inserir coleta:', insertError)
        throw insertError
      }

      // Sucesso!
      setShowSuccess(true)
      
      // Limpar formulário
      setWeight('')
      setOperatorId('')
      setPhoto(null)
      setPhotoPreview(null)
      setNotes('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      // Esconder mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)

    } catch (err) {
      console.error('Erro ao enviar coleta:', err)
      setError('Erro ao enviar coleta. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizar estados
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error && !spaceInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!spaceInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">TLC Zero</h1>
          <p className="text-green-100 mt-1">Controle de Pragas</p>
        </div>
      </div>

      {/* Informações do Espaço */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gray-400" />
            <div>
              <h2 className="font-semibold text-gray-900">{spaceInfo.spaceName}</h2>
              <p className="text-sm text-gray-500">{spaceInfo.accountName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mensagem de Sucesso */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Coleta registrada com sucesso!</p>
                <p className="text-sm text-green-700 mt-1">
                  Você pode fazer uma nova coleta ou fechar esta página.
                </p>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && spaceInfo && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Erro ao enviar</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Campo de Operador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              Operador *
              {operatorId && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Selecionado
                </span>
              )}
            </label>
            <select
              value={operatorId}
              onChange={(e) => {
                const selectedValue = e.target.value
                console.log('🔄 Operador selecionado:', selectedValue)
                setOperatorId(selectedValue)
                setValidationErrors({})
              }}
              className={`w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${
                validationErrors.operatorId 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
              disabled={isSubmitting || isLoadingOperators}
            >
              <option value="">
                {isLoadingOperators ? 'Carregando operadores...' : 'Selecionar operador'}
              </option>
              {availableOperators.map(operator => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
              {!isLoadingOperators && availableOperators.length === 0 && (
                <option value="" disabled>
                  Nenhum operador disponível
                </option>
              )}
            </select>
            {validationErrors.operatorId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.operatorId}</p>
            )}
            {!isLoadingOperators && availableOperators.length === 0 && (
              <p className="mt-1 text-sm text-yellow-600">
                Nenhum operador encontrado para esta conta. Verifique com o administrador.
              </p>
            )}
          </div>

          {/* Campo de Peso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Scale className="inline w-4 h-4 mr-1" />
              Peso Coletado (kg) *
            </label>
            <input
              ref={weightInputRef}
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value)
                setValidationErrors({})
              }}
              placeholder="Ex: 2,5"
              className={`w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900 ${
                validationErrors.weight 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {validationErrors.weight && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.weight}</p>
            )}
          </div>

          {/* Campo de Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera className="inline w-4 h-4 mr-1" />
              Foto da Coleta
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
              disabled={isSubmitting}
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded">
                    <Upload className="w-8 h-8 text-white" />
                    <span className="ml-2 text-white font-medium">Trocar Foto</span>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Toque para tirar ou selecionar foto</p>
                </div>
              )}
            </button>
          </div>

          {/* Campo de Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="inline w-4 h-4 mr-1" />
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
              disabled={isSubmitting}
            />
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Enviar Coleta
              </>
            )}
          </button>
        </form>

        {/* Informações Adicionais */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Não é necessário fazer login</p>
          <p className="mt-1">Data: {formatDate(new Date())}</p>
        </div>
      </div>
    </div>
  )
}

export default AnonymousCollect 