// Test específico para verificar lectura de cobro_tarifa correctamente
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCobroTarifaCorrect() {
  console.log('🧾 Testing lectura correcta de cobro_tarifa...')
  
  try {
    // 1. Ver toda la estructura de shift_rates
    console.log('\n📊 1. Estructura completa de shift_rates:')
    const { data: allData, error: allError } = await supabase
      .from('shift_rates')
      .select('*')
      .order('rate_name')
    
    if (allError) {
      console.error('❌ Error:', allError)
      return
    }
    
    console.table(allData)
    
    // 2. Buscar específicamente cobro_tarifa
    console.log('\n🔍 2. Buscando rate_name = "cobro_tarifa":')
    const { data: cobroData, error: cobroError } = await supabase
      .from('shift_rates')
      .select('rate_name, rate_value')
      .eq('rate_name', 'cobro_tarifa')
    
    if (cobroError) {
      console.error('❌ Error buscando cobro_tarifa:', cobroError)
      return
    }
    
    if (cobroData.length === 0) {
      console.log('❌ No se encontró registro con rate_name = "cobro_tarifa"')
      console.log('🔧 Necesitas crear el registro:')
      console.log('INSERT INTO shift_rates (rate_name, rate_value) VALUES (\'cobro_tarifa\', 25000);')
    } else {
      console.log('✅ Registro cobro_tarifa encontrado:')
      console.table(cobroData)
      console.log(`💰 Valor de cobro: $${cobroData[0].rate_value}`)
    }
    
    // 3. Test usando single() como en el código
    console.log('\n🎯 3. Test usando .single() (como en el código):')
    const { data: singleData, error: singleError } = await supabase
      .from('shift_rates')
      .select('rate_value')
      .eq('rate_name', 'cobro_tarifa')
      .single()
    
    if (singleError) {
      console.error('❌ Error con .single():', singleError)
    } else {
      console.log('✅ Lectura con .single() exitosa:', singleData.rate_value)
    }
    
    // 4. Test usando find() como en semana completa
    console.log('\n🔎 4. Test usando find() (como en semana completa):')
    const cobroRecord = allData.find(rate => rate.rate_name === 'cobro_tarifa')
    if (cobroRecord) {
      console.log('✅ Encontrado con find():', cobroRecord.rate_value)
    } else {
      console.log('❌ No encontrado con find()')
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar test
testCobroTarifaCorrect()
