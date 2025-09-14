/**
 * TEST DASHBOARD FILTERS - Diagnóstico de Problemas de Filtros
 * =========================================================
 * 
 * Este script prueba directamente las consultas del Dashboard
 * para identificar por qué los filtros no están funcionando.
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const SUPABASE_URL = 'https://csqxopqlgujduhmwxixo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🔍 INICIANDO TEST DE FILTROS DEL DASHBOARD')
console.log('==========================================\n')

/**
 * Test 1: Datos Financieros - SIN filtros
 */
async function testFinancialDataNoFilter() {
  console.log('💰 TEST 1: DATOS FINANCIEROS SIN FILTROS')
  console.log('----------------------------------------')
  
  try {
    const { data, error } = await supabase
      .from('turnos')
      .select('pago, cobro, fecha')
      .eq('estado', 'completado')
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    const totalCosts = data?.reduce((sum, s) => sum + (s.pago || 0), 0) || 0
    const totalIncome = data?.reduce((sum, s) => sum + (s.cobro || 0), 0) || 0
    const margin = totalIncome - totalCosts
    const marginPercent = totalIncome > 0 ? ((margin / totalIncome) * 100) : 0

    console.log('📊 Resultados SIN FILTRO:')
    console.log(`   • Registros encontrados: ${data?.length}`)
    console.log(`   • Total Ingresos: $${totalIncome.toLocaleString('es-CL')}`)
    console.log(`   • Total Costos: $${totalCosts.toLocaleString('es-CL')}`)
    console.log(`   • Margen: $${margin.toLocaleString('es-CL')} (${marginPercent.toFixed(2)}%)`)
    
    // Mostrar fechas de muestra
    const fechas = data?.map(d => d.fecha).sort()
    console.log(`   • Fecha más antigua: ${fechas[0]}`)
    console.log(`   • Fecha más reciente: ${fechas[fechas.length - 1]}`)
    
  } catch (error) {
    console.error('❌ Error en test:', error)
  }
  
  console.log('\n')
}

/**
 * Test 2: Datos Financieros - CON filtro mensual
 */
async function testFinancialDataMonthFilter() {
  console.log('💰 TEST 2: DATOS FINANCIEROS CON FILTRO MENSUAL')
  console.log('----------------------------------------------')
  
  try {
    // Calcular fecha de filtro (1 mes atrás)
    const filterDate = new Date()
    filterDate.setMonth(filterDate.getMonth() - 1)
    const filterDateString = filterDate.toISOString().split('T')[0]
    
    console.log(`🗓️ Filtro aplicado: fecha >= ${filterDateString}`)
    
    const { data, error } = await supabase
      .from('turnos')
      .select('pago, cobro, fecha')
      .eq('estado', 'completado')
      .gte('fecha', filterDateString)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    const totalCosts = data?.reduce((sum, s) => sum + (s.pago || 0), 0) || 0
    const totalIncome = data?.reduce((sum, s) => sum + (s.cobro || 0), 0) || 0
    const margin = totalIncome - totalCosts
    const marginPercent = totalIncome > 0 ? ((margin / totalIncome) * 100) : 0

    console.log('📊 Resultados CON FILTRO MENSUAL:')
    console.log(`   • Registros encontrados: ${data?.length}`)
    console.log(`   • Total Ingresos: $${totalIncome.toLocaleString('es-CL')}`)
    console.log(`   • Total Costos: $${totalCosts.toLocaleString('es-CL')}`)
    console.log(`   • Margen: $${margin.toLocaleString('es-CL')} (${marginPercent.toFixed(2)}%)`)
    
    // Mostrar fechas de muestra
    if (data?.length > 0) {
      const fechas = data?.map(d => d.fecha).sort()
      console.log(`   • Fecha más antigua: ${fechas[0]}`)
      console.log(`   • Fecha más reciente: ${fechas[fechas.length - 1]}`)
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error)
  }
  
  console.log('\n')
}

/**
 * Test 3: Datos Financieros - CON filtro anual
 */
async function testFinancialDataYearFilter() {
  console.log('💰 TEST 3: DATOS FINANCIEROS CON FILTRO ANUAL')
  console.log('--------------------------------------------')
  
  try {
    // Calcular fecha de filtro (1 año atrás)
    const filterDate = new Date()
    filterDate.setFullYear(filterDate.getFullYear() - 1)
    const filterDateString = filterDate.toISOString().split('T')[0]
    
    console.log(`🗓️ Filtro aplicado: fecha >= ${filterDateString}`)
    
    const { data, error } = await supabase
      .from('turnos')
      .select('pago, cobro, fecha')
      .eq('estado', 'completado')
      .gte('fecha', filterDateString)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    const totalCosts = data?.reduce((sum, s) => sum + (s.pago || 0), 0) || 0
    const totalIncome = data?.reduce((sum, s) => sum + (s.cobro || 0), 0) || 0
    const margin = totalIncome - totalCosts
    const marginPercent = totalIncome > 0 ? ((margin / totalIncome) * 100) : 0

    console.log('📊 Resultados CON FILTRO ANUAL:')
    console.log(`   • Registros encontrados: ${data?.length}`)
    console.log(`   • Total Ingresos: $${totalIncome.toLocaleString('es-CL')}`)
    console.log(`   • Total Costos: $${totalCosts.toLocaleString('es-CL')}`)
    console.log(`   • Margen: $${margin.toLocaleString('es-CL')} (${marginPercent.toFixed(2)}%)`)
    
    // Mostrar fechas de muestra
    if (data?.length > 0) {
      const fechas = data?.map(d => d.fecha).sort()
      console.log(`   • Fecha más antigua: ${fechas[0]}`)
      console.log(`   • Fecha más reciente: ${fechas[fechas.length - 1]}`)
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error)
  }
  
  console.log('\n')
}

/**
 * Test 4: Tendencias - CON filtro 7 días
 */
async function testTrendsData7Days() {
  console.log('📈 TEST 4: TENDENCIAS CON FILTRO 7 DÍAS')
  console.log('--------------------------------------')
  
  try {
    // Calcular fecha de inicio (7 días atrás)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    const filterDateString = startDate.toISOString().split('T')[0]
    
    console.log(`🗓️ Filtro aplicado: fecha >= ${filterDateString}`)
    
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha, estado, pago, cobro')
      .gte('fecha', filterDateString)
      .eq('estado', 'completado')
      .order('fecha', { ascending: true })
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('📊 Resultados TENDENCIAS 7 DÍAS:')
    console.log(`   • Registros encontrados: ${data?.length}`)
    
    // Agrupar por fecha
    const dailyData = {}
    data?.forEach(shift => {
      if (!dailyData[shift.fecha]) {
        dailyData[shift.fecha] = { date: shift.fecha, shifts: 0, income: 0, costs: 0 }
      }
      dailyData[shift.fecha].shifts++
      dailyData[shift.fecha].income += shift.cobro || 0
      dailyData[shift.fecha].costs += shift.pago || 0
    })

    const daily = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date))
    
    console.log(`   • Días con datos: ${daily.length}`)
    daily.forEach(day => {
      console.log(`     - ${day.date}: ${day.shifts} turnos, $${day.income.toLocaleString('es-CL')} ingresos, $${day.costs.toLocaleString('es-CL')} costos`)
    })
    
  } catch (error) {
    console.error('❌ Error en test:', error)
  }
  
  console.log('\n')
}

/**
 * Test 5: Top Workers - CON filtro mensual
 */
async function testTopWorkersMonthFilter() {
  console.log('👥 TEST 5: TOP WORKERS CON FILTRO MENSUAL')
  console.log('---------------------------------------')
  
  try {
    // Calcular fecha de filtro (1 mes atrás)
    const filterDate = new Date()
    filterDate.setMonth(filterDate.getMonth() - 1)
    const filterDateString = filterDate.toISOString().split('T')[0]
    
    console.log(`🗓️ Filtro aplicado: fecha >= ${filterDateString}`)
    
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        trabajador_id,
        estado,
        pago,
        fecha,
        trabajador:trabajador_id (
          nombre
        )
      `)
      .eq('estado', 'completado')
      .gte('fecha', filterDateString)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('📊 Resultados TOP WORKERS MENSUAL:')
    console.log(`   • Registros encontrados: ${data?.length}`)
    
    // Agrupar por trabajador
    const workerStats = {}
    data?.forEach(shift => {
      const workerId = shift.trabajador_id
      if (!workerStats[workerId]) {
        workerStats[workerId] = {
          id: workerId,
          name: shift.trabajador?.nombre || 'Trabajador Desconocido',
          shifts: 0,
          totalPay: 0
        }
      }
      workerStats[workerId].shifts++
      workerStats[workerId].totalPay += shift.pago || 0
    })

    const topWorkers = Object.values(workerStats)
      .sort((a, b) => b.shifts - a.shifts)
      .slice(0, 5)

    console.log(`   • Top 5 trabajadores:`)
    topWorkers.forEach((worker, index) => {
      console.log(`     ${index + 1}. ${worker.name}: ${worker.shifts} turnos, $${worker.totalPay.toLocaleString('es-CL')}`)
    })
    
  } catch (error) {
    console.error('❌ Error en test:', error)
  }
  
  console.log('\n')
}

/**
 * Test 6: Verificar datos en la base de datos
 */
async function testDatabaseContents() {
  console.log('🗄️ TEST 6: VERIFICAR CONTENIDO BASE DE DATOS')
  console.log('--------------------------------------------')
  
  try {
    // Contar total de turnos
    const { data: turnosData, error: turnosError } = await supabase
      .from('turnos')
      .select('id, fecha, estado, pago, cobro')
    
    if (turnosError) {
      console.error('❌ Error turnos:', turnosError)
      return
    }

    console.log('📊 Contenido Base de Datos:')
    console.log(`   • Total turnos: ${turnosData?.length}`)
    
    const estadosCount = {}
    turnosData?.forEach(turno => {
      estadosCount[turno.estado] = (estadosCount[turno.estado] || 0) + 1
    })
    
    console.log('   • Por estado:')
    Object.entries(estadosCount).forEach(([estado, count]) => {
      console.log(`     - ${estado}: ${count}`)
    })
    
    // Verificar fechas disponibles
    const fechas = turnosData?.map(t => t.fecha).filter(f => f).sort()
    if (fechas.length > 0) {
      console.log(`   • Rango fechas: ${fechas[0]} a ${fechas[fechas.length - 1]}`)
    }
    
    // Verificar si hay datos con pago y cobro
    const conPago = turnosData?.filter(t => t.pago && t.pago > 0).length || 0
    const conCobro = turnosData?.filter(t => t.cobro && t.cobro > 0).length || 0
    
    console.log(`   • Turnos con pago: ${conPago}`)
    console.log(`   • Turnos con cobro: ${conCobro}`)
    
  } catch (error) {
    console.error('❌ Error en test:', error)
  }
  
  console.log('\n')
}

/**
 * Test 7: Simular exactamente las funciones del Dashboard
 */
async function testExactDashboardLogic() {
  console.log('🎯 TEST 7: LÓGICA EXACTA DEL DASHBOARD')
  console.log('------------------------------------')
  
  console.log('Simulando loadFinancialData("all")...')
  
  let query = supabase
    .from('turnos')
    .select('pago, cobro, fecha')
    .eq('estado', 'completado')

  // No aplicar filtros para "all"
  let filterDate = null
  console.log('💰 Filtro fecha aplicado:', { financialRange: 'all', filterDate })
  
  const { data, error } = await query

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('💰 Registros encontrados ANTES del filtro:', data?.length)

  const totalCosts = data?.reduce((sum, s) => sum + (s.pago || 0), 0) || 0
  const totalIncome = data?.reduce((sum, s) => sum + (s.cobro || 0), 0) || 0
  const margin = totalIncome - totalCosts
  const marginPercent = totalIncome > 0 ? ((margin / totalIncome) * 100) : 0

  console.log('💰 Datos financieros cargados:', { totalIncome, totalCosts, margin, registros: data?.length })
  
  console.log('\n')
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  console.log(`🕐 Iniciando tests - ${new Date().toLocaleString('es-CL')}\n`)
  
  await testDatabaseContents()
  await testFinancialDataNoFilter()
  await testFinancialDataMonthFilter()
  await testFinancialDataYearFilter()
  await testTrendsData7Days()
  await testTopWorkersMonthFilter()
  await testExactDashboardLogic()
  
  console.log('✅ TESTS COMPLETADOS')
  console.log('==================')
}

// Ejecutar tests
runAllTests().catch(console.error)
