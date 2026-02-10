import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { GlobalLoading } from './components/common/GlobalLoading'
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt'
import { ToastContainer } from './components/common/Toast'
import { SessionMonitor } from './components/common/SessionMonitor'
// import { ConnectionAlert } from './components/common/ConnectionAlert' // Temporariamente desabilitado
import { Login } from './pages/Login'
import { Register } from './pages/Register'

// Importações não-lazy para componentes sem export default
import { Clients } from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Spaces from './pages/Spaces'
import Collections from './pages/Collections'
import { Collect } from './pages/Collect'
import { Operators } from './pages/Operators'
import { UserManagement } from './pages/UserManagement'
import AnonymousCollect from './pages/AnonymousCollect'
// Importações normais para todos os componentes
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import TestConnection from './pages/TestConnection'



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
        <SessionMonitor />
        {/* <ConnectionAlert /> Temporariamente desabilitado */}
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/collect/:token" element={<AnonymousCollect />} />
            
            {/* Rota de registro protegida - admins e distribuidores */}
            <Route path="/register" element={
              <ProtectedRoute allowedRoles={['admin', 'distributor']}>
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
              
              {/* Clientes - apenas admin e distribuidor */}
              <Route path="clients" element={
                <ProtectedRoute allowedRoles={['admin', 'distributor']}>
                  <Clients />
                </ProtectedRoute>
              } />
              <Route path="clients/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'distributor']}>
                  <ClientDetail />
                </ProtectedRoute>
              } />
              
              {/* Espaços - admin e supervisor podem criar/editar, operador só visualiza */}
              <Route path="spaces" element={<Spaces />} />
              
              {/* Coletas - todos podem criar/editar suas próprias */}
              <Route path="collections" element={<Collections />} />
              
              {/* Nova Coleta - página mobile para apontamentos */}
              <Route path="collect" element={<Collect />} />
              
              {/* Coleta Anônima - página para apontamentos anônimos */}
              
              {/* Operadores - admin, distribuidor e supervisor podem gerenciar */}
              <Route path="operators" element={
                <ProtectedRoute allowedRoles={['admin', 'distributor', 'supervisor']}>
                  <Operators />
                </ProtectedRoute>
              } />
              
              {/* Gestão de Usuários - admin e distribuidor */}
              <Route path="user-management" element={
                <ProtectedRoute allowedRoles={['admin', 'distributor']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              {/* Relatórios - admin, distribuidor e supervisor podem criar, operador só visualiza */}
              <Route path="reports" element={
                <ProtectedRoute allowedRoles={['admin', 'distributor', 'supervisor']}>
                  <Reports />
                </ProtectedRoute>
              } />
              
              {/* Teste de conexão - temporário para debug */}
              <Route path="test-connection" element={
                <ProtectedRoute>
                  <TestConnection />
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
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
