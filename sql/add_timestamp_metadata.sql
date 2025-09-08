-- Agregar metadatos de fecha a las tablas trabajadores y turnos
-- created_at y updated_at para auditoría de registros

-- ================================================================
-- TABLA: trabajadores
-- ================================================================

-- Verificar si las columnas ya existen antes de agregarlas
DO $$ 
BEGIN
    -- Agregar created_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trabajadores' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE trabajadores 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        
        RAISE NOTICE 'Columna created_at agregada a trabajadores';
    ELSE
        RAISE NOTICE 'Columna created_at ya existe en trabajadores';
    END IF;

    -- Agregar updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trabajadores' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE trabajadores 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        
        RAISE NOTICE 'Columna updated_at agregada a trabajadores';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe en trabajadores';
    END IF;
END $$;

-- ================================================================
-- TABLA: turnos
-- ================================================================

DO $$ 
BEGIN
    -- Agregar created_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'turnos' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE turnos 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        
        RAISE NOTICE 'Columna created_at agregada a turnos';
    ELSE
        RAISE NOTICE 'Columna created_at ya existe en turnos';
    END IF;

    -- Agregar updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'turnos' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE turnos 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        
        RAISE NOTICE 'Columna updated_at agregada a turnos';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe en turnos';
    END IF;
END $$;

-- ================================================================
-- TRIGGERS PARA AUTO-UPDATE del updated_at
-- ================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para trabajadores
DROP TRIGGER IF EXISTS update_trabajadores_updated_at ON trabajadores;
CREATE TRIGGER update_trabajadores_updated_at
    BEFORE UPDATE ON trabajadores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para turnos
DROP TRIGGER IF EXISTS update_turnos_updated_at ON turnos;
CREATE TRIGGER update_turnos_updated_at
    BEFORE UPDATE ON turnos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- COMENTARIOS EN LAS COLUMNAS
-- ================================================================

COMMENT ON COLUMN trabajadores.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN trabajadores.updated_at IS 'Fecha y hora de última actualización del registro';

COMMENT ON COLUMN turnos.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN turnos.updated_at IS 'Fecha y hora de última actualización del registro';

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================

-- Mostrar estructura actualizada de trabajadores
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    col_description(c.oid, ordinal_position) as description
FROM information_schema.columns isc
LEFT JOIN pg_class c ON c.relname = table_name
WHERE table_name = 'trabajadores' 
ORDER BY ordinal_position;

-- Mostrar estructura actualizada de turnos  
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    col_description(c.oid, ordinal_position) as description
FROM information_schema.columns isc
LEFT JOIN pg_class c ON c.relname = table_name
WHERE table_name = 'turnos' 
ORDER BY ordinal_position;
