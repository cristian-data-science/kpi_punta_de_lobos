# Fix: Warnings de Turnos Persistentes en Fechas Incorrectas

**Fecha:** 1 de octubre de 2025  
**Rama:** pre-prod  
**Issue:** Warnings se mostraban en fechas donde no correspondía  
**Estado:** ✅ SOLUCIONADO

---

## 🐛 Problema Detectado

### Síntoma
Cuando un trabajador tenía un warning legítimo (ej: "Turno continuo / descanso insuficiente" porque tuvo 3º turno ayer), el warning **se quedaba pegado** y aparecía en fechas futuras donde ya no aplicaba la restricción.

### Ejemplo del Bug
```
Día 30 sept: Juan López tiene 3º turno
Día 1 oct: Se asigna Juan López a 1º turno
         → ✅ WARNING aparece correctamente: "Turno continuo / descanso insuficiente"

Día 8 oct: Se abre modal para esta fecha
         → ❌ BUG: WARNING sigue apareciendo para Juan López
         → ❌ Pero ya pasó 1 semana, no debería aparecer
```

### Solución Temporal (antes del fix)
El usuario tenía que:
1. Hacer clic en el trabajador (deseleccionar)
2. Hacer clic nuevamente (reseleccionar)
3. El warning desaparecía

---

## 🔍 Causa Raíz

### Problema 1: Warnings No Se Limpiaban al Cambiar Fecha
```javascript
// ❌ ANTES: No había useEffect para limpiar warnings
useEffect(() => {
  if (isOpen) {
    loadCalendarConfig()
    loadCurrentRates()
    loadExistingAssignments()
    loadAllTurnos()
  }
}, [isOpen, selectedDate, existingShifts])
// Los workerWarnings se mantenían aunque cambió selectedDate
```

### Problema 2: Warnings Se Calculaban Solo en handleWorkerToggle
Los warnings se calculaban únicamente cuando el usuario **hacía clic** en un trabajador (toggle), no cuando cambiaba la fecha del modal.

**Flujo del Bug:**
```
1. Usuario abre modal día 1 oct
2. Asigna Juan López → warning se calcula (correcto)
3. Usuario cierra modal
4. Usuario abre modal día 8 oct
5. loadExistingAssignments() carga las asignaciones
6. ❌ Pero workerWarnings NO se recalcula con la nueva fecha
7. ❌ Warning obsoleto sigue en estado
```

---

## ✅ Solución Implementada

### Cambio 1: Limpiar Warnings al Cambiar Fecha
```javascript
// ✅ NUEVO: useEffect que limpia warnings cuando cambia selectedDate
useEffect(() => {
  if (!selectedDate) return
  
  // Limpiar warnings existentes
  setWorkerWarnings({})
  
  // Recalcular warnings para trabajadores ya asignados
  if (Object.keys(shiftAssignments).length > 0) {
    recalculateAllWarnings()
  }
}, [selectedDate])
```

**Qué hace:**
1. Detecta cuando `selectedDate` cambia
2. Limpia completamente el estado `workerWarnings`
3. Llama a `recalculateAllWarnings()` para recalcular con la nueva fecha

---

### Cambio 2: Nueva Función recalculateAllWarnings()
```javascript
// ✅ NUEVA FUNCIÓN: Recalcula todos los warnings con la fecha actual
const recalculateAllWarnings = () => {
  if (!selectedDate) return
  
  const newWarnings = {}
  const dateKey = selectedDate.toISOString().split('T')[0] // ← Fecha ACTUAL
  
  // Recorrer todas las asignaciones actuales
  Object.entries(shiftAssignments).forEach(([turnoType, workerIds]) => {
    workerIds.forEach(workerId => {
      const warnings = []
      
      // 1. Detectar exceso de límite
      // ... código ...
      
      // 2. Detectar combinación no recomendada
      // ... código ...
      
      // 3. Detectar turno continuo - CRÍTICO: usar fecha actual
      if (turnosConfig.nextDayRules.enforceNextDayRule) {
        const nextDayValidation = validateNextDayRulesLocal(
          workerId, 
          dateKey,  // ← Usa selectedDate, NO fecha antigua
          turnoType
        )
        if (nextDayValidation.warning) {
          warnings.push({
            type: nextDayValidation.warningType,
            message: nextDayValidation.message
          })
        }
      }
      
      // Guardar warnings si hay alguno
      if (warnings.length > 0) {
        const warningKey = `${turnoType}-${workerId}`
        newWarnings[warningKey] = warnings
      }
    })
  })
  
  setWorkerWarnings(newWarnings)
}
```

**Qué hace:**
1. Toma la fecha **actual** del `selectedDate` (no datos antiguos)
2. Recorre todas las asignaciones de trabajadores
3. Recalcula los 3 tipos de warnings:
   - Exceso de límite
   - Combinación no recomendada
   - **Turno continuo** (el más importante para este bug)
4. Usa `validateNextDayRulesLocal(workerId, dateKey, turnoType)` con la fecha actual
5. Actualiza el estado `workerWarnings` con los resultados frescos

---

## 🧪 Testing del Fix

### Caso de Prueba 1: Turno Continuo

**Setup:**
```
Día 30 sept: Juan López tiene 3º turno (ya guardado en BD)
```

**Test:**
1. Abrir modal para **1 de octubre**
2. Asignar Juan López a 1º turno
3. **Verificar:** ✅ Warning aparece (correcto, tuvo 3º ayer)
4. Cerrar modal
5. Abrir modal para **8 de octubre** (1 semana después)
6. **Verificar:** ✅ Warning NO aparece (correcto, ya pasó el tiempo)

**Resultado Esperado:**
- ✅ Warning aparece solo en día 1 oct
- ✅ Warning NO aparece en día 8 oct
- ✅ No se necesita hacer clic/desclic en el trabajador

---

### Caso de Prueba 2: Cambio Rápido de Fechas

**Test:**
1. Abrir modal para día X
2. Asignar trabajadores con warnings
3. Cambiar a día X+7 (semana siguiente)
4. **Verificar:** Warnings se recalculan automáticamente
5. Cambiar a día X+14 (2 semanas después)
6. **Verificar:** Warnings se recalculan de nuevo

**Resultado Esperado:**
- ✅ Cada cambio de fecha limpia warnings antiguos
- ✅ Cada cambio de fecha recalcula warnings con fecha nueva
- ✅ Solo se ven warnings que corresponden a la fecha actual

---

### Caso de Prueba 3: Combinación de Warnings

**Setup:**
```
Configuración: 1º + 3º NO permitido
Límite 1º turno: 3 trabajadores
```

**Test:**
1. Día 1 oct: Asignar 4 trabajadores al 1º turno
2. Uno de ellos (Pedro) también en 3º turno
3. Verificar warnings para Pedro:
   - ⚠️ Combinación no recomendada
   - ⚠️ Excede el máximo configurado (3)
4. Cambiar a día 8 oct
5. **Verificar:** Pedro sigue teniendo los mismos warnings
   - ✅ Porque NO dependen de fecha (son reglas de mismo día)

**Resultado Esperado:**
- ✅ Warnings de combinación persisten (correcto)
- ✅ Warnings de límite persisten (correcto)
- ✅ Warning de turno continuo desaparece si no aplica (correcto)

---

## 📊 Comparación Antes vs Después

### Antes del Fix

| Acción | Warnings Mostrados | Correcto |
|--------|-------------------|----------|
| Abrir modal día 1 oct (Juan tuvo 3º ayer) | ⚠️ Turno continuo | ✅ Sí |
| Cambiar a día 8 oct (sin cerrar modal) | ⚠️ Turno continuo | ❌ **NO** |
| Cerrar y abrir modal día 8 oct | ⚠️ Turno continuo | ❌ **NO** |
| Clic/desclic en Juan | Sin warning | ✅ Sí (workaround) |

### Después del Fix

| Acción | Warnings Mostrados | Correcto |
|--------|-------------------|----------|
| Abrir modal día 1 oct (Juan tuvo 3º ayer) | ⚠️ Turno continuo | ✅ Sí |
| Cambiar a día 8 oct (sin cerrar modal) | Sin warning | ✅ **Sí** |
| Cerrar y abrir modal día 8 oct | Sin warning | ✅ **Sí** |
| Clic/desclic en Juan | Sin warning | ✅ Sí |

---

## 🔧 Detalles Técnicos

### useEffect Dependencies
```javascript
useEffect(() => {
  // ... código de limpieza y recálculo ...
}, [selectedDate])  // ← Solo depende de selectedDate
```

**Por qué esta dependencia:**
- `selectedDate` cambia → warnings deben recalcularse
- `shiftAssignments` NO está en dependencias para evitar loops infinitos
- La función `recalculateAllWarnings()` lee el estado actual de `shiftAssignments`

### Orden de Ejecución
```
1. Usuario cambia fecha en calendario
2. selectedDate se actualiza
3. useEffect detecta cambio
4. setWorkerWarnings({}) limpia warnings antiguos
5. recalculateAllWarnings() lee shiftAssignments actual
6. validateNextDayRulesLocal() usa la nueva fecha (selectedDate)
7. setWorkerWarnings(newWarnings) establece warnings frescos
8. Componente re-renderiza con warnings correctos
```

---

## 💡 Lecciones Aprendidas

### 1. Estado Debe Sincronizarse con Props/Dependencias
Los `workerWarnings` dependían de `selectedDate` pero no se actualizaban cuando esta cambiaba.

**Regla:** Si un estado derivado depende de un prop/estado, debe tener un useEffect para sincronizarse.

### 2. Validaciones Deben Usar Datos Actuales
`validateNextDayRulesLocal()` debe recibir la fecha actual como parámetro, no asumir una fecha global.

**Regla:** Pasar parámetros explícitos en lugar de usar closures con valores antiguos.

### 3. Testing de Casos Temporales
Los bugs relacionados con fechas son difíciles de detectar sin testing específico de cambios de fecha.

**Regla:** Siempre testear cambios de fecha/tiempo en componentes que dependan de ellos.

---

## 📝 Checklist de Verificación

- [x] Warnings se limpian al cambiar `selectedDate`
- [x] Warnings se recalculan con la nueva fecha
- [x] `validateNextDayRulesLocal()` recibe `dateKey` como parámetro
- [x] No hay loops infinitos en useEffect
- [x] Warnings solo aparecen cuando corresponde por fecha
- [x] No se necesita workaround (clic/desclic) para limpiar warnings
- [x] Combinación y límite siguen funcionando correctamente

---

## 🎯 Resumen Ejecutivo

**Problema:** Warnings de "turno continuo" aparecían en fechas incorrectas.

**Causa:** Estado `workerWarnings` no se actualizaba al cambiar `selectedDate`.

**Solución:** 
1. useEffect que limpia warnings cuando cambia fecha
2. Nueva función `recalculateAllWarnings()` que recalcula con fecha actual

**Resultado:** Warnings solo aparecen cuando corresponde, sin necesidad de workarounds.

**Impacto:** 1 archivo modificado, ~90 líneas agregadas, 0 breaking changes.

---

**Archivo Modificado:**
- `src/components/AddShiftModal.jsx`

**Commits:**
- feat: Fix warnings persistentes en fechas incorrectas
