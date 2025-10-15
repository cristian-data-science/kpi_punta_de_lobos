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
  endHour = 21
}) => {
  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

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
  const renderDayCell = (day, hour) => {
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
        key={`${day}-${hour}`}
        className={`day-cell ${cellEvents.length > 0 ? 'has-events' : ''} ${isToday ? 'today' : ''}`}
        onClick={handleCellClick}
      >
        {/* Los bloques se renderizan con posición absoluta */}
      </div>
    )
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
        <h3>📅 Calendario Semanal</h3>
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
      <div className="schedule-grid-container">
        <div className="schedule-grid">
          {/* Cabecera de días */}
          <div className="day-header hour-label"></div>
          {DAYS.map((day, index) => {
            const dayInfo = formatDayWithDate(weekStart, index)
            const isToday = index === todayDayOfWeek
            return (
              <div key={day} className={`day-header ${isToday ? 'today' : ''}`}>
                <div className="day-name">{dayInfo.name}</div>
                <div className="day-date">{dayInfo.date}</div>
              </div>
            )
          })}

          {/* Filas de horas */}
          {HOURS.map(hour => (
            <React.Fragment key={`hour-row-${hour}`}>
              <div key={`hour-${hour}`} className="hour-cell">
                {`${String(hour).padStart(2, '0')}:00`}
              </div>
              {[0, 1, 2, 3, 4, 5, 6].map(day => renderDayCell(day, hour))}
            </React.Fragment>
          ))}
        </div>

        {/* Capa de bloques - CORREGIDA: posición relativa al contenedor */}
        <div className="blocks-layer">
          {renderAllBlocks()}
        </div>
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
