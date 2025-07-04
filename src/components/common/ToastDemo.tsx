import { useToast } from '@/contexts/ToastContext'

// Componente de botão simples para não depender de shadcn
function Button({ 
  onClick, 
  children, 
  variant = 'default', 
  className = '' 
}: { 
  onClick: () => void, 
  children: React.ReactNode, 
  variant?: 'default' | 'outline', 
  className?: string 
}) {
  const baseClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500"
  }
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function ToastDemo() {
  const { toast } = useToast()

  const showDefaultToast = () => {
    toast({
      title: 'Notificação padrão',
      description: 'Esta é uma notificação informativa',
      variant: 'default'
    })
  }

  const showSuccessToast = () => {
    toast({
      title: 'Operação concluída',
      description: 'A operação foi concluída com sucesso',
      variant: 'success'
    })
  }

  const showWarningToast = () => {
    toast({
      title: 'Atenção',
      description: 'Esta operação pode levar algum tempo',
      variant: 'warning'
    })
  }

  const showErrorToast = () => {
    toast({
      title: 'Erro',
      description: 'Ocorreu um erro ao processar sua solicitação',
      variant: 'destructive'
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Demonstração de Notificações</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Clique nos botões abaixo para testar os diferentes tipos de notificações
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={showDefaultToast} variant="outline">
          Notificação Padrão
        </Button>
        <Button onClick={showSuccessToast} variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
          Notificação de Sucesso
        </Button>
        <Button onClick={showWarningToast} variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
          Notificação de Aviso
        </Button>
        <Button onClick={showErrorToast} variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
          Notificação de Erro
        </Button>
      </div>
    </div>
  )
} 