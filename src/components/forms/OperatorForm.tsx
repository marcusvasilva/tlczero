import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthContext } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import type { Operator, CreateOperatorData } from '@/types/operator'
import { formatCPF, formatPhone } from '@/lib/formatters'
import { validateCPF } from '@/lib/validations'

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

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
    {children}
  </div>
)

const Badge = ({ children, variant = 'default', className = '' }: any) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'secondary' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
  } ${className}`}>
    {children}
  </span>
)

// Schema de validação Zod
const operatorSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true
      const cleaned = val.replace(/\D/g, '')
      return cleaned.length === 10 || cleaned.length === 11
    }, 'Telefone deve ter 10 ou 11 dígitos'),
  
  cpf: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true
      return validateCPF(val)
    }, 'CPF inválido'),
  
  role: z.enum(['operador', 'supervisor'] as const, {
    required_error: 'Função é obrigatória'
  }),
  
  clientId: z.string()
    .min(1, 'Cliente é obrigatório'),
  
  active: z.boolean()
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
  isLoading = false 
}: OperatorFormProps) {
  const { userType, clientContext, user } = useAuthContext()
  const { clients } = useClients()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    operator?.avatar || null
  )

  // Filtrar clientes baseado no contexto do usuário
  const availableClients = userType === 'admin' 
    ? clients 
    : clients.filter(client => client.id === (clientContext || user?.clientId))

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
      phone: operator?.phone || '',
      cpf: operator?.cpf || '',
      role: (operator?.role === 'admin' ? 'operador' : operator?.role as 'operador' | 'supervisor') || 'operador',
      clientId: operator?.clientId || clientContext || user?.clientId || '',
      active: operator?.active ?? true
    }
  })

  const watchedRole = watch('role')

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

    setAvatarFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onFormSubmit = async (data: OperatorFormData) => {
    try {
      const submitData: CreateOperatorData = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        cpf: data.cpf || undefined,
        role: data.role,
        clientId: data.clientId,
        active: data.active,
        avatar: avatarFile ? URL.createObjectURL(avatarFile) : operator?.avatar
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Erro ao salvar operador:', error)
    }
  }

  const handleCancel = () => {
    reset()
    setAvatarFile(null)
    setAvatarPreview(operator?.avatar || null)
    onCancel()
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setValue('cpf', formatted)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {operator ? 'Editar Operador' : 'Novo Operador'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {operator ? 'Atualize as informações do operador' : 'Preencha os dados para criar um novo operador'}
        </p>
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
                  {watch('name')?.charAt(0)?.toUpperCase() || '?'}
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
            className={errors.name ? 'border-red-500' : ''}
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
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Telefone e CPF em linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              {...register('phone')}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              {...register('cpf')}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              className={errors.cpf ? 'border-red-500' : ''}
            />
            {errors.cpf && (
              <p className="text-sm text-red-500">{errors.cpf.message}</p>
            )}
          </div>
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
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
            <Label htmlFor="clientId">
              Cliente <span className="text-red-500">*</span>
            </Label>
            <select
              id="clientId"
              {...register('clientId')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.clientId ? 'border-red-500' : ''
              }`}
              disabled={userType !== 'admin'}
            >
              <option value="">Selecione um cliente</option>
              {availableClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="text-sm text-red-500">{errors.clientId.message}</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                {...register('active')}
                value="true"
                className="text-green-500"
              />
              <Badge variant="default" className="bg-green-100 text-green-800">
                Ativo
              </Badge>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                {...register('active')}
                value="false"
                className="text-red-500"
              />
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Inativo
              </Badge>
            </label>
          </div>
        </div>

        {/* Informações da função */}
        {watchedRole && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Permissões da função: {watchedRole === 'operador' ? 'Operador' : 'Supervisor'}
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {watchedRole === 'operador' ? (
                <>
                  <li>• Visualizar espaços e coletas do cliente</li>
                  <li>• Criar novas coletas via QR code</li>
                  <li>• Visualizar dashboard básico</li>
                </>
              ) : (
                <>
                  <li>• Todas as permissões de operador</li>
                  <li>• Gerenciar operadores do cliente</li>
                  <li>• Visualizar relatórios completos</li>
                  <li>• Gerenciar espaços do cliente</li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting || isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting || isLoading ? 'Salvando...' : (operator ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </form>
    </Card>
  )
} 