/**
 * 🔍 Script para verificar estados de turnos
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://csqxopqlgujduhmwxixo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

async function checkTurnosStates() {
  console.log('🔍 VERIFICANDO ESTADOS DE TURNOS')
  console.log('=' .repeat(35))

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Obtener muestra de turnos con sus estados
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('*')
      .limit(10)

    if (error) throw error

    console.log(`\n📊 Muestra de ${turnos.length} turnos:`)
    turnos.forEach((turno, idx) => {
      console.log(`   ${idx + 1}. ID: ${turno.id} | Fecha: ${turno.fecha} | Estado: "${turno.estado}" | Tipo: ${turno.turno_tipo}`)
    })

    // Contar por estado
    const { data: estados } = await supabase
      .from('turnos')
      .select('estado')

    const conteoEstados = {}
    estados.forEach(turno => {
      const estado = turno.estado || 'null'
      conteoEstados[estado] = (conteoEstados[estado] || 0) + 1
    })

    console.log('\n📈 Conteo por estados:')
    Object.entries(conteoEstados).forEach(([estado, count]) => {
      console.log(`   - "${estado}": ${count} turnos`)
    })

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
  }
}

checkTurnosStates()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })