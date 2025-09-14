/**
 * 📦 Script de Migración: localStorage → Supabase
 * 
 * Extrae datos de calendar_config desde localStorage del navegador
 * y los inserta en las nuevas tablas de Supabase (shift_rates y holidays)
 */

const { createClient } = require('@supabase/supabase-js')

async function migrateCalendarData() {
  console.log('🚀 Iniciando migración de datos de calendario')
  console.log('=' .repeat(60))

  // Configurar cliente Supabase
  const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4MjU3MjcsImV4cCI6MjA0MTQwMTcyN30.gNFzpX7C5n8w9T7K8N3dHXQfNmhj7B9qXe9z3_iX4Wg'

  if (supabaseAnonKey === 'tu-anon-key-aqui') {
    console.error('❌ VITE_SUPABASE_ANON_KEY no está configurada')
    console.log('Por favor configura la variable de entorno VITE_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    console.log('📋 INSTRUCCIONES PARA MIGRAR DATOS:')
    console.log('')
    console.log('1. Abre tu aplicación TransApp en el navegador')
    console.log('2. Ve al módulo Calendar/Calendario') 
    console.log('3. Abre las herramientas de desarrollador (F12)')
    console.log('4. Ve a la pestaña Console')
    console.log('5. Ejecuta el siguiente código para obtener tus datos actuales:')
    console.log('')
    console.log('--- COPIAR Y PEGAR EN CONSOLE DEL NAVEGADOR ---')
    console.log(`
// Obtener configuración actual de localStorage
const config = JSON.parse(localStorage.getItem('transapp_calendar_config') || '{}')
console.log('=== CONFIGURACIÓN ACTUAL ===')
console.log(JSON.stringify(config, null, 2))

// También mostrar datos con formato para migración
if (config.shiftRates && config.holidays) {
  console.log('\\n=== DATOS PARA MIGRACIÓN ===')
  console.log('Tarifas encontradas:', Object.keys(config.shiftRates).length)
  console.log('Feriados encontrados:', config.holidays.length)
  
  console.log('\\n--- TARIFAS ---')
  Object.entries(config.shiftRates).forEach(([key, value]) => {
    console.log(\`INSERT INTO shift_rates (rate_name, rate_value) VALUES ('\${key}', \${value});\`)
  })
  
  console.log('\\n--- FERIADOS ---')
  config.holidays.forEach(holiday => {
    console.log(\`INSERT INTO holidays (holiday_date) VALUES ('\${holiday}');\`)
  })
} else {
  console.log('⚠️ No se encontraron datos de calendario en localStorage')
  console.log('Usar datos por defecto que ya están en Supabase')
}
`)
    console.log('--- FIN DEL CÓDIGO ---')
    console.log('')

    // Verificar si las tablas tienen datos
    console.log('🔍 Verificando estado actual de las tablas en Supabase...')
    
    const [ratesResult, holidaysResult] = await Promise.all([
      supabase.from('shift_rates').select('count', { count: 'exact', head: true }),
      supabase.from('holidays').select('count', { count: 'exact', head: true })
    ])

    if (ratesResult.error || holidaysResult.error) {
      console.log('⚠️ Error conectando con Supabase - asegúrate de ejecutar el SQL primero')
      console.log('Errors:', ratesResult.error?.message, holidaysResult.error?.message)
      return
    }

    console.log(`📊 Estado actual en Supabase:`)
    console.log(`   - Tarifas: ${ratesResult.count || 0} registros`)
    console.log(`   - Feriados: ${holidaysResult.count || 0} registros`)

    if (ratesResult.count > 0) {
      console.log('✅ Las tablas ya tienen datos por defecto')
      console.log('Si quieres usar datos específicos de localStorage, copia los INSERT statements de arriba')
    }

    console.log('')
    console.log('🎯 PRÓXIMOS PASOS:')
    console.log('1. Si tienes datos específicos en localStorage, usa los INSERT generados')
    console.log('2. Prueba Calendar.jsx para verificar que carga desde Supabase') 
    console.log('3. Prueba Payments.jsx para verificar que usa las tarifas de Supabase')

  } catch (error) {
    console.error('❌ Error durante migración:', error.message)
  }
}

// Ejecutar migración
migrateCalendarData().catch(console.error)
