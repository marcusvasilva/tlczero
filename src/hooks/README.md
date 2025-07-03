# Hooks Customizados - TLC Zero

## Visão Geral

Os hooks customizados do TLC Zero fornecem uma interface consistente para gerenciamento de estado e operações CRUD com dados mockados. Cada hook simula operações de API com delays realistas e inclui estados de loading, error handling e funcionalidades avançadas de filtros e busca.

## Hooks Disponíveis

### 🔧 Core Hooks

#### `useLocalStorage`
Hook para persistência de dados no localStorage com sincronização automática.

```typescript
const [data, setData] = useLocalStorage<T>('key', defaultValue)
```

#### `useAuth`
Hook para gerenciamento de autenticação e autorização.

```typescript
const { user, login, logout, isAuthenticated, hasPermission } = useAuth()
```

#### `useForm`
Hook para gerenciamento de formulários com validação.

```typescript
const { values, errors, setFieldValue, isValid } = useForm<T>({
  initialValues,
  validate
})
```

#### `usePagination`
Hook para controle de paginação com funcionalidades avançadas.

```typescript
const {
  currentPage,
  totalPages,
  goToPage,
  nextPage,
  previousPage,
  getVisibleItems
} = usePagination({ totalItems, itemsPerPage })
```

### 📊 Entity Management Hooks

#### `useClients`
Gerenciamento completo de clientes com CRUD, busca e filtros.

```typescript
const {
  clients,
  filteredClients,
  isCreating,
  createClient,
  updateClient,
  deleteClient,
  searchClients,
  totalClients,
  activeClients
} = useClients({
  searchTerm: '',
  sortBy: 'name',
  filterActive: true
})

// Criar cliente
const newClient = await createClient({
  name: 'Empresa ABC',
  email: 'contato@empresa.com',
  phone: '11999999999',
  cnpj: '12345678000123',
  address: 'Rua das Flores, 123'
})

// Buscar clientes
searchClients('empresa')

// Filtrar e ordenar
const options = {
  searchTerm: 'abc',
  sortBy: 'name' as const,
  sortOrder: 'asc' as const,
  filterActive: true
}
```

#### `useSpaces`
Gerenciamento de espaços com vinculação a clientes e geração de QR codes.

```typescript
const {
  spaces,
  filteredSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  getSpacesByClient,
  filterByClient,
  spacesByType
} = useSpaces({
  clientId: 'client-123',
  filterType: 'moscas'
})

// Criar espaço
const newSpace = await createSpace({
  name: 'Área de Frios',
  clientId: 'client-123',
  location: 'Corredor 3 - Lado direito',
  attractiveType: 'moscas',
  installationDate: new Date()
})

// Filtrar por cliente
filterByClient('client-123')
```

#### `useCollections`
Gerenciamento de coletas com filtros avançados e estatísticas.

```typescript
const {
  collections,
  filteredCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  filterBySpace,
  filterByDateRange,
  totalWeight,
  averageWeight,
  collectionsToday,
  weightThisMonth
} = useCollections({
  spaceId: 'space-123',
  sortBy: 'collectedAt',
  sortOrder: 'desc'
})

// Criar coleta
const newCollection = await createCollection({
  spaceId: 'space-123',
  operatorId: 'operator-456',
  weight: 1.25,
  photoUrl: 'base64-image-data',
  observations: 'Coleta normal',
  collectedAt: new Date()
})

// Filtros avançados
filterByDateRange(new Date('2024-01-01'), new Date('2024-01-31'))
filterByWeightRange(0.5, 2.0)
```

#### `useOperators`
Gerenciamento de operadores com controle de status e roles.

```typescript
const {
  operators,
  filteredOperators,
  createOperator,
  updateOperator,
  activateOperator,
  deactivateOperator,
  getOperatorsByRole,
  operatorsByRole
} = useOperators({
  filterRole: 'operador',
  filterActive: true
})

// Criar operador
const newOperator = await createOperator({
  name: 'João Silva',
  email: 'joao@tlczero.com',
  phone: '11988776655',
  cpf: '12345678901',
  role: 'operador',
  hireDate: new Date()
})

// Ativar/Desativar
await activateOperator('operator-123')
await deactivateOperator('operator-456')
```

## Funcionalidades Comuns

### 🔄 Estados de Loading
Todos os hooks incluem estados granulares de loading:

```typescript
const {
  isLoading,     // Loading geral
  isCreating,    // Criando novo item
  isUpdating,    // Atualizando item
  isDeleting     // Deletando item
} = useClients()

// Uso em componentes
if (isCreating) {
  return <Spinner />
}
```

### ❌ Error Handling
Tratamento consistente de erros com mensagens em português:

```typescript
const { error, clearError } = useClients()

// Exibir erro
if (error) {
  return <Alert variant="destructive">{error}</Alert>
}

// Limpar erro
clearError()
```

### 🔍 Busca e Filtros
Funcionalidades avançadas de busca e filtros:

```typescript
// Busca textual
searchClients('termo de busca')

// Ordenação
sortClients('name', 'asc')

// Filtros específicos
filterByClient('client-id')
filterByRole('admin')
filterByDateRange(startDate, endDate)
```

### 📈 Estatísticas
Estatísticas calculadas automaticamente:

```typescript
const {
  totalClients,
  activeClients,
  inactiveClients
} = useClients()

const {
  totalWeight,
  averageWeight,
  collectionsToday,
  weightThisMonth
} = useCollections()
```

## Padrões de Uso

### 1. Componente de Lista

```typescript
function ClientsList() {
  const {
    filteredClients,
    isLoading,
    searchClients,
    deleteClient,
    error
  } = useClients({ filterActive: true })

  const handleSearch = (term: string) => {
    searchClients(term)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id)
      // Cliente deletado com sucesso
    } catch (err) {
      // Erro já está no estado 'error'
    }
  }

  if (isLoading) return <Spinner />
  if (error) return <Alert>{error}</Alert>

  return (
    <div>
      <SearchInput onSearch={handleSearch} />
      {filteredClients.map(client => (
        <ClientCard 
          key={client.id} 
          client={client}
          onDelete={() => handleDelete(client.id)}
        />
      ))}
    </div>
  )
}
```

### 2. Formulário de Criação

```typescript
function CreateClientForm() {
  const { createClient, isCreating, error } = useClients()
  const { values, errors, setFieldValue, isValid } = useForm({
    initialValues: { name: '', email: '' },
    validate: clientSchema
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    try {
      await createClient(values)
      // Redirecionar ou limpar form
    } catch (err) {
      // Erro já está no estado
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={values.name}
        onChange={(e) => setFieldValue('name', e.target.value)}
        error={errors.name}
      />
      <Button type="submit" disabled={isCreating || !isValid}>
        {isCreating ? 'Criando...' : 'Criar Cliente'}
      </Button>
      {error && <Alert>{error}</Alert>}
    </form>
  )
}
```

### 3. Dashboard com Estatísticas

```typescript
function Dashboard() {
  const { totalClients, activeClients } = useClients()
  const { totalSpaces, spacesByType } = useSpaces()
  const { 
    collectionsToday, 
    weightToday, 
    totalWeight 
  } = useCollections()

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Clientes Ativos" value={activeClients} />
      <StatCard title="Total de Espaços" value={totalSpaces} />
      <StatCard title="Coletas Hoje" value={collectionsToday} />
      <StatCard title="Peso Total" value={`${totalWeight.toFixed(2)} kg`} />
    </div>
  )
}
```

## Vantagens

✅ **Consistência**: Interface uniforme para todas as entidades
✅ **Performance**: Memoização automática e otimizações
✅ **Flexibilidade**: Opções configuráveis para diferentes cenários
✅ **Produtividade**: Menos código boilerplate
✅ **Manutenibilidade**: Lógica centralizada e reutilizável
✅ **Tipagem**: TypeScript completo com inferência automática
✅ **Simulação Realista**: Delays e comportamentos similares a APIs reais

## Migração para API Real

Quando migrar para Supabase, apenas a implementação interna dos hooks mudará. A interface pública permanecerá a mesma, garantindo zero breaking changes no código dos componentes.

```typescript
// Antes (mockado)
const createClient = useCallback(async (data) => {
  await simulateDelay()
  // ... lógica mockada
}, [])

// Depois (Supabase)
const createClient = useCallback(async (data) => {
  const { data: newClient, error } = await supabase
    .from('clients')
    .insert(data)
    .select()
    .single()
  
  if (error) throw error
  return newClient
}, [])
``` 