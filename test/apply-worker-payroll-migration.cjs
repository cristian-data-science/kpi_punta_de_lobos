/**
 * 🔧 Script de Migración: Campos de Nómina para Trabajadores
 * Aplica las modificaciones de la tabla trabajadores en Supabase
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
// Necesitas usar la service role key para modificaciones DDL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM1NDkzMywiZXhwIjoyMDcyOTMwOTMzfQ.xaD4D0VQy-L9k0d8GH8T33_-a6IiN9BQrxz5FsDNHnQ'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function applyMigration() {
  console.log('🚀 Iniciando verificación de migración de campos de nómina...\n')

  try {
    console.log('📋 INSTRUCCIONES DE MIGRACIÓN:')
    console.log('   Para aplicar los cambios a la base de datos, ejecuta el siguiente SQL')
    console.log('   en el SQL Editor de Supabase Dashboard:\n')
    console.log('   1. Ve a: https://supabase.com/dashboard/project/csqxopqlgujduhmwxixo/sql/new')
    console.log('   2. Copia el contenido de: sql/add_worker_payroll_fields.sql')
    console.log('   3. Pégalo en el editor y ejecuta\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Verificar estructura actual
    console.log('🔍 Verificando estructura actual de la tabla trabajadores...\n')
    
    const { data: trabajadores, error: selectError } = await supabase
      .from('trabajadores')
      .select('*')
      .limit(1)

    if (selectError) {
      console.error('   ❌ Error al verificar tabla:', selectError.message)
      return
    }

    const trabajador = trabajadores[0]
    if (trabajador) {
      console.log('📊 Campos actuales detectados:')
      Object.keys(trabajador).forEach(key => {
        console.log(`   • ${key}: ${typeof trabajador[key]}`)
      })
      console.log('')

      // Verificar si los nuevos campos ya existen
      const hasSueldoBase = 'sueldo_base' in trabajador
      const hasDiasTrabajados = 'dias_trabajados' in trabajador

      if (hasSueldoBase && hasDiasTrabajados) {
        console.log('✅ Los campos de nómina YA EXISTEN en la tabla')
        console.log('   • sueldo_base: ✓')
        console.log('   • dias_trabajados: ✓')
        console.log('')
        console.log('🎉 La migración ya fue aplicada anteriormente')
      } else {
        console.log('⚠️ Los campos de nómina NO existen todavía')
        if (!hasSueldoBase) console.log('   • sueldo_base: ✗ (falta)')
        if (!hasDiasTrabajados) console.log('   • dias_trabajados: ✗ (falta)')
        console.log('')
        console.log('📝 Acción requerida: Ejecuta el SQL en Supabase Dashboard')
      }
    }

    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔗 SQL File: sql/add_worker_payroll_fields.sql')
    console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/csqxopqlgujduhmwxixo/sql/new')
    console.log('')

  } catch (error) {
    console.error('💥 Error en verificación:', error.message)
  }
}

applyMigration()
