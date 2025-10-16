-- 🌊 PUNTA DE LOBOS - Plantillas completas de turnos
-- Ejecutar DESPUÉS de crear_turnos_v2.sql
-- Este archivo contiene: Temporada Baja Verano, Temporada Alta Invierno, Temporada Alta Verano

-- ========== TEMPORADA BAJA - HORARIO VERANO ==========

-- GP1 - Semana 1, 2, 3, 4: Igual que invierno (9-18)
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
-- Semana 1
('GP1', 'baja', 'verano', 1, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 1, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 1, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 1, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 1, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 1, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
-- Semana 2
('GP1', 'baja', 'verano', 2, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 2, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 2, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 2, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
-- Semana 3
('GP1', 'baja', 'verano', 3, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 3, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 3, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 3, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 3, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 3, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
-- Semana 4
('GP1', 'baja', 'verano', 4, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 4, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 4, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'baja', 'verano', 4, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1')
ON CONFLICT DO NOTHING;

-- GP2 - Horario cambia a 11-20
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
-- Semana 1
('GP2', 'baja', 'verano', 1, 'jueves', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 1, 'viernes', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 1, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 1, 'domingo', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
-- Semana 2
('GP2', 'baja', 'verano', 2, 'jueves', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 2, 'viernes', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 2, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
-- Semana 3
('GP2', 'baja', 'verano', 3, 'jueves', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 3, 'viernes', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 3, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 3, 'domingo', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
-- Semana 4
('GP2', 'baja', 'verano', 4, 'jueves', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 4, 'viernes', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'baja', 'verano', 4, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 2')
ON CONFLICT DO NOTHING;

-- GP3 - Igual que invierno
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP3', 'baja', 'verano', 1, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'verano', 2, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'verano', 2, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'verano', 2, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'verano', 3, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'verano', 4, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'verano', 4, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'baja', 'verano', 4, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 3')
ON CONFLICT DO NOTHING;

-- GP4 - Horario cambia a 11-20
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP4', 'baja', 'verano', 2, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 4'),
('GP4', 'baja', 'verano', 4, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 4')
ON CONFLICT DO NOTHING;

-- ========== TEMPORADA ALTA - HORARIO INVIERNO ==========

-- GP1 - Igual que baja invierno
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
-- Semana 1
('GP1', 'alta', 'invierno', 1, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 1, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 1, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 1, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 1, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 1, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
-- Semana 2
('GP1', 'alta', 'invierno', 2, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 2, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 2, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 2, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
-- Semana 3
('GP1', 'alta', 'invierno', 3, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 3, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 3, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 3, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 3, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 3, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
-- Semana 4
('GP1', 'alta', 'invierno', 4, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 4, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 4, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'invierno', 4, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1')
ON CONFLICT DO NOTHING;

-- GP2 - Igual que baja invierno
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
-- Semana 1
('GP2', 'alta', 'invierno', 1, 'jueves', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 1, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 1, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 1, 'domingo', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
-- Semana 2
('GP2', 'alta', 'invierno', 2, 'jueves', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 2, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 2, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
-- Semana 3
('GP2', 'alta', 'invierno', 3, 'jueves', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 3, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 3, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 3, 'domingo', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
-- Semana 4
('GP2', 'alta', 'invierno', 4, 'jueves', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 4, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 2'),
('GP2', 'alta', 'invierno', 4, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 2')
ON CONFLICT DO NOTHING;

-- GP3 - CAMBIOS: Semana 2 y 4 con horarios mixtos
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP3', 'alta', 'invierno', 1, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
-- Semana 2: Lunes 9-18, Sábado y Domingo 10-19
('GP3', 'alta', 'invierno', 2, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'alta', 'invierno', 2, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 3'),
('GP3', 'alta', 'invierno', 2, 'domingo', '10:00', '19:00', '14:00', 'Guarda Parques 3'),
('GP3', 'alta', 'invierno', 3, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
-- Semana 4: Lunes 9-18, Sábado y Domingo 10-19
('GP3', 'alta', 'invierno', 4, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'alta', 'invierno', 4, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 3'),
('GP3', 'alta', 'invierno', 4, 'domingo', '10:00', '19:00', '14:00', 'Guarda Parques 3')
ON CONFLICT DO NOTHING;

-- GP4 - NUEVOS TURNOS: Viernes a Domingo
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
-- Semana 1: Viernes a Domingo 10-19
('GP4', 'alta', 'invierno', 1, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
('GP4', 'alta', 'invierno', 1, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
('GP4', 'alta', 'invierno', 1, 'domingo', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
-- Semana 2: Viernes y Sábado 10-19, Domingo 9-18
('GP4', 'alta', 'invierno', 2, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
('GP4', 'alta', 'invierno', 2, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
('GP4', 'alta', 'invierno', 2, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 4'),
-- Semana 3: Viernes a Domingo 10-19
('GP4', 'alta', 'invierno', 3, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
('GP4', 'alta', 'invierno', 3, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
('GP4', 'alta', 'invierno', 3, 'domingo', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
-- Semana 4: Viernes y Sábado 10-19, Domingo 9-18
('GP4', 'alta', 'invierno', 4, 'viernes', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
('GP4', 'alta', 'invierno', 4, 'sabado', '10:00', '19:00', '14:00', 'Guarda Parques 4'),
('GP4', 'alta', 'invierno', 4, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 4')
ON CONFLICT DO NOTHING;

-- ========== TEMPORADA ALTA - HORARIO VERANO ==========

-- GP1 - Igual que otras temporadas
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
-- Semana 1
('GP1', 'alta', 'verano', 1, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 1, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 1, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 1, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 1, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 1, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
-- Semana 2
('GP1', 'alta', 'verano', 2, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 2, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 2, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 2, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
-- Semana 3
('GP1', 'alta', 'verano', 3, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 3, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 3, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 3, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 3, 'sabado', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 3, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
-- Semana 4
('GP1', 'alta', 'verano', 4, 'martes', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 4, 'miercoles', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 4, 'jueves', '09:00', '18:00', '13:00', 'Guarda Parques 1'),
('GP1', 'alta', 'verano', 4, 'viernes', '09:00', '18:00', '13:00', 'Guarda Parques 1')
ON CONFLICT DO NOTHING;

-- GP2 - HORARIOS COMPLEJOS
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
-- Semana 1: Jueves 12-21, Viernes a Domingo 11-20
('GP2', 'alta', 'verano', 1, 'jueves', '12:00', '21:00', '16:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 1, 'viernes', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 1, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 1, 'domingo', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
-- Semana 2: Jueves 12-21, Miércoles y Viernes 11-20
('GP2', 'alta', 'verano', 2, 'miercoles', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 2, 'jueves', '12:00', '21:00', '16:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 2, 'viernes', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
-- Semana 3: Jueves 12-21, Viernes a Domingo 11-20
('GP2', 'alta', 'verano', 3, 'jueves', '12:00', '21:00', '16:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 3, 'viernes', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 3, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 3, 'domingo', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
-- Semana 4: Jueves 12-21, Miércoles y Sábado 11-20
('GP2', 'alta', 'verano', 4, 'miercoles', '11:00', '20:00', '15:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 4, 'jueves', '12:00', '21:00', '16:00', 'Guarda Parques 2'),
('GP2', 'alta', 'verano', 4, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 2')
ON CONFLICT DO NOTHING;

-- GP3 - HORARIOS MIXTOS
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('GP3', 'alta', 'verano', 1, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
-- Semana 2: Lunes 9-18, Sábado y Domingo 12-21
('GP3', 'alta', 'verano', 2, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'alta', 'verano', 2, 'sabado', '12:00', '21:00', '16:00', 'Guarda Parques 3'),
('GP3', 'alta', 'verano', 2, 'domingo', '12:00', '21:00', '16:00', 'Guarda Parques 3'),
('GP3', 'alta', 'verano', 3, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
-- Semana 4: Lunes 9-18, Sábado y Domingo 12-21
('GP3', 'alta', 'verano', 4, 'lunes', '09:00', '18:00', '13:00', 'Guarda Parques 3'),
('GP3', 'alta', 'verano', 4, 'sabado', '12:00', '21:00', '16:00', 'Guarda Parques 3'),
('GP3', 'alta', 'verano', 4, 'domingo', '12:00', '21:00', '16:00', 'Guarda Parques 3')
ON CONFLICT DO NOTHING;

-- GP4 - HORARIOS COMPLEJOS
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
-- Semana 1: Viernes a Domingo 12-21
('GP4', 'alta', 'verano', 1, 'viernes', '12:00', '21:00', '16:00', 'Guarda Parques 4'),
('GP4', 'alta', 'verano', 1, 'sabado', '12:00', '21:00', '16:00', 'Guarda Parques 4'),
('GP4', 'alta', 'verano', 1, 'domingo', '12:00', '21:00', '16:00', 'Guarda Parques 4'),
-- Semana 2: Viernes 12-21, Sábado 11-20, Domingo 9-18
('GP4', 'alta', 'verano', 2, 'viernes', '12:00', '21:00', '16:00', 'Guarda Parques 4'),
('GP4', 'alta', 'verano', 2, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 4'),
('GP4', 'alta', 'verano', 2, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 4'),
-- Semana 3: Viernes a Domingo 12-21
('GP4', 'alta', 'verano', 3, 'viernes', '12:00', '21:00', '16:00', 'Guarda Parques 4'),
('GP4', 'alta', 'verano', 3, 'sabado', '12:00', '21:00', '16:00', 'Guarda Parques 4'),
('GP4', 'alta', 'verano', 3, 'domingo', '12:00', '21:00', '16:00', 'Guarda Parques 4'),
-- Semana 4: Viernes 12-21, Sábado 11-20, Domingo 9-18
('GP4', 'alta', 'verano', 4, 'viernes', '12:00', '21:00', '16:00', 'Guarda Parques 4'),
('GP4', 'alta', 'verano', 4, 'sabado', '11:00', '20:00', '15:00', 'Guarda Parques 4'),
('GP4', 'alta', 'verano', 4, 'domingo', '09:00', '18:00', '13:00', 'Guarda Parques 4')
ON CONFLICT DO NOTHING;

-- Voluntario - Solo Temporada Alta Verano Semana 2
INSERT INTO turnos_v2 (codigo_turno, temporada, horario, semana_ciclo, dia_semana, hora_inicio, hora_fin, hora_almuerzo, puesto) VALUES
('Voluntario', 'alta', 'verano', 2, 'sabado', '09:00', '18:00', '13:00', 'Voluntario')
ON CONFLICT DO NOTHING;

-- ==================================================
-- ✅ VERIFICACIÓN FINAL
-- ==================================================

SELECT 
  temporada,
  horario,
  COUNT(*) as total_plantillas,
  COUNT(DISTINCT codigo_turno) as guardias_diferentes
FROM turnos_v2
GROUP BY temporada, horario
ORDER BY temporada, horario;

SELECT 'Todas las plantillas de turnos creadas! 🎉' as mensaje;
