import React, { useState } from 'react'
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { useForm } from '@/hooks'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AuthUser } from '@/types/auth'

interface PasswordChangeData {
  newPassword: string
  confirmPassword: string
}

interface PasswordChangeRequiredProps {
  user: AuthUser
  onPasswordChanged: () => void
  onError: (error: string) => void
  isLoading?: boolean
}

export function PasswordChangeRequired({
  user,
  onPasswordChanged,
  onError,
  isLoading = false
}: PasswordChangeRequiredProps) {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setError
  } = useForm<PasswordChangeData>({
    initialValues: {
      newPassword: '',
      confirmPassword: ''
    },
    validate: (values) => {
      const errors: Partial<Record<keyof PasswordChangeData, string>> = {}

      if (!values.newPassword) {
        errors.newPassword = 'Nova senha é obrigatória'
      } else if (values.newPassword.length < 6) {
        errors.newPassword = 'Senha deve ter pelo menos 6 caracteres'
      }

      if (!values.confirmPassword) {
        errors.confirmPassword = 'Confirmação de senha é obrigatória'
      } else if (values.newPassword !== values.confirmPassword) {
        errors.confirmPassword = 'Senhas não coincidem'
      }

      return errors
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newPasswordError = !values.newPassword ? 'Nova senha é obrigatória' :
                             values.newPassword.length < 6 ? 'Senha deve ter pelo menos 6 caracteres' : null
    const confirmPasswordError = !values.confirmPassword ? 'Confirmação de senha é obrigatória' :
                                 values.newPassword !== values.confirmPassword ? 'Senhas não coincidem' : null

    if (newPasswordError) setError('newPassword', newPasswordError)
    if (confirmPasswordError) setError('confirmPassword', confirmPasswordError)

    if (newPasswordError || confirmPasswordError) return

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword
      })

      if (updateError) {
        throw updateError
      }

      onPasswordChanged()
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      onError(error instanceof Error ? error.message : 'Erro ao alterar senha')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Primeira Configuração de Senha
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Olá, <strong>{user.name}</strong>! Para sua segurança, é necessário alterar sua senha temporária.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nova Senha */}
          <div>
            <Label htmlFor="newPassword">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={values.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`pr-10 ${errors.newPassword && touched.newPassword ? 'border-red-500' : ''}`}
                placeholder="Digite sua nova senha"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && touched.newPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirme sua nova senha"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Botão de Submissão */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Alterando senha...
                </div>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
