import QRCode from 'qrcode'
import { QR_CODE_CONFIG } from './constants'

// Geração de ID único baseado em timestamp
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Geração de ID numérico sequencial
export const generateNumericId = (prefix = '', length = 6): string => {
  const timestamp = Date.now().toString()
  const randomPart = Math.random().toString().substr(2, length - timestamp.length)
  const numericId = (timestamp + randomPart).substr(0, length)
  return prefix ? `${prefix}${numericId}` : numericId
}

// Geração de código QR para espaços
export const generateSpaceQRCode = (spaceId: string, spaceName: string): string => {
  const cleaned = spaceName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const shortName = cleaned.substring(0, 8) || 'SPACE'
  const paddedId = spaceId.toString().padStart(3, '0')
  return `TLC-${paddedId}-${shortName}`
}

// Geração de URL para coleta via QR code
export const generateCollectionUrl = (spaceId: string): string => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://tlczero.app' // URL de produção
  return `${baseUrl}/collect/${spaceId}`
}

// Geração de QR code como Data URL (base64)
export const generateQRCodeDataURL = async (
  text: string,
  options?: {
    size?: number
    margin?: number
    color?: { dark: string; light: string }
  }
): Promise<string> => {
  try {
    const qrOptions = {
      width: options?.size || QR_CODE_CONFIG.size,
      margin: options?.margin || QR_CODE_CONFIG.margin,
      color: {
        dark: options?.color?.dark || QR_CODE_CONFIG.color.dark,
        light: options?.color?.light || QR_CODE_CONFIG.color.light
      }
    }
    
    return await QRCode.toDataURL(text, qrOptions)
  } catch (error) {
    console.error('Erro ao gerar QR code:', error)
    throw new Error('Falha na geração do QR code')
  }
}

// Geração de QR code como SVG string
export const generateQRCodeSVG = async (
  text: string,
  options?: {
    size?: number
    margin?: number
    color?: { dark: string; light: string }
  }
): Promise<string> => {
  try {
    const qrOptions = {
      width: options?.size || QR_CODE_CONFIG.size,
      margin: options?.margin || QR_CODE_CONFIG.margin,
      color: {
        dark: options?.color?.dark || QR_CODE_CONFIG.color.dark,
        light: options?.color?.light || QR_CODE_CONFIG.color.light
      }
    }
    
    return await QRCode.toString(text, { ...qrOptions, type: 'svg' })
  } catch (error) {
    console.error('Erro ao gerar QR code SVG:', error)
    throw new Error('Falha na geração do QR code SVG')
  }
}

// Geração de código de referência para coletas
export const generateCollectionReference = (
  spaceId: string,
  operatorId: string,
  date: Date = new Date()
): string => {
  const year = date.getFullYear().toString().substr(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const spaceCode = spaceId.toString().padStart(3, '0')
  const operatorCode = operatorId.toString().padStart(2, '0')
  
  return `COL${year}${month}${day}-${spaceCode}-${operatorCode}`
}

// Geração de nome de arquivo único
export const generateUniqueFilename = (
  prefix: string,
  extension: string,
  includeTimestamp = true
): string => {
  const timestamp = includeTimestamp 
    ? new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
      new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]
    : ''
  
  const randomSuffix = Math.random().toString(36).substr(2, 6)
  
  return `${prefix}${timestamp ? '_' + timestamp : ''}_${randomSuffix}.${extension}`
}

// Geração de código de operador
export const generateOperatorCode = (name: string, hireDate: Date): string => {
  const nameInitials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substr(0, 3)
  
  const year = hireDate.getFullYear().toString().substr(-2)
  const randomNum = Math.floor(Math.random() * 99).toString().padStart(2, '0')
  
  return `OP${nameInitials}${year}${randomNum}`
}

// Geração de código de cliente
export const generateClientCode = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const shortName = cleaned.substring(0, 6) || 'CLIENT'
  const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0')
  
  return `CLI${shortName}${randomNum}`
}

// Validação de formato de QR code
export const isValidQRCodeFormat = (qrCode: string): boolean => {
  const qrCodePattern = /^TLC-\d{3}-[A-Z0-9]{1,8}$/
  return qrCodePattern.test(qrCode)
}

// Extração de informações do QR code
export const parseQRCode = (qrCode: string): { spaceId: string; spaceName: string } | null => {
  if (!isValidQRCodeFormat(qrCode)) return null
  
  const parts = qrCode.split('-')
  if (parts.length !== 3) return null
  
  return {
    spaceId: parseInt(parts[1]).toString(),
    spaceName: parts[2]
  }
} 