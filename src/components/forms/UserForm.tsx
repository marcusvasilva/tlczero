import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Shield } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { formatPhone } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

// Schema de validação
const userSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  
  password: z.string()
    .optional()
    .refine((val) => val === undefined || val === '' || val.length >= 6, 'Senha deve ter pelo menos 6 caracteres'),
  
  role: z.enum(['admin', 'distributor', 'supervisor', 'operator'], {
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
  role: 'admin' | 'distributor' | 'supervisor' | 'operator'
  account_id?: string
  phone?: string
  cpf?: string
  supervisor_id?: string
}

interface UserFormProps {
  user?: User
  defaultAccountId?: string
  defaultRole?: string
  onSubmit: (data: CreateUserData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function UserForm({
  user,
  defaultAccountId,
  defaultRole,
  onSubmit,
  onCancel,
  isLoading = false
}: UserFormProps) {
  const { userType, accountContext, user: currentUser } = useAuthContext()
  const { clients } = useClients()
  const [availableSupervisors, setAvailableSupervisors] = useState<User[]>([])
  const [showPasswordField] = useState(!user) // Mostrar senha apenas na criação

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
      role: (user?.role || defaultRole || 'operator') as 'admin' | 'distributor' | 'supervisor' | 'operator',
      account_id: user?.account_id || defaultAccountId || accountContext || currentUser?.account_id || '',
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
      // Senha obrigatória na criação
      if (!user && (!data.password || data.password.length < 6)) {
        throw new Error('Senha é obrigatória e deve ter pelo menos 6 caracteres')
      }

      // Validações específicas por role
      if (data.role === 'admin' || data.role === 'distributor') {
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
      case 'distributor': return 'Distribuidor'
      case 'supervisor': return 'Supervisor'
      case 'operator': return 'Operador'
      default: return role
    }
  }

  const getAvailableRoles = () => {
    const roles = []
    
    if (userType === 'admin') {
      roles.push('admin', 'distributor', 'supervisor', 'operator')
    } else if (userType === 'distributor') {
      roles.push('supervisor', 'operator')
    } else if (userType === 'supervisor') {
      roles.push('supervisor', 'operator')
    }
    
    return roles
  }

  const roleTitle = defaultRole === 'supervisor' ? 'Supervisor' : 'Usuário'

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
      hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
    }`

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user ? `Editar ${roleTitle}` : `Novo ${roleTitle}`}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user
                ? `Atualize as informações do ${roleTitle.toLowerCase()}`
                : `Cadastre um novo ${roleTitle.toLowerCase()} com acesso ao sistema`}
            </p>
          </div>
        </div>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit as any)} className="p-6 space-y-6">
        {/* Hidden fields */}
        {defaultRole && <input type="hidden" {...register('role')} value={defaultRole} />}
        {(watchedRole === 'supervisor' || watchedRole === 'operator') && defaultAccountId && (
          <input type="hidden" {...register('account_id')} value={defaultAccountId} />
        )}

        {/* Nome Completo */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            id="name"
            {...register('name')}
            placeholder="Nome completo do supervisor"
            className={inputClass(!!errors.name)}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
            className={inputClass(!!errors.email)}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Senha */}
        {showPasswordField && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha {!user && '*'}
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Digite a senha de acesso"
              className={inputClass(!!errors.password)}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco para manter a senha atual
              </p>
            )}
          </div>
        )}

        {/* Função (quando não tem defaultRole) */}
        {!defaultRole && (
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Função *
            </label>
            <select
              id="role"
              {...register('role')}
              className={inputClass(!!errors.role)}
            >
              {getAvailableRoles().map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>
        )}

        {/* Empresa (quando não tem defaultAccountId) */}
        {(watchedRole === 'supervisor' || watchedRole === 'operator') && !defaultAccountId && (
          <div>
            <label htmlFor="account_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Empresa *
            </label>
            <select
              id="account_id"
              {...register('account_id')}
              className={inputClass(!!errors.account_id)}
            >
              <option value="">Selecione uma empresa</option>
              {availableClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
            {errors.account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.account_id.message}</p>
            )}
          </div>
        )}

        {/* Supervisor (para operator) */}
        {watchedRole === 'operator' && watchedAccountId && (
          <div>
            <label htmlFor="supervisor_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supervisor *
            </label>
            <select
              id="supervisor_id"
              {...register('supervisor_id')}
              className={inputClass(!!errors.supervisor_id)}
            >
              <option value="">Selecione um supervisor</option>
              {availableSupervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name}
                </option>
              ))}
            </select>
            {errors.supervisor_id && (
              <p className="mt-1 text-sm text-red-600">{errors.supervisor_id.message}</p>
            )}
            {availableSupervisors.length === 0 && watchedAccountId && (
              <p className="text-xs text-amber-600 mt-1">
                Nenhum supervisor encontrado para esta empresa. Crie um supervisor primeiro.
              </p>
            )}
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Informações Adicionais (Opcionais)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className={inputClass(!!errors.phone)}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                CPF
              </label>
              <input
                id="cpf"
                {...register('cpf')}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className={inputClass(!!errors.cpf)}
              />
              {errors.cpf && (
                <p className="mt-1 text-sm text-red-600">{errors.cpf.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 rounded-md font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? 'Salvando...' : user ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  )
} 