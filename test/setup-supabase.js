/**
 * 🛠️ Script para crear tablas en Supabase automáticamente
 * 
 * Este script usa la service role key para crear las tablas directamente
 * desde Node.js, sin necesidad de usar el dashboard web.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service key para admin

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Variables de entorno faltantes (URL o SERVICE_KEY)')
  process.exit(1)
}

// Cliente con service role (permisos de administrador)
const supabase = createClient(supabaseUrl, serviceKey)

console.log('🚀 TransApp - Creador de tablas Supabase')
console.log('=========================================')

async function createTables() {
  try {
    console.log('\n📋 Creando tabla trabajadores...')
    
    const { error: workersError } = await supabase.rpc('create_workers_table', {}, {
      // Usar SQL directo ya que rpc puede no estar disponible
    })

    // Crear tabla trabajadores con SQL directo
    const workersSQL = `
      CREATE TABLE IF NOT EXISTS trabajadores (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        nombre TEXT NOT NULL,
        rut TEXT NOT NULL UNIQUE,
        cargo TEXT DEFAULT 'Conductor',
        telefono TEXT DEFAULT '',
        estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Índices para trabajadores
      CREATE INDEX IF NOT EXISTS idx_trabajadores_rut ON trabajadores(rut);
      CREATE INDEX IF NOT EXISTS idx_trabajadores_estado ON trabajadores(estado);
      CREATE INDEX IF NOT EXISTS idx_trabajadores_nombre ON trabajadores USING gin(to_tsvector('spanish', nombre));
    `

    const { error: createWorkersError } = await supabase.rpc('exec_sql', {
      sql: workersSQL
    })

    if (createWorkersError) {
      // Si rpc no funciona, mostrar el SQL para ejecutar manualmente
      console.log('⚠️  No se pudo crear automáticamente. Ejecuta este SQL en el dashboard:')
      console.log('📋 SQL para trabajadores:')
      console.log(workersSQL)
      
      console.log('\n📅 SQL para turnos:')
      const turnosSQL = `
        CREATE TABLE IF NOT EXISTS turnos (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          trabajador_id UUID REFERENCES trabajadores(id) ON DELETE CASCADE,
          fecha DATE NOT NULL,
          turno_tipo TEXT NOT NULL CHECK (turno_tipo IN ('primer_turno', 'segundo_turno', 'tercer_turno')),
          estado TEXT DEFAULT 'programado' CHECK (estado IN ('programado', 'completado', 'cancelado')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Índices para turnos
        CREATE INDEX IF NOT EXISTS idx_turnos_trabajador ON turnos(trabajador_id);
        CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
        CREATE INDEX IF NOT EXISTS idx_turnos_tipo ON turnos(turno_tipo);
        CREATE INDEX IF NOT EXISTS idx_turnos_trabajador_fecha ON turnos(trabajador_id, fecha);
      `
      console.log(turnosSQL)

      console.log('\n🔒 SQL para RLS (Row Level Security):')
      const rlsSQL = `
        -- Habilitar RLS
        ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;
        ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

        -- Políticas permisivas para desarrollo
        CREATE POLICY IF NOT EXISTS "Allow all operations" ON trabajadores FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Allow all operations" ON turnos FOR ALL USING (true);
      `
      console.log(rlsSQL)

      console.log('\n📊 SQL para datos de ejemplo:')
      const dataSQL = `
        -- Insertar trabajadores de ejemplo
        INSERT INTO trabajadores (nombre, rut, cargo, telefono) VALUES 
        ('Juan Pérez', '12.345.678-9', 'Conductor', '+56912345678'),
        ('María González', '98.765.432-1', 'Conductora', '+56987654321'),
        ('Carlos Silva', '11.222.333-4', 'Conductor', '+56911222333')
        ON CONFLICT (rut) DO NOTHING;

        -- Insertar turnos de ejemplo
        INSERT INTO turnos (trabajador_id, fecha, turno_tipo) 
        SELECT 
          t.id,
          CURRENT_DATE + (i * INTERVAL '1 day'),
          CASE 
            WHEN (i % 3) = 0 THEN 'primer_turno'
            WHEN (i % 3) = 1 THEN 'segundo_turno'
            ELSE 'tercer_turno'
          END
        FROM trabajadores t, generate_series(0, 6) i
        ON CONFLICT DO NOTHING;
      `
      console.log(dataSQL)

      console.log('\n📍 Ve al SQL Editor de Supabase y ejecuta estos scripts:')
      console.log('   https://supabase.com/dashboard/project/csqxopqlgujduhmwxixo/sql/new')
      return false
    }

    console.log('✅ Tablas creadas exitosamente')
    return true

  } catch (error) {
    console.error('❌ Error creando tablas:', error.message)
    return false
  }
}

async function testConnection() {
  try {
    console.log('\n🧪 Probando conexión con tablas...')
    
    // Probar tabla trabajadores
    const { data: workers, error: workersError } = await supabase
      .from('trabajadores')
      .select('count', { count: 'exact' })
      
    if (workersError) throw workersError
    
    console.log('✅ Tabla trabajadores: OK')
    
    // Probar tabla turnos
    const { data: shifts, error: shiftsError } = await supabase
      .from('turnos')
      .select('count', { count: 'exact' })
      
    if (shiftsError) throw shiftsError
    
    console.log('✅ Tabla turnos: OK')
    console.log('🎉 ¡Todas las tablas están funcionando!')
    
    return true
    
  } catch (error) {
    console.log('❌ Las tablas aún no existen:', error.message)
    return false
  }
}

// Ejecutar
async function main() {
  const tablesExist = await testConnection()
  
  if (!tablesExist) {
    console.log('\n🛠️ Las tablas no existen. Intentando crear...')
    const created = await createTables()
    
    if (created) {
      console.log('\n🔄 Verificando tablas creadas...')
      await testConnection()
    }
  }
  
  console.log('\n=========================================')
  console.log('✅ Configuración de Supabase completada')
  console.log('🚀 Ahora puedes usar TransApp con Supabase!')
}

main().catch(console.error)
