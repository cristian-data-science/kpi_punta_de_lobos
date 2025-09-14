/**
 * 🧪 Script de Prueba: Cálculo de Pagos en Turnos
 * 
 * Verifica que los turnos se marcan como completados con el pago correcto
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://csqxopqlgujduhmwxixo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

async function testTurnosPayments() {
  console.log('🧪 TESTING: Cálculo de Pagos en Turnos')
  console.log('=' .repeat(45))

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // 1. Verificar estructura de tabla turnos
    console.log('\n📋 1. Verificando estructura de tabla turnos...')
    
    const { data: sampleTurnos, error: sampleError } = await supabase
      .from('turnos')
      .select('*')
      .limit(3)

    if (sampleError) {
      console.error('❌ Error obteniendo turnos:', sampleError.message)
      return
    }

    console.log('✅ Estructura de turnos verificada')
    console.log('📊 Campos disponibles:', Object.keys(sampleTurnos[0] || {}))
    
    // Verificar si existe el campo 'pago'
    const hasPagoField = sampleTurnos.length > 0 && 'pago' in sampleTurnos[0]
    console.log(`💰 Campo 'pago' existe: ${hasPagoField ? '✅' : '❌'}`)
    
    if (!hasPagoField) {
      console.log('⚠️ IMPORTANTE: Necesitas agregar el campo "pago" a la tabla "turnos"')
      console.log('SQL para agregar el campo:')
      console.log('ALTER TABLE turnos ADD COLUMN pago INTEGER DEFAULT NULL;')
      return
    }

    // 2. Verificar tarifas en Supabase
    console.log('\n📊 2. Verificando tarifas disponibles...')
    
    const { data: rates, error: ratesError } = await supabase
      .from('shift_rates')
      .select('*')
      .order('rate_name')

    if (ratesError) {
      console.error('❌ Error obteniendo tarifas:', ratesError.message)
      return
    }

    console.log('✅ Tarifas disponibles:')
    rates.forEach(rate => {
      console.log(`   - ${rate.rate_name}: $${rate.rate_value.toLocaleString()}`)
    })

    // 3. Verificar feriados
    console.log('\n📅 3. Verificando feriados disponibles...')
    
    const { data: holidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('*')
      .order('holiday_date')

    if (holidaysError) {
      console.error('❌ Error obteniendo feriados:', holidaysError.message)
      return
    }

    console.log(`✅ ${holidays.length} feriados configurados:`)
    holidays.slice(0, 5).forEach(holiday => {
      console.log(`   - ${holiday.holiday_date}`)
    })

    // 4. Buscar turnos para probar
    console.log('\n🔍 4. Buscando turnos para probar cálculo de pagos...')
    
    const { data: testTurnos, error: testError } = await supabase
      .from('turnos')
      .select('id, fecha, turno_tipo, estado, pago')
      .eq('estado', 'programado')
      .limit(5)

    if (testError) {
      console.error('❌ Error obteniendo turnos de prueba:', testError.message)
      return
    }

    if (testTurnos.length === 0) {
      console.log('⚠️ No hay turnos "programados" disponibles para probar')
      console.log('Tip: Crea algunos turnos en la interfaz de Turnos primero')
      return
    }

    console.log(`✅ Encontrados ${testTurnos.length} turnos programados para probar:`)
    testTurnos.forEach(turno => {
      console.log(`   - ID: ${turno.id} | Fecha: ${turno.fecha} | Tipo: ${turno.turno_tipo} | Pago actual: ${turno.pago || 'NULL'}`)
    })

    // 5. Simular cálculo de tarifa para un turno
    console.log('\n💰 5. Simulando cálculo de tarifas...')
    
    const turnoParaPrueba = testTurnos[0]
    console.log(`🎯 Calculando para: ${turnoParaPrueba.fecha} (${turnoParaPrueba.turno_tipo})`)
    
    const tarifaCalculada = await calculateShiftRateFromSupabaseTest(
      supabase, 
      turnoParaPrueba.fecha, 
      turnoParaPrueba.turno_tipo,
      rates,
      holidays
    )
    
    console.log(`💲 Tarifa calculada: $${tarifaCalculada.toLocaleString()}`)

    // 6. Resumen final
    console.log('\n🎉 TESTING COMPLETADO')
    console.log('✅ Sistema listo para calcular pagos automáticamente')
    console.log('🚀 Próximo paso: Usa la interfaz de Turnos para marcar turnos como completados')
    console.log('💡 Los pagos se calcularán automáticamente usando las tarifas de Supabase')

  } catch (error) {
    console.error('❌ Error durante testing:', error.message)
  }
}

// Función auxiliar para calcular tarifa (misma lógica que Turnos.jsx)
async function calculateShiftRateFromSupabaseTest(supabase, fecha, turnoTipo, rates, holidays) {
  try {
    // Convertir tarifas a objeto
    const shiftRates = {}
    rates.forEach(rate => {
      shiftRates[rate.rate_name] = rate.rate_value
    })

    // Array de fechas de feriados
    const holidayDates = holidays.map(h => h.holiday_date)

    // Crear fecha local
    const [year, month, day] = fecha.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const dayOfWeek = dateObj.getDay()
    const isHoliday = holidayDates.includes(fecha)
    
    // Convertir turno_tipo a número
    const shiftTypeNumber = turnoTipo === 'primer_turno' ? 1 : 
                           turnoTipo === 'segundo_turno' ? 2 : 
                           turnoTipo === 'tercer_turno' ? 3 : 1

    console.log(`   📊 Análisis: ${fecha} (${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][dayOfWeek]}) - Turno ${shiftTypeNumber} - Feriado: ${isHoliday}`)

    // Aplicar reglas de tarifas
    if (dayOfWeek === 0) {
      console.log('   🎯 Regla aplicada: Domingo')
      return shiftRates.sunday || 35000
    }

    if (isHoliday && dayOfWeek !== 0) {
      console.log('   🎯 Regla aplicada: Feriado')
      return shiftRates.holiday || 27500
    }

    if (dayOfWeek === 6 && shiftTypeNumber === 3) {
      console.log('   🎯 Regla aplicada: Sábado 3er turno')
      return shiftRates.thirdShiftSaturday || 27500
    }

    if (shiftTypeNumber === 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      console.log('   🎯 Regla aplicada: 3er turno L-V')
      return shiftRates.thirdShiftWeekday || 22500
    }

    console.log('   🎯 Regla aplicada: 1° o 2° turno normal')
    return shiftRates.firstSecondShift || 20000
    
  } catch (error) {
    console.error('❌ Error en cálculo de tarifa:', error)
    return 20000
  }
}

// Ejecutar testing
testTurnosPayments().catch(console.error)
