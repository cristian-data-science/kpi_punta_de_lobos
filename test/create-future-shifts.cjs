const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function createFutureShifts() {
  console.log('🔮 Creando turnos futuros para pruebas...\n')
  
  // Obtener algunos trabajadores
  const { data: trabajadores, error: workersError } = await supabase
    .from('trabajadores')
    .select('id, nombre')
    .limit(3)
  
  if (workersError) {
    console.error('❌ Error obteniendo trabajadores:', workersError)
    return
  }
  
  console.log(`👥 Trabajadores encontrados: ${trabajadores.length}`)
  trabajadores.forEach((w, i) => {
    console.log(`   ${i + 1}. ${w.nombre}`)
  })
  
  // Crear fechas futuras (mañana, pasado mañana, etc.)
  const futureDates = []
  for (let i = 1; i <= 5; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const dateKey = date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0')
    futureDates.push(dateKey)
  }
  
  console.log(`\n📅 Fechas a crear: ${futureDates.join(', ')}`)
  
  // Crear turnos futuros
  const turnosToCreate = []
  const turnTypes = ['primer_turno', 'segundo_turno', 'tercer_turno']
  
  futureDates.forEach((fecha, dateIndex) => {
    // Para cada fecha, crear 1-2 turnos
    const numTurnos = Math.floor(Math.random() * 2) + 1 // 1 o 2 turnos por día
    
    for (let t = 0; t < numTurnos; t++) {
      const worker = trabajadores[Math.floor(Math.random() * trabajadores.length)]
      const turnType = turnTypes[Math.floor(Math.random() * turnTypes.length)]
      
      turnosToCreate.push({
        trabajador_id: worker.id,
        fecha: fecha,
        turno_tipo: turnType,
        estado: 'programado'
      })
    }
  })
  
  console.log(`\n💾 Creando ${turnosToCreate.length} turnos futuros...`)
  
  const { data, error } = await supabase
    .from('turnos')
    .insert(turnosToCreate)
    .select()
  
  if (error) {
    console.error('❌ Error creando turnos:', error)
    return
  }
  
  console.log(`✅ ${data.length} turnos futuros creados exitosamente`)
  
  // Mostrar resumen
  console.log('\n📊 RESUMEN DE TURNOS CREADOS:')
  const groupedByDate = {}
  turnosToCreate.forEach(turno => {
    if (!groupedByDate[turno.fecha]) {
      groupedByDate[turno.fecha] = []
    }
    groupedByDate[turno.fecha].push(turno)
  })
  
  Object.entries(groupedByDate).forEach(([fecha, turnos]) => {
    console.log(`   📅 ${fecha}: ${turnos.length} turnos`)
    turnos.forEach(turno => {
      const worker = trabajadores.find(w => w.id === turno.trabajador_id)
      console.log(`     - ${turno.turno_tipo}: ${worker.nombre}`)
    })
  })
  
  console.log('\n🎯 ¡Turnos futuros listos para probar la interfaz!')
}

createFutureShifts().catch(console.error)
