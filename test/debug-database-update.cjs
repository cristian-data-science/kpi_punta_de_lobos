const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function testDatabaseUpdate() {
  try {
    console.log('🔍 Probando actualización de base de datos...\n')
    
    // Obtener UN turno programado
    const { data: turnos, error: fetchError } = await supabase
      .from('turnos')
      .select('id, fecha, turno_tipo, estado, pago')
      .eq('estado', 'programado')
      .limit(1)
    
    if (fetchError) {
      console.error('❌ Error obteniendo turno:', fetchError)
      return
    }
    
    if (!turnos || turnos.length === 0) {
      console.log('⚠️ No hay turnos programados para probar')
      return
    }
    
    const turno = turnos[0]
    console.log('📋 Turno a probar:', {
      id: turno.id,
      fecha: turno.fecha,
      tipo: turno.turno_tipo,
      estado: turno.estado,
      pagoActual: turno.pago
    })
    
    // Intentar actualizar con diferentes valores
    const testValues = [
      { desc: 'Número entero', value: 20000 },
      { desc: 'Número decimal', value: 20000.50 },
      { desc: 'Número como string', value: '25000' },
      { desc: 'Null explícito', value: null },
      { desc: 'Cero', value: 0 }
    ]
    
    for (const test of testValues) {
      console.log(`\n--- Probando: ${test.desc} (${test.value}) ---`)
      
      try {
        const { data, error } = await supabase
          .from('turnos')
          .update({ pago: test.value })
          .eq('id', turno.id)
          .select()
        
        if (error) {
          console.error(`❌ ERROR con ${test.desc}:`, error.message || error)
        } else {
          console.log(`✅ ÉXITO con ${test.desc}:`, data?.[0]?.pago)
        }
        
        // Pequeña pausa entre pruebas
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (updateError) {
        console.error(`❌ EXCEPCIÓN con ${test.desc}:`, updateError.message)
      }
    }
    
    // Resetear a programado
    console.log('\n🔄 Reseteando turno a programado...')
    await supabase
      .from('turnos')
      .update({ estado: 'programado', pago: null })
      .eq('id', turno.id)
    
    console.log('\n✅ Prueba completada')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar prueba
testDatabaseUpdate()
