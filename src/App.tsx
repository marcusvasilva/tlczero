import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { GlobalLoading } from './components/common/GlobalLoading'
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt'
import { ToastContainer } from './components/common/Toast'
import { ConnectionStatus } from './components/common/ConnectionStatus'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

// Importações não-lazy para componentes sem export default
import { Clients } from './pages/Clients'
import Spaces from './pages/Spaces'
import Collections from './pages/Collections'
import { Collect } from './pages/Collect'
import { Operators } from './pages/Operators'
import { UserManagement } from './pages/UserManagement'
// Importações normais para todos os componentes
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'



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
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            
            {/* Rota de registro protegida - apenas admins */}
            <Route path="/register" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Register />
              </ProtectedRoute>
            } />
            
            {/* Rotas protegidas com layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard - todos os usuários autenticados */}
              <Route path="dashboard" element={<Dashboard />} />
              
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
              
              {/* Gestão de Usuários - apenas admin */}
              <Route path="user-management" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              {/* Relatórios - admin e supervisor podem criar, operador só visualiza */}
              <Route path="reports" element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                  <Reports />
                </ProtectedRoute>
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
