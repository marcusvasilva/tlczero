#!/bin/bash

# Script para corrigir todos os erros TypeScript do projeto TLC Zero

echo "Corrigindo todos os erros TypeScript..."

# Corrigir ThemeToggle.tsx
sed -i '' 's/const { theme, actualTheme, setTheme } = useTheme()/const { theme, setTheme } = useTheme()/g' src/components/common/ThemeToggle.tsx

# Corrigir CollectionForm.tsx
sed -i '' 's/import { formatWeight, formatDateTime } from "@\/lib\/formatters"//g' src/components/forms/CollectionForm.tsx
sed -i '' 's/import { WEIGHT_LIMITS } from "@\/lib\/constants"//g' src/components/forms/CollectionForm.tsx
sed -i '' 's/const selectedClient = selectedSpace ? clientsMap\[selectedSpace.clientId\] : null//g' src/components/forms/CollectionForm.tsx
sed -i '' 's/initialValues: {/initialValues: {\n      clientId: "",/g' src/components/forms/CollectionForm.tsx

# Corrigir AppHeader.tsx
sed -i '' 's/import React, { useState } from "react"/import { useState } from "react"/g' src/components/layout/AppHeader.tsx

# Corrigir useApi.ts
sed -i '' 's/return response.data/return response.data || null/g' src/hooks/useApi.ts

# Corrigir useCollections.ts
sed -i '' 's/const \[clientFilter, setClientFilter\] = useState(options.clientId || "")/const [clientFilter] = useState(options.clientId || "")/g' src/hooks/useCollections.ts

# Corrigir Clients.tsx
sed -i '' 's/import React, { useState, useMemo } from "react"/import { useState, useMemo } from "react"/g' src/pages/Clients.tsx
sed -i '' 's/Eye,//g' src/pages/Clients.tsx

# Corrigir Collect.tsx
sed -i '' 's/X,//g' src/pages/Collect.tsx
sed -i '' 's/const collectionData: CreateCollectionData = {/const collectionData: CreateCollectionData = {\n        clientId: space?.clientId || "",/g' src/pages/Collect.tsx
sed -i '' 's/clientId: space?.client?.id || ""/\/\/ clientId já definido acima/g' src/pages/Collect.tsx

# Corrigir Dashboard.tsx
sed -i '' 's/TrendingDown,//g' src/pages/Dashboard.tsx
sed -i '' 's/AreaChart,\n  Area,//g' src/pages/Dashboard.tsx

# Corrigir Login.tsx
sed -i '' 's/clearError: clearFormError//g' src/pages/Login.tsx

# Corrigir Operators.tsx
sed -i '' 's/Filter,//g' src/pages/Operators.tsx
sed -i '' 's/const \[selectedOperator, setSelectedOperator\] = useState<Operator | null>(null)//g' src/pages/Operators.tsx

# Corrigir Reports.tsx
sed -i '' 's/import React, { useState, useMemo } from "react"/import { useState, useMemo } from "react"/g' src/pages/Reports.tsx

# Corrigir Spaces.tsx
sed -i '' 's/import React, { useState, useMemo } from "react"/import { useState, useMemo } from "react"/g' src/pages/Spaces.tsx
sed -i '' 's/formatDateTime,//g' src/pages/Spaces.tsx
sed -i '' 's/Filter,//g' src/pages/Spaces.tsx
sed -i '' 's/UserCheck,\n  UserX,//g' src/pages/Spaces.tsx
sed -i '' 's/Eye,//g' src/pages/Spaces.tsx
sed -i '' 's/inactiveSpaces,\n    getSpacesByClient//g' src/pages/Spaces.tsx

# Corrigir PwaDemo.tsx
sed -i '' 's/addOfflineCollection({/addOfflineCollection({\n      clientId: "demo-client-1",/g' src/pages/PwaDemo.tsx

# Corrigir ToastContext.tsx
sed -i '' 's/import React, { createContext/import { createContext/g' src/contexts/ToastContext.tsx

# Corrigir useOfflineSync.ts
sed -i '' 's/const collectionData = {/const collectionData = {\n            clientId: collection.clientId || "",\n            collectedAt: new Date(collection.createdAt),/g' src/hooks/useOfflineSync.ts
sed -i '' 's/photo: collection.photo,/photoUrl: collection.photo,/g' src/hooks/useOfflineSync.ts
sed -i '' 's/notes: collection.notes/observations: collection.notes/g' src/hooks/useOfflineSync.ts

echo "Feito! Execute 'npm run build' para verificar se todos os erros foram corrigidos."
