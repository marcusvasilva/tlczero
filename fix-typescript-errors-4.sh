#!/bin/bash

# Script para corrigir os erros TypeScript restantes no projeto TLC Zero

echo "Corrigindo erros TypeScript restantes..."

# Corrigir serviceWorker.ts - corrigir interface PendingCollection
sed -i '' 's/export interface PendingCollection {/export interface PendingCollection {\n  id: string;\n  clientId: string;/g' src/lib/serviceWorker.ts
sed -i '' 's/  id: string/  \/\/ id: string/g' src/lib/serviceWorker.ts

# Corrigir Collect.tsx - remover clientId duplicado
sed -i '' 's/        clientId: space?.client?.id || '\'\''/        \/\/ clientId já definido acima/g' src/pages/Collect.tsx

# Corrigir PwaDemo.tsx - adicionar clientId
sed -i '' 's/    addOfflineCollection({/    addOfflineCollection({\n      clientId: "demo-client-1",/g' src/pages/PwaDemo.tsx

echo "Feito! Execute 'npm run build' para verificar se todos os erros foram corrigidos." 