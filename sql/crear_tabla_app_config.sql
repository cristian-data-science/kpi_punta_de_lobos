-- ============================================
-- Tabla de Configuración de la Aplicación
-- ============================================
-- Esta tabla almacena configuraciones dinámicas de la aplicación,
-- incluyendo la contraseña de administrador que puede ser cambiada
-- desde la interfaz de usuario sin necesidad de redeployment.

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS app_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por clave
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(config_key);

-- Insertar contraseña inicial (la actual de las variables de entorno)
INSERT INTO app_config (config_key, config_value, description)
VALUES (
  'admin_password', 
  'transapp123',
  'Contraseña de administrador del sistema'
)
ON CONFLICT (config_key) 
DO NOTHING;

-- Insertar usuario inicial
INSERT INTO app_config (config_key, config_value, description)
VALUES (
  'admin_username', 
  'admin',
  'Usuario administrador del sistema'
)
ON CONFLICT (config_key) 
DO NOTHING;

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_app_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp en cada modificación
DROP TRIGGER IF EXISTS trigger_update_app_config_timestamp ON app_config;
CREATE TRIGGER trigger_update_app_config_timestamp
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_app_config_timestamp();

-- Verificar que los datos se insertaron correctamente
SELECT * FROM app_config WHERE config_key IN ('admin_password', 'admin_username');

-- Comentarios para documentación
COMMENT ON TABLE app_config IS 'Configuraciones dinámicas de la aplicación que pueden modificarse sin redeployment';
COMMENT ON COLUMN app_config.config_key IS 'Clave única de configuración';
COMMENT ON COLUMN app_config.config_value IS 'Valor de la configuración';
COMMENT ON COLUMN app_config.description IS 'Descripción del propósito de la configuración';
