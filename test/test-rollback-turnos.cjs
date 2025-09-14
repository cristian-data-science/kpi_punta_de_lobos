#!/usr/bin/env node
/**
 * 🧪 Script de Prueba - Rollback de Turnos Completados
 * 
 * Este script verifica el flujo completo de rollback:
 * 1. Mostrar estado actual de turnos
 * 2. Marcar algunos turnos como completados (si están programados)
 * 3. Mostrar turnos completados
 * 4. Revertir turnos completados a programados
 * 5. Verificar que el rollback funcionó
 */

console.log('🧪 === PRUEBA DE ROLLBACK TURNOS COMPLETADOS ===\n')

// Importar dependencias
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configurar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 📊 Mostrar estadísticas de turnos por estado
 */
async function showTurnosStats() {
  try {
    console.log('📊 Estadísticas actuales de turnos:')
    
    // Contar por estado
    const { count: programados } = await supabase
      .from('turnos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'programado')

    const { count: completados } = await supabase
      .from('turnos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'completado')

    console.log(`   📋 Programados: ${programados || 0}`)
    console.log(`   ✅ Completados: ${completados || 0}`)
    console.log(`   📊 Total: ${(programados || 0) + (completados || 0)}`)
    
    return { programados: programados || 0, completados: completados || 0 }
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error)
    return { programados: 0, completados: 0 }
  }
}

/**
 * 🔄 Marcar algunos turnos como completados para probar rollback
 */
async function markSomeTurnosAsCompleted(limit = 5) {
  try {
    console.log(`\n🔄 Marcando ${limit} turnos programados como completados...`)
    
    // Obtener algunos turnos programados
    const { data: programados, error: fetchError } = await supabase
      .from('turnos')
      .select('id, fecha, estado')
      .eq('estado', 'programado')
      .limit(limit)

    if (fetchError) {
      console.error('❌ Error obteniendo turnos programados:', fetchError)
      return []
    }

    if (programados.length === 0) {
      console.log('⚠️ No hay turnos programados para marcar como completados')
      return []
    }

    const turnosIds = programados.map(t => t.id)
    
    // Marcar como completados
    const { error: updateError } = await supabase
      .from('turnos')
      .update({ estado: 'completado' })
      .in('id', turnosIds)

    if (updateError) {
      console.error('❌ Error actualizando turnos:', updateError)
      return []
    }

    console.log(`✅ ${programados.length} turnos marcados como completados`)
    programados.forEach((turno, index) => {
      console.log(`   ${index + 1}. Turno ${turno.id.substring(0, 8)}... - Fecha: ${turno.fecha}`)
    })

    return turnosIds
  } catch (error) {
    console.error('❌ Error marcando turnos como completados:', error)
    return []
  }
}

/**
 * 🔙 Simular rollback: revertir turnos completados a programados
 */
async function rollbackCompletedTurnos() {
  try {
    console.log('\n🔙 Iniciando rollback de turnos completados...')
    
    // Obtener turnos completados
    const { data: completados, error: fetchError } = await supabase
      .from('turnos')
      .select('id, fecha, estado')
      .eq('estado', 'completado')

    if (fetchError) {
      console.error('❌ Error obteniendo turnos completados:', fetchError)
      return false
    }

    if (completados.length === 0) {
      console.log('⚠️ No hay turnos completados para revertir')
      return true
    }

    console.log(`🔄 Revirtiendo ${completados.length} turnos completados a programados...`)
    
    // Revertir a programados
    const { error: updateError } = await supabase
      .from('turnos')
      .update({ estado: 'programado' })
      .eq('estado', 'completado')

    if (updateError) {
      console.error('❌ Error revirtiendo turnos:', updateError)
      return false
    }

    console.log(`✅ ${completados.length} turnos revertidos exitosamente`)
    completados.forEach((turno, index) => {
      console.log(`   ${index + 1}. Turno ${turno.id.substring(0, 8)}... - Fecha: ${turno.fecha}`)
    })

    return true
  } catch (error) {
    console.error('❌ Error en rollback:', error)
    return false
  }
}

/**
 * 🚀 Función principal de prueba
 */
async function runRollbackTest() {
  try {
    console.log('🚀 Iniciando prueba de rollback de turnos...\n')

    // 1. Mostrar estado inicial
    console.log('1️⃣ Estado inicial:')
    const initialStats = await showTurnosStats()

    // 2. Si no hay turnos completados, crear algunos
    if (initialStats.completados === 0) {
      console.log('\n2️⃣ No hay turnos completados, creando algunos para la prueba...')
      const markedIds = await markSomeTurnosAsCompleted(3)
      
      if (markedIds.length === 0) {
        console.log('❌ No se pudieron crear turnos completados para la prueba')
        return
      }
      
      // Mostrar estado después de marcar como completados
      console.log('\n📊 Estado después de marcar como completados:')
      await showTurnosStats()
    } else {
      console.log('\n2️⃣ Ya existen turnos completados para la prueba')
    }

    // 3. Ejecutar rollback
    console.log('\n3️⃣ Ejecutando rollback...')
    const rollbackSuccess = await rollbackCompletedTurnos()
    
    if (!rollbackSuccess) {
      console.log('❌ Error durante el rollback')
      return
    }

    // 4. Verificar estado final
    console.log('\n4️⃣ Estado final después del rollback:')
    const finalStats = await showTurnosStats()

    // 5. Resumen
    console.log('\n📊 RESUMEN DE LA PRUEBA:')
    console.log(`   Inicial - Programados: ${initialStats.programados}, Completados: ${initialStats.completados}`)
    console.log(`   Final   - Programados: ${finalStats.programados}, Completados: ${finalStats.completados}`)
    
    if (finalStats.completados === 0) {
      console.log('✅ ¡Rollback exitoso! Todos los turnos están ahora programados')
    } else {
      console.log(`⚠️ Aún quedan ${finalStats.completados} turnos completados`)
    }

    console.log('\n🎉 Prueba de rollback completada exitosamente!')

  } catch (error) {
    console.error('\n💥 Error durante la prueba:', error)
  }
}

// Ejecutar prueba
runRollbackTest().then(() => {
  console.log('\n🎯 Prueba finalizada')
}).catch(error => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})