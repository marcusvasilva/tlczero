import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

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
    <div className="fixed bottom-0 left-0 right-0 xs:bottom-4 xs:left-4 xs:right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-2xl xs:rounded-lg shadow-xl z-50 animate-slide-up pb-safe">
      <div className="p-4 xs:p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium text-base xs:text-lg text-gray-900 dark:text-white">Instalar TLC Zero</h3>
          </div>
        <button 
          onClick={handleDismiss}
          className="touch-target -mr-2 -mt-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm xs:text-base mb-4 xs:mb-5">
        Instale o TLC Zero para acesso rápido e modo offline, ideal para coletas em campo.
        </p>
        
        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
          <button 
            onClick={handleInstall} 
            className="mobile-button bg-primary text-primary-foreground hover:bg-primary/90 flex-1 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Instalar Agora
          </button>
          <button 
            onClick={handleDismiss} 
            className="mobile-button bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex-1"
          >
            Mais Tarde
          </button>
        </div>
      </div>
    </div>
  )
} 