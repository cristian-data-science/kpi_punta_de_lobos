import { createClient } from '@supabase/supabase-js'

// Test directo de conexión Supabase
console.log('🧪 Test directo de Supabase...')

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

console.log('URL:', supabaseUrl)
console.log('Key disponible:', !!supabaseAnonKey)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test directo
async function testDirectConnection() {
  console.log('Probando conexión directa...')
  
  try {
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('❌ Error directo:', error)
      return
    }
    
    console.log('✅ Conexión exitosa!')
    console.log('📊 Trabajadores encontrados:', data?.length || 0)
    
    if (data && data.length > 0) {
      console.log('👤 Primer trabajador:')
      console.log(JSON.stringify(data[0], null, 2))
    }
    
    return data
  } catch (error) {
    console.error('❌ Error de conexión:', error)
  }
}

testDirectConnection()

// Simular el mapeo que hace el servicio
const mockWorker = {
  id: '123',
  nombre: 'TEST USUARIO',
  rut: '12345678-9', 
  contrato: 'fijo',
  telefono: '+56912345678',
  estado: 'activo',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

console.log('')
console.log('🔄 Probando mapeo de datos...')
console.log('Entrada (Supabase):', mockWorker)

// Mapeo como lo hace el servicio
const mappedWorker = {
  id: mockWorker.id,
  nombre: mockWorker.nombre,
  rut: mockWorker.rut,
  contrato: mockWorker.contrato || 'eventual',
  telefono: mockWorker.telefono || '',
  estado: mockWorker.estado || 'activo',
  created_at: mockWorker.created_at,
  updated_at: mockWorker.updated_at
}

console.log('Salida (App):', mappedWorker)
