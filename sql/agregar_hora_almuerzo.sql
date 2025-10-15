-- Migración: Agregar campo hora_almuerzo a tabla turnos
-- Fecha: 14 de octubre de 2025
-- Descripción: Permite registrar la hora de almuerzo para dibujar un bloque separador en el calendario

-- Agregar columna hora_almuerzo como TIME (opcional)
ALTER TABLE turnos 
ADD COLUMN IF NOT EXISTS hora_almuerzo TIME;

-- Comentario para documentación
COMMENT ON COLUMN turnos.hora_almuerzo IS 'Hora de inicio del almuerzo (opcional). Se dibuja como bloque blanco separador en el calendario.';

-- Ejemplo de uso:
-- UPDATE turnos SET hora_almuerzo = '13:00:00' WHERE id = 123;
