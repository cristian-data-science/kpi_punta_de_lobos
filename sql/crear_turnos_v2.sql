-- 🌊 PUNTA DE LOBOS - Sistema de Programación de Turnos V2
-- Script SQL para crear tabla turnos_v2 y plantillas de turnos
-- Ejecutar en: Supabase Dashboard -> SQL Editor

-- ==================================================
-- 📅 TABLA TURNOS_V2 (Plantillas de turnos asignables)
-- ==================================================

CREATE TABLE IF NOT EXISTS turnos_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Información de la plantilla de turno
  codigo_turno TEXT NOT NULL, -- GP1, GP2, GP3, GP4, Voluntario
  temporada TEXT NOT NULL CHECK (temporada IN ('baja', 'alta')),
  horario TEXT NOT NULL CHECK (horario IN ('invierno', 'verano')),
  semana_ciclo INTEGER NOT NULL CHECK (semana_ciclo BETWEEN 1 AND 4),
  dia_semana TEXT NOT NULL CHECK (dia_semana IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')),
  
  -- Horarios del turno
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  hora_almuerzo TIME, -- Opcional
  
  -- Asignación (null = sin asignar)
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  fecha_asignacion DATE, -- Fecha específica cuando se asignó para un mes
  mes_asignacion INTEGER, -- Mes para el cual se asignó (1-12)
  anio_asignacion INTEGER, -- Año para el cual se asignó
  
  -- Estado y control
  estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'asignado', 'completado', 'cancelado')),
  es_activo BOOLEAN DEFAULT true, -- Para desactivar turnos sin eliminarlos
  
  -- Información adicional
  ubicacion TEXT DEFAULT 'Punta de Lobos',
  puesto TEXT,
  notas TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice único para evitar duplicados de plantilla
  UNIQUE(codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin)
);

-- ==================================================
-- 📊 TABLA CONFIGURACION_PAGOS (Tarifas por turno)
-- ==================================================

CREATE TABLE IF NOT EXISTS configuracion_pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tarifas base
  tarifa_dia_semana DECIMAL(10, 2) DEFAULT 30000, -- Lunes a Viernes
  tarifa_sabado DECIMAL(10, 2) DEFAULT 40000, -- Sábados
  tarifa_domingo DECIMAL(10, 2) DEFAULT 50000, -- Domingos
  tarifa_festivo DECIMAL(10, 2) DEFAULT 50000, -- Días festivos
  
  -- Multiplicadores por tipo de guardia
  multiplicador_gp1 DECIMAL(5, 2) DEFAULT 1.0,
  multiplicador_gp2 DECIMAL(5, 2) DEFAULT 1.0,
  multiplicador_gp3 DECIMAL(5, 2) DEFAULT 1.0,
  multiplicador_gp4 DECIMAL(5, 2) DEFAULT 1.0,
  multiplicador_voluntario DECIMAL(5, 2) DEFAULT 0.5, -- Voluntarios cobran menos
  
  -- Control de versión
  vigente_desde DATE DEFAULT CURRENT_DATE,
  vigente_hasta DATE,
  es_actual BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 🚀 ÍNDICES PARA OPTIMIZACIÓN
-- ==================================================

-- Índices turnos_v2
CREATE INDEX IF NOT EXISTS idx_turnos_v2_codigo ON turnos_v2(codigo_turno);
CREATE INDEX IF NOT EXISTS idx_turnos_v2_temporada ON turnos_v2(temporada);
CREATE INDEX IF NOT EXISTS idx_turnos_v2_horario ON turnos_v2(horario);
CREATE INDEX IF NOT EXISTS idx_turnos_v2_persona ON turnos_v2(persona_id);
CREATE INDEX IF NOT EXISTS idx_turnos_v2_estado ON turnos_v2(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_v2_fecha_asignacion ON turnos_v2(fecha_asignacion);
CREATE INDEX IF NOT EXISTS idx_turnos_v2_mes_anio ON turnos_v2(mes_asignacion, anio_asignacion);
CREATE INDEX IF NOT EXISTS idx_turnos_v2_dia_semana ON turnos_v2(dia_semana);
CREATE INDEX IF NOT EXISTS idx_turnos_v2_es_activo ON turnos_v2(es_activo);

-- ==================================================
-- ⚡ TRIGGERS PARA UPDATED_AT
-- ==================================================

-- Trigger para turnos_v2
DROP TRIGGER IF EXISTS turnos_v2_updated_at ON turnos_v2;
CREATE TRIGGER turnos_v2_updated_at
  BEFORE UPDATE ON turnos_v2
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Trigger para configuracion_pagos
DROP TRIGGER IF EXISTS configuracion_pagos_updated_at ON configuracion_pagos;
CREATE TRIGGER configuracion_pagos_updated_at
  BEFORE UPDATE ON configuracion_pagos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ==================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Habilitar RLS
ALTER TABLE turnos_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_pagos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (ajustar en producción)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON turnos_v2;
CREATE POLICY "Allow all operations for authenticated users" ON turnos_v2
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON configuracion_pagos;
CREATE POLICY "Allow all operations for authenticated users" ON configuracion_pagos
  FOR ALL USING (true);

-- ==================================================
-- 📊 INSERTAR CONFIGURACIÓN INICIAL DE PAGOS
-- ==================================================

INSERT INTO configuracion_pagos (
  tarifa_dia_semana,
  tarifa_sabado,
  tarifa_domingo,
  tarifa_festivo,
  multiplicador_gp1,
  multiplicador_gp2,
  multiplicador_gp3,
  multiplicador_gp4,
  multiplicador_voluntario,
  vigente_desde,
  es_actual
) VALUES (
  30000.00, -- Lun-Vie
  40000.00, -- Sábado
  50000.00, -- Domingo
  50000.00, -- Festivos
  1.0, -- GP1
  1.0, -- GP2
  1.0, -- GP3
  1.0, -- GP4
  0.5, -- Voluntario
  CURRENT_DATE,
  true
) ON CONFLICT DO NOTHING;

-- ==================================================
-- 🎯 INSERTAR PLANTILLAS DE TURNOS
-- ==================================================

-- ========== TEMPORADA BAJA - HORARIO INVIERNO ==========

-- GP1 - Semana 1: Martes a Domingo de 9 a 18 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP1', 'baja', 'invierno', 1, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 1, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 1, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 1, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 1, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 1, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 1')
ON CONFLICT DO NOTHING;

-- GP1 - Semana 2: Martes a Viernes de 9 a 18 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP1', 'baja', 'invierno', 2, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 2, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 2, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 2, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1')
ON CONFLICT DO NOTHING;

-- GP1 - Semana 3: Martes a Domingo de 9 a 18 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP1', 'baja', 'invierno', 3, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 3, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 3, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 3, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 3, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 3, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 1')
ON CONFLICT DO NOTHING;

-- GP1 - Semana 4: Martes a Viernes de 9 a 18 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP1', 'baja', 'invierno', 4, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 4, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 4, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'invierno', 4, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1')
ON CONFLICT DO NOTHING;

-- GP2 - Semana 1: Jueves a Domingo de 10 a 19 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP2', 'baja', 'invierno', 1, 'jueves', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 1, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 1, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 1, 'domingo', '10:00', '19:00', '14:00', 'Guarda Parques 2')
ON CONFLICT DO NOTHING;

-- GP2 - Semana 2: Jueves a Sábado de 10 a 19 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP2', 'baja', 'invierno', 2, 'jueves', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 2, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 2, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 2')
ON CONFLICT DO NOTHING;

-- GP2 - Semana 3: Jueves a Domingo de 10 a 19 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP2', 'baja', 'invierno', 3, 'jueves', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 3, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 3, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 3, 'domingo', '10:00', '19:00', '14:00', 'Guarda Parques 2')
ON CONFLICT DO NOTHING;

-- GP2 - Semana 4: Jueves a Sábado de 10 a 19 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP2', 'baja', 'invierno', 4, 'jueves', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 4, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'baja', 'invierno', 4, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 2')
ON CONFLICT DO NOTHING;

-- GP3 - Semana 1: Lunes de 9 a 18 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP3', 'baja', 'invierno', 1, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3')
ON CONFLICT DO NOTHING;

-- GP3 - Semana 2: Lunes, Sábado y Domingo de 9 a 18 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP3', 'baja', 'invierno', 2, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'invierno', 2, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'invierno', 2, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 3')
ON CONFLICT DO NOTHING;

-- GP3 - Semana 3: Lunes de 9 a 18 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP3', 'baja', 'invierno', 3, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3')
ON CONFLICT DO NOTHING;

-- GP3 - Semana 4: Lunes, Sábado y Domingo de 9 a 18 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP3', 'baja', 'invierno', 4, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'invierno', 4, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'invierno', 4, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 3')
ON CONFLICT DO NOTHING;

-- GP4 - Semana 2 y 4: Sábado de 10 a 19 hrs
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP4', 'baja', 'invierno', 2, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
('GP4', 'baja', 'invierno', 4, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 4')
ON CONFLICT DO NOTHING;

-- ==================================================
-- ✅ VERIFICACIÓN
-- ==================================================

-- Contar plantillas creadas por escenario
SELECT 
  codigo_turno,
  temporada,
  horario,
  COUNT(*) as total_turnos
FROM turnos_v2
GROUP BY codigo_turno, temporada, horario
ORDER BY temporada, horario, codigo_turno;

-- Ver resumen por semana y guardia
SELECT 
  codigo_turno,
  temporada,
  horario,
  semana_ciclo,
  COUNT(*) as dias_trabajados
FROM turnos_v2
GROUP BY codigo_turno, temporada, horario, semana_ciclo
ORDER BY temporada, horario, codigo_turno, semana_ciclo;

SELECT 'Plantillas de turnos creadas exitosamente! 🎉' as mensaje;
