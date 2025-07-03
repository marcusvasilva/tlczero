import React from 'react'
import { Loader2 } from 'lucide-react'
import { useLoading } from '@/contexts/LoadingContext'

export const GlobalLoading: React.FC = () => {
  const { isLoading, message } = useLoading()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm mx-4">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
          <div>
            <p className="text-gray-900 dark:text-white font-medium">
              {message || 'Carregando...'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aguarde um momento
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de loading inline (para usar em botões, cards, etc.)
interface InlineLoadingProps {
  isLoading: boolean
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  isLoading,
  message = 'Carregando...',
  size = 'md',
  className = ''
}) => {
  if (!isLoading) return null

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-green-600 animate-spin`} />
      <span className={`text-gray-600 dark:text-gray-300 ${textSizeClasses[size]}`}>
        {message}
      </span>
    </div>
  )
}

// Spinner simples
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <Loader2 
      className={`${sizeClasses[size]} text-green-600 animate-spin ${className}`} 
    />
  )
} 