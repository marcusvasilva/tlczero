import React from 'react'
import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  description?: string
  className?: string
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className
}) => {
  const sizes = {
    sm: {
      track: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4'
    },
    md: {
      track: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5'
    },
    lg: {
      track: 'h-7 w-13',
      thumb: 'h-6 w-6',
      translate: 'translate-x-6'
    }
  }

  const sizeClasses = sizes[size]

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex items-center">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
            sizeClasses.track,
            checked
              ? 'bg-green-600'
              : 'bg-gray-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
              sizeClasses.thumb,
              checked ? sizeClasses.translate : 'translate-x-0'
            )}
          />
        </button>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <span className={cn(
                'text-sm font-medium text-gray-900',
                disabled && 'text-gray-500'
              )}>
                {label}
              </span>
            )}
            {description && (
              <p className={cn(
                'text-sm text-gray-500',
                disabled && 'text-gray-400'
              )}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 