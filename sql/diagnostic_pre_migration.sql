-- =====================================================
-- Script de Diagnóstico PREVIO a Migración
-- Ejecuta ESTE script PRIMERO para identificar problemas
-- =====================================================

-- 1. Verificar valores actuales de contrato
SELECT 
  contrato,
  COUNT(*) as cantidad
FROM trabajadores
GROUP BY contrato
ORDER BY cantidad DESC;

-- 2. Identificar trabajadores con contratos que necesitan migración
SELECT 
  id,
  nombre,
  rut,
  contrato,
  estado
FROM trabajadores
WHERE contrato NOT IN ('planta', 'eventual')
ORDER BY contrato;

-- 3. Verificar valores actuales de estado
SELECT 
  estado,
  COUNT(*) as cantidad
FROM trabajadores
GROUP BY estado
ORDER BY cantidad DESC;

-- 4. Identificar trabajadores con estados que podrían causar problemas
SELECT 
  id,
  nombre,
  rut,
  contrato,
  estado
FROM trabajadores
WHERE estado NOT IN ('activo', 'inactivo', 'licencia', 'vacaciones')
ORDER BY estado;

-- 5. Ver estructura actual de la tabla
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trabajadores'
ORDER BY ordinal_position;

-- 6. Verificar constraints actuales
SELECT
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name,
  kcu.column_name,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'trabajadores'
ORDER BY tc.constraint_type, tc.constraint_name;
