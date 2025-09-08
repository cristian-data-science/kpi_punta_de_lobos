-- ================================================================
-- INSTRUCCIONES PARA COMPLETAR METADATOS DE FECHA
-- ================================================================
-- 
-- ESTADO ACTUAL:
-- ✅ trabajadores: created_at + updated_at (COMPLETO)
-- ⚠️ turnos: created_at (EXISTE) + updated_at (FALTA)
--
-- ACCIÓN REQUERIDA: Solo agregar updated_at a turnos
-- ================================================================

-- 1. AGREGAR COLUMNA updated_at a la tabla turnos
ALTER TABLE turnos 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- 2. CREAR FUNCIÓN PARA AUTO-UPDATE (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. CREAR TRIGGER PARA TURNOS (auto-actualizar updated_at)
DROP TRIGGER IF EXISTS update_turnos_updated_at ON turnos;
CREATE TRIGGER update_turnos_updated_at
    BEFORE UPDATE ON turnos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. VERIFICAR TRIGGER PARA TRABAJADORES (debería existir)
DROP TRIGGER IF EXISTS update_trabajadores_updated_at ON trabajadores;
CREATE TRIGGER update_trabajadores_updated_at
    BEFORE UPDATE ON trabajadores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. AGREGAR COMENTARIOS DESCRIPTIVOS
COMMENT ON COLUMN turnos.updated_at IS 'Fecha y hora de última actualización del registro';
COMMENT ON COLUMN trabajadores.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN trabajadores.updated_at IS 'Fecha y hora de última actualización del registro';

-- ================================================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- ================================================================

-- Verificar estructura de turnos
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'turnos' 
    AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

-- Verificar triggers activos
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    table_name
FROM information_schema.triggers 
WHERE table_name IN ('trabajadores', 'turnos')
    AND trigger_name LIKE '%updated_at%';
