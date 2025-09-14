// Script para verificar la optimización de consultas de turnos
// Prueba que solo se traigan los turnos del año actual

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function testOriginalQuery() {
  console.log('🔍 Probando consulta ORIGINAL (SIN filtro de fecha):')
  const start = Date.now()
  
  const { data, error } = await supabase
    .from('turnos')
    .select(`
      *,
      trabajador:trabajador_id (
        id,
        nombre,
        rut
      )
    `)
    .order('fecha', { ascending: false })
  
  const duration = Date.now() - start
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log(`📊 Resultados:`)
  console.log(`   • Total turnos: ${data.length}`)
  console.log(`   • Tiempo de consulta: ${duration}ms`)
  
  if (data.length > 0) {
    console.log(`   • Fecha más antigua: ${data[data.length - 1].fecha}`)
    console.log(`   • Fecha más reciente: ${data[0].fecha}`)
    
    // Contar por año
    const yearCounts = {}
    data.forEach(turno => {
      const year = turno.fecha.substring(0, 4)
      yearCounts[year] = (yearCounts[year] || 0) + 1
    })
    
    console.log('   • Distribución por año:')
    Object.keys(yearCounts).sort().forEach(year => {
      console.log(`     - ${year}: ${yearCounts[year]} turnos`)
    })
  }
}

async function testOptimizedQuery() {
  console.log('\n🚀 Probando consulta OPTIMIZADA (solo año actual):')
  const start = Date.now()
  
  const currentYear = new Date().getFullYear()
  const startOfYear = `${currentYear}-01-01`
  const endOfYear = `${currentYear}-12-31`
  
  console.log(`   Filtro: ${startOfYear} <= fecha <= ${endOfYear}`)
  
  const { data, error } = await supabase
    .from('turnos')
    .select(`
      *,
      trabajador:trabajador_id (
        id,
        nombre,
        rut
      )
    `)
    .gte('fecha', startOfYear)
    .lte('fecha', endOfYear)
    .order('fecha', { ascending: false })
  
  const duration = Date.now() - start
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log(`📊 Resultados:`)
  console.log(`   • Total turnos ${currentYear}: ${data.length}`)
  console.log(`   • Tiempo de consulta: ${duration}ms`)
  
  if (data.length > 0) {
    console.log(`   • Fecha más antigua: ${data[data.length - 1].fecha}`)
    console.log(`   • Fecha más reciente: ${data[0].fecha}`)
    
    // Verificar que todas las fechas están en el año actual
    const wrongYearCount = data.filter(turno => {
      const year = parseInt(turno.fecha.substring(0, 4))
      return year !== currentYear
    }).length
    
    if (wrongYearCount === 0) {
      console.log('   ✅ Todas las fechas están en el año actual')
    } else {
      console.log(`   ❌ ${wrongYearCount} turnos de años diferentes encontrados`)
    }
  }
}

async function compareQueries() {
  console.log('\n📈 COMPARACIÓN DE RENDIMIENTO:')
  
  // Consulta original
  const originalStart = Date.now()
  const { data: originalData } = await supabase
    .from('turnos')
    .select('*')
    .order('fecha', { ascending: false })
  const originalTime = Date.now() - originalStart
  
  // Consulta optimizada
  const currentYear = new Date().getFullYear()
  const optimizedStart = Date.now()
  const { data: optimizedData } = await supabase
    .from('turnos')
    .select('*')
    .gte('fecha', `${currentYear}-01-01`)
    .lte('fecha', `${currentYear}-12-31`)
    .order('fecha', { ascending: false })
  const optimizedTime = Date.now() - optimizedStart
  
  console.log(`📊 Resultados de comparación:`)
  console.log(`   • Consulta original: ${originalData?.length || 0} turnos en ${originalTime}ms`)
  console.log(`   • Consulta optimizada: ${optimizedData?.length || 0} turnos en ${optimizedTime}ms`)
  
  if (originalData && optimizedData) {
    const reduction = ((originalData.length - optimizedData.length) / originalData.length * 100).toFixed(1)
    const speedup = originalTime > optimizedTime ? ((originalTime - optimizedTime) / originalTime * 100).toFixed(1) : 0
    
    console.log(`\n🎯 Beneficios de la optimización:`)
    console.log(`   • Reducción de datos: ${reduction}% menos turnos transferidos`)
    console.log(`   • Mejora de velocidad: ${speedup}% más rápido`)
    console.log(`   • Ahorro de ancho de banda: ~${((originalData.length - optimizedData.length) * 0.5).toFixed(1)}KB menos`)
  }
}

async function main() {
  console.log('🧪 PRUEBA DE OPTIMIZACIÓN DE CONSULTAS DE TURNOS')
  console.log('='.repeat(60))
  
  try {
    await testOriginalQuery()
    await testOptimizedQuery()
    await compareQueries()
    
    console.log('\n✅ Pruebas completadas')
  } catch (error) {
    console.error('❌ Error en las pruebas:', error)
  }
}

main()
