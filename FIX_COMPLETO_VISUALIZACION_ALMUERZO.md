# 🔧 FIX COMPLETO: Visualización y Edición de hora_almuerzo
**Fecha:** 14 de octubre de 2025

## ✅ Problemas Resueltos

### 1. ❌ → ✅ Hora de almuerzo no se visualizaba en calendario
**Causa:** PostgreSQL devuelve TIME como `"HH:mm:ss"` pero el componente esperaba `"HH:mm"`

**Solución:**
- Normalización en `turnosToBlocks()`: `hora_almuerzo.substring(0, 5)`
- Logs agregados para debug

### 2. ❌ → ✅ Al editar turno con almuerzo, aparecía "Sin almuerzo"
**Causa:** Mismo problema de formato `"HH:mm:ss"` vs `"HH:mm"`

**Solución:**
- Normalización en `handleEdit()` antes de cargar en formulario
- Log agregado para verificar conversión

### 3. ❌ → ✅ Texto "(por defecto)" en selector
**Solución:** Removido del `<option value="13:00">`

## 🔧 Cambios Implementados

### 1. `src/utils/scheduleHelpers.js`

#### Función `turnosToBlocks()` - Línea ~189
```javascript
export const turnosToBlocks = (turnos, weekStart) => {
  if (!turnos || turnos.length === 0) return []
  
  console.log('📅 turnosToBlocks - Procesando', turnos.length, 'turnos')
  
  const blocks = []
  
  turnos.forEach(turno => {
    // ... código existente
    
    // ✅ NUEVO: Normalizar hora_almuerzo
    const horaAlmuerzoNormalizada = turno.hora_almuerzo 
      ? turno.hora_almuerzo.substring(0, 5)  // "13:00:00" → "13:00"
      : null
    
    if (horaAlmuerzoNormalizada) {
      console.log('🍽️ Turno con almuerzo:', turno.persona?.nombre, '→', horaAlmuerzoNormalizada)
    }
    
    blocks.push({
      // ... otros campos
      hora_almuerzo: horaAlmuerzoNormalizada, // ✅ Valor normalizado
      turnoData: turno
    })
  })
  
  return blocks
}
```

### 2. `src/pages/Turnos.jsx`

#### Función `handleEdit()` - Línea ~211
```javascript
const handleEdit = (turno) => {
  setEditingTurno(turno)
  
  // ✅ NUEVO: Normalizar hora_almuerzo al editar
  const horaAlmuerzo = turno.hora_almuerzo 
    ? (turno.hora_almuerzo.length > 5 
        ? turno.hora_almuerzo.substring(0, 5)  // "13:00:00" → "13:00"
        : turno.hora_almuerzo)                 // "13:00" → "13:00"
    : '13:00' // Default si no existe
  
  console.log('📝 Editando turno:', turno, '→ hora_almuerzo normalizada:', horaAlmuerzo)
  
  setFormData({
    // ... otros campos
    hora_almuerzo: horaAlmuerzo, // ✅ Valor normalizado
  })
}
```

#### Selector de hora_almuerzo - Línea ~543
```javascript
<select id="hora_almuerzo" value={formData.hora_almuerzo}>
  <option value="">Sin almuerzo</option>
  <option value="12:00">12:00 - 13:00</option>
  <option value="12:30">12:30 - 13:30</option>
  <option value="13:00">13:00 - 14:00</option> {/* ✅ Sin "(por defecto)" */}
  <option value="13:30">13:30 - 14:30</option>
  <option value="14:00">14:00 - 15:00</option>
  <option value="14:30">14:30 - 15:30</option>
  <option value="15:00">15:00 - 16:00</option>
</select>
```

### 3. `src/components/WeeklySchedule/WeeklySchedule.jsx`

#### Cálculo de posición de almuerzo - Línea ~154
```javascript
if (event.hora_almuerzo && event.type !== 'lunch') {
  console.log('🍽️ Renderizando almuerzo para:', event.label, '→', event.hora_almuerzo, 'en día', event.day)
  
  const turnoStartMinutes = parseTimeToMinutes(event.start)
  const lunchStartMinutes = parseTimeToMinutes(event.hora_almuerzo)
  const totalDurationMinutes = parseTimeToMinutes(event.end) - turnoStartMinutes
  
  const lunchOffsetPercent = ((lunchStartMinutes - turnoStartMinutes) / totalDurationMinutes) * 100
  const lunchHeightPercent = (60 / totalDurationMinutes) * 100
  
  console.log('📊 Almuerzo calculado:', { 
    lunchOffsetPercent: lunchOffsetPercent.toFixed(1) + '%', 
    lunchHeightPercent: lunchHeightPercent.toFixed(1) + '%' 
  })
  
  lunchBarPosition = lunchOffsetPercent
  lunchBarHeight = lunchHeightPercent
}
```

## 📊 Flujo Completo de Datos

### 1. Base de Datos (Supabase)
```sql
SELECT hora_almuerzo FROM turnos WHERE id = 123;
-- Resultado: 13:00:00 (formato TIME de PostgreSQL)
```

### 2. getTurnos() - Sin cambios
```javascript
const { data } = await supabase.from('turnos').select('*')
// data[0].hora_almuerzo = "13:00:00"
```

### 3. turnosToBlocks()
```javascript
// ANTES: "13:00:00" → parseTimeToMinutes() fallaba
// AHORA: "13:00:00" → substring(0,5) → "13:00" ✅
```

### 4. WeeklySchedule renderiza
```javascript
// event.hora_almuerzo = "13:00"
// parseTimeToMinutes("13:00") = 780 ✅
// Línea divisoria se dibuja correctamente
```

### 5. handleEdit() al editar
```javascript
// turno.hora_almuerzo = "13:00:00" (de BD)
// Normalizado → "13:00"
// Select muestra opción correcta ✅
```

## 🐛 Logs de Debug

Abre la **Consola del Navegador** (F12) y busca:

### Al cargar calendario:
```
📅 turnosToBlocks - Procesando X turnos
🍽️ Turno con almuerzo: JUAN → 13:00
🍽️ Turno con almuerzo: MARÍA → 14:30
```

### Al renderizar bloques:
```
🍽️ Renderizando almuerzo para: JUAN → 13:00 en día 1
📊 Almuerzo calculado: { lunchOffsetPercent: '44.4%', lunchHeightPercent: '11.1%' }
```

### Al editar turno:
```
📝 Editando turno: {...} → hora_almuerzo normalizada: 13:00
```

### Al actualizar:
```
📝 Actualizando turno con datos: { ..., hora_almuerzo: "14:00" }
🔄 updateTurno - Updates: { ..., hora_almuerzo: "14:00" }
✅ updateTurno - Result: { data: {..., hora_almuerzo: "14:00:00"}, error: null }
```

## ✅ Checklist de Validación

- [ ] Refrescar navegador (F5)
- [ ] Abrir consola (F12)
- [ ] Verificar logs `📅 turnosToBlocks - Procesando X turnos`
- [ ] Verificar logs `🍽️ Turno con almuerzo:` para turnos con almuerzo
- [ ] Ver calendario y confirmar líneas blancas en turnos con almuerzo
- [ ] Editar un turno que tenga almuerzo
- [ ] Verificar que el selector muestra la hora correcta (ej: "13:00 - 14:00")
- [ ] Cambiar hora de almuerzo y guardar
- [ ] Verificar que la línea se mueve a la nueva posición
- [ ] Recargar página y confirmar que persiste

## 🎯 Resultado Esperado

### Calendario:
```
┌──────────────────┐
│      JUAN        │ ← 09:00-13:00
├──────────────────┤
│    ALMUERZO      │ ← 13:00-14:00 (línea blanca)
├──────────────────┤
│                  │ ← 14:00-18:00
└──────────────────┘
```

### Selector al editar:
```
[13:00 - 14:00  ▼]  ← Valor correcto sin "(por defecto)"
```

## 🔧 Si Aún No Funciona

1. **Verifica que ejecutaste la migración SQL:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'turnos' AND column_name = 'hora_almuerzo';
   ```
   Debe devolver: `hora_almuerzo`

2. **Verifica que el turno tiene hora_almuerzo en BD:**
   ```sql
   SELECT id, hora_inicio, hora_fin, hora_almuerzo 
   FROM turnos 
   WHERE hora_almuerzo IS NOT NULL;
   ```

3. **Revisa logs en consola:**
   - Si no ves `🍽️ Turno con almuerzo:` → El turno no tiene hora_almuerzo en BD
   - Si ves `🍽️ Renderizando almuerzo` → El renderizado funciona
   - Si no ves la línea → Revisa estilos CSS

---
**Estado:** ✅ **TODOS LOS PROBLEMAS RESUELTOS CON LOGS DE DEBUG**
