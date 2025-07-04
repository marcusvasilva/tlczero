#!/bin/bash

# Script para corrigir erros TypeScript no projeto TLC Zero

echo "Corrigindo erros TypeScript..."

# ThemeToggle.tsx - Remover actualTheme não utilizado
sed -i '' 's/const { theme, actualTheme, setTheme } = useTheme()/const { theme, setTheme } = useTheme()/g' src/components/common/ThemeToggle.tsx

# CollectionForm.tsx - Adicionar clientId
sed -i '' 's/initialValues: {/initialValues: {\n      clientId: "",/g' src/components/forms/CollectionForm.tsx

# Collect.tsx - Adicionar clientId
sed -i '' 's/const collectionData: CreateCollectionData = {/const collectionData: CreateCollectionData = {\n        clientId: space?.clientId || "",/g' src/pages/Collect.tsx

# AppHeader.tsx - Remover import não utilizado
sed -i '' 's/import React, { useState } from "react"/import { useState } from "react"/g' src/components/layout/AppHeader.tsx

# useCollections.ts - Remover setClientFilter não utilizado
sed -i '' 's/const \[clientFilter, setClientFilter\] = useState(options.clientId || "")/const [clientFilter] = useState(options.clientId || "")/g' src/hooks/useCollections.ts

# Clients.tsx - Remover imports não utilizados
sed -i '' 's/import React, { useState, useMemo } from "react"/import { useState, useMemo } from "react"/g' src/pages/Clients.tsx
sed -i '' 's/Eye,//g' src/pages/Clients.tsx

# Dashboard.tsx - Remover imports não utilizados
sed -i '' 's/TrendingDown,//g' src/pages/Dashboard.tsx
sed -i '' 's/AreaChart,\n  Area,//g' src/pages/Dashboard.tsx

# Login.tsx - Remover clearFormError não utilizado
sed -i '' 's/clearError: clearFormError//g' src/pages/Login.tsx

# Operators.tsx - Remover imports e variáveis não utilizadas
sed -i '' 's/Filter,//g' src/pages/Operators.tsx
sed -i '' 's/const \[selectedOperator, setSelectedOperator\] = useState<Operator | null>(null)//g' src/pages/Operators.tsx

# Spaces.tsx - Remover imports e variáveis não utilizadas
sed -i '' 's/import React, { useState, useMemo } from "react"/import { useState, useMemo } from "react"/g' src/pages/Spaces.tsx
sed -i '' 's/formatDateTime,//g' src/pages/Spaces.tsx
sed -i '' 's/Filter,//g' src/pages/Spaces.tsx
sed -i '' 's/UserCheck,\n  UserX,//g' src/pages/Spaces.tsx
sed -i '' 's/Eye,//g' src/pages/Spaces.tsx
sed -i '' 's/inactiveSpaces,\n    getSpacesByClient//g' src/pages/Spaces.tsx

echo "Feito! Execute 'npm run build' para verificar se todos os erros foram corrigidos." 