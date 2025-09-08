#!/usr/bin/env node

/**
 * 🚀 TransApp MCP Server
 * 
 * Servidor MCP personalizado para TransApp que proporciona
 * acceso directo a la base de datos Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const { Server } = require('@modelcontextprotocol/sdk/server')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://csqxopqlgujduhmwxixo.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'

const supabase = createClient(supabaseUrl, supabaseKey)

class TransAppMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'transapp-supabase',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    )

    this.setupTools()
  }

  setupTools() {
    // 1. Consultar trabajadores
    this.server.addTool({
      name: 'query_workers',
      description: 'Consulta trabajadores de la base de datos con filtros opcionales',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 10 },
          offset: { type: 'number', default: 0 },
          search: { type: 'string' },
          estado: { type: 'string', enum: ['activo', 'inactivo'] }
        }
      }
    }, async (args) => {
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

        const { data, error, count } = await query
          .range(args.offset || 0, (args.offset || 0) + (args.limit || 10) - 1)
          .order('nombre')

        if (error) throw error

        return {
          content: [{
            type: 'text',
            text: `Encontrados ${data.length} trabajadores:\n${JSON.stringify(data, null, 2)}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text', 
            text: `Error: ${error.message}`
          }]
        }
      }
    })

    // 2. Crear trabajador
    this.server.addTool({
      name: 'create_worker',
      description: 'Crea un nuevo trabajador en la base de datos',
      inputSchema: {
        type: 'object',
        required: ['nombre', 'rut', 'contrato', 'telefono'],
        properties: {
          nombre: { type: 'string' },
          rut: { type: 'string' },
          contrato: { type: 'string', enum: ['planta', 'eventual'] },
          telefono: { type: 'string' },
          estado: { type: 'string', enum: ['activo', 'inactivo'], default: 'activo' }
        }
      }
    }, async (args) => {
      try {
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

        return {
          content: [{
            type: 'text',
            text: `✅ Trabajador creado exitosamente:\n${JSON.stringify(data[0], null, 2)}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error al crear trabajador: ${error.message}`
          }]
        }
      }
    })

    // 3. Actualizar trabajador
    this.server.addTool({
      name: 'update_worker',
      description: 'Actualiza un trabajador existente',
      inputSchema: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          nombre: { type: 'string' },
          rut: { type: 'string' },
          contrato: { type: 'string', enum: ['planta', 'eventual'] },
          telefono: { type: 'string' },
          estado: { type: 'string', enum: ['activo', 'inactivo'] }
        }
      }
    }, async (args) => {
      try {
        const updates = { ...args }
        delete updates.id

        const { data, error } = await supabase
          .from('trabajadores')
          .update(updates)
          .eq('id', args.id)
          .select()

        if (error) throw error

        return {
          content: [{
            type: 'text',
            text: `✅ Trabajador actualizado:\n${JSON.stringify(data[0], null, 2)}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error al actualizar trabajador: ${error.message}`
          }]
        }
      }
    })

    // 4. Consultar turnos
    this.server.addTool({
      name: 'query_shifts',
      description: 'Consulta turnos con información de trabajadores',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 10 },
          fecha_desde: { type: 'string', format: 'date' },
          fecha_hasta: { type: 'string', format: 'date' },
          trabajador_id: { type: 'string' },
          turno_tipo: { type: 'string', enum: ['primer_turno', 'segundo_turno', 'tercer_turno'] }
        }
      }
    }, async (args) => {
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

        return {
          content: [{
            type: 'text',
            text: `Encontrados ${data.length} turnos:\n${JSON.stringify(data, null, 2)}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }]
        }
      }
    })

    // 5. Crear turno
    this.server.addTool({
      name: 'create_shift',
      description: 'Crea un nuevo turno para un trabajador',
      inputSchema: {
        type: 'object',
        required: ['trabajador_id', 'fecha', 'turno_tipo'],
        properties: {
          trabajador_id: { type: 'string' },
          fecha: { type: 'string', format: 'date' },
          turno_tipo: { type: 'string', enum: ['primer_turno', 'segundo_turno', 'tercer_turno'] },
          estado: { type: 'string', enum: ['programado', 'completado', 'cancelado'], default: 'programado' }
        }
      }
    }, async (args) => {
      try {
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

        return {
          content: [{
            type: 'text',
            text: `✅ Turno creado exitosamente:\n${JSON.stringify(data[0], null, 2)}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error al crear turno: ${error.message}`
          }]
        }
      }
    })

    // 6. Ejecutar SQL seguro
    this.server.addTool({
      name: 'execute_sql',
      description: 'Ejecuta consultas SQL de solo lectura (SELECT)',
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' }
        }
      }
    }, async (args) => {
      try {
        // Solo permitir SELECT queries por seguridad
        if (!args.query.trim().toLowerCase().startsWith('select')) {
          throw new Error('Solo se permiten consultas SELECT por seguridad')
        }

        const { data, error } = await supabase.rpc('execute_query', {
          query_text: args.query
        })

        if (error) {
          // Fallback: usar queries específicas conocidas
          if (args.query.includes('trabajadores')) {
            const { data: workers, error: workersError } = await supabase
              .from('trabajadores')
              .select('*')
            
            if (workersError) throw workersError
            return {
              content: [{
                type: 'text',
                text: `Resultado:\n${JSON.stringify(workers, null, 2)}`
              }]
            }
          }
          
          throw error
        }

        return {
          content: [{
            type: 'text',
            text: `Resultado SQL:\n${JSON.stringify(data, null, 2)}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error SQL: ${error.message}`
          }]
        }
      }
    })

    // 7. Obtener esquema de base de datos
    this.server.addTool({
      name: 'get_database_schema',
      description: 'Obtiene información del esquema de la base de datos',
      inputSchema: {
        type: 'object',
        properties: {
          table_name: { type: 'string' }
        }
      }
    }, async (args) => {
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
            return {
              content: [{
                type: 'text',
                text: `Esquema de ${args.table_name}:\n${JSON.stringify(schema.tables[args.table_name], null, 2)}`
              }]
            }
          } else {
            return {
              content: [{
                type: 'text',
                text: `Tabla '${args.table_name}' no encontrada. Tablas disponibles: ${Object.keys(schema.tables).join(', ')}`
              }]
            }
          }
        }

        return {
          content: [{
            type: 'text',
            text: `Esquema completo de la base de datos:\n${JSON.stringify(schema, null, 2)}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error obteniendo esquema: ${error.message}`
          }]
        }
      }
    })
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('🚀 TransApp MCP Server iniciado correctamente')
  }
}

// Iniciar el servidor
if (require.main === module) {
  const server = new TransAppMCPServer()
  server.run().catch(console.error)
}

module.exports = TransAppMCPServer
