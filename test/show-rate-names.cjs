const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function showRateNames() {
  console.log('🔍 Verificando nombres de tarifas...')
  
  try {
    const { data: rates, error } = await supabase
      .from('shift_rates')
      .select('rate_name, rate_value, description')
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Tarifas disponibles:')
    rates.forEach((rate, index) => {
      console.log(`   ${index + 1}. rate_name: "${rate.rate_name}" - $${rate.rate_value?.toLocaleString()} (${rate.description})`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

showRateNames()
