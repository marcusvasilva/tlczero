import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export function SessionMonitor() {
  const { user } = useAuthContext()
  
  // Monitorar apenas mudanças de foco - o Supabase gerencia o resto
  useEffect(() => {
    if (!user) return
    
    const handleFocus = async () => {
      console.log('🔄 Janela voltou ao foco')
      // O Supabase já faz refresh automático quando necessário
      // Não precisamos forçar
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])
  
  // O Supabase já tem autoRefreshToken habilitado
  // Não precisamos fazer verificações manuais
  
  return null
}