import { ReactNode } from 'react'
import { Logo } from '@/components/common/Logo'

interface SimpleLayoutProps {
  children: ReactNode
  title?: string
}

export function SimpleLayout({ children, title }: SimpleLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          )}
        </div>
      </header>
      
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
