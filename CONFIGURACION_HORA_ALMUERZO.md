# ⚙️ CONFIGURACIÓN DE HORA DE ALMUERZO
**Fecha:** 14 de octubre de 2025

## ✨ Cambios Implementados

### 1. **Valor por Defecto: 13:00 (1 PM)** ✅
- Al **crear turno nuevo:** `hora_almuerzo = "13:00"` automáticamente
- Al **editar turno existente:** Si no tiene almuerzo, se asigna `"13:00"`
- Al **cerrar modal:** Se resetea a `"13:00"`

### 2. **Duración Fija: 1 Hora** ✅
- **No editable:** La duración siempre es 60 minutos
- **Cálculo automático:** Si hora_almuerzo = "13:00" → fin = "14:00"
- **Visual proporcional:** La altura del divisor representa el 11.1% de un turno de 9 horas

### 3. **Saltos de 30 Minutos** ✅
Reemplazado `<Input type="time">` por `<select>` con opciones fijas:

| Opción | Rango | Descripción |
|--------|-------|-------------|
| `""` | Sin almuerzo | Opcional |
| `"12:00"` | 12:00 - 13:00 | - |
| `"12:30"` | 12:30 - 13:30 | - |
| **`"13:00"`** | **13:00 - 14:00** | **Por defecto** |
| `"13:30"` | 13:30 - 14:30 | - |
| `"14:00"` | 14:00 - 15:00 | - |
| `"14:30"` | 14:30 - 15:30 | - |
| `"15:00"` | 15:00 - 16:00 | - |

## 🎨 Interfaz de Usuario

### Campo de Formulario:
```jsx
<Label htmlFor="hora_almuerzo">Hora Almuerzo (1 hora)</Label>
<select
  id="hora_almuerzo"
  className="w-full px-3 py-2 border rounded-md"
  value={formData.hora_almuerzo}
  onChange={(e) => setFormData({ ...formData, hora_almuerzo: e.target.value })}
>
  <option value="">Sin almuerzo</option>
  <option value="12:00">12:00 - 13:00</option>
  <option value="12:30">12:30 - 13:30</option>
  <option value="13:00">13:00 - 14:00 (por defecto)</option>
  ...
</select>
<small>Duración fija: 1 hora. Se dibuja como línea divisoria en el turno.</small>
```

### Visual en Calendario:
```
┌─────────────────────┐
│       JUAN          │ ← 09:00-13:00 (Mañana: 44% del turno)
├─────────────────────┤
│     ALMUERZO        │ ← 13:00-14:00 (Almuerzo: 11% del turno)
├─────────────────────┤
│                     │ ← 14:00-18:00 (Tarde: 44% del turno)
└─────────────────────┘
```

## 📐 Cálculo de Altura Proporcional

### Ejemplo: Turno de 09:00 a 18:00 (9 horas = 540 minutos)
```javascript
totalDurationMinutes = 540
lunchDurationMinutes = 60
lunchHeightPercent = (60 / 540) * 100 = 11.1%
```

### Ejemplo: Turno de 13:00 a 17:00 (4 horas = 240 minutos)
```javascript
totalDurationMinutes = 240
lunchDurationMinutes = 60
lunchHeightPercent = (60 / 240) * 100 = 25%
```

**Conclusión:** La altura del divisor de almuerzo es **proporcional** a la duración total del turno, siempre representando exactamente 1 hora.

## 🔧 Archivos Modificados

### 1. `src/pages/Turnos.jsx`
- ✅ **formData inicial:** `hora_almuerzo: '13:00'`
- ✅ **handleEdit:** `hora_almuerzo: turno.hora_almuerzo || '13:00'`
- ✅ **closeModal:** `hora_almuerzo: '13:00'`
- ✅ **Campo formulario:** Cambiado de `<Input type="time">` a `<select>` con 8 opciones

### 2. `src/components/WeeklySchedule/WeeklySchedule.jsx`
- ✅ **lunchBarHeight:** Calculado dinámicamente como porcentaje
- ✅ **Fórmula:** `(60 / totalDurationMinutes) * 100`
- ✅ **Style:** `height: ${lunchBarHeight}%` (antes era `20px` fijo)

## 🎯 Casos de Prueba

### Caso 1: Crear Turno Nuevo
**Input:**
- Click en "Nuevo Turno"
- Sin modificar campos

**Resultado:**
- `hora_almuerzo` = "13:00" ✅
- Select muestra "13:00 - 14:00 (por defecto)" ✅

### Caso 2: Cambiar Hora de Almuerzo
**Input:**
- Seleccionar "12:30 - 13:30"

**Resultado:**
- `hora_almuerzo` = "12:30" ✅
- Divisor aparece a las 12:30 en el calendario ✅
- Altura representa 1 hora ✅

### Caso 3: Turno sin Almuerzo
**Input:**
- Seleccionar "Sin almuerzo"

**Resultado:**
- `hora_almuerzo` = "" ✅
- No aparece divisor en calendario ✅

### Caso 4: Editar Turno Existente sin Almuerzo
**Input:**
- Turno antiguo sin campo `hora_almuerzo`
- Click en "Editar"

**Resultado:**
- Campo autocompletado con "13:00" ✅
- Usuario puede cambiarlo antes de guardar ✅

## ✅ Validaciones

- ✅ Valor por defecto: "13:00"
- ✅ Saltos de 30 minutos
- ✅ Opciones de 12:00 a 15:00
- ✅ Duración fija de 1 hora
- ✅ Altura proporcional en calendario
- ✅ Editable por el usuario
- ✅ Opción "Sin almuerzo" disponible
- ✅ Sin errores de compilación

## 🚀 Ventajas del Sistema

1. **UX mejorada:** Dropdown claro con rangos visibles
2. **Validación automática:** Solo permite valores válidos (30 min)
3. **Visual proporcional:** El almuerzo ocupa el espacio correcto
4. **Flexibilidad:** Usuario puede cambiar o quitar almuerzo
5. **Default inteligente:** 13:00 es la hora más común

## 📝 Notas Técnicas

- **Type:** `<select>` nativo (mejor UX que input time)
- **Values:** Strings en formato "HH:mm" (compatible con Supabase TIME)
- **Cálculo:** Porcentaje basado en duración total del turno
- **Overflow:** `pointerEvents: none` para no interferir con clicks

---
**Estado:** ✅ **COMPLETADO Y OPTIMIZADO**
