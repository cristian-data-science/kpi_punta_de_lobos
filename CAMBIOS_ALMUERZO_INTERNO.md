# 🔄 CAMBIOS EN VISUALIZACIÓN DE TURNOS Y ALMUERZO
**Fecha:** 14 de octubre de 2025

## ✨ Cambios Implementados

### 1. **Mostrar Solo Primer Nombre** ✅
- **Antes:** Mostraba nombre completo (ej: "JUAN PÉREZ")
- **Ahora:** Muestra solo primer nombre (ej: "JUAN")
- **Modificación:** `mapPersonaToLabel()` en `scheduleHelpers.js`
- **Código:**
  ```javascript
  // Para otros nombres: devolver solo el PRIMER NOMBRE
  const primerNombre = nombreUpper.split(' ')[0]
  return primerNombre
  ```

### 2. **Almuerzo DENTRO del Bloque del Trabajador** ✅
- **Antes:** Almuerzo era un bloque separado blanco
- **Ahora:** Almuerzo es una línea divisoria DENTRO del bloque del turno
- **Visual:** Línea blanca horizontal con texto "ALMUERZO"
- **Ubicación:** Se posiciona automáticamente según `hora_almuerzo`

## 🎨 Nueva Visualización del Almuerzo

### Características:
- **Posición:** Calculada dinámicamente según hora de almuerzo dentro del turno
- **Estilo:** 
  - Fondo blanco degradado: `rgba(255,255,255,0.95) → rgba(255,255,255,1)`
  - Bordes punteados: `1px dashed #cbd5e1`
  - Texto pequeño: `8px`, color gris `#64748b`
  - Altura: `20px`
- **Comportamiento:** `pointerEvents: none` (no interfiere con clicks)

### Ejemplo Visual:
```
┌─────────────────────┐
│      JUAN           │ ← Bloque del turno (09:00-18:00)
│                     │
├ ··· ALMUERZO ··· ┤ ← Línea divisoria (13:00)
│                     │
│                     │
└─────────────────────┘
```

## 📐 Cálculo de Posición

```javascript
// Minutos desde inicio del turno hasta el almuerzo
const turnoStartMinutes = parseTimeToMinutes(event.start)      // ej: 540 (09:00)
const lunchStartMinutes = parseTimeToMinutes(event.hora_almuerzo) // ej: 780 (13:00)
const totalDurationMinutes = parseTimeToMinutes(event.end) - turnoStartMinutes // ej: 540 (9 horas)

// Posición relativa: (780-540)/540 * 100 = 44.4%
const lunchOffsetPercent = ((lunchStartMinutes - turnoStartMinutes) / totalDurationMinutes) * 100
```

## 🔧 Archivos Modificados

### 1. `src/utils/scheduleHelpers.js`
- ✅ **mapPersonaToLabel():** Retorna solo primer nombre
- ✅ **turnosToBlocks():** 
  - Eliminada creación de bloque separado de almuerzo
  - Incluye `hora_almuerzo` en el objeto del turno
  - Un solo bloque por turno (no dos)

### 2. `src/components/WeeklySchedule/WeeklySchedule.jsx`
- ✅ **Cálculo de posición:** `lunchBarPosition` calculado dinámicamente
- ✅ **Renderizado condicional:** Div `.lunch-divider` solo si existe `hora_almuerzo`
- ✅ **Estilos inline:** Posición absoluta con `top: ${lunchBarPosition}%`

## 📊 Comparación: Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Nombre** | "JUAN PÉREZ" | "JUAN" |
| **Almuerzo** | Bloque separado | Línea dentro del bloque |
| **Bloques por turno** | 2 (turno + almuerzo) | 1 (turno con línea) |
| **Carriles ocupados** | 2 (competía por espacio) | 1 (no ocupa carril extra) |
| **Clickeable almuerzo** | No | N/A (es parte del turno) |

## ✅ Ventajas del Nuevo Sistema

1. **Más espacio:** Almuerzo no ocupa carril separado
2. **Mejor UX:** Se ve claramente que el almuerzo pertenece al turno
3. **Más compacto:** Permite visualizar más turnos simultáneos
4. **Nombres cortos:** Mejor legibilidad, especialmente con 4 turnos paralelos
5. **Más intuitivo:** El almuerzo divide visualmente la jornada del trabajador

## 🧪 Casos de Prueba

### Caso 1: Turno sin almuerzo
```javascript
{
  persona: "JUAN PÉREZ",
  hora_inicio: "09:00",
  hora_fin: "18:00",
  hora_almuerzo: null
}
```
**Resultado:** Bloque normal con "JUAN", sin línea divisoria

### Caso 2: Turno con almuerzo
```javascript
{
  persona: "JUAN PÉREZ",
  hora_inicio: "09:00",
  hora_fin: "18:00",
  hora_almuerzo: "13:00"
}
```
**Resultado:** Bloque con "JUAN" + línea "ALMUERZO" al 44% de altura

### Caso 3: Turno tipo almuerzo
```javascript
{
  persona: null,
  puesto: "ALMUERZO",
  hora_inicio: "13:00",
  hora_fin: "14:00"
}
```
**Resultado:** Bloque blanco completo con "ALMUERZO" (sin cambios)

## 🎯 Compatibilidad

- ✅ Compatible con turnos existentes (hora_almuerzo = null)
- ✅ Funciona con 1 a 4 turnos simultáneos
- ✅ No afecta algoritmo de carriles (assignLanes)
- ✅ Mantiene colores persistentes por persona
- ✅ Edición de turno incluye hora_almuerzo

## 📝 Próximos Pasos (Usuario)

1. **Probar con turnos existentes:** Verificar nombres cortos
2. **Crear turno con almuerzo:** Agregar hora_almuerzo = "13:00"
3. **Verificar posición:** La línea debe aparecer en la hora correcta
4. **Probar con 4 turnos:** Confirmar que todos quepan bien

---
**Estado:** ✅ **COMPLETADO Y LISTO PARA PRUEBAS**
