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
 * Diagnóstico completo del sistema de colores
 */
export const diagnosticarColores = () => {
  console.log('\n')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🔍 DIAGNÓSTICO COMPLETO DE SISTEMA DE COLORES')
  console.log('═══════════════════════════════════════════════════════════')
  
  // 1. Leer cache actual
  const cacheKey = 'schedule_person_colors'
  let colorCache = {}
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      colorCache = JSON.parse(cached)
    }
  } catch (e) {
    console.error('❌ Error leyendo cache:', e)
  }
  
  console.log('\n📦 CACHE ACTUAL EN LOCALSTORAGE:')
  console.log('Total de personas:', Object.keys(colorCache).length)
  console.log('Contenido completo:', JSON.stringify(colorCache, null, 2))
  
  // 2. Analizar cada persona
  console.log('\n👥 ANÁLISIS POR PERSONA:')
  const indicesUsados = new Map()
  
  Object.entries(colorCache).forEach(([nombre, colorData]) => {
    const indice = colorData.index
    console.log(`\n  ${nombre}:`)
    console.log(`    - Color BG: ${colorData.bg}`)
    console.log(`    - Índice: ${indice}`)
    console.log(`    - Border: ${colorData.border}`)
    console.log(`    - Text: ${colorData.text}`)
    
    // Detectar colisiones
    if (indice !== undefined) {
      if (indicesUsados.has(indice)) {
        console.log(`    ⚠️ COLISIÓN DETECTADA con: ${indicesUsados.get(indice)}`)
      } else {
        indicesUsados.set(indice, nombre)
      }
    }
  })
  
  // 3. Verificar colisiones
  console.log('\n🔴 COLISIONES DETECTADAS:')
  const colisiones = []
  const indiceCount = new Map()
  
  Object.entries(colorCache).forEach(([nombre, colorData]) => {
    const indice = colorData.index
    if (indice !== undefined) {
      if (!indiceCount.has(indice)) {
        indiceCount.set(indice, [])
      }
      indiceCount.get(indice).push(nombre)
    }
  })
  
  indiceCount.forEach((nombres, indice) => {
    if (nombres.length > 1) {
      console.log(`  ⚠️ Índice ${indice} usado por: ${nombres.join(', ')}`)
      colisiones.push({ indice, nombres })
    }
  })
  
  if (colisiones.length === 0) {
    console.log('  ✅ No hay colisiones detectadas')
  }
  
  // 4. Paleta de colores disponible
  console.log('\n🎨 PALETA DE COLORES (12 colores):')
  COLOR_PALETTE.forEach((color, idx) => {
    const usado = indiceCount.has(idx)
    const usadoPor = usado ? indiceCount.get(idx).join(', ') : 'DISPONIBLE'
    console.log(`  [${idx}] ${color.bg} - ${usadoPor}`)
  })
  
  // 5. Calcular hash para nombres problemáticos
  console.log('\n🔢 HASH CALCULADO PARA NOMBRES PROBLEMÁTICOS:')
  const nombresProblem = ['CAMILA', 'CAMILA RIVAS TORRES', 'JUAN PÉREZ', 'NICO', 'CRISTIAN']
  nombresProblem.forEach(nombre => {
    let hash = 0
    for (let i = 0; i < nombre.length; i++) {
      hash = ((hash << 5) - hash) + nombre.charCodeAt(i)
      hash = hash & hash
    }
    const index = Math.abs(hash * 31) % COLOR_PALETTE.length
    console.log(`  "${nombre}" → hash: ${hash}, índice calculado: ${index}`)
  })
  
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('FIN DEL DIAGNÓSTICO')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  return {
    totalPersonas: Object.keys(colorCache).length,
    colisiones,
    cache: colorCache
  }
}

/**
 * Reconstruye el cache de colores desde cero sin colisiones
 */
export const reconstruirCacheColores = () => {
  console.log('🔄 Reconstruyendo cache de colores...')
  
  const cacheKey = 'schedule_person_colors'
  let colorCache = {}
  
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      colorCache = JSON.parse(cached)
    }
  } catch (e) {
    console.warn('Error loading cache:', e)
    colorCache = {}
  }
  
  // Obtener todas las personas del cache viejo
  const personas = Object.keys(colorCache).sort() // Ordenar alfabéticamente para consistencia
  
  console.log('📋 Personas encontradas:', personas)
  
  // Reconstruir desde cero con índices secuenciales
  const nuevoCache = {}
  let indiceActual = 0
  
  personas.forEach(nombre => {
    const color = COLOR_PALETTE[indiceActual % COLOR_PALETTE.length]
    nuevoCache[nombre] = { ...color, index: indiceActual }
    console.log(`  ✅ ${nombre} → índice ${indiceActual}, color: ${color.bg}`)
    indiceActual++
  })
  
  // Guardar el nuevo cache limpio
  try {
    localStorage.setItem(cacheKey, JSON.stringify(nuevoCache))
    console.log('💾 Cache reconstruido y guardado exitosamente')
    console.log('🎯 Total:', Object.keys(nuevoCache).length, 'personas con colores únicos')
  } catch (e) {
    console.error('Error guardando cache:', e)
  }
  
  return nuevoCache
}

/**
 * Limpia el cache de colores (útil para debugging o reset)
 */
export const clearColorCache = () => {
  try {
    localStorage.removeItem('schedule_person_colors')
    console.log('✅ Cache de colores limpiado')
    return true
  } catch (e) {
    console.error('Error limpiando cache:', e)
    return false
  }
}

/**
 * Genera un color único para una persona
 * Usa asignación secuencial para evitar colisiones
 */
const generateColorForPerson = (nombre, usedColors = []) => {
  // Calcular hash solo como preferencia inicial
  let hash = 0
  for (let i = 0; i < nombre.length; i++) {
    const char = nombre.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  let preferredIndex = Math.abs(hash * 31) % COLOR_PALETTE.length
  
  // Si el color preferido ya está en uso, buscar el siguiente disponible
  let attempts = 0
  while (usedColors.includes(preferredIndex) && attempts < COLOR_PALETTE.length) {
    preferredIndex = (preferredIndex + 1) % COLOR_PALETTE.length
    attempts++
  }
  
  return { color: COLOR_PALETTE[preferredIndex], index: preferredIndex }
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
  let needsRebuild = false
  
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      colorCache = JSON.parse(cached)
      
      // VERIFICAR COLISIONES en el cache
      const indicesUsados = new Map()
      Object.entries(colorCache).forEach(([name, colorData]) => {
        const idx = colorData.index
        if (idx !== undefined) {
          if (indicesUsados.has(idx)) {
            console.warn(`⚠️ Colisión detectada: índice ${idx} usado por "${indicesUsados.get(idx)}" y "${name}"`)
            needsRebuild = true
          }
          indicesUsados.set(idx, name)
        }
      })
      
      // Si hay colisiones, reconstruir automáticamente
      if (needsRebuild) {
        console.error('� Cache corrupto con colisiones detectadas. Reconstruyendo...')
        colorCache = reconstruirCacheColores()
      }
    }
  } catch (e) {
    console.warn('Error loading color cache:', e)
  }
  
  // Si ya tiene color asignado, usarlo
  if (colorCache[nombreNormalizado]) {
    return colorCache[nombreNormalizado]
  }
  
  // Obtener índices ya usados (ahora garantizados sin colisiones)
  const usedIndices = Object.values(colorCache).map(c => c.index)
  
  // Generar nuevo color evitando colisiones
  const { color: newColor, index } = generateColorForPerson(nombreNormalizado, usedIndices)
  
  console.log(`✅ ${nombreNormalizado} → índice ${index}, color:`, newColor.bg)
  
  // Guardar con el índice
  colorCache[nombreNormalizado] = { ...newColor, index }
  
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
  // Validar que timeString existe y es un string
  if (!timeString || typeof timeString !== 'string') {
    console.warn('⚠️ parseTimeToMinutes: timeString inválido:', timeString)
    return 0
  }
  
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
    
    // ⚠️ NORMALIZAR hora_inicio y hora_fin: pueden venir como "HH:mm:ss" de Postgres
    const horaInicioNormalizada = turno.hora_inicio 
      ? turno.hora_inicio.substring(0, 5) 
      : '09:00'
    
    const horaFinNormalizada = turno.hora_fin 
      ? turno.hora_fin.substring(0, 5) 
      : '18:00'
    
    console.log('⏰ Turno:', turno.persona?.nombre, 
                '| Raw:', turno.hora_inicio, '-', turno.hora_fin,
                '| Normalizado:', horaInicioNormalizada, '-', horaFinNormalizada)
    
    if (horaAlmuerzoNormalizada) {
      console.log('🍽️ Turno con almuerzo:', turno.persona?.nombre, '→', horaAlmuerzoNormalizada)
    }
    
    // Bloque del turno (ÚNICO, almuerzo se dibuja dentro)
    blocks.push({
      id: turno.id,
      day,
      start: horaInicioNormalizada,
      end: horaFinNormalizada,
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
      // Validar que los bloques tienen start y end
      if (!a.start || !a.end || !b.start || !b.end) {
        console.warn('⚠️ Bloque sin start/end:', { a, b })
        return 0
      }
      
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
  
  // Usar módulo para ciclar los nombres de días cuando dayIndex > 6
  const dayNameIndex = dayIndex % 7
  
  return {
    name: dayNames[dayNameIndex],
    date: dayNum,
    full: `${dayNames[dayNameIndex]} ${dayNum}`
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
