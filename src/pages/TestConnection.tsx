import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnection() {
  const [result, setResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const runTest = async () => {
    setTesting(true)
    const startTime = Date.now()
    const testResult: any = {
      name: 'Conexão Supabase',
      startTime: new Date().toISOString()
    }

    try {
      // Test 1: Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      testResult.sessionStatus = session ? 'Active' : 'Inactive'
      testResult.sessionError = sessionError?.message || null

      // Test 2: Simple query
      const { data, error } = await supabase
        .from('accounts')
        .select('id, company_name')
        .limit(5)

      testResult.querySuccess = !error
      testResult.queryError = error?.message || null
      testResult.dataCount = data?.length || 0

      // Test 3: Auth state
      const { data: { user } } = await supabase.auth.getUser()
      testResult.userFound = !!user

    } catch (err: any) {
      testResult.generalError = err.message
    }

    testResult.duration = Date.now() - startTime
    setResult(testResult)
    setTesting(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Conexão Supabase</h1>

      <button
        onClick={runTest}
        disabled={testing}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {testing ? 'Testando...' : 'Executar Teste'}
      </button>

      {result && (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold text-lg mb-2">{result.name}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Sessão: <span className={result.sessionStatus === 'Active' ? 'text-green-600' : 'text-red-600'}>{result.sessionStatus}</span></div>
            <div>Query: <span className={result.querySuccess ? 'text-green-600' : 'text-red-600'}>{result.querySuccess ? 'Sucesso' : 'Falhou'}</span></div>
            <div>Registros: {result.dataCount}</div>
            <div>Duração: {result.duration}ms</div>
            <div>Usuário: {result.userFound ? '✓' : '✗'}</div>
            <div>Tempo: {new Date(result.startTime).toLocaleTimeString()}</div>
          </div>
          {result.sessionError && <div className="mt-2 text-red-600 text-sm">Erro Sessão: {result.sessionError}</div>}
          {result.queryError && <div className="mt-2 text-red-600 text-sm">Erro Query: {result.queryError}</div>}
          {result.generalError && <div className="mt-2 text-red-600 text-sm">Erro Geral: {result.generalError}</div>}
        </div>
      )}
    </div>
  )
}