import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, PlusCircle, MapPin, Users } from 'lucide-react'

const actions = [
  { label: 'Nova Coleta', icon: PlusCircle, to: '/collections?new=true' },
  { label: 'Novo Espaço', icon: MapPin, to: '/spaces?new=true' },
  { label: 'Novo Operador', icon: Users, to: '/operators?new=true' },
]

export function FloatingActionButton() {
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Detect when modals are open by observing DOM changes
  useEffect(() => {
    const checkForModals = () => {
      const hasModal = document.querySelector('[role="dialog"], [data-radix-portal], .fixed.inset-0.bg-black') !== null
      setModalOpen(hasModal)
    }

    const observer = new MutationObserver(checkForModals)
    observer.observe(document.body, { childList: true, subtree: true })
    checkForModals()

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (modalOpen) return null

  function handleAction(to: string) {
    setOpen(false)
    navigate(to)
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Speed-dial items */}
      <div
        className={
          'flex flex-col items-end gap-2 transition-all duration-200 ' +
          (open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none')
        }
      >
        {actions.map((action) => (
          <button
            key={action.to}
            onClick={() => handleAction(action.to)}
            className="flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 pl-4 pr-3 py-2 shadow-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {action.label}
            <action.icon className="h-5 w-5 text-green-600 dark:text-green-400" />
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={
          'flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 active:scale-95 transition-all duration-200 ' +
          (open ? 'rotate-45' : 'rotate-0')
        }
        aria-label={open ? 'Fechar menu' : 'Abrir menu de cadastro'}
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  )
}
