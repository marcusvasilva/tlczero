import React, { useState, useEffect } from 'react'

interface AuthEmergencyResetProps {
  isVisible: boolean
  onReset: () => void
}

export const AuthEmergencyReset: React.FC<AuthEmergencyResetProps> = ({ 
  isVisible, 
  onReset 
}) => {
  const [countdown, setCountdown] = useState(10)
  
  useEffect(() => {
    if (!isVisible) return
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isVisible])
  
  if (!isVisible) return null
  
  const handleClearCache = () => {
    try {
      // Limpar localStorage
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('auth') || 
        key.includes('supabase') || 
        key.includes('sb-') ||
        key.startsWith('tlc-')
      )
      
      authKeys.forEach(key => {
        localStorage.removeItem(key)
        console.log(`Removido: ${key}`)
      })

      // Limpar sessionStorage
      const sessionAuthKeys = Object.keys(sessionStorage).filter(key =>
        key.includes('auth') || 
        key.includes('supabase') || 
        key.includes('sb-')
      )
      
      sessionAuthKeys.forEach(key => {
        sessionStorage.removeItem(key)
        console.log(`Removido (session): ${key}`)
      })
      
      alert('Cache limpo! A página será recarregada.')
      window.location.reload()
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
      alert('Erro ao limpar cache. Tente recarregar manualmente.')
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Problema de Autenticação Detectado
          </h2>
          
          <p className="text-gray-600 mb-4">
            O sistema está demorando muito para verificar sua autenticação. 
            Isso pode indicar dados corrompidos.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm">
            <p className="text-yellow-800">
              <strong>Soluções disponíveis:</strong>
            </p>
            <ul className="text-left mt-2 text-yellow-700">
              <li>• Limpar cache de autenticação</li>
              <li>• Recarregar página automaticamente</li>
              <li>• Fazer logout forçado se necessário</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleClearCache}
              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
            >
              🧹 Limpar Cache e Recarregar
            </button>
            
            <button 
              onClick={onReset}
              className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
            >
              🔄 Tentar Novamente ({countdown}s)
            </button>
            
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg font-medium transition-colors"
            >
              🚪 Ir para Login
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            Se o problema persistir, entre em contato com o suporte técnico
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthEmergencyReset 