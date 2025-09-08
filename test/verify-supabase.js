/**
 * 🧪 Verificador automático de conexión Supabase para TransApp
 * 
 * Este script verifica la conectividad con Supabase y las tablas creadas.
 * Ejecutar con: node verify-supabase.js
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 TransApp - Verificador de Supabase')
console.log('=====================================')

// Verificar variables de entorno
console.log('\n🔧 Variables de entorno:')
console.log(`URL: ${supabaseUrl ? '✅ Configurada' : '❌ Faltante'}`)
console.log(`Anon Key: ${supabaseKey ? '✅ Configurada' : '❌ Faltante'}`)
console.log(`Service Key: ${serviceKey ? '✅ Configurada' : '❌ Faltante'}`)

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Error: Variables de entorno faltantes')
  process.exit(1)
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarConexion() {
  try {
    console.log('\n🌐 Verificando conexión...')
    
    // Test básico de conectividad
    const { data, error } = await supabase
      .from('trabajadores')
      .select('count', { count: 'exact' })
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  Tabla "trabajadores" no existe aún')
        console.log('   📋 Ejecuta el script supabase_setup.sql primero')
        return false
      }
      throw error
    }

    console.log('✅ Conexión exitosa con Supabase!')
    return true

  } catch (error) {
    console.error('❌ Error de conexión:', error.message)
    return false
  }
}

async function verificarTablas() {
  try {
    console.log('\n📋 Verificando tablas...')

    // Verificar tabla trabajadores
    const { data: trabajadores, error: errorTrabajadores } = await supabase
      .from('trabajadores')
      .select('*')
      .limit(5)

    if (errorTrabajadores) throw errorTrabajadores

    console.log(`👥 Tabla trabajadores: ${trabajadores.length} registros`)
    if (trabajadores.length > 0) {
      console.log('   📊 Ejemplo:', trabajadores[0])
    }

    // Verificar tabla turnos  
    const { data: turnos, error: errorTurnos } = await supabase
      .from('turnos')
      .select('*')
      .limit(5)

    if (errorTurnos) throw errorTurnos

    console.log(`📅 Tabla turnos: ${turnos.length} registros`)
    if (turnos.length > 0) {
      console.log('   📊 Ejemplo:', turnos[0])
    }

    return true

  } catch (error) {
    console.error('❌ Error verificando tablas:', error.message)
    return false
  }
}

async function probarOperacionesCRUD() {
  try {
    console.log('\n🧪 Probando operaciones CRUD...')

    // Test INSERT
    const nuevoTrabajador = {
      nombre: 'Test Usuario',
      rut: '12.345.678-0',
      cargo: 'Test Conductor',
      telefono: '+56912345678'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('trabajadores')
      .insert([nuevoTrabajador])
      .select()

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation
        console.log('ℹ️  Usuario de prueba ya existe (OK)')
      } else {
        throw insertError
      }
    } else {
      console.log('✅ INSERT exitoso:', insertData[0]?.nombre)

      // Test UPDATE
      const { error: updateError } = await supabase
        .from('trabajadores')
        .update({ cargo: 'Test Conductor Actualizado' })
        .eq('id', insertData[0].id)

      if (updateError) throw updateError
      console.log('✅ UPDATE exitoso')

      // Test DELETE (limpieza)
      const { error: deleteError } = await supabase
        .from('trabajadores')
        .delete()
        .eq('id', insertData[0].id)

      if (deleteError) throw deleteError
      console.log('✅ DELETE exitoso (limpieza)')
    }

    return true

  } catch (error) {
    console.error('❌ Error en operaciones CRUD:', error.message)
    return false
  }
}

// Ejecutar verificación completa
async function main() {
  const conexionOk = await verificarConexion()
  
  if (conexionOk) {
    const tablasOk = await verificarTablas()
    
    if (tablasOk) {
      const crudOk = await probarOperacionesCRUD()
      
      if (crudOk) {
        console.log('\n🎉 ¡Configuración de Supabase completada exitosamente!')
        console.log('✅ Conexión establecida')
        console.log('✅ Tablas creadas y funcionando')
        console.log('✅ Operaciones CRUD funcionando')
        console.log('\n🚀 TransApp está listo para usar Supabase!')
      }
    }
  }

  console.log('\n=====================================')
}

main().catch(console.error)
