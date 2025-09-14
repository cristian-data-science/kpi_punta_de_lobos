-- Verificar y agregar campo cobro_tarifa a la tabla shift_rates

-- 1. Verificar si el campo existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'shift_rates' 
AND column_name = 'cobro_tarifa';

-- 2. Si no existe, agregarlo (ejecutar solo si el query anterior no retorna nada)
ALTER TABLE shift_rates 
ADD COLUMN cobro_tarifa INTEGER DEFAULT 25000;

-- 3. Establecer un valor inicial para la tarifa de cobro
UPDATE shift_rates 
SET cobro_tarifa = 25000 
WHERE cobro_tarifa IS NULL;

-- 4. Verificar la estructura actualizada
SELECT * FROM shift_rates LIMIT 1;
