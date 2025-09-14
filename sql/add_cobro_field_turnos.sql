-- Verificar y agregar campo cobro a la tabla turnos

-- 1. Verificar si el campo existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'turnos' 
AND column_name = 'cobro';

-- 2. Si no existe, agregarlo (ejecutar solo si el query anterior no retorna nada)
ALTER TABLE turnos 
ADD COLUMN cobro INTEGER;

-- 3. Verificar la estructura actualizada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'turnos' 
ORDER BY ordinal_position;
