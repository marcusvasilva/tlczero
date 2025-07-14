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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit} className="p-6 space-y-4">
          {/* Nome da Empresa */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Empresa *
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={form.values.company_name}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white placeholder-gray-400 ${
                form.errors.company_name && form.touched.company_name
                  ? 'border-red-500'
                  : 'border-gray-300'
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
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">
              Responsável *
            </label>
            <input
              type="text"
              id="contact_person"
              name="contact_person"
              value={form.values.contact_person}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white placeholder-gray-400 ${
                form.errors.contact_person && form.touched.contact_person
                  ? 'border-red-500'
                  : 'border-gray-300'
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
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.values.phone}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white placeholder-gray-400 ${
                form.errors.phone && form.touched.phone
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="(11) 99999-9999"
              disabled={isLoading}
            />
            {form.errors.phone && form.touched.phone && (
              <p className="mt-1 text-sm text-red-600">{form.errors.phone}</p>
            )}
          </div>

          {/* Campos opcionais */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Informações Adicionais (Opcionais)</h3>
            
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.values.email}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="empresa@exemplo.com"
                  disabled={isLoading}
                />
              </div>

              {/* CNPJ */}
              <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-600 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  id="cnpj"
                  name="cnpj"
                  value={form.values.cnpj}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="00.000.000/0000-00"
                  disabled={isLoading}
                />
              </div>

              {/* Endereço */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-600 mb-1">
                  Endereço
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.values.address}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white placeholder-gray-400"
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
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="status" className="ml-2 block text-sm text-gray-700">
              Cliente ativo
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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