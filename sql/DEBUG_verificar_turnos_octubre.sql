-- 🔍 DEBUG: Verificar turnos para octubre 2025
-- Ejecutar en SQL Editor de Supabase para verificar datos

-- 1. Ver estructura de turnos_v2
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'turnos_v2'
ORDER BY ordinal_position;

-- 2. Contar turnos totales
SELECT 
  COUNT(*) as total_turnos,
  COUNT(DISTINCT persona_id) as personas_distintas,
  COUNT(*) FILTER (WHERE estado = 'asignado') as turnos_asignados,
  COUNT(*) FILTER (WHERE persona_id IS NOT NULL) as turnos_con_persona
FROM turnos_v2;

-- 3. Ver turnos de octubre 2025
SELECT 
  id,
  fecha_asignacion,
  mes_asignacion,
  anio_asignacion,
  dia_semana,
  hora_inicio,
  hora_fin,
  estado,
  persona_id,
  codigo_turno
FROM turnos_v2
WHERE mes_asignacion = 10 
  AND anio_asignacion = 2025
  AND estado = 'asignado'
  AND persona_id IS NOT NULL
ORDER BY fecha_asignacion, hora_inicio
LIMIT 20;

-- 4. Ver distribución por mes/año
SELECT 
  mes_asignacion,
  anio_asignacion,
  estado,
  COUNT(*) as cantidad,
  COUNT(DISTINCT persona_id) as personas
FROM turnos_v2
GROUP BY mes_asignacion, anio_asignacion, estado
ORDER BY anio_asignacion DESC, mes_asignacion DESC;

-- 5. Verificar personas con tarifa_hora
SELECT 
  id,
  nombre,
  rut,
  tipo,
  tarifa_hora
FROM personas
WHERE id IN (
  SELECT DISTINCT persona_id 
  FROM turnos_v2 
  WHERE mes_asignacion = 10 
    AND anio_asignacion = 2025
    AND persona_id IS NOT NULL
);

-- 6. Ver si hay turnos SIN mes_asignacion o anio_asignacion
SELECT 
  COUNT(*) as turnos_sin_mes_anio,
  MIN(fecha_asignacion) as fecha_min,
  MAX(fecha_asignacion) as fecha_max
FROM turnos_v2
WHERE mes_asignacion IS NULL 
   OR anio_asignacion IS NULL;

-- 7. Si hay turnos con fecha pero sin mes/año, mostrar algunos ejemplos
SELECT 
  id,
  fecha_asignacion,
  mes_asignacion,
  anio_asignacion,
  estado,
  persona_id
FROM turnos_v2
WHERE (mes_asignacion IS NULL OR anio_asignacion IS NULL)
  AND fecha_asignacion IS NOT NULL
LIMIT 10;
