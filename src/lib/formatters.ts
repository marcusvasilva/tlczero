import { format, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BRAZIL_TIMEZONE } from './utils'

// Formatação de datas com fuso horário do Brasil
export const formatBrazilDateTime = (dateObj: Date): string => {
  if (!dateObj || !isValid(dateObj)) return ''
  
  try {
    // Converter para horário do Brasil
    const brazilDate = new Date(dateObj.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
    return format(brazilDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return ''
  }
}

export const formatBrazilDate = (dateObj: Date): string => {
  if (!dateObj || !isValid(dateObj)) return ''
  
  try {
    // Converter para horário do Brasil
    const brazilDate = new Date(dateObj.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
    return format(brazilDate, 'dd/MM/yyyy', { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return ''
  }
}

export const formatBrazilTime = (dateObj: Date): string => {
  if (!dateObj || !isValid(dateObj)) return ''
  
  try {
    // Converter para horário do Brasil
    const brazilDate = new Date(dateObj.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
    return format(brazilDate, 'HH:mm', { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar horário:', error)
    return ''
  }
}

// Formatação de strings com limites
export const formatStringWithLimit = (str: string, limit: number): string => {
  if (!str) return ''
  return str.length > limit ? str.substring(0, limit) + '...' : str
}

// Formatação de telefone brasileiro
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return ''
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos (celular) ou 10 dígitos (fixo)
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

// Formatação de CEP
export const formatCEP = (cep: string): string => {
  if (!cep) return ''
  
  const cleanCEP = cep.replace(/\D/g, '')
  
  if (cleanCEP.length === 8) {
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2')
  }
  
  return cep
}

// Formatação de CNPJ
export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return ''
  
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  if (cleanCNPJ.length === 14) {
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  
  return cnpj
}

// Formatação de CPF
export const formatCPF = (cpf: string): string => {
  if (!cpf) return ''
  
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length === 11) {
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  
  return cpf
}

// Formatação de status
export const formatStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'rejected': 'Rejeitado',
    'completed': 'Concluído',
    'cancelled': 'Cancelado'
  }
  
  return statusMap[status.toLowerCase()] || status
}

// Formatação de números com separador de milhares
export const formatNumber = (num: number): string => {
  if (typeof num !== 'number') return '0'
  
  return num.toLocaleString('pt-BR')
}

// Formatação de porcentagem
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (typeof value !== 'number') return '0%'
  
  return `${value.toFixed(decimals)}%`
}

// Formatação de texto para URL (slug)
export const formatSlug = (text: string): string => {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, '') // Remove hífens no início e fim
}

// Formatação de iniciais do nome
export const formatInitials = (name: string): string => {
  if (!name) return ''
  
  const words = name.trim().split(' ')
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  const first = words[0].charAt(0).toUpperCase()
  const last = words[words.length - 1].charAt(0).toUpperCase()
  
  return first + last
}

// Formatação de texto para capitalização
export const formatCapitalize = (text: string): string => {
  if (!text) return ''
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Formatação de texto para título
export const formatTitle = (text: string): string => {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Aliases para compatibilidade com código existente
export const formatPhone = formatPhoneNumber
export { formatDate, formatWeight } from './utils' 