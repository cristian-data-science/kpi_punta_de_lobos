# 💰 Sistema de Cálculo de Sueldo Proporcional

## 📋 Resumen de Funcionalidad

Se ha implementado un sistema de cálculo automático de **sueldo proporcional** basado en los días trabajados. El sistema calcula en tiempo real el sueldo que corresponde pagar según los días trabajados en el mes.

## 🧮 Fórmula de Cálculo

```javascript
sueldo_proporcional = sueldo_base × (dias_trabajados / 30)
```

### Ejemplos Prácticos

| Sueldo Base | Días Trabajados | Cálculo | Sueldo Proporcional | Porcentaje |
|-------------|-----------------|---------|---------------------|------------|
| $150.000 | 30 | 150000 × (30/30) | $150.000 | 100% |
| $150.000 | 15 | 150000 × (15/30) | $75.000 | 50% |
| $150.000 | 20 | 150000 × (20/30) | $100.000 | 67% |
| $150.000 | 10 | 150000 × (10/30) | $50.000 | 33% |
| $600.000 | 25 | 600000 × (25/30) | $500.000 | 83% |
| $450.000 | 22 | 450000 × (22/30) | $330.000 | 73% |

## ✨ Características Implementadas

### 1. **Vista de Tabla de Trabajadores (Workers.jsx)**

#### Nueva Columna: "Sueldo Proporcional"
- ✅ Cálculo automático en tiempo real
- ✅ Actualización dinámica al editar días trabajados
- ✅ Formato de moneda chilena con separadores de miles
- ✅ Color azul destacado para diferenciar del sueldo base
- ✅ Muestra porcentaje del base durante la edición

**Ubicación**: Entre columnas "Días" y "Estado"

**Características visuales**:
- Color azul (#2563eb) para destacar que es un valor calculado
- Font semi-bold para mayor legibilidad
- Durante edición: Muestra porcentaje adicional (ej: "67% del base")
- Formato automático con `toLocaleString('es-CL')`

### 2. **Modal de Creación de Trabajador (AddWorkerModal.jsx)**

#### Card de Preview en Tiempo Real
- ✅ Aparece cuando se completan sueldo base y días trabajados
- ✅ Actualización instantánea al cambiar cualquier valor
- ✅ Muestra 3 datos clave:
  1. **Sueldo Proporcional**: Valor calculado destacado
  2. **Porcentaje**: Qué % del sueldo base representa
  3. **Fórmula Completa**: Transparencia del cálculo

**Diseño del Card**:
```
┌─────────────────────────────────────────┐
│ 💰 Sueldo Proporcional:    $100.000    │
│ Porcentaje: 67% del sueldo base         │
│ 📊 Cálculo: $150.000 × (20/30) = ...   │
└─────────────────────────────────────────┘
```

**Colores**:
- Fondo: `bg-blue-50`
- Borde: `border-blue-200`
- Texto: `text-blue-700` / `text-blue-900`
- Fórmula: `bg-blue-100` (destacado)

## 🎯 Casos de Uso

### Caso 1: Trabajador de Medio Tiempo
**Escenario**: Trabajador que solo trabaja 15 días al mes
- Sueldo Base: $600.000
- Días Trabajados: 15
- **Sueldo Proporcional**: $300.000 (50%)

### Caso 2: Trabajador con Licencia
**Escenario**: Trabajador que tuvo licencia médica 10 días
- Sueldo Base: $450.000
- Días Trabajados: 20 (30 - 10 días de licencia)
- **Sueldo Proporcional**: $300.000 (67%)

### Caso 3: Trabajador de Vacaciones
**Escenario**: Trabajador de vacaciones (paga completo)
- Sueldo Base: $750.000
- Días Trabajados: 30
- Estado: "Vacaciones"
- **Sueldo Proporcional**: $750.000 (100%)

### Caso 4: Incorporación a Mitad de Mes
**Escenario**: Trabajador nuevo que ingresa el día 16
- Sueldo Base: $500.000
- Días Trabajados: 15 (del 16 al 30)
- **Sueldo Proporcional**: $250.000 (50%)

## 🔧 Implementación Técnica

### Función Helper en Workers.jsx

```javascript
// Calcular sueldo proporcional
const calcularSueldoProporcional = (sueldoBase, diasTrabajados) => {
  const sueldo = parseInt(sueldoBase) || 0
  const dias = parseInt(diasTrabajados) || 30
  return Math.round(sueldo * (dias / 30))
}
```

**Características**:
- Conversión a enteros con `parseInt()`
- Valores por defecto: sueldo=0, días=30
- Redondeo con `Math.round()` para evitar decimales
- Manejo de valores nulos/undefined

### Componente de Celda en Tabla

```jsx
<td className="py-3 px-4">
  <div className="text-sm font-semibold text-blue-600">
    ${calcularSueldoProporcional(
      worker.sueldo_base, 
      worker.dias_trabajados
    ).toLocaleString('es-CL')}
  </div>
  {editingWorker === worker.id && (
    <div className="text-xs text-gray-500 mt-1">
      {((parseInt(editForm.dias_trabajados) || 30) / 30 * 100).toFixed(0)}% del base
    </div>
  )}
</td>
```

### Card de Preview en Modal

```jsx
{formData.sueldo_base && formData.dias_trabajados && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    {/* Sueldo calculado */}
    {/* Porcentaje */}
    {/* Fórmula completa */}
  </div>
)}
```

## 📊 Validaciones y Reglas

### Reglas de Negocio

1. **Días Trabajados**:
   - Mínimo: 1 día
   - Máximo: 31 días
   - Default: 30 días

2. **Sueldo Base**:
   - Mínimo: $0
   - Máximo: 2.147.483.647 (límite INTEGER)
   - Default: $0

3. **Redondeo**:
   - Resultado siempre redondeado a entero
   - No se permiten decimales

4. **Estados Especiales**:
   - **Vacaciones**: Siempre 30 días (paga completo)
   - **Licencia**: Usa días reales trabajados
   - **Activo/Inactivo**: Usa días configurados

### Validaciones Implementadas

```javascript
// Validación de días
const dias = parseInt(formData.dias_trabajados)
if (isNaN(dias) || dias < 1 || dias > 31) {
  error = 'Días debe ser entre 1 y 31'
}

// Validación de sueldo
if (formData.sueldo_base && isNaN(parseInt(formData.sueldo_base))) {
  error = 'Sueldo debe ser un número entero válido'
}
```

## 🎨 Diseño y UX

### Jerarquía Visual

1. **Sueldo Base**: Negro/gris oscuro (valor principal)
2. **Sueldo Proporcional**: Azul destacado (valor calculado)
3. **Días Trabajados**: Gris (valor de entrada)

### Estados Interactivos

**Modo Visualización**:
- Sueldo proporcional en azul
- Sin información adicional

**Modo Edición**:
- Sueldo proporcional actualizado en tiempo real
- Porcentaje mostrado debajo
- Color azul más intenso

**Modal de Creación**:
- Card de preview aparece automáticamente
- Actualización instantánea
- Fórmula completa visible

## 📱 Responsive Design

- Tabla horizontal scrollable en móviles
- Card de preview apilado verticalmente en pantallas pequeñas
- Fuentes ajustadas para legibilidad

## 🔄 Flujo de Usuario

### Crear Trabajador

1. Usuario abre modal "Agregar Trabajador"
2. Completa nombre, RUT, etc.
3. Ingresa **Sueldo Base**: $150.000
4. Ingresa **Días Trabajados**: 15
5. **Aparece card automático**: "Sueldo Proporcional: $75.000"
6. Usuario ve claramente: "50% del sueldo base"
7. Guarda trabajador

### Editar Días Trabajados

1. Usuario hace clic en "Editar" (ícono lápiz)
2. Cambia días de 30 a 15
3. **Sueldo proporcional se actualiza automáticamente**
4. Usuario ve nuevo valor: $75.000
5. Ve porcentaje: "50% del base"
6. Guarda cambios

### Visualizar Lista

1. Usuario ve tabla completa
2. Columna "Sueldo Proporcional" visible
3. Valores en azul destacan que son calculados
4. Formato de moneda fácil de leer

## 🧪 Testing Manual

### Test 1: Cálculo Básico
- Sueldo: $150.000
- Días: 30
- **Esperado**: $150.000 (100%)
- **Resultado**: ✅

### Test 2: Medio Mes
- Sueldo: $150.000
- Días: 15
- **Esperado**: $75.000 (50%)
- **Resultado**: ✅

### Test 3: Redondeo
- Sueldo: $100.000
- Días: 7
- **Esperado**: $23.333 → $23.333 (redondeado)
- **Resultado**: ✅

### Test 4: Actualización en Tiempo Real
- Cambiar días de 30 a 10
- **Esperado**: Valor se actualiza inmediatamente
- **Resultado**: ✅

### Test 5: Modal Preview
- Ingresar sueldo y días
- **Esperado**: Card aparece automáticamente
- **Resultado**: ✅

## 📝 Ejemplos de Uso Real

### Ejemplo 1: Nómina de Medio Tiempo
```
Trabajador: Juan Pérez
Sueldo Base: $600.000
Días Trabajados: 15
Sueldo a Pagar: $300.000
```

### Ejemplo 2: Licencia Médica
```
Trabajador: María González
Sueldo Base: $450.000
Días Trabajados: 20 (10 días licencia)
Sueldo a Pagar: $300.000
```

### Ejemplo 3: Ingreso Parcial
```
Trabajador: Pedro López (nuevo)
Sueldo Base: $500.000
Días Trabajados: 10 (ingresó día 21)
Sueldo a Pagar: $166.667
```

## 🎯 Beneficios

1. ✅ **Transparencia**: Usuario ve exactamente cuánto se pagará
2. ✅ **Prevención de Errores**: Cálculo automático elimina errores manuales
3. ✅ **Agilidad**: No necesita calculadora externa
4. ✅ **Trazabilidad**: Fórmula visible en todo momento
5. ✅ **Educativo**: Usuario aprende cómo funciona el prorrateo

## 🚀 Impacto en el Sistema

- **Nueva columna** en tabla de trabajadores
- **Card de preview** en modal de creación
- **Cálculo en tiempo real** durante edición
- **Sin cambios en base de datos** (solo cálculo frontend)
- **No afecta** sistema existente de pagos/cobros

## 📄 Archivos Modificados

1. ✅ `src/pages/Workers.jsx`
   - Función `calcularSueldoProporcional()`
   - Nueva columna en tabla
   - Celda calculada con formato

2. ✅ `src/components/AddWorkerModal.jsx`
   - Card de preview proporcional
   - Cálculo en tiempo real
   - Fórmula visible

## 🎉 Estado Actual

✅ **COMPLETADO** - Sistema funcionando completamente

**Funcionalidades**:
- ✅ Cálculo automático de proporcional
- ✅ Display en tabla de trabajadores
- ✅ Preview en modal de creación
- ✅ Actualización en tiempo real
- ✅ Formato de moneda chilena
- ✅ Porcentaje del sueldo base
- ✅ Fórmula transparente
- ✅ Sin errores de compilación

**Listo para usar en producción** 🚀
