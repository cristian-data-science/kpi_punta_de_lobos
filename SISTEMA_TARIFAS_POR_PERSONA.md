# 💰 Sistema Simplificado de Pagos - Tarifa por Hora según Persona

## 🎯 Cambio Conceptual

**Antes**: Sistema complejo con tarifas diferenciadas por día (lunes-viernes, sábado, domingo, festivos) y multiplicadores por tipo de guardia.

**Ahora**: Sistema simple donde **cada persona tiene su propia tarifa por hora (`tarifa_hora`)** y el monto se calcula como:

```
Monto del Turno = Horas Trabajadas × Tarifa por Hora de la Persona
```

---

## 📋 Cambios Implementados

### 1. **Base de Datos** (`sql/agregar_tarifa_persona.sql`)

✅ **Nueva columna en tabla `personas`**:
```sql
ALTER TABLE personas 
ADD COLUMN tarifa_hora DECIMAL(10, 2) DEFAULT 5000;
```

✅ **Función auxiliar para calcular horas**:
```sql
CREATE FUNCTION calcular_horas_turno(hora_inicio, hora_fin)
-- Retorna diferencia en horas entre dos tiempos
```

✅ **Vista automática con cálculos**:
```sql
CREATE VIEW vista_turnos_v2_con_pago
-- Muestra turnos con monto calculado automáticamente
```

✅ **Función de estadísticas mensual**:
```sql
CREATE FUNCTION obtener_estadisticas_mes(mes, anio)
-- Retorna total de turnos, horas y monto por persona
```

### 2. **Servicio JavaScript** (`src/services/turnosV2Helpers.js`)

✅ **Funciones de cálculo simplificadas**:
```javascript
// Calcular horas trabajadas
calcularHorasTurno(horaInicio, horaFin)

// Calcular monto: tarifa × horas
calcularMontoTurno(tarifaHora, horas)
```

✅ **Actualización de `calcularEstadisticasMes()`**:
- Usa `turno.persona.tarifa_hora` en lugar de configuración global
- Calcula monto por turno: `tarifa_hora × horas`
- Suma totales por persona

✅ **Nuevas funciones auxiliares**:
```javascript
// Obtener personas con sus tarifas
getPersonasActivas()

// Actualizar tarifa de una persona
updateTarifaPersona(personaId, tarifaHora)
```

### 3. **Query Mejorado en `getTurnosV2()`**

```javascript
.select(`
  *,
  persona:persona_id (
    id,
    nombre,
    rut,
    tipo,
    tarifa_hora  // ← NUEVO: Incluye tarifa en consultas
  )
`)
```

---

## 🔧 Instalación

### Paso 1: Ejecutar Script SQL

1. Abre **Supabase Dashboard** → **SQL Editor**
2. Copia el contenido de `sql/agregar_tarifa_persona.sql`
3. Ejecuta el script
4. Verifica que se creó la columna:

```sql
SELECT nombre, tipo, tarifa_hora 
FROM personas 
ORDER BY tarifa_hora DESC;
```

### Paso 2: Configurar Tarifas Iniciales

El script ya asigna tarifas por defecto según tipo:
- **Instructor**: $8.000/hora
- **Guía**: $6.000/hora
- **Staff**: $5.000/hora
- **Visitante/Voluntario**: $3.000/hora

Puedes ajustar manualmente:

```sql
UPDATE personas 
SET tarifa_hora = 7500 
WHERE id = 'uuid-de-la-persona';
```

### Paso 3: Verificar en la UI

1. Refrescar el navegador
2. Ir a `/programacion-turnos`
3. Asignar una persona a un turno
4. Ver en **Dashboard de Estadísticas**:
   - Columna "Horas Totales"
   - Columna "Monto Total" (calculado con tarifa_hora)

---

## 📊 Ejemplos de Cálculo

### Ejemplo 1: Guía con turno de 9 horas

```
Persona: Juan Pérez (Guía)
Tarifa: $6.000/hora
Turno: 10:00 - 19:00 (9 horas)

Cálculo:
Monto = 9 horas × $6.000 = $54.000
```

### Ejemplo 2: Instructor con turno más corto

```
Persona: María González (Instructora)
Tarifa: $8.000/hora
Turno: 12:00 - 21:00 (9 horas)

Cálculo:
Monto = 9 horas × $8.000 = $72.000
```

### Ejemplo 3: Voluntario

```
Persona: Carlos Muñoz (Voluntario)
Tarifa: $3.000/hora
Turno: 09:00 - 18:00 (9 horas)

Cálculo:
Monto = 9 horas × $3.000 = $27.000
```

---

## 🎨 Vista en el Dashboard

Cuando veas las estadísticas mensuales, ahora verás:

| Persona | Turnos | Días Semana | Sábados | Domingos | **Horas** | **Monto** |
|---------|--------|-------------|---------|----------|-----------|-----------|
| María G. | 12 | 8 | 2 | 2 | **108h** | **$864.000** |
| Juan P. | 10 | 7 | 1 | 2 | **90h** | **$540.000** |
| Carlos M. | 8 | 6 | 1 | 1 | **72h** | **$216.000** |
| **TOTAL** | **30** | **21** | **4** | **5** | **270h** | **$1.620.000** |

**Cálculos**:
- María: 108h × $8.000/h = $864.000
- Juan: 90h × $6.000/h = $540.000
- Carlos: 72h × $3.000/h = $216.000

---

## 🔍 Consultas SQL Útiles

### Ver tarifas de todas las personas

```sql
SELECT 
  nombre,
  tipo,
  tarifa_hora,
  estado
FROM personas
ORDER BY tarifa_hora DESC;
```

### Ver turnos con cálculo automático

```sql
SELECT * FROM vista_turnos_v2_con_pago
WHERE persona_id IS NOT NULL
ORDER BY monto_calculado DESC
LIMIT 20;
```

### Estadísticas de un mes específico

```sql
SELECT * FROM obtener_estadisticas_mes(11, 2025);
-- Retorna: persona_id, nombre, rut, tarifa_hora, total_turnos, total_horas, monto_total
```

### Cambiar tarifa de una persona

```sql
UPDATE personas 
SET tarifa_hora = 9000  -- Nueva tarifa
WHERE nombre = 'Juan Pérez';
```

---

## ⚙️ Gestión de Tarifas (UI Futura)

Podrías agregar una sección en **Configuración** o **Personas** para:

1. Ver lista de personas con sus tarifas actuales
2. Editar tarifa_hora de cada persona
3. Ver historial de cambios de tarifas (requeriría tabla adicional)
4. Exportar reporte de costos por persona

**Mockup simple**:

```
┌────────────────────────────────────────────┐
│ 💰 Tarifas por Persona                     │
├────────────────────────────────────────────┤
│ María González (Instructora)    $8.000/h   │
│ [Editar] [Historial]                       │
├────────────────────────────────────────────┤
│ Juan Pérez (Guía)              $6.000/h    │
│ [Editar] [Historial]                       │
├────────────────────────────────────────────┤
│ Carlos Muñoz (Voluntario)      $3.000/h    │
│ [Editar] [Historial]                       │
└────────────────────────────────────────────┘
```

---

## ✅ Ventajas del Nuevo Sistema

1. **Simplicidad**: No necesitas configurar tarifas por día ni multiplicadores
2. **Flexibilidad**: Cada persona puede tener su propia tarifa
3. **Transparencia**: Cálculo directo: horas × tarifa
4. **Fácil ajuste**: Cambiar tarifa de una persona no afecta cálculos pasados
5. **Escalable**: Agregar nuevas personas es trivial

---

## 🚀 Próximos Pasos Recomendados

1. ✅ **Ejecutar** `sql/agregar_tarifa_persona.sql`
2. ✅ **Verificar** que personas tienen `tarifa_hora` asignada
3. ✅ **Probar** asignar turnos y ver dashboard con montos calculados
4. 🔜 **Opcional**: Crear UI para gestionar tarifas fácilmente
5. 🔜 **Opcional**: Agregar tabla `historial_tarifas` para auditoría

---

## 📝 Notas Técnicas

### Eliminación de Tabla `configuracion_pagos`

La tabla `configuracion_pagos` **ya no es necesaria** con este modelo. Puedes:

- **Opción 1**: Dejarla (no interfiere, simplemente no se usa)
- **Opción 2**: Eliminarla para limpiar:

```sql
DROP TABLE IF EXISTS configuracion_pagos;
```

### Compatibilidad

- ✅ Compatible con sistema existente de turnos_v2
- ✅ No afecta turnos ya asignados (solo cambia cálculo)
- ✅ Funciona con todos los escenarios (Baja/Alta × Invierno/Verano)

---

## ❓ FAQ

**P: ¿Los montos se guardan en la base de datos?**
R: No, se calculan en tiempo real. Esto asegura que siempre reflejan la tarifa actual de la persona.

**P: ¿Puedo tener tarifas diferentes para fin de semana?**
R: Con este modelo NO. Es tarifa única por persona, sin importar el día. Si necesitas eso, habría que agregar lógica adicional.

**P: ¿Cómo ajusto tarifas masivamente?**
R: Por ahora SQL directamente. Podrías crear UI o script:

```sql
-- Aumentar 10% todas las tarifas
UPDATE personas 
SET tarifa_hora = tarifa_hora * 1.10
WHERE estado = 'activo';
```

**P: ¿Se puede tener historial de cambios de tarifa?**
R: No está implementado, pero podrías crear tabla `historial_tarifas`:

```sql
CREATE TABLE historial_tarifas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona_id UUID REFERENCES personas(id),
  tarifa_anterior DECIMAL(10,2),
  tarifa_nueva DECIMAL(10,2),
  fecha_cambio TIMESTAMP DEFAULT NOW(),
  cambiado_por TEXT
);
```

---

**🌊 ¡Sistema simplificado y listo para usar!**
