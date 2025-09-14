#!/usr/bin/env node

/**
 * Script para actualizar todos los nombres de trabajadores a MAYÚSCULAS en Supabase
 * Ejecutar: node test/update-names-to-uppercase.cjs
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateNamesToUppercase() {
  try {
    console.log('🚀 Iniciando actualización de nombres a MAYÚSCULAS...')
    
    // 1. Obtener todos los trabajadores
    const { data: workers, error: fetchError } = await supabase
      .from('trabajadores')
      .select('id, nombre')
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`📋 Encontrados ${workers.length} trabajadores`)
    
    // 2. Identificar trabajadores que necesitan actualización
    const workersToUpdate = workers.filter(worker => {
      return worker.nombre !== worker.nombre.toUpperCase()
    })
    
    console.log(`🔄 Necesitan actualización: ${workersToUpdate.length} trabajadores`)
    
    if (workersToUpdate.length === 0) {
      console.log('✅ Todos los nombres ya están en MAYÚSCULAS')
      return
    }
    
    // 3. Mostrar trabajadores que se actualizarán
    console.log('\n📝 Trabajadores que se actualizarán:')
    workersToUpdate.forEach((worker, index) => {
      console.log(`   ${index + 1}. "${worker.nombre}" → "${worker.nombre.toUpperCase()}"`)
    })
    
    // 4. Actualizar cada trabajador individualmente
    console.log('\n🔄 Iniciando actualizaciones...')
    let updated = 0
    let errors = 0
    
    for (const worker of workersToUpdate) {
      try {
        const { error } = await supabase
          .from('trabajadores')
          .update({ nombre: worker.nombre.toUpperCase() })
          .eq('id', worker.id)
        
        if (error) {
          throw error
        }
        
        updated++
        console.log(`   ✅ ${updated}/${workersToUpdate.length}: "${worker.nombre}" → "${worker.nombre.toUpperCase()}"`)
      } catch (updateError) {
        errors++
        console.error(`   ❌ Error actualizando "${worker.nombre}":`, updateError.message)
      }
    }
    
    // 5. Resumen final
    console.log(`\n📊 Resumen de actualización:`)
    console.log(`   ✅ Actualizados exitosamente: ${updated}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log(`   📋 Total procesados: ${workersToUpdate.length}`)
    
    if (updated > 0) {
      console.log('\n🎉 Actualización completada exitosamente!')
      console.log('💡 Todos los nombres de trabajadores ahora están en MAYÚSCULAS')
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando actualización:', error)
    process.exit(1)
  }
}

// Ejecutar la función
updateNamesToUppercase()
  .then(() => {
    console.log('\n✨ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
