import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { AppSidebar } from './AppSidebar'
import { FloatingActionButton } from '@/components/common/FloatingActionButton'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Floating hamburger button - mobile only */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-3 left-3 z-30 inline-flex items-center justify-center rounded-lg bg-white p-2 shadow-md text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menu</span>
        </button>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>

        <FloatingActionButton />
      </div>
    </div>
  )
}
