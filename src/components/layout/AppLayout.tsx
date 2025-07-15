import { useState, createContext, useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { ConnectionStatus } from '../common/ConnectionStatus'
import { useMobile } from '@/hooks/use-mobile'

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarContext')
  }
  return context
}

export function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isMobile = useMobile()

  // Ajustar sidebar baseado no tamanho da tela
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false)
      setIsMobileMenuOpen(false)
    } else {
      setIsCollapsed(false)
    }
  }, [isMobile])

  // Fechar menu mobile quando redimensionar para desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false)
    }
  }, [isMobile])

  // Overlay para mobile quando menu estiver aberto
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      setIsCollapsed,
      isMobileMenuOpen,
      setIsMobileMenuOpen
    }}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <AppHeader />
          
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        
        {/* Overlay para mobile */}
        {isMobile && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={handleOverlayClick}
          />
        )}
        
        {/* Status de conexão */}
        <ConnectionStatus />
      </div>
    </SidebarContext.Provider>
  )
} 