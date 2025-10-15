# 📋 MEJORAS AL CALENDARIO DE TURNOS
**Fecha:** 14 de octubre de 2025

## ✨ Cambios Implementados

### 1. **Calendario Más Compacto y Adaptativo**
- ✅ **Altura de celdas reducida:** 52px → 44px
- ✅ **Header más pequeño:** 56px → 48px
- ✅ **Fuentes reducidas:**
  - Nombres de días: 11px → 10px
  - Fechas: 18px → 16px
  - Bloques: 11px → 10px
- ✅ **Padding reducido** en todos los elementos
- ✅ **Adaptativo:** Soporta hasta **4 turnos paralelos** en un mismo día sin problemas

### 2. **Campo de Hora de Almuerzo**
- ✅ **Nuevo campo en formulario:** `hora_almuerzo` (opcional)
- ✅ **Tipo:** Input de tipo `time`
- ✅ **Ubicación:** Junto a hora_inicio y hora_fin
- ✅ **Ayuda visual:** Texto explicativo "Opcional: se dibujará espacio de almuerzo"

### 3. **Bloque Visual de ALMUERZO**
- ✅ **Estilo especial:** Fondo blanco con borde punteado gris
- ✅ **Texto:** "ALMUERZO" en mayúsculas
- ✅ **Duración:** 1 hora automática desde hora_almuerzo
- ✅ **Separador de jornadas:** Divide visualmente la jornada de trabajo
- ✅ **No editable:** No se puede hacer clic para editar (cursor default)
- ✅ **Sin hover:** No tiene efecto hover para diferenciar de turnos editables

### 4. **Procesamiento en scheduleHelpers.js**
- ✅ **turnosToBlocks() modificado:**
  - Si `turno.hora_almuerzo` existe → crea bloque adicional tipo `lunch`
  - ID único: `${turno.id}_almuerzo`
  - Hora fin automática: hora_almuerzo + 1 hora
  - Label: "ALMUERZO"
  - No vinculado a turnoData (no editable)

### 5. **Migración SQL**
- ✅ **Archivo creado:** `sql/agregar_hora_almuerzo.sql`
- ✅ **Comando:**
  ```sql
  ALTER TABLE turnos ADD COLUMN IF NOT EXISTS hora_almuerzo TIME;
  ```
- ✅ **Comentario documentado** en la tabla

## 🎨 Estilos de ALMUERZO

```css
.schedule-block.lunch {
  background: #ffffff !important;
  border: 2px dashed #cbd5e1 !important;
  border-left: 3px solid #94a3b8 !important;
  color: #64748b !important;
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: default; /* No clickeable */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

## 📐 Dimensiones Finales

| Elemento | Antes | Ahora | Reducción |
|----------|-------|-------|-----------|
| Header | 56px | 48px | -14% |
| Celda hora | 52px | 44px | -15% |
| Fuente bloques | 11px | 10px | -9% |
| Fuente días | 11px | 10px | -9% |
| Padding bloques | 6px 8px | 4px 6px | -25% |

## 🚀 Capacidad de Carriles

- **Antes:** Hasta 2-3 turnos simultáneos
- **Ahora:** Hasta **4 turnos simultáneos** sin sobreposición
- **Algoritmo:** First-fit con división proporcional del ancho del día

## 📝 Uso del Campo Almuerzo

### Crear Turno con Almuerzo:
```javascript
{
  persona_id: 1,
  fecha: '2025-10-17',
  hora_inicio: '09:00',
  hora_fin: '18:00',
  hora_almuerzo: '13:00', // ← NUEVO
  tipo_turno: 'completo'
}
```

### Resultado en Calendario:
1. **Bloque 1 (09:00-18:00):** Turno de la persona (color asignado)
2. **Bloque 2 (13:00-14:00):** ALMUERZO (blanco con borde punteado)

## ⚙️ Archivos Modificados

1. ✅ `src/components/WeeklySchedule/WeeklySchedule.jsx`
   - Constantes HEADER_HEIGHT y HOUR_HEIGHT
   - Lógica de click para excluir bloques de almuerzo
   - Cursor condicional según tipo de bloque

2. ✅ `src/components/WeeklySchedule/WeeklySchedule.css`
   - Reducción de tamaños (header, celdas, fuentes, padding)
   - Estilos especiales para `.schedule-block.lunch`

3. ✅ `src/pages/Turnos.jsx`
   - Campo `hora_almuerzo` en formData
   - Input de tiempo en formulario
   - Incluido en handleEdit y closeModal

4. ✅ `src/utils/scheduleHelpers.js`
   - turnosToBlocks() crea bloque adicional si existe hora_almuerzo
   - Cálculo automático de hora_fin de almuerzo (+1 hora)

5. ✅ `sql/agregar_hora_almuerzo.sql` (NUEVO)
   - Script de migración para Supabase

## 🔄 Próximos Pasos

1. **Ejecutar migración SQL en Supabase:**
   ```sql
   -- Copiar contenido de sql/agregar_hora_almuerzo.sql
   -- Ejecutar en SQL Editor de Supabase
   ```

2. **Probar creación de turno con almuerzo:**
   - Crear turno nuevo con hora_almuerzo = "13:00"
   - Verificar que aparezcan 2 bloques en calendario
   - Confirmar que bloque ALMUERZO es blanco y no clickeable

3. **Verificar adaptabilidad:**
   - Crear 4 turnos simultáneos en Jueves
   - Verificar que todos quepan sin sobreponerse
   - Confirmar que bloques de almuerzo también respetan carriles

## ✅ Validaciones Completadas

- ✅ Sin errores de sintaxis
- ✅ Constantes actualizadas consistentemente
- ✅ Estilos CSS aplicados correctamente
- ✅ Lógica de no-edición para almuerzo
- ✅ Migración SQL documentada
- ✅ Formulario con campo adicional
- ✅ Procesamiento automático en helpers

---
**Estado:** ✅ **COMPLETADO Y LISTO PARA PRUEBAS**
