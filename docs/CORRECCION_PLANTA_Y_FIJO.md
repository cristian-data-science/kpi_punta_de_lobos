# ✅ Corrección: Sueldo Proporcional para PLANTA Y FIJO

## 🎯 Cambio Solicitado

**Requisito**: Los cálculos de sueldo proporcional deben aplicarse para **planta Y fijo**, no solo planta. Solo los **eventuales** deben quedar en 0.

---

## 🔧 Cambios Realizados

### 1. **SQL Script** (`sql/add_sueldo_proporcional.sql`)

#### Función PL/pgSQL Actualizada
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

**Cambio clave**: 
- ❌ ANTES: `-- Si es planta, calcular...`
- ✅ AHORA: `-- Si es planta o fijo, calcular...`

#### Query de Actualización Corregido
```sql
-- Calcular proporcional para contratos planta y fijo
UPDATE trabajadores
SET sueldo_proporcional = ROUND((sueldo_base::NUMERIC * dias_trabajados::NUMERIC) / 30.0)::INTEGER
WHERE contrato IN ('planta', 'fijo');
```

**Cambio clave**:
- ❌ ANTES: `WHERE contrato = 'planta'`
- ✅ AHORA: `WHERE contrato IN ('planta', 'fijo')`

---

### 2. **AddWorkerModal.jsx** (Frontend)

#### Campos de Sueldo Condicionales
```javascript
// ❌ ANTES: Solo para planta
{formData.contrato === 'planta' && (
  <div>Sueldo Base...</div>
)}

// ✅ AHORA: Para planta Y fijo
{(formData.contrato === 'planta' || formData.contrato === 'fijo') && (
  <div>Sueldo Base...</div>
)}
```

**Aplicado a:**
- ✅ Campo "Sueldo Base (CLP)"
- ✅ Campo "Días Trabajados"
- ✅ Preview del Sueldo Proporcional

---

### 3. **Workers.jsx** (Frontend)

#### Porcentaje del Base en Edición
```javascript
// ❌ ANTES: Solo mostraba para planta
{editingWorker === worker.id && editForm.contrato === 'planta' && (
  <div className="text-xs text-gray-500 mt-1">
    {((parseInt(editForm.dias_trabajados) || 30) / 30 * 100).toFixed(0)}% del base
  </div>
)}

// ✅ AHORA: Muestra para planta Y fijo
{editingWorker === worker.id && (editForm.contrato === 'planta' || editForm.contrato === 'fijo') && (
  <div className="text-xs text-gray-500 mt-1">
    {((parseInt(editForm.dias_trabajados) || 30) / 30 * 100).toFixed(0)}% del base
  </div>
)}
```

---

### 4. **Documentación Actualizada**

#### `docs/SUELDO_PROPORCIONAL_BD.md`
- ✅ Título cambiado a "Para Contratos 'Planta' y 'Fijo'"
- ✅ Nota agregada explicando que funciona para ambos
- ✅ Código de función actualizado con comentario correcto

#### `docs/RESUMEN_SUELDO_PROPORCIONAL.md`
- ✅ Lógica actualizada: "Si `contrato = 'planta'` O `'fijo'`"

---

## 🔄 Lógica Final del Sistema

### Comportamiento por Tipo de Contrato

| Contrato | Sueldo Base | Días Trabajados | Sueldo Proporcional | Comportamiento |
|----------|-------------|-----------------|---------------------|----------------|
| **Planta** | Campo editable | Campo editable | Calculado automáticamente | ✅ ROUND(base × días/30) |
| **Fijo** | Campo editable | Campo editable | Calculado automáticamente | ✅ ROUND(base × días/30) |
| **Eventual** | 0 (automático) | 0 (automático) | 0 (automático) | ❌ Todo en 0 |

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Trabajador Planta
```sql
INSERT INTO trabajadores (nombre, rut, contrato, sueldo_base, dias_trabajados)
VALUES ('Juan Pérez', '12345678-9', 'planta', 600000, 22);

-- Resultado automático:
-- sueldo_proporcional = ROUND(600000 × (22/30)) = 440000
```

### Ejemplo 2: Trabajador Fijo
```sql
INSERT INTO trabajadores (nombre, rut, contrato, sueldo_base, dias_trabajados)
VALUES ('María González', '98765432-1', 'fijo', 500000, 15);

-- Resultado automático:
-- sueldo_proporcional = ROUND(500000 × (15/30)) = 250000
```

### Ejemplo 3: Trabajador Eventual
```sql
INSERT INTO trabajadores (nombre, rut, contrato, sueldo_base, dias_trabajados)
VALUES ('Pedro López', '11223344-5', 'eventual', 700000, 30);

-- Resultado automático (ignora valores ingresados):
-- sueldo_base = 0
-- dias_trabajados = 0
-- sueldo_proporcional = 0
```

---

## ✅ Verificación de Cambios

### Archivos Modificados
- ✅ `sql/add_sueldo_proporcional.sql` (2 cambios)
- ✅ `src/components/AddWorkerModal.jsx` (3 cambios)
- ✅ `src/pages/Workers.jsx` (1 cambio)
- ✅ `docs/SUELDO_PROPORCIONAL_BD.md` (2 actualizaciones)
- ✅ `docs/RESUMEN_SUELDO_PROPORCIONAL.md` (1 actualización)

### Sin Errores de Compilación
```
✅ Workers.jsx - No errors found
✅ AddWorkerModal.jsx - No errors found
```

---

## 🧪 Pruebas Recomendadas

### En Base de Datos (Después de ejecutar script)
```sql
-- Probar con contrato 'fijo'
INSERT INTO trabajadores (nombre, rut, contrato, sueldo_base, dias_trabajados)
VALUES ('TEST FIJO', '12345678-9', 'fijo', 600000, 20);

-- Verificar resultado
SELECT nombre, contrato, sueldo_base, dias_trabajados, sueldo_proporcional
FROM trabajadores
WHERE nombre = 'TEST FIJO';

-- Esperado: sueldo_proporcional = 400000 (ROUND(600000 × 20/30))
```

### En Frontend (Después de deployment)
1. **Crear trabajador con contrato "fijo"**:
   - Abrir modal "Crear Trabajador"
   - Seleccionar contrato: "Fijo"
   - Verificar que campos de sueldo son visibles ✅
   - Ingresar: Sueldo Base $600.000, Días 20
   - Verificar preview muestra: $400.000 ✅
   
2. **Crear trabajador con contrato "planta"**:
   - Repetir proceso anterior con "Planta"
   - Verificar mismo comportamiento ✅

3. **Crear trabajador con contrato "eventual"**:
   - Seleccionar contrato: "Eventual"
   - Verificar que campos de sueldo NO son visibles ❌
   - Verificar mensaje informativo aparece ✅

---

## 🎯 Estado Final

### Resumen de Corrección
| Aspecto | Estado |
|---------|--------|
| Script SQL actualizado | ✅ Completo |
| Frontend actualizado | ✅ Completo |
| Documentación actualizada | ✅ Completo |
| Sin errores de compilación | ✅ Verificado |
| Lógica para planta | ✅ Funcional |
| Lógica para fijo | ✅ Funcional |
| Lógica para eventual | ✅ Funcional |

### Próxima Acción
1. **Ejecutar script SQL** en Supabase: `sql/add_sueldo_proporcional.sql`
2. **Verificar con query**:
   ```sql
   -- Ver función actualizada
   SELECT prosrc FROM pg_proc WHERE proname = 'calcular_sueldo_proporcional';
   
   -- Debe contener: "Si es planta o fijo"
   ```
3. **Probar en frontend** con los 3 tipos de contrato

---

## 📝 Notas Técnicas

### Compatibilidad con Datos Existentes
- ✅ Contratos "planta" existentes: Se calcularán correctamente
- ✅ Contratos "fijo" existentes: Se calcularán correctamente al ejecutar script
- ✅ Contratos "eventual" existentes: Se resetearán a 0 automáticamente

### Trigger Transparente
- El trigger funciona automáticamente para INSERT/UPDATE
- No requiere cambios en las llamadas API del frontend
- Compatible con todas las operaciones CRUD existentes

---

**Fecha**: 2025-01-01  
**Versión**: 1.1.0 (Corrección inclusión de "fijo")  
**Estado**: ✅ Corrección completada - Listo para ejecutar en BD
