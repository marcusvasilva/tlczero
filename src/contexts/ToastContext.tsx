import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive'

export interface ToastProps {
  id?: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextType {
  toasts: ToastProps[]
  toast: (props: ToastProps) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback((props: ToastProps) => {
    const id = props.id || `toast-${Date.now()}`
    const newToast = { ...props, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-dismiss toast after duration
    if (props.duration !== 0) {
      setTimeout(() => {
        dismiss(id)
      }, props.duration || 5000)
    }
    
    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  
  if (context === undefined) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  
  return context
} 