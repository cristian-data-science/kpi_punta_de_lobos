#!/usr/bin/env node

/**
 * Script para agregar guiones a RUTs que no los tienen en Supabase
 * Ejecutar: node test/fix-rut-format.cjs
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Formatea un RUT agregando el guión si no lo tiene
 * @param {string} rut - RUT sin formato
 * @returns {string} RUT formateado con guión
 */
function formatRutWithDash(rut) {
  if (!rut) return rut
  
  // Si ya tiene guión, devolverlo tal como está
  if (rut.includes('-')) return rut
  
  // Si no tiene guión y tiene la longitud correcta (8-9 dígitos)
  if (rut.length >= 8 && rut.length <= 9) {
    // Separar los últimos dígitos (dígito verificador)
    const rutNumber = rut.slice(0, -1)
    const verifierDigit = rut.slice(-1)
    
    // Agregar el guión
    return `${rutNumber}-${verifierDigit}`
  }
  
  // Si no se puede formatear, devolver original
  return rut
}

async function fixRutFormats() {
  try {
    console.log('🚀 Iniciando corrección de formatos de RUT...')
    
    // 1. Obtener todos los trabajadores
    const { data: workers, error: fetchError } = await supabase
      .from('trabajadores')
      .select('id, rut, nombre')
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`📋 Encontrados ${workers.length} trabajadores`)
    
    // 2. Identificar trabajadores con RUT sin guión
    const workersToUpdate = workers.filter(worker => {
      return worker.rut && !worker.rut.includes('-') && worker.rut.length >= 8
    })
    
    console.log(`🔄 Necesitan corrección de formato: ${workersToUpdate.length} trabajadores`)
    
    if (workersToUpdate.length === 0) {
      console.log('✅ Todos los RUTs ya tienen el formato correcto con guión')
      return
    }
    
    // 3. Mostrar trabajadores que se actualizarán
    console.log('\n📝 Trabajadores que se actualizarán:')
    workersToUpdate.forEach((worker, index) => {
      const formattedRut = formatRutWithDash(worker.rut)
      console.log(`   ${index + 1}. ${worker.nombre}: "${worker.rut}" → "${formattedRut}"`)
    })
    
    // 4. Actualizar cada trabajador individualmente
    console.log('\n🔄 Iniciando actualizaciones...')
    let updated = 0
    let errors = 0
    
    for (const worker of workersToUpdate) {
      try {
        const formattedRut = formatRutWithDash(worker.rut)
        
        const { error } = await supabase
          .from('trabajadores')
          .update({ rut: formattedRut })
          .eq('id', worker.id)
        
        if (error) {
          throw error
        }
        
        updated++
        console.log(`   ✅ ${updated}/${workersToUpdate.length}: ${worker.nombre}: "${worker.rut}" → "${formattedRut}"`)
      } catch (updateError) {
        errors++
        console.error(`   ❌ Error actualizando RUT de "${worker.nombre}":`, updateError.message)
      }
    }
    
    // 5. Resumen final
    console.log(`\n📊 Resumen de corrección:`)
    console.log(`   ✅ RUTs corregidos exitosamente: ${updated}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log(`   📋 Total procesados: ${workersToUpdate.length}`)
    
    if (updated > 0) {
      console.log('\n🎉 Corrección de formato completada exitosamente!')
      console.log('💡 Todos los RUTs ahora tienen el formato correcto con guión (XXXXXXXX-X)')
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando corrección:', error)
    process.exit(1)
  }
}

// Ejecutar la función
fixRutFormats()
  .then(() => {
    console.log('\n✨ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
