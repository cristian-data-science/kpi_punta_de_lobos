# 🚨 PROBLEMA: Columna hora_almuerzo NO EXISTE en Base de Datos

## ❌ Causa del Problema

La columna `hora_almuerzo` **NO EXISTE** en la tabla `turnos` de Supabase. Por eso:
- ✅ Los demás campos se actualizan correctamente
- ❌ `hora_almuerzo` se ignora silenciosamente
- ❌ No se guarda en la base de datos
- ❌ No persiste al recargar

## 🔍 Evidencia

### Estructura actual de la tabla `turnos`:
```sql
CREATE TABLE turnos (
  id UUID PRIMARY KEY,
  persona_id UUID,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  tipo_turno TEXT,
  estado TEXT,
  puesto TEXT,
  ubicacion TEXT,
  notas TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
  -- ❌ hora_almuerzo NO EXISTE
)
```

## ✅ SOLUCIÓN: Ejecutar Migración SQL

### Paso 1: Abrir Supabase Dashboard
1. Ve a https://supabase.com
2. Selecciona tu proyecto
3. Menú lateral → **SQL Editor**

### Paso 2: Ejecutar Script
Copia y pega este código en el SQL Editor:

```sql
-- Agregar columna hora_almuerzo
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS hora_almuerzo TIME;
```

### Paso 3: Click en "Run" (Ejecutar)

### Paso 4: Verificar
```sql
-- Verificar que se agregó
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'turnos' 
AND column_name = 'hora_almuerzo';
```

**Resultado esperado:**
```
column_name     | data_type | is_nullable
hora_almuerzo   | time      | YES
```

## 🎯 Después de Ejecutar la Migración

1. **Refresca la aplicación** (F5)
2. **Edita un turno** y cambia la hora de almuerzo
3. **Verifica en consola:**
   - Deberías ver: `📝 Actualizando turno con datos: { ..., hora_almuerzo: "13:00" }`
   - Deberías ver: `🔄 updateTurno - Updates: { ..., hora_almuerzo: "13:00" }`
   - Deberías ver: `✅ updateTurno - Result: { data: {..., hora_almuerzo: "13:00"}, error: null }`
4. **Recarga el calendario** - La línea de almuerzo debería aparecer

## 📁 Archivos SQL Disponibles

### `sql/agregar_hora_almuerzo.sql`
- Migración original con comentarios
- Script completo y documentado

### `sql/EJECUTAR_AHORA_agregar_hora_almuerzo.sql` ⭐ **NUEVO**
- Script simplificado para ejecución inmediata
- Incluye verificación

## 🐛 Logs de Debug Agregados

He añadido console.logs para ayudarte a verificar:

### En `Turnos.jsx` (línea ~148):
```javascript
console.log('📝 Actualizando turno con datos:', dataToSend)
```

### En `supabaseHelpers.js` (línea ~324):
```javascript
console.log('🔄 updateTurno - ID:', id, 'Updates:', updates)
console.log('✅ updateTurno - Result:', { data, error })
```

### Qué buscar en consola:
- ✅ `hora_almuerzo: "13:00"` en dataToSend
- ✅ `hora_almuerzo: "13:00"` en updates
- ✅ `hora_almuerzo: "13:00"` en data (después de la migración)
- ❌ `error: { message: "column hora_almuerzo does not exist" }` (antes de la migración)

## ✅ Fix de Warning de React

También arreglé el warning:
```
Each child in a list should have a unique "key" prop
```

**Cambio en `WeeklySchedule.jsx`:**
```jsx
// ANTES
{HOURS.map(hour => (
  <>
    <div key={`hour-${hour}`}>...</div>
  </>
))}

// DESPUÉS
{HOURS.map(hour => (
  <React.Fragment key={`hour-row-${hour}`}>
    <div key={`hour-${hour}`}>...</div>
  </React.Fragment>
))}
```

## 🔧 Archivos Modificados

1. ✅ `src/components/WeeklySchedule/WeeklySchedule.jsx` - Fix warning de React keys
2. ✅ `src/pages/Turnos.jsx` - Agregado console.log para debug
3. ✅ `src/services/supabaseHelpers.js` - Agregado console.logs para debug
4. ✅ `sql/EJECUTAR_AHORA_agregar_hora_almuerzo.sql` - Script nuevo simplificado

## 📋 Checklist de Resolución

- [ ] Ejecutar migración SQL en Supabase
- [ ] Verificar que la columna existe
- [ ] Refrescar aplicación (F5)
- [ ] Editar un turno y cambiar hora_almuerzo
- [ ] Verificar logs en consola
- [ ] Verificar que aparece línea en calendario
- [ ] Verificar que persiste al recargar

---
**Próximo Paso:** ⚠️ **EJECUTAR** `sql/EJECUTAR_AHORA_agregar_hora_almuerzo.sql` en Supabase SQL Editor
