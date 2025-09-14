/**
 * TEST ESPECÍFICO - Problema Identificado: Datos Futuros
 * =====================================================
 * 
 * Los datos están entre 2025-08-18 y 2025-11-02
 * Los filtros buscan desde fechas anteriores, por lo que incluyen TODOS los datos
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

console.log('🎯 PROBLEMA IDENTIFICADO: DATOS FUTUROS')
console.log('=======================================')
console.log('Los datos van de 2025-08-18 a 2025-11-02')
console.log('Hoy es: 2025-09-14')
console.log('')

async function testProblemaDeFechas() {
  console.log('📅 TEST: PROBLEMA DE FECHAS')
  console.log('---------------------------')
  
  const hoy = new Date().toISOString().split('T')[0]
  console.log(`Hoy: ${hoy}`)
  
  // Filtro mensual (1 mes atrás)
  const unMesAtras = new Date()
  unMesAtras.setMonth(unMesAtras.getMonth() - 1)
  const fechaMensual = unMesAtras.toISOString().split('T')[0]
  console.log(`Un mes atrás: ${fechaMensual}`)
  
  // Filtro anual (1 año atrás)  
  const unAnoAtras = new Date()
  unAnoAtras.setFullYear(unAnoAtras.getFullYear() - 1)
  const fechaAnual = unAnoAtras.toISOString().split('T')[0]
  console.log(`Un año atrás: ${fechaAnual}`)
  
  // Obtener rango real de datos
  const { data } = await supabase
    .from('turnos')
    .select('fecha')
    .eq('estado', 'completado')
    .order('fecha', { ascending: true })
  
  const fechas = data.map(d => d.fecha).sort()
  const fechaMasAntigua = fechas[0]
  const fechaMasReciente = fechas[fechas.length - 1]
  
  console.log(`Datos van de: ${fechaMasAntigua} a ${fechaMasReciente}`)
  
  console.log('\n🔍 ANÁLISIS:')
  console.log(`¿Filtro mensual (${fechaMensual}) incluye todos los datos? ${fechaMensual < fechaMasAntigua ? 'SÍ' : 'NO'}`)
  console.log(`¿Filtro anual (${fechaAnual}) incluye todos los datos? ${fechaAnual < fechaMasAntigua ? 'SÍ' : 'NO'}`)
  
  console.log('\n💡 SOLUCIÓN:')
  console.log('Los filtros deben usar fechas HACIA EL FUTURO para filtrar correctamente')
  console.log('O crear datos de prueba con fechas pasadas')
}

async function testFiltroCorrectoHaciaFuturo() {
  console.log('\n🚀 TEST: FILTRO CORRECTO HACIA EL FUTURO')
  console.log('---------------------------------------')
  
  // Filtro desde OCTUBRE (para excluir datos de agosto-septiembre)
  const filtroOctubre = '2025-10-01'
  console.log(`Filtro desde octubre: fecha >= ${filtroOctubre}`)
  
  const { data, error } = await supabase
    .from('turnos')
    .select('pago, cobro, fecha')
    .eq('estado', 'completado')
    .gte('fecha', filtroOctubre)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  const totalCosts = data?.reduce((sum, s) => sum + (s.pago || 0), 0) || 0
  const totalIncome = data?.reduce((sum, s) => sum + (s.cobro || 0), 0) || 0
  
  console.log('📊 Resultados CON FILTRO DE OCTUBRE:')
  console.log(`   • Registros encontrados: ${data?.length}`)
  console.log(`   • Total Ingresos: $${totalIncome.toLocaleString('es-CL')}`)
  console.log(`   • Total Costos: $${totalCosts.toLocaleString('es-CL')}`)
  
  if (data?.length > 0) {
    const fechas = data?.map(d => d.fecha).sort()
    console.log(`   • Fecha más antigua: ${fechas[0]}`)
    console.log(`   • Fecha más reciente: ${fechas[fechas.length - 1]}`)
  }
  
  console.log(`\n🎯 ¿Este filtro FUNCIONA? ${data?.length < 1000 ? '¡SÍ!' : 'NO'} (datos < 1000)`)
}

async function testFiltroCorrectoHaciaPasado() {
  console.log('\n🚀 TEST: FILTRO CORRECTO HACIA EL PASADO')
  console.log('--------------------------------------')
  
  // Filtro hasta SEPTIEMBRE (para excluir datos de octubre-noviembre)
  const filtroSeptiembre = '2025-09-30'
  console.log(`Filtro hasta septiembre: fecha <= ${filtroSeptiembre}`)
  
  const { data, error } = await supabase
    .from('turnos')
    .select('pago, cobro, fecha')
    .eq('estado', 'completado')
    .lte('fecha', filtroSeptiembre)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  const totalCosts = data?.reduce((sum, s) => sum + (s.pago || 0), 0) || 0
  const totalIncome = data?.reduce((sum, s) => sum + (s.cobro || 0), 0) || 0
  
  console.log('📊 Resultados CON FILTRO HASTA SEPTIEMBRE:')
  console.log(`   • Registros encontrados: ${data?.length}`)
  console.log(`   • Total Ingresos: $${totalIncome.toLocaleString('es-CL')}`)
  console.log(`   • Total Costos: $${totalCosts.toLocaleString('es-CL')}`)
  
  if (data?.length > 0) {
    const fechas = data?.map(d => d.fecha).sort()
    console.log(`   • Fecha más antigua: ${fechas[0]}`)
    console.log(`   • Fecha más reciente: ${fechas[fechas.length - 1]}`)
  }
  
  console.log(`\n🎯 ¿Este filtro FUNCIONA? ${data?.length < 1000 ? '¡SÍ!' : 'NO'} (datos < 1000)`)
}

async function runTests() {
  await testProblemaDeFechas()
  await testFiltroCorrectoHaciaFuturo()
  await testFiltroCorrectoHaciaPasado()
  
  console.log('\n✅ CONCLUSIÓN:')
  console.log('==============')
  console.log('🎯 PROBLEMA: Los datos de prueba están en el FUTURO (2025-08-18 a 2025-11-02)')
  console.log('🎯 CAUSA: Los filtros "hacia el pasado" incluyen TODOS los datos')
  console.log('🎯 SOLUCIÓN: Cambiar la lógica de filtros o usar datos con fechas pasadas')
}

runTests().catch(console.error)
