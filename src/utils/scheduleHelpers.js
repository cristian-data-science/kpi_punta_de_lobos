// 🗓️ Utilidades para el Calendario Semanal con Carriles Paralelos

/**
 * Mapa de colores según la maqueta Excel (personas conocidas)
 */
export const SCHEDULE_COLORS = {
  'SCARLETTE': { bg: '#2ECC71', text: '#000', border: '#27AE60' },
  'TINA': { bg: '#DCEFD4', text: '#000', border: '#C8E6C9' },
  'NICO': { bg: '#7DB8E8', text: '#000', border: '#5DADE2' },
  'BAÑOS': { bg: '#EEC2AE', text: '#000', border: '#E8B298' },
  'GP 4': { bg: '#FFD84D', text: '#000', border: '#F1C40F' },
  'GP 5': { bg: '#E07B39', text: '#FFF', border: '#CA6F1E' },
  'ALMUERZO': { bg: '#FFFFFF', text: '#666', border: '#CCCCCC' },
  'DEFAULT': { bg: '#E5E7EB', text: '#000', border: '#D1D5DB' }
}

/**
 * Paleta de colores para asignar a nuevas personas
 */
const COLOR_PALETTE = [
  { bg: '#3B82F6', text: '#FFF', border: '#2563EB' }, // Azul
  { bg: '#10B981', text: '#FFF', border: '#059669' }, // Verde
  { bg: '#F59E0B', text: '#000', border: '#D97706' }, // Ámbar
  { bg: '#EF4444', text: '#FFF', border: '#DC2626' }, // Rojo
  { bg: '#8B5CF6', text: '#FFF', border: '#7C3AED' }, // Violeta
  { bg: '#EC4899', text: '#FFF', border: '#DB2777' }, // Rosa
  { bg: '#14B8A6', text: '#FFF', border: '#0D9488' }, // Teal
  { bg: '#F97316', text: '#FFF', border: '#EA580C' }, // Naranja
  { bg: '#6366F1', text: '#FFF', border: '#4F46E5' }, // Índigo
  { bg: '#A855F7', text: '#FFF', border: '#9333EA' }, // Púrpura
  { bg: '#06B6D4', text: '#FFF', border: '#0891B2' }, // Cyan
  { bg: '#84CC16', text: '#000', border: '#65A30D' }, // Lima
]

/**
 * Genera un color único y persistente para una persona
 * Usa hash del nombre para consistencia entre sesiones
 */
const generateColorForPerson = (nombre) => {
  // Hash simple del nombre
  let hash = 0
  for (let i = 0; i < nombre.length; i++) {
    hash = ((hash << 5) - hash) + nombre.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % COLOR_PALETTE.length
  return COLOR_PALETTE[index]
}

/**
 * Obtiene o genera un color para una persona (con cache en localStorage)
 */
export const getPersonColor = (nombre) => {
  if (!nombre) return SCHEDULE_COLORS.DEFAULT
  
  const nombreNormalizado = nombre.trim().toUpperCase()
  
  // Verificar si es una persona conocida
  if (SCHEDULE_COLORS[nombreNormalizado]) {
    return SCHEDULE_COLORS[nombreNormalizado]
  }
  
  // Buscar en cache de localStorage
  const cacheKey = 'schedule_person_colors'
  let colorCache = {}
  
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      colorCache = JSON.parse(cached)
    }
  } catch (e) {
    console.warn('Error loading color cache:', e)
  }
  
  // Si ya tiene color asignado, usarlo
  if (colorCache[nombreNormalizado]) {
    return colorCache[nombreNormalizado]
  }
  
  // Generar nuevo color y guardarlo
  const newColor = generateColorForPerson(nombreNormalizado)
  colorCache[nombreNormalizado] = newColor
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify(colorCache))
  } catch (e) {
    console.warn('Error saving color cache:', e)
  }
  
  return newColor
}

/**
 * Mapea nombres de persona a etiquetas cortas (SOLO PRIMER NOMBRE)
 */
export const mapPersonaToLabel = (nombre) => {
  if (!nombre) return 'SIN ASIGNAR'
  
  const nombreUpper = nombre.trim().toUpperCase()
  
  // Mapeo directo para nombres conocidos
  if (nombreUpper.includes('SCARLETTE') || nombreUpper === 'SCARLETTE') return 'SCARLETTE'
  if (nombreUpper.includes('TINA') || nombreUpper === 'TINA') return 'TINA'
  if (nombreUpper.includes('NICO') || nombreUpper === 'NICOLAS') return 'NICO'
  if (nombreUpper.includes('BAÑOS') || nombreUpper === 'BAÑOS') return 'BAÑOS'
  if (nombreUpper.includes('GP 4') || nombreUpper === 'GP4') return 'GP 4'
  if (nombreUpper.includes('GP 5') || nombreUpper === 'GP5') return 'GP 5'
  if (nombreUpper.includes('ALMUERZO')) return 'ALMUERZO'
  
  // Para otros nombres: devolver solo el PRIMER NOMBRE
  const primerNombre = nombreUpper.split(' ')[0]
  return primerNombre
}

/**
 * Convierte tiempo "HH:mm" a minutos desde medianoche
 */
export const parseTimeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convierte minutos desde medianoche a "HH:mm"
 */
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Calcula el día de la semana (0=Lunes, 6=Domingo) relativo a weekStart
 */
export const calculateDayOfWeek = (fecha, weekStart) => {
  const date = new Date(fecha + 'T00:00:00')
  const start = new Date(weekStart + 'T00:00:00')
  
  const diffTime = date.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Obtiene el inicio de la semana (Lunes) para una fecha dada
 */
export const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Ajustar cuando es Domingo
  
  const weekStart = new Date(d.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}

/**
 * Obtiene el final de la semana (Domingo) para una fecha dada
 */
export const getWeekEnd = (weekStart) => {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end.toISOString().split('T')[0]
}

/**
 * Formatea rango de semana: "14 Oct - 20 Oct 2025"
 */
export const formatWeekRange = (weekStart) => {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  
  const options = { day: 'numeric', month: 'short' }
  const startStr = start.toLocaleDateString('es-ES', options)
  const endStr = end.toLocaleDateString('es-ES', options)
  const year = end.getFullYear()
  
  return `${startStr} - ${endStr} ${year}`
}

/**
 * Convierte turnos de Supabase al formato de bloques del calendario
 * NOTA: hora_almuerzo se incluye dentro del bloque del turno para renderizado interno
 */
export const turnosToBlocks = (turnos, weekStart) => {
  if (!turnos || turnos.length === 0) return []
  
  console.log('📅 turnosToBlocks - Procesando', turnos.length, 'turnos')
  
  const blocks = []
  
  turnos.forEach(turno => {
    const day = calculateDayOfWeek(turno.fecha, weekStart)
    
    // Solo incluir turnos de la semana actual (día 0-6)
    if (day < 0 || day > 6) return
    
    const label = mapPersonaToLabel(turno.persona?.nombre || turno.puesto || 'Sin asignar')
    
    // Detectar si es almuerzo por el puesto o tipo
    const isLunch = turno.puesto?.toLowerCase().includes('almuerzo') || 
                    turno.tipo_turno === 'almuerzo' ||
                    turno.notas?.toLowerCase().includes('almuerzo')
    
    // Normalizar hora_almuerzo: puede venir como "HH:mm:ss" de Postgres
    const horaAlmuerzoNormalizada = turno.hora_almuerzo 
      ? turno.hora_almuerzo.substring(0, 5) 
      : null
    
    if (horaAlmuerzoNormalizada) {
      console.log('🍽️ Turno con almuerzo:', turno.persona?.nombre, '→', horaAlmuerzoNormalizada)
    }
    
    // Bloque del turno (ÚNICO, almuerzo se dibuja dentro)
    blocks.push({
      id: turno.id,
      day,
      start: turno.hora_inicio,
      end: turno.hora_fin,
      label: isLunch ? 'Almuerzo' : label,
      role: turno.puesto || '',
      type: isLunch ? 'lunch' : 'shift',
      person: turno.persona?.nombre || '',
      hora_almuerzo: horaAlmuerzoNormalizada,
      turnoData: turno // Guardar datos originales para edición
    })
  })
  
  return blocks
}

/**
 * Detecta si dos bloques se solapan
 */
export const blocksOverlap = (block1, block2) => {
  const start1 = parseTimeToMinutes(block1.start)
  const end1 = parseTimeToMinutes(block1.end)
  const start2 = parseTimeToMinutes(block2.start)
  const end2 = parseTimeToMinutes(block2.end)
  
  return start1 < end2 && end1 > start2
}

/**
 * Asigna carriles a bloques del mismo día usando algoritmo first-fit
 */
export const assignLanes = (blocks) => {
  // Agrupar bloques por día
  const blocksByDay = {}
  blocks.forEach(block => {
    if (!blocksByDay[block.day]) {
      blocksByDay[block.day] = []
    }
    blocksByDay[block.day].push(block)
  })
  
  // Asignar carriles por día
  const result = []
  
  Object.keys(blocksByDay).forEach(day => {
    const dayBlocks = blocksByDay[day]
    
    // Ordenar por hora de inicio, luego por duración (más largos primero)
    dayBlocks.sort((a, b) => {
      const startDiff = parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start)
      if (startDiff !== 0) return startDiff
      
      const durationA = parseTimeToMinutes(a.end) - parseTimeToMinutes(a.start)
      const durationB = parseTimeToMinutes(b.end) - parseTimeToMinutes(b.start)
      return durationB - durationA
    })
    
    // Array de carriles: cada carril contiene los bloques asignados
    const lanes = []
    
    dayBlocks.forEach(block => {
      // Buscar primer carril libre (sin colisión)
      let assignedLane = -1
      
      for (let i = 0; i < lanes.length; i++) {
        const hasCollision = lanes[i].some(existingBlock => 
          blocksOverlap(block, existingBlock)
        )
        
        if (!hasCollision) {
          assignedLane = i
          break
        }
      }
      
      // Si no hay carril libre, crear uno nuevo
      if (assignedLane === -1) {
        assignedLane = lanes.length
        lanes.push([])
      }
      
      // Asignar bloque al carril
      lanes[assignedLane].push(block)
      
      result.push({
        ...block,
        lane: assignedLane,
        totalLanes: lanes.length // Usar el número real de carriles necesarios
      })
    })
    
    // NO forzar mínimo de 3 carriles si no es necesario
    // Solo actualizar totalLanes al valor real usado
    const actualLanesUsed = lanes.length
    result.forEach(block => {
      if (block.day === parseInt(day)) {
        block.totalLanes = actualLanesUsed
      }
    })
  })
  
  return result
}

/**
 * Obtiene el color para un label/persona
 */
export const getColorForLabel = (label, type, personName = null) => {
  if (type === 'lunch' || label === 'Almuerzo') {
    return SCHEDULE_COLORS.ALMUERZO
  }
  
  // Si tenemos el nombre de la persona, usarlo para color persistente
  if (personName) {
    return getPersonColor(personName)
  }
  
  // Fallback al label
  return getPersonColor(label)
}

/**
 * Formatea un día con su fecha: "LUNES 14"
 */
export const formatDayWithDate = (weekStart, dayIndex) => {
  const start = new Date(weekStart + 'T00:00:00')
  const dayDate = new Date(start)
  dayDate.setDate(dayDate.getDate() + dayIndex)
  
  const dayNames = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
  const dayNum = dayDate.getDate()
  
  return {
    name: dayNames[dayIndex],
    date: dayNum,
    full: `${dayNames[dayIndex]} ${dayNum}`
  }
}

/**
 * Navega a la semana siguiente
 */
export const goToNextWeek = (currentWeekStart) => {
  const current = new Date(currentWeekStart + 'T00:00:00')
  current.setDate(current.getDate() + 7)
  return current.toISOString().split('T')[0]
}

/**
 * Navega a la semana anterior
 */
export const goToPreviousWeek = (currentWeekStart) => {
  const current = new Date(currentWeekStart + 'T00:00:00')
  current.setDate(current.getDate() - 7)
  return current.toISOString().split('T')[0]
}
