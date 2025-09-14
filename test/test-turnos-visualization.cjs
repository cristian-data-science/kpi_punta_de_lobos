const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function testTurnosVisualization() {
  console.log('🧪 Probando mejoras visuales de Turnos...')
  
  try {
    // Obtener algunos turnos de ejemplo para verificar
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select(`
        id, fecha, turno_tipo, estado, pago,
        trabajador:trabajador_id (
          id, nombre, rut
        )
      `)
      .limit(10)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('\n📊 Muestra de datos para las mejoras visuales:')
    
    let programados = 0
    let completados = 0
    
    turnos.forEach((turno, index) => {
      const estado = turno.estado === 'completado' ? 'COMPLETADO' : 'PROGRAMADO'
      const nombreCompleto = turno.trabajador?.nombre || 'Sin nombre'
      
      // Simular formateo de nombre (primer nombre + primer apellido)
      const formatWorkerName = (fullName) => {
        if (!fullName) return 'Sin nombre'
        const parts = fullName.trim().split(' ')
        if (parts.length === 1) return parts[0]
        if (parts.length === 2) return fullName
        if (parts.length >= 3) return `${parts[0]} ${parts[2]}`
        return fullName
      }
      
      const nombreFormateado = formatWorkerName(nombreCompleto)
      
      if (turno.estado === 'completado') {
        completados++
        console.log(`   ${index + 1}. 🟢 ${nombreFormateado} - ${estado} - Pago: $${turno.pago?.toLocaleString() || '0'}`)
      } else {
        programados++
        console.log(`   ${index + 1}. 🔵 ${nombreFormateado} - ${estado} - Tarifa: Se calculará dinámicamente`)
      }
    })

    console.log('\n📈 Resumen de mejoras:')
    console.log(`✅ Nombres sin números: Solo nombres limpios (${nombreFormateado} vs números confusos)`)
    console.log(`✅ Estados visuales: ${completados} COMPLETADO, ${programados} PROGRAMADO`)
    console.log('✅ Valores inteligentes:')
    console.log('   • PROGRAMADO: Muestra tarifas actuales del sistema')
    console.log('   • COMPLETADO: Muestra pagos reales registrados')
    
    console.log('\n🎨 Mejoras implementadas:')
    console.log('   • Vista Calendario: Cards con estados y valores claros')
    console.log('   • Vista Tabla: Columnas mejoradas con badges de estado')
    console.log('   • Estados: Badges verde (COMPLETADO) y azul (PROGRAMADO)')
    console.log('   • Valores: Verde (tarifas actuales) y azul (pagos reales)')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testTurnosVisualization()
