# Guia de Desenvolvimento - TLC Zero

## 🎯 Visão Geral

Este guia fornece instruções detalhadas para o desenvolvimento do TLC Zero, seguindo a abordagem **Frontend-First** com dados mockados antes da integração com backend.

## 📋 Metodologia de Desenvolvimento

### Fase 1: Frontend com Dados Mockados
- Desenvolver toda a UI/UX usando dados simulados
- Validar fluxos de usuário e design
- Refinar estrutura de dados baseada na experiência da UI

### Fase 2: Backend e Integração
- Configurar Supabase baseado na estrutura validada
- Substituir dados mockados por integração real
- Deploy e otimizações

## 🛠️ Setup do Ambiente

### Pré-requisitos
```bash
# Verificar versões
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
```

### Inicialização do Projeto
```bash
# Criar projeto React com TypeScript
npm create vite@latest . -- --template react-ts

# Instalar dependências
npm install

# Configurar Shadcn/ui
npx shadcn@latest init

# Instalar dependências adicionais
npm install @radix-ui/react-icons lucide-react
npm install recharts qrcode jspdf
npm install @types/qrcode @types/jspdf
```

## 📁 Estrutura de Pastas

```
src/
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   ├── forms/              # Formulários específicos
│   ├── charts/             # Componentes de gráficos
│   ├── layout/             # Layout e navegação
│   └── common/             # Componentes reutilizáveis
├── pages/
│   ├── Dashboard/          # Página principal
│   ├── Clients/            # Gestão de clientes
│   ├── Spaces/             # Gestão de espaços
│   ├── Collections/        # Apontamentos
│   └── Reports/            # Relatórios
├── hooks/
│   ├── useClients.ts       # Hook para clientes
│   ├── useSpaces.ts        # Hook para espaços
│   └── useCollections.ts   # Hook para coletas
├── lib/
│   ├── utils.ts            # Utilitários gerais
│   ├── validations.ts      # Validações de formulário
│   └── constants.ts        # Constantes da aplicação
├── types/
│   ├── client.ts           # Tipos do cliente
│   ├── space.ts            # Tipos do espaço
│   └── collection.ts       # Tipos da coleta
├── data/
│   ├── mockClients.ts      # Dados simulados
│   ├── mockSpaces.ts       # Dados simulados
│   └── mockCollections.ts  # Dados simulados
└── styles/
    └── globals.css         # Estilos globais
```

## 🎨 Padrões de Código

### Interfaces TypeScript
```typescript
// types/client.ts
export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

// types/space.ts
export interface Space {
  id: string
  clientId: string
  name: string
  description?: string
  qrCode: string
  location?: string
  createdAt: Date
  updatedAt: Date
}

// types/collection.ts
export interface Collection {
  id: string
  spaceId: string
  operatorId: string
  weight: number
  photoUrl?: string
  observations?: string
  collectedAt: Date
  createdAt: Date
}
```

### Hooks Customizados
```typescript
// hooks/useClients.ts
import { useState, useEffect } from 'react'
import { Client } from '@/types/client'
import { mockClients } from '@/data/mockClients'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setClients(mockClients)
      setLoading(false)
    }, 1000)
  }, [])

  const addClient = (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setClients(prev => [...prev, newClient])
  }

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === id 
        ? { ...client, ...updates, updatedAt: new Date() }
        : client
    ))
  }

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(client => client.id !== id))
  }

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient
  }
}
```

### Componentes de Formulário
```typescript
// components/forms/ClientForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'

const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  address: z.string().optional()
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void
  initialData?: Partial<ClientFormData>
}

export function ClientForm({ onSubmit, initialData }: ClientFormProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {/* Outros campos... */}
        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  )
}
```

## 🎯 Componentes Principais

### 1. Dashboard
- Cards com métricas principais
- Gráficos de performance
- Lista de atividades recentes
- Filtros por período

### 2. Gestão de Clientes
- Tabela com listagem
- Formulário de cadastro/edição
- Modal de confirmação para exclusão
- Busca e filtros

### 3. Gestão de Espaços
- Listagem por cliente
- Geração de QR codes
- Visualização de localização
- Status dos atrativos

### 4. Página de Apontamento
- Interface mobile-first
- Upload de foto
- Campos de peso e observações
- Validação em tempo real

### 5. Relatórios
- Filtros avançados
- Visualizações em gráficos
- Exportação em PDF
- Comparações temporais

## 🔧 Utilitários e Helpers

### Formatação de Dados
```typescript
// lib/utils.ts
export function formatWeight(weight: number): string {
  return `${weight.toFixed(2)} kg`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function generateQRCode(spaceId: string): string {
  return `${window.location.origin}/collect/${spaceId}`
}
```

### Validações
```typescript
// lib/validations.ts
export function validateWeight(weight: string): boolean {
  const num = parseFloat(weight)
  return !isNaN(num) && num > 0 && num <= 1000
}

export function validatePhotoSize(file: File): boolean {
  return file.size <= 5 * 1024 * 1024 // 5MB
}
```

## 📱 Responsividade

### Breakpoints Tailwind
```css
/* Mobile first approach */
sm: 640px   /* Tablet pequeno */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop pequeno */
xl: 1280px  /* Desktop */
2xl: 1536px /* Desktop grande */
```

### Componentes Responsivos
```typescript
// Exemplo de componente responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards responsivos */}
</div>
```

## 🎨 Design System

### Cores
```css
/* Baseado no tema do Shadcn/ui */
--primary: 222.2 84% 4.9%
--secondary: 210 40% 96%
--accent: 210 40% 94%
--destructive: 0 84.2% 60.2%
```

### Tipografia
```css
/* Hierarquia de textos */
.text-4xl  /* Títulos principais */
.text-2xl  /* Subtítulos */
.text-lg   /* Texto destacado */
.text-base /* Texto padrão */
.text-sm   /* Texto auxiliar */
```

## 🚀 Scripts de Desenvolvimento

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix"
  }
}
```

## 📝 Convenções

### Nomenclatura
- **Componentes**: PascalCase (ClientForm.tsx)
- **Hooks**: camelCase com prefixo 'use' (useClients.ts)
- **Utilitários**: camelCase (formatDate)
- **Constantes**: UPPER_SNAKE_CASE (MAX_FILE_SIZE)

### Estrutura de Commits
```
feat: adiciona componente de upload de foto
fix: corrige validação de peso
docs: atualiza guia de desenvolvimento
style: ajusta espaçamento do header
refactor: reorganiza hooks de dados
```

## 🔍 Debugging

### React DevTools
- Instalar extensão React Developer Tools
- Usar para inspecionar componentes e estado

### Vite DevTools
- Hot Module Replacement automático
- Source maps para debugging

### Console Logs
```typescript
// Usar apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.log('Debug info:', data)
}
```

## 📚 Recursos Adicionais

- [Documentação React](https://react.dev)
- [Documentação Vite](https://vitejs.dev)
- [Documentação Shadcn/ui](https://ui.shadcn.com)
- [Documentação Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs) 