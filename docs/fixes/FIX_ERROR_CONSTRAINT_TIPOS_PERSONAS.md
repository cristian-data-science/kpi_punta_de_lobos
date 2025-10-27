# 🔧 FIX: Error de Constraint al Agregar Personas

## ❌ Error
```
Error al crear: new row for relation "personas" violates check constraint "personas_tipo_check"
```

## 🐛 Causa del Problema

Hay un **desajuste** entre los valores en la base de datos y los valores enviados desde el frontend:

### En la Base de Datos (Supabase):
```sql
CHECK (tipo IN ('visitante', 'guia', 'guarda parque', 'baño', 'staff', 'instructor', 'otro'))
                                      ^^^^^^^^^^^  ^^^^
                                      CON ESPACIOS ❌
```

### Desde el Frontend (React):
```javascript
<option value="guarda_parque">Guarda Parque</option>
<option value="guarda_bano">Baño</option>
                  ^^^^^^^^^^^
                  CON GUIONES BAJOS ✅
```

**El constraint rechaza** `'guarda_parque'` porque espera `'guarda parque'` (con espacio).

## ✅ Solución

### Paso 1: Ejecutar SQL en Supabase

1. Ve a **Supabase Dashboard**
2. Navega a **SQL Editor**
3. Ejecuta el archivo: `sql/EJECUTAR_AHORA_fix_constraint_tipos.sql`

O copia y pega esto:

```sql
-- Eliminar constraint antiguo
ALTER TABLE personas 
DROP CONSTRAINT IF EXISTS personas_tipo_check;

-- Agregar constraint correcto
ALTER TABLE personas 
ADD CONSTRAINT personas_tipo_check 
CHECK (tipo IN (
  'visitante', 
  'guia', 
  'staff', 
  'instructor', 
  'guarda_parque',   -- ✅ Con guion bajo
  'guarda_bano',     -- ✅ Con guion bajo
  'otro'
));
```

### Paso 2: Verificar

Ejecuta esta query para confirmar:

```sql
SELECT
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'personas' 
  AND tc.constraint_type = 'CHECK';
```

Deberías ver:
```
((tipo)::text = ANY (ARRAY[
  'visitante'::text, 
  'guia'::text, 
  'staff'::text, 
  'instructor'::text, 
  'guarda_parque'::text,    ✅
  'guarda_bano'::text,      ✅
  'otro'::text
]))
```

### Paso 3: Probar en la Aplicación

1. Ve a **Personas** en la app
2. Haz clic en **Agregar Persona**
3. Selecciona tipo **Guarda Parque** o **Baño**
4. Guarda

✅ Ahora debería funcionar sin error.

## 📊 Valores Correctos

| Frontend (`value`)  | Base de Datos (constraint) | Mostrado en UI        |
|---------------------|----------------------------|----------------------|
| `visitante`         | `visitante`                | Visitante            |
| `guia`              | `guia`                     | Guía                 |
| `staff`             | `staff`                    | Staff                |
| `instructor`        | `instructor`               | Instructor           |
| `guarda_parque`     | `guarda_parque` ✅         | Guarda Parque        |
| `guarda_bano`       | `guarda_bano` ✅           | Baño                 |
| `otro`              | `otro`                     | Otro                 |

## 🎯 Por Qué Usar Guiones Bajos

1. **Estándar en bases de datos**: Los valores de enums/constraints no deberían tener espacios
2. **Compatibilidad**: Evita problemas con queries y URLs
3. **Consistencia**: Mismo formato que otros campos del sistema
4. **Sin ambigüedad**: `'guarda_parque'` es un solo valor, no dos palabras

## 🔍 Cómo Detectar Este Error

Si ves este error:
```
violates check constraint "personas_tipo_check"
```

**Significa** que estás intentando insertar un valor que no está en la lista del constraint CHECK.

**Solución**: Sincronizar los valores entre frontend y base de datos.

---

**Fecha**: 15 de octubre de 2025
**Estado**: ✅ Resuelto
