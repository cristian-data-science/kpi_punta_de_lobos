-- 🗄️ SCRIPT SQL SIMPLIFICADO PARA TRANSAPP
-- Versión sin errores para Supabase Dashboard

-- Crear tabla trabajadores
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

-- Crear tabla turnos
CREATE TABLE IF NOT EXISTS turnos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trabajador_id UUID REFERENCES trabajadores(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  turno_tipo TEXT NOT NULL CHECK (turno_tipo IN ('primer_turno', 'segundo_turno', 'tercer_turno')),
  estado TEXT DEFAULT 'programado' CHECK (estado IN ('programado', 'completado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_trabajadores_rut ON trabajadores(rut);
CREATE INDEX IF NOT EXISTS idx_trabajadores_estado ON trabajadores(estado);
CREATE INDEX IF NOT EXISTS idx_trabajadores_nombre ON trabajadores(nombre);

CREATE INDEX IF NOT EXISTS idx_turnos_trabajador ON turnos(trabajador_id);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_tipo ON turnos(turno_tipo);

-- Función para updated_at automático
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para trabajadores
DROP TRIGGER IF EXISTS trabajadores_updated_at ON trabajadores;
CREATE TRIGGER trabajadores_updated_at
  BEFORE UPDATE ON trabajadores
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insertar trabajadores reales
INSERT INTO trabajadores (nombre, rut, contrato, telefono) VALUES 
('JORGE ANDRÉS FLORES OSORIO', '12650299-0', 'eventual', ''),
('JOSÉ DANIEL AMPUERO AMPUERO', '11945733-5', 'eventual', ''),
('NELSON DEL CARMEN LAGOS REY', '11764166-K', 'eventual', ''),
('HUMBERTO ANTONIO SILVA CARREÑO', '10230428-4', 'eventual', ''),
('JORGE PABLO FUENTES ABARZUA', '15872050-7', 'eventual', ''),
('HUGO IVÁN DURÁN JIMÉNEZ', '14246406-3', 'eventual', ''),
('CARLOS JONATHAN RAMIREZ ESPINOZA', '16757796-2', 'eventual', ''),
('JUAN ANTONIO GONZALEZ JIMENEZ', '12825622-9', 'eventual', ''),
('WLADIMIR ROLANDO ISLER VALDÉS', '11314229-4', 'eventual', ''),
('FELIPE ANDRÉS VALLEJOS SANTIS', '16107285-0', 'eventual', ''),
('ERICK ISMAEL MIRANDA ABARCA', '15087914-7', 'eventual', ''),
('JONATHAN FRANCISCO CABELLO MORA', '15872981-4', 'eventual', ''),
('MANUEL EDGARDO HERRERA SORIANO', '19757064-4', 'eventual', ''),
('OSCAR ENRIQUE ORELLANA VASQUEZ', '9591122-6', 'eventual', '')
ON CONFLICT (rut) DO NOTHING;

-- Insertar turnos de ejemplo (una semana para cada trabajador)
INSERT INTO turnos (trabajador_id, fecha, turno_tipo) 
SELECT 
  t.id,
  CURRENT_DATE + (i * INTERVAL '1 day'),
  CASE 
    WHEN (i % 3) = 0 THEN 'primer_turno'
    WHEN (i % 3) = 1 THEN 'segundo_turno'
    ELSE 'tercer_turno'
  END
FROM trabajadores t, generate_series(0, 6) i;

-- Verificar resultados
SELECT 
  'trabajadores' as tabla,
  COUNT(*) as registros
FROM trabajadores
UNION ALL
SELECT 
  'turnos' as tabla,
  COUNT(*) as registros
FROM turnos;
