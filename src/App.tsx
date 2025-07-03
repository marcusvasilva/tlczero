import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { GlobalLoading } from './components/common/GlobalLoading'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Clients } from './pages/Clients'
import { Spaces } from './pages/Spaces'
import { Collections } from './pages/Collections'
import { Collect } from './pages/Collect'

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
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Clientes - admin e supervisor podem criar/editar, operador só visualiza */}
            <Route path="clients" element={<Clients />} />
            
            {/* Espaços - admin e supervisor podem criar/editar, operador só visualiza */}
            <Route path="spaces" element={<Spaces />} />
            
            {/* Coletas - todos podem criar/editar suas próprias */}
            <Route path="collections" element={<Collections />} />
            
            {/* Nova Coleta - página mobile para apontamentos */}
            <Route path="collect" element={<Collect />} />
            
            {/* Operadores - apenas admin pode gerenciar */}
            <Route path="operators" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ComingSoon title="Operadores" />
              </ProtectedRoute>
            } />
            
            {/* Relatórios - admin e supervisor podem criar, operador só visualiza */}
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                <ComingSoon title="Relatórios" />
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
      </Router>
    </AuthProvider>
  )
}

export default App
