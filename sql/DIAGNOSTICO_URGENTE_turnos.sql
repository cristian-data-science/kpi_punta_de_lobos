-- 🔍 DIAGNÓSTICO URGENTE: ¿Por qué no hay turnos?
-- Ejecutar en SQL Editor de Supabase

-- 1. Ver TODOS los turnos (sin filtros)
SELECT 
  COUNT(*) as total_turnos
FROM turnos;

-- 2. Ver turnos con fecha_asignacion en octubre 2025 (SIN filtro de estado)
SELECT 
  COUNT(*) as turnos_octubre,
  COUNT(*) FILTER (WHERE estado = 'asignado') as asignados,
  COUNT(*) FILTER (WHERE estado = 'disponible') as disponibles,
  COUNT(*) FILTER (WHERE estado IS NULL) as sin_estado,
  COUNT(*) FILTER (WHERE persona_id IS NOT NULL) as con_persona,
  COUNT(*) FILTER (WHERE persona_id IS NULL) as sin_persona
FROM turnos
WHERE fecha_asignacion >= '2025-10-01' 
  AND fecha_asignacion <= '2025-10-31';

-- 3. Ver ejemplos de turnos de octubre (primeros 10)
SELECT 
  id,
  fecha_asignacion,
  dia_semana,
  hora_inicio,
  hora_fin,
  estado,
  persona_id,
  codigo_turno,
  mes_asignacion,
  anio_asignacion
FROM turnos
WHERE fecha_asignacion >= '2025-10-01' 
  AND fecha_asignacion <= '2025-10-31'
ORDER BY fecha_asignacion, hora_inicio
LIMIT 10;

-- 4. Ver todos los estados posibles que existen
SELECT 
  estado,
  COUNT(*) as cantidad
FROM turnos
GROUP BY estado
ORDER BY cantidad DESC;

-- 5. Ver distribución de turnos por mes (todos los meses)
SELECT 
  DATE_TRUNC('month', fecha_asignacion) as mes,
  COUNT(*) as cantidad,
  COUNT(*) FILTER (WHERE estado = 'asignado') as asignados,
  COUNT(*) FILTER (WHERE persona_id IS NOT NULL) as con_persona
FROM turnos
WHERE fecha_asignacion IS NOT NULL
GROUP BY DATE_TRUNC('month', fecha_asignacion)
ORDER BY mes DESC
LIMIT 12;

-- 6. Ver si hay turnos con formato de estado diferente
SELECT 
  DISTINCT estado,
  LENGTH(estado) as longitud,
  estado = 'asignado' as es_asignado_exacto
FROM turnos
WHERE estado IS NOT NULL;

-- 7. Buscar turnos que DEBERÍAN aparecer
-- (fecha octubre + persona no null, cualquier estado)
SELECT 
  COUNT(*) as candidatos,
  array_agg(DISTINCT estado) as estados_encontrados
FROM turnos
WHERE fecha_asignacion >= '2025-10-01' 
  AND fecha_asignacion <= '2025-10-31'
  AND persona_id IS NOT NULL;

-- 8. Ver un ejemplo completo de turno con JOIN a persona
SELECT 
  t.*,
  p.nombre,
  p.rut,
  p.tipo,
  p.tarifa_hora
FROM turnos t
LEFT JOIN personas p ON t.persona_id = p.id
WHERE t.fecha_asignacion >= '2025-10-01' 
  AND t.fecha_asignacion <= '2025-10-31'
LIMIT 5;
