import { useState, useEffect } from 'react'
import { Button } from '../../../@/components/ui/button'
import { Card } from '../../../@/components/ui/card'
import { X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  // Detectar se o app já está instalado
  const [isAppInstalled, setIsAppInstalled] = useState(false)

  useEffect(() => {
    // Verificar se o app já está instalado (modo standalone ou fullscreen)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.matchMedia('(display-mode: fullscreen)').matches || 
                         (window.navigator as any).standalone === true
    
    setIsAppInstalled(isStandalone)

    // Capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      
      // Verificar se já foi fechado anteriormente
      const promptDismissed = localStorage.getItem('pwaPromptDismissed')
      const lastDismissed = promptDismissed ? new Date(promptDismissed) : null
      const now = new Date()
      
      // Mostrar novamente apenas após 7 dias
      if (!lastDismissed || (now.getTime() - lastDismissed.getTime() > 7 * 24 * 60 * 60 * 1000)) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    
    // Mostrar o prompt nativo
    await installPrompt.prompt()
    
    // Aguardar a escolha do usuário
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwaPromptDismissed', new Date().toISOString())
  }

  // Não mostrar se já estiver instalado ou se o prompt não estiver disponível
  if (isAppInstalled || !showPrompt) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 shadow-lg z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-lg">Instalar TLC Zero</h3>
        <button 
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
        Instale o TLC Zero para acesso rápido e modo offline, ideal para coletas em campo.
      </p>
      
      <div className="flex space-x-2">
        <Button onClick={handleInstall} className="flex-1">
          Instalar Agora
        </Button>
        <Button variant="outline" onClick={handleDismiss} className="flex-1">
          Mais Tarde
        </Button>
      </div>
    </Card>
  )
} 