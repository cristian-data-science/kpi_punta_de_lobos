-- ============================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- ============================================
-- Dashboard > SQL Editor > New Query > Pegar este código > Run

-- Paso 1: Crear la tabla app_config
CREATE TABLE IF NOT EXISTS app_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paso 2: Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(config_key);

-- Paso 3: Insertar contraseña inicial
INSERT INTO app_config (config_key, config_value, description)
VALUES (
  'admin_password', 
  'transapp123',
  'Contraseña de administrador del sistema'
)
ON CONFLICT (config_key) 
DO NOTHING;

-- Paso 4: Insertar usuario inicial
INSERT INTO app_config (config_key, config_value, description)
VALUES (
  'admin_username', 
  'admin',
  'Usuario administrador del sistema'
)
ON CONFLICT (config_key) 
DO NOTHING;

-- Paso 5: Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_app_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 6: Crear trigger
DROP TRIGGER IF EXISTS trigger_update_app_config_timestamp ON app_config;
CREATE TRIGGER trigger_update_app_config_timestamp
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_app_config_timestamp();

-- Paso 7: Verificar que todo se creó correctamente
SELECT 
  config_key, 
  config_value, 
  description, 
  created_at, 
  updated_at 
FROM app_config 
WHERE config_key IN ('admin_password', 'admin_username')
ORDER BY config_key;

-- ✅ Si ves 2 filas (admin_password y admin_username), el setup fue exitoso!
