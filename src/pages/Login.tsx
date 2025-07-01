import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useForm } from '@/hooks'
import type { LoginCredentials } from '@/types'

export function Login() {
  const { isAuthenticated, login, error, clearError, isLoading } = useAuthContext()
  const [showPassword, setShowPassword] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setError,
    clearError: clearFormError
  } = useForm<LoginCredentials>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false
    },
    validate: (values) => {
      const errors: Partial<Record<keyof LoginCredentials, string>> = {}
      
      if (!values.email) {
        errors.email = 'Email é obrigatório'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Email inválido'
      }
      
      if (!values.password) {
        errors.password = 'Senha é obrigatória'
      } else if (values.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres'
      }
      
      return errors
    }
  })

  // Limpar erros quando o componente montar
  useEffect(() => {
    clearError()
    // clearFormError não precisa de parâmetros, mas vamos usar clearErrors
  }, [clearError])

  // Redirecionar se já autenticado (DEPOIS de todos os hooks)
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos
    const emailError = !values.email ? 'Email é obrigatório' : 
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ? 'Email inválido' : null
    const passwordError = !values.password ? 'Senha é obrigatória' : 
                          values.password.length < 6 ? 'Senha deve ter pelo menos 6 caracteres' : null

    if (emailError) setError('email', emailError)
    if (passwordError) setError('password', passwordError)

    if (emailError || passwordError) return

    try {
      await login(values)
    } catch (error) {
      // Erro já tratado no hook useAuth
    }
  }

  const fillDemoCredentials = (role: 'admin' | 'supervisor' | 'operador') => {
    const credentials = {
      admin: { email: 'admin@tlczero.com.br', password: 'admin123' },
      supervisor: { email: 'supervisor@tlczero.com.br', password: 'super123' },
      operador: { email: 'operador@tlczero.com.br', password: 'oper123' }
    }

    const { email, password } = credentials[role]
    
    // Simular digitação
    const emailInput = document.getElementById('email') as HTMLInputElement
    const passwordInput = document.getElementById('password') as HTMLInputElement
    
    if (emailInput && passwordInput) {
      emailInput.value = email
      passwordInput.value = password
      
      // Disparar eventos para atualizar o estado do formulário
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">TLC</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TLC Zero</h1>
          <p className="text-gray-600">Sistema de Controle de Pragas</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Entrar no Sistema
          </h2>

          {/* Credenciais Demo */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showCredentials ? 'Ocultar' : 'Ver'} credenciais de demonstração
            </button>
            
            {showCredentials && (
              <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Credenciais Demo:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Admin:</span>
                    <button
                      onClick={() => fillDemoCredentials('admin')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      admin@tlczero.com.br / admin123
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Supervisor:</span>
                    <button
                      onClick={() => fillDemoCredentials('supervisor')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      supervisor@tlczero.com.br / super123
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Operador:</span>
                    <button
                      onClick={() => fillDemoCredentials('operador')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      operador@tlczero.com.br / oper123
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  errors.email && touched.email
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="seu@email.com"
              />
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.password && touched.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Lembrar-me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={values.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Lembrar de mim por 7 dias
              </label>
            </div>

            {/* Erro de autenticação */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </div>
              )}
            </button>
          </form>

          {/* Informações Adicionais */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                Sistema desenvolvido para controle de pragas
              </p>
              <div className="flex items-center justify-center text-xs text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ambiente seguro e protegido
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2024 TLC Zero. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
} 