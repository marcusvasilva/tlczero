import React from 'react'
import { useAsyncOperation, useLoading } from '@/contexts/LoadingContext'
import { InlineLoading, Spinner } from './GlobalLoading'

export const LoadingExample: React.FC = () => {
  const { isLoading } = useLoading()
  const executeWithLoading = useAsyncOperation('test-operation')

  const simulateLoading = async () => {
    await executeWithLoading(
      async () => {
        // Simular operação que demora 3 segundos
        await new Promise(resolve => setTimeout(resolve, 3000))
        return 'Operação concluída!'
      },
      'Simulando operação...'
    )
  }

  const simulateQuickLoading = async () => {
    await executeWithLoading(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return 'Rápido!'
      },
      'Operação rápida...'
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Teste do Sistema de Loading
      </h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loading Global
          </h3>
          <div className="space-x-2">
            <button
              onClick={simulateLoading}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Testar Loading Longo (3s)
            </button>
            <button
              onClick={simulateQuickLoading}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Testar Loading Rápido (1s)
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loading Inline
          </h3>
          <div className="space-y-2">
            <InlineLoading isLoading={true} message="Carregando dados..." size="sm" />
            <InlineLoading isLoading={true} message="Processando..." size="md" />
            <InlineLoading isLoading={true} message="Salvando alterações..." size="lg" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Spinners
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Spinner size="sm" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Pequeno</span>
            </div>
            <div className="flex items-center space-x-2">
              <Spinner size="md" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Médio</span>
            </div>
            <div className="flex items-center space-x-2">
              <Spinner size="lg" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Grande</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status Atual
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Loading ativo: {isLoading ? 'Sim' : 'Não'}
          </p>
        </div>
      </div>
    </div>
  )
} 