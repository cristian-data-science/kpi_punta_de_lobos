-- 🌊 PUNTA DE LOBOS - Agregar campos parque y baño a tabla personas
-- Script SQL para agregar campos faltantes
-- Ejecutar en: Supabase Dashboard -> SQL Editor

-- ==================================================
-- 📋 AGREGAR CAMPOS A TABLA PERSONAS
-- ==================================================

-- Agregar campo parque (booleano)
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS parque BOOLEAN DEFAULT false;

-- Agregar campo baño (booleano)
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS bano BOOLEAN DEFAULT false;

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_personas_parque ON personas(parque);
CREATE INDEX IF NOT EXISTS idx_personas_bano ON personas(bano);

-- ==================================================
-- ✅ VERIFICACIÓN
-- ==================================================

-- Verificar que las columnas fueron agregadas
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'personas' 
AND column_name IN ('parque', 'bano');

-- Ver estructura completa de la tabla personas
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'personas'
ORDER BY ordinal_position;
