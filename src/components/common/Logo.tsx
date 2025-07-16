import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface LogoProps {
  className?: string
  alt?: string
}

export const Logo: React.FC<LogoProps> = ({ className = "h-6 w-6", alt = "TLC Zero" }) => {
  const { actualTheme } = useTheme()
  
  const logoSrc = actualTheme === 'dark' 
    ? '/logo_light_on_dark.svg' 
    : '/logo_dark_on_light.svg'
  
  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={className}
    />
  )
} 