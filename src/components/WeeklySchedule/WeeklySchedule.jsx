import React, { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  assignLanes,
  getColorForLabel,
  parseTimeToMinutes,
  formatWeekRange,
  formatDayWithDate,
  diagnosticarColores,
  reconstruirCacheColores
} from '@/utils/scheduleHelpers'
import './WeeklySchedule.css'

const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 8:00 to 21:00 (14 horas)
const HOURS_4H_BLOCKS = [8, 12, 16, 20] // Bloques de 4 horas: 8-12, 12-16, 16-20, 20-24
const HEADER_HEIGHT = 48 // Altura del header reducida (antes 56px)
const HOUR_HEIGHT = 44 // Altura de cada celda de hora (REDUCIDO para compactar)

const WeeklySchedule = ({
  events = [],
  weekStart,
  onBlockClick,
  onCellClick,
  onNextWeek,
  onPreviousWeek,
  startHour = 8,
  endHour = 21,
  daysToShow = 7, // Número de días a mostrar (7, 14, 28, 56)
  viewMode = 'semanal' // semanal, bisemanal, mensual, bimensual
}) => {
  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  // Calcular número de semanas a mostrar
  const weeksToShow = useMemo(() => {
    return Math.ceil(daysToShow / 7)
  }, [daysToShow])

  // Determinar qué horas usar según la vista
  const hoursToShow = useMemo(() => {
    if (viewMode === 'mensual' || viewMode === 'bimensual') {
      return HOURS_4H_BLOCKS // Bloques de 4 horas para vistas largas
    }
    return HOURS // Horas normales para vistas cortas
  }, [viewMode])

  // Calcular altura dinámica por semana
  const weekHeight = useMemo(() => {
    const baseHeight = 700 // Altura base total del calendario
    const headerHeight = 48 // Altura del header de cada semana
    const marginBetweenWeeks = 20 // Margen entre semanas
    
    // Altura disponible para todas las semanas (sin headers ni márgenes)
    const availableHeight = baseHeight - (weeksToShow * headerHeight) - ((weeksToShow - 1) * marginBetweenWeeks)
    
    // Altura por semana (mínimo 200px para que sea usable)
    const calculatedHeight = Math.max(200, Math.floor(availableHeight / weeksToShow))
    
    return calculatedHeight
  }, [weeksToShow])

  // Calcular altura de cada celda de hora dinámicamente
  const dynamicHourHeight = useMemo(() => {
    const hoursCount = hoursToShow.length
    return Math.floor(weekHeight / hoursCount)
  }, [weekHeight, hoursToShow])

  // Generar estructura de semanas
  const weeksStructure = useMemo(() => {
    const weeks = []
    for (let week = 0; week < weeksToShow; week++) {
      const weekDays = []
      for (let day = 0; day < 7; day++) {
        const dayIndex = week * 7 + day
        if (dayIndex < daysToShow) {
          weekDays.push(dayIndex)
        }
      }
      if (weekDays.length > 0) {
        weeks.push(weekDays)
      }
    }
    return weeks
  }, [daysToShow, weeksToShow])

  // Asignar carriles a los eventos
  const eventsWithLanes = useMemo(() => {
    return assignLanes(events)
  }, [events])

  // Ejecutar diagnóstico después del render (solo en desarrollo)
  useEffect(() => {
    if (events.length > 0) {
      // Esperar un momento para que todo se renderice
      setTimeout(() => {
        diagnosticarColores()
      }, 500)
    }
  }, [events])

  // Calcular título dinámico según la vista
  const scheduleTitle = useMemo(() => {
    const titles = {
      'semanal': '📅 Vista Semanal',
      'bisemanal': '📅 Vista Bi-semanal', 
      'mensual': '📅 Vista Mensual',
      'bimensual': '📅 Vista Bi-mensual'
    }
    return titles[viewMode] || '📅 Calendario'
  }, [viewMode])

  // Calcular el día actual para resaltarlo
  const today = new Date().toISOString().split('T')[0]
  const todayDayOfWeek = useMemo(() => {
    if (!weekStart) return -1
    const todayDate = new Date(today + 'T00:00:00')
    const weekStartDate = new Date(weekStart + 'T00:00:00')
    const diff = Math.floor((todayDate - weekStartDate) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 6 ? diff : -1
  }, [weekStart, today])

    // Renderizar celda de día
  const renderDayCell = (day, hour, hourHeight = HOUR_HEIGHT) => {
    const cellEvents = eventsWithLanes.filter(event => {
      const eventDay = event.day
      const eventStartHour = Math.floor(parseTimeToMinutes(event.start) / 60)
      const eventEndHour = Math.ceil(parseTimeToMinutes(event.end) / 60)
      
      return eventDay === day && eventStartHour <= hour && eventEndHour > hour
    })
    
    const isToday = day === todayDayOfWeek
    
    const handleCellClick = () => {
      if (cellEvents.length === 0 && onCellClick) {
        onCellClick(day, hour)
      }
    }
    
    return (
      <div
        key={`cell-${day}-${hour}`}
        className={`day-cell ${isToday ? 'today' : ''} ${cellEvents.length > 0 ? 'has-events' : ''}`}
        onClick={handleCellClick}
        style={{ height: `${hourHeight}px` }}
      >
        {/* Contenido de la celda si es necesario */}
      </div>
    )
  }

  // Renderizar bloques para una semana específica
  const renderBlocksForWeek = (weekDays) => {
    return eventsWithLanes
      .filter(event => weekDays.includes(event.day))
      .map(event => {
        const startMinutes = parseTimeToMinutes(event.start)
        const endMinutes = parseTimeToMinutes(event.end)
        const durationMinutes = endMinutes - startMinutes
        
        // Usar la misma lógica para todas las vistas - funciona en semanal
        const startHourOffset = Math.floor(startMinutes / 60) - startHour
        const minutesIntoHour = startMinutes % 60
        
        const top = (startHourOffset * dynamicHourHeight) + (minutesIntoHour / 60) * dynamicHourHeight
        const height = (durationMinutes / 60) * dynamicHourHeight - 3
        
        // Ajustar la posición del día dentro de la semana
        const dayIndexInWeek = weekDays.indexOf(event.day)
        const dayWidthPercent = 100 / 7
        const dayBaseLeft = dayIndexInWeek * dayWidthPercent
        
        let blockLeft, blockWidth
        
        if (event.totalLanes === 1) {
          const marginPercent = dayWidthPercent * 0.05
          blockLeft = dayBaseLeft + marginPercent
          blockWidth = dayWidthPercent * 0.90
        } else {
          const laneWidthPercent = dayWidthPercent / event.totalLanes
          const laneOffset = event.lane * laneWidthPercent
          blockLeft = dayBaseLeft + laneOffset
          blockWidth = laneWidthPercent - 0.2
        }
        
        const colors = getColorForLabel(event.label, event.type, event.person)
        
        const style = {
          position: 'absolute',
          top: `${top}px`,
          left: `${blockLeft}%`,
          width: `${blockWidth}%`,
          height: `${height}px`,
          backgroundColor: colors.bg,
          color: colors.text,
          borderLeft: `3px solid ${colors.border}`,
          borderRadius: '5px',
          padding: '3px 6px',
          fontSize: '11px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 10,
        }
        
        return (
          <div
            key={`block-${event.id}-week`}
            style={style}
            onClick={() => onBlockClick && onBlockClick(event)}
          >
            <div className="block-content">
              <div className="block-label">{event.label}</div>
              <div className="block-time">{event.start}-{event.end}</div>
            </div>
          </div>
        )
      })
  }

  // Renderizar todos los bloques en una capa superior
  const renderAllBlocks = () => {
    return eventsWithLanes.map(event => {
      const startMinutes = parseTimeToMinutes(event.start)
      const endMinutes = parseTimeToMinutes(event.end)
      const durationMinutes = endMinutes - startMinutes
      
      const startHourOffset = Math.floor(startMinutes / 60) - startHour
      const minutesIntoHour = startMinutes % 60
      
      // Posición vertical SIN sumar HEADER_HEIGHT porque la capa blocks-layer ya tiene top:48px en CSS
      const top = (startHourOffset * HOUR_HEIGHT) + (minutesIntoHour / 60) * HOUR_HEIGHT
      const height = (durationMinutes / 60) * HOUR_HEIGHT - 3 // Ajuste para alineación perfecta con grid
      
      // Cálculo de posición horizontal
      // La capa de bloques ya excluye los 60px de la columna de horas
      // Cada día ocupa 100% / 7 = 14.2857% del ancho
      const dayWidthPercent = 100 / 7 // ~14.2857%
      const dayBaseLeft = event.day * dayWidthPercent
      
      let blockLeft, blockWidth
      
      if (event.totalLanes === 1) {
        // Turno único: centrado con 90% del ancho del día
        const marginPercent = dayWidthPercent * 0.05 // 5% de margen a cada lado
        blockLeft = dayBaseLeft + marginPercent
        blockWidth = dayWidthPercent * 0.90
      } else {
        // Múltiples turnos: dividir en carriles
        const laneWidthPercent = dayWidthPercent / event.totalLanes
        const laneOffset = event.lane * laneWidthPercent
        blockLeft = dayBaseLeft + laneOffset
        blockWidth = laneWidthPercent - 0.2 // Pequeño gap entre carriles
      }
      
      // Obtener color basado en el nombre de la persona
      const colors = getColorForLabel(event.label, event.type, event.person)
      
      const style = {
        position: 'absolute',
        top: `${top}px`,
        left: `${blockLeft}%`,
        width: `${blockWidth}%`,
        height: `${height}px`,
        backgroundColor: colors.bg,
        color: colors.text,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: '5px', // Reducido
        padding: '4px 6px', // Reducido
        fontSize: '11px', // AUMENTADO de 10px a 11px
        fontWeight: '600',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: event.type === 'lunch' ? 'default' : 'pointer', // Almuerzo no es clickeable
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        userSelect: 'none',
        zIndex: 1
      }
      
      const handleMouseEnter = (e) => {
        setHoveredBlock(event)
        setTooltipPos({ x: e.clientX, y: e.clientY })
      }
      
      const handleMouseMove = (e) => {
        setTooltipPos({ x: e.clientX, y: e.clientY })
      }
      
      const handleMouseLeave = () => {
        setHoveredBlock(null)
      }
      
      // Calcular posición del almuerzo dentro del bloque (si existe)
      let lunchBarPosition = null
      let lunchBarHeight = null
      
      if (event.hora_almuerzo && event.type !== 'lunch') {
        console.log('🍽️ ===== DEBUG ALMUERZO =====')
        console.log('Persona:', event.label)
        console.log('Hora almuerzo RAW:', event.hora_almuerzo, '(tipo:', typeof event.hora_almuerzo, ')')
        console.log('Turno:', event.start, '-', event.end)
        
        const turnoStartMinutes = parseTimeToMinutes(event.start)
        const turnoEndMinutes = parseTimeToMinutes(event.end)
        const lunchStartMinutes = parseTimeToMinutes(event.hora_almuerzo)
        const totalDurationMinutes = turnoEndMinutes - turnoStartMinutes
        
        console.log('Minutos calculados:')
        console.log('  - Inicio turno:', turnoStartMinutes, 'min')
        console.log('  - Fin turno:', turnoEndMinutes, 'min')
        console.log('  - Inicio almuerzo:', lunchStartMinutes, 'min')
        console.log('  - Duración total:', totalDurationMinutes, 'min')
        
        // CORRECCIÓN: Calcular posición en PÍXELES desde el INICIO DEL BLOQUE
        // No usar porcentaje porque causa desalineación con el grid del calendario
        const offsetMinutes = lunchStartMinutes - turnoStartMinutes
        const lunchOffsetPx = (offsetMinutes / 60) * HOUR_HEIGHT
        const lunchHeightPx = HOUR_HEIGHT // 1 hora fija de almuerzo
        
        console.log('Offset almuerzo:', offsetMinutes, 'min desde inicio turno')
        console.log('Posición calculada:', lunchOffsetPx.toFixed(1) + 'px desde top del bloque')
        console.log('Altura almuerzo:', lunchHeightPx + 'px')
        console.log('=============================')
        
        lunchBarPosition = lunchOffsetPx
        lunchBarHeight = lunchHeightPx
      }
      
      return (
        <div
          key={`${event.id}-${event.person}-${event.day}`}
          className={`schedule-block ${event.type === 'lunch' ? 'lunch' : ''}`}
          style={style}
          onClick={() => {
            // Solo permitir click en bloques editables (no almuerzo)
            if (event.type !== 'lunch' && onBlockClick) {
              onBlockClick(event)
            }
          }}
          onMouseEnter={event.type !== 'lunch' ? handleMouseEnter : undefined}
          onMouseMove={event.type !== 'lunch' ? handleMouseMove : undefined}
          onMouseLeave={event.type !== 'lunch' ? handleMouseLeave : undefined}
        >
          {/* Texto del nombre - SOLO si no hay almuerzo o está muy lejos */}
          {!lunchBarPosition && (
            <span style={{ position: 'relative', zIndex: 1 }}>
              {event.label.toUpperCase()}
            </span>
          )}
          
          {/* Si hay almuerzo, dividir el bloque visualmente */}
          {lunchBarPosition !== null && (
            <>
              {/* Sección ANTES del almuerzo */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${lunchBarPosition}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  overflow: 'hidden',
                  zIndex: 1
                }}
              >
                {lunchBarPosition > 15 && event.label.toUpperCase()}
              </div>
              
              {/* Línea de ALMUERZO */}
              <div 
                className="lunch-divider"
                style={{
                  position: 'absolute',
                  top: `${lunchBarPosition}px`,
                  left: 0,
                  right: 0,
                  height: `${lunchBarHeight}px`,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 100%)',
                  borderTop: '1px dashed #cbd5e1',
                  borderBottom: '1px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: '600',
                  color: '#64748b',
                  letterSpacing: '0.5px',
                  zIndex: 3,
                  pointerEvents: 'none'
                }}
              >
                ALMUERZO
              </div>
              
              {/* Sección DESPUÉS del almuerzo */}
              <div 
                style={{
                  position: 'absolute',
                  top: `${lunchBarPosition + lunchBarHeight}px`,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  overflow: 'hidden',
                  zIndex: 1
                }}
              >
                {(100 - lunchBarPosition - lunchBarHeight) > 15 && event.label.toUpperCase()}
              </div>
            </>
          )}
        </div>
      )
    })
  }

  if (!weekStart) {
    return (
      <div className="weekly-schedule">
        <div className="schedule-empty">
          <div className="schedule-empty-icon">📅</div>
          <div className="schedule-empty-text">No hay semana seleccionada</div>
        </div>
      </div>
    )
  }

  return (
    <div className="weekly-schedule">
      {/* Cabecera */}
      <div className="schedule-header">
        <h3>{scheduleTitle}</h3>
        <div className="week-navigation">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="week-range">{formatWeekRange(weekStart)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grilla del calendario */}
      <div 
        className="schedule-grid-container"
        style={{ 
          maxHeight: '700px',
          overflowY: 'auto',
          overflowX: 'auto'
        }}
      >
        {weeksStructure.map((weekDays, weekIndex) => (
          <div 
            key={`week-${weekIndex}`}
            className="schedule-grid"
            style={{
              gridTemplateColumns: `60px repeat(7, minmax(120px, 1fr))`,
              minWidth: `${60 + (7 * 120)}px`,
              marginBottom: weekIndex < weeksStructure.length - 1 ? '20px' : '0',
              height: `${weekHeight + 48}px`, // +48px para el header
              '--dynamic-hour-height': `${dynamicHourHeight}px`
            }}
          >
            {/* Cabecera de días para esta semana */}
            <div className="day-header hour-label">
              {weekIndex === 0 ? '' : `Sem ${weekIndex + 1}`}
            </div>
            {weekDays.map((dayIndex) => {
              const dayInfo = formatDayWithDate(weekStart, dayIndex)
              const isToday = dayIndex === todayDayOfWeek
              return (
                <div key={`day-${dayIndex}`} className={`day-header ${isToday ? 'today' : ''}`}>
                  <div className="day-name">{dayInfo.name}</div>
                  <div className="day-date">{dayInfo.date}</div>
                </div>
              )
            })}

            {/* Filas de horas para esta semana */}
            {hoursToShow.map(hour => (
              <React.Fragment key={`week-${weekIndex}-hour-${hour}`}>
                <div 
                  className="hour-cell"
                  style={{ height: `${dynamicHourHeight}px` }}
                >
                  {viewMode === 'mensual' || viewMode === 'bimensual' ? 
                    `${String(hour).padStart(2, '0')}:00-${String(hour + 4).padStart(2, '0')}:00` :
                    `${String(hour).padStart(2, '0')}:00`
                  }
                </div>
                {weekDays.map((dayIndex) => renderDayCell(dayIndex, hour, dynamicHourHeight))}
              </React.Fragment>
            ))}

            {/* Capa de bloques para esta semana */}
            <div className="blocks-layer">
              {renderBlocksForWeek(weekDays)}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredBlock && (
        <div
          className="schedule-block-tooltip"
          style={{
            left: `${tooltipPos.x + 10}px`,
            top: `${tooltipPos.y + 10}px`,
            position: 'fixed'
          }}
        >
          <div><strong>{hoveredBlock.label}</strong></div>
          <div>{hoveredBlock.start} - {hoveredBlock.end}</div>
          {hoveredBlock.person && <div>{hoveredBlock.person}</div>}
          {hoveredBlock.role && <div>{hoveredBlock.role}</div>}
        </div>
      )}
    </div>
  )
}

export default WeeklySchedule
