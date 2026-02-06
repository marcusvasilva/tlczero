import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Users } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { formatPhone } from '@/lib/formatters'
import type { CreateSimpleOperatorData, SimpleOperator } from '@/types/operator'

// Schema de validação simplificado - SEM email e senha
const simpleOperatorSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

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
    }, 'CPF deve ter 11 dígitos'),

  role: z.enum(['operator', 'supervisor'] as const, {
    required_error: 'Função é obrigatória'
  }),

  account_id: z.string()
    .min(1, 'Cliente é obrigatório'),

  notes: z.string().optional()
})

type SimpleOperatorFormData = z.infer<typeof simpleOperatorSchema>

interface SimpleOperatorFormProps {
  operator?: SimpleOperator
  defaultAccountId?: string
  lockedRole?: 'operator' | 'supervisor'
  onSubmit: (data: CreateSimpleOperatorData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function SimpleOperatorForm({
  operator,
  defaultAccountId,
  lockedRole,
  onSubmit,
  onCancel,
  isLoading
}: SimpleOperatorFormProps) {
  const { userType, accountContext, user } = useAuthContext()
  const { clients } = useClients()

  const resolvedAccountId = operator?.account_id || defaultAccountId || accountContext || user?.account_id || ''

  // Filtrar clientes baseado no contexto do usuário
  const availableClients = userType === 'admin'
    ? clients
    : clients.filter(client => client.id === resolvedAccountId || client.id === (accountContext || user?.account_id))

  const selectedClient = availableClients.find(c => c.id === resolvedAccountId)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = useForm<SimpleOperatorFormData>({
    resolver: zodResolver(simpleOperatorSchema),
    defaultValues: {
      name: operator?.name || '',
      phone: operator?.phone || '',
      cpf: operator?.cpf || '',
      role: operator?.role || lockedRole || 'operator',
      account_id: resolvedAccountId,
      notes: operator?.notes || ''
    }
  })

  // Sincronizar account_id quando clients carregam após a inicialização do form
  useEffect(() => {
    if (resolvedAccountId && availableClients.some(c => c.id === resolvedAccountId)) {
      setValue('account_id', resolvedAccountId)
    }
  }, [resolvedAccountId, availableClients, setValue])

  const onFormSubmit = async (data: SimpleOperatorFormData) => {
    try {
      if (!data.account_id) {
        throw new Error('Por favor, selecione um cliente')
      }

      const submitData: CreateSimpleOperatorData = {
        name: data.name,
        phone: data.phone || undefined,
        cpf: data.cpf || undefined,
        role: data.role,
        account_id: data.account_id,
        notes: data.notes || undefined,
        status: 'active'
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Erro ao salvar operador:', error)
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
    setValue('cpf', formatted)
  }

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
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {operator
                ? `Editar ${(lockedRole || operator.role) === 'supervisor' ? 'Supervisor' : 'Operador'}`
                : `Novo ${lockedRole === 'supervisor' ? 'Supervisor' : 'Operador'}`}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {operator
                ? `Atualize as informações do ${(lockedRole || operator.role) === 'supervisor' ? 'supervisor' : 'operador'}`
                : `Cadastre um novo ${lockedRole === 'supervisor' ? 'supervisor' : 'operador'}`}
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
      <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cliente *
          </label>
          <select
            id="account_id"
            {...register('account_id')}
            className={inputClass(!!errors.account_id)}
          >
            <option value="">Selecione um cliente</option>
            {availableClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company_name}
              </option>
            ))}
          </select>
          {errors.account_id && (
            <p className="mt-1 text-sm text-red-600">{errors.account_id.message}</p>
          )}
          {selectedClient && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>CNPJ:</strong> {selectedClient.cnpj || 'Não informado'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Contato:</strong> {selectedClient.contact_person || 'Não informado'} - {selectedClient.phone || 'Não informado'}
              </p>
            </div>
          )}
        </div>

        {/* Nome Completo */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            id="name"
            {...register('name')}
            placeholder="Nome completo do operador"
            className={inputClass(!!errors.name)}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Função */}
        {lockedRole ? (
          <input type="hidden" {...register('role')} value={lockedRole} />
        ) : (
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Função *
            </label>
            <select
              id="role"
              {...register('role')}
              className={inputClass(!!errors.role)}
            >
              <option value="operator">Operador</option>
              <option value="supervisor">Supervisor</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Informações Adicionais (Opcionais)</h3>

          {/* Telefone e CPF */}
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

          {/* Observações */}
          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Observações
            </label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Observações sobre o operador (opcional)"
              rows={3}
              className={inputClass(!!errors.notes)}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
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
            {isSubmitting || isLoading ? 'Salvando...' : operator ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  )
}
