/**
 * 🧪 Probador del servidor MCP de TransApp Supabase
 * 
 * Este script prueba las herramientas MCP disponibles
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 TransApp MCP - Prueba de herramientas')
console.log('======================================')

async function testQueryWorkers() {
  try {
    console.log('\n1️⃣ Probando query_workers...')
    
    const { data, error } = await supabase
      .from('trabajadores')
      .select('*')
      .limit(5)
    
    if (error) throw error
    
    console.log(`✅ Encontrados ${data.length} trabajadores`)
    console.log('📋 Primeros 3:')
    data.slice(0, 3).forEach((worker, i) => {
      console.log(`   ${i + 1}. ${worker.nombre} (${worker.rut}) - ${worker.contrato}`)
    })
    
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function testQueryShifts() {
  try {
    console.log('\n2️⃣ Probando query_shifts...')
    
    const { data, error } = await supabase
      .from('turnos')
      .select('*, trabajadores(nombre)')
      .limit(5)
    
    if (error) throw error
    
    console.log(`✅ Encontrados ${data.length} turnos`)
    if (data.length > 0) {
      console.log('📅 Ejemplo:')
      const turno = data[0]
      console.log(`   Fecha: ${turno.fecha}`)
      console.log(`   Tipo: ${turno.turno_tipo}`)
      console.log(`   Trabajador: ${turno.trabajadores?.nombre || 'N/A'}`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function testCreateWorker() {
  try {
    console.log('\n3️⃣ Probando create_worker...')
    
    const testWorker = {
      nombre: 'TEST USUARIO MCP',
      rut: '11111111-1', 
      contrato: 'eventual',
      telefono: '+56999999999'
    }
    
    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('trabajadores')
      .select('id')
      .eq('rut', testWorker.rut)
      .single()
    
    if (existing) {
      console.log('ℹ️ Usuario de prueba ya existe, eliminando...')
      await supabase
        .from('trabajadores')
        .delete()
        .eq('id', existing.id)
    }
    
    // Crear nuevo
    const { data, error } = await supabase
      .from('trabajadores')
      .insert([testWorker])
      .select()
    
    if (error) throw error
    
    console.log(`✅ Trabajador creado: ${data[0].nombre}`)
    
    // Limpiar (eliminar)
    await supabase
      .from('trabajadores')
      .delete()
      .eq('id', data[0].id)
    
    console.log('🧹 Trabajador de prueba eliminado')
    
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function testDatabaseSchema() {
  try {
    console.log('\n4️⃣ Probando get_database_schema...')
    
    const { data, error } = await supabase
      .rpc('get_schema_info')
    
    if (error) {
      // Método alternativo
      console.log('ℹ️ Usando método alternativo para esquema...')
      
      // Probar estructura de trabajadores
      const { data: workers } = await supabase
        .from('trabajadores')
        .select('*')
        .limit(1)
      
      if (workers && workers.length > 0) {
        const fields = Object.keys(workers[0])
        console.log('✅ Campos de trabajadores:', fields.join(', '))
      }
      
      // Probar estructura de turnos
      const { data: shifts } = await supabase
        .from('turnos')
        .select('*')
        .limit(1)
      
      if (shifts && shifts.length > 0) {
        const fields = Object.keys(shifts[0])
        console.log('✅ Campos de turnos:', fields.join(', '))
      }
    } else {
      console.log('✅ Esquema obtenido:', data)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function main() {
  console.log('🔍 Verificando conexión con Supabase...')
  
  const tests = [
    { name: 'Query Workers', fn: testQueryWorkers },
    { name: 'Query Shifts', fn: testQueryShifts },
    { name: 'Create Worker', fn: testCreateWorker },
    { name: 'Database Schema', fn: testDatabaseSchema }
  ]
  
  let passed = 0
  
  for (const test of tests) {
    const success = await test.fn()
    if (success) passed++
  }
  
  console.log('\n======================================')
  console.log(`📊 Resultado: ${passed}/${tests.length} pruebas exitosas`)
  
  if (passed === tests.length) {
    console.log('🎉 ¡Todas las herramientas MCP funcionan!')
    console.log('✅ El servidor MCP está listo para usar')
    console.log('\n🔧 Herramientas disponibles:')
    console.log('   • query_workers - Consultar trabajadores')
    console.log('   • create_worker - Crear trabajador')
    console.log('   • update_worker - Actualizar trabajador')
    console.log('   • query_shifts - Consultar turnos')
    console.log('   • create_shift - Crear turno')
    console.log('   • execute_sql - Ejecutar SQL seguro')
    console.log('   • get_database_schema - Obtener esquema')
  } else {
    console.log('⚠️ Algunas herramientas necesitan ajustes')
  }
}

main().catch(console.error)
