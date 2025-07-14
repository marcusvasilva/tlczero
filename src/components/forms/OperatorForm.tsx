import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthContext } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import type { Operator, CreateOperatorData } from '@/types/operator'
import { formatPhone } from '@/lib/formatters'

// Componentes UI simples
const Button = ({ children, type = 'button', variant = 'default', onClick, disabled, className = '' }: any) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'outline' 
        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300' 
        : 'bg-blue-600 text-white hover:bg-blue-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
)

const Input = ({ className = '', ...props }: any) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${className}`}
    {...props}
  />
)

const Label = ({ children, htmlFor }: any) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    {children}
  </label>
)



// Schema de validação Zod - Com senha
const operatorSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true
      const cleaned = val.replace(/\D/g, '')
      return cleaned.length === 10 || cleaned.length === 11
    }, 'Telefone deve ter 10 ou 11 dígitos'),
  
  role: z.enum(['operador', 'supervisor'] as const, {
    required_error: 'Função é obrigatória'
  }),
  
  account_id: z.string()
    .min(1, 'Conta é obrigatória')
})

type OperatorFormData = z.infer<typeof operatorSchema>

interface OperatorFormProps {
  operator?: Operator
  onSubmit: (data: CreateOperatorData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function OperatorForm({ 
  operator, 
  onSubmit, 
  onCancel, 
 
}: OperatorFormProps) {
  const { userType, accountContext, user } = useAuthContext()
  const { clients } = useClients()
  // const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    operator?.avatar || null
  )

  // Filtrar clientes baseado no contexto do usuário
  const availableClients = userType === 'admin' 
    ? clients 
    : clients.filter(client => client.id === (accountContext || user?.account_id))

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<OperatorFormData>({
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      name: operator?.name || '',
      email: operator?.email || '',
      password: '',
      phone: operator?.phone || '',
      role: (operator?.role === 'admin' ? 'operador' : operator?.role as 'operador' | 'supervisor') || 'operador',
      account_id: operator?.account_id || accountContext || user?.account_id || ''
    }
  })



  // Handle avatar upload
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem deve ter no máximo 2MB')
      return
    }

    // setAvatarFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onFormSubmit = async (data: OperatorFormData) => {
    console.log('🚀 Dados do formulário recebidos:', data)
    
    try {
      // Validar se account_id foi selecionado
      if (!data.account_id) {
        throw new Error('Por favor, selecione um cliente')
      }
      
      const submitData: CreateOperatorData = {
        name: data.name,
        email: data.email || '',
        password: data.password || undefined, // Incluir senha se fornecida
        phone: data.phone || undefined,
        role: data.role === 'operador' ? 'operator' : 'supervisor',
        account_id: data.account_id as string,
        active: true, // Sempre ativo por padrão
      }

      console.log('📝 Dados preparados para envio:', submitData)
      await onSubmit(submitData)
      console.log('✅ Operador criado com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao salvar operador:', error)
      // Re-lançar o erro para que seja tratado pela página pai
      throw error
    }
  }

  const handleCancel = () => {
    reset()
    // setAvatarFile(null)
    setAvatarPreview(operator?.avatar || null)
    onCancel()
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {operator ? 'Editar Operador' : 'Novo Operador'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {operator ? 'Atualize as informações do operador' : 'Preencha os dados para criar um novo operador'}
        </p>
        
        {!operator && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="text-blue-600 text-lg">🔐</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Criação Automática de Usuário
                </h3>
                <p className="text-sm text-blue-800">
                  Ao criar o operador, um usuário será criado automaticamente no sistema. 
                  Defina email e senha ou deixe em branco para geração automática.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  💡 Email e senha em branco = geração automática baseada no nome.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-2xl">
                  {watch('name')?.charAt(0)?.toUpperCase() || 'G'}
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Clique para alterar a foto (máx. 2MB)
          </p>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nome Completo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Digite o nome completo"
            className={`text-gray-900 bg-white ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
            className={`text-gray-900 bg-white ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            {...register('password')}
            placeholder="Digite a senha de acesso"
            className={`text-gray-900 bg-white ${errors.password ? 'border-red-500' : ''}`}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
          <p className="text-xs text-gray-500">
            💡 Se não informar, uma senha será gerada automaticamente
          </p>
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            {...register('phone')}
            onChange={handlePhoneChange}
            placeholder="(11) 99999-9999"
            className={`text-gray-900 bg-white ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Função e Cliente em linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">
              Função <span className="text-red-500">*</span>
            </Label>
            <select
              id="role"
              {...register('role')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.role ? 'border-red-500' : ''
              }`}
            >
              <option value="operador">Operador</option>
              <option value="supervisor">Supervisor</option>
            </select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_id">
              Cliente <span className="text-red-500">*</span>
            </Label>
            <select
              id="account_id"
              {...register('account_id')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                errors.account_id ? 'border-red-500' : ''
              }`}
            >
              <option value="">Selecione um cliente</option>
              {availableClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
            {errors.account_id && (
              <p className="text-sm text-red-500">{errors.account_id.message}</p>
            )}
          </div>
        </div>



        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  )
}