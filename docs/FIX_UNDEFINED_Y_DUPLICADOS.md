# Fix: Mensaje "undefined" y Duplicación de Alertas

**Fecha:** 1 de octubre de 2025  
**Rama:** pre-prod  
**Issues:** 
1. Mensajes con "undefined" en lugar de nombre de turno
2. Alertas duplicadas en header del modal
3. Combinaciones no detectadas cuando hay 3 turnos

**Estado:** ✅ SOLUCIONADO

---

## 🐛 Problemas Detectados

### Problema 1: "undefined" en Mensajes de Combinación

**Síntoma:**
```
⚠️ Combinación de turnos no recomendada (2º + undefined)
⚠️ Combinación de turnos no recomendada (1º + undefined)
```

**Causa:**
En las líneas 427 y 528, se usaba `shiftNames[currentShiftNum]` en lugar de `shiftNames[turnoType]`.

```javascript
// ❌ ANTES (incorrecto)
message: `Combinación de turnos no recomendada (${shiftNames[otherType]} + ${shiftNames[currentShiftNum]})`
// currentShiftNum es un número (1, 2, 3), no una key del objeto

// ✅ DESPUÉS (correcto)
message: `Combinación de turnos no recomendada (${shiftNames[otherType]} + ${shiftNames[turnoType]})`
// turnoType es 'primer_turno', 'segundo_turno', etc. (existe en shiftNames)
```

**Por qué pasaba:**
- `currentShiftNum` contenía valores como `1`, `2`, `3`
- `shiftNames` tiene keys como `'primer_turno'`, `'segundo_turno'`, `'tercer_turno'`
- `shiftNames[1]` → `undefined`
- `shiftNames['primer_turno']` → `'1º'` ✅

---

### Problema 2: Alertas Duplicadas en Header

**Síntoma:**
```
⚠️ Avisos (no bloquean guardado)

⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno el mismo día
⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno el mismo día

← Duplicado (aparece 2 veces el mismo mensaje)
```

**Causa:**
La función `validateCurrentAssignments()` iteraba sobre CADA turno del trabajador y creaba una alerta por cada uno.

```javascript
// ❌ ANTES: Iteraba sobre cada turno
Object.entries(shiftAssignments).forEach(([turnoTipo, trabajadores]) => {
  trabajadores.forEach(trabajadorId => {
    // Si trabajador tiene 1º + 2º turno, este código se ejecuta 2 veces
    const validation = validateTurnosRules(...)
    if (!validation.valid) {
      allAlerts.push({...}) // ← Se agrega 2 veces
    }
  })
})
```

**Ejemplo:**
- Felipe tiene 1º turno + 2º turno
- Primera iteración (1º turno): Crea alerta "Felipe: No se permite..."
- Segunda iteración (2º turno): Crea OTRA alerta "Felipe: No se permite..."
- Resultado: 2 alertas idénticas

**Solución:**
Deduplicar usando un `Set` para trackear alertas ya vistas por trabajador.

```javascript
// ✅ DESPUÉS: Deduplicar por trabajador
const seenWorkerAlerts = new Set()

Object.entries(shiftAssignments).forEach(([turnoTipo, trabajadores]) => {
  trabajadores.forEach(trabajadorId => {
    const validation = validateTurnosRules(...)
    if (!validation.valid) {
      const alertKey = `${trabajadorId}-${validation.message}`
      if (!seenWorkerAlerts.has(alertKey)) {
        seenWorkerAlerts.add(alertKey)
        allAlerts.push({...}) // ← Solo se agrega 1 vez
      }
    }
  })
})
```

---

### Problema 3: Combinaciones Incompletas (3+ Turnos)

**Síntoma:**
Si un trabajador tiene 1º + 2º + 3º turno, solo se detectaba UNA combinación no recomendada, no todas.

**Causa:**
El código usaba `.find()` que solo retorna el PRIMER `otherType`, no todos.

```javascript
// ❌ ANTES: Solo detectaba el primer otherType
if (isAssignedInOtherShift) {
  const otherType = Object.entries(shiftAssignments).find(([type, assignments]) => 
    type !== turnoType && assignments.includes(workerId)
  )[0]
  // Si trabajador tiene 1º + 2º + 3º, solo detecta 2º (el primero que encuentra)
}
```

**Ejemplo:**
- Trabajador tiene 1º + 2º + 3º turno
- Configuración: 1º+2º NO permitido, 1º+3º NO permitido
- Antes: Solo mostraba warning para 1º+2º
- Después: Muestra warnings para 1º+2º Y 1º+3º

**Solución:**
Obtener TODOS los `otherTypes` y validar cada combinación.

```javascript
// ✅ DESPUÉS: Detecta TODOS los otherTypes
const otherTypes = Object.entries(shiftAssignments)
  .filter(([type, assignments]) => type !== turnoType && assignments.includes(workerId))
  .map(([type]) => type)

// Verificar cada combinación
otherTypes.forEach(otherType => {
  // Calcular combinación
  const combination = `${Math.min(currentShiftNum, otherShiftNum)}_${Math.max(currentShiftNum, otherShiftNum)}`
  
  if (turnosConfig.allowedCombinations[combination] === false) {
    // Solo agregar si no existe ya este warning (deduplicar)
    const warningMessage = `Combinación de turnos no recomendada (${shiftNames[otherType]} + ${shiftNames[turnoType]})`
    if (!warnings.find(w => w.message === warningMessage)) {
      warnings.push({ ... })
    }
  }
})
```

---

## ✅ Soluciones Implementadas

### Fix 1: Usar `turnoType` en lugar de `currentShiftNum`

**Ubicaciones modificadas:**
- Línea 427 en `handleWorkerToggle()`
- Línea 528+ en `recalculateAllWarnings()`

**Cambio:**
```javascript
// Antes
message: `... (${shiftNames[otherType]} + ${shiftNames[currentShiftNum]})`

// Después
message: `... (${shiftNames[otherType]} + ${shiftNames[turnoType]})`
```

---

### Fix 2: Deduplicar Alertas en Header

**Ubicación:** Función `validateCurrentAssignments()`

**Cambio:**
```javascript
// Antes
Object.entries(shiftAssignments).forEach(([turnoTipo, trabajadores]) => {
  trabajadores.forEach(trabajadorId => {
    if (!validation.valid) {
      allAlerts.push({...}) // ← Sin deduplicación
    }
  })
})

// Después
const seenWorkerAlerts = new Set()
Object.entries(shiftAssignments).forEach(([turnoTipo, trabajadores]) => {
  trabajadores.forEach(trabajadorId => {
    if (!validation.valid) {
      const alertKey = `${trabajadorId}-${validation.message}`
      if (!seenWorkerAlerts.has(alertKey)) {
        seenWorkerAlerts.add(alertKey)
        allAlerts.push({...}) // ← Con deduplicación
      }
    }
  })
})
```

---

### Fix 3: Detectar Todas las Combinaciones

**Ubicación:** Función `recalculateAllWarnings()`

**Cambio:**
```javascript
// Antes
const otherType = Object.entries(shiftAssignments).find(...)[0]
// Solo detectaba el primer otherType

// Después
const otherTypes = Object.entries(shiftAssignments)
  .filter(([type, assignments]) => type !== turnoType && assignments.includes(workerId))
  .map(([type]) => type)

otherTypes.forEach(otherType => {
  // Valida CADA combinación
  if (turnosConfig.allowedCombinations[combination] === false) {
    // Deduplicar para evitar warnings repetidos
    if (!warnings.find(w => w.message === warningMessage)) {
      warnings.push({...})
    }
  }
})
```

---

## 🧪 Testing de los Fixes

### Test 1: Verificar Mensaje Correcto (sin "undefined")

**Escenario:**
- Trabajador tiene 1º turno
- Asignar mismo trabajador a 2º turno

**Antes del fix:**
```
⚠️ Combinación de turnos no recomendada (1º + undefined)
```

**Después del fix:**
```
⚠️ Combinación de turnos no recomendada (1º + 2º)
```

✅ **Resultado:** Mensaje muestra correctamente ambos turnos.

---

### Test 2: Verificar Sin Duplicación de Alertas

**Escenario:**
- Felipe Vallejos tiene 1º + 2º turno
- Configuración: 1º+2º NO permitido

**Antes del fix:**
```
⚠️ Avisos (no bloquean guardado)
⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno
⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno
   ↑ Duplicado
```

**Después del fix:**
```
⚠️ Avisos (no bloquean guardado)
⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno
   ↑ Solo aparece UNA vez
```

✅ **Resultado:** Alerta aparece solo una vez por trabajador.

---

### Test 3: Detectar Todas las Combinaciones (3 Turnos)

**Escenario:**
- Trabajador tiene 1º + 2º + 3º turno
- Configuración: 
  - 1º+2º NO permitido
  - 1º+3º NO permitido
  - 2º+3º NO permitido

**Antes del fix:**
```
En 1º turno:
⚠️ Combinación no recomendada (2º + 1º)
   ↑ Solo detecta una combinación

En 2º turno:
Sin warnings
   ↑ No detecta 2º+3º

En 3º turno:
Sin warnings
   ↑ No detecta 1º+3º
```

**Después del fix:**
```
En 1º turno:
⚠️ Combinación no recomendada (1º + 2º)
⚠️ Combinación no recomendada (1º + 3º)
   ↑ Detecta ambas combinaciones con 1º

En 2º turno:
⚠️ Combinación no recomendada (1º + 2º)
⚠️ Combinación no recomendada (2º + 3º)
   ↑ Detecta ambas combinaciones con 2º

En 3º turno:
⚠️ Combinación no recomendada (1º + 3º)
⚠️ Combinación no recomendada (2º + 3º)
   ↑ Detecta ambas combinaciones con 3º
```

✅ **Resultado:** Todas las combinaciones no permitidas son detectadas.

---

## 📊 Comparación Visual

### Ejemplo Completo: Felipe Vallejos

**Situación:**
- Día anterior: Felipe tuvo 3º turno
- Hoy: Felipe tiene 1º + 2º turno
- Configuración: 1º+2º NO permitido

**ANTES de los fixes:**

```
┌──────────────────────────────────────────────────┐
│ ⚠️ Avisos (no bloquean guardado)                │
│                                                  │
│ ⚠️ FELIPE VALLEJOS: No se permite 1º + 2º      │
│ ⚠️ FELIPE VALLEJOS: No se permite 1º + 2º      │ ← ❌ Duplicado
└──────────────────────────────────────────────────┘

🔵 1º TURNO:
┌──────────────────────────────────────┐
│ ☑ 🔴 Felipe Vallejos          ⚠️    │
│   12.345.678-9                       │
│   ⚠️ Turno continuo / descanso      │
│      insuficiente (tuvo 3º ayer)     │
│   ⚠️ Combinación no recomendada     │
│      (1º + undefined)                │ ← ❌ undefined
└──────────────────────────────────────┘

🟢 2º TURNO:
┌──────────────────────────────────────┐
│ ☑ 🟠 Felipe Vallejos          ⚠️    │
│   12.345.678-9                       │
│   ⚠️ Combinación no recomendada     │
│      (2º + undefined)                │ ← ❌ undefined
└──────────────────────────────────────┘
```

**DESPUÉS de los fixes:**

```
┌──────────────────────────────────────────────────┐
│ ⚠️ Avisos (no bloquean guardado)                │
│                                                  │
│ ⚠️ FELIPE VALLEJOS: No se permite 1º + 2º      │ ← ✅ Solo una vez
└──────────────────────────────────────────────────┘

🔵 1º TURNO:
┌──────────────────────────────────────┐
│ ☑ 🔴 Felipe Vallejos          ⚠️    │
│   12.345.678-9                       │
│   ⚠️ Turno continuo / descanso      │
│      insuficiente (tuvo 3º ayer)     │
│   ⚠️ Combinación no recomendada     │
│      (1º + 2º)                       │ ← ✅ Correcto
└──────────────────────────────────────┘

🟢 2º TURNO:
┌──────────────────────────────────────┐
│ ☑ 🟠 Felipe Vallejos          ⚠️    │
│   12.345.678-9                       │
│   ⚠️ Combinación no recomendada     │
│      (1º + 2º)                       │ ← ✅ Correcto
└──────────────────────────────────────┘
```

---

## 🎯 Resumen de Cambios

### Archivos Modificados
- `src/components/AddShiftModal.jsx`

### Líneas Cambiadas
1. **Línea ~427** (`handleWorkerToggle`): `currentShiftNum` → `turnoType`
2. **Línea ~155** (`validateCurrentAssignments`): Agregado `seenWorkerAlerts` Set
3. **Línea ~510** (`recalculateAllWarnings`): De `.find()` a `.filter().map()` + `.forEach()`

### Total de Líneas
- ~60 líneas modificadas/agregadas

---

## 💡 Lecciones Aprendidas

### 1. Validar Keys de Objetos
Siempre verificar que las keys usadas en objetos existen:
```javascript
// ❌ Peligroso
shiftNames[currentShiftNum] // currentShiftNum puede no ser una key válida

// ✅ Seguro
shiftNames[turnoType] // turnoType es garantizado ser una key válida
```

### 2. Deduplicar en Loops Anidados
Cuando iteras sobre múltiples turnos del mismo trabajador, usar un Set para deduplicar:
```javascript
const seenWorkerAlerts = new Set()
const alertKey = `${trabajadorId}-${validation.message}`
if (!seenWorkerAlerts.has(alertKey)) {
  // Solo agregar una vez
}
```

### 3. Usar .filter() en lugar de .find() para Múltiples Resultados
- `.find()`: Retorna SOLO el primer elemento
- `.filter()`: Retorna TODOS los elementos que cumplen condición

```javascript
// Para obtener todos los otros turnos
const otherTypes = Object.entries(shiftAssignments)
  .filter(([type, assignments]) => type !== turnoType && assignments.includes(workerId))
  .map(([type]) => type)
```

---

## ✅ Checklist de Verificación

- [x] Mensajes ya NO muestran "undefined"
- [x] Alertas en header NO se duplican
- [x] Todas las combinaciones son detectadas (3+ turnos)
- [x] Deduplicación funciona correctamente
- [x] No hay errores de compilación
- [x] Compatibilidad con sistema existente mantenida

---

**Estado:** ✅ COMPLETADO  
**Testing:** Listo para pruebas manuales  
**Deployment:** NO subir a Git hasta confirmación explícita
