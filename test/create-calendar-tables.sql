-- TransApp Calendar and Tariff Tables
-- Migración de localStorage a Supabase

-- Tabla de configuración de tarifas por turno
CREATE TABLE shift_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_name VARCHAR(50) NOT NULL UNIQUE, -- 'firstSecondShift', 'thirdShiftWeekday', etc.
  rate_value INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de feriados
CREATE TABLE holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  holiday_date DATE NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para optimización
CREATE INDEX idx_shift_rates_name ON shift_rates(rate_name);
CREATE INDEX idx_holidays_date ON holidays(holiday_date);

-- Row Level Security (RLS)
ALTER TABLE shift_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (todos pueden leer y escribir - auth básica de la app)
CREATE POLICY "Allow all operations on shift_rates" ON shift_rates
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on holidays" ON holidays
    FOR ALL USING (true) WITH CHECK (true);

-- Insertar datos por defecto para las tarifas
INSERT INTO shift_rates (rate_name, rate_value, description) VALUES
  ('firstSecondShift', 20000, 'Primeros y segundos turnos (Lun-Sáb)'),
  ('thirdShiftWeekday', 22500, 'Tercer turno (Lun-Vie)'),
  ('thirdShiftSaturday', 27500, 'Tercer turno sábado'),
  ('holiday', 27500, 'Festivos (cualquier turno)'),
  ('sunday', 35000, 'Domingo (todos los turnos)');

-- Insertar feriados chilenos por defecto para 2025
INSERT INTO holidays (holiday_date, description) VALUES
  ('2025-01-01', 'Año Nuevo'),
  ('2025-04-18', 'Viernes Santo'),
  ('2025-04-19', 'Sábado Santo'),
  ('2025-05-01', 'Día del Trabajador'),
  ('2025-05-21', 'Día de las Glorias Navales'),
  ('2025-09-18', 'Fiestas Patrias'),
  ('2025-09-19', 'Día del Ejército'),
  ('2025-12-25', 'Navidad');

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shift_rates_updated_at BEFORE UPDATE ON shift_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
