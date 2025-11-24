// Configurações de performance da aplicação

export const performanceConfig = {
  // Timeouts em milissegundos
  timeouts: {
    query: 30000,        // Timeout padrão para queries (30s) - aumentado
    quickCheck: 8000,    // Timeout para verificações rápidas (8s)
    auth: 10000,         // Timeout para operações de auth (10s)
    upload: 60000,       // Timeout para uploads (60s)
  },
  
  // Configurações de retry
  retry: {
    maxAttempts: 1,      // Número máximo de tentativas - reduzido para evitar espera longa
    initialDelay: 1000,  // Delay inicial em ms
    maxDelay: 3000,      // Delay máximo em ms
    backoffMultiplier: 1.5, // Multiplicador para backoff exponencial
  },
  
  // Configurações de cache
  cache: {
    defaultTTL: 5 * 60 * 1000,     // TTL padrão (5 minutos)
    shortTTL: 30 * 1000,           // TTL curto (30 segundos)
    longTTL: 30 * 60 * 1000,       // TTL longo (30 minutos)
    staleWhileRevalidate: true,    // Usar dados antigos enquanto revalida
    maxCacheSize: 50,              // Número máximo de itens no cache
  },
  
  // Configurações de monitoramento
  monitoring: {
    checkInterval: 60000,          // Intervalo de verificação (1 minuto)
    quickCheckInterval: 30000,     // Intervalo rápido (30 segundos)
    maxConsecutiveFailures: 3,     // Falhas consecutivas antes de alertar
    activityTimeout: 30000,        // Timeout de atividade do usuário (30s)
  },
  
  // Configurações de paginação
  pagination: {
    defaultPageSize: 20,           // Tamanho padrão da página
    maxPageSize: 100,              // Tamanho máximo da página
    prefetchNext: true,            // Pré-carregar próxima página
  },
  
  // Otimizações específicas por ambiente
  optimization: {
    // Usar batch requests quando possível
    useBatchRequests: true,
    
    // Comprimir dados grandes
    compressLargeData: true,
    compressionThreshold: 1024 * 10, // 10KB
    
    // Lazy loading de componentes
    lazyLoadThreshold: 300,        // ms antes de mostrar loading
    
    // Debounce para inputs de busca
    searchDebounce: 300,           // ms
  }
}

// Função para obter configuração baseada no ambiente
export function getPerformanceConfig() {
  const isDevelopment = import.meta.env.DEV
  const isProduction = import.meta.env.PROD
  
  if (isDevelopment) {
    // Em desenvolvimento, usar timeouts mais longos
    return {
      ...performanceConfig,
      timeouts: {
        ...performanceConfig.timeouts,
        query: 45000,       // 45s em desenvolvimento
        quickCheck: 10000,  // 10s para checks rápidos
      }
    }
  }
  
  if (isProduction) {
    // Em produção, otimizar para performance
    return {
      ...performanceConfig,
      retry: {
        ...performanceConfig.retry,
        maxAttempts: 3,
      },
      cache: {
        ...performanceConfig.cache,
        defaultTTL: 10 * 60 * 1000, // 10 minutos em produção
      }
    }
  }
  
  return performanceConfig
}

// Função helper para criar configuração de timeout
export function createTimeoutConfig(operation: keyof typeof performanceConfig.timeouts) {
  const config = getPerformanceConfig()
  return {
    timeout: config.timeouts[operation] || config.timeouts.query,
    maxRetries: config.retry.maxAttempts,
    retryDelay: config.retry.initialDelay,
  }
}