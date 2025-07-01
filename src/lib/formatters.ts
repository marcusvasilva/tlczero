import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Formatação de peso
export const formatWeight = (weight: number): string => {
  return `${weight.toFixed(2)} kg`
}

// Formatação de datas
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) return 'Data inválida'
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR })
}

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) return 'Data inválida'
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) return ''
  return format(dateObj, 'yyyy-MM-dd')
}

// Formatação de telefone
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

// Formatação de CNPJ
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '')
  
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  
  return cnpj
}

// Formatação de CPF
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  
  return cpf
}

// Formatação de moeda (Real brasileiro)
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Formatação de porcentagem
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`
}

// Formatação de temperatura
export const formatTemperature = (temp: number): string => {
  return `${temp}°C`
}

// Geração de QR Code ID
export const generateQRCode = (spaceId: string, spaceName: string): string => {
  const cleaned = spaceName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const shortName = cleaned.substring(0, 8)
  return `TLC-${spaceId.padStart(3, '0')}-${shortName}`
}

// Formatação de nome para exibição
export const formatDisplayName = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Formatação de texto truncado
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Formatação de arquivo para nome de download
export const formatFilename = (prefix: string, extension = 'pdf'): string => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
  return `${prefix}_${timestamp}.${extension}`
}

// Formatação de status para badge
export const formatStatus = (active: boolean): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
  return active 
    ? { label: 'Ativo', variant: 'default' }
    : { label: 'Inativo', variant: 'secondary' }
}

// Formatação de trend para dashboard
export const formatTrend = (value: number): { label: string; color: string; icon: string } => {
  if (value > 0) {
    return { label: `+${formatPercentage(value)}`, color: 'text-green-600', icon: '↗️' }
  } else if (value < 0) {
    return { label: formatPercentage(Math.abs(value)), color: 'text-red-600', icon: '↘️' }
  } else {
    return { label: '0%', color: 'text-gray-600', icon: '➡️' }
  }
} 