# Actualización: Revertir Turnos con Reset de Cobros

## Funcionalidad Implementada

### Problema Anterior
Cuando se revertían turnos de "completado" a "programado", solo se reseteaba el campo `pago` a 0, pero el campo `cobro` mantenía su valor.

### Solución Implementada
Ahora cuando se revierten turnos, ambos campos se resetean:
- **`pago`**: 0
- **`cobro`**: 0

## Código Actualizado

### Función `handleRollbackWeekToProgrammed`

#### Update Query Modificado
```javascript
// Actualizar todos los turnos de completado a programado Y resetear pago Y cobro a 0
const { error: updateError } = await supabase
  .from('turnos')
  .update({ 
    estado: 'programado',
    pago: 0,      // Resetear pago
    cobro: 0      // Resetear cobro (NUEVO)
  })
  .gte('fecha', weekStartKey)
  .lte('fecha', weekEndKey)
  .eq('estado', 'completado')
```

#### Mensaje de Confirmación Actualizado
```javascript
// Confirmación previa
const confirmation = window.confirm(
  `¿Estás seguro de que quieres REVERTIR todos los ${weekTurnos.length} turnos completados de la semana ${weekRange} de vuelta a programados?\n\nEsto BORRARÁ los pagos y cobros calculados y los pondrá en $0.\nEsta acción afectará los cálculos de pagos y cobros.`
)

// Confirmación posterior
alert(`✅ ${weekTurnos.length} turnos de la semana ${weekRange} revertidos a programados exitosamente\n\n💰 Pagos reseteados a $0\n🧾 Cobros reseteados a $0`)
```

#### Logs Actualizados
```javascript
console.log('✅ Todos los turnos de la semana revertidos a programados con pagos y cobros reseteados a $0')
```

## Flujo Completo

### 1. Marcar Turno/Semana como Completado
- **Estado**: `programado` → `completado`
- **Pago**: 0 → tarifa calculada (variable según turno/día)
- **Cobro**: 0 → tarifa fija (`cobro_tarifa` de shift_rates)

### 2. Revertir Turno/Semana a Programado
- **Estado**: `completado` → `programado`  
- **Pago**: valor calculado → 0
- **Cobro**: valor fijo → 0

## Consistencia de Datos

### Antes de la Corrección
❌ **Inconsistente**:
- Turnos programados: `pago = 0`, `cobro = valor_anterior`
- Podía generar confusión en reportes y cálculos

### Después de la Corrección  
✅ **Consistente**:
- Turnos programados: `pago = 0`, `cobro = 0`
- Turnos completados: `pago = tarifa_variable`, `cobro = tarifa_fija`

## Estados de Turnos

### Programado
```json
{
  "estado": "programado",
  "pago": 0,
  "cobro": 0
}
```

### Completado
```json
{
  "estado": "completado", 
  "pago": 22500,  // Variable según turno/día
  "cobro": 25000  // Fijo desde cobro_tarifa
}
```

## Casos de Uso

### Escenario 1: Corrección de Error
1. **Usuario**: Marca semana como completada por error
2. **Sistema**: Calcula y guarda pagos y cobros
3. **Usuario**: Se da cuenta del error, revierte la semana
4. **Sistema**: Resetea ambos campos a 0 ✅

### Escenario 2: Recálculo de Tarifas
1. **Usuario**: Semana completada con tarifas antiguas
2. **Admin**: Actualiza tarifas en shift_rates
3. **Usuario**: Revierte semana para recalcular con nuevas tarifas
4. **Sistema**: Limpia valores anteriores ✅
5. **Usuario**: Vuelve a completar con tarifas nuevas

### Escenario 3: Auditoría de Datos
1. **Auditor**: Revisa reportes de pagos y cobros
2. **Sistema**: Solo muestra valores para turnos completados
3. **Auditor**: Datos consistentes - turnos programados = 0 ✅

## Beneficios

### Data Integrity
- **Consistencia**: Ambos campos siguen la misma lógica
- **Limpieza**: No quedan valores residuales
- **Previsibilidad**: Comportamiento uniforme

### User Experience  
- **Transparencia**: Mensajes claros sobre qué se resetea
- **Confiabilidad**: Los usuarios saben exactamente qué esperar
- **Reversibilidad**: Proceso completo de ida y vuelta

### Reporting
- **Precisión**: Solo turnos completados tienen valores
- **Claridad**: Estados bien definidos para reportes
- **Confiabilidad**: Datos limpios para análisis

## Estado Actual
✅ **IMPLEMENTADO**: Revertir turnos ahora resetea tanto pago como cobro a 0
✅ **PROBADO**: Sin errores de sintaxis  
✅ **DOCUMENTADO**: Cambios registrados y explicados

## Archivos Modificados
- `src/pages/Turnos.jsx`: Función `handleRollbackWeekToProgrammed` actualizada
- `docs/REVERTIR_TURNOS_COBROS.md`: Documentación creada
