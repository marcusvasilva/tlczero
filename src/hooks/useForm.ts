import { useState, useCallback } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'

export interface UseFormOptions<T> {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit?: (values: T) => void | Promise<void>
}

export interface UseFormReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  setFieldValue: (field: keyof T, value: any) => void
  setError: (field: keyof T, error: string) => void
  clearError: (field?: keyof T) => void
  clearErrors: () => void
  reset: () => void
  isDirty: boolean
  isValid: boolean
}

/**
 * Hook para gerenciar formulários com validação
 */
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(options.initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = useCallback(() => {
    if (options.validate) {
      const validationErrors = options.validate(values)
      setErrors(validationErrors)
      return Object.keys(validationErrors).length === 0
    }
    return true
  }, [values, options.validate])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    
    setValues(prev => ({ ...prev, [name]: fieldValue }))
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name as keyof T]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])

  const handleBlur = useCallback((e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    validate()
  }, [validate])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setIsSubmitting(true)
    
    // Marcar todos os campos como touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true
      return acc
    }, {} as Partial<Record<keyof T, boolean>>)
    setTouched(allTouched)

    const isValid = validate()
    
    if (isValid && options.onSubmit) {
      try {
        await options.onSubmit(values)
      } catch (error) {
        console.error('Erro no envio do formulário:', error)
      }
    }
    
    setIsSubmitting(false)
  }, [values, validate, options.onSubmit])

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const clearError = useCallback((field?: keyof T) => {
    if (field) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    } else {
      setErrors({})
    }
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const reset = useCallback(() => {
    setValues(options.initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [options.initialValues])

  const isDirty = JSON.stringify(values) !== JSON.stringify(options.initialValues)
  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setError,
    clearError,
    clearErrors,
    reset,
    isDirty,
    isValid
  }
}

/**
 * Hook para validação de campo específico
 */
export function useFieldValidation<T>(
  value: T,
  validators: Array<(value: T) => string | null>
) {
  const [error, setError] = useState<string | null>(null)

  const validate = useCallback(() => {
    for (const validator of validators) {
      const errorMessage = validator(value)
      if (errorMessage) {
        setError(errorMessage)
        return false
      }
    }
    setError(null)
    return true
  }, [value, validators])

  return {
    error,
    isValid: error === null,
    validate,
  }
} 