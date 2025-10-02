# Sistema de Sueldo Proporcional en Base de Datos

## 📋 Resumen de Implementación

Se implementó un sistema **completamente automático** para el cálculo y almacenamiento del sueldo proporcional directamente en la base de datos PostgreSQL/Supabase.

---

## 🎯 Objetivos Cumplidos

1. ✅ **Campo `sueldo_proporcional`** agregado a tabla `trabajadores`
2. ✅ **Trigger automático** para cálculo en INSERT/UPDATE
3. ✅ **Reseteo automático a 0** para contratos eventuales
4. ✅ **Eliminación de cálculo manual** en frontend
5. ✅ **UI actualizada** para mostrar valores de BD

---

## 🗄️ Arquitectura de Base de Datos

### Nuevo Campo Agregado

```sql
ALTER TABLE trabajadores 
ADD COLUMN IF NOT EXISTS sueldo_proporcional INTEGER DEFAULT 0 NOT NULL;
```

**Características:**
- Tipo: `INTEGER` (sin decimales)
- Default: `0`
- NOT NULL: Siempre tiene valor
- Calculado automáticamente por trigger

---

## ⚡ Sistema de Trigger Automático

### Función de Cálculo

```sql
CREATE OR REPLACE FUNCTION calcular_sueldo_proporcional()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es contrato eventual, resetear valores a 0
  IF NEW.contrato = 'eventual' THEN
    NEW.sueldo_base := 0;
    NEW.dias_trabajados := 0;
    NEW.sueldo_proporcional := 0;
  ELSE
    -- Si es planta o fijo, calcular sueldo proporcional
    NEW.sueldo_proporcional := ROUND((NEW.sueldo_base::NUMERIC * NEW.dias_trabajados::NUMERIC) / 30.0)::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger BEFORE INSERT OR UPDATE

```sql
CREATE TRIGGER trigger_calcular_sueldo_proporcional
BEFORE INSERT OR UPDATE OF sueldo_base, dias_trabajados, contrato
ON trabajadores
FOR EACH ROW
EXECUTE FUNCTION calcular_sueldo_proporcional();
```

**Características del Trigger:**
- **Momento**: BEFORE (antes de guardar)
- **Eventos**: INSERT, UPDATE de `sueldo_base`, `dias_trabajados`, `contrato`
- **Scope**: FOR EACH ROW (por cada fila modificada)
- **Acción**: Calcula y asigna `sueldo_proporcional` automáticamente

---

## 🔄 Lógica de Negocio Implementada

### Para Contratos "Planta" y "Fijo"

```
sueldo_proporcional = ROUND(sueldo_base × (dias_trabajados / 30))
```

**Ejemplos:**
- Sueldo Base: $600.000, Días: 30 → Proporcional: $600.000 (100%)
- Sueldo Base: $600.000, Días: 15 → Proporcional: $300.000 (50%)
- Sueldo Base: $700.000, Días: 22 → Proporcional: $513.333 (73.3%)

**Nota:** Funciona tanto para contratos "planta" como "fijo" (ambos son contratos de tiempo completo).

### Para Contratos "Eventual"

```
sueldo_base = 0
dias_trabajados = 0
sueldo_proporcional = 0
```

**Automatización:**
- Al cambiar contrato a "eventual" → valores resetean a 0
- Al cambiar de "eventual" a "planta" → valores mantienen 0 hasta actualización manual

---

## 🎨 Cambios en Frontend

### Workers.jsx

#### ANTES (Cálculo Manual)
```javascript
// ❌ Función eliminada
const calcularSueldoProporcional = (sueldoBase, diasTrabajados) => {
  const sueldo = parseInt(sueldoBase) || 0
  const dias = parseInt(diasTrabajados) || 30
  return Math.round(sueldo * (dias / 30))
}

// ❌ Mostrar cálculo manual
${calcularSueldoProporcional(worker.sueldo_base, worker.dias_trabajados)}
```

#### DESPUÉS (Valor de BD)
```javascript
// ✅ Sin función de cálculo manual

// ✅ Mostrar valor directo de BD
<div className="text-sm font-semibold text-blue-600">
  ${(worker.sueldo_proporcional || 0).toLocaleString('es-CL')}
</div>
```

### AddWorkerModal.jsx

#### Campos Condicionales (Solo Planta)
```javascript
{/* Sueldo Base (solo para contratos planta) */}
{formData.contrato === 'planta' && (
  <div className="space-y-2">
    <Label>Sueldo Base (CLP)</Label>
    <Input type="number" value={formData.sueldo_base} />
  </div>
)}

{/* Días Trabajados (solo para contratos planta) */}
{formData.contrato === 'planta' && (
  <div className="space-y-2">
    <Label>Días Trabajados *</Label>
    <Input type="number" value={formData.dias_trabajados} />
  </div>
)}
```

#### Mensaje para Eventuales
```javascript
{/* Mensaje para contratos eventuales */}
{formData.contrato === 'eventual' && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
    <p className="font-medium text-amber-800">👷 Contrato Eventual</p>
    <p className="text-amber-700">
      Los trabajadores eventuales no tienen sueldo base ni días trabajados.
      El sistema automáticamente establecerá estos valores en <strong>0</strong>.
    </p>
  </div>
)}
```

#### Preview Actualizado
```javascript
{/* Preview del Sueldo Proporcional (solo para planta) */}
{formData.contrato === 'planta' && formData.sueldo_base && formData.dias_trabajados && (
  <div className="bg-blue-50 border p-4">
    <div>💰 Sueldo Proporcional: $XXX.XXX</div>
    <div className="text-xs text-blue-500">
      <AlertCircle /> Este cálculo se realizará automáticamente en la base de datos al guardar
    </div>
  </div>
)}
```

---

## 🧪 Casos de Prueba

### Prueba 1: Crear Trabajador Planta
```sql
INSERT INTO trabajadores (nombre, rut, contrato, sueldo_base, dias_trabajados)
VALUES ('Juan Pérez', '12345678-9', 'planta', 600000, 30);

-- Resultado esperado:
-- sueldo_proporcional = 600000 (automático)
```

### Prueba 2: Cambiar Días Trabajados
```sql
UPDATE trabajadores 
SET dias_trabajados = 15
WHERE rut = '12345678-9';

-- Resultado esperado:
-- sueldo_proporcional = 300000 (recalculado automáticamente)
```

### Prueba 3: Cambiar Contrato a Eventual
```sql
UPDATE trabajadores 
SET contrato = 'eventual'
WHERE rut = '12345678-9';

-- Resultado esperado:
-- sueldo_base = 0 (automático)
-- dias_trabajados = 0 (automático)
-- sueldo_proporcional = 0 (automático)
```

### Prueba 4: Cambiar de Eventual a Planta
```sql
UPDATE trabajadores 
SET contrato = 'planta', sueldo_base = 700000, dias_trabajados = 22
WHERE rut = '12345678-9';

-- Resultado esperado:
-- sueldo_proporcional = 513333 (calculado automáticamente)
-- Formula: ROUND(700000 * (22/30)) = 513333
```

---

## 📂 Archivos Modificados

### Scripts SQL
1. **`sql/add_sueldo_proporcional.sql`** (NUEVO)
   - Agrega campo `sueldo_proporcional`
   - Crea función de cálculo
   - Crea trigger automático
   - Actualiza registros existentes
   - Incluye queries de verificación

### Frontend Components
1. **`src/pages/Workers.jsx`**
   - ❌ Eliminada función `calcularSueldoProporcional()`
   - ✅ Usa `worker.sueldo_proporcional` directamente
   - ✅ Muestra mensaje "(Eventual: N/A)" para eventuales

2. **`src/components/AddWorkerModal.jsx`**
   - ✅ Campos de sueldo solo visibles para "planta"
   - ✅ Mensaje informativo para "eventual"
   - ✅ Preview actualizado con aviso de cálculo automático

---

## 🔍 Queries de Verificación

### Ver Estructura de Tabla
```sql
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trabajadores'
AND column_name IN ('sueldo_base', 'dias_trabajados', 'sueldo_proporcional', 'contrato')
ORDER BY ordinal_position;
```

### Ver Triggers Activos
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'trabajadores'
AND trigger_name = 'trigger_calcular_sueldo_proporcional';
```

### Estadísticas por Tipo de Contrato
```sql
SELECT 
  contrato,
  COUNT(*) as cantidad,
  ROUND(AVG(sueldo_base), 2) as sueldo_base_promedio,
  ROUND(AVG(dias_trabajados), 2) as dias_promedio,
  ROUND(AVG(sueldo_proporcional), 2) as sueldo_proporcional_promedio
FROM trabajadores
GROUP BY contrato
ORDER BY contrato;
```

### Ver Trabajadores con Todos los Campos
```sql
SELECT 
  nombre,
  rut,
  contrato,
  sueldo_base,
  dias_trabajados,
  sueldo_proporcional
FROM trabajadores
ORDER BY contrato, nombre;
```

---

## ⚠️ Consideraciones Importantes

### 1. Integridad de Datos
- ✅ El cálculo siempre es consistente (mismo input = mismo output)
- ✅ No hay riesgo de desincronización entre frontend y BD
- ✅ Los valores históricos se mantienen inmutables hasta nueva actualización

### 2. Performance
- ✅ Trigger BEFORE es eficiente (ejecuta antes de escribir)
- ✅ No requiere queries adicionales después de INSERT/UPDATE
- ✅ Índice creado para búsquedas rápidas

### 3. Mantenibilidad
- ✅ Lógica centralizada en BD (single source of truth)
- ✅ Cambios en fórmula solo requieren modificar función PL/pgSQL
- ✅ Frontend simplificado (menos código, menos bugs)

### 4. Comportamiento Automático
- ✅ **Eventual → 0 automático**: Al cambiar contrato a eventual, valores resetean
- ✅ **Update automático**: Al cambiar sueldo_base o dias_trabajados, recalcula proporcional
- ✅ **Create automático**: Al crear trabajador, calcula proporcional inmediatamente

---

## 🚀 Deployment

### Orden de Ejecución

1. **Ejecutar Script SQL**
   ```bash
   # En Supabase SQL Editor
   Ejecutar: sql/add_sueldo_proporcional.sql
   ```

2. **Verificar Trigger**
   ```sql
   SELECT trigger_name FROM information_schema.triggers 
   WHERE event_object_table = 'trabajadores';
   ```

3. **Deployment Frontend**
   ```bash
   pnpm build
   vercel --prod
   ```

### Rollback (Si es necesario)

```sql
-- Eliminar trigger
DROP TRIGGER IF EXISTS trigger_calcular_sueldo_proporcional ON trabajadores;

-- Eliminar función
DROP FUNCTION IF EXISTS calcular_sueldo_proporcional();

-- Eliminar campo (CUIDADO: esto borra datos)
ALTER TABLE trabajadores DROP COLUMN IF EXISTS sueldo_proporcional;
```

---

## ✅ Checklist de Implementación

- [x] Script SQL creado (`add_sueldo_proporcional.sql`)
- [x] Campo `sueldo_proporcional` agregado
- [x] Función `calcular_sueldo_proporcional()` creada
- [x] Trigger `trigger_calcular_sueldo_proporcional` configurado
- [x] Registros existentes actualizados
- [x] Índice de performance creado
- [x] Workers.jsx actualizado (eliminado cálculo manual)
- [x] AddWorkerModal.jsx actualizado (campos condicionales)
- [x] Documentación completa creada
- [ ] Script SQL ejecutado en Supabase (PENDING - USUARIO DEBE EJECUTAR)
- [ ] Tests de verificación ejecutados
- [ ] Deployment a producción

---

## 📚 Referencias

- **Script SQL**: `sql/add_sueldo_proporcional.sql`
- **Workers Component**: `src/pages/Workers.jsx`
- **Add Worker Modal**: `src/components/AddWorkerModal.jsx`
- **Supabase Docs**: https://supabase.com/docs/guides/database/functions
- **PostgreSQL Triggers**: https://www.postgresql.org/docs/current/sql-createtrigger.html

---

## 🎉 Beneficios del Sistema

| Antes | Después |
|-------|---------|
| Cálculo manual en frontend | Cálculo automático en BD |
| Riesgo de inconsistencias | Valores siempre consistentes |
| Código duplicado | Lógica centralizada |
| Difícil mantener | Fácil de actualizar |
| No persiste valores | Valores guardados permanentemente |

---

**Última actualización**: 2025-01-01  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado - Pendiente deployment BD
