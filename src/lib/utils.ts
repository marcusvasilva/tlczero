import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gera uma senha temporária segura para novos usuários
 * @param length Tamanho da senha (padrão: 12)
 * @returns Senha temporária gerada
 */
export function generateTemporaryPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%&*'
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Garantir pelo menos um de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Preencher o resto aleatoriamente
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Embaralhar a senha
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Valida se um email tem formato válido
 * @param email Email para validar
 * @returns true se válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}



// Timezone utilities for Brazil/São Paulo
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

/**
 * Retorna a data/hora atual no fuso horário do Brasil
 * @returns Data atual em São Paulo
 */
export function getCurrentBrazilDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
}

/**
 * Formata data/hora para exibição no padrão brasileiro
 * @param date Data para formatar
 * @returns String formatada (DD/MM/YYYY HH:mm)
 */
export function formatBrazilDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', { 
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formata data para input datetime-local no fuso do Brasil
 * @param date Data para formatar
 * @returns String no formato YYYY-MM-DDTHH:MM
 */
export function formatBrazilDateTimeLocal(date: Date): string {
  const brazilDate = new Date(date.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
  const year = brazilDate.getFullYear()
  const month = String(brazilDate.getMonth() + 1).padStart(2, '0')
  const day = String(brazilDate.getDate()).padStart(2, '0')
  const hours = String(brazilDate.getHours()).padStart(2, '0')
  const minutes = String(brazilDate.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Converte string datetime-local para Date no fuso do Brasil
 * @param dateTimeLocalString String no formato YYYY-MM-DDTHH:MM
 * @returns Data convertida para o fuso do Brasil
 */
export function parseBrazilDateTime(dateTimeLocalString: string): Date {
  const localDate = new Date(dateTimeLocalString)
  return new Date(localDate.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }))
} 