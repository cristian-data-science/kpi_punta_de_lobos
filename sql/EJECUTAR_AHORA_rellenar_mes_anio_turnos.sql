-- 🔧 EJECUTAR AHORA: Actualizar mes_asignacion y anio_asignacion en turnos existentes
-- Este script rellena los campos mes_asignacion y anio_asignacion basándose en fecha_asignacion

-- 1. Primero, verificar cuántos turnos necesitan actualización
SELECT 
  COUNT(*) as turnos_sin_mes_anio,
  COUNT(*) FILTER (WHERE fecha_asignacion IS NOT NULL) as con_fecha,
  COUNT(*) FILTER (WHERE fecha_asignacion IS NULL) as sin_fecha
FROM turnos_v2
WHERE mes_asignacion IS NULL OR anio_asignacion IS NULL;

-- 2. Actualizar todos los turnos que tienen fecha_asignacion pero no mes/anio
UPDATE turnos_v2
SET 
  mes_asignacion = EXTRACT(MONTH FROM fecha_asignacion),
  anio_asignacion = EXTRACT(YEAR FROM fecha_asignacion)
WHERE fecha_asignacion IS NOT NULL
  AND (mes_asignacion IS NULL OR anio_asignacion IS NULL);

-- 3. Verificar la actualización
SELECT 
  anio_asignacion,
  mes_asignacion,
  COUNT(*) as cantidad_turnos,
  COUNT(DISTINCT persona_id) as personas_distintas,
  MIN(fecha_asignacion) as fecha_minima,
  MAX(fecha_asignacion) as fecha_maxima
FROM turnos_v2
WHERE mes_asignacion IS NOT NULL 
  AND anio_asignacion IS NOT NULL
GROUP BY anio_asignacion, mes_asignacion
ORDER BY anio_asignacion DESC, mes_asignacion DESC;

-- 4. Verificar turnos de octubre 2025 específicamente
SELECT 
  COUNT(*) as turnos_octubre_2025,
  COUNT(DISTINCT persona_id) as personas_distintas,
  COUNT(*) FILTER (WHERE estado = 'asignado') as asignados,
  COUNT(*) FILTER (WHERE estado = 'disponible') as disponibles
FROM turnos_v2
WHERE mes_asignacion = 10 
  AND anio_asignacion = 2025;

-- 5. Ver algunos ejemplos de turnos de octubre 2025
SELECT 
  t.id,
  t.fecha_asignacion,
  t.dia_semana,
  t.hora_inicio,
  t.hora_fin,
  t.estado,
  t.codigo_turno,
  p.nombre as persona_nombre,
  p.tarifa_hora
FROM turnos_v2 t
LEFT JOIN personas p ON t.persona_id = p.id
WHERE t.mes_asignacion = 10 
  AND t.anio_asignacion = 2025
  AND t.estado = 'asignado'
  AND t.persona_id IS NOT NULL
ORDER BY t.fecha_asignacion, t.hora_inicio
LIMIT 10;

-- 6. Crear trigger para automatizar esto en el futuro (opcional pero recomendado)
CREATE OR REPLACE FUNCTION actualizar_mes_anio_turno()
RETURNS TRIGGER AS $$
BEGIN
  -- Si fecha_asignacion cambia y no es NULL, actualizar mes y año
  IF NEW.fecha_asignacion IS NOT NULL THEN
    NEW.mes_asignacion := EXTRACT(MONTH FROM NEW.fecha_asignacion);
    NEW.anio_asignacion := EXTRACT(YEAR FROM NEW.fecha_asignacion);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger si no existe
DROP TRIGGER IF EXISTS trigger_actualizar_mes_anio ON turnos_v2;
CREATE TRIGGER trigger_actualizar_mes_anio
  BEFORE INSERT OR UPDATE OF fecha_asignacion
  ON turnos_v2
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_mes_anio_turno();

-- 7. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Actualización completada. Los turnos ahora tienen mes_asignacion y anio_asignacion.';
  RAISE NOTICE '✅ Trigger creado para mantener sincronizados automáticamente.';
END $$;
