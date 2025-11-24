// Script de diagnóstico para executar no console do navegador
// Cole este código no console após fazer login

async function diagnosticoSupabase() {
  console.log('🔍 Iniciando diagnóstico do Supabase...\n');
  
  // 1. Verificar localStorage
  console.log('📦 1. Verificando localStorage:');
  const keys = Object.keys(localStorage).filter(k => 
    k.includes('auth') || k.includes('supabase') || k.includes('tlc')
  );
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(value);
      console.log(`  - ${key}:`, {
        hasToken: !!parsed.access_token,
        hasRefresh: !!parsed.refresh_token,
        expiresAt: parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString() : 'N/A'
      });
    } catch {
      console.log(`  - ${key}: [não é JSON]`);
    }
  });
  
  // 2. Verificar configuração do cliente
  console.log('\n📊 2. Verificando cliente Supabase:');
  if (window.supabase) {
    console.log('  - Cliente global encontrado');
  }
  
  // 3. Testar sessão atual
  console.log('\n🔐 3. Verificando sessão:');
  try {
    // Importar dinamicamente
    const { supabase } = await import('/src/lib/supabase.ts');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('  ❌ Erro ao obter sessão:', error.message);
    } else if (session) {
      console.log('  ✅ Sessão ativa');
      console.log('  - Usuário:', session.user.email);
      console.log('  - Expira em:', new Date(session.expires_at * 1000).toLocaleString());
      console.log('  - Token tem', session.access_token.length, 'caracteres');
    } else {
      console.log('  ⚠️ Sem sessão ativa');
    }
  } catch (err) {
    console.error('  ❌ Erro:', err.message);
  }
  
  // 4. Testar query simples
  console.log('\n🔍 4. Testando query:');
  try {
    const { supabase } = await import('/src/lib/supabase.ts');
    const start = Date.now();
    const { data, error } = await supabase
      .from('accounts')
      .select('id')
      .limit(1);
    
    const duration = Date.now() - start;
    
    if (error) {
      console.error('  ❌ Erro na query:', error.message);
      console.error('  - Código:', error.code);
      console.error('  - Detalhes:', error.details);
    } else {
      console.log('  ✅ Query bem-sucedida');
      console.log('  - Duração:', duration, 'ms');
      console.log('  - Registros:', data?.length || 0);
    }
  } catch (err) {
    console.error('  ❌ Erro:', err.message);
  }
  
  // 5. Verificar headers
  console.log('\n📡 5. Verificando configuração de rede:');
  console.log('  - URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('  - Tem Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log('  - Tem Service Key:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
  
  // 6. Verificar múltiplas abas
  console.log('\n🪟 6. Verificando múltiplas abas:');
  const broadcastChannel = new BroadcastChannel('supabase');
  let responses = 0;
  
  broadcastChannel.onmessage = (event) => {
    if (event.data.type === 'ping-response') {
      responses++;
      console.log(`  - Resposta da aba ${responses}`);
    }
  };
  
  broadcastChannel.postMessage({ type: 'ping' });
  
  setTimeout(() => {
    if (responses > 0) {
      console.log(`  ⚠️ ${responses} outras abas detectadas - pode causar conflitos!`);
    } else {
      console.log('  ✅ Nenhuma outra aba detectada');
    }
    broadcastChannel.close();
  }, 1000);
  
  console.log('\n✅ Diagnóstico concluído');
}

// Executar diagnóstico
diagnosticoSupabase();