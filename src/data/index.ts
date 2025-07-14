// Arquivo mantido para compatibilidade
// Os dados agora vêm do Supabase através dos hooks

// Função auxiliar para contagem de dados (agora deve ser implementada pelos hooks)
export const getDataCounts = () => ({
  totalClients: 0,
  totalSpaces: 0,
  totalOperators: 0,
  totalCollections: 0
})

// Função para gerar dados de demonstração (removida - dados vêm do Supabase)
export const generateMockData = () => ({
  clients: [],
  operators: [],
  spaces: [],
  collections: [],
  users: []
}) 