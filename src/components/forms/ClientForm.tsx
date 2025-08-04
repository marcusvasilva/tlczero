import { useForm } from '@/hooks'
import { validatePhone } from '@/lib/validations'
import type { Account } from '@/types'
import { X } from 'lucide-react'

interface ClientFormProps {
  client?: Account
  onSubmit: (data: Partial<Account>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface ClientFormData {
  company_name: string
  contact_person: string
  phone: string
  email: string
  cnpj: string
  address: string
  status: 'active' | 'inactive'
}

export function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const initialValues: ClientFormData = {
    company_name: client?.company_name || '',
    contact_person: client?.contact_person || '',
    phone: client?.phone || '',
    email: client?.email || '',
    cnpj: client?.cnpj || '',
    address: client?.address || '',
    status: (client?.status as 'active' | 'inactive') || 'active',
  }

  const validate = (values: ClientFormData) => {
    const errors: Partial<Record<keyof ClientFormData, string>> = {}

    // Apenas 3 campos obrigatórios
    if (!values.company_name.trim()) {
      errors.company_name = 'Nome da empresa é obrigatório'
    } else if (values.company_name.length < 2) {
      errors.company_name = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!values.contact_person.trim()) {
      errors.contact_person = 'Responsável é obrigatório'
    }

    if (!values.phone.trim()) {
      errors.phone = 'Telefone é obrigatório'
    } else if (!validatePhone(values.phone)) {
      errors.phone = 'Telefone inválido'
    }

    return errors
  }

  const handleSubmit = async (values: ClientFormData) => {
    console.log('🚀 Iniciando criação de cliente:', values)
    try {
      await onSubmit(values)
      console.log('✅ Cliente criado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error)
      throw error // Re-lançar o erro para que o useForm saiba que falhou
    }
  }

  const form = useForm({
    initialValues,
    validate,
    onSubmit: handleSubmit,
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 xs:p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg xs:text-xl font-semibold text-gray-900 dark:text-white">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onCancel}
            className="touch-target hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit} className="p-4 xs:p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Nome da Empresa */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nome da Empresa *
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={form.values.company_name}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`input-responsive ${
                form.errors.company_name && form.touched.company_name
                  ? 'border-red-500 focus:ring-red-500'
                  : ''
              }`}
              placeholder="Digite o nome da empresa"
              disabled={isLoading}
            />
            {form.errors.company_name && form.touched.company_name && (
              <p className="mt-1 text-sm text-red-600">{form.errors.company_name}</p>
            )}
          </div>

          {/* Responsável */}
          <div>
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Responsável *
            </label>
            <input
              type="text"
              id="contact_person"
              name="contact_person"
              value={form.values.contact_person}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`input-responsive ${
                form.errors.contact_person && form.touched.contact_person
                  ? 'border-red-500 focus:ring-red-500'
                  : ''
              }`}
              placeholder="Nome da pessoa responsável"
              disabled={isLoading}
            />
            {form.errors.contact_person && form.touched.contact_person && (
              <p className="mt-1 text-sm text-red-600">{form.errors.contact_person}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Telefone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.values.phone}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`input-responsive ${
                form.errors.phone && form.touched.phone
                  ? 'border-red-500 focus:ring-red-500'
                  : ''
              }`}
              placeholder="(11) 99999-9999"
              disabled={isLoading}
            />
            {form.errors.phone && form.touched.phone && (
              <p className="mt-1 text-sm text-red-600">{form.errors.phone}</p>
            )}
          </div>

          {/* Campos opcionais */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Informações Adicionais (Opcionais)</h3>
            
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.values.email}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className="input-responsive"
                  placeholder="empresa@exemplo.com"
                  disabled={isLoading}
                />
              </div>

              {/* CNPJ */}
              <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  CNPJ
                </label>
                <input
                  type="text"
                  id="cnpj"
                  name="cnpj"
                  value={form.values.cnpj}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className="input-responsive"
                  placeholder="00.000.000/0000-00"
                  disabled={isLoading}
                />
              </div>

              {/* Endereço */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Endereço
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.values.address}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  rows={2}
                  className="textarea-responsive"
                  placeholder="Digite o endereço completo"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center pt-4">
            <input
              type="checkbox"
              id="status"
              name="status"
              checked={form.values.status === 'active'}
              onChange={(e) => form.setFieldValue('status', e.target.checked ? 'active' : 'inactive')}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded"
              disabled={isLoading}
            />
            <label htmlFor="status" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Cliente ativo
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0 pb-safe -mx-4 xs:-mx-5 sm:-mx-6 px-4 xs:px-5 sm:px-6">
            <button
              type="button"
              onClick={onCancel}
              className="mobile-button bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="mobile-button bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={form.isSubmitting || !form.isValid}
              onClick={() => console.log('🔥 Botão submit clicado, form válido:', form.isValid, 'errors:', form.errors)}
            >
              {form.isSubmitting ? 'Salvando...' : client ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 