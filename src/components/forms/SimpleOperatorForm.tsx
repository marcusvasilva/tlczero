import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthContext } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { formatPhone } from '@/lib/formatters'
import type { CreateSimpleOperatorData, SimpleOperator } from '@/types/operator'

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

const Textarea = ({ className = '', ...props }: any) => (
  <textarea
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${className}`}
    {...props}
  />
)

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
  onSubmit: (data: CreateSimpleOperatorData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function SimpleOperatorForm({ 
  operator, 
  onSubmit, 
  onCancel, 
  isLoading 
}: SimpleOperatorFormProps) {
  const { userType, accountContext, user } = useAuthContext()
  const { clients } = useClients()

  // Filtrar clientes baseado no contexto do usuário
  const availableClients = userType === 'admin' 
    ? clients 
    : clients.filter(client => client.id === (accountContext || user?.account_id))

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
      role: operator?.role || 'operator',
      account_id: operator?.account_id || accountContext || user?.account_id || '',
      notes: operator?.notes || ''
    }
  })

  const onFormSubmit = async (data: SimpleOperatorFormData) => {
    console.log('🚀 Dados do formulário simples recebidos:', data)
    
    try {
      // Validar se account_id foi selecionado
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

  return (
    <div className="p-6">
      <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-green-800">Estrutura Simplificada</h3>
        </div>
        <p className="text-green-700">
          Operadores são registros simples para seleção durante coletas. Não há necessidade de criar usuários ou senhas.
        </p>
        <p className="text-green-600 text-sm mt-2">
          💡 Mais fácil e prático para uso no dia a dia!
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Nome Completo */}
        <div>
          <Label htmlFor="name">
            Nome Completo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Nome completo do operador"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

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

        {/* Função e Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">
              Função <span className="text-red-500">*</span>
            </Label>
            <select
              id="role"
              {...register('role')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.role ? 'border-red-500' : ''
              }`}
            >
              <option value="operator">Operador</option>
              <option value="supervisor">Supervisor</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-sm">⚠️</span>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Importante sobre as funções:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Supervisor:</strong> Pode criar e gerenciar operadores da sua empresa</li>
                    <li><strong>Operador:</strong> Só pode ser criado se já existir um supervisor ativo na empresa</li>
                  </ul>
                  <p className="text-xs mt-2">💡 Se esta é a primeira pessoa da empresa, comece criando um Supervisor.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="account_id">
              Cliente <span className="text-red-500">*</span>
            </Label>
            <select
              id="account_id"
              {...register('account_id')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
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
              <p className="mt-1 text-sm text-red-600">{errors.account_id.message}</p>
            )}
          </div>
        </div>

        {/* Observações */}
        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Observações sobre o operador (opcional)"
            rows={3}
            className={errors.notes ? 'border-red-500' : ''}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
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
            {isSubmitting || isLoading ? 'Salvando...' : operator ? 'Atualizar' : 'Criar Operador'}
          </Button>
        </div>
      </form>
    </div>
  )
} 