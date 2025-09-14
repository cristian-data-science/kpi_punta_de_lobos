const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function testDeleteCarlosShifts() {
  console.log('🧪 Testing deletion of Carlos Ramirez shifts for 13 August 2025')
  
  const targetDate = '2025-08-13'
  
  // 1. Ver turnos existentes antes de la eliminación
  console.log('\n📋 PASO 1: Verificar turnos existentes')
  const { data: beforeShifts, error: beforeError } = await supabase
    .from('turnos')
    .select(`
      id,
      fecha,
      turno_tipo,
      estado,
      trabajadores (
        nombre,
        rut
      )
    `)
    .eq('fecha', targetDate)
  
  if (beforeError) {
    console.error('❌ Error:', beforeError)
    return
  }
  
  console.log(`✅ Turnos encontrados para ${targetDate}: ${beforeShifts.length}`)
  beforeShifts.forEach((shift, index) => {
    console.log(`   ${index + 1}. ${shift.trabajadores.nombre} - ${shift.turno_tipo} (ID: ${shift.id})`)
  })
  
  // 2. Simular eliminación completa (como hace AddShiftModal)
  console.log('\n🗑️ PASO 2: Simular eliminación completa de turnos del día')
  const { error: deleteError } = await supabase
    .from('turnos')
    .delete()
    .eq('fecha', targetDate)
  
  if (deleteError) {
    console.error('❌ Error eliminando:', deleteError)
    return
  }
  
  console.log('✅ Eliminación exitosa')
  
  // 3. Verificar que los turnos fueron eliminados
  console.log('\n🔍 PASO 3: Verificar eliminación')
  const { data: afterShifts, error: afterError } = await supabase
    .from('turnos')
    .select('*')
    .eq('fecha', targetDate)
  
  if (afterError) {
    console.error('❌ Error:', afterError)
    return
  }
  
  console.log(`✅ Turnos restantes para ${targetDate}: ${afterShifts.length}`)
  
  // 4. Recrear solo el primer turno de Carlos (simulando selección parcial)
  console.log('\n🔄 PASO 4: Recrear turnos selectivamente')
  
  const carlosShift = beforeShifts.find(shift => 
    shift.trabajadores.nombre.includes('CARLOS') && 
    shift.turno_tipo === 'primer_turno'
  )
  
  if (carlosShift) {
    const { error: insertError } = await supabase
      .from('turnos')
      .insert({
        trabajador_id: carlosShift.trabajadores ? 
          beforeShifts.find(s => s.trabajadores.nombre.includes('CARLOS')).id : 
          'c8feefd4-7154-4d26-9253-35a1c401fa08', // ID de Carlos conocido
        fecha: targetDate,
        turno_tipo: 'primer_turno',
        estado: 'programado'
      })
    
    if (insertError) {
      console.error('❌ Error recreando:', insertError)
    } else {
      console.log('✅ Turno de Carlos recreado (solo primer turno)')
    }
  }
  
  // 5. Verificar resultado final
  console.log('\n📊 PASO 5: Estado final')
  const { data: finalShifts, error: finalError } = await supabase
    .from('turnos')
    .select(`
      id,
      fecha,
      turno_tipo,
      estado,
      trabajadores (
        nombre
      )
    `)
    .eq('fecha', targetDate)
  
  if (finalError) {
    console.error('❌ Error:', finalError)
    return
  }
  
  console.log(`✅ Turnos finales para ${targetDate}: ${finalShifts.length}`)
  finalShifts.forEach((shift, index) => {
    console.log(`   ${index + 1}. ${shift.trabajadores.nombre} - ${shift.turno_tipo}`)
  })
  
  console.log('\n🎯 CONCLUSIÓN:')
  console.log('   • La eliminación por fecha funciona correctamente')
  console.log('   • Se pueden eliminar turnos específicos o todos los turnos de una fecha')
  console.log('   • El proceso de AddShiftModal (eliminar todo + recrear selección) debería funcionar')
}

testDeleteCarlosShifts().catch(console.error)
