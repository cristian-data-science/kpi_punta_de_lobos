# Fix: Agrupar Violaciones por Trabajador en Header

**Fecha:** 1 de octubre de 2025  
**Rama:** pre-prod  
**Issue:** Múltiples alertas en header para el mismo trabajador cuando tiene varias violaciones  
**Estado:** ✅ SOLUCIONADO

---

## 🐛 Problema

Cuando un trabajador tiene **múltiples combinaciones no permitidas**, aparecían **múltiples alertas separadas** en el header del modal.

### Ejemplo del Problema

**Escenario:**
- Felipe Vallejos tiene **1º + 2º + 3º turno**
- Configuración: 
  - 1º+2º NO permitido
  - 2º+3º NO permitido

**ANTES (múltiples alertas):**
```
⚠️ Avisos (no bloquean guardado)

⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno el mismo día

⚠️ FELIPE VALLEJOS: No se permite la combinación 2º Turno + 3º Turno el mismo día
```

### Por Qué Pasaba

La función `validateCurrentAssignments()` iteraba sobre **cada turno** del trabajador:

1. **Valida 1º turno** → Detecta combinación con 2º → Crea alerta
2. **Valida 2º turno** → Detecta combinación con 3º → Crea OTRA alerta
3. **Valida 3º turno** → Ya detectado antes

Resultado: **2 alertas separadas** para Felipe, cuando debería ser **1 alerta** con ambas violaciones.

---

## ✅ Solución Implementada

### Nuevo Enfoque: Agrupar por Trabajador

En lugar de crear una alerta por cada validación fallida, ahora:
1. **Recolectar** todas las violaciones por trabajador
2. **Agrupar** mensajes del mismo trabajador
3. **Deduplicar** mensajes idénticos
4. **Crear UNA alerta** por trabajador con todos sus mensajes

### Implementación

```javascript
// 🆕 NUEVO: Agrupar violaciones por trabajador
const workerViolations = {} // { trabajadorId: [messages] }

Object.entries(shiftAssignments).forEach(([turnoTipo, trabajadores]) => {
  trabajadores.forEach(trabajadorId => {
    const worker = workers.find(w => w.id === trabajadorId)
    if (!worker) return

    const validation = validateTurnosRules(...)

    if (!validation.valid) {
      // Inicializar objeto para trabajador si no existe
      if (!workerViolations[trabajadorId]) {
        workerViolations[trabajadorId] = {
          worker: worker,
          messages: []
        }
      }
      
      // Solo agregar mensaje si no existe ya (deduplicar)
      if (!workerViolations[trabajadorId].messages.includes(validation.message)) {
        workerViolations[trabajadorId].messages.push(validation.message)
      }
    }
  })
})

// Crear UNA alerta por trabajador con todos sus mensajes
Object.entries(workerViolations).forEach(([trabajadorId, data]) => {
  const messagesText = data.messages.length === 1 
    ? data.messages[0]
    : data.messages.join(' | ')
  
  allAlerts.push({
    id: `${trabajadorId}-violations`,
    type: 'warning',
    message: `${formatWorkerName(data.worker.nombre)}: ${messagesText}`
  })
})
```

### Estructura de Datos

**workerViolations:**
```javascript
{
  'uuid-felipe-123': {
    worker: { id: 'uuid-felipe-123', nombre: 'Felipe Vallejos', ... },
    messages: [
      'No se permite la combinación 1º Turno + 2º Turno el mismo día',
      'No se permite la combinación 2º Turno + 3º Turno el mismo día'
    ]
  },
  'uuid-juan-456': {
    worker: { id: 'uuid-juan-456', nombre: 'Juan López', ... },
    messages: [
      'El trabajador tuvo 3º turno ayer. Hoy solo puede tener: 2º Turno'
    ]
  }
}
```

---

## 🎨 Resultado Visual

### ANTES del Fix

```
┌────────────────────────────────────────────────────────┐
│ ⚠️ Avisos (no bloquean guardado)                      │
│                                                        │
│ ⚠️ FELIPE VALLEJOS: No se permite 1º + 2º mismo día  │
│                                                        │
│ ⚠️ FELIPE VALLEJOS: No se permite 2º + 3º mismo día  │
│    ↑ Duplicado del mismo trabajador                   │
└────────────────────────────────────────────────────────┘
```

### DESPUÉS del Fix

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Avisos (no bloquean guardado)                                          │
│                                                                            │
│ ⚠️ FELIPE VALLEJOS: No se permite 1º + 2º mismo día |                    │
│                     No se permite 2º + 3º mismo día                       │
│    ↑ Una sola alerta con ambas violaciones separadas por |               │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Test 1: Una Violación por Trabajador

**Escenario:**
- Felipe tiene 1º + 2º turno
- Configuración: 1º+2º NO permitido

**Resultado Esperado:**
```
⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno el mismo día
```

✅ Una sola línea, sin duplicados

---

### Test 2: Dos Violaciones por Trabajador

**Escenario:**
- Felipe tiene 1º + 2º + 3º turno
- Configuración: 1º+2º NO permitido, 2º+3º NO permitido

**Resultado Esperado:**
```
⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno el mismo día | No se permite la combinación 2º Turno + 3º Turno el mismo día
```

✅ Una sola línea con ambas violaciones separadas por " | "

---

### Test 3: Múltiples Trabajadores con Violaciones

**Escenario:**
- Felipe: 1º + 2º turno (1º+2º NO permitido)
- Juan: 3º turno ayer, 1º turno hoy (violación día siguiente)
- María: 4º trabajador en 1º turno (límite: 3)

**Resultado Esperado:**
```
⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno el mismo día

⚠️ JUAN LÓPEZ: El trabajador tuvo 3º turno ayer. Hoy solo puede tener: 2º Turno

⚠️ MARÍA SOTO: Límite alcanzado para 1º Turno: máximo 3 trabajadores
```

✅ Una alerta por trabajador, sin duplicados

---

## 📊 Comparación Detallada

### Caso Complejo: 3 Turnos + 3 Violaciones

**Setup:**
- Trabajador: Felipe Vallejos
- Turnos asignados: 1º + 2º + 3º
- Configuración:
  - 1º+2º NO permitido
  - 1º+3º NO permitido
  - 2º+3º NO permitido

**ANTES (3 alertas separadas):**
```
⚠️ Avisos (no bloquean guardado)

⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno el mismo día

⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 3º Turno el mismo día

⚠️ FELIPE VALLEJOS: No se permite la combinación 2º Turno + 3º Turno el mismo día
```

**DESPUÉS (1 alerta con 3 violaciones):**
```
⚠️ Avisos (no bloquean guardado)

⚠️ FELIPE VALLEJOS: No se permite la combinación 1º Turno + 2º Turno el mismo día | 
                     No se permite la combinación 1º Turno + 3º Turno el mismo día | 
                     No se permite la combinación 2º Turno + 3º Turno el mismo día
```

---

## 💡 Ventajas del Nuevo Enfoque

### 1. Menos Ruido Visual
- Antes: 3 líneas de alerta para el mismo trabajador
- Ahora: 1 línea con toda la información

### 2. Mejor Legibilidad
- Inmediatamente se ve QUÉ trabajadores tienen problemas
- No hay que buscar entre múltiples alertas del mismo trabajador

### 3. Escalable
- Si un trabajador tiene 5 violaciones, sigue siendo 1 alerta (no 5)

### 4. Consistente
- Un trabajador = Una alerta (regla simple)

### 5. Deduplicación Automática
- Si la misma violación se detecta dos veces, solo aparece una vez

---

## 🔧 Detalles Técnicos

### Deduplicación de Mensajes

```javascript
// Solo agregar mensaje si no existe ya
if (!workerViolations[trabajadorId].messages.includes(validation.message)) {
  workerViolations[trabajadorId].messages.push(validation.message)
}
```

**Por qué es necesario:**
- Si un trabajador tiene 1º+2º, se valida desde 1º (detecta 1º+2º) Y desde 2º (detecta 2º+1º)
- Ambas validaciones retornan el mismo mensaje: "No se permite 1º + 2º"
- Sin deduplicación: aparecería dos veces en la misma alerta

### Separador de Mensajes

```javascript
const messagesText = data.messages.length === 1 
  ? data.messages[0]
  : data.messages.join(' | ')
```

**Opciones consideradas:**
- `\n` (salto de línea): Rompe el layout del header
- `, ` (coma): Se confunde con el texto del mensaje
- ` | ` (pipe): ✅ Separador visual claro y compacto

### Orden de Mensajes

Los mensajes aparecen en el orden en que fueron detectados durante la iteración:
1. Validaciones del 1º turno
2. Validaciones del 2º turno
3. Validaciones del 3º turno

---

## 📁 Archivos Modificados

**src/components/AddShiftModal.jsx**
- Función `validateCurrentAssignments()` (líneas ~150-200)
- Cambio de `seenWorkerAlerts` Set a `workerViolations` Object
- Nueva lógica de agrupación por trabajador
- Deduplicación de mensajes dentro del mismo trabajador

**Total:**
- ~30 líneas modificadas
- 0 breaking changes
- Compatible con sistema existente

---

## ✅ Checklist de Verificación

- [x] Una alerta por trabajador (sin duplicados de trabajador)
- [x] Múltiples violaciones agrupadas con separador " | "
- [x] Deduplicación de mensajes idénticos dentro del mismo trabajador
- [x] Trabajadores sin violaciones no aparecen en alertas
- [x] Compatibilidad con sistema de validación existente
- [x] No hay errores de compilación

---

## 🎯 Resumen Ejecutivo

**Problema:** Múltiples alertas separadas para el mismo trabajador cuando tenía varias violaciones.

**Solución:** Agrupar todas las violaciones de un trabajador en UNA sola alerta con mensajes separados por " | ".

**Resultado:** 
- Interfaz más limpia y legible
- Fácil identificar QUÉ trabajadores tienen problemas
- Escalable a cualquier número de violaciones por trabajador

**Impacto:** Mejora significativa en UX sin cambios en la lógica de validación.

---

**Estado:** ✅ COMPLETADO  
**Testing:** Listo para pruebas manuales  
**Deployment:** NO subir a Git hasta confirmación explícita
