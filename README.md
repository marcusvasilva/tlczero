# TLC Zero - Aplicativo PWA para Controle de Pragas

## Visão Geral

O TLC Zero é um Progressive Web App (PWA) desenvolvido para empresas de controle de pragas, oferecendo uma solução completa para gestão de clientes, espaços monitorados, coletas e relatórios.

## Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Roteamento**: React Router DOM
- **Ícones**: Lucide React
- **Validação**: Zod
- **Hooks Customizados**: useLocalStorage, useApi, useForm, usePagination

## Funcionalidades Implementadas

### ✅ Tarefas Concluídas

1. **Setup Inicial** (100%)
   - Configuração do projeto React + TypeScript + Vite
   - Setup do Tailwind CSS
   - Estrutura de pastas organizada

2. **Dados Mockados** (100%)
   - Clientes, Espaços, Coletas, Operadores
   - Formatadores brasileiros (telefone, CNPJ, datas)
   - Validações customizadas

3. **Layout e Navegação** (100%)
   - Sidebar responsiva com navegação
   - Header com busca e notificações
   - Roteamento completo entre páginas
   - Design profissional com paleta verde

4. **Hooks Customizados** (100%)
   - useLocalStorage: Persistência de dados
   - useApi: Gerenciamento de estados de API
   - useForm: Controle avançado de formulários
   - usePagination: Paginação completa

5. **Componentes CRUD** (100%)
   - DataTable: Tabela reutilizável com ações
   - ClientForm: Formulário completo de clientes
   - ConfirmDialog: Diálogos de confirmação
   - CRUD completo de clientes funcionando

6. **Formulários Avançados** (100%)
   - SpaceForm: Formulário completo de espaços com validação
   - CollectionForm: Formulário de coletas com upload de fotos
   - MultiSelect: Componente de seleção múltipla reutilizável
   - CRUD completo de Espaços funcionando

7. **Autenticação** (100%)
   - Sistema de login completo com validação
   - Controle de acesso baseado em roles (Admin, Supervisor, Operador)
   - Sessões persistentes com renovação automática
   - Rotas protegidas com ProtectedRoute
   - Interface de usuário no header com logout

### 🚧 Em Desenvolvimento

8. **API Integration**
   - Conexão com backend real

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── common/         # Componentes comuns (DataTable, ConfirmDialog)
│   ├── forms/          # Formulários (ClientForm)
│   └── layout/         # Layout (SimpleLayout)
├── data/               # Dados mockados
├── hooks/              # Hooks customizados
├── lib/                # Utilitários e validações
├── pages/              # Páginas da aplicação
└── types/              # Tipos TypeScript
```

## Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Executar em desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Acessar**: http://localhost:5173

## Funcionalidades por Página

### 📊 Dashboard
- Métricas principais (clientes, espaços, coletas)
- Preferências persistentes (useLocalStorage)
- Coletas recentes e status do sistema

### 👥 Clientes
- **CRUD Completo**: Criar, editar, excluir clientes
- **Busca em tempo real**: Por nome, email ou CNPJ
- **Validação avançada**: Email, telefone, CNPJ
- **Persistência**: Dados salvos no localStorage
- **Interface moderna**: Tabela responsiva com ações

### 🏢 Espaços
- Lista de espaços monitorados
- Grid responsivo com informações detalhadas
- Datas de instalação e manutenção

### 🐛 Coletas
- **Paginação avançada**: Controle completo de páginas
- **Filtros dinâmicos**: Por itens por página
- **Dados detalhados**: Peso, condições climáticas, fotos
- **Navegação intuitiva**: Botões de navegação rápida

### 🔐 Autenticação
- **Sistema de Login**: Interface moderna com credenciais demo
- **Controle de Acesso**: 3 níveis de usuário (Admin, Supervisor, Operador)
- **Sessões Seguras**: Renovação automática e expiração controlada
- **Permissões Granulares**: Controle por recurso e ação
- **Interface de Usuário**: Menu dropdown com informações e logout

#### Credenciais de Demonstração
- **Admin**: admin@tlczero.com.br / admin123
- **Supervisor**: supervisor@tlczero.com.br / super123  
- **Operador**: operador@tlczero.com.br / oper123

## Recursos Técnicos

### Hooks Customizados
- **useLocalStorage**: Persistência automática de dados
- **usePagination**: Paginação com controles avançados
- **useForm**: Validação e controle de formulários
- **useApi**: Gerenciamento de estados de API

### Componentes Reutilizáveis
- **DataTable**: Tabela genérica com ações e ordenação
- **ClientForm**: Formulário modal com validação
- **ConfirmDialog**: Diálogos de confirmação customizáveis

### Validações
- CNPJ e CPF com algoritmo oficial
- Email, telefone e campos obrigatórios
- Feedback visual em tempo real

## Paleta de Cores

- **Verde Principal**: `#059669` (green-600)
- **Verde Claro**: `#DCFCE7` (green-100)
- **Verde Escuro**: `#047857` (green-700)
- **Cinza**: `#6B7280` (gray-500)

## Próximos Passos

7. **Autenticação** - Sistema de login e controle de acesso
8. **API Integration** - Conexão com backend
9. **Relatórios** - Dashboards e exportação
10. **Notificações** - Sistema de alertas
11. **PWA Features** - Service Worker e offline
12. **Testes** - Testes unitários e E2E
13. **Performance** - Otimizações e lazy loading
14. **Deploy** - Configuração de produção

## Status do Projeto

**🎯 Progresso**: 50% concluído (7/14 tarefas)

**✅ Funcional**: Dashboard, Clientes (CRUD completo), Espaços (CRUD completo), Coletas (com paginação)

**🔧 Tecnicamente sólido**: Hooks customizados, componentes reutilizáveis, validações robustas

## Contribuição

Este projeto segue as melhores práticas de desenvolvimento React/TypeScript:
- Componentes funcionais com hooks
- TypeScript para type safety
- Código limpo e bem documentado
- Estrutura modular e reutilizável

## 📋 Sobre o Projeto

O TLC Zero foi desenvolvido para facilitar o controle de pragas em campo, oferecendo:

- **Interface simples** para operadores com pouco conhecimento técnico
- **Registro via QR Code** para coletas de dados
- **Dashboard intuitivo** com métricas e relatórios
- **Exportação de relatórios** em PDF
- **Design responsivo** otimizado para dispositivos móveis

## 🎯 Funcionalidades Principais

### 🏢 Gestão de Clientes e Espaços
- Cadastro completo de clientes
- Gerenciamento de espaços por cliente
- Geração automática de QR Codes

### 📱 Apontamento Mobile
- Interface otimizada para dispositivos móveis
- Registro de fotos das coletas
- Inserção de peso e observações
- Acesso via QR Code sem necessidade de login

### 📊 Dashboard e Relatórios
- Métricas em tempo real
- Gráficos de performance
- Comparação de períodos
- Exportação em PDF

### 👥 Gestão de Operadores
- Cadastro de operadores
- Histórico de apontamentos
- Controle de acesso

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript
- **Bundler**: Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **PWA**: Service Workers + Manifest
- **Charts**: Recharts
- **QR Codes**: qrcode.js
- **PDF**: jsPDF

## 🚀 Instalação e Configuração

```bash
# Clonar o repositório
git clone <repository-url>
cd tlc-zero

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do Supabase

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📝 Documentação

- [Guia de Desenvolvimento](.taskmaster/docs/development-guide.md)
- [PRD Completo](.taskmaster/docs/prd.txt)
- [Tarefas do Projeto](.taskmaster/tasks/tasks.json)
- [Log de Setup](.taskmaster/docs/setup-log.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

Marcus Silva - [Seu contato]

Link do Projeto: [https://github.com/seu-usuario/tlc-zero](https://github.com/seu-usuario/tlc-zero)
TLC Zero
