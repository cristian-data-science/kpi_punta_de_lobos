-- 🌊 PUNTA DE LOBOS - Sistema de Gestión de Personas
-- Script SQL para configurar base de datos en Supabase
-- Ejecutar en: Supabase Dashboard -> SQL Editor

-- ==================================================
-- 📋 TABLA PERSONAS
-- ==================================================

CREATE TABLE IF NOT EXISTS personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rut TEXT UNIQUE,
  email TEXT,
  telefono TEXT,
  tipo TEXT DEFAULT 'visitante' CHECK (tipo IN ('visitante', 'guia', 'staff', 'instructor', 'otro')),
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 📅 TABLA REGISTROS (Actividades)
-- ==================================================

CREATE TABLE IF NOT EXISTS registros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_actividad TEXT CHECK (tipo_actividad IN ('surf', 'clase', 'tour', 'evento', 'mantenimiento', 'otro')),
  descripcion TEXT,
  duracion_minutos INTEGER,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 📊 TABLA CONFIGURACION (Ajustes del sistema)
-- ==================================================

CREATE TABLE IF NOT EXISTS configuracion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT,
  tipo TEXT DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 🚀 ÍNDICES PARA OPTIMIZACIÓN
-- ==================================================

-- Índices personas
CREATE INDEX IF NOT EXISTS idx_personas_rut ON personas(rut);
CREATE INDEX IF NOT EXISTS idx_personas_tipo ON personas(tipo);
CREATE INDEX IF NOT EXISTS idx_personas_estado ON personas(estado);
CREATE INDEX IF NOT EXISTS idx_personas_nombre ON personas USING gin(to_tsvector('spanish', nombre));

-- Índices registros
CREATE INDEX IF NOT EXISTS idx_registros_persona ON registros(persona_id);
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros(fecha);
CREATE INDEX IF NOT EXISTS idx_registros_tipo ON registros(tipo_actividad);
CREATE INDEX IF NOT EXISTS idx_registros_persona_fecha ON registros(persona_id, fecha);

-- Índices configuración
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion(clave);

-- ==================================================
-- ⚡ FUNCIÓN PARA UPDATED_AT AUTOMÁTICO
-- ==================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 🎯 TRIGGERS PARA UPDATED_AT
-- ==================================================

-- Trigger para personas
DROP TRIGGER IF EXISTS personas_updated_at ON personas;
CREATE TRIGGER personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger para registros
DROP TRIGGER IF EXISTS registros_updated_at ON registros;
CREATE TRIGGER registros_updated_at
  BEFORE UPDATE ON registros
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger para configuracion
DROP TRIGGER IF EXISTS configuracion_updated_at ON configuracion;
CREATE TRIGGER configuracion_updated_at
  BEFORE UPDATE ON configuracion
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ==================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Habilitar RLS
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (ajustar en producción)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON personas;
CREATE POLICY "Allow all operations for authenticated users" ON personas
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON registros;
CREATE POLICY "Allow all operations for authenticated users" ON registros
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON configuracion;
CREATE POLICY "Allow all operations for authenticated users" ON configuracion
  FOR ALL USING (true);

-- ==================================================
-- 📊 DATOS DE EJEMPLO (OPCIONAL - Comentar en producción)
-- ==================================================

-- Insertar personas de ejemplo
INSERT INTO personas (nombre, rut, email, telefono, tipo) VALUES 
('Juan Pérez', '12345678-9', 'juan@example.com', '+56912345678', 'instructor'),
('María González', '98765432-1', 'maria@example.com', '+56987654321', 'guia'),
('Pedro Silva', '11111111-1', 'pedro@example.com', '+56911111111', 'staff')
ON CONFLICT (rut) DO NOTHING;

-- Insertar configuración de ejemplo
INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES 
('nombre_sitio', 'Punta de Lobos', 'string', 'Nombre del sitio'),
('horario_apertura', '08:00', 'string', 'Hora de apertura'),
('horario_cierre', '20:00', 'string', 'Hora de cierre'),
('capacidad_maxima', '100', 'number', 'Capacidad máxima de personas simultáneas')
ON CONFLICT (clave) DO NOTHING;

-- ==================================================
-- ✅ VERIFICACIÓN
-- ==================================================

-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('personas', 'registros', 'configuracion');

-- Contar registros
SELECT 
  (SELECT COUNT(*) FROM personas) as total_personas,
  (SELECT COUNT(*) FROM registros) as total_registros,
  (SELECT COUNT(*) FROM configuracion) as total_config;
