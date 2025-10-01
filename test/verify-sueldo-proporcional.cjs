/**
 * Script de Verificación: Sistema de Sueldo Proporcional Automático
 * 
 * Este script verifica que:
 * 1. El campo sueldo_proporcional existe
 * 2. El trigger está activo
 * 3. Los cálculos automáticos funcionan correctamente
 * 4. Los contratos eventuales resetean a 0
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://csqxopqlgujduhmwxixo.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('❌ Error: No se encontró SUPABASE_KEY')
  console.log('Por favor configura VITE_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
}

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`)
}

function separator() {
  console.log(colors.gray + '─'.repeat(70) + colors.reset)
}

async function verifyColumn() {
  separator()
  log('🔍', 'Verificando existencia del campo sueldo_proporcional...', colors.blue)
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'trabajadores'
      AND column_name = 'sueldo_proporcional'
    `
  }).single()

  if (error) {
    // Intentar con query directa
    const { data: columns, error: error2 } = await supabase
      .from('trabajadores')
      .select('sueldo_proporcional')
      .limit(1)
    
    if (error2) {
      log('❌', `Campo sueldo_proporcional NO existe: ${error2.message}`, colors.red)
      return false
    }
    
    log('✅', 'Campo sueldo_proporcional existe (verificado con query)', colors.green)
    return true
  }

  if (data && data.column_name === 'sueldo_proporcional') {
    log('✅', 'Campo sueldo_proporcional existe correctamente', colors.green)
    log('  ', `Tipo: ${data.data_type}, Default: ${data.column_default || 'N/A'}`, colors.gray)
    return true
  }

  log('❌', 'Campo sueldo_proporcional NO encontrado', colors.red)
  return false
}

async function verifyTrigger() {
  separator()
  log('🔍', 'Verificando existencia del trigger...', colors.blue)
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT trigger_name, event_manipulation
      FROM information_schema.triggers
      WHERE event_object_table = 'trabajadores'
      AND trigger_name = 'trigger_calcular_sueldo_proporcional'
    `
  })

  if (error) {
    log('⚠️', `No se pudo verificar trigger (requiere permisos admin): ${error.message}`, colors.yellow)
    return false
  }

  if (data && data.length > 0) {
    log('✅', 'Trigger trigger_calcular_sueldo_proporcional existe', colors.green)
    log('  ', `Eventos: ${data.map(t => t.event_manipulation).join(', ')}`, colors.gray)
    return true
  }

  log('❌', 'Trigger NO encontrado', colors.red)
  return false
}

async function verifyCalculations() {
  separator()
  log('🔍', 'Verificando cálculos automáticos...', colors.blue)
  
  // Obtener algunos trabajadores
  const { data: workers, error } = await supabase
    .from('trabajadores')
    .select('nombre, rut, contrato, sueldo_base, dias_trabajados, sueldo_proporcional')
    .limit(10)

  if (error) {
    log('❌', `Error obteniendo trabajadores: ${error.message}`, colors.red)
    return false
  }

  if (!workers || workers.length === 0) {
    log('⚠️', 'No hay trabajadores en la base de datos', colors.yellow)
    return false
  }

  log('📊', `Verificando ${workers.length} trabajadores...`, colors.blue)
  
  let correct = 0
  let incorrect = 0
  let eventual = 0

  workers.forEach(worker => {
    const expected = worker.contrato === 'eventual' 
      ? 0 
      : Math.round((worker.sueldo_base * worker.dias_trabajados) / 30)
    
    const actual = worker.sueldo_proporcional
    const isCorrect = expected === actual

    if (worker.contrato === 'eventual') {
      eventual++
      const allZero = worker.sueldo_base === 0 && worker.dias_trabajados === 0 && worker.sueldo_proporcional === 0
      if (allZero) {
        log('✅', `${worker.nombre.substring(0, 20).padEnd(20)} - Eventual (todo en 0) ✓`, colors.green)
      } else {
        log('❌', `${worker.nombre.substring(0, 20).padEnd(20)} - Eventual pero valores ≠ 0`, colors.red)
        incorrect++
      }
    } else {
      if (isCorrect) {
        log('✅', `${worker.nombre.substring(0, 20).padEnd(20)} - Proporcional: $${actual.toLocaleString()} ✓`, colors.green)
        correct++
      } else {
        log('❌', `${worker.nombre.substring(0, 20).padEnd(20)} - Esperado: $${expected.toLocaleString()}, Actual: $${actual.toLocaleString()}`, colors.red)
        incorrect++
      }
    }
  })

  separator()
  log('📈', 'Resumen de Verificación:', colors.blue)
  log('  ', `✅ Cálculos correctos: ${correct}`, colors.green)
  log('  ', `👷 Eventuales: ${eventual}`, colors.yellow)
  if (incorrect > 0) {
    log('  ', `❌ Cálculos incorrectos: ${incorrect}`, colors.red)
  }

  return incorrect === 0
}

async function testAutomaticCalculation() {
  separator()
  log('🧪', 'Probando cálculo automático con nuevo trabajador...', colors.blue)
  
  const testWorker = {
    nombre: 'TEST AUTOMATICO - ELIMINAR',
    rut: `${Math.floor(10000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 10)}`,
    contrato: 'planta',
    estado: 'activo',
    sueldo_base: 600000,
    dias_trabajados: 15
  }

  log('  ', `Creando trabajador: ${testWorker.nombre}`, colors.gray)
  log('  ', `Sueldo Base: $${testWorker.sueldo_base.toLocaleString()}, Días: ${testWorker.dias_trabajados}`, colors.gray)
  log('  ', `Proporcional esperado: $${Math.round((testWorker.sueldo_base * testWorker.dias_trabajados) / 30).toLocaleString()}`, colors.gray)

  const { data: created, error: createError } = await supabase
    .from('trabajadores')
    .insert([testWorker])
    .select()
    .single()

  if (createError) {
    log('❌', `Error creando trabajador: ${createError.message}`, colors.red)
    return false
  }

  const expectedProporcional = Math.round((testWorker.sueldo_base * testWorker.dias_trabajados) / 30)
  const actualProporcional = created.sueldo_proporcional

  if (expectedProporcional === actualProporcional) {
    log('✅', `Cálculo automático correcto: $${actualProporcional.toLocaleString()}`, colors.green)
  } else {
    log('❌', `Cálculo incorrecto - Esperado: $${expectedProporcional.toLocaleString()}, Actual: $${actualProporcional.toLocaleString()}`, colors.red)
  }

  // Limpiar: eliminar trabajador de prueba
  log('  ', 'Eliminando trabajador de prueba...', colors.gray)
  await supabase
    .from('trabajadores')
    .delete()
    .eq('id', created.id)

  log('✅', 'Trabajador de prueba eliminado', colors.green)
  
  return expectedProporcional === actualProporcional
}

async function testEventualReset() {
  separator()
  log('🧪', 'Probando reseteo automático para contratos eventuales...', colors.blue)
  
  const testWorker = {
    nombre: 'TEST EVENTUAL - ELIMINAR',
    rut: `${Math.floor(10000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 10)}`,
    contrato: 'eventual',
    estado: 'activo',
    sueldo_base: 500000, // Debería volverse 0 automáticamente
    dias_trabajados: 20   // Debería volverse 0 automáticamente
  }

  log('  ', `Creando trabajador eventual: ${testWorker.nombre}`, colors.gray)
  log('  ', `Intentando asignar: Sueldo Base: $${testWorker.sueldo_base.toLocaleString()}, Días: ${testWorker.dias_trabajados}`, colors.gray)

  const { data: created, error: createError } = await supabase
    .from('trabajadores')
    .insert([testWorker])
    .select()
    .single()

  if (createError) {
    log('❌', `Error creando trabajador: ${createError.message}`, colors.red)
    return false
  }

  const allZero = created.sueldo_base === 0 && 
                  created.dias_trabajados === 0 && 
                  created.sueldo_proporcional === 0

  if (allZero) {
    log('✅', 'Reseteo automático correcto: todos los valores en 0', colors.green)
    log('  ', `Sueldo Base: $${created.sueldo_base}, Días: ${created.dias_trabajados}, Proporcional: $${created.sueldo_proporcional}`, colors.gray)
  } else {
    log('❌', 'Reseteo NO funcionó correctamente', colors.red)
    log('  ', `Sueldo Base: $${created.sueldo_base}, Días: ${created.dias_trabajados}, Proporcional: $${created.sueldo_proporcional}`, colors.red)
  }

  // Limpiar
  log('  ', 'Eliminando trabajador de prueba...', colors.gray)
  await supabase
    .from('trabajadores')
    .delete()
    .eq('id', created.id)

  log('✅', 'Trabajador de prueba eliminado', colors.green)
  
  return allZero
}

async function main() {
  console.log('\n')
  log('🚀', 'VERIFICACIÓN: Sistema de Sueldo Proporcional Automático', colors.blue)
  separator()

  try {
    // Verificaciones de estructura
    const columnExists = await verifyColumn()
    const triggerExists = await verifyTrigger()
    
    // Verificación de datos existentes
    const calculationsCorrect = await verifyCalculations()
    
    // Tests funcionales
    const autoCalcWorks = await testAutomaticCalculation()
    const eventualResetWorks = await testEventualReset()

    // Resumen final
    separator()
    log('📋', 'RESUMEN FINAL', colors.blue)
    separator()
    
    const results = [
      { name: 'Campo sueldo_proporcional existe', passed: columnExists },
      { name: 'Trigger está configurado', passed: triggerExists },
      { name: 'Cálculos existentes correctos', passed: calculationsCorrect },
      { name: 'Cálculo automático funciona', passed: autoCalcWorks },
      { name: 'Reseteo eventual funciona', passed: eventualResetWorks }
    ]

    results.forEach(result => {
      if (result.passed) {
        log('✅', result.name, colors.green)
      } else {
        log('❌', result.name, colors.red)
      }
    })

    const allPassed = results.every(r => r.passed)
    
    separator()
    if (allPassed) {
      log('🎉', '¡TODAS LAS VERIFICACIONES PASARON!', colors.green)
      log('  ', 'El sistema de sueldo proporcional está funcionando correctamente', colors.green)
    } else {
      log('⚠️', 'ALGUNAS VERIFICACIONES FALLARON', colors.yellow)
      log('  ', 'Revisa los errores arriba y ejecuta el script SQL: sql/add_sueldo_proporcional.sql', colors.yellow)
    }
    separator()

  } catch (error) {
    separator()
    log('❌', `Error durante la verificación: ${error.message}`, colors.red)
    console.error(error)
  }
}

main()
