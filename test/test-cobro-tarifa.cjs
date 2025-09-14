// Test para verificar campo cobro_tarifa en shift_rates
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'tu_service_role_key_aqui'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCobroTarifa() {
  console.log('🧾 Testing campo cobro_tarifa en shift_rates...')
  
  try {
    // 1. Verificar estructura de la tabla
    const { data: tableData, error: tableError } = await supabase
      .from('shift_rates')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Error leyendo shift_rates:', tableError)
      return
    }
    
    if (tableData.length > 0) {
      console.log('📊 Estructura actual de shift_rates:')
      console.log('Campos disponibles:', Object.keys(tableData[0]))
      
      if ('cobro_tarifa' in tableData[0]) {
        console.log('✅ Campo cobro_tarifa existe')
        console.log(`🧾 Valor actual cobro_tarifa: $${tableData[0].cobro_tarifa}`)
      } else {
        console.log('❌ Campo cobro_tarifa NO existe')
        console.log('🔧 Necesitas ejecutar: ALTER TABLE shift_rates ADD COLUMN cobro_tarifa INTEGER DEFAULT 25000;')
      }
    }
    
    // 2. Test específico para cobro_tarifa
    const { data: cobroData, error: cobroError } = await supabase
      .from('shift_rates')
      .select('cobro_tarifa')
      .single()
    
    if (cobroError) {
      console.error('❌ Error leyendo cobro_tarifa:', cobroError)
      if (cobroError.message.includes('column "cobro_tarifa" does not exist')) {
        console.log('🔧 SOLUCIÓN: Ejecuta el script sql/add_cobro_tarifa_field.sql')
      }
    } else {
      console.log('✅ Lectura cobro_tarifa exitosa:', cobroData.cobro_tarifa)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

async function testCobroFieldTurnos() {
  console.log('💰 Testing campo cobro en tabla turnos...')
  
  try {
    // Verificar estructura de tabla turnos
    const { data: turnoData, error: turnoError } = await supabase
      .from('turnos')
      .select('*')
      .limit(1)
    
    if (turnoError) {
      console.error('❌ Error leyendo turnos:', turnoError)
      return
    }
    
    if (turnoData.length > 0) {
      console.log('📊 Estructura actual de turnos:')
      console.log('Campos disponibles:', Object.keys(turnoData[0]))
      
      if ('cobro' in turnoData[0]) {
        console.log('✅ Campo cobro existe en turnos')
      } else {
        console.log('❌ Campo cobro NO existe en turnos')
        console.log('🔧 Necesitas ejecutar: ALTER TABLE turnos ADD COLUMN cobro INTEGER;')
      }
    }
    
  } catch (error) {
    console.error('❌ Error verificando campo cobro en turnos:', error)
  }
}

// Ejecutar tests
testCobroTarifa()
testCobroFieldTurnos()
