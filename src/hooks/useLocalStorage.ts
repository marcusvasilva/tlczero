import { useState, useCallback } from 'react'

type SetValue<T> = T | ((val: T) => T)

/**
 * Hook para persistir dados no localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void] {
  // Estado para armazenar nosso valor
  // Passa o valor inicial para useState para que a função seja executada apenas uma vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Obter do localStorage local por chave
      const item = window.localStorage.getItem(key)
      // Analisar JSON armazenado ou se nenhum retornar initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Se erro também retorna initialValue
      console.log(`Erro ao ler localStorage para chave "${key}":`, error)
      return initialValue
    }
  })

  // Retorna uma versão wrapped da função setter de useState que ...
  // ... persiste o novo valor no localStorage.
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Permite que o valor seja uma função para que tenhamos a mesma API que useState
      setStoredValue((currentValue) => {
        const valueToStore = value instanceof Function ? value(currentValue) : value
        
        // Salvar no localStorage
        if (valueToStore === null || valueToStore === undefined) {
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
        
        return valueToStore
      })
    } catch (error) {
      // Uma implementação mais avançada lidaria com o caso do localStorage estar cheio
      console.log(`Erro ao salvar no localStorage para chave "${key}":`, error)
    }
  }, [key])

  return [storedValue, setValue]
}

/**
 * Hook para remover item do localStorage
 */
export function useRemoveFromStorage(key: string) {
  const removeItem = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.log(`Erro ao remover item "${key}" do localStorage:`, error)
    }
  }, [key])

  return removeItem
}

/**
 * Hook para limpar todo o localStorage
 */
export function useClearStorage() {
  const clearStorage = useCallback(() => {
    try {
      window.localStorage.clear()
    } catch (error) {
      console.log('Erro ao limpar localStorage:', error)
    }
  }, [])

  return clearStorage
} 