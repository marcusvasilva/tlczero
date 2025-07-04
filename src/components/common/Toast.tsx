import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import type { ToastProps } from '@/contexts/ToastContext'

export function Toast({ id, title, description, variant = 'default', duration }: ToastProps) {
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    destructive: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  const variantIconColor = {
    default: 'text-gray-500 dark:text-gray-400',
    success: 'text-green-500 dark:text-green-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    destructive: 'text-red-500 dark:text-red-400'
  }

  const VariantIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className={`h-5 w-5 ${variantIconColor[variant]}`} />
      case 'warning':
        return <AlertTriangle className={`h-5 w-5 ${variantIconColor[variant]}`} />
      case 'destructive':
        return <AlertCircle className={`h-5 w-5 ${variantIconColor[variant]}`} />
      default:
        return <Info className={`h-5 w-5 ${variantIconColor[variant]}`} />
    }
  }

  const { dismiss } = useToast()

  useEffect(() => {
    if (duration !== 0) {
      const timer = setTimeout(() => {
        dismiss(id!)
      }, duration || 5000)
      
      return () => clearTimeout(timer)
    }
  }, [id, duration, dismiss])

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-md ${variantClasses[variant]}`}
      role="alert"
    >
      <div className="flex-shrink-0">
        <VariantIcon />
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {description}
          </div>
        )}
      </div>
      
      <button
        onClick={() => dismiss(id!)}
        className="flex-shrink-0 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Fechar"
      >
        <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
} 