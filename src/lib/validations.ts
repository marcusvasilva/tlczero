import { z } from 'zod'
import { WEIGHT_LIMITS, PHOTO_CONFIG } from './constants'

// Validações para Cliente
export const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),
  zipCode: z.string().min(8, 'CEP deve ter 8 dígitos')
})

// Validações para Espaço
export const spaceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  location: z.string().min(2, 'Localização deve ter pelo menos 2 caracteres'),
  type: z.enum(['moscas', 'baratas', 'formigas', 'outros'], {
    errorMap: () => ({ message: 'Tipo de praga é obrigatório' })
  }),
  installationDate: z.date({
    errorMap: () => ({ message: 'Data de instalação é obrigatória' })
  }),
  lastMaintenanceDate: z.date().optional(),
  observations: z.string().optional()
})

// Validações para Coleta
export const collectionSchema = z.object({
  spaceId: z.string().min(1, 'Espaço é obrigatório'),
  operatorId: z.string().min(1, 'Operador é obrigatório'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  weight: z.number()
    .min(10, 'Peso deve ser maior que 0.01kg')
    .max(50000, 'Peso não pode exceder 50kg'),
  photoUrl: z.string().optional(),
  observations: z.string().optional(),
  collectedAt: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val)
    }
    return val
  })
})

// Validações para Operador
export const operatorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  role: z.enum(['admin', 'supervisor', 'operador'], {
    errorMap: () => ({ message: 'Função é obrigatória' })
  }),
  active: z.boolean().default(true)
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

// Tipos derivados dos schemas
export type ClientFormData = z.infer<typeof clientSchema>
export type SpaceFormData = z.infer<typeof spaceSchema>
export type CollectionFormData = z.infer<typeof collectionSchema>
export type OperatorFormData = z.infer<typeof operatorSchema> 