const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function checkShiftRates() {
  console.log('🔍 Verificando tabla shift_rates...')
  
  try {
    const { data: rates, error } = await supabase
      .from('shift_rates')
      .select('*')
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Tarifas encontradas:', rates?.length || 0)
    if (rates && rates.length > 0) {
      rates.forEach((rate, index) => {
        console.log(`   ${index + 1}. ${rate.shift_type}: $${rate.rate?.toLocaleString() || 'N/A'}`)
      })
    } else {
      console.log('⚠️ No hay tarifas en la tabla')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkShiftRates()
