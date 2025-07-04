#!/bin/bash

# Script para corrigir erros TypeScript restantes no projeto TLC Zero

echo "Corrigindo erros TypeScript restantes..."

# Corrigir ToastContext.tsx
sed -i '' 's/import React, { createContext/import { createContext/g' src/contexts/ToastContext.tsx

# Corrigir useApi.ts
sed -i '' 's/data: response.data,/data: response.data || null,/g' src/hooks/useApi.ts

# Corrigir useOfflineSync.ts
sed -i '' 's/const collectionData = {/const collectionData = {\n            clientId: collection.clientId || "",/g' src/hooks/useOfflineSync.ts
sed -i '' 's/photo: collection.photo,/photoUrl: collection.photo,/g' src/hooks/useOfflineSync.ts
sed -i '' 's/notes: collection.notes/observations: collection.notes/g' src/hooks/useOfflineSync.ts
sed -i '' 's/collectedAt: new Date()/collectedAt: new Date(collection.createdAt || Date.now())/g' src/hooks/useOfflineSync.ts

# Corrigir Reports.tsx
sed -i '' 's/import React, { useState, useMemo }/import { useState, useMemo }/g' src/pages/Reports.tsx

# Corrigir Spaces.tsx
sed -i '' 's/getSpacesByClient/\/\/ getSpacesByClient/g' src/pages/Spaces.tsx

echo "Feito! Execute 'npm run build' para verificar se todos os erros foram corrigidos." 