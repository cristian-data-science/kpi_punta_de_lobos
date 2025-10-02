# 🔧 Solución al Error de Migración

## ❌ Error Encontrado

```
ERROR: 23514: check constraint "trabajadores_contrato_check" 
of relation "trabajadores" is violated by some row
```

## 📋 Causa del Problema

El error ocurre porque estamos intentando aplicar una restricción CHECK que solo permite valores `'planta'` y `'eventual'`, pero en la base de datos existen trabajadores con el valor `'fijo'` que debe ser migrado primero.

**Orden incorrecto original**:
1. ❌ Aplicar constraint (falla porque hay datos 'fijo')
2. Migrar datos 'fijo' → 'planta'

**Orden correcto**:
1. ✅ Migrar datos 'fijo' → 'planta' PRIMERO
2. Aplicar constraint (ahora funciona)

## 🚀 Solución Rápida (3 Opciones)

### **Opción 1: Usar Script Corregido** ⭐ RECOMENDADO

El archivo `sql/add_worker_payroll_fields.sql` ya fue actualizado con el orden correcto.

**Pasos**:
1. Refresca el contenido del archivo en el editor
2. Copia TODO el contenido actualizado
3. Ejecuta en Supabase SQL Editor

El script ahora migra los datos ANTES de aplicar las restricciones.

---

### **Opción 2: Usar Script Paso a Paso** 🛡️ MÁS SEGURO

Si quieres más control, usa el nuevo archivo `sql/step_by_step_migration.sql`

**Pasos**:
1. Abre `sql/step_by_step_migration.sql`
2. Ejecuta SECCIÓN POR SECCIÓN (hay comentarios de PASO 1, PASO 2, etc.)
3. Verifica cada resultado antes de continuar

**Ventajas**:
- Puedes ver el progreso de cada paso
- Detectas problemas inmediatamente
- Rollback más fácil si algo falla

---

### **Opción 3: Diagnóstico + Corrección Manual** 🔍 PARA DEBUGGING

Si quieres entender exactamente qué datos tienes:

#### Paso 1: Ejecutar Diagnóstico
```sql
-- Abre sql/diagnostic_pre_migration.sql
-- Ejecuta TODAS las queries
```

Esto te mostrará:
- ✅ Qué valores de contrato existen actualmente
- ✅ Cuántos trabajadores tienen cada valor
- ✅ Qué constraints existen
- ✅ Estructura actual de la tabla

#### Paso 2: Migrar Manualmente los Datos
```sql
-- 1. Ver cuántos trabajadores tienen 'fijo'
SELECT COUNT(*) FROM trabajadores WHERE contrato = 'fijo';

-- 2. Ver quiénes son
SELECT id, nombre, rut, contrato FROM trabajadores WHERE contrato = 'fijo';

-- 3. Migrar 'fijo' a 'planta'
UPDATE trabajadores SET contrato = 'planta' WHERE contrato = 'fijo';

-- 4. Verificar que no queden trabajadores con 'fijo'
SELECT contrato, COUNT(*) as cantidad 
FROM trabajadores 
GROUP BY contrato;
```

#### Paso 3: Eliminar Constraint Antiguo
```sql
ALTER TABLE trabajadores 
DROP CONSTRAINT IF EXISTS trabajadores_contrato_check;
```

#### Paso 4: Agregar Constraint Nuevo
```sql
ALTER TABLE trabajadores 
ADD CONSTRAINT trabajadores_contrato_check 
CHECK (contrato IN ('planta', 'eventual'));
```

---

## 📊 Verificación Post-Migración

Después de ejecutar cualquiera de las opciones, verifica:

```sql
-- 1. Ver estructura de campos nuevos
SELECT column_name, data_type, column_default 
FROM information_schema.columns
WHERE table_name = 'trabajadores' 
AND column_name IN ('sueldo_base', 'dias_trabajados');

-- 2. Ver valores de contrato actuales
SELECT contrato, COUNT(*) as cantidad 
FROM trabajadores 
GROUP BY contrato;

-- 3. Ver constraints aplicados
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE 'trabajadores_%_check';

-- 4. Ver datos de ejemplo
SELECT id, nombre, contrato, estado, sueldo_base, dias_trabajados
FROM trabajadores
LIMIT 5;
```

**Resultados esperados**:
- ✅ `sueldo_base` y `dias_trabajados` deben existir
- ✅ Solo deben aparecer contratos 'planta' y 'eventual'
- ✅ Constraints `trabajadores_estado_check` y `trabajadores_contrato_check` deben existir
- ✅ Todos los trabajadores deben tener `sueldo_base = 0` y `dias_trabajados = 30` por default

---

## 🆘 Si Aún Tienes Problemas

### Error: "constraint already exists"
**Solución**: Elimina el constraint primero
```sql
ALTER TABLE trabajadores DROP CONSTRAINT trabajadores_contrato_check;
```

### Error: "column already exists"
**Solución**: Está bien, el campo ya fue agregado. Continúa con los siguientes pasos.

### Error: "some rows violate constraint"
**Causas posibles**:
1. Aún hay trabajadores con contrato 'fijo'
   ```sql
   SELECT * FROM trabajadores WHERE contrato NOT IN ('planta', 'eventual');
   ```
2. Hay valores NULL en contrato
   ```sql
   SELECT * FROM trabajadores WHERE contrato IS NULL;
   ```
3. Hay valores con mayúsculas/minúsculas incorrectas
   ```sql
   SELECT DISTINCT contrato FROM trabajadores;
   ```

**Solución general**: Actualiza TODOS los valores problemáticos antes de aplicar el constraint
```sql
-- Ejemplo: Si hay valores NULL
UPDATE trabajadores SET contrato = 'eventual' WHERE contrato IS NULL;

-- Ejemplo: Si hay valores con mayúsculas
UPDATE trabajadores SET contrato = LOWER(contrato);
```

---

## 📁 Archivos Disponibles

| Archivo | Propósito | Cuándo Usar |
|---------|-----------|-------------|
| `add_worker_payroll_fields.sql` | Script completo corregido | Migración normal (RECOMENDADO) |
| `step_by_step_migration.sql` | Migración paso a paso | Cuando quieres control total |
| `diagnostic_pre_migration.sql` | Solo diagnóstico | Para debugging y análisis |

---

## ✅ Checklist Final

Antes de considerar la migración completa, verifica:

- [ ] Script SQL ejecutado sin errores
- [ ] Campos `sueldo_base` y `dias_trabajados` existen
- [ ] No quedan trabajadores con contrato 'fijo'
- [ ] Constraints CHECK están aplicados correctamente
- [ ] Índices fueron creados
- [ ] Frontend actualizado puede leer los nuevos campos

---

## 🎯 Próximo Paso Después de SQL

Una vez que el SQL esté aplicado exitosamente:

1. El frontend en `pre-prod` ya está actualizado
2. Puedes probar creando un nuevo trabajador
3. Verifica que aparezcan los campos "Sueldo Base" y "Días"
4. Intenta editar un trabajador existente
5. Confirma que los filtros funcionen con los nuevos estados

**¡Todo listo para producción después de estas verificaciones!** 🚀
