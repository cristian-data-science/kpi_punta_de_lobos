const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function testModalRateCalculation() {
  console.log('🧪 Probando cálculo de tarifas del modal...')
  
  try {
    // Obtener tarifas actuales
    const { data: rates, error } = await supabase
      .from('shift_rates')
      .select('rate_name, rate_value')
    
    if (error) {
      console.error('❌ Error cargando tarifas:', error)
      return
    }

    const ratesMap = {}
    rates.forEach(rate => {
      ratesMap[rate.rate_name] = rate.rate_value
    })
    
    console.log('✅ Tarifas actuales:', ratesMap)

    // Función de cálculo similar al modal (actualizada)
    function calculateShiftRateInMemory(dateString, shiftType, holidays = []) {
      const [year, month, day] = dateString.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const dayOfWeek = date.getDay()
      const isHolidayDate = holidays.includes(dateString)
      
      // Domingo (cualquier turno) = $35,000
      if (dayOfWeek === 0) {
        return ratesMap['sunday'] || 35000
      }
      
      // Feriados no domingo (cualquier turno) = $27,500
      if (isHolidayDate) {
        return ratesMap['holiday'] || 27500
      }
      
      // Sábado tercer turno = $27,500
      if (dayOfWeek === 6 && shiftType === 'tercer_turno') {
        return ratesMap['thirdShiftSaturday'] || 27500
      }
      
      // Día de semana tercer turno = $22,500
      if (shiftType === 'tercer_turno') {
        return ratesMap['thirdShiftWeekday'] || 22500
      }
      
      // Todos los demás = $20,000
      return ratesMap['firstSecondShift'] || 20000
    }

    // Probar varios casos
    const testCases = [
      { date: '2025-01-27', shift: 'primer_turno', expected: 20000, desc: 'Lunes primer turno' },
      { date: '2025-01-27', shift: 'tercer_turno', expected: 22500, desc: 'Lunes tercer turno' },
      { date: '2025-02-01', shift: 'primer_turno', expected: 20000, desc: 'Sábado primer turno' },
      { date: '2025-02-01', shift: 'tercer_turno', expected: 27500, desc: 'Sábado tercer turno' },
      { date: '2025-02-02', shift: 'primer_turno', expected: 35000, desc: 'Domingo primer turno' },
      { date: '2025-02-02', shift: 'tercer_turno', expected: 35000, desc: 'Domingo tercer turno' }
    ]

    console.log('\n🔍 Pruebas de cálculo:')
    testCases.forEach(testCase => {
      const result = calculateShiftRateInMemory(testCase.date, testCase.shift)
      const status = result === testCase.expected ? '✅' : '❌'
      console.log(`${status} ${testCase.desc}: $${result.toLocaleString()} (esperado: $${testCase.expected.toLocaleString()})`)
    })

  } catch (error) {
    console.error('❌ Error en prueba:', error)
  }
}

testModalRateCalculation()
