-- =====================================================
-- Script de Migración: Sueldo Proporcional Automático
-- =====================================================
-- Agrega campo sueldo_proporcional con cálculo automático
-- Resetea valores a 0 para contratos eventuales
-- =====================================================

-- PASO 1: Agregar campo sueldo_proporcional
-- =====================================================
ALTER TABLE trabajadores 
ADD COLUMN IF NOT EXISTS sueldo_proporcional INTEGER DEFAULT 0 NOT NULL;

-- Comentario del campo
COMMENT ON COLUMN trabajadores.sueldo_proporcional IS 
'Sueldo proporcional calculado automáticamente: ROUND(sueldo_base * (dias_trabajados / 30)) - valor entero';

-- PASO 2: Función para calcular sueldo proporcional
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

-- PASO 3: Crear trigger BEFORE INSERT OR UPDATE
-- =====================================================
DROP TRIGGER IF EXISTS trigger_calcular_sueldo_proporcional ON trabajadores;

CREATE TRIGGER trigger_calcular_sueldo_proporcional
BEFORE INSERT OR UPDATE OF sueldo_base, dias_trabajados, contrato
ON trabajadores
FOR EACH ROW
EXECUTE FUNCTION calcular_sueldo_proporcional();

-- PASO 4: Actualizar registros existentes
-- =====================================================
-- Resetear eventuales a 0
UPDATE trabajadores
SET 
  sueldo_base = 0,
  dias_trabajados = 0,
  sueldo_proporcional = 0
WHERE contrato = 'eventual';

-- Calcular proporcional para contratos planta y fijo
UPDATE trabajadores
SET sueldo_proporcional = ROUND((sueldo_base::NUMERIC * dias_trabajados::NUMERIC) / 30.0)::INTEGER
WHERE contrato IN ('planta', 'fijo');

-- PASO 5: Crear índice para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_trabajadores_sueldo_proporcional 
ON trabajadores(sueldo_proporcional);

-- PASO 6: Verificación
-- =====================================================
-- Ver estructura actualizada
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trabajadores'
AND column_name IN ('sueldo_base', 'dias_trabajados', 'sueldo_proporcional', 'contrato')
ORDER BY ordinal_position;

-- Ver triggers activos
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'trabajadores'
AND trigger_name = 'trigger_calcular_sueldo_proporcional';

-- Estadísticas por tipo de contrato
SELECT 
  contrato,
  COUNT(*) as cantidad,
  ROUND(AVG(sueldo_base), 2) as sueldo_base_promedio,
  ROUND(AVG(dias_trabajados), 2) as dias_promedio,
  ROUND(AVG(sueldo_proporcional), 2) as sueldo_proporcional_promedio
FROM trabajadores
GROUP BY contrato
ORDER BY contrato;

-- Ver algunos trabajadores de cada tipo
SELECT 
  nombre,
  rut,
  contrato,
  sueldo_base,
  dias_trabajados,
  sueldo_proporcional
FROM trabajadores
ORDER BY contrato, nombre
LIMIT 10;

-- =====================================================
-- PRUEBAS DEL TRIGGER
-- =====================================================

-- Prueba 1: Cambiar contrato de planta a eventual
-- (debería poner todo en 0 automáticamente)
-- EJEMPLO: UPDATE trabajadores SET contrato = 'eventual' WHERE rut = '12345678-9';

-- Prueba 2: Cambiar días trabajados
-- (debería recalcular sueldo_proporcional automáticamente)
-- EJEMPLO: UPDATE trabajadores SET dias_trabajados = 15 WHERE rut = '12345678-9';

-- Prueba 3: Cambiar sueldo base
-- (debería recalcular sueldo_proporcional automáticamente)
-- EJEMPLO: UPDATE trabajadores SET sueldo_base = 700000 WHERE rut = '12345678-9';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
-- ✅ Migración completada exitosamente
-- 
-- CARACTERÍSTICAS IMPLEMENTADAS:
-- 1. Campo sueldo_proporcional agregado
-- 2. Trigger automático para cálculo en INSERT/UPDATE
-- 3. Reseteo automático a 0 para contratos eventuales
-- 4. Cálculo automático para contratos planta
-- 5. Índice para búsquedas optimizadas
-- =====================================================
