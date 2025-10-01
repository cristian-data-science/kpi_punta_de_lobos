# Guía Visual de Uso - Sistema de Avisos de Turnos

## 📋 Índice
1. [Antes vs Ahora](#antes-vs-ahora)
2. [Casos de Uso](#casos-de-uso)
3. [Ejemplos Visuales](#ejemplos-visuales)
4. [Testing Manual](#testing-manual)

---

## 🔄 Antes vs Ahora

### Caso 1: Turno Continuo (3º ayer → 1º hoy)

#### ❌ ANTES (Bloqueante)
```
Usuario intenta asignar Juan López a 1º turno (tuvo 3º ayer)
    ↓
[ALERT MODAL]: "El trabajador tuvo 3º turno ayer. 
                Hoy solo puede tener: 2º Turno"
    ↓
❌ Asignación BLOQUEADA
❌ Modal de alert interrumpe el flujo
❌ Usuario no puede continuar
```

#### ✅ AHORA (Aviso Visual)
```
Usuario asigna Juan López a 1º turno (tuvo 3º ayer)
    ↓
✅ Asignación PERMITIDA inmediatamente
    ↓
Visualización:
┌────────────────────────────────────────┐
│ ☑ 🔴 Juan López              ⚠️       │ ← Fondo ROJO claro
│   12.345.678-9                         │
│   ⚠️ Turno continuo / descanso        │ ← Mensaje visible
│      insuficiente (tuvo 3º ayer)       │
│                            $20.000     │
└────────────────────────────────────────┘

Tooltip (hover): "Turno continuo / descanso insuficiente (tuvo 3º turno ayer)"

✅ Botón GUARDAR habilitado
✅ Usuario decide si continuar o no
```

---

### Caso 2: Combinación No Recomendada (1º + 3º)

#### ❌ ANTES (Bloqueante)
```
Usuario intenta asignar Pedro García a 3º turno 
(ya tiene 1º turno)
    ↓
[ALERT MODAL]: "No se permite la combinación de 
                1º Turno y 3º Turno para el mismo trabajador"
    ↓
❌ Asignación BLOQUEADA
❌ Modal de alert interrumpe el flujo
❌ Pedro García NO aparece seleccionado en 3º turno
```

#### ✅ AHORA (Aviso Visual)
```
Usuario asigna Pedro García a 3º turno 
(ya tiene 1º turno)
    ↓
✅ Asignación PERMITIDA inmediatamente
    ↓
Visualización en AMBOS turnos:

1º TURNO:
┌────────────────────────────────────────┐
│ ☑ 🟠 Pedro García            ⚠️       │ ← Fondo NARANJA claro
│   98.765.432-1                         │
│   ⚠️ Combinación no recomendada       │
│      (1º + 3º)                         │
│                            $20.000     │
└────────────────────────────────────────┘

3º TURNO:
┌────────────────────────────────────────┐
│ ☑ 🟠 Pedro García            ⚠️       │ ← Fondo NARANJA claro
│   98.765.432-1                         │
│   ⚠️ Combinación no recomendada       │
│      (1º + 3º)                         │
│                            $22.500     │
└────────────────────────────────────────┘

✅ Botón GUARDAR habilitado
✅ Usuario decide si es necesario mantener ambos turnos
```

---

### Caso 3: Exceso de Cupos (límite: 3, actual: 4)

#### ❌ ANTES (Bloqueante)
```
Usuario intenta asignar 4º trabajador al 1º turno
(límite configurado: 3)
    ↓
[ALERT MODAL]: "Máximo 3 trabajadores por turno"
    ↓
❌ Asignación BLOQUEADA
❌ Modal de alert interrumpe el flujo
❌ 4º trabajador NO se agrega
```

#### ✅ AHORA (Aviso Visual)
```
Usuario asigna 4º trabajador al 1º turno
(límite configurado: 3)
    ↓
✅ Asignación PERMITIDA inmediatamente
    ↓
Visualización del 4º trabajador:
┌────────────────────────────────────────┐
│ ☑ 🟡 María Soto              ⚠️       │ ← Fondo AMARILLO claro
│   11.222.333-4                         │
│   ⚠️ Excede el máximo configurado (3) │
│                            $20.000     │
└────────────────────────────────────────┘

Header del 1º turno muestra:
┌────────────────────────────────────────┐
│ 🔵 1º Turno                   $20.000  │
│ Asignados: 4/5                ⚠️       │ ← Indicador de exceso
│ Total: $80.000                         │
└────────────────────────────────────────┘

✅ Botón GUARDAR habilitado
✅ Usuario puede agregar más si es necesario
```

---

## 📚 Casos de Uso

### Caso de Uso 1: Emergencia Operacional
**Escenario:** Falta personal y se necesita que un trabajador haga 3º turno seguido de 1º turno.

**Antes:**
- ❌ Sistema bloqueaba la asignación
- ❌ Había que modificar manualmente la BD
- ❌ Pérdida de tiempo en emergencia

**Ahora:**
- ✅ Se puede asignar inmediatamente
- ✅ Sistema muestra aviso en ROJO: "turno continuo / descanso insuficiente"
- ✅ Queda registrado que fue una situación excepcional
- ✅ Manager puede revisar y aprobar después

---

### Caso de Uso 2: Trabajador Multifuncional
**Escenario:** Un supervisor necesita cubrir tanto 1º como 3º turno en el mismo día.

**Antes:**
- ❌ Sistema bloqueaba por "combinación no permitida"
- ❌ Había que desactivar reglas temporalmente
- ❌ Riesgo de olvidar reactivar reglas

**Ahora:**
- ✅ Se puede asignar ambos turnos
- ✅ Sistema muestra aviso en NARANJA: "combinación no recomendada"
- ✅ Reglas permanecen activas
- ✅ Decisión queda en manos del manager

---

### Caso de Uso 3: Día de Alta Demanda
**Escenario:** Evento especial requiere 6 trabajadores en 1º turno (límite normal: 3).

**Antes:**
- ❌ No se podían asignar más de 3 trabajadores
- ❌ Había que cambiar configuración global
- ❌ Riesgo de dejar límite alto permanentemente

**Ahora:**
- ✅ Se pueden asignar los 6 trabajadores necesarios
- ✅ Sistema muestra aviso en AMARILLO para trabajadores 4, 5 y 6
- ✅ Configuración global permanece en 3
- ✅ Excepción es visible y justificable

---

## 🎨 Ejemplos Visuales

### Modal Completo con Múltiples Avisos

```
╔══════════════════════════════════════════════════════════════════╗
║  🕐 Asignar Turnos                                            ✕  ║
║  lunes, 30 de septiembre de 2025                                 ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  ℹ️ Información del Sistema                                      ║
║  • PROGRAMADO: Tarifas del sistema                               ║
║  • COMPLETADO: Pago real registrado                              ║
║  • Avisos: Los avisos NO bloquean el guardado                    ║
║                                                                   ║
║  ⚠️ Avisos (no bloquean guardado)                                ║
║  ⚠️ Juan López: Turno continuo / descanso insuficiente          ║
║  ⚠️ Pedro García: Combinación de turnos no recomendada          ║
║  ⚠️ María Soto: Excede el máximo configurado (3)                ║
║                                                                   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  🔵 1º TURNO          $20.000    [Eliminar todos]                ║
║  Asignados: 4/5                                                  ║
║  Total: $80.000                                                  ║
║  ┌────────────────────────────────────────────────────┐         ║
║  │ ☑ ⚪ Carlos Muñoz                    $20.000       │ ← Normal║
║  │   15.678.234-5                    [PROGRAMADO]     │         ║
║  ├────────────────────────────────────────────────────┤         ║
║  │ ☑ 🔴 Juan López            ⚠️       $20.000       │ ← ROJO  ║
║  │   12.345.678-9                    [PROGRAMADO]     │         ║
║  │   ⚠️ Turno continuo / descanso insuficiente       │         ║
║  ├────────────────────────────────────────────────────┤         ║
║  │ ☑ 🟠 Pedro García          ⚠️       $20.000       │ ← NARANJA║
║  │   98.765.432-1                    [PROGRAMADO]     │         ║
║  │   ⚠️ Combinación no recomendada (1º + 3º)         │         ║
║  ├────────────────────────────────────────────────────┤         ║
║  │ ☑ 🟡 María Soto            ⚠️       $20.000       │ ← AMARILLO║
║  │   11.222.333-4                    [PROGRAMADO]     │         ║
║  │   ⚠️ Excede el máximo configurado (3)             │         ║
║  └────────────────────────────────────────────────────┘         ║
║                                                                   ║
║  🟢 2º TURNO          $20.000                                    ║
║  Asignados: 2/5                                                  ║
║  Total: $40.000                                                  ║
║  ┌────────────────────────────────────────────────────┐         ║
║  │ ☑ Ana Torres                        $20.000       │         ║
║  │ ☑ Diego Rojas                       $20.000       │         ║
║  └────────────────────────────────────────────────────┘         ║
║                                                                   ║
║  🟠 3º TURNO          $22.500                                    ║
║  Asignados: 1/5                                                  ║
║  Total: $22.500                                                  ║
║  ┌────────────────────────────────────────────────────┐         ║
║  │ ☑ 🟠 Pedro García          ⚠️       $22.500       │         ║
║  │   98.765.432-1                    [PROGRAMADO]     │         ║
║  │   ⚠️ Combinación no recomendada (1º + 3º)         │         ║
║  └────────────────────────────────────────────────────┘         ║
║                                                                   ║
╠══════════════════════════════════════════════════════════════════╣
║                                     [Cancelar]  [💾 Guardar]    ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 🧪 Testing Manual

### Test 1: Turno Continuo

**Pasos:**
1. Abrir TransApp → Turnos
2. Seleccionar DÍA 1 (ejemplo: 30 sept)
3. Hacer clic en DÍA 1 para abrir modal
4. Asignar "Juan López" al **3º Turno**
5. Guardar y cerrar
6. Hacer clic en DÍA 2 (1 oct)
7. Asignar "Juan López" al **1º Turno**

**Resultado Esperado:**
- ✅ Juan López aparece seleccionado en 1º turno
- ✅ Fondo ROJO claro en la tarjeta de Juan López
- ✅ Icono ⚠️ visible al lado del nombre
- ✅ Mensaje: "⚠️ Turno continuo / descanso insuficiente (tuvo 3º turno ayer)"
- ✅ Tooltip al hacer hover muestra el mensaje completo
- ✅ Botón "Guardar" habilitado
- ✅ Al guardar, NO aparece error

**Verificación en BD:**
```sql
SELECT * FROM turnos 
WHERE trabajador_id = (SELECT id FROM trabajadores WHERE nombre LIKE '%Juan López%')
  AND fecha IN ('2025-09-30', '2025-10-01')
ORDER BY fecha, turno_tipo;

-- Debe mostrar:
-- 2025-09-30 | tercer_turno  | programado | Juan López
-- 2025-10-01 | primer_turno  | programado | Juan López  ← PERMITIDO
```

---

### Test 2: Combinación No Recomendada

**Preparación:**
1. Ir a Turnos → Configurar Reglas
2. Verificar que "1º + 3º" esté marcado como NO PERMITIDO
3. Guardar configuración

**Pasos:**
1. Abrir modal de asignación para cualquier día
2. Asignar "Pedro García" al **1º Turno**
3. Sin cerrar el modal, asignar "Pedro García" al **3º Turno**

**Resultado Esperado:**
- ✅ Pedro García aparece en AMBOS turnos
- ✅ Fondo NARANJA claro en ambas tarjetas
- ✅ Mensaje en ambas: "⚠️ Combinación no recomendada (1º + 3º)"
- ✅ Área de alertas en el header muestra: "⚠️ Pedro García: Combinación de turnos no recomendada"
- ✅ Botón "Guardar" habilitado
- ✅ Al guardar, se crean AMBOS registros en BD

**Verificación en BD:**
```sql
SELECT * FROM turnos 
WHERE trabajador_id = (SELECT id FROM trabajadores WHERE nombre LIKE '%Pedro García%')
  AND fecha = '2025-10-01'
ORDER BY turno_tipo;

-- Debe mostrar:
-- primer_turno  | programado | $20.000
-- tercer_turno  | programado | $22.500  ← PERMITIDO (con aviso)
```

---

### Test 3: Exceso de Cupos

**Preparación:**
1. Ir a Turnos → Configurar Reglas
2. Configurar "Límite 1º Turno" = 3
3. Guardar configuración

**Pasos:**
1. Abrir modal de asignación para cualquier día
2. Asignar 3 trabajadores al **1º Turno** (Ejemplo: Carlos, Ana, Diego)
3. Verificar contador: "Asignados: 3/5"
4. Asignar un 4º trabajador (Ejemplo: María)

**Resultado Esperado:**
- ✅ María aparece seleccionada (checkbox marcado)
- ✅ Fondo AMARILLO claro en la tarjeta de María
- ✅ Mensaje: "⚠️ Excede el máximo configurado (3)"
- ✅ Contador actualizado: "Asignados: 4/5"
- ✅ Botón "Guardar" habilitado
- ✅ Se puede seguir agregando más trabajadores (5º, 6º, etc.)

**Verificación Visual:**
```
Asignados: 4/5    ← Muestra que se excedió el límite de 3

┌─────────────────────────────┐
│ ☑ Carlos Muñoz  $20.000    │ ← Normal (1/3)
├─────────────────────────────┤
│ ☑ Ana Torres    $20.000    │ ← Normal (2/3)
├─────────────────────────────┤
│ ☑ Diego Rojas   $20.000    │ ← Normal (3/3)
├─────────────────────────────┤
│ ☑ 🟡 María Soto  $20.000 ⚠️│ ← AMARILLO (4/3 - excede)
│   ⚠️ Excede el máximo (3)  │
└─────────────────────────────┘
```

---

### Test 4: Múltiples Warnings Simultáneos

**Escenario Extremo:**
- Juan López tiene 3º turno AYER
- Se asigna a 1º turno HOY (turno continuo)
- También se asigna a 3º turno HOY (combinación no recomendada)
- El 1º turno ya tiene 3 trabajadores (excede límite)

**Resultado Esperado:**
- ✅ Juan López aparece en ambos turnos (1º y 3º)
- ✅ En 1º turno: Fondo ROJO + AMARILLO (prioridad: ROJO)
- ✅ Mensajes múltiples:
  - "⚠️ Turno continuo / descanso insuficiente"
  - "⚠️ Excede el máximo configurado (3)"
- ✅ En 3º turno: Fondo NARANJA
- ✅ Mensaje: "⚠️ Combinación no recomendada (1º + 3º)"
- ✅ Área de alertas muestra TODOS los warnings
- ✅ Botón "Guardar" habilitado para TODOS los casos

---

## 📊 Matriz de Colores y Prioridades

| Prioridad | Tipo de Warning | Color Fondo | Color Texto | Ícono | Ejemplo |
|-----------|-----------------|-------------|-------------|-------|---------|
| 🔴 **ALTA** | Turno Continuo | `bg-red-50 border-red-300` | `text-red-600` | ⚠️ | Trabajador tuvo 3º ayer |
| 🟠 **MEDIA** | Combinación No Recomendada | `bg-orange-50 border-orange-300` | `text-orange-600` | ⚠️ | 1º + 3º mismo día |
| 🟡 **BAJA** | Exceso de Cupos | `bg-yellow-50 border-yellow-300` | `text-yellow-600` | ⚠️ | Más de N trabajadores |

**Regla de Múltiples Warnings:**
Si un trabajador tiene varios warnings, se usa el color de **mayor prioridad** (ROJO > NARANJA > AMARILLO).

---

## ✅ Checklist de Verificación

### Funcionalidad
- [ ] Turno continuo permite asignación (no bloquea)
- [ ] Combinación no recomendada permite asignación (no bloquea)
- [ ] Exceso de cupos permite asignación (no bloquea)
- [ ] Botón "Guardar" nunca se deshabilita por warnings
- [ ] Guardado exitoso con warnings activos

### Visual
- [ ] Fondo rojo para turno continuo
- [ ] Fondo naranja para combinación no recomendada
- [ ] Fondo amarillo para exceso de cupos
- [ ] Icono ⚠️ visible junto al nombre
- [ ] Mensaje de warning debajo del RUT
- [ ] Tooltip funciona al hacer hover

### UX
- [ ] No aparecen alerts bloqueantes
- [ ] Warnings se actualizan en tiempo real
- [ ] Deseleccionar trabajador limpia sus warnings
- [ ] Área de alertas en header es informativa
- [ ] Texto indica "no bloquean guardado"

### Persistencia
- [ ] Turnos se guardan correctamente con warnings
- [ ] BD refleja las asignaciones tal como se configuraron
- [ ] No hay duplicados en la BD
- [ ] Estados (programado/completado) se mantienen

---

## 🎯 Resumen Ejecutivo

### Lo que CAMBIÓ:
- ❌ **Eliminados:** Todos los alerts bloqueantes
- ❌ **Eliminados:** Todos los bloqueos de asignación
- ✅ **Agregado:** Sistema de avisos visuales con colores
- ✅ **Agregado:** Tooltips descriptivos
- ✅ **Agregado:** Mensajes debajo de cada trabajador

### Lo que NO CAMBIÓ:
- ✅ Sistema de tarifas (pago/cobro)
- ✅ Estados de turnos (programado/completado)
- ✅ Guardado en base de datos
- ✅ Configuración de reglas
- ✅ Interfaz general del modal

### Beneficio Principal:
**El usuario tiene CONTROL TOTAL sobre las asignaciones, con FEEDBACK VISUAL CLARO sobre posibles problemas, pero sin perder FLEXIBILIDAD OPERACIONAL.**

---

## 📞 Soporte

Si encuentras algún problema o tienes dudas sobre el nuevo sistema:

1. **Revisar este documento** para casos de uso comunes
2. **Verificar configuración** en Turnos → Configurar Reglas
3. **Consultar BD** para verificar registros guardados
4. **Reportar issue** con capturas de pantalla si es necesario

**Documentación técnica completa:** `docs/SISTEMA_AVISOS_TURNOS.md`
