/**
 * 🛠️ Script para marcar turnos como completados
 * 
 * Marca algunos turnos de ejemplo como "completado" para probar 
 * la funcionalidad de pagos
 */

const { createClient } = require('@supabase/supabase-js')

// Variables de entorno
const SUPABASE_URL = 'https://csqxopqlgujduhmwxixo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

async function markSomeTurnosAsCompleted() {
  console.log('🛠️ MARCANDO TURNOS COMO COMPLETADOS')
  console.log('=' .repeat(40))

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // 1. Obtener algunos turnos programados para marcar como completados
    console.log('\n1. 📋 Obteniendo turnos programados...')
    const { data: turnosProgramados, error: fetchError } = await supabase
      .from('turnos')
      .select(`
        *,
        trabajador:trabajador_id (
          nombre
        )
      `)
      .eq('estado', 'programado')
      .limit(10)  // Solo los primeros 10 para prueba

    if (fetchError) throw fetchError

    console.log(`✅ Encontrados ${turnosProgramados.length} turnos programados`)

    if (turnosProgramados.length === 0) {
      console.log('⚠️ No hay turnos programados para marcar como completados')
      return
    }

    // 2. Mostrar turnos que se van a marcar como completados
    console.log('\n2. 🎯 Turnos que se marcarán como completados:')
    turnosProgramados.forEach((turno, idx) => {
      console.log(`   ${idx + 1}. ${turno.fecha} - ${turno.trabajador?.nombre} - ${turno.turno_tipo}`)
    })

    // 3. Confirmación (simulada para automatización)
    console.log('\n3. ✅ Marcando turnos como completados...')

    // Obtener IDs para actualizar
    const turnoIds = turnosProgramados.map(t => t.id)

    const { data: updatedTurnos, error: updateError } = await supabase
      .from('turnos')
      .update({ estado: 'completado' })
      .in('id', turnoIds)
      .select(`
        *,
        trabajador:trabajador_id (
          nombre
        )
      `)

    if (updateError) throw updateError

    console.log(`✅ ${updatedTurnos.length} turnos marcados como completados`)

    // 4. Verificar estadísticas después de la actualización
    console.log('\n4. 📊 Estadísticas actualizadas:')
    
    const { count: completados } = await supabase
      .from('turnos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'completado')

    const { count: programados } = await supabase
      .from('turnos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'programado')

    console.log(`   - Turnos COMPLETADOS (💰 generan pago): ${completados}`)
    console.log(`   - Turnos PROGRAMADOS (⏳ no generan pago): ${programados}`)

    // 5. Mostrar trabajadores que ahora tendrán pagos
    console.log('\n5. 👥 Trabajadores que ahora tendrán pagos:')
    const trabajadoresConPagos = [...new Set(updatedTurnos.map(t => t.trabajador?.nombre))]
    trabajadoresConPagos.forEach(nombre => {
      const turnosWorker = updatedTurnos.filter(t => t.trabajador?.nombre === nombre)
      console.log(`   • ${nombre}: ${turnosWorker.length} turnos completados`)
    })

    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE')
    console.log('   ➡️  Ahora puedes probar la sección de Pagos')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    if (error.details) {
      console.error('📋 Detalles:', error.details)
    }
  }
}

// Ejecutar script
markSomeTurnosAsCompleted()
  .then(() => {
    console.log('\n✅ Script terminado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })