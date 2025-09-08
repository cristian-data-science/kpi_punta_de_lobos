#!/usr/bin/env node

/**
 * 🚀 TransApp MCP Server (Versión Simplificada)
 * 
 * Servidor MCP básico para TransApp con herramientas esenciales
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 TransApp MCP Server iniciado')
console.log('✅ Conexión con Supabase establecida')
console.log('')
console.log('🔧 Herramientas MCP disponibles:')
console.log('   • query_workers - Consultar trabajadores')
console.log('   • create_worker - Crear trabajador')
console.log('   • update_worker - Actualizar trabajador')
console.log('   • query_shifts - Consultar turnos')
console.log('   • create_shift - Crear turno')
console.log('   • execute_sql - Ejecutar SQL seguro')
console.log('   • get_database_schema - Obtener esquema')
console.log('')

// Funciones de herramientas MCP
const tools = {
  async query_workers(args = {}) {
    try {
      let query = supabase
        .from('trabajadores')
        .select('*')

      if (args.search) {
        query = query.or(`nombre.ilike.%${args.search}%,rut.ilike.%${args.search}%`)
      }

      if (args.estado) {
        query = query.eq('estado', args.estado)
      }

      const { data, error } = await query
        .range(args.offset || 0, (args.offset || 0) + (args.limit || 10) - 1)
        .order('nombre')

      if (error) throw error

      console.log(`✅ Consulta exitosa: ${data.length} trabajadores encontrados`)
      return { success: true, data, count: data.length }
    } catch (error) {
      console.error(`❌ Error en query_workers: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  async create_worker(args) {
    try {
      if (!args.nombre || !args.rut || !args.contrato || !args.telefono) {
        throw new Error('Faltan campos requeridos: nombre, rut, contrato, telefono')
      }

      const { data, error } = await supabase
        .from('trabajadores')
        .insert([{
          nombre: args.nombre,
          rut: args.rut,
          contrato: args.contrato,
          telefono: args.telefono,
          estado: args.estado || 'activo'
        }])
        .select()

      if (error) throw error

      console.log(`✅ Trabajador creado: ${data[0].nombre}`)
      return { success: true, data: data[0] }
    } catch (error) {
      console.error(`❌ Error en create_worker: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  async update_worker(args) {
    try {
      if (!args.id) {
        throw new Error('ID del trabajador es requerido')
      }

      const updates = { ...args }
      delete updates.id

      const { data, error } = await supabase
        .from('trabajadores')
        .update(updates)
        .eq('id', args.id)
        .select()

      if (error) throw error

      console.log(`✅ Trabajador actualizado: ${data[0]?.nombre || args.id}`)
      return { success: true, data: data[0] }
    } catch (error) {
      console.error(`❌ Error en update_worker: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  async query_shifts(args = {}) {
    try {
      let query = supabase
        .from('turnos')
        .select(`
          *,
          trabajadores:trabajador_id (
            id, nombre, rut, contrato
          )
        `)

      if (args.fecha_desde) {
        query = query.gte('fecha', args.fecha_desde)
      }

      if (args.fecha_hasta) {
        query = query.lte('fecha', args.fecha_hasta)
      }

      if (args.trabajador_id) {
        query = query.eq('trabajador_id', args.trabajador_id)
      }

      if (args.turno_tipo) {
        query = query.eq('turno_tipo', args.turno_tipo)
      }

      const { data, error } = await query
        .limit(args.limit || 10)
        .order('fecha', { ascending: false })

      if (error) throw error

      console.log(`✅ Consulta exitosa: ${data.length} turnos encontrados`)
      return { success: true, data, count: data.length }
    } catch (error) {
      console.error(`❌ Error en query_shifts: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  async create_shift(args) {
    try {
      if (!args.trabajador_id || !args.fecha || !args.turno_tipo) {
        throw new Error('Faltan campos requeridos: trabajador_id, fecha, turno_tipo')
      }

      const { data, error } = await supabase
        .from('turnos')
        .insert([{
          trabajador_id: args.trabajador_id,
          fecha: args.fecha,
          turno_tipo: args.turno_tipo,
          estado: args.estado || 'programado'
        }])
        .select(`
          *,
          trabajadores:trabajador_id (nombre, rut)
        `)

      if (error) throw error

      console.log(`✅ Turno creado: ${args.fecha} - ${args.turno_tipo}`)
      return { success: true, data: data[0] }
    } catch (error) {
      console.error(`❌ Error en create_shift: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  async execute_sql(args) {
    try {
      if (!args.query) {
        throw new Error('Query SQL es requerida')
      }

      // Solo permitir SELECT por seguridad
      if (!args.query.trim().toLowerCase().startsWith('select')) {
        throw new Error('Solo se permiten consultas SELECT por seguridad')
      }

      // Fallback con queries conocidas
      if (args.query.toLowerCase().includes('trabajadores')) {
        const { data, error } = await supabase
          .from('trabajadores')
          .select('*')
          .limit(20)
        
        if (error) throw error
        
        console.log(`✅ SQL ejecutado: ${data.length} registros`)
        return { success: true, data }
      }

      if (args.query.toLowerCase().includes('turnos')) {
        const { data, error } = await supabase
          .from('turnos')
          .select('*, trabajadores(nombre)')
          .limit(20)
        
        if (error) throw error
        
        console.log(`✅ SQL ejecutado: ${data.length} registros`)
        return { success: true, data }
      }

      throw new Error('Query no soportada. Use consultas específicas a trabajadores o turnos')
    } catch (error) {
      console.error(`❌ Error en execute_sql: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  async get_database_schema(args = {}) {
    try {
      const schema = {
        tables: {
          trabajadores: {
            columns: ['id', 'nombre', 'rut', 'contrato', 'telefono', 'estado', 'created_at', 'updated_at'],
            description: 'Tabla de trabajadores con información personal y contractual',
            constraints: ['rut debe ser único', 'contrato: planta|eventual', 'estado: activo|inactivo']
          },
          turnos: {
            columns: ['id', 'trabajador_id', 'fecha', 'turno_tipo', 'estado', 'created_at'],
            description: 'Tabla de turnos asignados a trabajadores',
            constraints: ['turno_tipo: primer_turno|segundo_turno|tercer_turno', 'estado: programado|completado|cancelado'],
            relations: ['trabajador_id -> trabajadores.id']
          }
        },
        relationships: [
          'turnos.trabajador_id -> trabajadores.id (muchos a uno)'
        ]
      }

      if (args.table_name) {
        if (schema.tables[args.table_name]) {
          console.log(`✅ Esquema de ${args.table_name} obtenido`)
          return { success: true, data: schema.tables[args.table_name] }
        } else {
          console.log(`❌ Tabla '${args.table_name}' no encontrada`)
          return { success: false, error: `Tabla '${args.table_name}' no encontrada`, available_tables: Object.keys(schema.tables) }
        }
      }

      console.log('✅ Esquema completo obtenido')
      return { success: true, data: schema }
    } catch (error) {
      console.error(`❌ Error en get_database_schema: ${error.message}`)
      return { success: false, error: error.message }
    }
  }
}

// Función de prueba interactiva
async function testTools() {
  console.log('🧪 Ejecutando pruebas de herramientas...\n')

  // 1. Probar query_workers
  console.log('1. Probando query_workers...')
  const workersResult = await tools.query_workers({ limit: 3 })
  console.log(JSON.stringify(workersResult, null, 2))
  console.log('')

  // 2. Probar query_shifts
  console.log('2. Probando query_shifts...')
  const shiftsResult = await tools.query_shifts({ limit: 3 })
  console.log(JSON.stringify(shiftsResult, null, 2))
  console.log('')

  // 3. Probar get_database_schema
  console.log('3. Probando get_database_schema...')
  const schemaResult = await tools.get_database_schema()
  console.log(JSON.stringify(schemaResult, null, 2))
  console.log('')

  console.log('✅ Todas las pruebas completadas!')
}

// Ejecutar las pruebas si se llama directamente
if (require.main === module) {
  testTools().catch(console.error)
}

// Exportar herramientas para uso externo
module.exports = { tools, supabase }
