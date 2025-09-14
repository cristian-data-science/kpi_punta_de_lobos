/**
 * Script para crear las tablas de calendario en Supabase
 * Ejecuta el SQL para crear shift_rates y holidays
 */

const { createClient } = require('@supabase/supabase-js')
const { readFileSync } = require('fs')
const { join } = require('path')
const __dirname = require('path').dirname(__filename)

async function createCalendarTables() {
  // Configurar cliente Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://csqxopqlgujduhmwxixo.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada')
    console.log('Por favor configura la variable de entorno SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('🚀 Creando tablas de calendario en Supabase...')
    
    // Leer el archivo SQL
    const sqlPath = join(__dirname, 'create-calendar-tables.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')
    
    // Ejecutar el SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      // Si no existe la función exec_sql, ejecutamos paso a paso
      console.log('ℹ️ Ejecutando comandos SQL individuales...')
      
      // Separar comandos SQL
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
      
      for (const command of commands) {
        if (command.trim()) {
          const { error: cmdError } = await supabase.rpc('exec_raw_sql', { query: command })
          if (cmdError) {
            // Intentar con query normal si rpc falla
            const { error: queryError } = await supabase.from('dummy').select('*').limit(0)
            // Como no podemos ejecutar DDL directamente, mostraremos el SQL
            console.log('⚠️ No se puede ejecutar DDL via JavaScript. Ejecuta manualmente en Supabase:')
            console.log('\n--- COPIAR Y PEGAR EN SUPABASE SQL EDITOR ---')
            console.log(sqlContent)
            console.log('--- FIN DEL SQL ---\n')
            
            // Verificar si las tablas ya existen
            const { data: tablesData, error: tablesError } = await supabase
              .from('information_schema.tables')
              .select('table_name')
              .in('table_name', ['shift_rates', 'holidays'])
              .eq('table_schema', 'public')
            
            if (!tablesError && tablesData && tablesData.length > 0) {
              console.log('✅ Las tablas ya existen:', tablesData.map(t => t.table_name))
            }
            return
          }
        }
      }
    }
    
    // Verificar que las tablas se crearon
    console.log('🔍 Verificando tablas creadas...')
    
    const { data: shiftRates, error: srError } = await supabase
      .from('shift_rates')
      .select('*')
      .limit(1)
      
    const { data: holidays, error: hError } = await supabase
      .from('holidays') 
      .select('*')
      .limit(1)
    
    if (!srError && !hError) {
      console.log('✅ Tablas creadas exitosamente!')
      
      // Mostrar datos insertados
      const { data: allRates } = await supabase
        .from('shift_rates')
        .select('*')
        .order('rate_name')
        
      const { data: allHolidays } = await supabase
        .from('holidays')
        .select('*')
        .order('holiday_date')
      
      console.log(`📊 ${allRates?.length || 0} tarifas insertadas`)
      console.log(`📅 ${allHolidays?.length || 0} feriados insertados`)
      
    } else {
      console.log('⚠️ Error verificando tablas:', srError || hError)
      console.log('\n🔧 Si las tablas no se crearon, ejecuta manualmente en Supabase:')
      console.log('\n--- COPIAR Y PEGAR EN SUPABASE SQL EDITOR ---')
      console.log(sqlContent)
      console.log('--- FIN DEL SQL ---\n')
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando script:', error.message)
    
    // Mostrar el SQL para ejecución manual
    const sqlPath = join(__dirname, 'create-calendar-tables.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')
    
    console.log('\n🔧 Ejecuta manualmente en Supabase SQL Editor:')
    console.log('\n--- COPIAR Y PEGAR EN SUPABASE SQL EDITOR ---')
    console.log(sqlContent)
    console.log('--- FIN DEL SQL ---\n')
  }
}

// Ejecutar directamente
createCalendarTables()
