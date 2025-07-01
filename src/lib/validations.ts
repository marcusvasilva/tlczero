import { z } from 'zod'
import { WEIGHT_LIMITS, PHOTO_CONFIG } from './constants'

// Validações para Cliente
export const clientSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .optional()
    .or(z.literal('')),
  address: z.string()
    .optional()
    .or(z.literal('')),
  cnpj: z.string()
    .optional()
    .or(z.literal('')),
  contactPerson: z.string()
    .optional()
    .or(z.literal(''))
})

// Validações para Espaço
export const spaceSchema = z.object({
  clientId: z.string()
    .min(1, 'Cliente é obrigatório'),
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .optional()
    .or(z.literal('')),
  location: z.string()
    .optional()
    .or(z.literal('')),
  attractiveType: z.enum(['moscas', 'outros']),
  installationDate: z.date({
    required_error: 'Data de instalação é obrigatória'
  })
})

// Validações para Coleta
export const collectionSchema = z.object({
  spaceId: z.string()
    .min(1, 'Espaço é obrigatório'),
  operatorId: z.string()
    .min(1, 'Operador é obrigatório'),
  weight: z.number()
    .min(WEIGHT_LIMITS.min, `Peso mínimo é ${WEIGHT_LIMITS.min}kg`)
    .max(WEIGHT_LIMITS.max, `Peso máximo é ${WEIGHT_LIMITS.max}kg`),
  photoUrl: z.string()
    .url('URL da foto inválida')
    .optional()
    .or(z.literal('')),
  observations: z.string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  collectedAt: z.date({
    required_error: 'Data da coleta é obrigatória'
  }),
  weatherCondition: z.enum(['ensolarado', 'nublado', 'chuvoso', 'ventoso'])
    .optional(),
  temperature: z.number()
    .min(-10, 'Temperatura mínima é -10°C')
    .max(50, 'Temperatura máxima é 50°C')
    .optional()
})

// Validações para Operador
export const operatorSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .optional()
    .or(z.literal('')),
  cpf: z.string()
    .optional()
    .or(z.literal('')),
  role: z.enum(['operador', 'supervisor', 'admin']),
  hireDate: z.date({
    required_error: 'Data de contratação é obrigatória'
  })
})

// Funções de validação customizadas
export const validateWeight = (weight: string): boolean => {
  const num = parseFloat(weight)
  return !isNaN(num) && num >= WEIGHT_LIMITS.min && num <= WEIGHT_LIMITS.max
}

export const validatePhotoSize = (file: File): boolean => {
  return file.size <= PHOTO_CONFIG.maxSize
}

export const validatePhotoType = (file: File): boolean => {
  return PHOTO_CONFIG.allowedTypes.includes(file.type as any)
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false
  
  // Validação dos dígitos verificadores
  let soma = 0
  let peso = 2
  
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cleanCNPJ[i]) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  
  let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  
  if (parseInt(cleanCNPJ[12]) !== digito1) return false
  
  soma = 0
  peso = 2
  
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cleanCNPJ[i]) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  
  let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  
  return parseInt(cleanCNPJ[13]) === digito2
}

export const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false
  
  // Validação do primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleanCPF[i]) * (10 - i)
  }
  let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  
  if (parseInt(cleanCPF[9]) !== digito1) return false
  
  // Validação do segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleanCPF[i]) * (11 - i)
  }
  let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  
  return parseInt(cleanCPF[10]) === digito2
}

export const validatePhone = (phone: string): boolean => {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Aceita telefones com 10 ou 11 dígitos
  return cleanPhone.length === 10 || cleanPhone.length === 11
} 