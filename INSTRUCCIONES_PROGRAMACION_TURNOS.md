# 🌊 Instrucciones de Implementación - Sistema de Programación de Turnos

## 📋 Resumen del Sistema

Hemos creado un sistema completo de programación de turnos para Punta de Lobos que incluye:

1. **Nueva tabla `turnos_v2`** con plantillas predefinidas de turnos
2. **Tabla `configuracion_pagos`** para gestión de tarifas
3. **Nueva página `/programacion-turnos`** para asignar personas a turnos
4. **Dashboard de estadísticas** con métricas por persona
5. **4 escenarios de turnos** completos (Temporada Baja/Alta x Invierno/Verano)

---

## 🚀 PASO 1: Ejecutar Scripts SQL en Supabase

### Orden de ejecución:

#### 1.1. Script Principal (Crear tablas y plantillas Temporada Baja Invierno)
```bash
sql/crear_turnos_v2.sql
```

**Qué hace:**
- Crea tabla `turnos_v2` con todos los campos necesarios
- Crea tabla `configuracion_pagos` con tarifas por defecto
- Inserta configuración inicial de pagos (CLP $30.000 día semana, $40.000 sábado, $50.000 domingo)
- Crea plantillas de turnos para **Temporada Baja - Horario Invierno**
- Total: ~50 plantillas de turnos (GP1, GP2, GP3, GP4 con ciclo de 4 semanas)

**Cómo ejecutar:**
1. Abre Supabase Dashboard → SQL Editor
2. Copia TODO el contenido de `sql/crear_turnos_v2.sql`
3. Pega y ejecuta
4. Verifica que veas mensaje: "Plantillas de turnos creadas exitosamente! 🎉"

#### 1.2. Script de Plantillas Completas (Resto de temporadas)
```bash
sql/plantillas_turnos_completas.sql
```

**Qué hace:**
- Inserta plantillas para **Temporada Baja - Horario Verano**
- Inserta plantillas para **Temporada Alta - Horario Invierno**
- Inserta plantillas para **Temporada Alta - Horario Verano**
- Total: ~200+ plantillas adicionales

**Cómo ejecutar:**
1. En Supabase Dashboard → SQL Editor
2. Copia TODO el contenido de `sql/plantillas_turnos_completas.sql`
3. Pega y ejecuta
4. Verifica que veas mensaje: "Todas las plantillas de turnos creadas! 🎉"

---

## ✅ PASO 2: Verificar Instalación en Supabase

Ejecuta estas queries para confirmar que todo está bien:

```sql
-- Ver resumen de plantillas por escenario
SELECT 
  temporada,
  horario,
  COUNT(*) as total_plantillas,
  COUNT(DISTINCT codigo_turno) as guardias_diferentes
FROM turnos_v2
GROUP BY temporada, horario
ORDER BY temporada, horario;

-- Deberías ver algo como:
-- baja, invierno, ~50, 4
-- baja, verano, ~50, 4
-- alta, invierno, ~70, 4
-- alta, verano, ~80, 5 (incluye Voluntario)

-- Ver configuración de pagos
SELECT * FROM configuracion_pagos WHERE es_actual = true;
```

---

## 🎯 PASO 3: Usar el Sistema

### Acceder a la nueva página:
```
http://localhost:5173/programacion-turnos
```

### Flujo de trabajo:

#### 3.1. Configurar Escenario
- **Temporada**: Baja o Alta
- **Horario**: Invierno o Verano
- **Mes**: Selecciona el mes a programar
- **Año**: Selecciona el año

#### 3.2. Asignar Personas
1. Haz clic en cualquier turno en el calendario
2. Se abrirá un modal con:
   - Información del turno (GP1-GP4, horarios, día, semana)
   - Lista de personas activas
3. Selecciona una persona
4. El turno cambiará de gris (disponible) a azul (asignado)

#### 3.3. Ver Dashboard de Estadísticas
Debajo del calendario verás una tabla con:
- **Cantidad de turnos** por persona
- **Días de semana** trabajados
- **Sábados** trabajados
- **Domingos** trabajados
- **Horas totales** del mes
- **Monto a pagar** según tarifas configuradas

---

## 📊 Estructura de los Datos

### Tabla `turnos_v2`
```
- codigo_turno: GP1, GP2, GP3, GP4, Voluntario
- temporada: baja | alta
- horario: invierno | verano
- semana_ciclo: 1, 2, 3, 4 (ciclo de 4 semanas)
- dia_semana: lunes a domingo
- hora_inicio / hora_fin
- persona_id: NULL cuando disponible, UUID cuando asignado
- estado: disponible | asignado | completado | cancelado
```

### Tabla `configuracion_pagos`
```
- tarifa_dia_semana: $30.000
- tarifa_sabado: $40.000
- tarifa_domingo: $50.000
- multiplicador_gp1/2/3/4: 1.0 (ajustable)
- multiplicador_voluntario: 0.5
```

---

## 🎨 Esquema de Colores en el Calendario

- **Gris** (`#94a3b8`): Turno disponible (sin asignar)
- **Azul** (`#3b82f6`): Turno asignado
- **Verde** (`#22c55e`): Turno completado
- **Rojo** (`#ef4444`): Turno cancelado

---

## 🔧 Configuración de Tarifas

Para modificar las tarifas, ejecuta en Supabase:

```sql
UPDATE configuracion_pagos 
SET 
  tarifa_dia_semana = 35000,
  tarifa_sabado = 45000,
  tarifa_domingo = 55000,
  multiplicador_gp1 = 1.0,
  multiplicador_gp2 = 1.1,
  multiplicador_gp3 = 1.0,
  multiplicador_gp4 = 0.9,
  multiplicador_voluntario = 0.5
WHERE es_actual = true;
```

---

## 📝 Ejemplo de Uso Completo

### Escenario: Programar Noviembre 2025 - Temporada Alta Verano

1. **Configuración**:
   - Temporada: Alta
   - Horario: Verano
   - Mes: 11 (Noviembre)
   - Año: 2025

2. **Sistema carga automáticamente**: ~80 plantillas de turnos

3. **Asignar personas**:
   - Haz clic en turno "GP1 - Martes 9:00-18:00"
   - Selecciona "Juan Pérez"
   - Turno se marca como asignado

4. **Ver estadísticas**:
   - Juan Pérez: 6 turnos, 4 días semana, 2 sábados, 0 domingos
   - Monto total: $200.000

---

## 🚨 Troubleshooting

### Error: "No se pueden cargar turnos"
- Verifica que ejecutaste ambos scripts SQL
- Confirma en Supabase que las tablas `turnos_v2` y `configuracion_pagos` existen

### No aparecen personas para asignar
- Verifica que tienes personas activas en la tabla `personas`
- Estado debe ser 'activo'

### Tarifas aparecen en $0
- Ejecuta: `SELECT * FROM configuracion_pagos WHERE es_actual = true`
- Si está vacío, ejecuta de nuevo el script `crear_turnos_v2.sql`

---

## 📚 Archivos Creados

### SQL (en carpeta `sql/`):
- `crear_turnos_v2.sql` - Script principal (tablas + plantillas baja-invierno)
- `plantillas_turnos_completas.sql` - Resto de plantillas

### JavaScript (en carpeta `src/`):
- `services/turnosV2Helpers.js` - Servicios Supabase para turnos_v2
- `pages/ProgramacionTurnos.jsx` - Página principal (960+ líneas)

### Rutas actualizadas:
- `src/App.jsx` - Nueva ruta `/programacion-turnos`
- `src/components/Sidebar.jsx` - Nuevo ítem "Programación" con ícono CalendarCheck

---

## 🎉 ¡Listo!

El sistema está completo y funcional. Ahora puedes:
1. ✅ Crear plantillas de turnos automáticamente
2. ✅ Asignar personas a turnos mensualmente
3. ✅ Ver estadísticas en tiempo real
4. ✅ Calcular pagos automáticamente
5. ✅ Gestionar 4 escenarios diferentes de temporada/horario

---

## 📞 Próximos Pasos Sugeridos

1. **Copiar turnos de mes anterior**: Función para duplicar asignaciones
2. **Exportar a Excel**: Dashboard con export de planilla de pagos
3. **Validaciones**: Evitar conflictos de horarios por persona
4. **Notificaciones**: Alertar cuando faltan turnos por asignar
5. **Histórico**: Ver turnos completados de meses anteriores

---

**Desarrollado para Punta de Lobos** 🌊
