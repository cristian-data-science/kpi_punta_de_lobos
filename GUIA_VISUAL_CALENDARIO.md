# 🎯 Guía Visual Rápida - Calendario de Turnos

## 🚀 En 10 Segundos

```
1. Click en calendario → 2. Selecciona persona → 3. ¡Listo!
```

---

## 📅 Tu Nuevo Módulo de Turnos

### Pantalla Principal

```
┌─────────────────────────────────────────────────────────────┐
│  ⏰ Gestión de Turnos                [Ver Lista] [+ Nuevo] 🔄│
├─────────────────────────────────────────────────────────────┤
│  Estadísticas:                                               │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐     │
│  │Hoy: 5    │ │En Curso:2│ │Completos:3│ │Program:8│     │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘     │
├─────────────────────────────────────────────────────────────┤
│  📅 Calendario de Turnos                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Lun  │  Mar  │  Mié  │  Jue  │  Vie  │  Sáb  │  Dom│  │
│  ├───────┼───────┼───────┼───────┼───────┼───────┼───────  │
│  │ 09:00 │ 🔵Juan│       │ 🟢Ana │       │       │       │  │
│  │ 10:00 │ 🔵Juan│       │ 🟢Ana │ 🔵Pedro│      │       │  │
│  │ 11:00 │       │       │       │ 🔵Pedro│      │       │  │
│  └───────────────────────────────────────────────────────┘  │
│  Click para crear | Click en evento para editar             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ MODO RÁPIDO (Recomendado)

### Paso 1: Click en Calendario
```
     👆 Click aquí
      ↓
┌─────────────┐
│   10:00     │  ← Cualquier espacio vacío
│             │
│   11:00     │
└─────────────┘
```

### Paso 2: Modal Rápido
```
┌──────────────────────────────────┐
│  ⚡ Crear Turno Rápido           │
├──────────────────────────────────┤
│  Persona: [Selecciona▼]         │ ← Solo esto es obligatorio
│                                  │
│  Fecha: 2025-10-14  ✅           │ ← Ya está lleno
│  Hora: 10:00 - 11:00 ✅          │ ← Ya está lleno
│                                  │
│  [Cancelar] [Más Opciones] [Crear Turno]
└──────────────────────────────────┘
```

### Paso 3: ¡Listo!
```
Turno creado en 3 segundos ⚡
```

---

## 📝 MODO COMPLETO (Cuando necesitas detalles)

### Desde Botón "Nuevo Turno"
```
┌──────────────────────────────────┐
│  ➕ Nuevo Turno                  │
├──────────────────────────────────┤
│  Persona: [Juan Pérez ▼]        │
│                                  │
│  Fecha: [2025-10-14]             │
│  Hora Inicio: [09:00]            │
│  Hora Fin: [17:00]               │
│                                  │
│  Tipo: [Completo ▼]              │
│  Estado: [Programado ▼]          │
│                                  │
│  Puesto: [Instructor]            │
│  Ubicación: [Punta de Lobos]     │
│                                  │
│  Notas: [_________________]      │
│                                  │
│  [Cancelar]          [Crear]     │
└──────────────────────────────────┘
```

---

## ✏️ EDITAR TURNO

### Opción 1: Click en Calendario
```
    Click en el turno
       ↓
┌─────────────┐
│ 🔵 Juan     │ ← Click aquí
│ 09:00-12:00 │
└─────────────┘
       ↓
Modal de edición se abre
```

### Opción 2: Desde Lista
```
┌────────────────────────────────────┐
│  Juan Pérez  🔵Programado         │
│  📅 2025-10-14  ⏰ 09:00-12:00    │
│  Puesto: Instructor                │
│                      [✏️] [🗑️]    │ ← Click en lápiz
└────────────────────────────────────┘
```

---

## 🎨 CÓDIGO DE COLORES

```
🔵 AZUL    → Programado   (turno futuro)
🟢 VERDE   → En Curso     (turno activo ahora)
⚫ GRIS    → Completado   (turno finalizado)
🔴 ROJO    → Cancelado    (turno cancelado)
🟠 NARANJA → Ausente      (persona no asistió)
```

### En el Calendario
```
┌─────────────────────────────────┐
│ Lunes                           │
├─────────────────────────────────┤
│ 09:00  🔵 Juan (Programado)    │
│ 10:00  🟢 Ana  (En Curso)      │
│ 11:00  ⚫ Pedro (Completado)   │
│ 12:00  🔴 María (Cancelado)    │
│ 13:00  🟠 Luis  (Ausente)      │
└─────────────────────────────────┘
```

---

## 🔄 CAMBIAR VISTAS

### Botones de Vista
```
[Mes] [Semana] [Día] [Agenda]
  ↓      ↓      ↓      ↓
Vista  Vista  Vista  Lista
amplia detalle zoom  orden
```

### Vista Mes
```
┌────────────────────────────────────┐
│  Octubre 2025                      │
├─────┬─────┬─────┬─────┬─────┬─────┤
│  L  │  M  │  X  │  J  │  V  │  S  │
├─────┼─────┼─────┼─────┼─────┼─────┤
│  1  │  2  │  3  │  4  │  5  │  6  │
│ 🔵  │ 🔵🟢│     │ 🟢  │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┤
│  7  │  8  │  9  │ 10  │ 11  │ 12  │
│     │ 🔵  │ 🔵  │ 🔵🔵│     │     │
└─────┴─────┴─────┴─────┴─────┴─────┘
```

### Vista Semana (Recomendada para gestión)
```
┌──────┬──────┬──────┬──────┬──────┐
│ Lun  │ Mar  │ Mié  │ Jue  │ Vie  │
├──────┼──────┼──────┼──────┼──────┤
│ 9:00 │      │      │      │      │
│ 🔵   │ 🟢   │      │ 🔵   │      │
│10:00 │      │      │      │      │
│      │ 🟢   │ 🔵   │ 🔵   │ 🟢   │
│11:00 │      │      │      │      │
└──────┴──────┴──────┴──────┴──────┘
```

### Vista Día (Detalle completo)
```
┌─────────────────────────────┐
│  Lunes 14 de Octubre        │
├──────┬──────────────────────┤
│ 9:00 │ 🔵 Juan - Instructor │
│10:00 │                      │
│11:00 │ 🟢 Ana - Recepción   │
│12:00 │                      │
│13:00 │ 🔵 Pedro - Mantenimiento
│14:00 │                      │
└──────┴──────────────────────┘
```

---

## 🔀 TOGGLE CALENDARIO ↔️ LISTA

### Botón Toggle
```
[Ver Lista]  ← Click para cambiar
     ↓
[Ver Calendario]  ← Click para volver
```

### Vista Lista
```
┌──────────────────────────────────────┐
│ 📋 Lista de Turnos                   │
├──────────────────────────────────────┤
│ Juan Pérez  🔵Programado            │
│ 📅 2025-10-14  ⏰ 09:00-17:00       │
│ Puesto: Instructor                   │
│ Ubicación: Punta de Lobos            │
│                        [✏️] [🗑️]    │
├──────────────────────────────────────┤
│ Ana García  🟢En Curso              │
│ 📅 2025-10-14  ⏰ 10:00-14:00       │
│ Puesto: Recepción                    │
│                        [✏️] [🗑️]    │
└──────────────────────────────────────┘
```

---

## 🎯 CASOS DE USO RÁPIDOS

### Caso 1: "Necesito asignar 10 turnos AHORA"
```
1. Usa vista SEMANA
2. Click, click, click en espacios vacíos
3. Selecciona persona en cada modal
4. 10 turnos en 30 segundos ⚡
```

### Caso 2: "¿Quién trabaja mañana?"
```
1. Vista DÍA
2. Navega a mañana (→)
3. Mira los turnos visualmente 👀
```

### Caso 3: "Cambiar horario urgente"
```
1. Click en el turno
2. Cambia hora_inicio/hora_fin
3. Guarda
4. Listo en 5 segundos ⚡
```

### Caso 4: "Planificar el mes"
```
1. Vista MES
2. Click en días para distribuir turnos
3. Visual: ves huecos y saturación
4. Balancea la carga 📊
```

---

## 💡 TIPS PRO

### ⚡ Velocidad
- Usa MODO RÁPIDO para asignaciones masivas
- Vista SEMANA es la más eficiente
- Atajos de teclado: Esc cierra modal

### 🎨 Visual
- Colores te dan estado al instante
- Turnos largos = barras más grandes
- Hover sobre turno = preview

### 📱 Móvil
- Funciona en celular/tablet
- Vista DÍA recomendada en móvil
- Responsive automático

### 🔍 Buscar
- Usa vista AGENDA para buscar
- Filtra por nombre (próximamente)
- Lista es mejor para búsqueda

---

## ❓ PREGUNTAS FRECUENTES

### ¿Puedo arrastrar turnos?
```
🚧 Próximamente en la siguiente versión
```

### ¿Se detectan conflictos?
```
Visual: Sí, verás solapamientos
Automático: Próximamente
```

### ¿Funciona offline?
```
No, requiere conexión a Supabase
```

### ¿Puedo exportar?
```
🚧 Exportar a PDF/Excel próximamente
```

---

## 🎉 ¡A TRABAJAR!

```
┌────────────────────────────────┐
│                                │
│   ¡Todo listo para usar!       │
│                                │
│   /turnos  →  Click  →  ⚡    │
│                                │
└────────────────────────────────┘
```

**Recuerda**: La forma más rápida es hacer click en el calendario 📅

¡Disfruta tu nuevo sistema de turnos! 🚀
