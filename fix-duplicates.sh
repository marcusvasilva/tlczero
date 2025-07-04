#!/bin/bash

# Script para corrigir propriedades duplicadas

echo "Corrigindo propriedades duplicadas..."

# Corrigir CollectionForm.tsx
sed -i '' 's/      clientId: "",//g' src/components/forms/CollectionForm.tsx

# Corrigir Collect.tsx
sed -i '' 's/        clientId: space?.clientId || "",//g' src/pages/Collect.tsx

# Corrigir useOfflineSync.ts
sed -i '' 's/            clientId: collection.clientId || "",\n            collectedAt: new Date(collection.createdAt),//g' src/hooks/useOfflineSync.ts

# Corrigir PwaDemo.tsx
sed -i '' 's/      clientId: "demo-client-1",//g' src/pages/PwaDemo.tsx

echo "Feito! Execute 'npm run build' para verificar se todos os erros foram corrigidos."
