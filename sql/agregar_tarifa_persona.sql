-- 🌊 PUNTA DE LOBOS - Agregar Tarifa por Hora a Personas
-- Script para modificar sistema de pagos: tarifa por hora según persona
-- Ejecutar en: Supabase Dashboard -> SQL Editor

-- ==================================================
-- 📊 AGREGAR CAMPO TARIFA_HORA A TABLA PERSONAS
-- ==================================================

-- Agregar columna tarifa_hora (valor por hora en CLP)
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS tarifa_hora DECIMAL(10, 2) DEFAULT 5000;

-- Comentario descriptivo
COMMENT ON COLUMN personas.tarifa_hora IS 'Tarifa por hora en CLP que cobra esta persona por trabajar un turno';


-- ==================================================
-- 📊 FUNCIÓN AUXILIAR: CALCULAR HORAS DE UN TURNO
-- ==================================================

-- Crear función para calcular horas entre hora_inicio y hora_fin
CREATE OR REPLACE FUNCTION calcular_horas_turno(
  p_hora_inicio TIME,
  p_hora_fin TIME
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
  horas DECIMAL(10, 2);
BEGIN
  -- Calcular diferencia en horas (puede incluir decimales)
  horas := EXTRACT(EPOCH FROM (p_hora_fin - p_hora_inicio)) / 3600.0;
  
  -- Redondear a 2 decimales
  RETURN ROUND(horas, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comentario
COMMENT ON FUNCTION calcular_horas_turno IS 'Calcula las horas trabajadas entre hora_inicio y hora_fin de un turno';

-- ==================================================
-- 🔍 VISTA AUXILIAR: TURNOS CON CÁLCULO AUTOMÁTICO
-- ==================================================

-- Crear vista que muestra turnos con monto calculado automáticamente
CREATE OR REPLACE VIEW vista_turnos_v2_con_pago AS
SELECT 
  t.*,
  p.nombre as persona_nombre,
  p.rut as persona_rut,
  p.tipo as persona_tipo,
  p.tarifa_hora as persona_tarifa_hora,
  calcular_horas_turno(t.hora_inicio, t.hora_fin) as horas_trabajadas,
  CASE 
    WHEN p.tarifa_hora IS NOT NULL THEN 
      ROUND(calcular_horas_turno(t.hora_inicio, t.hora_fin) * p.tarifa_hora, 0)
    ELSE 0
  END as monto_calculado
FROM turnos_v2 t
LEFT JOIN personas p ON t.persona_id = p.id;

-- Comentario
COMMENT ON VIEW vista_turnos_v2_con_pago IS 'Vista con cálculo automático del monto según tarifa_hora de la persona';

-- ==================================================
-- ✅ VERIFICACIÓN
-- ==================================================

-- Ver personas con sus tarifas
SELECT 
  id,
  nombre,
  rut,
  tipo,
  tarifa_hora,
  estado
FROM personas
ORDER BY tarifa_hora DESC;

-- Probar función de cálculo de horas
SELECT 
  'Test 1: 9:00-18:00' as test,
  calcular_horas_turno('09:00'::TIME, '18:00'::TIME) as horas,
  '9 horas esperadas' as resultado;

SELECT 
  'Test 2: 10:00-19:00' as test,
  calcular_horas_turno('10:00'::TIME, '19:00'::TIME) as horas,
  '9 horas esperadas' as resultado;

SELECT 
  'Test 3: 12:00-21:00' as test,
  calcular_horas_turno('12:00'::TIME, '21:00'::TIME) as horas,
  '9 horas esperadas' as resultado;

-- Ver ejemplo de cálculo completo
SELECT 
  persona_nombre,
  codigo_turno,
  dia_semana,
  hora_inicio,
  hora_fin,
  horas_trabajadas,
  persona_tarifa_hora,
  monto_calculado
FROM vista_turnos_v2_con_pago
WHERE persona_id IS NOT NULL
LIMIT 10;

-- ==================================================
-- 📊 CONSULTA DE RESUMEN MENSUAL POR PERSONA
-- ==================================================

-- Función para obtener estadísticas de un mes
CREATE OR REPLACE FUNCTION obtener_estadisticas_mes(
  p_mes INTEGER,
  p_anio INTEGER
) RETURNS TABLE (
  persona_id UUID,
  persona_nombre TEXT,
  persona_rut TEXT,
  tarifa_hora DECIMAL(10,2),
  total_turnos BIGINT,
  total_horas DECIMAL(10,2),
  monto_total DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as persona_id,
    p.nombre as persona_nombre,
    p.rut as persona_rut,
    p.tarifa_hora,
    COUNT(t.id) as total_turnos,
    SUM(calcular_horas_turno(t.hora_inicio, t.hora_fin)) as total_horas,
    SUM(calcular_horas_turno(t.hora_inicio, t.hora_fin) * p.tarifa_hora) as monto_total
  FROM personas p
  INNER JOIN turnos_v2 t ON t.persona_id = p.id
  WHERE t.mes_asignacion = p_mes
    AND t.anio_asignacion = p_anio
    AND t.estado IN ('asignado', 'completado')
  GROUP BY p.id, p.nombre, p.rut, p.tarifa_hora
  ORDER BY monto_total DESC;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION obtener_estadisticas_mes IS 'Obtiene estadísticas de turnos y pagos por persona para un mes específico';

-- Ejemplo de uso de la función
-- SELECT * FROM obtener_estadisticas_mes(11, 2025);

SELECT '✅ Sistema de tarifa por hora implementado exitosamente!' as mensaje;
