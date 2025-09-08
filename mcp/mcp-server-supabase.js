#!/usr/bin/env node

/**
 * 🔌 Servidor MCP personalizado para TransApp + Supabase
 * 
 * Este servidor MCP permite interactuar directamente con Supabase
 * desde el contexto del modelo de IA, proporcionando herramientas
 * para consultas SQL, operaciones CRUD y gestión de datos.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://csqxopqlgujduhmwxixo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM1NDkzMywiZXhwIjoyMDcyOTMwOTMzfQ.sKq7WvocXEyL9l5BcRsZOfJFnf9ZaRlOYL0acfUg5II';

// Cliente de Supabase con permisos administrativos
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Crear servidor MCP
const server = new Server(
  {
    name: 'transapp-supabase-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Definir herramientas disponibles
const tools = [
  {
    name: 'query_workers',
    description: 'Consultar trabajadores en la base de datos con filtros opcionales',
    inputSchema: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          properties: {
            rut: { type: 'string', description: 'Filtrar por RUT específico' },
            nombre: { type: 'string', description: 'Filtrar por nombre (búsqueda parcial)' },
            contrato: { type: 'string', enum: ['fijo', 'eventual'], description: 'Tipo de contrato' },
            estado: { type: 'string', enum: ['activo', 'inactivo'], description: 'Estado del trabajador' }
          }
        },
        limit: { type: 'number', description: 'Número máximo de resultados (default: 50)' }
      }
    }
  },
  {
    name: 'create_worker',
    description: 'Crear un nuevo trabajador en la base de datos',
    inputSchema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre completo del trabajador' },
        rut: { type: 'string', description: 'RUT del trabajador (formato: 12345678-9)' },
        contrato: { type: 'string', enum: ['fijo', 'eventual'], description: 'Tipo de contrato' },
        telefono: { type: 'string', description: 'Teléfono del trabajador (opcional)' }
      },
      required: ['nombre', 'rut']
    }
  },
  {
    name: 'update_worker',
    description: 'Actualizar datos de un trabajador existente',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID UUID del trabajador' },
        updates: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            telefono: { type: 'string' },
            contrato: { type: 'string', enum: ['fijo', 'eventual'] },
            estado: { type: 'string', enum: ['activo', 'inactivo'] }
          }
        }
      },
      required: ['id', 'updates']
    }
  },
  {
    name: 'query_shifts',
    description: 'Consultar turnos de trabajadores con filtros por fecha y trabajador',
    inputSchema: {
      type: 'object',
      properties: {
        trabajador_id: { type: 'string', description: 'ID del trabajador específico' },
        fecha_inicio: { type: 'string', format: 'date', description: 'Fecha de inicio (YYYY-MM-DD)' },
        fecha_fin: { type: 'string', format: 'date', description: 'Fecha de fin (YYYY-MM-DD)' },
        turno_tipo: { type: 'string', enum: ['primer_turno', 'segundo_turno', 'tercer_turno'] }
      }
    }
  },
  {
    name: 'create_shift',
    description: 'Crear un nuevo turno para un trabajador',
    inputSchema: {
      type: 'object',
      properties: {
        trabajador_id: { type: 'string', description: 'ID UUID del trabajador' },
        fecha: { type: 'string', format: 'date', description: 'Fecha del turno (YYYY-MM-DD)' },
        turno_tipo: { type: 'string', enum: ['primer_turno', 'segundo_turno', 'tercer_turno'] }
      },
      required: ['trabajador_id', 'fecha', 'turno_tipo']
    }
  },
  {
    name: 'execute_sql',
    description: 'Ejecutar consulta SQL personalizada (solo SELECT para seguridad)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Consulta SQL (solo SELECT permitido)' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_database_schema',
    description: 'Obtener esquema de las tablas de la base de datos',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: { type: 'string', description: 'Nombre de tabla específica (opcional)' }
      }
    }
  }
];

// Registrar herramientas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Manejar llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_workers': {
        let query = supabase.from('trabajadores').select('*');
        
        if (args.filters) {
          if (args.filters.rut) {
            query = query.eq('rut', args.filters.rut);
          }
          if (args.filters.nombre) {
            query = query.ilike('nombre', `%${args.filters.nombre}%`);
          }
          if (args.filters.contrato) {
            query = query.eq('contrato', args.filters.contrato);
          }
          if (args.filters.estado) {
            query = query.eq('estado', args.filters.estado);
          }
        }
        
        if (args.limit) {
          query = query.limit(args.limit);
        } else {
          query = query.limit(50);
        }
        
        const { data, error } = await query.order('nombre');
        
        if (error) throw error;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: data.length,
                workers: data
              }, null, 2)
            }
          ]
        };
      }

      case 'create_worker': {
        const { nombre, rut, contrato = 'eventual', telefono = '' } = args;
        
        const { data, error } = await supabase
          .from('trabajadores')
          .insert([{ nombre, rut, contrato, telefono }])
          .select();
        
        if (error) throw error;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Trabajador creado exitosamente',
                worker: data[0]
              }, null, 2)
            }
          ]
        };
      }

      case 'update_worker': {
        const { id, updates } = args;
        
        const { data, error } = await supabase
          .from('trabajadores')
          .update(updates)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Trabajador actualizado exitosamente',
                worker: data[0]
              }, null, 2)
            }
          ]
        };
      }

      case 'query_shifts': {
        let query = supabase.from('turnos').select(`
          *,
          trabajadores(nombre, rut)
        `);
        
        if (args.trabajador_id) {
          query = query.eq('trabajador_id', args.trabajador_id);
        }
        if (args.fecha_inicio) {
          query = query.gte('fecha', args.fecha_inicio);
        }
        if (args.fecha_fin) {
          query = query.lte('fecha', args.fecha_fin);
        }
        if (args.turno_tipo) {
          query = query.eq('turno_tipo', args.turno_tipo);
        }
        
        const { data, error } = await query.order('fecha', { ascending: false });
        
        if (error) throw error;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: data.length,
                shifts: data
              }, null, 2)
            }
          ]
        };
      }

      case 'create_shift': {
        const { trabajador_id, fecha, turno_tipo } = args;
        
        const { data, error } = await supabase
          .from('turnos')
          .insert([{ trabajador_id, fecha, turno_tipo }])
          .select(`
            *,
            trabajadores(nombre, rut)
          `);
        
        if (error) throw error;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Turno creado exitosamente',
                shift: data[0]
              }, null, 2)
            }
          ]
        };
      }

      case 'execute_sql': {
        const { query } = args;
        
        // Validación básica de seguridad
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery.startsWith('select')) {
          throw new Error('Solo se permiten consultas SELECT por seguridad');
        }
        
        const { data, error } = await supabase.rpc('execute_sql', { sql_query: query });
        
        if (error) throw error;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                results: data
              }, null, 2)
            }
          ]
        };
      }

      case 'get_database_schema': {
        let query = supabase
          .from('information_schema.columns')
          .select('table_name, column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public');
        
        if (args.table_name) {
          query = query.eq('table_name', args.table_name);
        } else {
          query = query.in('table_name', ['trabajadores', 'turnos']);
        }
        
        const { data, error } = await query.order('table_name').order('ordinal_position');
        
        if (error) throw error;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                schema: data
              }, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🔌 TransApp Supabase MCP Server iniciado');
}

main().catch(console.error);
