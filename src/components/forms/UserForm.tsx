import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthContext } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { formatPhone } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

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

const Label = ({ htmlFor, children, className = '' }: any) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}>
    {children}
  </label>
)

const Input = ({ className = '', ...props }: any) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white ${className}`}
    {...props}
  />
)

const Select = ({ className = '', children, ...props }: any) => (
  <select
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white ${className}`}
    {...props}
  >
    {children}
  </select>
)

// Schema de validação
const userSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .optional()
    .or(z.literal('')),
  
  role: z.enum(['admin', 'supervisor', 'operator'], {
    required_error: 'Função é obrigatória'
  }),
  
  account_id: z.string().optional(),
  
  supervisor_id: z.string().optional(),
  
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
      const cleaned = val.replace(/\D/g, '')
      return cleaned.length === 11
    }, 'CPF deve ter 11 dígitos')
})

type UserFormData = z.infer<typeof userSchema>

interface CreateUserData {
  name: string
  email: string
  password?: string
  role: 'admin' | 'supervisor' | 'operator'
  account_id?: string
  phone?: string
  cpf?: string
  supervisor_id?: string
}

interface UserFormProps {
  user?: User
  onSubmit: (data: CreateUserData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function UserForm({ 
  user, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: UserFormProps) {
  const { userType, accountContext, user: currentUser } = useAuthContext()
  const { clients } = useClients()
  const [availableSupervisors, setAvailableSupervisors] = useState<User[]>([])
  const [showPasswordField, setShowPasswordField] = useState(!user) // Mostrar senha apenas na criação

  // Filtrar clientes baseado no contexto do usuário
  const availableClients = userType === 'admin' 
    ? clients 
    : clients.filter(client => client.id === (accountContext || currentUser?.account_id))

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: (user?.role || 'operator') as 'admin' | 'supervisor' | 'operator',
      account_id: user?.account_id || accountContext || currentUser?.account_id || '',
      supervisor_id: user?.supervisor_id || '',
      phone: user?.phone || '',
      cpf: user?.cpf || ''
    }
  })

  const watchedRole = watch('role')
  const watchedAccountId = watch('account_id')

  // Buscar supervisores da empresa selecionada
  useEffect(() => {
    const fetchSupervisors = async () => {
      if (watchedAccountId && watchedRole === 'operator') {
        try {
          // Aqui você pode usar o hook useUsers ou fazer uma consulta direta
          // Por simplicidade, vou usar uma consulta direta
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'supervisor')
            .eq('account_id', watchedAccountId)
            .eq('status', 'active')

          if (!error) {
            setAvailableSupervisors(data || [])
          }
        } catch (error) {
          console.error('Erro ao buscar supervisores:', error)
        }
      } else {
        setAvailableSupervisors([])
      }
    }

    fetchSupervisors()
  }, [watchedAccountId, watchedRole])

  const onFormSubmit = async (data: UserFormData) => {
    console.log('🚀 Dados do formulário recebidos:', data)
    
    try {
      // Validações específicas por role
      if (data.role === 'admin') {
        data.account_id = undefined
        data.supervisor_id = undefined
      } else if (data.role === 'supervisor') {
        if (!data.account_id) {
          throw new Error('Supervisor deve ser associado a uma empresa')
        }
        data.supervisor_id = undefined
      } else if (data.role === 'operator') {
        if (!data.account_id) {
          throw new Error('Operador deve ser associado a uma empresa')
        }
        if (!data.supervisor_id) {
          throw new Error('Operador deve ter um supervisor')
        }
      }

      const submitData: CreateUserData = {
        name: data.name,
        email: data.email,
        password: data.password || undefined,
        role: data.role,
        account_id: data.account_id || undefined,
        phone: data.phone || undefined,
        cpf: data.cpf || undefined,
        supervisor_id: data.supervisor_id || undefined
      }

      console.log('📝 Dados preparados para envio:', submitData)
      await onSubmit(submitData)
      console.log('✅ Usuário salvo com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error)
      throw error
    }
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    setValue('cpf', formatted.slice(0, 14))
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'supervisor': return 'Supervisor'
      case 'operator': return 'Operador'
      default: return role
    }
  }

  const getAvailableRoles = () => {
    const roles = []
    
    if (userType === 'admin') {
      roles.push('admin', 'supervisor', 'operator')
    } else if (userType === 'supervisor') {
      roles.push('supervisor', 'operator')
    }
    
    return roles
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {user ? 'Editar Usuário' : 'Novo Usuário'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {user ? 'Atualize as informações do usuário' : 'Preencha os dados para criar um novo usuário'}
        </p>
        
        {!user && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="text-blue-600 text-lg">👤</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Criação de Usuário do Sistema
                </h3>
                <p className="text-sm text-blue-800">
                  Este usuário poderá fazer login no sistema e terá acesso às funcionalidades 
                  baseadas na sua função.
                </p>
                {userType === 'supervisor' && (
                  <p className="text-xs text-blue-700 mt-2">
                    💡 Você só pode criar usuários para sua empresa.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

             <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-6">
        {/* Nome */}
        <div>
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
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        {showPasswordField && (
          <div>
            <Label htmlFor="password">
              Senha {!user && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Digite a senha de acesso"
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {user 
                ? '💡 Deixe em branco para manter a senha atual' 
                : '💡 Se não informar, uma senha será gerada automaticamente'
              }
            </p>
          </div>
        )}

        {/* Função */}
        <div>
          <Label htmlFor="role">
            Função <span className="text-red-500">*</span>
          </Label>
          <Select
            id="role"
            {...register('role')}
            className={errors.role ? 'border-red-500' : ''}
          >
            {getAvailableRoles().map((role) => (
              <option key={role} value={role}>
                {getRoleLabel(role)}
              </option>
            ))}
          </Select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
          
          {/* Info sobre roles */}
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Sobre as funções:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Admin:</strong> Acesso completo a todo o sistema</li>
                <li><strong>Supervisor:</strong> Gerencia uma empresa específica</li>
                <li><strong>Operador:</strong> Faz coletas e visualiza relatórios</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Empresa (para supervisor/operator) */}
        {(watchedRole === 'supervisor' || watchedRole === 'operator') && (
          <div>
            <Label htmlFor="account_id">
              Empresa <span className="text-red-500">*</span>
            </Label>
            <Select
              id="account_id"
              {...register('account_id')}
              className={errors.account_id ? 'border-red-500' : ''}
            >
              <option value="">Selecione uma empresa</option>
              {availableClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </Select>
            {errors.account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.account_id.message}</p>
            )}
          </div>
        )}

        {/* Supervisor (para operator) */}
        {watchedRole === 'operator' && watchedAccountId && (
          <div>
            <Label htmlFor="supervisor_id">
              Supervisor <span className="text-red-500">*</span>
            </Label>
            <Select
              id="supervisor_id"
              {...register('supervisor_id')}
              className={errors.supervisor_id ? 'border-red-500' : ''}
            >
              <option value="">Selecione um supervisor</option>
              {availableSupervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name}
                </option>
              ))}
            </Select>
            {errors.supervisor_id && (
              <p className="mt-1 text-sm text-red-600">{errors.supervisor_id.message}</p>
            )}
            {availableSupervisors.length === 0 && watchedAccountId && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Nenhum supervisor encontrado para esta empresa. Crie um supervisor primeiro.
              </p>
            )}
          </div>
        )}

        {/* Telefone e CPF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              {...register('cpf')}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              className={errors.cpf ? 'border-red-500' : ''}
            />
            {errors.cpf && (
              <p className="mt-1 text-sm text-red-600">{errors.cpf.message}</p>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4 pt-4">
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
          >
            {isSubmitting || isLoading ? 'Salvando...' : user ? 'Atualizar' : 'Criar Usuário'}
          </Button>
        </div>
      </form>
    </div>
  )
} 