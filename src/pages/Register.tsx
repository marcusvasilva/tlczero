import React, { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useForm } from '@/hooks'

interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'admin' | 'supervisor' | 'operador'
  phone?: string
  acceptTerms: boolean
}

export function Register() {
  const { isAuthenticated, register, error, clearError, isLoading } = useAuthContext()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setError
  } = useForm<RegisterData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'operador',
      phone: '',
      acceptTerms: false
    },
    validate: (values) => {
      const errors: Partial<Record<keyof RegisterData, string>> = {}
      
      if (!values.name) {
        errors.name = 'Nome é obrigatório'
      } else if (values.name.length < 2) {
        errors.name = 'Nome deve ter pelo menos 2 caracteres'
      }
      
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
      
      if (!values.confirmPassword) {
        errors.confirmPassword = 'Confirmação de senha é obrigatória'
      } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = 'Senhas não coincidem'
      }
      

      
      if (values.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(values.phone)) {
        errors.phone = 'Telefone deve estar no formato (00) 00000-0000'
      }
      
      if (!values.acceptTerms) {
        errors.acceptTerms = 'Você deve aceitar os termos de uso'
      }
      
      return errors
    }
  })

  // Limpar erros quando o componente montar
  useEffect(() => {
    clearError()
  }, [clearError])

  // Redirecionar se já autenticado
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos obrigatórios
    const nameError = !values.name ? 'Nome é obrigatório' : 
                     values.name.length < 2 ? 'Nome deve ter pelo menos 2 caracteres' : null
    const emailError = !values.email ? 'Email é obrigatório' : 
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ? 'Email inválido' : null
    const passwordError = !values.password ? 'Senha é obrigatória' : 
                          values.password.length < 6 ? 'Senha deve ter pelo menos 6 caracteres' : null
    const confirmPasswordError = !values.confirmPassword ? 'Confirmação de senha é obrigatória' : 
                                values.password !== values.confirmPassword ? 'Senhas não coincidem' : null
    const termsError = !values.acceptTerms ? 'Você deve aceitar os termos de uso' : null

    if (nameError) setError('name', nameError)
    if (emailError) setError('email', emailError)
    if (passwordError) setError('password', passwordError)
    if (confirmPasswordError) setError('confirmPassword', confirmPasswordError)
    if (termsError) setError('acceptTerms', termsError)

    if (nameError || emailError || passwordError || confirmPasswordError || termsError) return

    try {
      // Mapear role do formulário para o formato do banco
      let mappedRole: 'admin' | 'supervisor' | 'operator' = 'operator'
      if (values.role === 'admin') mappedRole = 'admin'
      else if (values.role === 'supervisor') mappedRole = 'supervisor'
      else if (values.role === 'operador') mappedRole = 'operator'

      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        role: mappedRole,
        phone: values.phone || undefined
      })
      setRegistrationSuccess(true)
    } catch (error: any) {
      // Mostrar erro específico na interface
      console.error('Erro no registro:', error)
      
      let errorMessage = 'Erro desconhecido ao criar conta'
      
      if (error.message) {
        if (error.message.includes('trigger automático')) {
          errorMessage = 'Erro interno do sistema. Tente novamente em alguns instantes.'
        } else if (error.message.includes('already registered')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique o formato do email.'
        } else if (error.message.includes('recursion detected')) {
          errorMessage = 'Erro de configuração do sistema. Contate o suporte técnico.'
        } else {
          errorMessage = error.message
        }
      }
      
      // Se não conseguir definir um erro específico, mantém a mensagem original
      if (errorMessage === 'Erro desconhecido ao criar conta' && error.message) {
        errorMessage = error.message
      }
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    handleChange({ target: { name: 'phone', value: formatted } } as React.ChangeEvent<HTMLInputElement>)
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Conta Criada!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sua conta foi criada com sucesso. Você pode fazer login agora.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 touch-target">
            <span className="text-2xl font-bold text-white">TLC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Criar Conta</h1>
          <p className="text-gray-600 dark:text-gray-400">Sistema de Controle de Pragas</p>
        </div>

        {/* Card de Registro */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Registrar Nova Conta
          </h2>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome Completo *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 ${
                  errors.name && touched.name
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                placeholder="Seu nome completo"
              />
              {errors.name && touched.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 ${
                  errors.email && touched.email
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.password && touched.password
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.confirmPassword && touched.confirmPassword
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                  placeholder="Confirme sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Tipo de Usuário */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Usuário *
              </label>
              <select
                id="role"
                name="role"
                value={values.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 dark:text-white dark:bg-gray-700"
              >
                <option value="operador">Operador</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {/* Telefone (opcional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={handlePhoneChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 ${
                  errors.phone && touched.phone
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                placeholder="(00) 00000-0000"
              />
              {errors.phone && touched.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>



            {/* Aceitar Termos */}
            <div className="flex items-start">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={values.acceptTerms}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded mt-1"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Eu aceito os <Link to="/terms" className="text-green-600 hover:text-green-700 underline">termos de uso</Link> e <Link to="/privacy" className="text-green-600 hover:text-green-700 underline">política de privacidade</Link> *
              </label>
            </div>
            {errors.acceptTerms && touched.acceptTerms && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.acceptTerms}
              </p>
            )}

            {/* Erro de registro */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                </div>
              </div>
            )}

            {/* Botão de Registro */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando conta...
                </div>
              ) : (
                <div className="flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Conta
                </div>
              )}
            </button>
          </form>

          {/* Link para Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 underline font-medium">
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 