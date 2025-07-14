import React, { useState } from 'react'
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { useForm } from '@/hooks'
import { supabase } from '@/lib/supabase'
import { Button } from '../../../@/components/ui/button'
import { Input } from '../../../@/components/ui/input'
import { Label } from '../../../@/components/ui/label'
import type { AuthUser } from '@/types/auth'

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface PasswordChangeRequiredProps {
  user: AuthUser
  onPasswordChanged: () => void
  onError: (error: string) => void
  isLoading?: boolean
}

interface PasswordStrength {
  score: number
  label: string
  color: string
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

const validatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
  
  const score = Object.values(requirements).filter(Boolean).length
  
  let label = 'Muito fraca'
  let color = 'text-red-600'
  
  if (score >= 5) {
    label = 'Muito forte'
    color = 'text-green-600'
  } else if (score >= 4) {
    label = 'Forte'
    color = 'text-green-500'
  } else if (score >= 3) {
    label = 'Média'
    color = 'text-yellow-500'
  } else if (score >= 2) {
    label = 'Fraca'
    color = 'text-orange-500'
  }
  
  return { score, label, color, requirements }
}

export function PasswordChangeRequired({ 
  user, 
  onPasswordChanged, 
  onError, 
  isLoading = false 
}: PasswordChangeRequiredProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setError
  } = useForm<PasswordChangeData>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validate: (values) => {
      const errors: Partial<Record<keyof PasswordChangeData, string>> = {}
      
      if (!values.currentPassword) {
        errors.currentPassword = 'Senha atual é obrigatória'
      }
      
      if (!values.newPassword) {
        errors.newPassword = 'Nova senha é obrigatória'
      } else {
        const strength = validatePasswordStrength(values.newPassword)
        if (strength.score < 4) {
          errors.newPassword = 'Senha deve ser forte (pelo menos 4 dos 5 critérios)'
        }
      }
      
      if (!values.confirmPassword) {
        errors.confirmPassword = 'Confirmação de senha é obrigatória'
      } else if (values.newPassword !== values.confirmPassword) {
        errors.confirmPassword = 'Senhas não coincidem'
      }
      
      return errors
    }
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e)
    if (e.target.name === 'newPassword') {
      setPasswordStrength(validatePasswordStrength(e.target.value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos
    const currentPasswordError = !values.currentPassword ? 'Senha atual é obrigatória' : null
    const newPasswordError = !values.newPassword ? 'Nova senha é obrigatória' : 
                             validatePasswordStrength(values.newPassword).score < 4 ? 'Senha deve ser forte' : null
    const confirmPasswordError = !values.confirmPassword ? 'Confirmação de senha é obrigatória' : 
                                 values.newPassword !== values.confirmPassword ? 'Senhas não coincidem' : null

    if (currentPasswordError) setError('currentPassword', currentPasswordError)
    if (newPasswordError) setError('newPassword', newPasswordError)
    if (confirmPasswordError) setError('confirmPassword', confirmPasswordError)

    if (currentPasswordError || newPasswordError || confirmPasswordError) return

    try {
      // Primeiro, verificar se a senha atual está correta fazendo login
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.currentPassword,
      })

      if (verifyError) {
        if (verifyError.message.includes('Invalid login credentials')) {
          setError('currentPassword', 'Senha atual incorreta')
          return
        }
        throw verifyError
      }

      // Alterar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword
      })

      if (updateError) {
        throw updateError
      }

      // Chamar callback de sucesso
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
          {/* Senha Atual */}
          <div>
            <Label htmlFor="currentPassword">Senha Atual *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={values.currentPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`pr-10 ${errors.currentPassword && touched.currentPassword ? 'border-red-500' : ''}`}
                placeholder="Digite sua senha atual"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && touched.currentPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* Nova Senha */}
          <div>
            <Label htmlFor="newPassword">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={values.newPassword}
                onChange={handlePasswordChange}
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
            
            {/* Indicador de força da senha */}
            {passwordStrength && values.newPassword && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Força da senha:</span>
                  <span className={`text-sm font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score >= 5 ? 'bg-green-500' :
                      passwordStrength.score >= 4 ? 'bg-green-400' :
                      passwordStrength.score >= 3 ? 'bg-yellow-400' :
                      passwordStrength.score >= 2 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center">
                    {passwordStrength.requirements.length ? 
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                      <div className="w-3 h-3 border border-gray-300 rounded-full mr-1" />
                    }
                    <span>Pelo menos 8 caracteres</span>
                  </div>
                  <div className="flex items-center">
                    {passwordStrength.requirements.uppercase ? 
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                      <div className="w-3 h-3 border border-gray-300 rounded-full mr-1" />
                    }
                    <span>Letra maiúscula</span>
                  </div>
                  <div className="flex items-center">
                    {passwordStrength.requirements.lowercase ? 
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                      <div className="w-3 h-3 border border-gray-300 rounded-full mr-1" />
                    }
                    <span>Letra minúscula</span>
                  </div>
                  <div className="flex items-center">
                    {passwordStrength.requirements.number ? 
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                      <div className="w-3 h-3 border border-gray-300 rounded-full mr-1" />
                    }
                    <span>Número</span>
                  </div>
                  <div className="flex items-center">
                    {passwordStrength.requirements.special ? 
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1" /> : 
                      <div className="w-3 h-3 border border-gray-300 rounded-full mr-1" />
                    }
                    <span>Caractere especial</span>
                  </div>
                </div>
              </div>
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

        {/* Aviso de Segurança */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Dicas de Segurança:</p>
              <ul className="text-xs space-y-1">
                <li>• Use uma senha única que você não usa em outros locais</li>
                <li>• Não compartilhe sua senha com outras pessoas</li>
                <li>• Mantenha sua senha segura e memorizada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 