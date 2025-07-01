import { useForm } from '@/hooks'
import { validateEmail, validateCNPJ, validatePhone } from '@/lib/validations'
import type { Client } from '@/types'
import { X } from 'lucide-react'

interface ClientFormProps {
  client?: Client
  onSubmit: (data: Partial<Client>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface ClientFormData {
  name: string
  email: string
  phone: string
  cnpj: string
  address: string
  contactPerson: string
  active: boolean
}

export function ClientForm({ client, onSubmit, onCancel, isLoading = false }: ClientFormProps) {
  const initialValues: ClientFormData = {
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    cnpj: client?.cnpj || '',
    address: client?.address || '',
    contactPerson: client?.contactPerson || '',
    active: client?.active ?? true,
  }

  const validate = (values: ClientFormData) => {
    const errors: Partial<Record<keyof ClientFormData, string>> = {}

    if (!values.name.trim()) {
      errors.name = 'Nome é obrigatório'
    } else if (values.name.length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!values.email.trim()) {
      errors.email = 'Email é obrigatório'
    } else if (!validateEmail(values.email)) {
      errors.email = 'Email inválido'
    }

    if (!values.phone.trim()) {
      errors.phone = 'Telefone é obrigatório'
    } else if (!validatePhone(values.phone)) {
      errors.phone = 'Telefone inválido'
    }

    if (!values.cnpj.trim()) {
      errors.cnpj = 'CNPJ é obrigatório'
    } else if (!validateCNPJ(values.cnpj)) {
      errors.cnpj = 'CNPJ inválido'
    }

    if (!values.address.trim()) {
      errors.address = 'Endereço é obrigatório'
    }

    if (!values.contactPerson.trim()) {
      errors.contactPerson = 'Pessoa de contato é obrigatória'
    }

    return errors
  }

  const handleSubmit = async (values: ClientFormData) => {
    await onSubmit(values)
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
          <h2 className="text-xl font-semibold">
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
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Empresa *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.values.name}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                form.errors.name && form.touched.name
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="Digite o nome da empresa"
              disabled={isLoading}
            />
            {form.errors.name && form.touched.name && (
              <p className="mt-1 text-sm text-red-600">{form.errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.values.email}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                form.errors.email && form.touched.email
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="empresa@exemplo.com"
              disabled={isLoading}
            />
            {form.errors.email && form.touched.email && (
              <p className="mt-1 text-sm text-red-600">{form.errors.email}</p>
            )}
          </div>

          {/* Telefone e CNPJ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
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

            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ *
              </label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={form.values.cnpj}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  form.errors.cnpj && form.touched.cnpj
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="00.000.000/0000-00"
                disabled={isLoading}
              />
              {form.errors.cnpj && form.touched.cnpj && (
                <p className="mt-1 text-sm text-red-600">{form.errors.cnpj}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Endereço *
            </label>
            <textarea
              id="address"
              name="address"
              value={form.values.address}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                form.errors.address && form.touched.address
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="Digite o endereço completo"
              disabled={isLoading}
            />
            {form.errors.address && form.touched.address && (
              <p className="mt-1 text-sm text-red-600">{form.errors.address}</p>
            )}
          </div>

          {/* Pessoa de Contato */}
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
              Pessoa de Contato *
            </label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={form.values.contactPerson}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                form.errors.contactPerson && form.touched.contactPerson
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="Nome da pessoa responsável"
              disabled={isLoading}
            />
            {form.errors.contactPerson && form.touched.contactPerson && (
              <p className="mt-1 text-sm text-red-600">{form.errors.contactPerson}</p>
            )}
          </div>

          {/* Status Ativo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={form.values.active}
              onChange={form.handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
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
              disabled={isLoading || !form.isValid}
            >
              {isLoading ? 'Salvando...' : client ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 