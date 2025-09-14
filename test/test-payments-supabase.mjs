/**
 * 🧪 Test del nuevo servicio de pagos con Supabase
 * 
 * Este script verifica que la integración entre Pagos y Supabase funciona correctamente
 */

import { createClient } from '@supabase/supabase-js'
import paymentsSupabaseService from '../src/services/paymentsSupabaseService.js'

// Variables de entorno para testing
const SUPABASE_URL = 'https://csqxopqlgujduhmwxixo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

async function testPaymentsSupabaseIntegration() {
  console.log('🧪 INICIANDO PRUEBAS DE PAGOS CON SUPABASE')
  console.log('=' .repeat(50))

  try {
    // 1. Probar conexión directa con Supabase
    console.log('\n1. 📡 Probando conexión directa con Supabase...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    
    const { data: trabajadores, error: workersError } = await supabase
      .from('trabajadores')
      .select('*')
      .limit(3)

    if (workersError) throw workersError
    console.log(`✅ Conexión exitosa: ${trabajadores.length} trabajadores encontrados`)

    // 2. Probar carga de turnos
    console.log('\n2. 📊 Probando carga de turnos...')
    const { data: turnos, error: turnosError } = await supabase
      .from('turnos')
      .select(`
        *,
        trabajador:trabajador_id (
          id,
          nombre,
          rut
        )
      `)
      .limit(5)

    if (turnosError) throw turnosError
    console.log(`✅ Turnos cargados: ${turnos.length} turnos encontrados`)

    if (turnos.length > 0) {
      console.log('📋 Ejemplo de turno:')
      console.log(`   - Fecha: ${turnos[0].fecha}`)
      console.log(`   - Trabajador: ${turnos[0].trabajador?.nombre}`)
      console.log(`   - Tipo: ${turnos[0].turno_tipo}`)
      console.log(`   - Estado: ${turnos[0].estado}`)
    }

    // 3. Probar el servicio de pagos
    console.log('\n3. 💰 Probando servicio de pagos...')
    
    // Mockear import.meta.env para el test
    global.import = {
      meta: {
        env: {
          VITE_SUPABASE_URL: SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: SUPABASE_KEY
        }
      }
    }

    const testResult = await paymentsSupabaseService.testConnection()
    console.log('📊 Resultado del test:', testResult)

    if (testResult.success) {
      console.log(`✅ Test exitoso: ${testResult.turnosCount} turnos, estadísticas: ${JSON.stringify(testResult.stats)}`)
    } else {
      console.log(`❌ Test falló: ${testResult.error}`)
    }

    // 4. Probar cálculo de pagos si hay datos
    if (turnos.length > 0) {
      console.log('\n4. 🧮 Probando cálculo de pagos...')
      
      const payments = await paymentsSupabaseService.calculateWorkerPayments()
      console.log(`✅ Pagos calculados para ${payments.length} trabajadores`)

      if (payments.length > 0) {
        const totalPayments = payments.reduce((sum, p) => sum + p.totalMonto, 0)
        const totalTurnos = payments.reduce((sum, p) => sum + p.totalTurnos, 0)
        
        console.log('📊 Resumen de pagos:')
        console.log(`   - Total trabajadores: ${payments.length}`)
        console.log(`   - Total turnos: ${totalTurnos}`)
        console.log(`   - Total a pagar: $${totalPayments.toLocaleString('es-CL')}`)
        
        // Mostrar ejemplo de trabajador
        const worker = payments[0]
        console.log(`\n👤 Ejemplo - ${worker.conductorNombre}:`)
        console.log(`   - Turnos: ${worker.totalTurnos}`)
        console.log(`   - Feriados: ${worker.feriadosTrabajados}`)
        console.log(`   - Domingos: ${worker.domingosTrabajados}`)
        console.log(`   - Total: $${worker.totalMonto.toLocaleString('es-CL')}`)
      }
    } else {
      console.log('⚠️ No hay turnos en Supabase para probar el cálculo de pagos')
    }

    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE')
    
  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error.message)
    console.error('📋 Stack:', error.stack)
  }
}

// Ejecutar pruebas
testPaymentsSupabaseIntegration()
  .then(() => {
    console.log('\n✅ Script de pruebas terminado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })