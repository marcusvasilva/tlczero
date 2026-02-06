import { X, Users, Shield } from 'lucide-react'

interface UserTypeSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: 'operator' | 'supervisor') => void
}

export default function UserTypeSelectionModal({
  isOpen,
  onClose,
  onSelect,
}: UserTypeSelectionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Novo Usuário
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cards */}
          <div className="p-5 grid grid-cols-2 gap-4">
            <button
              onClick={() => onSelect('operator')}
              className="flex flex-col items-center gap-3 p-5 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                <Users className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Operador</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cadastro básico, sem acesso ao sistema.
                </p>
              </div>
            </button>

            <button
              onClick={() => onSelect('supervisor')}
              className="flex flex-col items-center gap-3 p-5 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <Shield className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Supervisor</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Acesso completo ao sistema com email e senha.
                </p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-5 pb-5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
