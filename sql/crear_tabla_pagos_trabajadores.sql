-- 💰 PUNTA DE LOBOS - Sistema de Tracking de Pagos a Trabajadores
-- Script SQL para crear tabla pagos_trabajadores
-- Ejecutar en: Supabase Dashboard -> SQL Editor

-- ==================================================
-- 📊 TABLA PAGOS_TRABAJADORES (Tracking de pagos)
-- ==================================================

CREATE TABLE IF NOT EXISTS pagos_trabajadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relación con persona
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Periodo del pago
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER NOT NULL CHECK (anio >= 2024),
  semana_inicio DATE, -- Opcional: para pagos semanales
  semana_fin DATE,     -- Opcional: para pagos semanales
  
  -- Montos calculados automáticamente desde turnos
  numero_turnos INTEGER DEFAULT 0,
  horas_trabajadas DECIMAL(10, 2) DEFAULT 0,
  monto_calculado DECIMAL(10, 2) DEFAULT 0, -- Calculado desde turnos
  
  -- Montos reales del pago
  monto_pagado DECIMAL(10, 2) DEFAULT 0,
  diferencia DECIMAL(10, 2) DEFAULT 0, -- monto_pagado - monto_calculado
  
  -- Estado del pago
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente',        -- No pagado aún
    'parcial',          -- Pagado parcialmente
    'pagado',          -- Pagado completamente
    'revisión',        -- Requiere revisión
    'cancelado'        -- Cancelado/anulado
  )),
  
  -- Información del pago realizado
  fecha_pago DATE,
  metodo_pago TEXT CHECK (metodo_pago IN (
    'efectivo',
    'transferencia',
    'cheque',
    'deposito',
    'otro'
  )),
  referencia_pago TEXT, -- Número de transferencia, cheque, etc.
  
  -- Información adicional
  notas TEXT,
  observaciones TEXT,
  
  -- Control de quien registró el pago
  registrado_por TEXT, -- Nombre o ID del usuario que registró
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice único para evitar duplicados de periodo
  UNIQUE(persona_id, mes, anio, semana_inicio)
);

-- ==================================================
-- 🚀 ÍNDICES PARA OPTIMIZACIÓN
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_pagos_trabajadores_persona ON pagos_trabajadores(persona_id);
CREATE INDEX IF NOT EXISTS idx_pagos_trabajadores_estado ON pagos_trabajadores(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_trabajadores_mes_anio ON pagos_trabajadores(mes, anio);
CREATE INDEX IF NOT EXISTS idx_pagos_trabajadores_fecha_pago ON pagos_trabajadores(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_trabajadores_periodo ON pagos_trabajadores(semana_inicio, semana_fin);

-- ==================================================
-- ⚡ TRIGGER PARA UPDATED_AT
-- ==================================================

DROP TRIGGER IF EXISTS pagos_trabajadores_updated_at ON pagos_trabajadores;

CREATE OR REPLACE FUNCTION update_pagos_trabajadores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pagos_trabajadores_updated_at
  BEFORE UPDATE ON pagos_trabajadores
  FOR EACH ROW
  EXECUTE FUNCTION update_pagos_trabajadores_timestamp();

-- ==================================================
-- ⚡ TRIGGER PARA CALCULAR DIFERENCIA AUTOMÁTICAMENTE
-- ==================================================

DROP TRIGGER IF EXISTS pagos_trabajadores_calcular_diferencia ON pagos_trabajadores;

CREATE OR REPLACE FUNCTION calcular_diferencia_pago()
RETURNS TRIGGER AS $$
BEGIN
  NEW.diferencia = NEW.monto_pagado - NEW.monto_calculado;
  
  -- Actualizar estado automáticamente según el monto pagado
  IF NEW.monto_pagado >= NEW.monto_calculado AND NEW.monto_calculado > 0 THEN
    NEW.estado = 'pagado';
  ELSIF NEW.monto_pagado > 0 AND NEW.monto_pagado < NEW.monto_calculado THEN
    NEW.estado = 'parcial';
  ELSIF NEW.monto_pagado = 0 THEN
    NEW.estado = 'pendiente';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pagos_trabajadores_calcular_diferencia
  BEFORE INSERT OR UPDATE ON pagos_trabajadores
  FOR EACH ROW
  EXECUTE FUNCTION calcular_diferencia_pago();

-- ==================================================
-- 📝 VISTA PARA RESUMEN DE PAGOS
-- ==================================================

CREATE OR REPLACE VIEW resumen_pagos_trabajadores AS
SELECT 
  p.id,
  p.nombre,
  p.rut,
  p.tipo,
  pt.mes,
  pt.anio,
  pt.numero_turnos,
  pt.horas_trabajadas,
  pt.monto_calculado,
  pt.monto_pagado,
  pt.diferencia,
  pt.estado,
  pt.fecha_pago,
  pt.metodo_pago,
  pt.created_at,
  pt.updated_at
FROM pagos_trabajadores pt
INNER JOIN personas p ON pt.persona_id = p.id
ORDER BY pt.anio DESC, pt.mes DESC, p.nombre ASC;

-- ==================================================
-- 📝 VISTA PARA ESTADÍSTICAS DE PAGOS
-- ==================================================

CREATE OR REPLACE VIEW estadisticas_pagos AS
SELECT 
  mes,
  anio,
  COUNT(DISTINCT persona_id) as total_personas,
  SUM(numero_turnos) as total_turnos,
  SUM(horas_trabajadas) as total_horas,
  SUM(monto_calculado) as total_calculado,
  SUM(monto_pagado) as total_pagado,
  SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as pagos_completados,
  SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pagos_pendientes,
  SUM(CASE WHEN estado = 'parcial' THEN 1 ELSE 0 END) as pagos_parciales
FROM pagos_trabajadores
GROUP BY mes, anio
ORDER BY anio DESC, mes DESC;

-- ==================================================
-- ✅ DATOS DE EJEMPLO (OPCIONAL - COMENTAR SI NO SE NECESITA)
-- ==================================================

-- Descomentar para insertar datos de ejemplo
/*
INSERT INTO pagos_trabajadores (
  persona_id, 
  mes, 
  anio, 
  numero_turnos, 
  horas_trabajadas, 
  monto_calculado,
  estado
) 
SELECT 
  id,
  EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  0,
  0,
  0,
  'pendiente'
FROM personas
WHERE estado = 'activo'
ON CONFLICT (persona_id, mes, anio, semana_inicio) DO NOTHING;
*/

-- ==================================================
-- 📊 CONSULTAS ÚTILES PARA DEBUGGING
-- ==================================================

-- Ver resumen de pagos del mes actual
-- SELECT * FROM resumen_pagos_trabajadores 
-- WHERE mes = EXTRACT(MONTH FROM CURRENT_DATE) 
-- AND anio = EXTRACT(YEAR FROM CURRENT_DATE);

-- Ver estadísticas de pagos
-- SELECT * FROM estadisticas_pagos;

-- Ver todos los pagos pendientes
-- SELECT * FROM resumen_pagos_trabajadores WHERE estado = 'pendiente';

-- Ver total a pagar este mes
-- SELECT SUM(monto_calculado - monto_pagado) as total_pendiente
-- FROM pagos_trabajadores 
-- WHERE estado IN ('pendiente', 'parcial')
-- AND mes = EXTRACT(MONTH FROM CURRENT_DATE) 
-- AND anio = EXTRACT(YEAR FROM CURRENT_DATE);
