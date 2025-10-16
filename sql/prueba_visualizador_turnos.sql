-- ============================================
-- SCRIPT PARA PROBAR VISUALIZADOR DE TURNOS
-- ============================================

-- 1. VERIFICAR PERSONAS CON RUT
-- ============================================
SELECT id, nombre, rut, email, tipo 
FROM personas 
WHERE rut IS NOT NULL 
LIMIT 10;

-- 2. AGREGAR PERSONAS DE PRUEBA (si no tienes)
-- ============================================
-- IMPORTANTE: Los RUTs deben estar SIN puntos ni guiones
INSERT INTO personas (nombre, rut, email, telefono, tipo, estado)
VALUES 
  ('Juan Pérez', '111111111', 'juan@test.com', '+56912345678', 'guarda', 'activo'),
  ('María González', '222222222', 'maria@test.com', '+56912345679', 'instructor', 'activo'),
  ('Pedro Rodríguez', '333333333', 'pedro@test.com', '+56912345680', 'guarda', 'activo')
ON CONFLICT (rut) DO NOTHING;

-- 3. AGREGAR TURNOS DE PRUEBA PARA ESTA SEMANA
-- ============================================
-- Reemplaza 'ID_DE_PERSONA' con el ID real de la persona

-- Para Juan (RUT: 11.111.111-1)
INSERT INTO turnos (
  persona_id, 
  fecha, 
  hora_inicio, 
  hora_fin, 
  hora_almuerzo,
  tipo_turno, 
  estado, 
  puesto, 
  ubicacion, 
  notas
)
VALUES 
  -- Turnos para hoy
  (
    (SELECT id FROM personas WHERE rut = '111111111' LIMIT 1),
    CURRENT_DATE,
    '09:00',
    '17:00',
    '13:00',
    'completo',
    'programado',
    'Recepción',
    'Punta de Lobos',
    'Turno regular de día'
  ),
  -- Turnos para mañana
  (
    (SELECT id FROM personas WHERE rut = '111111111' LIMIT 1),
    CURRENT_DATE + INTERVAL '1 day',
    '14:00',
    '22:00',
    '18:00',
    'completo',
    'programado',
    'Vigilancia',
    'Punta de Lobos',
    'Turno de tarde'
  ),
  -- Turnos para pasado mañana
  (
    (SELECT id FROM personas WHERE rut = '111111111' LIMIT 1),
    CURRENT_DATE + INTERVAL '2 days',
    '09:00',
    '17:00',
    '13:00',
    'completo',
    'programado',
    'Recepción',
    'Punta de Lobos',
    'Turno matinal'
  );

-- 4. VERIFICAR LOS TURNOS CREADOS
-- ============================================
SELECT 
  t.*,
  p.nombre,
  p.rut
FROM turnos t
JOIN personas p ON t.persona_id = p.id
WHERE p.rut = '111111111'
ORDER BY t.fecha DESC;

-- 5. OBTENER FORMATO DE RUT PARA PROBAR
-- ============================================
-- Esto te mostrará los RUTs en formato para copiar y pegar en el login
SELECT 
  nombre,
  rut,
  -- Formatear RUT para mostrar cómo ingresarlo
  SUBSTRING(rut, 1, LENGTH(rut)-1) || '-' || SUBSTRING(rut, LENGTH(rut), 1) as rut_formateado
FROM personas 
WHERE rut IS NOT NULL
LIMIT 10;
