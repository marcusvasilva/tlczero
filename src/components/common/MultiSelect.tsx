import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  maxSelected?: number
  disabled?: boolean
  error?: boolean
  className?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Selecione opções...',
  maxSelected,
  disabled = false,
  error = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar opções baseado na busca
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obter labels das opções selecionadas
  const selectedLabels = selectedValues.map(value => {
    const option = options.find(opt => opt.value === value)
    return option?.label || value
  })

  const handleToggleOption = (value: string) => {
    if (disabled) return

    const isSelected = selectedValues.includes(value)
    
    if (isSelected) {
      // Remover da seleção
      onChange(selectedValues.filter(v => v !== value))
    } else {
      // Adicionar à seleção (respeitando limite máximo)
      if (maxSelected && selectedValues.length >= maxSelected) {
        return
      }
      onChange([...selectedValues, value])
    }
  }

  const handleRemoveSelected = (value: string) => {
    onChange(selectedValues.filter(v => v !== value))
  }

  const handleClearAll = () => {
    onChange([])
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
          error 
            ? 'border-red-300 bg-red-50' 
            : disabled 
            ? 'border-gray-200 bg-gray-50 text-gray-400' 
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedValues.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedLabels.slice(0, 2).map((label, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSelected(selectedValues[index])
                      }}
                      className="ml-1 hover:text-green-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedValues.length > 2 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                    +{selectedValues.length - 2} mais
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {selectedValues.length > 0 && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearAll()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar opções..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? 'Nenhuma opção encontrada' : 'Nenhuma opção disponível'}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                const isDisabled = option.disabled || 
                  !!(maxSelected && !isSelected && selectedValues.length >= maxSelected)

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggleOption(option.value)}
                    disabled={isDisabled}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-green-50 text-green-900' : 'text-gray-900'
                    } ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex-1">{option.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {maxSelected && (
            <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
              {selectedValues.length} de {maxSelected} selecionados
            </div>
          )}
        </div>
      )}
    </div>
  )
} 