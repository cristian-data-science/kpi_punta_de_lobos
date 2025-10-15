-- 🌊 PUNTA DE LOBOS - Tablas Adicionales: TURNOS y COBROS
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- NOTA: Este script agrega las tablas que faltaban al setup inicial

-- ==================================================
-- ⏰ TABLA TURNOS (Gestión de Turnos)
-- ==================================================

CREATE TABLE IF NOT EXISTS turnos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  tipo_turno TEXT CHECK (tipo_turno IN ('mañana', 'tarde', 'noche', 'completo', 'personalizado')),
  estado TEXT DEFAULT 'programado' CHECK (estado IN ('programado', 'en_curso', 'completado', 'cancelado', 'ausente')),
  puesto TEXT,
  ubicacion TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 💰 TABLA COBROS (Pagos y Cobros)
-- ==================================================

CREATE TABLE IF NOT EXISTS cobros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  registro_id UUID REFERENCES registros(id) ON DELETE SET NULL,
  turno_id UUID REFERENCES turnos(id) ON DELETE SET NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto DECIMAL(10, 2) NOT NULL,
  moneda TEXT DEFAULT 'CLP' CHECK (moneda IN ('CLP', 'USD', 'EUR', 'BRL')),
  tipo TEXT NOT NULL CHECK (tipo IN ('cobro', 'pago', 'reembolso', 'descuento')),
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'cheque', 'otro')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'parcial', 'cancelado', 'reembolsado')),
  concepto TEXT,
  descripcion TEXT,
  referencia TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 🚀 ÍNDICES PARA OPTIMIZACIÓN
-- ==================================================

-- Índices turnos
CREATE INDEX IF NOT EXISTS idx_turnos_persona ON turnos(persona_id);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_tipo ON turnos(tipo_turno);
CREATE INDEX IF NOT EXISTS idx_turnos_persona_fecha ON turnos(persona_id, fecha);

-- Índices cobros
CREATE INDEX IF NOT EXISTS idx_cobros_persona ON cobros(persona_id);
CREATE INDEX IF NOT EXISTS idx_cobros_fecha ON cobros(fecha);
CREATE INDEX IF NOT EXISTS idx_cobros_tipo ON cobros(tipo);
CREATE INDEX IF NOT EXISTS idx_cobros_estado ON cobros(estado);
CREATE INDEX IF NOT EXISTS idx_cobros_metodo ON cobros(metodo_pago);
CREATE INDEX IF NOT EXISTS idx_cobros_registro ON cobros(registro_id);
CREATE INDEX IF NOT EXISTS idx_cobros_turno ON cobros(turno_id);

-- ==================================================
-- 🎯 TRIGGERS PARA UPDATED_AT
-- ==================================================

-- Trigger para turnos
DROP TRIGGER IF EXISTS turnos_updated_at ON turnos;
CREATE TRIGGER turnos_updated_at
  BEFORE UPDATE ON turnos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger para cobros
DROP TRIGGER IF EXISTS cobros_updated_at ON cobros;
CREATE TRIGGER cobros_updated_at
  BEFORE UPDATE ON cobros
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ==================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Habilitar RLS
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (ajustar en producción)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON turnos;
CREATE POLICY "Allow all operations for authenticated users" ON turnos
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON cobros;
CREATE POLICY "Allow all operations for authenticated users" ON cobros
  FOR ALL USING (true);

-- ==================================================
-- 📊 DATOS DE EJEMPLO (OPCIONAL)
-- ==================================================

-- Insertar turnos de ejemplo
INSERT INTO turnos (persona_id, fecha, hora_inicio, hora_fin, tipo_turno, estado, puesto, ubicacion) 
SELECT 
  id,
  CURRENT_DATE,
  '09:00'::TIME,
  '17:00'::TIME,
  'completo',
  'programado',
  'Instructor de Surf',
  'Playa Principal'
FROM personas 
WHERE tipo = 'instructor'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO turnos (persona_id, fecha, hora_inicio, hora_fin, tipo_turno, estado, puesto, ubicacion) 
SELECT 
  id,
  CURRENT_DATE,
  '08:00'::TIME,
  '14:00'::TIME,
  'mañana',
  'programado',
  'Guía Turístico',
  'Centro de Visitantes'
FROM personas 
WHERE tipo = 'guia'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insertar cobros de ejemplo
INSERT INTO cobros (persona_id, fecha, monto, moneda, tipo, metodo_pago, estado, concepto, descripcion) 
SELECT 
  id,
  CURRENT_DATE,
  50000.00,
  'CLP',
  'cobro',
  'efectivo',
  'pagado',
  'Clase de Surf',
  'Clase individual de 2 horas'
FROM personas 
WHERE tipo = 'visitante'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO cobros (persona_id, fecha, monto, moneda, tipo, metodo_pago, estado, concepto, descripcion) 
SELECT 
  id,
  CURRENT_DATE,
  150000.00,
  'CLP',
  'pago',
  'transferencia',
  'pagado',
  'Salario Mensual',
  'Pago mensual instructor'
FROM personas 
WHERE tipo = 'instructor'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ==================================================
-- ✅ VERIFICACIÓN
-- ==================================================

-- Verificar que las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('turnos', 'cobros');

-- Contar registros en las nuevas tablas
SELECT 
  (SELECT COUNT(*) FROM turnos) as total_turnos,
  (SELECT COUNT(*) FROM cobros) as total_cobros;

-- Ver estructura de tabla turnos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'turnos'
ORDER BY ordinal_position;

-- Ver estructura de tabla cobros
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'cobros'
ORDER BY ordinal_position;
