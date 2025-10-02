# 📋 Migración de Campos de Nómina - TransApp

## ✅ Resumen de Cambios Implementados

### 1. **Nuevos Campos en Base de Datos**

Se agregaron los siguientes campos a la tabla `trabajadores`:

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `sueldo_base` | INTEGER | 0 | Sueldo base mensual en CLP (valor entero, sin decimales) |
| `dias_trabajados` | INTEGER | 30 | Días trabajados en el mes (para prorrateo, valor entero) |

### 2. **Modificaciones a Campos Existentes**

#### Campo `estado`
**Antes**: `'activo' | 'inactivo'`  
**Ahora**: `'activo' | 'inactivo' | 'licencia' | 'vacaciones'`

- **licencia**: Trabajador con licencia médica → prorrateo vía `dias_trabajados`
- **vacaciones**: Trabajador de vacaciones → paga base completo (30/30)
- **Regla**: Estados `licencia` y `vacaciones` NO son asignables a turnos

#### Campo `contrato`
**Antes**: `'fijo' | 'eventual' | 'planta'`  
**Ahora**: `'planta' | 'eventual'`

- **planta**: Contrato indefinido (anteriormente "fijo")
- **eventual**: Contrato temporal

### 3. **Cálculo de Pago Base**

```javascript
base_pagado = sueldo_base × (dias_trabajados / 30)
```

**Ejemplos**:
- Trabajador con sueldo $600.000 que trabajó 30 días: `$600.000 × (30/30) = $600.000`
- Trabajador con sueldo $600.000 que trabajó 15 días: `$600.000 × (15/30) = $300.000`
- Trabajador con sueldo $600.000 en vacaciones: `$600.000 × (30/30) = $600.000` (siempre completo)

---

## 🚀 Instrucciones de Implementación

### Paso 1: Aplicar Migración SQL en Supabase

1. **Abre Supabase SQL Editor**:
   ```
   https://supabase.com/dashboard/project/csqxopqlgujduhmwxixo/sql/new
   ```

2. **Copia el contenido del archivo**:
   ```
   sql/add_worker_payroll_fields.sql
   ```

3. **Pega el SQL completo** en el editor y haz clic en **"Run"**

4. **Verifica la ejecución exitosa**: Deberías ver mensajes de confirmación en el panel de resultados

### Paso 2: Verificar los Cambios

Ejecuta esta query en el SQL Editor para confirmar la estructura:

```sql
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trabajadores'
ORDER BY ordinal_position;
```

Deberías ver los nuevos campos `sueldo_base` y `dias_trabajados` en la lista.

### Paso 3: Migrar Datos Existentes

El script SQL automáticamente migra todos los trabajadores con contrato `'fijo'` a `'planta'`.

Si necesitas verificar la migración:

```sql
SELECT 
  nombre, 
  contrato, 
  estado, 
  sueldo_base, 
  dias_trabajados
FROM trabajadores
LIMIT 10;
```

---

## 🎨 Cambios en la Interfaz

### 1. **Página de Trabajadores (Workers.jsx)**

#### Cambios en la Tabla:
- ✅ **Nueva columna**: "Sueldo Base" - Muestra sueldo formateado como `$600.000`
- ✅ **Nueva columna**: "Días" - Muestra días trabajados (1-31)
- ❌ **Columna removida**: "Teléfono" (campo mantiene en BD, solo oculto en vista)

#### Cambios en Filtros:
- **Contrato**: Ahora solo muestra "Planta" y "Eventual"
- **Estado**: Ahora incluye "Licencia" y "Vacaciones"

#### Edición Inline:
- Campos `sueldo_base` y `dias_trabajados` editables directamente en la tabla
- Validación automática de rangos (sueldo >= 0, días 1-31)

### 2. **Modal Agregar Trabajador (AddWorkerModal.jsx)**

#### Nuevos Campos en Formulario:
1. **Sueldo Base (CLP)**
   - Input numérico con ícono de dólar
   - Placeholder: "Ej: 500000"
   - Step: 1000 (incrementos de mil pesos)
   - Validación: número válido >= 0

2. **Días Trabajados**
   - Input numérico con ícono de calendario
   - Default: 30 días
   - Rango: 1-31 días
   - Texto explicativo del cálculo de prorrateo

#### Estados Actualizados:
- **Estado inicial** ahora incluye todas las opciones:
  - Activo
  - Inactivo
  - Licencia
  - Vacaciones

#### Contrato Actualizado:
- Default cambiado de "fijo" a "planta"
- Solo opciones "Planta" y "Eventual"

### 3. **Badges y Colores**

#### Estados:
- 🟢 **Activo**: Verde (`bg-green-50 text-green-700`)
- 🔴 **Inactivo**: Rojo (`bg-red-50 text-red-700`)
- 🟡 **Licencia**: Amarillo (`bg-yellow-50 text-yellow-700`)
- 🔵 **Vacaciones**: Azul (`bg-blue-50 text-blue-700`)

#### Contratos:
- 🟢 **Planta**: Verde (`bg-green-50 text-green-700`)
- 🟠 **Eventual**: Naranja (`bg-orange-50 text-orange-700`)

---

## 🧪 Testing Manual

### Test 1: Crear Trabajador con Nuevos Campos

1. Ve a la página "Trabajadores"
2. Haz clic en "Agregar Trabajador"
3. Completa todos los campos:
   - Nombre: "JUAN PEREZ TEST"
   - RUT: "12345678-9"
   - Contrato: "Planta"
   - Estado: "Activo"
   - Sueldo Base: "600000"
   - Días Trabajados: "30"
4. Haz clic en "Crear Trabajador"
5. **Verificación**: El trabajador debe aparecer en la tabla con los valores correctos

### Test 2: Editar Campos Existentes

1. Encuentra un trabajador existente en la tabla
2. Haz clic en el botón "Editar" (ícono lápiz)
3. Modifica "Sueldo Base" a "750000"
4. Modifica "Días Trabajados" a "25"
5. Modifica "Estado" a "Licencia"
6. Haz clic en "Guardar" (ícono check)
7. **Verificación**: Los cambios deben persistir al recargar la página

### Test 3: Filtros Actualizados

1. Usa el filtro "Estado" y selecciona "Licencia"
2. **Verificación**: Solo trabajadores en licencia deben mostrarse
3. Usa el filtro "Contrato" y selecciona "Planta"
4. **Verificación**: Solo trabajadores de planta deben mostrarse

### Test 4: Validaciones

1. Intenta crear un trabajador con "Días Trabajados" = 0
   - **Resultado esperado**: Error de validación
2. Intenta crear un trabajador con "Días Trabajados" = 35
   - **Resultado esperado**: Error de validación
3. Intenta crear un trabajador con "Sueldo Base" negativo
   - **Resultado esperado**: Error de validación

---

## 📊 Estadísticas Esperadas

Después de la migración:

- **Nuevas cards en Dashboard**:
  - Total trabajadores con sueldo base configurado
  - Promedio sueldo base
  - Total días trabajados en el mes

- **Reportes de Pagos**:
  - Columna "Sueldo Base" en exportaciones Excel
  - Columna "Días Trabajados" en exportaciones Excel
  - Cálculo automático de "Base Pagado" = sueldo_base × (dias_trabajados / 30)

---

## 🔧 Mantenimiento y Reglas de Negocio

### Reglas Automáticas:

1. **Trabajadores en Vacaciones**:
   - `dias_trabajados` siempre se considera 30 (mes completo)
   - Pagan sueldo base completo sin prorrateo

2. **Trabajadores en Licencia**:
   - Se usa el valor real de `dias_trabajados` para prorrateo
   - Ejemplo: 15 días de licencia → 50% del sueldo base

3. **Asignación a Turnos**:
   - Estados "Licencia" y "Vacaciones" NO deben ser asignables en el módulo de Turnos
   - Solo "Activo" puede ser asignado a turnos

### Valores Default:

- `sueldo_base`: 0 (sin sueldo configurado)
- `dias_trabajados`: 30 (mes completo)
- Todos los trabajadores existentes recibirán estos defaults después de la migración

---

## 📝 Archivos Modificados

### Backend/Base de Datos:
- ✅ `sql/add_worker_payroll_fields.sql` - Script de migración completo

### Frontend:
- ✅ `src/components/AddWorkerModal.jsx` - Formulario de creación actualizado
- ✅ `src/pages/Workers.jsx` - Vista de tabla y edición actualizada

### Testing:
- ✅ `test/apply-worker-payroll-migration.cjs` - Script de verificación

---

## ⚠️ Notas Importantes

1. **Backup Recomendado**: Aunque el script es seguro, considera hacer backup de la tabla `trabajadores` antes de ejecutar

2. **Migración Irreversible**: La eliminación de la opción "fijo" del contrato es permanente. Todos los contratos "fijo" se migran a "planta"

3. **Orden de Ejecución**: Debes ejecutar el SQL **ANTES** de desplegar el frontend actualizado

4. **Compatibilidad**: Los cambios son compatibles con la versión actual de TransApp en producción

---

## 🎉 Próximos Pasos

Una vez completada la migración:

1. ✅ Verificar que todos los trabajadores tengan valores correctos
2. ✅ Configurar sueldos base para trabajadores activos
3. ✅ Ajustar días trabajados según corresponda
4. ✅ Actualizar reglas de negocio en módulo de Pagos para usar estos campos
5. ✅ Crear reportes que muestren el cálculo de base_pagado

---

## 🆘 Troubleshooting

### Error: "column already exists"
**Solución**: Los campos ya fueron agregados anteriormente. Puedes continuar sin problema.

### Error: "constraint already exists"
**Solución**: Las restricciones ya fueron actualizadas. Verifica con la query de estructura de tabla.

### Error: "invalid input value"
**Solución**: Verifica que los valores de estado y contrato estén correctamente escritos (sin espacios, lowercase).

---

## 📞 Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs de Supabase SQL Editor
2. Verifica la estructura de la tabla con la query de información de esquema
3. Contacta al equipo de desarrollo con los detalles del error

---

**Última actualización**: 2025-10-01  
**Versión**: 1.0.0  
**Estado**: ✅ Listo para implementación
