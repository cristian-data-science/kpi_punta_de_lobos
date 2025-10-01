const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

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
