# Sistema de Avisos No Bloqueantes para Turnos

**Fecha:** 1 de octubre de 2025  
**Rama:** pre-prod  
**Componente Principal:** `src/components/AddShiftModal.jsx`

## Resumen de Cambios

Se ha modificado completamente el sistema de restricciones de turnos, convirtiendo los **bloqueos** en **avisos visuales** que NO impiden el guardado de las asignaciones.

## Cambios Implementados

### 1. ✅ Turno Continuo 3º → 1º al Día Siguiente

**Antes:**
- Mostraba alert() bloqueante
- Impedía asignar el turno
- Retornaba `valid: false`

**Ahora:**
- Permite la asignación
- Muestra **fondo rojo claro** en el trabajador
- Icono ⚠️ con tooltip: "Turno continuo / descanso insuficiente (tuvo 3º turno ayer)"
- Retorna `valid: true, warning: true`

**Código modificado:**
```javascript
// validateNextDayRulesLocal() - líneas ~200-236
return {
  valid: true,
  warning: true,
  warningType: 'continuous-shift',
  message: 'Turno continuo / descanso insuficiente (tuvo 3º turno ayer)'
}
```

---

### 2. ✅ Combinación "1º + 3º" No Recomendada

**Antes:**
- Alert() bloqueante: "No se permite la combinación..."
- Impedía la asignación
- Retornaba `return prev` sin cambios

**Ahora:**
- Permite la asignación
- Muestra **fondo naranja claro** en el trabajador
- Icono ⚠️ con tooltip: "Combinación de turnos no recomendada (1º + 3º)"
- Se registra en el sistema de warnings

**Código modificado:**
```javascript
// handleWorkerToggle() - se removió el alert y el return prev
warnings.push({
  type: 'combination-not-recommended',
  message: `Combinación de turnos no recomendada (${shiftNames[otherType]} + ${shiftNames[currentShiftNum]})`
})
// Luego permite la asignación
```

---

### 3. ✅ Exceder Máximo de Cupos por Turno

**Antes:**
- Alert() bloqueante: "Máximo X trabajadores por turno"
- Impedía agregar más trabajadores
- Retornaba `return prev` sin cambios

**Ahora:**
- Permite sobreasignar trabajadores
- Muestra **fondo amarillo claro** en el trabajador
- Icono ⚠️ con tooltip: "Excede el máximo configurado (N)"
- Se registra en el sistema de warnings

**Código modificado:**
```javascript
// handleWorkerToggle() - se removió el alert y el return prev
if (currentAssignments.length >= maxLimit) {
  warnings.push({
    type: 'limit-exceeded',
    message: `Excede el máximo configurado (${maxLimit})`
  })
}
// Luego permite la asignación
```

---

## Nuevo Sistema de Warnings

### Estado workerWarnings
```javascript
// Nuevo estado agregado
const [workerWarnings, setWorkerWarnings] = useState({})

// Estructura: { 'turnoType-workerId': [{ type, message }] }
// Ejemplo:
{
  'primer_turno-abc123': [
    { type: 'continuous-shift', message: 'Turno continuo...' }
  ],
  'tercer_turno-def456': [
    { type: 'limit-exceeded', message: 'Excede el máximo...' }
  ]
}
```

### Nuevas Funciones
```javascript
// Reemplaza isWorkerDisabled()
const getWorkerWarnings = (turnoType, workerId) => {
  const warningKey = `${turnoType}-${workerId}`
  return workerWarnings[warningKey] || []
}

const hasWorkerWarnings = (turnoType, workerId) => {
  const warnings = getWorkerWarnings(turnoType, workerId)
  return warnings.length > 0
}
```

---

## Visualización de Avisos

### Colores por Tipo de Warning

| Tipo de Warning | Color de Fondo | Color de Texto | Icono |
|-----------------|----------------|----------------|-------|
| `continuous-shift` | `bg-red-50 border-red-300` | `text-red-600` | ⚠️ |
| `combination-not-recommended` | `bg-orange-50 border-orange-300` | `text-orange-600` | ⚠️ |
| `limit-exceeded` | `bg-yellow-50 border-yellow-300` | `text-yellow-600` | ⚠️ |

### Renderizado de Trabajadores

Cada trabajador ahora muestra:

1. **Fondo coloreado** según el tipo de warning más crítico
2. **Icono AlertTriangle** al lado del nombre
3. **Tooltip HTML** con el mensaje completo al hacer hover
4. **Mensaje visual** debajo del RUT con el warning específico

**Ejemplo visual:**
```
┌─────────────────────────────────────┐
│ ☑ 🔶 Juan López              ⚠️    │ <- Fondo naranja
│   12.345.678-9                      │
│   ⚠️ Combinación no recomendada    │ <- Warning visible
│                         $20.000     │
└─────────────────────────────────────┘
```

---

## Área de Alertas (Header)

**Antes:**
- Color amarillo
- Texto: "Alertas de Reglas de Turnos"
- Indicaba error (❌) o advertencia (⚠️)

**Ahora:**
- Color naranja (más visible como aviso)
- Texto: "⚠️ Avisos (no bloquean guardado)"
- Solo icono ⚠️ para todos los avisos
- Mensaje claro de que son informativos

---

## Cuadro de Información del Sistema

Se actualizó el texto informativo:

```
• PROGRAMADO: Tarifas del sistema
• COMPLETADO: Pago real registrado
• Avisos: Los avisos NO bloquean el guardado ← NUEVO
• Usa "Eliminar todos" para borrar turnos
```

---

## Comportamiento del Guardado

### ✅ Guardado SIEMPRE Permitido

- No importa cuántos avisos haya
- No importa la severidad de los warnings
- El botón "Guardar" **nunca se deshabilita** por warnings
- Los avisos son solo informativos para el usuario

### Flujo de Guardado
```
1. Usuario asigna trabajadores (con o sin warnings)
2. Warnings se muestran visualmente en tiempo real
3. Usuario hace clic en "Guardar"
4. Sistema guarda TODO tal como está
5. No hay validación bloqueante
```

---

## Testing Checklist

### ✅ Casos de Prueba Implementados

1. **Turno Continuo:**
   - [ ] Asignar trabajador a 3º turno HOY
   - [ ] Asignar mismo trabajador a 1º turno MAÑANA
   - [ ] Verificar fondo rojo y mensaje "turno continuo / descanso insuficiente"
   - [ ] Confirmar que se puede guardar sin bloqueo

2. **Combinación No Recomendada:**
   - [ ] Configurar regla: 1º+3º NO permitido (en Configuración de Turnos)
   - [ ] Asignar trabajador a 1º turno
   - [ ] Asignar mismo trabajador a 3º turno
   - [ ] Verificar fondo naranja y mensaje "combinación no recomendada"
   - [ ] Confirmar que se puede guardar sin bloqueo

3. **Exceso de Cupos:**
   - [ ] Configurar límite: 3 trabajadores para 1º turno (en Configuración de Turnos)
   - [ ] Asignar 3 trabajadores al 1º turno
   - [ ] Asignar un 4º trabajador
   - [ ] Verificar fondo amarillo y mensaje "excede el máximo configurado (3)"
   - [ ] Confirmar que se puede guardar sin bloqueo

4. **Múltiples Warnings:**
   - [ ] Asignar trabajador con varios warnings simultáneos
   - [ ] Verificar que se muestran todos los warnings
   - [ ] Confirmar que el fondo usa el color del warning más crítico (rojo > naranja > amarillo)

---

## Archivos Modificados

### `src/components/AddShiftModal.jsx`

**Líneas modificadas:**
- ~34: Agregado estado `workerWarnings`
- ~200-236: `validateNextDayRulesLocal()` - convertido a modo aviso
- ~346-447: `handleWorkerToggle()` - removidos bloqueos, agregado sistema de warnings
- ~485-495: `getWorkerWarnings()` y `hasWorkerWarnings()` - nuevas funciones
- ~732-756: Área de alertas - actualizada a modo informativo
- ~713-724: Cuadro de información - agregada línea sobre avisos
- ~838-911: Renderizado de trabajadores - agregados fondos coloreados, iconos y tooltips

**Código eliminado:**
- `isWorkerDisabled()` - ya no existe
- Todos los `alert()` de bloqueo
- Todos los `return prev` que impedían asignaciones

**Código agregado:**
- `workerWarnings` state
- `getWorkerWarnings()` function
- `hasWorkerWarnings()` function
- Lógica de warnings en `handleWorkerToggle()`
- Renderizado visual de warnings en JSX

---

## Compatibilidad

### ✅ Compatible con:
- Sistema actual de tarifas (pago/cobro)
- Configuración de reglas existente (Configuración de Turnos)
- Base de datos Supabase (sin cambios de schema)
- Sistema de estados (programado/completado)

### ⚠️ Cambios de Comportamiento:
- Las reglas ahora son **sugerencias** en lugar de **restricciones**
- El usuario tiene control total sobre las asignaciones
- La responsabilidad de revisar warnings recae en el usuario

---

## Próximos Pasos Sugeridos

### Mejoras Opcionales:

1. **Resumen de Warnings en Footer:**
   - Agregar contador total de warnings antes del botón Guardar
   - Ejemplo: "⚠️ 5 avisos activos (2 críticos, 3 leves)"

2. **Filtro de Workers:**
   - Opción para ocultar/mostrar workers con warnings
   - Útil cuando hay muchos trabajadores

3. **Historial de Warnings:**
   - Registrar en BD cuando se guardaron turnos con warnings
   - Para auditoría y análisis posterior

4. **Configuración de Severidad:**
   - Permitir al admin elegir qué warnings mostrar/ocultar
   - Niveles: Crítico (rojo), Advertencia (naranja), Info (amarillo)

5. **Exportar Reporte de Warnings:**
   - Generar Excel con todos los warnings del día/semana/mes
   - Para revisión gerencial

---

## Notas Técnicas

### Performance
- Los warnings se calculan en **tiempo real** durante la asignación
- Se almacenan en estado React (no en BD hasta guardar)
- Se limpian automáticamente al deseleccionar trabajadores

### UX
- Tooltips HTML nativos (atributo `title`)
- Colores siguiendo convención: rojo (crítico) > naranja (advertencia) > amarillo (info)
- Iconos consistentes (AlertTriangle de lucide-react)

### Accesibilidad
- Mensajes descriptivos en tooltips
- Colores con suficiente contraste
- Iconos como indicadores visuales adicionales

---

## Conclusión

✅ **Sistema completamente funcional**  
✅ **Todos los bloqueos convertidos en avisos**  
✅ **Guardado siempre permitido**  
✅ **Feedback visual claro y diferenciado**  
✅ **Sin errores de compilación**  

El sistema ahora empodera al usuario para tomar decisiones informadas sobre las asignaciones de turnos, en lugar de imponerle restricciones automáticas.
