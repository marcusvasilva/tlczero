import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-BR')
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)}g`
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Constante do fuso horário do Brasil
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

// Função para obter a data atual no fuso horário do Brasil
export function getCurrentBrazilDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

// Função para formatar data/hora local para input datetime-local
export function formatBrazilDateTimeLocal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const brazilDate = new Date(d.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
  
  // Formatar para datetime-local (YYYY-MM-DDTHH:mm)
  const year = brazilDate.getFullYear()
  const month = String(brazilDate.getMonth() + 1).padStart(2, '0')
  const day = String(brazilDate.getDate()).padStart(2, '0')
  const hours = String(brazilDate.getHours()).padStart(2, '0')
  const minutes = String(brazilDate.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Função para fazer parse de datetime-local para Date
export function parseBrazilDateTime(dateTimeLocal: string): Date {
  if (!dateTimeLocal) return new Date()
  
  // dateTimeLocal está no formato "YYYY-MM-DDTHH:mm"
  const localDate = new Date(dateTimeLocal)
  
  // Ajustar para o fuso horário do Brasil
  const brazilOffset = -3 * 60 // UTC-3 em minutos
  const localOffset = localDate.getTimezoneOffset()
  const offsetDifference = localOffset - brazilOffset
  
  return new Date(localDate.getTime() + offsetDifference * 60 * 1000)
}

// Função para gerar senha temporária
export function generateTemporaryPassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  return password
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

export function isValidCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '')
  
  if (cleanCpf.length !== 11) return false
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCpf)) return false
  
  // Validar dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf[9])) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf[10])) return false
  
  return true
}

export function isValidCNPJ(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '')
  
  if (cleanCnpj.length !== 14) return false
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCnpj)) return false
  
  // Validar primeiro dígito verificador
  let sum = 0
  let weight = 2
  
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCnpj[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  
  let remainder = sum % 11
  const firstDigit = remainder < 2 ? 0 : 11 - remainder
  
  if (firstDigit !== parseInt(cleanCnpj[12])) return false
  
  // Validar segundo dígito verificador
  sum = 0
  weight = 2
  
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCnpj[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  
  remainder = sum % 11
  const secondDigit = remainder < 2 ? 0 : 11 - remainder
  
  if (secondDigit !== parseInt(cleanCnpj[13])) return false
  
  return true
}

// Função para debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Função para throttle
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// Função para retry com backoff exponencial
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    backoffFactor?: number
    onRetry?: (error: any, attempt: number) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry
  } = options

  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }
      
      if (onRetry) {
        onRetry(error, attempt)
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      )
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Função para verificar se uma string é um UUID válido
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Função para sanitizar entrada de usuário
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

// Função para verificar se o ambiente é desenvolvimento
export function isDev(): boolean {
  return import.meta.env.DEV
}

// Função para log condicional (apenas em desenvolvimento)
export function devLog(...args: any[]): void {
  if (isDev()) {
    console.log(...args)
  }
}

// Função para tratar erros de forma consistente
export function handleError(error: any, context: string): {
  message: string
  details?: any
} {
  devLog(`❌ Erro em ${context}:`, error)
  
  // Erros do Supabase
  if (error?.message) {
    return {
      message: error.message,
      details: error
    }
  }
  
  // Erros de rede
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      details: error
    }
  }
  
  // Erros de timeout
  if (error?.message?.includes('timeout')) {
    return {
      message: 'Operação demorou muito para responder. Tente novamente.',
      details: error
    }
  }
  
  // Erro genérico
  return {
    message: 'Ocorreu um erro inesperado. Tente novamente.',
    details: error
  }
}

// Função para criar um controlador de abort para cancelar requests
export function createAbortController(): {
  controller: AbortController
  signal: AbortSignal
  cleanup: () => void
} {
  const controller = new AbortController()
  
  return {
    controller,
    signal: controller.signal,
    cleanup: () => controller.abort()
  }
}

// Função para detectar problemas comuns e sugerir soluções
export function diagnoseError(error: any): {
  type: 'auth' | 'network' | 'timeout' | 'validation' | 'unknown'
  suggestion: string
} {
  const message = error?.message?.toLowerCase() || ''
  
  // Problemas de autenticação
  if (message.includes('jwt') || message.includes('token') || message.includes('unauthorized')) {
    return {
      type: 'auth',
      suggestion: 'Faça login novamente ou atualize a página'
    }
  }
  
  // Problemas de rede
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      type: 'network',
      suggestion: 'Verifique sua conexão com a internet'
    }
  }
  
  // Problemas de timeout
  if (message.includes('timeout')) {
    return {
      type: 'timeout',
      suggestion: 'A operação demorou muito. Tente novamente.'
    }
  }
  
  // Problemas de validação
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      type: 'validation',
      suggestion: 'Verifique os dados informados'
    }
  }
  
  return {
    type: 'unknown',
    suggestion: 'Tente novamente ou entre em contato com o suporte'
  }
} 