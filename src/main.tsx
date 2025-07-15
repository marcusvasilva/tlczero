import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { registerServiceWorker } from './lib/serviceWorker'

// Registrar o service worker para funcionalidades PWA
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="system" storageKey="tlc-theme">
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </ThemeProvider>,
)
