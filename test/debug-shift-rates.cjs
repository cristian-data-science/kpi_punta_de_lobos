const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function debugShiftRates() {
  console.log('🔍 Debug tabla shift_rates...')
  
  try {
    // Primero, intentemos ver la estructura raw
    const { data: rates, error } = await supabase
      .from('shift_rates')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('📊 Estructura de un registro:')
    console.log(JSON.stringify(rates[0], null, 2))
    
    // También probar nombres específicos de columnas
    const { data: rates2, error2 } = await supabase
      .from('shift_rates')
      .select('shift_type, rate')
    
    if (error2) {
      console.error('❌ Error específico:', error2)
    } else {
      console.log('\n✅ Datos con nombres específicos:')
      rates2.forEach((rate, index) => {
        console.log(`   ${index + 1}. ${rate.shift_type}: $${rate.rate?.toLocaleString()}`)
      })
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

debugShiftRates()
