// Test directo del SupabaseService
import supabaseService from './src/services/supabaseService.js'

console.log('🧪 Probando SupabaseService...')

// Variables de entorno simuladas
globalThis.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://csqxopqlgujduhmwxixo.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
    }
  }
}

async function testSupabaseService() {
  console.log('1. Estado de conexión inicial:', supabaseService.getConnectionStatus())
  
  // Esperar a que se inicialice
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  console.log('2. Estado después de 2 segundos:', supabaseService.getConnectionStatus())
  
  try {
    console.log('3. Intentando consulta...')
    const result = await supabaseService.select('trabajadores', {
      orderBy: { column: 'created_at', ascending: false }
    })
    
    console.log('4. Resultado de consulta:', result)
  } catch (error) {
    console.error('❌ Error en consulta:', error)
  }
}

testSupabaseService()
