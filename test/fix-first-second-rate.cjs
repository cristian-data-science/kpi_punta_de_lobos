const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM1NDkzMywiZXhwIjoyMDcyOTMwOTMzfQ.sBQ9BHi7vLXXOCRYLUkBDWrlKxJCGNAzW-a0b2FTm4I'
)

async function fixFirstSecondShiftRate() {
  console.log('🔧 Corrigiendo tarifa de primer y segundo turno...')
  
  try {
    const { data, error } = await supabase
      .from('shift_rates')
      .update({ rate_value: 20000 })
      .eq('rate_name', 'firstSecondShift')
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Tarifa corregida: firstSecondShift = $20,000')

    // Verificar el cambio
    const { data: rates, error: checkError } = await supabase
      .from('shift_rates')
      .select('rate_name, rate_value, description')
    
    if (!checkError) {
      console.log('\n📊 Tarifas actualizadas:')
      rates.forEach((rate, index) => {
        console.log(`   ${index + 1}. ${rate.rate_name}: $${rate.rate_value?.toLocaleString()} (${rate.description})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixFirstSecondShiftRate()
