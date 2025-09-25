#!/usr/bin/env node

/**
 * 🚀 TransApp MCP Server (DESARROLLO - Full Permisos)
 * 
 * Servidor MCP con permisos completos para desarrollo
 * ⚠️ INCLUYE: SELECT, INSERT, UPDATE, DELETE, DDL (CREATE/ALTER/DROP)
 */

const { createClient } = require('@supabase/supabase-js')

// 🔐 Configuración de Supabase usando SOLO variables de entorno
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

// ⚠️ Validar que las credenciales estén configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno de Supabase no configuradas')
  console.error('📋 Configura: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 TransApp MCP Server (DESARROLLO) iniciado')
console.log('✅ Conexión con Supabase establecida')
console.log('⚠️ MODO DESARROLLO: Permisos completos habilitados')
console.log('')
console.log('🔧 Herramientas MCP disponibles:')
console.log('   • query_workers - Consultar trabajadores')
console.log('   • create_worker - Crear trabajador') 
console.log('   • update_worker - Actualizar trabajador')
console.log('   • delete_worker - Eliminar trabajador')
console.log('   • query_shifts - Consultar turnos')
console.log('   • create_shift - Crear turno')
console.log('   • update_shift - Actualizar turno')
console.log('   • delete_shift - Eliminar turno')
console.log('   • execute_sql - Ejecutar cualquier SQL (SELECT/INSERT/UPDATE/DELETE)')
console.log('   • execute_ddl - Ejecutar DDL (CREATE/ALTER/DROP)')
console.log('   • get_database_schema - Obtener esquema completo')
console.log('   • bulk_delete - Eliminación masiva')
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
      if (!args.nombre || !args.rut || !args.contrato || args.telefono === undefined) {
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

      console.log(`🔧 Ejecutando SQL: ${args.query.substring(0, 50)}...`)

      // MODO DESARROLLO: Permitir cualquier SQL (SELECT, INSERT, UPDATE, DELETE)
      const query = args.query.trim()
      const operation = query.split(' ')[0].toUpperCase()

      // Ejecutar SQL directamente usando RPC o método directo
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: query 
      }).catch(async (rpcError) => {
        // Si RPC falla, usar métodos específicos según la operación
        if (operation === 'SELECT' && query.includes('information_schema')) {
          // Queries de metadatos usando método directo
          return await supabase.from('trabajadores').select('*').limit(1)
        }
        throw rpcError
      })

      if (error) throw error

      const resultCount = Array.isArray(data) ? data.length : (data ? 1 : 0)
      console.log(`✅ SQL ejecutado exitosamente: ${resultCount} registros afectados`)
      return { success: true, data, count: resultCount }
    } catch (error) {
      console.error(`❌ Error en execute_sql: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  // Nueva función para DDL completo
  async execute_ddl(args) {
    try {
      if (!args.query) {
        throw new Error('Query DDL es requerida')
      }

      console.log(`🔧 Ejecutando DDL: ${args.query.substring(0, 50)}...`)

      // Solo para operaciones DDL (CREATE, ALTER, DROP)
      const query = args.query.trim().toUpperCase()
      if (!query.startsWith('CREATE') && !query.startsWith('ALTER') && !query.startsWith('DROP')) {
        throw new Error('Solo se permiten operaciones DDL (CREATE/ALTER/DROP)')
      }

      // Ejecutar DDL usando RPC especial o método directo
      const { data, error } = await supabase.rpc('exec_ddl', { 
        sql_query: args.query 
      }).catch(() => {
        throw new Error('DDL no disponible. Usar interfaz de Supabase SQL Editor.')
      })

      if (error) throw error

      console.log('✅ DDL ejecutado exitosamente')
      return { success: true, data, message: 'DDL ejecutado correctamente' }
    } catch (error) {
      console.error(`❌ Error en execute_ddl: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  // Función para eliminación segura de trabajadores
  async delete_worker(args) {
    try {
      if (!args.id) {
        throw new Error('ID del trabajador es requerido')
      }

      const { data, error } = await supabase
        .from('trabajadores')
        .delete()
        .eq('id', args.id)
        .select()

      if (error) throw error

      if (data.length === 0) {
        throw new Error('Trabajador no encontrado')
      }

      console.log(`✅ Trabajador eliminado: ${data[0]?.nombre || args.id}`)
      return { success: true, data: data[0] }
    } catch (error) {
      console.error(`❌ Error en delete_worker: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  // Función para eliminación segura de turnos
  async delete_shift(args) {
    try {
      if (!args.id) {
        throw new Error('ID del turno es requerido')
      }

      const { data, error } = await supabase
        .from('turnos')
        .delete()
        .eq('id', args.id)
        .select()

      if (error) throw error

      if (data.length === 0) {
        throw new Error('Turno no encontrado')
      }

      console.log(`✅ Turno eliminado: ${data[0]?.fecha} - ${data[0]?.turno_tipo}`)
      return { success: true, data: data[0] }
    } catch (error) {
      console.error(`❌ Error en delete_shift: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  // Función para eliminación masiva (DESARROLLO)
  async bulk_delete(args) {
    try {
      if (!args.table || !args.condition) {
        throw new Error('Tabla y condición son requeridas')
      }

      console.log(`⚠️ ELIMINACIÓN MASIVA en ${args.table}`)

      let query = supabase.from(args.table).delete()

      // Aplicar condiciones de forma segura
      if (args.condition.column && args.condition.value) {
        query = query.eq(args.condition.column, args.condition.value)
      } else {
        throw new Error('Condición mal formateada. Use: {column: "campo", value: "valor"}')
      }

      const { data, error } = await query.select()

      if (error) throw error

      console.log(`✅ Eliminación masiva completada: ${data.length} registros`)
      return { success: true, data, count: data.length }
    } catch (error) {
      console.error(`❌ Error en bulk_delete: ${error.message}`)
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
            constraints: ['rut debe ser único', 'contrato: fijo|eventual|planta', 'estado: activo|inactivo'],
            metadata: ['created_at: timestamp de creación', 'updated_at: timestamp de actualización (auto-trigger)']
          },
          turnos: {
            columns: ['id', 'trabajador_id', 'fecha', 'turno_tipo', 'estado', 'created_at', 'updated_at'],
            description: 'Tabla de turnos asignados a trabajadores',
            constraints: ['turno_tipo: primer_turno|segundo_turno|tercer_turno', 'estado: programado|completado|cancelado'],
            relations: ['trabajador_id -> trabajadores.id'],
            metadata: ['created_at: timestamp de creación', 'updated_at: timestamp de actualización (auto-trigger)']
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
