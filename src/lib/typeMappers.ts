import type { Tables } from '@/types/database'
import type { Account, User, Space, Collection } from '@/types'

// Mapear Account do Supabase para tipo legado Client (compatibilidade)
export const mapSupabaseAccountToLegacy = (supabaseAccount: Tables<'accounts'>): Account => {
  return {
    id: supabaseAccount.id,
    company_name: supabaseAccount.company_name,
    contact_person: supabaseAccount.contact_person,
    phone: supabaseAccount.phone,
    email: supabaseAccount.email || '',
    address: supabaseAccount.address || '',
    city: supabaseAccount.city || '',
    state: supabaseAccount.state || '',
    cep: supabaseAccount.cep || '',
    cnpj: supabaseAccount.cnpj || '',
    status: supabaseAccount.status,
    created_at: supabaseAccount.created_at,
    updated_at: supabaseAccount.updated_at
  }
}

// Mapear User do Supabase para tipo legado
export const mapSupabaseUserToLegacy = (supabaseUser: Tables<'users'>): User => {
  console.log('🔄 Mapeando usuário do Supabase:', supabaseUser)
  
  const mappedUser: User = {
    id: supabaseUser.id,
    name: supabaseUser.name,
    email: supabaseUser.email,
    phone: supabaseUser.phone,
    cpf: supabaseUser.cpf,
    role: supabaseUser.role as 'admin' | 'supervisor' | 'operator',
    account_id: supabaseUser.account_id,
    supervisor_id: supabaseUser.supervisor_id,
    status: supabaseUser.status || 'active',
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at,
    password_change_required: supabaseUser.password_change_required || false
  }
  
  console.log('📤 Usuário mapeado para frontend:', mappedUser)
  return mappedUser
}

// Mapear Espaço do Supabase para tipo legado
export const mapSupabaseSpaceToLegacy = (supabaseSpace: Tables<'spaces'>): Space => {
  return {
    id: supabaseSpace.id,
    name: supabaseSpace.name,
    clientId: supabaseSpace.account_id, // Compatibilidade: account_id -> clientId
    accountId: supabaseSpace.account_id, // Novo campo
    description: supabaseSpace.description || '',
    areaSize: supabaseSpace.area_size || undefined,
    environmentType: supabaseSpace.environment_type as 'indoor' | 'outdoor' | 'mixed' || 'indoor',
    active: supabaseSpace.status === 'active',
    createdAt: supabaseSpace.created_at ? new Date(supabaseSpace.created_at) : new Date(),
    updatedAt: supabaseSpace.updated_at ? new Date(supabaseSpace.updated_at) : new Date()
  }
}

// Mapear Coleta do Supabase para tipo legado
export const mapSupabaseCollectionToLegacy = (supabaseCollection: Tables<'collections'>): Collection => {
  console.log('🔄 Mapeando coleta do Supabase:', supabaseCollection)
  
  const mappedCollection = {
    id: supabaseCollection.id,
    spaceId: supabaseCollection.space_id,
    operatorId: supabaseCollection.user_id, // user_id -> operatorId para compatibilidade
    userId: supabaseCollection.user_id, // Novo campo
    clientId: '', // Precisa ser buscado via join com spaces
    weight: supabaseCollection.weight_collected, // Compatibilidade
    weightCollected: supabaseCollection.weight_collected, // Novo campo
    photoUrl: supabaseCollection.photo_url || '',
    observations: supabaseCollection.notes || '', // Compatibilidade
    notes: supabaseCollection.notes || '', // Novo campo
    collectedAt: new Date(supabaseCollection.collection_date), // Compatibilidade
    collectionDate: supabaseCollection.collection_date, // Novo campo
    temperature: supabaseCollection.temperature,
    humidity: supabaseCollection.humidity,
    createdAt: supabaseCollection.created_at ? new Date(supabaseCollection.created_at) : new Date(),
    updatedAt: supabaseCollection.updated_at ? new Date(supabaseCollection.updated_at) : new Date()
  }
  
  console.log('📤 Coleta mapeada para frontend:', mappedCollection)
  return mappedCollection
}

// Mapear tipo legado para Supabase (para criação/atualização)
export const mapLegacyAccountToSupabase = (account: Partial<Account>) => {
  console.log('🔄 Mapeando conta para Supabase:', account)
  
  const supabaseData = {
    company_name: account.company_name || '',
    contact_person: account.contact_person || '',
    phone: account.phone || '',
    email: account.email || null,
    address: account.address || null,
    city: account.city || null,
    state: account.state || null,
    cep: account.cep || null,
    cnpj: account.cnpj || null,
    status: account.status || 'active'
  }
  
  console.log('📤 Dados convertidos para Supabase:', supabaseData)
  return supabaseData
}

export const mapLegacyUserToSupabase = (user: Partial<User>) => {
  console.log('🔄 Mapeando usuário para Supabase:', user)
  
  const supabaseData = {
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || null,
    cpf: user.cpf || null,
    role: user.role || 'operator',
    account_id: user.account_id || null,
    supervisor_id: user.supervisor_id || null,
    status: user.status || 'active'
  }
  
  console.log('📤 Dados de usuário convertidos para Supabase:', supabaseData)
  return supabaseData
}

export const mapLegacySpaceToSupabase = (space: Partial<Space>) => {
  console.log('🔄 Mapeando espaço para Supabase:', space)
  
  const supabaseData = {
    name: space.name || '',
    account_id: space.accountId || space.clientId || '', // Suporta ambos os campos
    description: space.description || null,
    area_size: space.areaSize || null,
    environment_type: space.environmentType || 'indoor',
    status: space.active ? 'active' : 'inactive'
  }
  
  console.log('📤 Dados de espaço convertidos para Supabase:', supabaseData)
  return supabaseData
}

// Mapear Coleta do tipo legado para Supabase
export const mapLegacyCollectionToSupabase = (collection: Partial<Collection>) => {
  console.log('🔄 Mapeando coleta para Supabase:', collection)
  
  const supabaseData = {
    space_id: collection.spaceId || '',
    user_id: collection.userId || collection.operatorId || '', // Suporta ambos os campos
    weight_collected: collection.weightCollected || collection.weight || 0, // Suporta ambos os campos
    photo_url: collection.photoUrl || null,
    notes: collection.notes || collection.observations || null, // Suporta ambos os campos
    collection_date: collection.collectionDate || collection.collectedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    temperature: collection.temperature || null,
    humidity: collection.humidity || null
  }
  
  console.log('📤 Dados de coleta convertidos para Supabase:', supabaseData)
  return supabaseData
}

// Para compatibilidade com código existente
export const mapSupabaseClientToLegacy = mapSupabaseAccountToLegacy
export const mapSupabaseOperatorToLegacy = mapSupabaseUserToLegacy
export const mapLegacyClientToSupabase = mapLegacyAccountToSupabase
export const mapLegacyOperatorToSupabase = mapLegacyUserToSupabase 