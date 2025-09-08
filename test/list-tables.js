/**
 * 🔍 Script para consultar todas las tablas existentes en Supabase
 * 
 * Este script lista todas las tablas en el esquema público de Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service key para admin

console.log('🔍 TransApp - Explorador de tablas Supabase')
console.log('============================================')

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Variables de entorno faltantes')
  process.exit(1)
}

// Cliente con service role (permisos de administrador)
const supabase = createClient(supabaseUrl, serviceKey)

async function listAllTables() {
  try {
    console.log('\n📊 Consultando tablas en Supabase...')
    
    // Consultar tablas del esquema público
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .neq('table_name', 'spatial_ref_sys') // Excluir tabla del sistema PostGIS
      .order('table_name')

    if (error) {
      console.log('⚠️  No se puede acceder a information_schema directamente')
      console.log('🔄 Intentando método alternativo...')
      
      // Método alternativo: probar tablas específicas
      return await checkSpecificTables()
    }

    if (data && data.length > 0) {
      console.log(`\n✅ Encontradas ${data.length} tablas:`)
      console.log('================================')
      
      data.forEach((table, index) => {
        console.log(`${index + 1}. 📋 ${table.table_name} (${table.table_type})`)
      })
      
      return data
    } else {
      console.log('\n📭 No se encontraron tablas en el esquema público')
      console.log('💡 Parece que la base de datos está vacía')
      return []
    }

  } catch (error) {
    console.error('❌ Error consultando tablas:', error.message)
    console.log('\n🔄 Intentando método alternativo...')
    return await checkSpecificTables()
  }
}

async function checkSpecificTables() {
  console.log('\n🧪 Probando existencia de tablas específicas...')
  
  const tablesToCheck = [
    'trabajadores',
    'turnos', 
    'vehicles',
    'routes',
    'payments',
    'users',
    'profiles'
  ]

  const existingTables = []

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (!error) {
        console.log(`✅ Tabla "${tableName}" existe`)
        
        // Obtener conteo de registros
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (!countError) {
          console.log(`   📊 Registros: ${count}`)
        }
        
        existingTables.push(tableName)
      } else {
        if (error.code === 'PGRST116') {
          console.log(`❌ Tabla "${tableName}" no existe`)
        } else {
          console.log(`⚠️  Tabla "${tableName}": ${error.message}`)
        }
      }
    } catch (error) {
      console.log(`❌ Error probando "${tableName}": ${error.message}`)
    }
  }

  return existingTables
}

async function checkDatabaseInfo() {
  try {
    console.log('\n🗄️  Información de la base de datos:')
    console.log('===================================')
    
    // Usar una consulta simple que siempre funciona
    const { data, error } = await supabase
      .rpc('version') // PostgreSQL version function

    if (error) {
      console.log('⚠️  No se puede obtener versión de PostgreSQL')
    } else {
      console.log(`📊 PostgreSQL: ${data}`)
    }

    // Información del proyecto
    console.log(`🌐 URL del proyecto: ${supabaseUrl}`)
    console.log(`🔑 Conexión: ${serviceKey ? 'Service key configurada' : 'Solo anon key'}`)

  } catch (error) {
    console.log('ℹ️  Información limitada disponible')
  }
}

async function main() {
  await checkDatabaseInfo()
  
  const tables = await listAllTables()
  
  console.log('\n📋 RESUMEN:')
  console.log('===========')
  
  if (tables.length === 0) {
    console.log('❌ No hay tablas creadas aún')
    console.log('💡 Necesitas ejecutar el script SQL para crear las tablas')
    console.log('📍 Ve a: https://supabase.com/dashboard/project/csqxopqlgujduhmwxixo/sql/new')
    console.log('📄 Ejecuta el contenido de: supabase_setup.sql')
  } else {
    console.log(`✅ ${tables.length} tablas encontradas`)
    console.log('🎉 Base de datos configurada')
  }

  console.log('\n============================================')
}

main().catch(console.error)
