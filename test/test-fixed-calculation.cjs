const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM1NDkzMywiZXhwIjoyMDcyOTMwOTMzfQ.sKq7WvocXEyL9l5BcRsZOfJFnf9ZaRlOYL0acfUg5II'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function calculateShiftRateFromSupabase(fecha, turnoTipo) {
  try {
    console.log(`💰 Calculando tarifa para fecha: ${fecha}, turno: ${turnoTipo}`)
    
    // Cargar tarifas y feriados desde Supabase
    const [ratesResult, holidaysResult] = await Promise.all([
      supabase.from('shift_rates').select('*').order('rate_name'),
      supabase.from('holidays').select('holiday_date').order('holiday_date')
    ])

    if (ratesResult.error) throw ratesResult.error
    if (holidaysResult.error) throw holidaysResult.error

    // Convertir tarifas a formato esperado
    const shiftRates = {}
    ratesResult.data.forEach(rate => {
      shiftRates[rate.rate_name] = rate.rate_value
    })

    // Convertir feriados a array de fechas
    const holidays = holidaysResult.data.map(h => h.holiday_date)

    // Crear fecha local correctamente para evitar problemas de zona horaria
    const [year, month, day] = fecha.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day) // month - 1 porque van de 0-11
    
    const dayOfWeek = dateObj.getDay() // 0 = Domingo, 1 = Lunes, etc.
    const isHoliday = holidays.includes(fecha)
    
    // Convertir turno_tipo a número
    const shiftTypeNumber = turnoTipo === 'primer_turno' ? 1 : 
                           turnoTipo === 'segundo_turno' ? 2 : 
                           turnoTipo === 'tercer_turno' ? 3 : 1

    // REGLAS DE TARIFAS CON VALIDACIÓN DE ENTEROS
    
    // REGLA 1: Domingo siempre paga tarifa de domingo cualquier turno
    if (dayOfWeek === 0) {
      const tarifa = Math.floor(shiftRates.sunday || 35000) // Asegurar entero
      console.log(`💰 Domingo: $${tarifa.toLocaleString()}`)
      return tarifa
    }

    // REGLA 2: Si es festivo (y no es domingo), paga tarifa de feriado cualquier turno  
    if (isHoliday && dayOfWeek !== 0) {
      const tarifa = Math.floor(shiftRates.holiday || 27500) // Asegurar entero
      console.log(`💰 Feriado: $${tarifa.toLocaleString()}`)
      return tarifa
    }

    // REGLA 3: Si no aplica lo anterior y es sábado 3er turno, paga tarifa sábado
    if (dayOfWeek === 6 && shiftTypeNumber === 3) {
      const tarifa = Math.floor(shiftRates.thirdShiftSaturday || 27500) // Asegurar entero
      console.log(`💰 Sábado 3er turno: $${tarifa.toLocaleString()}`)
      return tarifa
    }

    // REGLA 4: Si no aplica lo anterior y es lunes a viernes 3er turno, paga tarifa 3er turno
    if (shiftTypeNumber === 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      const tarifa = Math.floor(shiftRates.thirdShiftWeekday || 22500) // Asegurar entero
      console.log(`💰 3er turno L-V: $${tarifa.toLocaleString()}`)
      return tarifa
    }

    // REGLA 5: En los demás casos (1° o 2° turno lunes a sábado), paga tarifa normal
    const tarifa = Math.floor(shiftRates.firstSecondShift || 20000) // Asegurar entero
    console.log(`💰 1° o 2° turno: $${tarifa.toLocaleString()}`)
    return tarifa
    
  } catch (error) {
    console.error('❌ Error calculando tarifa desde Supabase:', error)
    // Fallback a tarifas por defecto (asegurar entero)
    return 20000
  }
}

async function testFixedCalculation() {
  try {
    console.log('🔧 Probando función de cálculo ARREGLADA...\n')
    
    // Obtener algunos turnos programados
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('id, fecha, turno_tipo')
      .eq('estado', 'programado')
      .limit(3)
    
    if (error) {
      console.error('❌ Error obteniendo turnos:', error)
      return
    }
    
    console.log(`📋 Probando ${turnos?.length || 0} turnos...\n`)
    
    for (const turno of turnos || []) {
      console.log(`=== TURNO ${turno.id} ===`)
      
      const tarifa = await calculateShiftRateFromSupabase(turno.fecha, turno.turno_tipo)
      const tarifaValidada = Math.floor(Number(tarifa))
      
      console.log(`🔍 Tarifa original: ${tarifa} (${typeof tarifa})`)
      console.log(`✅ Tarifa validada: ${tarifaValidada} (${typeof tarifaValidada})`)
      console.log(`📊 Es entero válido: ${Number.isInteger(tarifaValidada) && tarifaValidada > 0}`)
      
      // Probar actualización real
      console.log(`🧪 Probando actualización en BD...`)
      try {
        const { data, error: updateError } = await supabase
          .from('turnos')
          .update({ pago: tarifaValidada })
          .eq('id', turno.id)
          .select('pago')
        
        if (updateError) {
          console.error(`❌ ERROR en actualización:`, updateError.message)
        } else {
          console.log(`✅ ÉXITO en actualización: $${data?.[0]?.pago?.toLocaleString()}`)
        }
      } catch (updateException) {
        console.error(`❌ EXCEPCIÓN en actualización:`, updateException.message)
      }
      
      console.log('')
    }
    
    console.log('🎉 Prueba de función arreglada completada')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar prueba
testFixedCalculation()
