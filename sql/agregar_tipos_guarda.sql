-- 🌊 PUNTA DE LOBOS - Agregar tipos de Guarda Parque y Guarda Baño
-- Script SQL para actualizar tipos de persona
-- Ejecutar en: Supabase Dashboard -> SQL Editor

-- ==================================================
-- 📋 ACTUALIZAR CONSTRAINT DE TIPOS EN PERSONAS
-- ==================================================

-- Eliminar constraint antiguo
ALTER TABLE personas 
DROP CONSTRAINT IF EXISTS personas_tipo_check;

-- Agregar nuevo constraint con los tipos de guarda
ALTER TABLE personas 
ADD CONSTRAINT personas_tipo_check 
CHECK (tipo IN ('visitante', 'guia', 'staff', 'instructor', 'guarda_parque', 'guarda_bano', 'otro'));

-- ==================================================
-- 🧹 OPCIONAL: Eliminar columnas parque y bano si existen
-- ==================================================
-- Descomenta estas líneas si ya ejecutaste el script anterior y quieres eliminar las columnas

-- ALTER TABLE personas DROP COLUMN IF EXISTS parque;
-- ALTER TABLE personas DROP COLUMN IF EXISTS bano;
-- DROP INDEX IF EXISTS idx_personas_parque;
-- DROP INDEX IF EXISTS idx_personas_bano;

-- ==================================================
-- ✅ VERIFICACIÓN
-- ==================================================

-- Ver constraint actualizado
SELECT
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'personas' 
  AND tc.constraint_type = 'CHECK';

-- Ver estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'personas'
ORDER BY ordinal_position;
