-- =====================================================
-- Script de Migración: Campos de Nómina para Trabajadores
-- Fecha: 2025-10-01
-- Descripción: Agrega campos sueldo_base, dias_trabajados 
--              y actualiza estados para incluir licencia/vacaciones
-- =====================================================

-- 1. Agregar campo sueldo_base (monto en pesos chilenos)
ALTER TABLE trabajadores 
ADD COLUMN IF NOT EXISTS sueldo_base NUMERIC(12, 2) DEFAULT 0 NOT NULL;

-- 2. Agregar campo dias_trabajados (días del mes, default 30)
ALTER TABLE trabajadores 
ADD COLUMN IF NOT EXISTS dias_trabajados INTEGER DEFAULT 30 NOT NULL;

-- 3. Eliminar la restricción CHECK existente del campo estado
ALTER TABLE trabajadores 
DROP CONSTRAINT IF EXISTS trabajadores_estado_check;

-- 4. Agregar nueva restricción CHECK para el campo estado
-- Ahora incluye: activo, inactivo, licencia, vacaciones
ALTER TABLE trabajadores 
ADD CONSTRAINT trabajadores_estado_check 
CHECK (estado IN ('activo', 'inactivo', 'licencia', 'vacaciones'));

-- 5. Modificar restricción CHECK del campo contrato
-- Ahora solo permite: planta, eventual (se elimina 'fijo')
ALTER TABLE trabajadores 
DROP CONSTRAINT IF EXISTS trabajadores_contrato_check;

ALTER TABLE trabajadores 
ADD CONSTRAINT trabajadores_contrato_check 
CHECK (contrato IN ('planta', 'eventual'));

-- 6. Actualizar trabajadores existentes con contrato 'fijo' a 'planta'
-- (migración de datos legacy)
UPDATE trabajadores 
SET contrato = 'planta' 
WHERE contrato = 'fijo';

-- 7. Agregar índices para mejorar rendimiento en queries
CREATE INDEX IF NOT EXISTS idx_trabajadores_estado 
ON trabajadores(estado);

CREATE INDEX IF NOT EXISTS idx_trabajadores_contrato 
ON trabajadores(contrato);

-- 8. Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN trabajadores.sueldo_base IS 
'Sueldo base mensual del trabajador en pesos chilenos (CLP)';

COMMENT ON COLUMN trabajadores.dias_trabajados IS 
'Días trabajados en el mes actual (usado para prorrateo). Default: 30 días';

COMMENT ON COLUMN trabajadores.estado IS 
'Estado del trabajador: activo (disponible), inactivo (no disponible), licencia (con licencia médica), vacaciones (de vacaciones)';

COMMENT ON COLUMN trabajadores.contrato IS 
'Tipo de contrato: planta (contrato indefinido) o eventual (contrato temporal)';

-- 9. Validar cambios
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trabajadores'
AND column_name IN ('sueldo_base', 'dias_trabajados', 'estado', 'contrato')
ORDER BY ordinal_position;

-- 10. Mostrar estadísticas de trabajadores después de la migración
SELECT 
  contrato,
  estado,
  COUNT(*) as cantidad,
  AVG(sueldo_base) as sueldo_promedio,
  AVG(dias_trabajados) as dias_promedio
FROM trabajadores
GROUP BY contrato, estado
ORDER BY contrato, estado;

-- =====================================================
-- Notas de Implementación:
-- 
-- Cálculo del pago base:
--   base_pagado = sueldo_base × (dias_trabajados / 30)
--
-- Reglas de negocio:
-- - Estado 'licencia': usa dias_trabajados para prorrateo
-- - Estado 'vacaciones': paga base completo (30/30)
-- - Estados 'licencia' y 'vacaciones': NO asignables a turnos
-- - Tipo 'planta': contrato indefinido
-- - Tipo 'eventual': contrato temporal
-- =====================================================
