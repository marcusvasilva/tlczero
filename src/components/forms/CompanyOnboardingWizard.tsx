import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, User, MapPin, Check, ArrowRight, Loader2, Copy, CheckCircle } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { useUsers } from '@/hooks/useUsers'
import { useClientSpaces } from '@/hooks/useSpaces'
import { useToast } from '@/contexts/ToastContext'
import { formatPhone } from '@/lib/formatters'
import { validatePhone } from '@/lib/validations'
import { generateTemporaryPassword } from '@/lib/utils'

// Schema de validação para cada etapa
const companySchema = z.object({
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  contact_person: z.string().min(2, 'Nome do responsável deve ter pelo menos 2 caracteres'),
  phone: z.string().refine(validatePhone, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cnpj: z.string().optional(), // CNPJ agora é opcional
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  cep: z.string().optional(),
})

const supervisorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().refine(validatePhone, 'Telefone inválido').optional().or(z.literal('')),
  cpf: z.string().optional(),
})

const spaceSchema = z.object({
  name: z.string().min(2, 'Nome do espaço deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  area_size: z.number().positive('Área deve ser maior que 0').optional(),
  environment_type: z.enum(['indoor', 'outdoor', 'mixed']),
})

type CompanyFormData = z.infer<typeof companySchema>
type SupervisorFormData = z.infer<typeof supervisorSchema>
type SpaceFormData = z.infer<typeof spaceSchema>

interface CompanyOnboardingWizardProps {
  onComplete: () => void
  onCancel: () => void
}

export function CompanyOnboardingWizard({ onComplete, onCancel }: CompanyOnboardingWizardProps) {
  const { toast } = useToast()
  const { createClient } = useClients()
  const { createUser } = useUsers()
  const { createSpace } = useClientSpaces()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null)
  const [supervisorData, setSupervisorData] = useState<SupervisorFormData | null>(null)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [credentialsCopied, setCredentialsCopied] = useState(false)

  // Forms para cada etapa
  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      cnpj: '',
      address: '',
      city: '',
      state: '',
      cep: '',
    }
  })

  const supervisorForm = useForm<SupervisorFormData>({
    resolver: zodResolver(supervisorSchema),
    defaultValues: {
      name: companyData?.contact_person || '',
      email: companyData?.email || '',
      phone: companyData?.phone || '',
      cpf: '',
    }
  })

  const spaceForm = useForm<SpaceFormData>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: 'Área Principal',
      description: '',
      area_size: undefined,
      environment_type: 'indoor',
    }
  })

  // Navegar entre etapas
  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handlers para cada etapa
  const handleCompanySubmit = async (data: CompanyFormData) => {
    setCompanyData(data)
    // Pré-preencher dados do supervisor com dados da empresa
    supervisorForm.setValue('name', data.contact_person)
    if (data.email) supervisorForm.setValue('email', data.email)
    supervisorForm.setValue('phone', data.phone)
    goToNextStep()
  }

  const handleSupervisorSubmit = async (data: SupervisorFormData) => {
    setSupervisorData(data)
    goToNextStep()
  }

  const handleSpaceSubmit = async (data: SpaceFormData) => {
    setIsSubmitting(true)
    
    try {
      // 1. Criar a empresa
      if (!companyData) throw new Error('Dados da empresa não encontrados')
      
      toast({
        title: 'Criando empresa...',
        description: 'Configurando dados da empresa',
        variant: 'default'
      })
      
      const createdCompany = await createClient({
        ...companyData,
        status: 'active',
        distributor_id: null // Será preenchido automaticamente pelo hook baseado no usuário logado
      } as any)
      
      // 2. Criar o supervisor
      if (!supervisorData) throw new Error('Dados do supervisor não encontrados')
      
      toast({
        title: 'Criando supervisor...',
        description: 'Configurando acesso do supervisor',
        variant: 'default'
      })
      
      // Gerar senha temporária
      const tempPassword = generateTemporaryPassword(12)
      
      const userResult = await createUser({
        name: supervisorData.name,
        email: supervisorData.email,
        password: tempPassword,
        role: 'supervisor',
        account_id: createdCompany.id,
        phone: supervisorData.phone,
        cpf: supervisorData.cpf,
      })
      
      // Salvar credenciais para mostrar no final
      setCredentials({
        email: supervisorData.email,
        password: userResult.credentials?.password || tempPassword
      })
      
      // 3. Criar o espaço inicial
      toast({
        title: 'Criando espaço...',
        description: 'Configurando primeiro espaço de monitoramento',
        variant: 'default'
      })
      
      await createSpace({
        name: data.name,
        description: data.description,
        areaSize: data.area_size,
        environmentType: data.environment_type,
        accountId: createdCompany.id,
        qrCodeEnabled: true
      })
      
      toast({
        title: 'Empresa criada com sucesso!',
        description: 'Todos os dados foram configurados',
        variant: 'success'
      })
      
      goToNextStep()
      
    } catch (error) {
      console.error('Erro no onboarding:', error)
      toast({
        title: 'Erro ao criar empresa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copiar credenciais
  const copyCredentials = () => {
    if (!credentials) return
    
    const text = `Email: ${credentials.email}\nSenha: ${credentials.password}`
    navigator.clipboard.writeText(text)
    setCredentialsCopied(true)
    
    setTimeout(() => {
      setCredentialsCopied(false)
    }, 3000)
    
    toast({
      title: 'Credenciais copiadas!',
      description: 'As credenciais foram copiadas para a área de transferência',
      variant: 'success'
    })
  }

  // Formatadores de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, formType: 'company' | 'supervisor') => {
    const formatted = formatPhone(e.target.value)
    if (formType === 'company') {
      companyForm.setValue('phone', formatted)
    } else {
      supervisorForm.setValue('phone', formatted)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header com progresso */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Nova Empresa - Configuração Completa
          </h2>
          
          {/* Indicador de progresso */}
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Empresa', icon: Building2 },
              { step: 2, label: 'Supervisor', icon: User },
              { step: 3, label: 'Espaço', icon: MapPin },
              { step: 4, label: 'Concluído', icon: Check },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep >= item.step
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-1 mx-2 transition-colors ${
                    currentStep > item.step ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2">
            {['Dados da Empresa', 'Criar Supervisor', 'Primeiro Espaço', 'Tudo Pronto!'].map((label, index) => (
              <span key={index} className={`text-xs ${
                currentStep >= index + 1 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'
              }`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Conteúdo das etapas */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Etapa 1: Dados da Empresa */}
          {currentStep === 1 && (
            <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  {...companyForm.register('company_name')}
                  className="w-full input-responsive"
                  placeholder="Digite o nome da empresa"
                />
                {companyForm.formState.errors.company_name && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.company_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Responsável *
                </label>
                <input
                  {...companyForm.register('contact_person')}
                  className="w-full input-responsive"
                  placeholder="Nome da pessoa responsável"
                />
                {companyForm.formState.errors.contact_person && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.contact_person.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone *
                </label>
                <input
                  {...companyForm.register('phone')}
                  onChange={(e) => handlePhoneChange(e, 'company')}
                  className="w-full input-responsive"
                  placeholder="(11) 99999-9999"
                />
                {companyForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    {...companyForm.register('email')}
                    type="email"
                    className="w-full input-responsive"
                    placeholder="empresa@exemplo.com"
                  />
                  {companyForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{companyForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CNPJ <span className="text-gray-500 text-xs">(opcional)</span>
                  </label>
                  <input
                    {...companyForm.register('cnpj')}
                    className="w-full input-responsive"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Endereço <span className="text-gray-500">(opcional)</span>
                </h3>
                
                <div className="space-y-4">
                  <textarea
                    {...companyForm.register('address')}
                    rows={2}
                    className="w-full textarea-responsive"
                    placeholder="Endereço completo"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      {...companyForm.register('city')}
                      className="w-full input-responsive"
                      placeholder="Cidade"
                    />
                    <input
                      {...companyForm.register('state')}
                      className="w-full input-responsive"
                      placeholder="Estado"
                      maxLength={2}
                    />
                    <input
                      {...companyForm.register('cep')}
                      className="w-full input-responsive"
                      placeholder="CEP"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Etapa 2: Criar Supervisor */}
          {currentStep === 2 && (
            <form onSubmit={supervisorForm.handleSubmit(handleSupervisorSubmit)} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Supervisor Principal
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Este será o usuário principal da empresa, com acesso total aos dados e configurações.
                  Uma senha temporária será gerada automaticamente.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  {...supervisorForm.register('name')}
                  className="w-full input-responsive"
                  placeholder="Nome do supervisor"
                />
                {supervisorForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{supervisorForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  {...supervisorForm.register('email')}
                  type="email"
                  className="w-full input-responsive"
                  placeholder="supervisor@empresa.com"
                />
                {supervisorForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{supervisorForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefone
                  </label>
                  <input
                    {...supervisorForm.register('phone')}
                    onChange={(e) => handlePhoneChange(e, 'supervisor')}
                    className="w-full input-responsive"
                    placeholder="(11) 99999-9999"
                  />
                  {supervisorForm.formState.errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{supervisorForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CPF <span className="text-gray-500 text-xs">(opcional)</span>
                  </label>
                  <input
                    {...supervisorForm.register('cpf')}
                    className="w-full input-responsive"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </form>
          )}

          {/* Etapa 3: Primeiro Espaço */}
          {currentStep === 3 && (
            <form onSubmit={spaceForm.handleSubmit(handleSpaceSubmit)} className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">
                  Configure o Primeiro Espaço
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Espaços são locais onde o produto TLC Agro é aplicado. Você pode adicionar mais espaços depois.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Espaço *
                </label>
                <input
                  {...spaceForm.register('name')}
                  className="w-full input-responsive"
                  placeholder="Ex: Área de Produção, Galpão 1"
                />
                {spaceForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{spaceForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <textarea
                  {...spaceForm.register('description')}
                  rows={3}
                  className="w-full textarea-responsive"
                  placeholder="Descreva o espaço..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Ambiente *
                  </label>
                  <select
                    {...spaceForm.register('environment_type')}
                    className="w-full input-responsive"
                  >
                    <option value="indoor">Interno</option>
                    <option value="outdoor">Externo</option>
                    <option value="mixed">Misto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Área (m²) <span className="text-gray-500 text-xs">(opcional)</span>
                  </label>
                  <input
                    {...spaceForm.register('area_size', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full input-responsive"
                    placeholder="100.00"
                  />
                  {spaceForm.formState.errors.area_size && (
                    <p className="mt-1 text-sm text-red-600">{spaceForm.formState.errors.area_size.message}</p>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Etapa 4: Conclusão */}
          {currentStep === 4 && credentials && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Empresa Criada com Sucesso!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Todos os dados foram configurados e o supervisor já pode acessar o sistema.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h4 className="font-medium text-green-900 dark:text-green-300 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Credenciais do Supervisor
                </h4>
                
                <div className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                    <p className="font-mono text-gray-900 dark:text-white">{credentials.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Senha Temporária:</span>
                    <p className="font-mono text-gray-900 dark:text-white">{credentials.password}</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {credentialsCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Credenciais
                    </>
                  )}
                </button>
                
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>Importante:</strong> O supervisor deverá alterar a senha no primeiro acesso.
                    As credenciais também foram enviadas por email.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Próximos Passos:</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Compartilhe as credenciais com o supervisor da empresa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>O supervisor pode adicionar mais usuários e espaços</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Configure os QR Codes para coleta de dados nos espaços</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={currentStep === 1 ? onCancel : goToPreviousStep}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSubmitting || currentStep === 4}
            >
              {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </button>

            {currentStep < 4 ? (
              <button
                type="submit"
                form={currentStep === 1 ? 'company-form' : currentStep === 2 ? 'supervisor-form' : 'space-form'}
                onClick={
                  currentStep === 1 ? companyForm.handleSubmit(handleCompanySubmit) :
                  currentStep === 2 ? supervisorForm.handleSubmit(handleSupervisorSubmit) :
                  spaceForm.handleSubmit(handleSpaceSubmit)
                }
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    Finalizar
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}