const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function setupCalendarTables() {
  console.log('🚀 Configuración de tablas de calendario para TransApp')
  console.log('=' .repeat(60))

  // Leer el SQL
  const sqlPath = path.join(__dirname, 'create-calendar-tables.sql')
  const sqlContent = fs.readFileSync(sqlPath, 'utf8')
  
  console.log('📋 INSTRUCCIONES:')
  console.log('1. Ve a https://supabase.com/dashboard')
  console.log('2. Abre tu proyecto TransApp') 
  console.log('3. Ve a SQL Editor')
  console.log('4. Copia y pega el siguiente SQL:')
  console.log('')
  console.log('--- COPIAR TODO EL CÓDIGO DEBAJO ---')
  console.log(sqlContent)
  console.log('--- COPIAR TODO EL CÓDIGO ARRIBA ---')
  console.log('')
  
  // Intentar verificar conexión
  try {
    const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key-aqui'
    
    if (supabaseAnonKey !== 'tu-anon-key-aqui') {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Verificar si las tablas ya existen
      const { data: shiftRates, error: srError } = await supabase
        .from('shift_rates')
        .select('count')
        .limit(1)
        
      const { data: holidays, error: hError } = await supabase
        .from('holidays')
        .select('count') 
        .limit(1)
      
      if (!srError && !hError) {
        console.log('✅ Las tablas YA EXISTEN en Supabase')
        console.log('📊 Tablas detectadas: shift_rates, holidays')
        return
      }
    }
  } catch (error) {
    // Ignorar errores de conexión
  }
  
  console.log('⏳ Después de ejecutar el SQL, las tablas estarán listas para usar')
  console.log('🎯 Próximo paso: modificar Calendar.jsx para usar Supabase')
}

setupCalendarTables().catch(console.error)
