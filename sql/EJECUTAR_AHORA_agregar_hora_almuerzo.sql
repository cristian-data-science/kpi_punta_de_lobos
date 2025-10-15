-- ⚠️ EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- Para agregar la columna hora_almuerzo a la tabla turnos

-- Paso 1: Agregar columna
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS hora_almuerzo TIME;

-- Paso 2: Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'turnos' 
AND column_name = 'hora_almuerzo';

-- Deberías ver:
-- column_name     | data_type | is_nullable
-- hora_almuerzo   | time      | YES

-- Paso 3: (Opcional) Actualizar turnos existentes con hora de almuerzo por defecto
-- UPDATE turnos SET hora_almuerzo = '13:00:00' WHERE hora_almuerzo IS NULL;
