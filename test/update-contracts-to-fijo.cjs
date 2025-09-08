/**
 * 🔄 Actualización masiva de contratos a "fijo"
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function cambiarContratosAFijo() {
  console.log('🔄 Cambiando todos los contratos a "fijo"...\n')

  try {
    // 1. Verificar estado actual
    console.log('1️⃣ Estado actual de contratos:')
    const { data: trabajadoresActuales, error: errorConsulta } = await supabase
      .from('trabajadores')
      .select('id, nombre, rut, contrato')
      .order('nombre')

    if (errorConsulta) {
      throw errorConsulta
    }

    // Contar por tipo de contrato
    const eventuales = trabajadoresActuales.filter(t => t.contrato === 'eventual').length
    const planta = trabajadoresActuales.filter(t => t.contrato === 'planta').length
    const fijo = trabajadoresActuales.filter(t => t.contrato === 'fijo').length

    console.log(`   • Eventual: ${eventuales} trabajadores`)
    console.log(`   • Planta: ${planta} trabajadores`)
    console.log(`   • Fijo: ${fijo} trabajadores`)
    console.log(`   • Total: ${trabajadoresActuales.length} trabajadores`)
    console.log('')

    // 2. Mostrar los que van a cambiar
    const paraActualizar = trabajadoresActuales.filter(t => t.contrato !== 'fijo')
    
    if (paraActualizar.length === 0) {
      console.log('ℹ️ Todos los trabajadores ya tienen contrato "fijo"')
      return
    }

    console.log(`2️⃣ Trabajadores que cambiarán a "fijo" (${paraActualizar.length}):`)
    paraActualizar.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.nombre} (${t.rut}) - Actual: ${t.contrato}`)
    })
    console.log('')

    // 3. Realizar la actualización masiva
    console.log('3️⃣ Ejecutando actualización masiva...')
    
    const { data: actualizados, error: errorActualizacion } = await supabase
      .from('trabajadores')
      .update({ contrato: 'fijo' })
      .neq('contrato', 'fijo')  // Solo actualizar los que no son "fijo"
      .select('id, nombre, rut, contrato')

    if (errorActualizacion) {
      throw errorActualizacion
    }

    console.log(`✅ Actualización exitosa: ${actualizados.length} trabajadores modificados`)
    console.log('')

    // 4. Verificar resultado final
    console.log('4️⃣ Estado final verificado:')
    const { data: trabajadoresFinales, error: errorVerificacion } = await supabase
      .from('trabajadores')
      .select('contrato')

    if (errorVerificacion) {
      throw errorVerificacion
    }

    const fijoFinal = trabajadoresFinales.filter(t => t.contrato === 'fijo').length
    const otrosFinal = trabajadoresFinales.filter(t => t.contrato !== 'fijo').length

    console.log(`   • Fijo: ${fijoFinal} trabajadores`)
    console.log(`   • Otros: ${otrosFinal} trabajadores`)
    console.log('')

    if (otrosFinal === 0) {
      console.log('🎉 ¡ÉXITO! Todos los trabajadores ahora tienen contrato "fijo"')
    } else {
      console.log(`⚠️ Quedan ${otrosFinal} trabajadores con otro tipo de contrato`)
    }

    // 5. Mostrar algunos trabajadores actualizados como muestra
    console.log('')
    console.log('📋 Muestra de trabajadores actualizados:')
    actualizados.slice(0, 5).forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.nombre} (${t.rut}) - Nuevo: ${t.contrato}`)
    })

  } catch (error) {
    console.error('❌ Error durante la actualización:', error.message)
  }
}

cambiarContratosAFijo()
