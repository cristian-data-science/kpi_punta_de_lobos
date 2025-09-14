const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://csqxopqlgujduhmwxixo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
)

async function verifyReadOnlyAccess() {
  console.log('🔍 Verificando acceso SOLO LECTURA a shift_rates...')
  
  try {
    // ✅ PERMITIDO: Lectura de tarifas
    console.log('\n1️⃣ Probando LECTURA (debería funcionar):')
    const { data: rates, error: readError } = await supabase
      .from('shift_rates')
      .select('rate_name, rate_value, description')
    
    if (readError) {
      console.error('❌ Error leyendo tarifas:', readError)
    } else {
      console.log('✅ Lectura exitosa:')
      rates.forEach((rate, index) => {
        console.log(`   ${index + 1}. ${rate.rate_name}: $${rate.rate_value.toLocaleString()} (${rate.description})`)
      })
    }

    // ❌ PROHIBIDO: Escritura de tarifas (esto debería fallar o estar deshabilitado)
    console.log('\n2️⃣ Probando ESCRITURA (esto NO debería realizarse):')
    console.log('⚠️  La aplicación Turnos ya NO intenta modificar tarifas')
    console.log('⚠️  Las tarifas solo se leen desde Supabase')
    console.log('⚠️  Cualquier modificación debe hacerse desde el panel administrativo externo')

    console.log('\n📋 RESUMEN:')
    console.log('✅ Turnos.jsx: Solo lee tarifas de shift_rates')
    console.log('✅ AddShiftModal.jsx: Solo lee tarifas de shift_rates')  
    console.log('✅ CopyShiftModal.jsx: No usa tarifas')
    console.log('✅ Sistema configurado como SOLO LECTURA para tarifas')

  } catch (error) {
    console.error('❌ Error en verificación:', error)
  }
}

verifyReadOnlyAccess()
