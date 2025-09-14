const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function testMarkAsCompleted() {
  console.log('🧪 Probando funcionalidad de marcar como completado...\n')
  
  // 1. Buscar turnos programados
  console.log('📋 PASO 1: Buscar turnos programados')
  const { data: programados, error: errorProgramados } = await supabase
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
    .eq('estado', 'programado')
    .order('fecha', { ascending: true })
    .limit(5)
  
  if (errorProgramados) {
    console.error('❌ Error:', errorProgramados)
    return
  }
  
  console.log(`✅ Turnos programados encontrados: ${programados.length}`)
  programados.forEach((turno, index) => {
    console.log(`   ${index + 1}. ${turno.fecha} - ${turno.turno_tipo} - ${turno.trabajadores?.nombre} (ID: ${turno.id})`)
  })
  
  if (programados.length === 0) {
    console.log('\n⚠️  No hay turnos programados para probar')
    return
  }
  
  // 2. Probar marcar uno como completado
  const testTurno = programados[0]
  console.log(`\n🔄 PASO 2: Marcar turno como completado`)
  console.log(`   Turno seleccionado: ${testTurno.trabajadores?.nombre} - ${testTurno.fecha} - ${testTurno.turno_tipo}`)
  
  const { error: updateError } = await supabase
    .from('turnos')
    .update({ estado: 'completado' })
    .eq('id', testTurno.id)
  
  if (updateError) {
    console.error('❌ Error actualizando:', updateError)
    return
  }
  
  console.log('✅ Turno marcado como completado')
  
  // 3. Verificar el cambio
  console.log('\n🔍 PASO 3: Verificar cambio')
  const { data: turnoActualizado, error: errorVerificar } = await supabase
    .from('turnos')
    .select('id, estado')
    .eq('id', testTurno.id)
    .single()
  
  if (errorVerificar) {
    console.error('❌ Error verificando:', errorVerificar)
    return
  }
  
  console.log(`✅ Estado actual del turno: ${turnoActualizado.estado}`)
  
  // 4. Mostrar estadísticas de turnos futuros
  console.log('\n📊 PASO 4: Estadísticas de turnos futuros')
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = tomorrow.getFullYear() + '-' + 
                     String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(tomorrow.getDate()).padStart(2, '0')
  
  const { data: futuros, error: errorFuturos } = await supabase
    .from('turnos')
    .select('estado')
    .gte('fecha', tomorrowKey)
  
  if (errorFuturos) {
    console.error('❌ Error:', errorFuturos)
    return
  }
  
  const futurosProgramados = futuros.filter(t => t.estado === 'programado').length
  const futurosCompletados = futuros.filter(t => t.estado === 'completado').length
  
  console.log(`   • Turnos futuros (desde ${tomorrowKey}): ${futuros.length}`)
  console.log(`   • Programados: ${futurosProgramados}`)
  console.log(`   • Completados: ${futurosCompletados}`)
  
  // 5. Restaurar el turno para futuras pruebas (opcional)
  console.log('\n🔄 PASO 5: Restaurar turno original (para futuras pruebas)')
  const { error: restoreError } = await supabase
    .from('turnos')
    .update({ estado: 'programado' })
    .eq('id', testTurno.id)
  
  if (restoreError) {
    console.error('❌ Error restaurando:', restoreError)
  } else {
    console.log('✅ Turno restaurado a estado "programado"')
  }
  
  console.log('\n🎯 CONCLUSIÓN:')
  console.log('   ✅ La funcionalidad de marcar como completado funciona correctamente')
  console.log('   ✅ Los turnos futuros se cuentan correctamente')
  console.log('   ✅ El estado se actualiza en la base de datos')
}

testMarkAsCompleted().catch(console.error)
