/**
 * 🧪 Script de prueba para verificar conexión con Supabase
 * 
 * Ejecutar en consola del navegador después de cargar la aplicación:
 * 1. Abrir http://localhost:5173
 * 2. F12 → Console
 * 3. Pegar este código
 */

// Verificar variables de entorno
console.log('🔧 Variables de entorno:')
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante')

// Importar y probar servicio (ejecutar después de cargar la app)
/*
import supabaseService from './src/services/supabaseService.js'

// Verificar estado de conexión
console.log('🌐 Estado de conexión:', supabaseService.getConnectionStatus())

// Esperar 2 segundos para que se establezca la conexión
setTimeout(async () => {
  console.log('🔍 Probando conexión...')
  
  try {
    // Probar listar trabajadores
    const result = await supabaseService.select('trabajadores', { limit: 5 })
    
    if (result.error) {
      console.error('❌ Error:', result.error.message)
    } else {
      console.log('✅ Conexión exitosa!')
      console.log('👥 Trabajadores encontrados:', result.data?.length || 0)
      console.log('📊 Datos:', result.data)
    }
  } catch (error) {
    console.error('🚨 Error de conexión:', error.message)
  }
}, 2000)
*/
