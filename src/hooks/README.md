# Custom Hooks

Este diretório contém os hooks customizados utilizados no projeto TLC Zero.

## Hooks Disponíveis

### `useClients`
Hook para gerenciar clientes (empresas) no sistema.

### `useSpaces`
Hook para gerenciar espaços/locais de coleta.

### `useCollections`
Hook para gerenciar coletas de moscas.

### `useOperators`
Hook para gerenciar operadores do sistema.

### `useReports`
Hook para gerar e gerenciar relatórios.

## Correções de Performance Aplicadas (Dezembro 2024)

### Problema Identificado
- Telas ficavam carregando eternamente ao navegar
- Queries executavam mas não completavam
- F5 resolvia temporariamente o problema

### Causa Raiz
1. **Race conditions** entre navegações
2. **Memory leaks** por atualizações de estado após desmontagem
3. **useEffect** mal configurado causando uso de valores stale
4. **Múltiplas requisições simultâneas** sem controle

### Solução Implementada

#### 1. Controle de Montagem
```typescript
const isMountedRef = useRef(true)
const fetchingRef = useRef(false)

// No cleanup do useEffect
return () => {
  isMountedRef.current = false
  fetchingRef.current = false
}
```

#### 2. Prevenção de Requisições Simultâneas
```typescript
if (fetchingRef.current) {
  console.log('⚠️ Fetch já em andamento, pulando...')
  return
}
fetchingRef.current = true
```

#### 3. Verificação antes de Atualizar Estado
```typescript
if (!isMountedRef.current) {
  console.log('⚠️ Componente desmontado')
  return
}
setData(newData)
```

#### 4. useEffect com Dependências Corretas
```typescript
useEffect(() => {
  fetchData()
  return () => { /* cleanup */ }
}, [fetchData]) // Incluir função nas deps
```

### Padrão Recomendado para Novos Hooks

```typescript
export const useResource = (options = {}) => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Refs para controle
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)
  
  const fetchData = useCallback(async () => {
    if (fetchingRef.current) return
    
    fetchingRef.current = true
    setIsLoading(true)
    
    try {
      const result = await api.getData()
      
      if (!isMountedRef.current) return
      
      setData(result)
    } catch (err) {
      if (!isMountedRef.current) return
      
      setError(err.message)
    } finally {
      fetchingRef.current = false
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [/* deps */])
  
  useEffect(() => {
    isMountedRef.current = true
    fetchData()
    
    return () => {
      isMountedRef.current = false
    }
  }, [fetchData])
  
  return { data, isLoading, error }
}
```

### Monitoramento
Para debugar problemas futuros, use:
```javascript
// No console do navegador
performance.memory // Ver uso de memória
``` 