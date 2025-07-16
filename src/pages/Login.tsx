import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useForm } from '@/hooks'
import { Logo } from '@/components/common/Logo'
import type { LoginCredentials } from '@/types/auth'

export function Login() {
  const { isAuthenticated, login, error, clearError, isLoading } = useAuthContext()
  const [showPassword, setShowPassword] = useState(false)

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setError
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-20 h-20 mx-auto mb-4 touch-target">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="mobile-header text-gray-900 dark:text-white mb-2">TLC Zero</h1>
          <p className="mobile-text text-gray-600 dark:text-gray-400">Sistema de Controle de Pragas</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl mobile-card border border-gray-200 dark:border-gray-700">
          <h2 className="mobile-subheader text-gray-900 dark:text-white mb-6 text-center">
            Entrar no Sistema
          </h2>



          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                  errors.email && touched.email
                    ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                placeholder="seu@email.com"
              />
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.password && touched.password
                      ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
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
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Lembrar de mim por 7 dias
              </label>
            </div>

            {/* Erro de autenticação */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
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

          {/* Informação sobre credenciais */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Credenciais fornecidas pelo administrador do sistema
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Entre em contato com o suporte se não possui acesso
            </p>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Sistema desenvolvido para controle de pragas
              </p>
              <div className="flex items-center justify-center text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ambiente seguro e protegido
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 TLC Zero. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
} 