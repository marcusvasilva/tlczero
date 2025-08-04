# Otimizações de Performance - TLC Zero

## Melhorias Implementadas

### 1. Sistema de Cache Local
- Cache automático de dados com TTL (Time To Live) configurável
- Dados salvos no localStorage para persistência entre recarregamentos
- Revalidação automática em background para dados antigos
- Reduz drasticamente as chamadas ao banco de dados

### 2. Configuração Otimizada de Timeouts
- Timeout reduzido de 15s para 10s para falhar mais rápido
- Menos tentativas de retry (de 3 para 2) para evitar espera desnecessária
- Backoff exponencial com limite máximo de 5 segundos
- Timeouts específicos por tipo de operação

### 3. Monitoramento Inteligente de Conexão
- Detecção automática de problemas de conectividade
- Indicador visual de status de conexão
- Botão de retry manual quando houver falhas
- Verificação adaptativa baseada no status da conexão

### 4. Melhorias no Cliente Supabase
- Headers customizados para melhor rastreamento
- Pool de conexões otimizado
- Abort controller para cancelar requisições que demoram muito
- Cache de sessão no localStorage

## Configurações Ajustáveis

As configurações de performance podem ser ajustadas no arquivo `src/config/performance.ts`:

```typescript
// Timeouts
timeouts: {
  query: 10000,        // Queries gerais
  quickCheck: 3000,    // Verificações rápidas
  auth: 5000,          // Autenticação
  upload: 30000,       // Upload de arquivos
}

// Retry
retry: {
  maxAttempts: 2,      // Tentativas máximas
  initialDelay: 500,   // Delay inicial
  maxDelay: 5000,      // Delay máximo
}

// Cache
cache: {
  defaultTTL: 5 * 60 * 1000,  // 5 minutos
  shortTTL: 30 * 1000,        // 30 segundos
  longTTL: 30 * 60 * 1000,    // 30 minutos
}
```

## Como Resolver Problemas de Conexão

### Para Usuários:

1. **Quando ver erro de timeout:**
   - Aguarde o botão de "Tentar novamente" aparecer
   - Clique para tentar reconectar
   - Se não funcionar, recarregue a página (F5 ou Cmd+R)

2. **Se a aplicação está lenta:**
   - Verifique sua conexão com a internet
   - O sistema tentará usar dados em cache automaticamente
   - Aguarde alguns segundos para a reconexão automática

3. **Indicadores visuais:**
   - 🟢 Verde = Conectado e funcionando
   - 🟡 Amarelo = Conectando ou verificando
   - 🔴 Vermelho = Sem conexão

### Para Desenvolvedores:

1. **Ajustar timeouts:**
   - Edite `src/config/performance.ts`
   - Aumente valores se a conexão for lenta
   - Diminua para falhar mais rápido em redes rápidas

2. **Debug de conexão:**
   - Abra o console do navegador (F12)
   - Procure por mensagens com emojis:
     - ✅ = Sucesso
     - ❌ = Erro
     - 🔄 = Tentando novamente
     - ⏱️ = Timeout

3. **Limpar cache:**
   ```javascript
   // No console do navegador:
   localStorage.clear()
   location.reload()
   ```

## Monitoramento

O sistema agora inclui:
- Logs detalhados de todas as tentativas de conexão
- Contadores de falhas consecutivas
- Tempo de resposta de cada operação
- Cache hit/miss ratio

## Próximas Melhorias Sugeridas

1. **Implementar Service Worker** para funcionar offline
2. **Comprimir dados** grandes antes de enviar
3. **Paginação inteligente** com prefetch
4. **Queue de operações** para sincronizar quando voltar online
5. **Índices no banco** para queries mais rápidas