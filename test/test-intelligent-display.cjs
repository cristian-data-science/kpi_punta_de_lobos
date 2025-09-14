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

// Función que simula getDisplayValue
const getDisplayValue = (turno, currentRates, currentHolidays) => {
  if (turno.estado === 'completado' && turno.pago != null) {
    // Turno completado: mostrar el pago que se guardó
    return turno.pago
  } else {
    // Turno programado: calcular tarifa actual
    if (Object.keys(currentRates).length === 0) return 0
    return calculateShiftRateInMemory(turno.fecha, turno.turno_tipo, currentRates, currentHolidays)
  }
}

async function testDisplayValues() {
  try {
    console.log('🎯 Probando valores de visualización INTELIGENTES...\n')
    
    // ===== PASO 1: Cargar tarifas actuales =====
    console.log('📊 Cargando tarifas actuales...')
    const [ratesResult, holidaysResult] = await Promise.all([
      supabase.from('shift_rates').select('*').order('rate_name'),
      supabase.from('holidays').select('holiday_date').order('holiday_date')
    ])

    if (ratesResult.error) throw ratesResult.error
    if (holidaysResult.error) throw holidaysResult.error

    const currentRates = {}
    ratesResult.data.forEach(rate => {
      currentRates[rate.rate_name] = rate.rate_value
    })
    const currentHolidays = holidaysResult.data.map(h => h.holiday_date)
    
    console.log('✅ Tarifas actuales:', Object.keys(currentRates).length)
    console.log('✅ Feriados:', currentHolidays.length)
    
    // ===== PASO 2: Obtener algunos turnos de ejemplo =====
    console.log('\n📋 Obteniendo turnos de ejemplo...')
    const { data: turnos, error: fetchError } = await supabase
      .from('turnos')
      .select('id, fecha, turno_tipo, estado, pago')
      .limit(10)
      .order('fecha', { ascending: false })
    
    if (fetchError) throw fetchError
    
    console.log(`✅ ${turnos?.length || 0} turnos obtenidos\n`)
    
    // ===== PASO 3: Mostrar valores para cada turno =====
    console.log('🎯 COMPARATIVA: Programado vs Completado\n')
    
    for (const turno of turnos || []) {
      const valorMostrado = getDisplayValue(turno, currentRates, currentHolidays)
      const tarifaActual = calculateShiftRateInMemory(turno.fecha, turno.turno_tipo, currentRates, currentHolidays)
      
      console.log(`=== TURNO ${turno.id} ===`)
      console.log(`📅 Fecha: ${turno.fecha}`)
      console.log(`🔄 Tipo: ${turno.turno_tipo}`)
      console.log(`📊 Estado: ${turno.estado}`)
      
      if (turno.estado === 'completado') {
        console.log(`💰 Pago registrado: $${turno.pago?.toLocaleString() || 'NULL'}`)
        console.log(`📊 Tarifa actual: $${tarifaActual.toLocaleString()} (no se muestra)`)
        console.log(`🎯 VALOR MOSTRADO: $${valorMostrado.toLocaleString()} (PAGO FIJO) 💰`)
      } else {
        console.log(`💰 Pago registrado: ${turno.pago || 'NULL'} (aún no completado)`)
        console.log(`📊 Tarifa actual: $${tarifaActual.toLocaleString()}`)
        console.log(`🎯 VALOR MOSTRADO: $${valorMostrado.toLocaleString()} (TARIFA ACTUAL) 📊`)
      }
      
      console.log('')
    }
    
    console.log('🎉 Prueba de valores inteligentes completada!')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar prueba
testDisplayValues()
