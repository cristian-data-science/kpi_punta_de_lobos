# Aviso de Turnos Programados Pendientes

## Resumen
Implementación de aviso visual para alertar cuando existen turnos programados que no han sido completados en fechas que ya pasaron.

## Funcionalidad Implementada

### 1. Detección Automática
- **Condición**: Turnos con estado "programado" en fechas de hoy o anteriores
- **Alcance**: Solo considera turnos de la semana actual siendo visualizada
- **Lógica**: Compara fecha del turno con fecha actual (≤ hoy)

### 2. Funciones Agregadas

#### `hasWeekPendingShifts()`
- **Propósito**: Detecta si hay turnos pendientes en la semana
- **Criterio**: Turnos programados en fechas ≤ hoy
- **Retorno**: Boolean (true si hay turnos pendientes)

#### `getPendingShiftsCount()`
- **Propósito**: Cuenta el número exacto de turnos pendientes
- **Criterio**: Mismo que la función anterior
- **Retorno**: Número de turnos programados pendientes

### 3. Aviso Visual

#### Ubicación
- **Posición**: Entre la leyenda y el calendario
- **Visibilidad**: Solo en vista calendario
- **Condición**: Se muestra únicamente si `hasWeekPendingShifts()` es true

#### Diseño
- **Color**: Fondo naranja claro (`bg-orange-50`)
- **Borde**: Naranja (`border-orange-200`)
- **Icono**: Triángulo de advertencia (SVG)
- **Título**: "Turnos Programados Pendientes"
- **Mensaje**: Número específico de turnos pendientes

### 4. Mensaje Dinámico
```
"Hay X turno(s) programado(s) que aún no ha(n) sido completado(s)."
```

**Características**:
- **Plural/Singular**: Se ajusta automáticamente según la cantidad
- **Gramática Correcta**: "ha/han", "turno/turnos", "completado/completados"
- **Información Específica**: Muestra el número exacto de turnos

## Código Implementado

### Funciones de Detección
```javascript
// Verificar si hay turnos programados pendientes
const hasWeekPendingShifts = () => {
  const today = new Date()
  const todayKey = formatDateKey(today)
  const weekStartKey = formatDateKey(weekDays[0])
  const weekEndKey = formatDateKey(weekDays[6])
  
  return turnos.some(turno => 
    turno.fecha >= weekStartKey && 
    turno.fecha <= weekEndKey && 
    turno.fecha <= todayKey && 
    turno.estado === 'programado'
  )
}

// Contar turnos programados pendientes
const getPendingShiftsCount = () => {
  // ... similar logic, but using filter().length
}
```

### Componente Visual
```jsx
{hasWeekPendingShifts() && (
  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0">
        {/* Icono de advertencia SVG */}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-orange-800">
          Turnos Programados Pendientes
        </h3>
        <p className="text-sm text-orange-700">
          Hay {getPendingShiftsCount()} turno{getPendingShiftsCount() !== 1 ? 's' : ''} programado{getPendingShiftsCount() !== 1 ? 's' : ''} que aún no {getPendingShiftsCount() !== 1 ? 'han' : 'ha'} sido completado{getPendingShiftsCount() !== 1 ? 's' : ''}.
        </p>
      </div>
    </div>
  </div>
)}
```

## Casos de Uso

### Escenario 1: Sin Turnos Pendientes
- **Condición**: Todos los turnos de fechas pasadas están completados
- **Resultado**: No se muestra ningún aviso
- **Vista**: Solo leyenda y calendario normal

### Escenario 2: 1 Turno Pendiente
- **Condición**: 1 turno programado en fecha pasada
- **Aviso**: "Hay 1 turno programado que aún no ha sido completado."
- **Color**: Fondo naranja de advertencia

### Escenario 3: Múltiples Turnos Pendientes
- **Condición**: 3+ turnos programados en fechas pasadas
- **Aviso**: "Hay 3 turnos programados que aún no han sido completados."
- **Color**: Mismo fondo naranja de advertencia

### Escenario 4: Solo Turnos Futuros
- **Condición**: Turnos programados solo para fechas futuras
- **Resultado**: No se muestra aviso (es normal tener turnos futuros programados)

## Beneficios

### Para el Usuario
- **Alerta Temprana**: Identifica inmediatamente turnos pendientes
- **Gestión Proactiva**: Permite actuar antes de que se acumulen más atrasos
- **Información Clara**: Número específico de turnos pendientes

### Para la Operación
- **Control de Calidad**: Evita que pasen turnos sin completar
- **Seguimiento**: Facilita el control del estado de los turnos
- **Eficiencia**: Reduce tiempo buscando turnos pendientes manualmente

## Colores y Estilos
- **Fondo**: `bg-orange-50` (naranja muy claro)
- **Borde**: `border-orange-200` (naranja claro)
- **Título**: `text-orange-800` (naranja oscuro)
- **Texto**: `text-orange-700` (naranja medio)
- **Icono**: `text-orange-600` (naranja estándar)

## Estado
✅ **IMPLEMENTADO** - Aviso funcionando con detección automática y mensaje dinámico
