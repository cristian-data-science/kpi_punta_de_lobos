-- 🔧 FIX URGENTE - Corregir constraint de tipos en personas
-- Ejecutar AHORA en: Supabase Dashboard -> SQL Editor

-- ==================================================
-- 🔧 CORREGIR CONSTRAINT DE TIPOS
-- ==================================================

-- Paso 1: Eliminar constraint antiguo
ALTER TABLE personas 
DROP CONSTRAINT IF EXISTS personas_tipo_check;

-- Paso 2: Agregar constraint correcto con guiones bajos
-- IMPORTANTE: Usar guiones bajos (_) no espacios
ALTER TABLE personas 
ADD CONSTRAINT personas_tipo_check 
CHECK (tipo IN (
  'visitante', 
  'guia', 
  'staff', 
  'instructor', 
  'guarda_parque',   -- ✅ Con guion bajo
  'baño',            -- ✅ Solo baño
  'otro'
));

-- ==================================================
-- ✅ VERIFICACIÓN
-- ==================================================

-- Ver el constraint aplicado
SELECT
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'personas' 
  AND tc.constraint_type = 'CHECK'
  AND tc.constraint_name = 'personas_tipo_check';

-- ==================================================
-- 🧪 PRUEBA
-- ==================================================

-- Probar que funciona (esto debería ejecutarse sin error)
-- Descomentar para probar:

-- INSERT INTO personas (nombre, tipo) 
-- VALUES ('Prueba Guarda Parque', 'guarda_parque');

-- INSERT INTO personas (nombre, tipo) 
-- VALUES ('Prueba Baño', 'baño');

-- SELECT * FROM personas WHERE tipo IN ('guarda_parque', 'baño');

-- -- Limpiar pruebas
-- DELETE FROM personas WHERE nombre LIKE 'Prueba %';
