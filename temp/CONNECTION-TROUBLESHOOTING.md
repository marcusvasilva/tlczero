# Solução de Problemas de Conexão - TLC Zero

## Problema: Timeout de Conexão / Query timeout após 25-30 segundos

### Sintomas
- Mensagem de erro: "Query timeout após 25000ms" ou similar
- A aplicação funciona após limpar o cache do navegador, mas para novamente depois
- Erro aparece principalmente na tela de Clientes
- Conexão com o banco cai frequentemente

### Solução Implementada

Foi implementado um sistema robusto de gerenciamento de sessão e conexão que inclui:

1. **Verificação proativa de sessão** antes de cada query
2. **Renovação automática de tokens** quando próximos de expirar
3. **Limpeza de dados obsoletos** do localStorage
4. **Monitor de sessão** que verifica a cada 5 minutos
5. **Alerta de conexão** com botão "Reconectar"
6. **Retry automático** com backoff exponencial

### O que fazer quando o erro ocorrer

#### 1. Reconectar Manualmente
- Clique no botão **"Reconectar"** que aparece no canto inferior direito
- Aguarde a reconexão ser concluída

#### 2. Recarregar Completamente a Página
- Pressione **Ctrl + F5** (Windows/Linux) ou **Cmd + Shift + R** (Mac)
- Isso força o navegador a limpar o cache e recarregar

#### 3. Limpar Dados do Navegador (último recurso)
Se o problema persistir:
1. Abra as ferramentas do desenvolvedor (F12)
2. Vá para a aba "Application" ou "Armazenamento"
3. Clique em "Clear Storage" ou "Limpar Armazenamento"
4. Marque todas as opções
5. Clique em "Clear site data" ou "Limpar dados do site"
6. Faça login novamente

### Melhorias Implementadas

1. **Cliente Supabase Otimizado**
   - Configuração melhorada de storage
   - Auto-refresh threshold de 60 segundos
   - Headers customizados para debugging

2. **Função executeQuery Melhorada**
   - Verifica e renova sessão antes de cada query
   - Tenta refresh automático em caso de erro de auth
   - Timeout aumentado para 30 segundos
   - Até 2 tentativas com delay de 2 segundos

3. **Monitor de Sessão (SessionMonitor)**
   - Verifica sessão a cada 5 minutos
   - Renova token quando faltam menos de 10 minutos
   - Limpa dados obsoletos a cada 30 minutos
   - Refresh automático quando a janela volta ao foco

4. **Alerta de Conexão (ConnectionAlert)**
   - Mostra status da conexão em tempo real
   - Botão "Reconectar" para forçar nova tentativa
   - Diferencia entre problemas de internet e servidor

5. **Monitor de Conexão Melhorado**
   - Força refresh de sessão após 3 erros consecutivos
   - Relatório automático de erros de API
   - Verificação adaptativa baseada no status

### Configurações de Performance

```typescript
// Timeouts configurados
query: 30000ms        // Queries gerais
quickCheck: 8000ms    // Verificações rápidas
auth: 10000ms         // Operações de autenticação

// Retry configurado
maxAttempts: 2        // Número de tentativas
initialDelay: 2000ms  // Delay inicial
backoffMultiplier: 1.5 // Multiplicador exponencial
```

### Monitoramento

Para monitorar o status da conexão:
1. Abra o console do navegador (F12)
2. Procure por mensagens com emojis:
   - 🔄 Operações em andamento
   - ✅ Operações bem-sucedidas
   - ❌ Erros
   - ⚠️ Avisos
   - 🧹 Limpeza de cache
   - 🔐 Operações de autenticação

### Prevenção

Para evitar problemas futuros:
1. Mantenha a aba do navegador ativa quando possível
2. Evite deixar a aplicação inativa por longos períodos
3. Use uma conexão de internet estável
4. Considere usar o PWA instalado para melhor performance

### Suporte

Se o problema persistir após seguir estas instruções:
1. Tire um screenshot do erro no console
2. Anote a hora exata do erro
3. Entre em contato com o suporte técnico

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0