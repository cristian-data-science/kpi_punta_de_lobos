-- =====================================================
-- Script COMPLETO: Migración de Trabajadores + Sueldo Proporcional Automático
-- =====================================================
-- Este script incluye:
-- 1. Campos: sueldo_base, dias_trabajados, sueldo_proporcional
-- 2. Migración de 'fijo' a 'planta'
-- 3. Nuevos constraints (estado, contrato)
-- 4. Trigger automático para calcular sueldo proporcional
-- 5. Índices de performance
-- =====================================================

-- PASO 1: Agregar nuevos campos
-- =====================================================
ALTER TABLE trabajadores 
ADD COLUMN IF NOT EXISTS sueldo_base INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE trabajadores 
ADD COLUMN IF NOT EXISTS dias_trabajados INTEGER DEFAULT 30 NOT NULL;

ALTER TABLE trabajadores 
ADD COLUMN IF NOT EXISTS sueldo_proporcional INTEGER DEFAULT 0 NOT NULL;

-- Verificar campos agregados
SELECT column_name, data_type, column_default 
FROM information_schema.columns
WHERE table_name = 'trabajadores' 
AND column_name IN ('sueldo_base', 'dias_trabajados', 'sueldo_proporcional');

-- PASO 2: Verificar contratos existentes (mantener 'fijo' sin cambios)
-- =====================================================
-- Ver distribución de contratos actuales
SELECT contrato, COUNT(*) as cantidad 
FROM trabajadores 
GROUP BY contrato;

-- Nota: No se migra 'fijo' a 'planta', ambos son válidos
-- 'fijo' y 'planta' funcionan igual, solo cambia la etiqueta

-- PASO 3: Eliminar constraints antiguos (si existen)
-- =====================================================
ALTER TABLE trabajadores 
DROP CONSTRAINT IF EXISTS trabajadores_estado_check;

ALTER TABLE trabajadores 
DROP CONSTRAINT IF EXISTS trabajadores_contrato_check;

-- PASO 4: Agregar nuevos constraints
-- =====================================================
-- Estado con nuevas opciones
ALTER TABLE trabajadores 
ADD CONSTRAINT trabajadores_estado_check 
CHECK (estado IN ('activo', 'inactivo', 'licencia', 'vacaciones'));

-- Contrato con 3 opciones: fijo, planta, eventual
ALTER TABLE trabajadores 
ADD CONSTRAINT trabajadores_contrato_check 
CHECK (contrato IN ('fijo', 'planta', 'eventual'));

-- Verificar constraints
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE 'trabajadores_%_check';

-- PASO 5: Crear función para cálculo automático de sueldo proporcional
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_sueldo_proporcional()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es contrato eventual, resetear valores a 0
  IF NEW.contrato = 'eventual' THEN
    NEW.sueldo_base := 0;
    NEW.dias_trabajados := 0;
    NEW.sueldo_proporcional := 0;
  ELSE
    -- Si es planta o fijo, calcular sueldo proporcional
    NEW.sueldo_proporcional := ROUND((NEW.sueldo_base::NUMERIC * NEW.dias_trabajados::NUMERIC) / 30.0)::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 6: Crear trigger BEFORE INSERT OR UPDATE
-- =====================================================
DROP TRIGGER IF EXISTS trigger_calcular_sueldo_proporcional ON trabajadores;

CREATE TRIGGER trigger_calcular_sueldo_proporcional
BEFORE INSERT OR UPDATE OF sueldo_base, dias_trabajados, contrato
ON trabajadores
FOR EACH ROW
EXECUTE FUNCTION calcular_sueldo_proporcional();

-- Verificar trigger creado
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'trabajadores'
AND trigger_name = 'trigger_calcular_sueldo_proporcional';

-- PASO 7: Actualizar registros existentes
-- =====================================================
-- Calcular proporcional para contratos planta y fijo
UPDATE trabajadores
SET sueldo_proporcional = ROUND((sueldo_base::NUMERIC * dias_trabajados::NUMERIC) / 30.0)::INTEGER
WHERE contrato IN ('planta', 'fijo');

-- Resetear eventuales a 0
UPDATE trabajadores
SET sueldo_base = 0, dias_trabajados = 0, sueldo_proporcional = 0
WHERE contrato = 'eventual';

-- PASO 8: Agregar índices para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_trabajadores_estado 
ON trabajadores(estado);

CREATE INDEX IF NOT EXISTS idx_trabajadores_contrato 
ON trabajadores(contrato);

CREATE INDEX IF NOT EXISTS idx_trabajadores_sueldo_proporcional 
ON trabajadores(sueldo_proporcional);

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'trabajadores'
AND indexname LIKE 'idx_trabajadores_%';

-- PASO 9: Agregar documentación (comentarios)
-- =====================================================
COMMENT ON COLUMN trabajadores.sueldo_base IS 
'Sueldo base mensual del trabajador en pesos chilenos (CLP) - valor entero sin decimales';

COMMENT ON COLUMN trabajadores.dias_trabajados IS 
'Días trabajados en el mes actual (usado para prorrateo). Default: 30 días - valor entero';

COMMENT ON COLUMN trabajadores.sueldo_proporcional IS 
'Sueldo proporcional calculado automáticamente: ROUND(sueldo_base * (dias_trabajados / 30)) - valor entero. Se calcula mediante trigger.';

COMMENT ON COLUMN trabajadores.estado IS 
'Estado del trabajador: activo (disponible), inactivo (no disponible), licencia (con licencia médica), vacaciones (de vacaciones)';

COMMENT ON COLUMN trabajadores.contrato IS 
'Tipo de contrato: fijo (trabajador de confianza), planta (contrato indefinido), eventual (contrato temporal). Fijo y planta tienen el mismo comportamiento, solo cambian en etiqueta.';

-- PASO 10: Verificación final
-- =====================================================
-- Ver estructura completa de la tabla
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trabajadores'
ORDER BY ordinal_position;

-- Estadísticas de trabajadores por contrato y estado
SELECT 
  contrato,
  estado,
  COUNT(*) as cantidad,
  ROUND(AVG(sueldo_base), 2) as sueldo_base_promedio,
  ROUND(AVG(dias_trabajados), 2) as dias_promedio,
  ROUND(AVG(sueldo_proporcional), 2) as sueldo_proporcional_promedio
FROM trabajadores
GROUP BY contrato, estado
ORDER BY contrato, estado;

-- Ver primeros 10 trabajadores con todos los campos
SELECT 
  id,
  nombre,
  rut,
  contrato,
  estado,
  sueldo_base,
  dias_trabajados,
  sueldo_proporcional,
  created_at
FROM trabajadores
ORDER BY created_at DESC
LIMIT 10;

-- Verificar función y trigger
SELECT 
  p.proname as nombre_funcion,
  pg_get_functiondef(p.oid) as definicion
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'calcular_sueldo_proporcional';

-- =====================================================
-- FIN DE MIGRACIÓN COMPLETA
-- =====================================================
-- ✅ Si llegaste aquí sin errores, la migración fue exitosa
-- 
-- RESUMEN DE CAMBIOS:
-- ✅ 3 campos nuevos: sueldo_base, dias_trabajados, sueldo_proporcional
-- ✅ Migración de 'fijo' a 'planta' completada
-- ✅ Constraints actualizados: estado (4 opciones), contrato (planta/eventual)
-- ✅ Trigger automático para calcular sueldo proporcional
-- ✅ Índices de performance agregados
-- ✅ Documentación de columnas agregada
-- 
-- COMPORTAMIENTO AUTOMÁTICO:
-- - Contratos 'planta' o 'fijo': sueldo_proporcional = ROUND(base × días/30)
-- - Contratos 'eventual': todo en 0 automáticamente
-- =====================================================
