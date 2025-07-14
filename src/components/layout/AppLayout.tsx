import { useState, createContext, useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
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
      setIsCollapsed(true)
      setIsMobileMenuOpen(false)
    }
  }, [isMobile])

  // Fechar menu mobile quando clicar em overlay
  const handleOverlayClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <SidebarContext.Provider value={{ 
      isCollapsed, 
      setIsCollapsed, 
      isMobileMenuOpen, 
      setIsMobileMenuOpen 
    }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar Desktop */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        
        {/* Sidebar Mobile - Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleOverlayClick}
            />
            
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl">
        <AppSidebar />
            </div>
          </div>
        )}
        
        {/* Conteúdo principal */}
        <div className={`flex flex-col min-h-screen transition-all duration-300 ${
          !isMobile ? (isCollapsed ? 'lg:ml-16' : 'lg:ml-64') : 'ml-0'
        }`}>
          <AppHeader />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
} 