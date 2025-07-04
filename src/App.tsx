import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { GlobalLoading } from './components/common/GlobalLoading'
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt'
import { ToastContainer } from './components/common/Toast'
import { ConnectionStatus } from './components/common/ConnectionStatus'
import { Login } from './pages/Login'

// Importações não-lazy para componentes sem export default
import { Clients } from './pages/Clients'
import { Spaces } from './pages/Spaces'
import { Collections } from './pages/Collections'
import { Collect } from './pages/Collect'
import { Operators } from './pages/Operators'

// Lazy loading apenas para componentes com export default
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Reports = lazy(() => import('./pages/Reports'))
const PwaDemo = lazy(() => import('./pages/PwaDemo'))

// Componente de loading para lazy loading
const LazyLoading = () => (
  <div className="flex justify-center items-center h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
)

// Página temporária para rotas não implementadas
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">Esta página está em desenvolvimento.</p>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          🚧 Página será implementada nas próximas tarefas do projeto
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Rota pública de login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rotas protegidas com layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard - todos os usuários autenticados */}
              <Route path="dashboard" element={
                <Suspense fallback={<LazyLoading />}>
                  <Dashboard />
                </Suspense>
              } />
              
              {/* Clientes - admin e supervisor podem criar/editar, operador só visualiza */}
              <Route path="clients" element={<Clients />} />
              
              {/* Espaços - admin e supervisor podem criar/editar, operador só visualiza */}
              <Route path="spaces" element={<Spaces />} />
              
              {/* Coletas - todos podem criar/editar suas próprias */}
              <Route path="collections" element={<Collections />} />
              
              {/* Nova Coleta - página mobile para apontamentos */}
              <Route path="collect" element={<Collect />} />
              
              {/* Operadores - admin e supervisor podem gerenciar */}
              <Route path="operators" element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                  <Operators />
                </ProtectedRoute>
              } />
              
              {/* Relatórios - admin e supervisor podem criar, operador só visualiza */}
              <Route path="reports" element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                  <Suspense fallback={<LazyLoading />}>
                    <Reports />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Demonstração PWA - para testes e demonstração */}
              <Route path="pwa-demo" element={
                <Suspense fallback={<LazyLoading />}>
                  <PwaDemo />
                </Suspense>
              } />
              
              {/* Configurações - apenas admin */}
              <Route path="settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ComingSoon title="Configurações" />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
          
          {/* Loading global */}
          <GlobalLoading />
          
          {/* Prompt de instalação PWA */}
          <PWAInstallPrompt />
          
          {/* Sistema de notificações */}
          <ToastContainer />
          
          {/* Status de conexão */}
          <ConnectionStatus />
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
