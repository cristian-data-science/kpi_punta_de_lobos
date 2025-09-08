/**
 * 🚀 Script para crear tablas con trabajadores reales en Supabase
 * 
 * Este script crea la estructura actualizada y añade los 14 trabajadores
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 TransApp - Creación de tablas con trabajadores reales')
console.log('======================================================')

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function createWorkersTable() {
  try {
    console.log('\n📋 Creando tabla trabajadores...')
    
    // Crear tabla trabajadores
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS trabajadores (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          nombre TEXT NOT NULL,
          rut TEXT NOT NULL UNIQUE,
          contrato TEXT DEFAULT 'eventual' CHECK (contrato IN ('fijo', 'eventual')),
          telefono TEXT DEFAULT '',
          estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (tableError) {
      console.log('⚠️ No se puede usar RPC. Ejecuta manualmente en Supabase Dashboard:')
      console.log('📍 URL: https://supabase.com/dashboard/project/csqxopqlgujduhmwxixo/sql/new')
      return false
    }

    console.log('✅ Tabla trabajadores creada')
    return true

  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function insertWorkers() {
  try {
    console.log('\n👥 Insertando 14 trabajadores...')

    const workers = [
      { nombre: 'JORGE ANDRÉS FLORES OSORIO', rut: '12650299-0' },
      { nombre: 'JOSÉ DANIEL AMPUERO AMPUERO', rut: '11945733-5' },
      { nombre: 'NELSON DEL CARMEN LAGOS REY', rut: '11764166-K' },
      { nombre: 'HUMBERTO ANTONIO SILVA CARREÑO', rut: '10230428-4' },
      { nombre: 'JORGE PABLO FUENTES ABARZUA', rut: '15872050-7' },
      { nombre: 'HUGO IVÁN DURÁN JIMÉNEZ', rut: '14246406-3' },
      { nombre: 'CARLOS JONATHAN RAMIREZ ESPINOZA', rut: '16757796-2' },
      { nombre: 'JUAN ANTONIO GONZALEZ JIMENEZ', rut: '12825622-9' },
      { nombre: 'WLADIMIR ROLANDO ISLER VALDÉS', rut: '11314229-4' },
      { nombre: 'FELIPE ANDRÉS VALLEJOS SANTIS', rut: '16107285-0' },
      { nombre: 'ERICK ISMAEL MIRANDA ABARCA', rut: '15087914-7' },
      { nombre: 'JONATHAN FRANCISCO CABELLO MORA', rut: '15872981-4' },
      { nombre: 'MANUEL EDGARDO HERRERA SORIANO', rut: '19757064-4' },
      { nombre: 'OSCAR ENRIQUE ORELLANA VASQUEZ', rut: '9591122-6' }
    ]

    for (let i = 0; i < workers.length; i++) {
      const worker = workers[i]
      
      console.log(`   ${i + 1}/14 Insertando: ${worker.nombre}`)
      
      const { error } = await supabase
        .from('trabajadores')
        .insert([{
          nombre: worker.nombre,
          rut: worker.rut,
          contrato: 'eventual',
          telefono: '',
          estado: 'activo'
        }])

      if (error && error.code !== '23505') { // 23505 = duplicate key (OK)
        console.error(`   ❌ Error insertando ${worker.nombre}:`, error.message)
      } else if (error && error.code === '23505') {
        console.log(`   ℹ️ ${worker.nombre} ya existe (OK)`)
      } else {
        console.log(`   ✅ ${worker.nombre} insertado`)
      }
    }

    return true

  } catch (error) {
    console.error('❌ Error insertando trabajadores:', error.message)
    return false
  }
}

async function createTurnosTable() {
  try {
    console.log('\n📅 Creando tabla turnos...')
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS turnos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          trabajador_id UUID REFERENCES trabajadores(id) ON DELETE CASCADE,
          fecha DATE NOT NULL,
          turno_tipo TEXT NOT NULL CHECK (turno_tipo IN ('primer_turno', 'segundo_turno', 'tercer_turno')),
          estado TEXT DEFAULT 'programado' CHECK (estado IN ('programado', 'completado', 'cancelado')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (error) {
      console.log('⚠️ Usar SQL manual para crear tabla turnos')
      return false
    }

    console.log('✅ Tabla turnos creada')
    return true

  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function verifyData() {
  try {
    console.log('\n🔍 Verificando datos insertados...')

    const { data: workers, error } = await supabase
      .from('trabajadores')
      .select('*')
      .order('nombre')

    if (error) throw error

    console.log(`✅ Total trabajadores: ${workers.length}`)
    
    if (workers.length > 0) {
      console.log('\n👥 Lista de trabajadores:')
      workers.forEach((worker, index) => {
        console.log(`   ${index + 1}. ${worker.nombre} (${worker.rut}) - ${worker.contrato}`)
      })
    }

    return true

  } catch (error) {
    console.error('❌ Error verificando:', error.message)
    return false
  }
}

async function main() {
  console.log('\n🔄 Iniciando proceso de configuración...')

  // Intentar crear tabla trabajadores
  const tableCreated = await createWorkersTable()
  
  // Insertar trabajadores (funciona incluso si la tabla ya existe)
  const workersInserted = await insertWorkers()
  
  // Crear tabla turnos
  const turnosCreated = await createTurnosTable()
  
  // Verificar resultados
  if (workersInserted) {
    await verifyData()
  }

  console.log('\n======================================================')
  
  if (!tableCreated || !turnosCreated) {
    console.log('⚠️ ACCIÓN REQUERIDA:')
    console.log('📍 Ve al SQL Editor: https://supabase.com/dashboard/project/csqxopqlgujduhmwxixo/sql/new')
    console.log('📄 Ejecuta el contenido completo de: supabase_setup.sql')
  } else {
    console.log('🎉 ¡Configuración completada!')
    console.log('✅ Tablas creadas')
    console.log('✅ 14 trabajadores insertados')
    console.log('🚀 TransApp listo para usar!')
  }
}

main().catch(console.error)
