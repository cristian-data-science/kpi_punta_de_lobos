# 🔄 Flujo Completo: Marcar Pagos como Pagados

## 📋 Descripción del Sistema

El módulo de Pagos tiene dos fuentes de datos:
1. **Pagos Calculados**: Se calculan en tiempo real desde los turnos (tabla `turnos`)
2. **Pagos Registrados**: Se persisten en la base de datos (tabla `pagos`)

## 🔀 Estados de un Pago

Un pago puede estar en 3 estados:

| Estado | Descripción | En BD | Badge |
|--------|-------------|-------|-------|
| `pendiente` | Calculado pero no pagado | Puede estar o no | 🟡 ⏳ Pendiente |
| `parcial` | Pagado parcialmente | ✅ Sí | 🟠 ⚠️ Parcial |
| `pagado` | Pagado completamente | ✅ Sí | 🟢 ✅ Pagado |

## 🎯 Flujo: Marcar como Pagado

### Caso 1: Pago NO existe en BD (`id_pago` = undefined)

```
Usuario hace clic en "Marcar Pagado"
    ↓
¿Existe id_pago?
    ↓ NO
Se ejecuta sincronizarPagos(mes, anio)
    ↓
Se crea registro en tabla `pagos`
    ↓
Se recarga cargarDatos()
    ↓
Se busca el pago recién creado por persona_id
    ↓
Se ejecuta marcarComoPagado(id_pago, monto, ...)
    ↓
Trigger actualiza estado = 'pagado'
    ↓
✅ Usuario ve Badge "✅ Pagado"
```

### Caso 2: Pago YA existe en BD (`id_pago` = UUID válido)

```
Usuario hace clic en "Marcar Pagado"
    ↓
¿Existe id_pago?
    ↓ SÍ
Se ejecuta marcarComoPagado(id_pago, monto, ...)
    ↓
Trigger actualiza estado = 'pagado'
    ↓
✅ Usuario ve Badge "✅ Pagado"
```

## 🔙 Flujo: Desmarcar Pago

```
Usuario hace clic en "Desmarcar"
    ↓
¿Existe id_pago?
    ↓ SÍ (obligatorio)
Se ejecuta desmarcarPago(id_pago)
    ↓
Se actualiza:
  - monto_pagado = 0
  - fecha_pago = NULL
  - estado = 'pendiente'
    ↓
✅ Usuario ve Badge "⏳ Pendiente"
```

## 🔄 Flujo: Sincronizar Pagos (Masivo)

```
Usuario hace clic en "Sincronizar Pagos"
    ↓
Se ejecuta sincronizarPagos(mes, anio)
    ↓
Backend calcula pagos desde turnos
    ↓
Para cada persona:
  - Si NO existe registro → INSERT
  - Si SÍ existe → UPDATE solo monto_calculado
    ↓
✅ Todos los pagos ahora tienen id_pago
```

## 📊 Componentes del Sistema

### Frontend: `Pagos.jsx`

#### Funciones Principales

1. **`cargarDatos()`**
   - Carga pagos calculados + pagos registrados
   - Combina ambas fuentes
   - Prioriza datos de BD si existen

2. **`handleSincronizar()`**
   - Crea/actualiza registros masivamente
   - Útil al inicio de cada periodo

3. **`handleMarcarPagado(pago)`**
   - Si no existe → sincroniza primero
   - Luego marca como pagado
   - Actualiza fecha_pago, metodo_pago, etc.

4. **`handleDesmarcarPago(pago)`**
   - Solo funciona si existe id_pago
   - Resetea a estado pendiente

### Backend: `supabaseHelpers.js`

#### Funciones API

1. **`calcularPagosPorPeriodo(filters)`**
   - Lee tabla `turnos`
   - Calcula montos por persona
   - NO escribe en BD

2. **`obtenerPagosRegistrados(filters)`**
   - Lee tabla `pagos`
   - Devuelve registros persistidos

3. **`sincronizarPagos(mes, anio)`**
   - Calcula pagos
   - Hace UPSERT masivo en `pagos`
   - Devuelve registros creados/actualizados

4. **`marcarComoPagado(pagoId, montoPagado, metodoPago, referenciaPago, notas)`**
   - UPDATE en tabla `pagos`
   - Actualiza campos de pago
   - Trigger automático actualiza `estado`

5. **`desmarcarPago(pagoId)`**
   - UPDATE en tabla `pagos`
   - Resetea monto_pagado = 0
   - Trigger automático cambia estado a 'pendiente'

### Base de Datos: `pagos` table

#### Triggers Automáticos

1. **`actualizar_estado_pago`**
   ```sql
   IF monto_pagado >= monto_calculado THEN
     estado = 'pagado'
   ELSIF monto_pagado > 0 THEN
     estado = 'parcial'
   ELSE
     estado = 'pendiente'
   END IF
   ```

2. **`update_pagos_timestamp`**
   - Actualiza `updated_at = NOW()`
   - Se ejecuta en cada UPDATE

## 🚨 Manejo de Errores

### Error: "invalid input syntax for type uuid: 'undefined'"

**Causa**: Intentar actualizar un registro que no existe en BD

**Solución Implementada**:
```javascript
if (!pago.id_pago) {
  // Primero sincronizar para crear el registro
  await sincronizarPagos(mes, anio)
  // Luego obtener el id_pago recién creado
  await cargarDatos()
  // Finalmente marcar como pagado
}
```

### Error: "Este pago no está registrado en la base de datos"

**Causa**: Intentar desmarcar un pago que solo existe como cálculo

**Solución Implementada**:
```javascript
if (!pago.id_pago) {
  setMessage({ type: 'error', text: 'Error: Este pago no está registrado' })
  return
}
```

## 🎨 UI: Lógica de Botones

### Botón "Marcar Pagado" (Verde)

- **Se muestra**: `estado === 'pendiente'`
- **Siempre visible**: Incluso si no hay `id_pago`
- **Tooltip**: "Se creará el registro automáticamente" (sin id_pago)
- **Acción**: Crea registro si no existe, luego marca como pagado

### Botón "Desmarcar" (Naranja)

- **Se muestra**: `(estado === 'pagado' || estado === 'parcial') && id_pago`
- **Requiere**: `id_pago` válido
- **Acción**: Resetea a pendiente

### Botón "Sincronizar Pagos" (Teal)

- **Ubicación**: Header del módulo
- **Se muestra**: Siempre
- **Acción**: Crea/actualiza todos los registros del periodo

## 📈 KPIs Calculados

Los KPIs se calculan combinando ambas fuentes:

```javascript
// Total Pagado → Suma de registros con estado='pagado' en BD
total_pagado = SUM(monto_pagado WHERE estado='pagado')

// Total Pendiente → Suma de cálculos - pagado
total_pendiente = SUM(monto_calculado) - total_pagado

// Personas Activas → Distintas personas con turnos
numero_personas = COUNT(DISTINCT persona_id)
```

## ✅ Checklist de Pruebas

- [ ] Clic en "Sincronizar Pagos" crea registros
- [ ] Clic en "Marcar Pagado" (sin id_pago) funciona
- [ ] Clic en "Marcar Pagado" (con id_pago) funciona
- [ ] Badge cambia de "⏳ Pendiente" a "✅ Pagado"
- [ ] Botón "Desmarcar" aparece después de marcar
- [ ] Clic en "Desmarcar" vuelve a "⏳ Pendiente"
- [ ] KPIs se actualizan correctamente
- [ ] No hay errores en consola

## 🔗 Archivos Relacionados

- `src/pages/Pagos.jsx` - Frontend principal
- `src/services/supabaseHelpers.js` - Backend API
- `sql/EJECUTAR_AHORA_crear_tabla_pagos.sql` - Schema SQL
- `docs/changelogs/CHANGELOG_SISTEMA_PAGOS.md` - Historial de cambios
- `docs/development/IMPLEMENTACION_SISTEMA_PAGOS.md` - Guía técnica

---
**Fecha**: Octubre 2025  
**Issue**: #5 - Sistema de Pagos Completo  
**Status**: ✅ Completado
