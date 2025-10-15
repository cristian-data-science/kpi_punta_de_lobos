# 📅 Calendario Semanal con Carriles Paralelos - Documentación

## 🎯 Visión General

El nuevo módulo de Turnos utiliza un **calendario semanal con carriles paralelos** inspirado en la maqueta Excel original. Este diseño permite visualizar múltiples turnos simultáneos sin colisiones, usando un algoritmo de asignación de carriles tipo "first-fit".

## ✨ Características Principales

### 1. **Vista Semanal Fija**
- 7 columnas: LUNES → DOMINGO
- 13 filas de horas: 09:00 → 21:00
- Cabecera con rango de fechas navegable

### 2. **Carriles Paralelos Inteligentes**
- Algoritmo first-fit para asignar carriles sin colisiones
- Mínimo 3 carriles por día (expandible según necesidad)
- Turnos solapados se muestran en paralelo

### 3. **Código de Colores Consistente**
Basado en la maqueta Excel:

| Persona/Rol | Color | Hex Code |
|-------------|-------|----------|
| SCARLETTE | Verde intenso | #2ECC71 |
| TINA | Verde claro | #DCEFD4 |
| NICO | Azul | #7DB8E8 |
| BAÑOS | Durazno | #EEC2AE |
| GP 4 | Amarillo | #FFD84D |
| GP 5 | Naranja | #E07B39 |
| Almuerzo | Blanco con borde | #FFFFFF / #CCCCCC |
| Otros | Gris | #E5E7EB |

### 4. **Interacciones**
- **Click en bloque** → Editar turno
- **Click en celda vacía** → Crear turno rápido con hora preseleccionada
- **Hover en bloque** → Tooltip con información completa
- **Navegación semanal** → Botones Anterior/Siguiente

## 🏗️ Arquitectura

### Componentes

```
src/
├── components/
│   └── WeeklySchedule/
│       ├── WeeklySchedule.jsx      # Componente principal
│       ├── WeeklySchedule.css      # Estilos
│       └── index.js                # Export
├── utils/
│   └── scheduleHelpers.js          # Utilidades (colores, conversiones, algoritmo)
├── fixtures/
│   └── turnosEjemplo.js            # Datos de ejemplo para testing
└── pages/
    └── Turnos.jsx                  # Página integrada
```

### Flujo de Datos

```
1. getTurnos() → Supabase
2. turnosToBlocks() → Conversión a formato de bloques
3. assignLanes() → Asignación de carriles sin colisiones
4. WeeklySchedule → Renderizado visual
```

## 🔧 Funciones Clave

### `assignLanes(blocks)`
Asigna carriles a bloques del mismo día evitando colisiones.

**Algoritmo:**
1. Agrupar bloques por día
2. Ordenar por hora de inicio
3. Para cada bloque:
   - Buscar primer carril sin colisión
   - Si no existe, crear carril nuevo
4. Retornar bloques con `lane` y `totalLanes`

### `turnosToBlocks(turnos, weekStart)`
Convierte turnos de Supabase al formato requerido por el calendario.

**Entrada:**
```javascript
{
  id: uuid,
  persona: { nombre: "Scarlette" },
  fecha: "2025-10-14",
  hora_inicio: "09:00",
  hora_fin: "11:00",
  puesto: "Instructor",
  ...
}
```

**Salida:**
```javascript
{
  id: uuid,
  day: 0,  // 0=Lun, 6=Dom
  start: "09:00",
  end: "11:00",
  label: "SCARLETTE",
  type: "shift",
  turnoData: { ... }  // Datos originales
}
```

### `blocksOverlap(block1, block2)`
Detecta si dos bloques se solapan temporalmente.

### `getColorForLabel(label, type)`
Retorna el color correspondiente según el label o tipo.

## 🎨 Estilos y UX

### Grilla Base
- CSS Grid: `grid-template-columns: 60px repeat(7, minmax(120px, 1fr))`
- Altura de hora: 52px (configurable)
- Bordes: 1px solid #e5e7eb

### Bloques de Turno
- Posición absoluta dentro del día
- Top calculado: `(hora - startHour) * hourHeight + minutesOffset`
- Altura calculada: `(duration / 60) * hourHeight`
- Ancho según carril: `100% / totalLanes`

### Responsive
- Desktop: Grilla completa visible
- Tablet: Scroll horizontal
- Móvil: Scroll horizontal, altura reducida

## 📊 Casos de Uso

### Crear Turno Rápido
```javascript
// Usuario hace click en celda (Martes, 10:00)
handleCellClick(1, 10)
  ↓
formData = {
  fecha: "2025-10-15",  // Martes de la semana actual
  hora_inicio: "10:00",
  hora_fin: "11:00",
  ...
}
  ↓
Modal se abre con datos pre-rellenados
```

### Editar Turno
```javascript
// Usuario hace click en bloque
handleBlockClick(block)
  ↓
handleEdit(block.turnoData)
  ↓
Modal de edición con todos los datos
```

### Navegar Semanas
```javascript
handleNextWeek()
  ↓
currentWeekStart = goToNextWeek(currentWeekStart)
  ↓
loadData()  // Recarga turnos de nueva semana
  ↓
scheduleBlocks actualizado
```

## 🧪 Testing

### Datos de Prueba
Usar los fixtures en `src/fixtures/turnosEjemplo.js`:

```javascript
import { FIXTURE_BLOCKS } from '@/fixtures/turnosEjemplo'

// Test visual
<WeeklySchedule events={FIXTURE_BLOCKS} weekStart="2025-10-14" />
```

### Verificaciones
1. ✅ Bloques solapados se muestran en paralelo
2. ✅ Colores coinciden con maqueta Excel
3. ✅ Click en celda crea turno con hora correcta
4. ✅ Click en bloque abre modal de edición
5. ✅ Navegación semanal actualiza datos
6. ✅ Tooltip muestra información completa

## 🚀 Mejoras Futuras

### Fase 2
- [ ] Drag & drop para mover turnos
- [ ] Redimensionar bloques arrastrando bordes
- [ ] Copiar/pegar turnos
- [ ] Plantillas de turnos recurrentes

### Fase 3
- [ ] Exportar semana a PDF/PNG
- [ ] Imprimir semana
- [ ] Detección automática de conflictos con alertas
- [ ] Filtros por persona/puesto

### Fase 4
- [ ] Vista multi-semana (4 semanas)
- [ ] Comparación de semanas
- [ ] Estadísticas por persona/semana
- [ ] Notificaciones de cambios

## 🐛 Troubleshooting

### Los bloques se pisan
→ Verificar que `assignLanes()` se ejecuta antes de renderizar
→ Revisar que `blocksOverlap()` detecta correctamente las colisiones

### Colores incorrectos
→ Verificar `mapPersonaToLabel()` mapea correctamente nombres
→ Revisar que `SCHEDULE_COLORS` tiene todos los labels

### Turnos no aparecen
→ Verificar que `turnosToBlocks()` filtra correctamente por semana
→ Revisar que `calculateDayOfWeek()` retorna 0-6

### Click no funciona
→ Verificar que `onBlockClick` y `onCellClick` están conectados
→ Revisar z-index de la capa de bloques

## 📝 Notas de Migración

### Desde react-big-calendar

**Antes:**
```javascript
<BigCalendar
  events={events}
  onSelectSlot={handleSelectSlot}
  onSelectEvent={handleSelectEvent}
/>
```

**Ahora:**
```javascript
<WeeklySchedule
  events={scheduleBlocks}
  weekStart={currentWeekStart}
  onBlockClick={handleBlockClick}
  onCellClick={handleCellClick}
/>
```

**Cambios necesarios:**
1. Convertir turnos con `turnosToBlocks()`
2. Mantener estado `currentWeekStart`
3. Adaptar handlers de click
4. Filtrar turnos por semana antes de convertir

## 🎓 Aprendizajes

1. **Algoritmo first-fit** es eficiente para asignación de carriles
2. **CSS Grid + position: absolute** permite renderizado preciso
3. **Carriles mínimos de 3** evitan colapso visual
4. **Colores consistentes** mejoran UX significativamente
5. **Navegación semanal** simplifica gestión de turnos

---

**Autor**: Equipo de Desarrollo KPI Punta de Lobos  
**Fecha**: 14 de octubre de 2025  
**Versión**: 2.0.0
