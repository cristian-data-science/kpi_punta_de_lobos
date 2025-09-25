-- =====================================================
-- QUERIES SQL PARA VALIDAR DASHBOARD TRANSAPP
-- =====================================================

-- 1. QUERY PARA VALIDAR DATOS FINANCIEROS DEL DASHBOARD
-- Replica exactamente lo que hace loadFinancialData() en el Dashboard

-- 1A. TOTAL GENERAL (TODO) - TODOS LOS TURNOS COMPLETADOS
SELECT 
  COUNT(*) as total_turnos,
  SUM(COALESCE(cobro, 0)) as total_ingresos,
  SUM(COALESCE(pago, 0)) as total_costos,
  SUM(COALESCE(cobro, 0)) - SUM(COALESCE(pago, 0)) as margen,
  CASE 
    WHEN SUM(COALESCE(cobro, 0)) > 0 
    THEN ROUND(((SUM(COALESCE(cobro, 0)) - SUM(COALESCE(pago, 0))) * 100.0 / SUM(COALESCE(cobro, 0))), 2)
    ELSE 0 
  END as margen_porcentaje
FROM turnos 
WHERE estado = 'completado';

-- 1B. MES ACTUAL - Solo turnos del mes calendario actual
SELECT 
  COUNT(*) as total_turnos,
  SUM(COALESCE(cobro, 0)) as total_ingresos,
  SUM(COALESCE(pago, 0)) as total_costos,
  SUM(COALESCE(cobro, 0)) - SUM(COALESCE(pago, 0)) as margen,
  CASE 
    WHEN SUM(COALESCE(cobro, 0)) > 0 
    THEN ROUND(((SUM(COALESCE(cobro, 0)) - SUM(COALESCE(pago, 0))) * 100.0 / SUM(COALESCE(cobro, 0))), 2)
    ELSE 0 
  END as margen_porcentaje,
  MIN(fecha) as fecha_inicio,
  MAX(fecha) as fecha_fin
FROM turnos 
WHERE estado = 'completado'
  AND fecha >= DATE_TRUNC('month', CURRENT_DATE)
  AND fecha < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 1C. AÑO ACTUAL - Solo turnos del año calendario actual
SELECT 
  COUNT(*) as total_turnos,
  SUM(COALESCE(cobro, 0)) as total_ingresos,
  SUM(COALESCE(pago, 0)) as total_costos,
  SUM(COALESCE(cobro, 0)) - SUM(COALESCE(pago, 0)) as margen,
  CASE 
    WHEN SUM(COALESCE(cobro, 0)) > 0 
    THEN ROUND(((SUM(COALESCE(cobro, 0)) - SUM(COALESCE(pago, 0))) * 100.0 / SUM(COALESCE(cobro, 0))), 2)
    ELSE 0 
  END as margen_porcentaje,
  MIN(fecha) as fecha_inicio,
  MAX(fecha) as fecha_fin
FROM turnos 
WHERE estado = 'completado'
  AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE);

-- =====================================================
-- 2. QUERIES PARA VALIDAR GRÁFICOS DE ÚLTIMOS 6 MESES
-- =====================================================

-- 2A. DATOS MENSUALES ÚLTIMOS 6 MESES - FORMATO AGREGADO
WITH meses AS (
  SELECT 
    generate_series(
      DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
      DATE_TRUNC('month', CURRENT_DATE),
      INTERVAL '1 month'
    )::date as mes_inicio
),
datos_mensuales AS (
  SELECT 
    m.mes_inicio,
    TO_CHAR(m.mes_inicio, 'Mon YYYY') as mes_nombre,
    COALESCE(COUNT(t.id), 0) as total_turnos,
    COALESCE(SUM(t.cobro), 0) as total_ingresos,
    COALESCE(SUM(t.pago), 0) as total_costos,
    COALESCE(SUM(t.cobro), 0) - COALESCE(SUM(t.pago), 0) as margen
  FROM meses m
  LEFT JOIN turnos t ON t.fecha >= m.mes_inicio 
    AND t.fecha < m.mes_inicio + INTERVAL '1 month'
    AND t.estado = 'completado'
  GROUP BY m.mes_inicio
  ORDER BY m.mes_inicio
)
SELECT 
  mes_nombre,
  total_turnos,
  total_ingresos,
  total_costos,
  margen,
  CASE 
    WHEN total_ingresos > 0 
    THEN ROUND((margen * 100.0 / total_ingresos), 2)
    ELSE 0 
  END as margen_porcentaje
FROM datos_mensuales;

-- 2B. VALIDACIÓN MES POR MES - DETALLADO
-- Mes actual (septiembre 2025)
SELECT 
  'Mes Actual' as periodo,
  TO_CHAR(DATE_TRUNC('month', CURRENT_DATE), 'Mon YYYY') as mes,
  COUNT(*) as turnos,
  SUM(COALESCE(cobro, 0)) as ingresos,
  SUM(COALESCE(pago, 0)) as costos,
  MIN(fecha) as fecha_min,
  MAX(fecha) as fecha_max
FROM turnos 
WHERE estado = 'completado'
  AND fecha >= DATE_TRUNC('month', CURRENT_DATE)
  AND fecha < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'

UNION ALL

-- Mes anterior (agosto 2025)
SELECT 
  'Mes Anterior' as periodo,
  TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month', 'Mon YYYY') as mes,
  COUNT(*) as turnos,
  SUM(COALESCE(cobro, 0)) as ingresos,
  SUM(COALESCE(pago, 0)) as costos,
  MIN(fecha) as fecha_min,
  MAX(fecha) as fecha_max
FROM turnos 
WHERE estado = 'completado'
  AND fecha >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
  AND fecha < DATE_TRUNC('month', CURRENT_DATE)

UNION ALL

-- 2 meses atrás (julio 2025)
SELECT 
  '2 Meses Atrás' as periodo,
  TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months', 'Mon YYYY') as mes,
  COUNT(*) as turnos,
  SUM(COALESCE(cobro, 0)) as ingresos,
  SUM(COALESCE(pago, 0)) as costos,
  MIN(fecha) as fecha_min,
  MAX(fecha) as fecha_max
FROM turnos 
WHERE estado = 'completado'
  AND fecha >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months'
  AND fecha < DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month';

-- =====================================================
-- 3. QUERY DE VERIFICACIÓN DE DATOS GENERALES
-- =====================================================

-- 3A. RESUMEN GENERAL DE LA BASE DE DATOS
SELECT 
  'TRABAJADORES' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos,
  COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) as inactivos
FROM trabajadores

UNION ALL

SELECT 
  'TURNOS TOTAL' as tabla,
  COUNT(*) as total_registros,
  NULL as activos,
  NULL as inactivos
FROM turnos

UNION ALL

SELECT 
  'TURNOS COMPLETADOS' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN cobro > 0 THEN 1 END) as con_cobro,
  COUNT(CASE WHEN pago > 0 THEN 1 END) as con_pago
FROM turnos
WHERE estado = 'completado';

-- 3B. RANGO DE FECHAS EN LA BASE DE DATOS
SELECT 
  MIN(fecha) as fecha_minima,
  MAX(fecha) as fecha_maxima,
  COUNT(DISTINCT fecha) as dias_diferentes,
  COUNT(*) as total_turnos,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT fecha), 2) as promedio_turnos_por_dia
FROM turnos
WHERE estado = 'completado';

-- =====================================================
-- 4. QUERIES PARA DEBUGGING Y TROUBLESHOOTING
-- =====================================================

-- 4A. TOP 10 DÍAS CON MÁS INGRESOS
SELECT 
  fecha,
  COUNT(*) as turnos,
  SUM(COALESCE(cobro, 0)) as ingresos_dia,
  SUM(COALESCE(pago, 0)) as costos_dia,
  SUM(COALESCE(cobro, 0)) - SUM(COALESCE(pago, 0)) as margen_dia
FROM turnos 
WHERE estado = 'completado'
  AND cobro > 0
ORDER BY ingresos_dia DESC
LIMIT 10;

-- 4B. VERIFICACIÓN DE DATOS NULOS O INCONSISTENTES
SELECT 
  'Turnos sin cobro' as tipo_problema,
  COUNT(*) as cantidad
FROM turnos 
WHERE estado = 'completado' AND (cobro IS NULL OR cobro = 0)

UNION ALL

SELECT 
  'Turnos sin pago' as tipo_problema,
  COUNT(*) as cantidad
FROM turnos 
WHERE estado = 'completado' AND (pago IS NULL OR pago = 0)

UNION ALL

SELECT 
  'Turnos con cobro negativo' as tipo_problema,
  COUNT(*) as cantidad
FROM turnos 
WHERE estado = 'completado' AND cobro < 0

UNION ALL

SELECT 
  'Turnos con pago negativo' as tipo_problema,
  COUNT(*) as cantidad
FROM turnos 
WHERE estado = 'completado' AND pago < 0;

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Ejecuta las queries en el SQL Editor de Supabase
-- 2. Compara los resultados con los valores del Dashboard
-- 3. Los valores deben coincidir exactamente
-- 4. Si hay diferencias, revisa la lógica del Dashboard
-- 5. Usa las queries de debugging para identificar problemas