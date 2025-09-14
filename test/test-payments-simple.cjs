/**
 * 🧪 Test Simple del servicio de pagos con Supabase
 * 
 * Verifica que la conexión y datos estén funcionando correctamente
 */

const { createClient } = require('@supabase/supabase-js')

// Variables de entorno para testing
const SUPABASE_URL = 'https://csqxopqlgujduhmwxixo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

async function testPaymentsIntegration() {
  console.log('🧪 PRUEBA DE INTEGRACIÓN PAGOS - SUPABASE')
  console.log('=' .repeat(50))

  try {
    // Conexión con Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    
    // 1. Verificar trabajadores
    console.log('\n1. 👥 Verificando trabajadores...')
    const { data: trabajadores, error: workersError } = await supabase
      .from('trabajadores')
      .select('*')
      .limit(5)

    if (workersError) throw workersError
    console.log(`✅ Trabajadores encontrados: ${trabajadores.length}`)

    // 2. Verificar turnos por estado
    console.log('\n2. 📊 Verificando turnos por estado...')
    
    // Turnos completados (los que generan pago)
    const { data: turnosCompletados, error: completadosError } = await supabase
      .from('turnos')
      .select(`
        *,
        trabajador:trabajador_id (
          id,
          nombre,
          rut
        )
      `)
      .eq('estado', 'completado')
      .limit(5)

    if (completadosError) throw completadosError

    // Turnos programados (no generan pago)
    const { data: turnosProgramados, error: programadosError } = await supabase
      .from('turnos')
      .select(`
        *,
        trabajador:trabajador_id (
          id,
          nombre,
          rut
        )
      `)
      .eq('estado', 'programado')
      .limit(5)

    if (programadosError) throw programadosError

    console.log(`✅ Turnos COMPLETADOS (generan pago): ${turnosCompletados.length}`)
    console.log(`📋 Turnos PROGRAMADOS (no generan pago): ${turnosProgramados.length}`)

    if (turnosCompletados.length > 0) {
      console.log('\n� Ejemplos de turnos QUE SÍ generan pago (completados):')
      turnosCompletados.forEach((turno, idx) => {
        console.log(`   ${idx + 1}. ${turno.fecha} - ${turno.trabajador?.nombre} - ${turno.turno_tipo} ✅`)
      })
    }

    if (turnosProgramados.length > 0) {
      console.log('\n📅 Ejemplos de turnos que NO generan pago (programados):')
      turnosProgramados.slice(0, 3).forEach((turno, idx) => {
        console.log(`   ${idx + 1}. ${turno.fecha} - ${turno.trabajador?.nombre} - ${turno.turno_tipo} ⏳`)
      })
    }

    // 3. Verificar estadísticas por estado
    console.log('\n3. 📈 Estadísticas generales por estado:')
    
    const { count: totalTrabajadores } = await supabase
      .from('trabajadores')
      .select('*', { count: 'exact', head: true })

    const { count: totalTurnosCompletados } = await supabase
      .from('turnos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'completado')

    const { count: totalTurnosProgramados } = await supabase
      .from('turnos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'programado')

    const { count: totalTurnos } = await supabase
      .from('turnos')
      .select('*', { count: 'exact', head: true })

    console.log(`   - Total trabajadores en BD: ${totalTrabajadores}`)
    console.log(`   - Total turnos en BD: ${totalTurnos}`)
    console.log(`   - Turnos COMPLETADOS (💰 generan pago): ${totalTurnosCompletados}`)
    console.log(`   - Turnos PROGRAMADOS (⏳ no generan pago): ${totalTurnosProgramados}`)

    // 4. Verificar datos para pagos (solo completados)
    if (turnosCompletados.length > 0 && trabajadores.length > 0) {
      console.log('\n4. 💰 Verificando datos para cálculo de pagos (SOLO COMPLETADOS):')
      
      // Agrupar turnos completados por trabajador
      const turnosPorTrabajador = {}
      turnosCompletados.forEach(turno => {
        const nombre = turno.trabajador?.nombre || 'Sin nombre'
        if (!turnosPorTrabajador[nombre]) {
          turnosPorTrabajador[nombre] = []
        }
        turnosPorTrabajador[nombre].push(turno)
      })

      console.log(`   - Trabajadores con turnos COMPLETADOS: ${Object.keys(turnosPorTrabajador).length}`)
      
      Object.entries(turnosPorTrabajador).forEach(([nombre, turnosWorker]) => {
        console.log(`     • ${nombre}: ${turnosWorker.length} turnos completados`)
      })

      console.log('\n✅ Los datos están listos para el cálculo de pagos')
      console.log('   💡 IMPORTANTE: Solo los turnos COMPLETADOS generan pagos')
      console.log('   ➡️  La sección de Pagos procesará solo estos turnos')
    } else if (totalTurnosCompletados === 0) {
      console.log('\n⚠️ NO HAY TURNOS COMPLETADOS - NO SE GENERARÁN PAGOS')
      console.log('   💡 Para generar pagos, marca los turnos como "completado" en la sección Turnos')
    } else {
      console.log('\n⚠️ No hay suficientes datos para calcular pagos')
    }

    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE')
    console.log('   ➡️  La integración con Supabase está funcionando')
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message)
    if (error.details) {
      console.error('📋 Detalles:', error.details)
    }
  }
}

// Ejecutar prueba
testPaymentsIntegration()
  .then(() => {
    console.log('\n✅ Script terminado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })