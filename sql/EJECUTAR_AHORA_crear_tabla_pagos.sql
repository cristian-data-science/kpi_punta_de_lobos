-- 💰 TABLA DE PAGOS - Sistema de Registro de Pagos a Trabajadores
-- Ejecutar en SQL Editor de Supabase

-- ==========================================
-- 1. CREAR TABLA PRINCIPAL DE PAGOS
-- ==========================================
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con persona
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Periodo del pago
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
  
  -- Montos
  monto_calculado DECIMAL(12,2) NOT NULL DEFAULT 0, -- Total según turnos
  monto_pagado DECIMAL(12,2) NOT NULL DEFAULT 0,    -- Lo que realmente se pagó
  diferencia DECIMAL(12,2) GENERATED ALWAYS AS (monto_calculado - monto_pagado) STORED,
  
  -- Datos del cálculo
  numero_turnos INTEGER NOT NULL DEFAULT 0,
  horas_trabajadas DECIMAL(8,2) NOT NULL DEFAULT 0,
  tarifa_hora DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Estado y fechas
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'parcial')),
  fecha_pago TIMESTAMPTZ,
  metodo_pago VARCHAR(50), -- efectivo, transferencia, cheque, etc.
  
  -- Notas y referencia
  notas TEXT,
  referencia_pago VARCHAR(100), -- número de transferencia, cheque, etc.
  
  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100),
  
  -- Constraint único: una persona solo puede tener un registro por mes/año
  CONSTRAINT unique_persona_mes_anio UNIQUE (persona_id, mes, anio)
);

-- ==========================================
-- 2. ÍNDICES PARA MEJOR RENDIMIENTO
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_pagos_persona ON pagos(persona_id);
CREATE INDEX IF NOT EXISTS idx_pagos_mes_anio ON pagos(mes, anio);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago ON pagos(fecha_pago);

-- ==========================================
-- 3. TRIGGER: ACTUALIZAR TIMESTAMP
-- ==========================================
CREATE OR REPLACE FUNCTION update_pagos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pagos_timestamp ON pagos;
CREATE TRIGGER trigger_update_pagos_timestamp
  BEFORE UPDATE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION update_pagos_timestamp();

-- ==========================================
-- 4. TRIGGER: ACTUALIZAR ESTADO AUTOMÁTICAMENTE
-- ==========================================
CREATE OR REPLACE FUNCTION actualizar_estado_pago()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el monto pagado es 0, estado = pendiente
  IF NEW.monto_pagado = 0 THEN
    NEW.estado := 'pendiente';
    NEW.fecha_pago := NULL;
  
  -- Si pagó todo, estado = pagado
  ELSIF NEW.monto_pagado >= NEW.monto_calculado THEN
    NEW.estado := 'pagado';
    IF NEW.fecha_pago IS NULL THEN
      NEW.fecha_pago := NOW();
    END IF;
  
  -- Si pagó algo pero no todo, estado = parcial
  ELSE
    NEW.estado := 'parcial';
    IF NEW.fecha_pago IS NULL THEN
      NEW.fecha_pago := NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_estado_pago ON pagos;
CREATE TRIGGER trigger_actualizar_estado_pago
  BEFORE INSERT OR UPDATE OF monto_pagado, monto_calculado ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estado_pago();

-- ==========================================
-- 5. VISTA: RESUMEN DE PAGOS CON DATOS DE PERSONA
-- ==========================================
CREATE OR REPLACE VIEW vista_pagos_completa AS
SELECT 
  p.id,
  p.persona_id,
  per.nombre,
  per.rut,
  per.tipo,
  p.mes,
  p.anio,
  p.monto_calculado,
  p.monto_pagado,
  p.diferencia,
  p.numero_turnos,
  p.horas_trabajadas,
  p.tarifa_hora,
  p.estado,
  p.fecha_pago,
  p.metodo_pago,
  p.notas,
  p.referencia_pago,
  p.created_at,
  p.updated_at
FROM pagos p
LEFT JOIN personas per ON p.persona_id = per.id
ORDER BY p.anio DESC, p.mes DESC, per.nombre;

-- ==========================================
-- 6. FUNCIÓN: REGISTRAR O ACTUALIZAR PAGO
-- ==========================================
CREATE OR REPLACE FUNCTION registrar_pago(
  p_persona_id UUID,
  p_mes INTEGER,
  p_anio INTEGER,
  p_monto_calculado DECIMAL,
  p_numero_turnos INTEGER,
  p_horas_trabajadas DECIMAL,
  p_tarifa_hora DECIMAL,
  p_monto_pagado DECIMAL DEFAULT 0,
  p_metodo_pago VARCHAR DEFAULT NULL,
  p_notas TEXT DEFAULT NULL,
  p_referencia_pago VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_pago_id UUID;
BEGIN
  -- Insertar o actualizar usando UPSERT
  INSERT INTO pagos (
    persona_id,
    mes,
    anio,
    monto_calculado,
    numero_turnos,
    horas_trabajadas,
    tarifa_hora,
    monto_pagado,
    metodo_pago,
    notas,
    referencia_pago
  ) VALUES (
    p_persona_id,
    p_mes,
    p_anio,
    p_monto_calculado,
    p_numero_turnos,
    p_horas_trabajadas,
    p_tarifa_hora,
    p_monto_pagado,
    p_metodo_pago,
    p_notas,
    p_referencia_pago
  )
  ON CONFLICT (persona_id, mes, anio) 
  DO UPDATE SET
    monto_calculado = EXCLUDED.monto_calculado,
    numero_turnos = EXCLUDED.numero_turnos,
    horas_trabajadas = EXCLUDED.horas_trabajadas,
    tarifa_hora = EXCLUDED.tarifa_hora,
    monto_pagado = COALESCE(EXCLUDED.monto_pagado, pagos.monto_pagado),
    metodo_pago = COALESCE(EXCLUDED.metodo_pago, pagos.metodo_pago),
    notas = COALESCE(EXCLUDED.notas, pagos.notas),
    referencia_pago = COALESCE(EXCLUDED.referencia_pago, pagos.referencia_pago)
  RETURNING id INTO v_pago_id;
  
  RETURN v_pago_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. FUNCIÓN: MARCAR COMO PAGADO
-- ==========================================
CREATE OR REPLACE FUNCTION marcar_como_pagado(
  p_pago_id UUID,
  p_monto_pagado DECIMAL,
  p_metodo_pago VARCHAR DEFAULT 'transferencia',
  p_referencia_pago VARCHAR DEFAULT NULL,
  p_notas TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pagos
  SET 
    monto_pagado = p_monto_pagado,
    metodo_pago = p_metodo_pago,
    referencia_pago = p_referencia_pago,
    notas = COALESCE(p_notas, notas),
    fecha_pago = NOW()
  WHERE id = p_pago_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 8. FUNCIÓN: DESMARCAR PAGO (VOLVER A PENDIENTE)
-- ==========================================
CREATE OR REPLACE FUNCTION desmarcar_pago(
  p_pago_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pagos
  SET 
    monto_pagado = 0,
    estado = 'pendiente',
    fecha_pago = NULL,
    metodo_pago = NULL,
    referencia_pago = NULL
  WHERE id = p_pago_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 9. FUNCIÓN: OBTENER RESUMEN DE PERIODO
-- ==========================================
CREATE OR REPLACE FUNCTION obtener_resumen_periodo(
  p_mes INTEGER,
  p_anio INTEGER
) RETURNS TABLE (
  total_calculado DECIMAL,
  total_pagado DECIMAL,
  total_pendiente DECIMAL,
  numero_personas BIGINT,
  personas_pagadas BIGINT,
  personas_pendientes BIGINT,
  personas_parciales BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(monto_calculado), 0)::DECIMAL as total_calculado,
    COALESCE(SUM(monto_pagado), 0)::DECIMAL as total_pagado,
    COALESCE(SUM(diferencia), 0)::DECIMAL as total_pendiente,
    COUNT(*)::BIGINT as numero_personas,
    COUNT(*) FILTER (WHERE estado = 'pagado')::BIGINT as personas_pagadas,
    COUNT(*) FILTER (WHERE estado = 'pendiente')::BIGINT as personas_pendientes,
    COUNT(*) FILTER (WHERE estado = 'parcial')::BIGINT as personas_parciales
  FROM pagos
  WHERE mes = p_mes AND anio = p_anio;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 10. HABILITAR ROW LEVEL SECURITY (OPCIONAL)
-- ==========================================
-- Descomentar si usas RLS
-- ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all for authenticated users" ON pagos
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- ==========================================
-- MENSAJE DE CONFIRMACIÓN
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tabla pagos creada correctamente';
  RAISE NOTICE '✅ Índices creados';
  RAISE NOTICE '✅ Triggers configurados';
  RAISE NOTICE '✅ Vista vista_pagos_completa creada';
  RAISE NOTICE '✅ Funciones de gestión creadas';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Funciones disponibles:';
  RAISE NOTICE '   - registrar_pago()';
  RAISE NOTICE '   - marcar_como_pagado()';
  RAISE NOTICE '   - desmarcar_pago()';
  RAISE NOTICE '   - obtener_resumen_periodo()';
END $$;
