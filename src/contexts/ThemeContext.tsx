import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'tlc-theme'
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Tentar recuperar do localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey) as Theme
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          return stored
        }
      } catch (error) {
        console.warn('Erro ao ler tema do localStorage:', error)
      }
    }
    return defaultTheme
  })

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  // Detectar tema do sistema
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    // Definir tema inicial
    updateSystemTheme()

    // Escutar mudanças
    mediaQuery.addEventListener('change', updateSystemTheme)
    
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  // Calcular tema atual (considerando 'system')
  const actualTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme

  // Aplicar tema ao DOM
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = window.document.documentElement
    
    // Remover classes anteriores
    root.classList.remove('light', 'dark')
    
    // Adicionar classe do tema atual
    root.classList.add(actualTheme)
    
    // Atualizar meta theme-color para PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        actualTheme === 'dark' ? '#00322E' : '#00322E'
      )
    }
  }, [actualTheme])

  // Função para definir tema
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme)
    } catch (error) {
      console.warn('Erro ao salvar tema no localStorage:', error)
    }
    setThemeState(newTheme)
  }, [storageKey])

  // Função para alternar entre light/dark (ignora system)
  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      // Se está em system, vai para o oposto do tema atual do sistema
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      // Alterna entre light e dark
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }, [theme, systemTheme, setTheme])

  const contextValue: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
}

// Hook para detectar se o usuário prefere dark mode
export const useSystemTheme = (): 'light' | 'dark' => {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    updateSystemTheme()
    mediaQuery.addEventListener('change', updateSystemTheme)
    
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  return systemTheme
} 