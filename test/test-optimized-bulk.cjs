const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM1NDkzMywiZXhwIjoyMDcyOTMwOTMzfQ.sKq7WvocXEyL9l5BcRsZOfJFnf9ZaRlOYL0acfUg5II'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Función optimizada de cálculo en memoria
const calculateShiftRateInMemory = (fecha, turnoTipo, shiftRates, holidays) => {
  try {
    // Crear fecha local correctamente para evitar problemas de zona horaria
    const [year, month, day] = fecha.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day) // month - 1 porque van de 0-11
    
    const dayOfWeek = dateObj.getDay() // 0 = Domingo, 1 = Lunes, etc.
    const isHoliday = holidays.includes(fecha)
    
    // Convertir turno_tipo a número
    const shiftTypeNumber = turnoTipo === 'primer_turno' ? 1 : 
                           turnoTipo === 'segundo_turno' ? 2 : 
                           turnoTipo === 'tercer_turno' ? 3 : 1

    // REGLAS DE TARIFAS
    
    // REGLA 1: Domingo siempre paga tarifa de domingo cualquier turno
    if (dayOfWeek === 0) {
      return Math.floor(shiftRates.sunday || 35000) // Asegurar entero
    }

    // REGLA 2: Si es festivo (y no es domingo), paga tarifa de feriado cualquier turno  
    if (isHoliday && dayOfWeek !== 0) {
      return Math.floor(shiftRates.holiday || 27500) // Asegurar entero
    }

    // REGLA 3: Si no aplica lo anterior y es sábado 3er turno, paga tarifa sábado
    if (dayOfWeek === 6 && shiftTypeNumber === 3) {
      return Math.floor(shiftRates.thirdShiftSaturday || 27500) // Asegurar entero
    }

    // REGLA 4: Si no aplica lo anterior y es lunes a viernes 3er turno, paga tarifa 3er turno
    if (shiftTypeNumber === 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      return Math.floor(shiftRates.thirdShiftWeekday || 22500) // Asegurar entero
    }

    // REGLA 5: En los demás casos (1° o 2° turno lunes a sábado), paga tarifa normal
    return Math.floor(shiftRates.firstSecondShift || 20000) // Asegurar entero
    
  } catch (error) {
    console.error('❌ Error calculando tarifa en memoria:', error)
    // Fallback a tarifa por defecto
    return 20000
  }
}

async function testOptimizedBulkUpdate() {
  try {
    console.log('🚀 Probando actualización masiva OPTIMIZADA...\n')
    
    const startTime = performance.now()
    
    // ===== PASO 1: Obtener turnos programados =====
    console.log('📋 1. Obteniendo turnos programados...')
    const { data: turnos, error: fetchError } = await supabase
      .from('turnos')
      .select('id, fecha, turno_tipo')
      .eq('estado', 'programado')
      .limit(20) // Limitar para la prueba
    
    if (fetchError) {
      console.error('❌ Error obteniendo turnos:', fetchError)
      return
    }
    
    console.log(`✅ ${turnos?.length || 0} turnos obtenidos`)
    
    if (!turnos || turnos.length === 0) {
      console.log('⚠️ No hay turnos programados para probar')
      return
    }
    
    // ===== PASO 2: Cargar tarifas y feriados UNA SOLA VEZ =====
    console.log('\n📊 2. Cargando tarifas y feriados...')
    const [ratesResult, holidaysResult] = await Promise.all([
      supabase.from('shift_rates').select('*').order('rate_name'),
      supabase.from('holidays').select('holiday_date').order('holiday_date')
    ])

    if (ratesResult.error) throw ratesResult.error
    if (holidaysResult.error) throw holidaysResult.error

    // Convertir a formato optimizado
    const shiftRates = {}
    ratesResult.data.forEach(rate => {
      shiftRates[rate.rate_name] = rate.rate_value
    })
    const holidays = holidaysResult.data.map(h => h.holiday_date)
    
    console.log(`✅ Tarifas cargadas: ${Object.keys(shiftRates).length}`)
    console.log(`✅ Feriados cargados: ${holidays.length}`)
    
    // ===== PASO 3: Calcular todas las tarifas EN MEMORIA =====
    console.log('\n💰 3. Calculando tarifas en memoria...')
    const turnosConPago = turnos.map(turno => {
      const tarifa = calculateShiftRateInMemory(turno.fecha, turno.turno_tipo, shiftRates, holidays)
      return {
        id: turno.id,
        fecha: turno.fecha,
        turno_tipo: turno.turno_tipo,
        pago: Math.floor(Number(tarifa)) // Validar entero
      }
    })
    
    let totalPagos = turnosConPago.reduce((sum, turno) => sum + turno.pago, 0)
    console.log(`✅ Todas las tarifas calculadas en memoria`)
    console.log(`💰 Total calculado: $${totalPagos.toLocaleString()}`)
    
    // Mostrar algunos ejemplos
    console.log('\n📋 Ejemplos de cálculos:')
    turnosConPago.slice(0, 3).forEach(turno => {
      console.log(`  - ${turno.fecha} ${turno.turno_tipo}: $${turno.pago.toLocaleString()}`)
    })
    
    // ===== PASO 4: Simulación de update masivo =====
    console.log('\n🔄 4. Simulando updates masivos...')
    console.log(`⚡ Se ejecutarían ${turnosConPago.length} updates en paralelo`)
    
    // Para la demo, solo actualizamos los primeros 3
    const updates = turnosConPago.slice(0, 3).map(turno => 
      supabase
        .from('turnos')
        .update({ pago: turno.pago }) // Solo actualizamos pago para la demo
        .eq('id', turno.id)
    )
    
    console.log('🧪 Ejecutando 3 updates de prueba en paralelo...')
    const results = await Promise.allSettled(updates)
    
    // Contar éxitos y fallos
    const exitosos = results.filter(r => r.status === 'fulfilled').length
    const fallidos = results.filter(r => r.status === 'rejected').length
    
    console.log(`✅ Updates exitosos: ${exitosos}`)
    console.log(`❌ Updates fallidos: ${fallidos}`)
    
    // ===== TIEMPO TOTAL =====
    const endTime = performance.now()
    const totalTime = (endTime - startTime).toFixed(2)
    
    console.log(`\n⏱️  TIEMPO TOTAL: ${totalTime}ms`)
    console.log(`⚡ OPTIMIZACIÓN: ~${totalTime}ms para ${turnos.length} turnos`)
    console.log(`📊 ANTES: ~${turnos.length * 3 * 100}ms (estimado con 3 queries por turno)`)
    console.log(`🚀 MEJORA: ~${Math.round((turnos.length * 300) / totalTime)}x más rápido`)
    
    console.log('\n🎉 Prueba de optimización completada!')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar prueba
testOptimizedBulkUpdate()
