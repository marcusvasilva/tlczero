import React from 'react'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../@/components/ui/dropdown-menu'
import { Button } from '../../../@/components/ui/button'

export const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, setTheme } = useTheme()

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Claro',
      icon: Sun,
      description: 'Sempre usar tema claro'
    },
    {
      value: 'dark' as const,
      label: 'Escuro',
      icon: Moon,
      description: 'Sempre usar tema escuro'
    },
    {
      value: 'system' as const,
      label: 'Sistema',
      icon: Monitor,
      description: 'Seguir configuração do sistema'
    }
  ]

  const currentOption = themeOptions.find(option => option.value === theme)
  const CurrentIcon = currentOption?.icon || Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 px-0 relative"
          title={`Tema atual: ${currentOption?.label || 'Sistema'}`}
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {themeOptions.map((option) => {
          const Icon = option.icon
          const isSelected = theme === option.value
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Versão simples do toggle (apenas ícone que alterna)
export const SimpleThemeToggle: React.FC = () => {
  const { actualTheme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 px-0"
      title={`Alternar para tema ${actualTheme === 'dark' ? 'claro' : 'escuro'}`}
    >
      {actualTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
} 