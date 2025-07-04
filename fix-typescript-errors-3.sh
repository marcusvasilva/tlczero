#!/bin/bash

# Script para corrigir os erros TypeScript restantes no projeto TLC Zero

echo "Corrigindo erros TypeScript restantes..."

# Corrigir CollectionForm.tsx - remover clientId duplicado
sed -i '' 's/      clientId: "",//g' src/components/forms/CollectionForm.tsx

# Corrigir Collect.tsx - remover clientId duplicado
sed -i '' 's/        clientId: space?.client?.id || ""//g' src/pages/Collect.tsx

# Corrigir useApi.ts - garantir que execute sempre retorne T | null
sed -i '' 's/return response.data/return response.data || null/g' src/hooks/useApi.ts

# Corrigir useOfflineSync.ts - adicionar collectedAt e corrigir propriedades
sed -i '' 's/const collectionData = {/const collectionData = {/g' src/hooks/useOfflineSync.ts
sed -i '' 's/            spaceId: collection.spaceId,/            spaceId: collection.spaceId,\n            collectedAt: new Date(collection.createdAt),/g' src/hooks/useOfflineSync.ts
sed -i '' 's/photoUrl: collection.photo,/photoUrl: collection.photo,/g' src/hooks/useOfflineSync.ts
sed -i '' 's/observations: collection.notes/observations: collection.notes/g' src/hooks/useOfflineSync.ts

# Corrigir serviceWorker.ts - adicionar clientId à interface PendingCollection
sed -i '' 's/export interface PendingCollection {/export interface PendingCollection {\n  id: string\n  clientId: string/g' src/lib/serviceWorker.ts
sed -i '' 's/  id: string//g' src/lib/serviceWorker.ts

echo "Feito! Execute 'npm run build' para verificar se todos os erros foram corrigidos." 