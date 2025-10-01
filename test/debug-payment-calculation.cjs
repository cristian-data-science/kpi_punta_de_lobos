const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en .env.local')
  process.exit(1)
}

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

    console.log('📊 Tarifas obtenidas:', ratesResult.data)
    console.log('📅 Feriados obtenidos:', holidaysResult.data?.length || 0)

    // Convertir tarifas a formato esperado
    const shiftRates = {}
    ratesResult.data.forEach(rate => {
      shiftRates[rate.rate_name] = rate.rate_value
    })

    console.log('💰 Tarifas convertidas:', shiftRates)

    // Convertir feriados a array de fechas
    const holidays = holidaysResult.data.map(h => h.holiday_date)

    // Crear fecha local correctamente para evitar problemas de zona horaria
    const [year, month, day] = fecha.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day) // month - 1 porque van de 0-11
    
    const dayOfWeek = dateObj.getDay() // 0 = Domingo, 1 = Lunes, etc.
    const isHoliday = holidays.includes(fecha)
    
    console.log(`📅 Fecha parseada: ${dateObj}, Día: ${dayOfWeek}, Es feriado: ${isHoliday}`)
    
    // Convertir turno_tipo a número
    const shiftTypeNumber = turnoTipo === 'primer_turno' ? 1 : 
                           turnoTipo === 'segundo_turno' ? 2 : 
                           turnoTipo === 'tercer_turno' ? 3 : 1

    console.log(`🔢 Turno convertido: ${turnoTipo} => ${shiftTypeNumber}`)

    // REGLAS DE TARIFAS (misma lógica que Calendar.jsx)
    
    // REGLA 1: Domingo siempre paga tarifa de domingo cualquier turno
    if (dayOfWeek === 0) {
      const tarifa = shiftRates.sunday || 35000
      console.log(`💰 REGLA 1 - Domingo: $${tarifa?.toLocaleString()}`)
      return tarifa
    }

    // REGLA 2: Si es festivo (y no es domingo), paga tarifa de feriado cualquier turno  
    if (isHoliday && dayOfWeek !== 0) {
      const tarifa = shiftRates.holiday || 27500
      console.log(`💰 REGLA 2 - Feriado: $${tarifa?.toLocaleString()}`)
      return tarifa
    }

    // REGLA 3: Si no aplica lo anterior y es sábado 3er turno, paga tarifa sábado
    if (dayOfWeek === 6 && shiftTypeNumber === 3) {
      const tarifa = shiftRates.thirdShiftSaturday || 27500
      console.log(`💰 REGLA 3 - Sábado 3er turno: $${tarifa?.toLocaleString()}`)
      return tarifa
    }

    // REGLA 4: Si no aplica lo anterior y es lunes a viernes 3er turno, paga tarifa 3er turno
    if (shiftTypeNumber === 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      const tarifa = shiftRates.thirdShiftWeekday || 22500
      console.log(`💰 REGLA 4 - 3er turno L-V: $${tarifa?.toLocaleString()}`)
      return tarifa
    }

    // REGLA 5: En los demás casos (1° o 2° turno lunes a sábado), paga tarifa normal
    const tarifa = shiftRates.firstSecondShift || 20000
    console.log(`💰 REGLA 5 - 1° o 2° turno: $${tarifa?.toLocaleString()}`)
    return tarifa
    
  } catch (error) {
    console.error('❌ Error calculando tarifa desde Supabase:', error)
    // Fallback a tarifas por defecto
    return 20000
  }
}

async function debugPaymentCalculation() {
  try {
    console.log('🔍 Iniciando debug de cálculo de pagos...\n')
    
    // Obtener algunos turnos programados para probar
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('id, fecha, turno_tipo, trabajador_id')
      .eq('estado', 'programado')
      .limit(5)
    
    if (error) {
      console.error('❌ Error obteniendo turnos:', error)
      return
    }
    
    console.log(`📋 Turnos a probar: ${turnos?.length || 0}`)
    
    for (const turno of turnos || []) {
      console.log(`\n=== PROCESANDO TURNO ${turno.id} ===`)
      console.log(`📅 Fecha: ${turno.fecha}`)
      console.log(`🔄 Tipo: ${turno.turno_tipo}`)
      
      const tarifa = await calculateShiftRateFromSupabase(turno.fecha, turno.turno_tipo)
      
      console.log(`💰 RESULTADO FINAL: ${tarifa}`)
      console.log(`🔍 Tipo de dato: ${typeof tarifa}`)
      console.log(`❓ Es válido: ${tarifa != null && tarifa > 0}`)
      
      if (tarifa == null || tarifa <= 0) {
        console.error(`⚠️  PROBLEMA: Tarifa inválida para turno ${turno.id}`)
      }
    }
    
    console.log('\n✅ Debug completado')
    
  } catch (error) {
    console.error('❌ Error en debug:', error)
  }
}

// Ejecutar debug
debugPaymentCalculation()
