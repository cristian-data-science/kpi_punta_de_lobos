// Test del servicio de integración de Supabase
import { createClient } from '@supabase/supabase-js'

console.log('🧪 Probando servicio de integración Supabase...')

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('1. Probando conexión directa...')
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    console.log('✅ Datos obtenidos:', data?.length || 0, 'trabajadores')
    if (data && data.length > 0) {
      console.log('📋 Primer trabajador:', data[0])
    }
    
    // Test de variables de entorno
    console.log('')
    console.log('2. Verificando variables de entorno...')
    console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || 'NO DEFINIDA')
    console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ DEFINIDA' : '❌ NO DEFINIDA')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

testConnection()
