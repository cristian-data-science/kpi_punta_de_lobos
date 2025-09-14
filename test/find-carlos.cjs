const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function findCarlosData() {
  console.log('🔍 Buscando trabajador Carlos Ramirez...')
  
  // Buscar trabajadores que contengan "carlos" y "ramirez"
  const { data: workers, error: workersError } = await supabase
    .from('trabajadores')
    .select('*')
    .or('nombre.ilike.%carlos%,nombre.ilike.%ramirez%')

  if (workersError) {
    console.error('❌ Error buscando trabajadores:', workersError)
    return
  }

  console.log(`\n📋 Trabajadores encontrados (${workers.length}):`)
  workers.forEach((worker, index) => {
    console.log(`   ${index + 1}. ${worker.nombre} (${worker.rut}) - ID: ${worker.id}`)
  })

  // Buscar Carlos más específicamente
  const carlosWorker = workers.find(w => 
    w.nombre.toLowerCase().includes('carlos') && 
    w.nombre.toLowerCase().includes('ramirez')
  )

  if (!carlosWorker) {
    console.log('\n❌ No se encontró trabajador Carlos Ramirez específicamente')
    return
  }

  console.log(`\n✅ Carlos Ramirez encontrado: ${carlosWorker.nombre} (ID: ${carlosWorker.id})`)

  // Buscar TODOS los turnos de Carlos
  const { data: allShifts, error: allShiftsError } = await supabase
    .from('turnos')
    .select('*')
    .eq('trabajador_id', carlosWorker.id)
    .order('fecha', { ascending: true })

  if (allShiftsError) {
    console.error('❌ Error buscando turnos:', allShiftsError)
    return
  }

  console.log(`\n📅 Todos los turnos de Carlos (${allShifts.length}):`)
  allShifts.forEach((shift, index) => {
    console.log(`   ${index + 1}. ${shift.fecha} - ${shift.turno_tipo} - ID: ${shift.id}`)
  })

  // Buscar específicamente el 13 de agosto
  const augustShifts = allShifts.filter(shift => shift.fecha === '2025-08-13')
  
  console.log(`\n📍 Turnos del 13 de agosto 2025 (${augustShifts.length}):`)
  augustShifts.forEach((shift, index) => {
    console.log(`   ${index + 1}. ${shift.fecha} - ${shift.turno_tipo} - Estado: ${shift.estado} - ID: ${shift.id}`)
  })

  // Intentar eliminar uno de los turnos para probar
  if (augustShifts.length > 0) {
    const testShift = augustShifts[0]
    console.log(`\n🧪 Intentando eliminar turno de prueba: ${testShift.id}`)
    
    const { error: deleteError } = await supabase
      .from('turnos')
      .delete()
      .eq('id', testShift.id)

    if (deleteError) {
      console.error('❌ Error eliminando turno:', deleteError)
    } else {
      console.log('✅ Turno eliminado exitosamente (solo para prueba)')
      
      // Recrear el turno
      const { error: insertError } = await supabase
        .from('turnos')
        .insert({
          id: testShift.id,
          trabajador_id: testShift.trabajador_id,
          fecha: testShift.fecha,
          turno_tipo: testShift.turno_tipo,
          estado: testShift.estado
        })
      
      if (insertError) {
        console.error('❌ Error recreando turno:', insertError)
      } else {
        console.log('✅ Turno recreado correctamente')
      }
    }
  }
}

findCarlosData().catch(console.error)
