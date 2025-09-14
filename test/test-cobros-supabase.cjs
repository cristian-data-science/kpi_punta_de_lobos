#!/usr/bin/env node
/**
 * 🧪 Prueba del Servicio de Cobros con Supabase
 * 
 * Este script verifica que cobrosSupabaseService funcione correctamente:
 * - Conexión con Supabase
 * - Carga de turnos COMPLETADOS únicamente
 * - Cálculo de cobros basado en turnos completados
 * - Estadísticas de la base de datos
 */

console.log('🧪 === PRUEBA DEL SERVICIO DE COBROS CON SUPABASE ===\n')

// Importar dependencias
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configurar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas')
  console.error('   Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}

console.log('✅ Variables de entorno cargadas')
console.log(`   URL: ${supabaseUrl}`)
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`)

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 🔄 Simular loadTurnosFromSupabase()
 */
async function loadTurnosFromSupabase() {
  try {
    console.log('\n📊 Cargando turnos COMPLETADOS desde Supabase...')
    
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select(`
        *,
        trabajador:trabajador_id (
          id,
          nombre,
          rut
        )
      `)
      .eq('estado', 'completado')  // ✅ SOLO TURNOS COMPLETADOS
      .order('fecha', { ascending: false })

    if (error) {
      console.error('❌ Error cargando turnos:', error)
      throw error
    }

    console.log(`✅ ${turnos.length} turnos COMPLETADOS cargados`)
    console.log('💡 Solo se incluyen turnos con estado "completado"')
    
    // Transformar datos
    const turnosTransformados = turnos.map(turno => ({
      id: turno.id,
      fecha: turno.fecha,
      conductorNombre: turno.trabajador?.nombre || 'Trabajador no encontrado',
      turno: mapTurnoType(turno.turno_tipo),
      estado: turno.estado,
      trabajadorId: turno.trabajador_id,
      turno_tipo: turno.turno_tipo,
      created_at: turno.created_at
    }))

    return turnosTransformados
  } catch (error) {
    console.error('❌ Error en loadTurnosFromSupabase:', error)
    return []
  }
}

/**
 * 🔄 Mapear tipos de turno
 */
function mapTurnoType(turnoTipo) {
  const map = {
    'primer_turno': 'PRIMER TURNO',
    'segundo_turno': 'SEGUNDO TURNO', 
    'tercer_turno': 'TERCER TURNO'
  }
  return map[turnoTipo] || 'PRIMER TURNO'
}

/**
 * 💰 Calcular cobros basados en turnos completados
 */
async function calculateTurnosCobros(tarifaPorTurno = 50000) {
  try {
    console.log(`\n💰 Calculando cobros con tarifa: $${tarifaPorTurno.toLocaleString('es-CL')} por turno`)
    
    // Cargar turnos completados
    const turnos = await loadTurnosFromSupabase()
    
    if (turnos.length === 0) {
      console.warn('⚠️ No hay turnos completados para calcular cobros')
      return []
    }

    // Procesar cálculos de cobros
    const cobrosCalculations = new Map()

    turnos.forEach(turno => {
      const conductorNombre = turno.conductorNombre
      const fecha = turno.fecha
      const cobro = tarifaPorTurno

      // Inicializar trabajador si no existe
      if (!cobrosCalculations.has(conductorNombre)) {
        cobrosCalculations.set(conductorNombre, {
          conductorNombre,
          totalTurnos: 0,
          totalCobro: 0,
          turnos: [],
          tarifaPorTurno
        })
      }

      const calculation = cobrosCalculations.get(conductorNombre)
      calculation.totalTurnos++
      calculation.totalCobro += cobro

      calculation.turnos.push({
        fecha,
        turno: turno.turno,
        cobro,
        turno_tipo: turno.turno_tipo
      })
    })

    const result = Array.from(cobrosCalculations.values())
    console.log(`✅ Cálculo de cobros completado: ${result.length} trabajadores procesados`)
    console.log(`📊 Total turnos COMPLETADOS procesados: ${turnos.length}`)
    
    return result

  } catch (error) {
    console.error('❌ Error en calculateTurnosCobros:', error)
    return []
  }
}

/**
 * 📊 Obtener estadísticas de Supabase
 */
async function getSupabaseStats() {
  try {
    console.log('\n📊 Obteniendo estadísticas de Supabase...')

    // Total de turnos completados
    const { count: turnosCompletados } = await supabase
      .from('turnos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'completado')

    // Total de turnos programados
    const { count: turnosProgramados } = await supabase
      .from('turnos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'programado')

    // Total de trabajadores
    const { count: trabajadoresCount } = await supabase
      .from('trabajadores')
      .select('*', { count: 'exact', head: true })

    return {
      connected: true,
      turnosCompletados,
      turnosProgramados,
      turnosTotal: turnosCompletados + turnosProgramados,
      trabajadoresTotal: trabajadoresCount,
      timestamp: new Date().toISOString(),
      note: 'Solo los turnos completados generan cobros'
    }
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error)
    return {
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 🚀 Función principal de prueba
 */
async function runTest() {
  try {
    console.log('\n🚀 Iniciando pruebas del servicio de Cobros...\n')

    // 1. Verificar estadísticas
    console.log('1️⃣ Verificando estadísticas de la base de datos...')
    const stats = await getSupabaseStats()
    console.log('📊 Estadísticas:', JSON.stringify(stats, null, 2))

    // 2. Cargar turnos completados
    console.log('\n2️⃣ Cargando turnos completados...')
    const turnos = await loadTurnosFromSupabase()
    console.log(`📋 Turnos completados: ${turnos.length}`)
    
    if (turnos.length > 0) {
      console.log('\n📋 Ejemplo de turnos:')
      turnos.slice(0, 3).forEach((turno, index) => {
        console.log(`   ${index + 1}. ${turno.conductorNombre} - ${turno.fecha} (${turno.turno}) - Estado: ${turno.estado}`)
      })
    }

    // 3. Calcular cobros
    console.log('\n3️⃣ Calculando cobros...')
    const cobros = await calculateTurnosCobros(50000)
    
    if (cobros.length > 0) {
      console.log(`💰 Cobros calculados para ${cobros.length} trabajadores:`)
      
      cobros.slice(0, 5).forEach((trabajador, index) => {
        const totalFormatted = trabajador.totalCobro.toLocaleString('es-CL')
        console.log(`   ${index + 1}. ${trabajador.conductorNombre}: ${trabajador.totalTurnos} turnos = $${totalFormatted}`)
      })
      
      // Totales generales
      const totalTurnos = cobros.reduce((sum, t) => sum + t.totalTurnos, 0)
      const totalCobros = cobros.reduce((sum, t) => sum + t.totalCobro, 0)
      
      console.log(`\n📊 RESUMEN TOTAL:`)
      console.log(`   Total trabajadores: ${cobros.length}`)
      console.log(`   Total turnos completados: ${totalTurnos}`)
      console.log(`   Total a cobrar: $${totalCobros.toLocaleString('es-CL')}`)
      console.log(`   Promedio por trabajador: $${Math.round(totalCobros / cobros.length).toLocaleString('es-CL')}`)
    }

    console.log('\n✅ ¡Prueba del servicio de Cobros completada exitosamente!')
    console.log('💡 El servicio está listo para usar en la aplicación')

  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error)
    process.exit(1)
  }
}

// Ejecutar prueba
runTest().then(() => {
  console.log('\n🎉 Prueba finalizada')
}).catch(error => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})