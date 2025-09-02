/**
 * Utilidades para manejo consistente de fechas en TransApp
 * 
 * Estas funciones aseguran que las fechas se manejen de manera consistente
 * usando timezone local para evitar problemas de desfase UTC.
 */

/**
 * Crea un objeto Date desde un string de fecha ISO (YYYY-MM-DD)
 * usando timezone local para evitar problemas de UTC
 * 
 * @param {string} dateString - Fecha en formato 'YYYY-MM-DD'
 * @returns {Date} - Objeto Date en timezone local
 */
export const createLocalDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('dateString debe ser un string válido en formato YYYY-MM-DD')
  }
  
  const [year, month, day] = dateString.split('-')
  
  if (!year || !month || !day) {
    throw new Error('dateString debe estar en formato YYYY-MM-DD')
  }
  
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

/**
 * Formatea una fecha para mostrar en la UI (ej: "lun, 2 jun")
 * 
 * @param {string} dateString - Fecha en formato 'YYYY-MM-DD'
 * @returns {string} - Fecha formateada en español
 */
export const formatDateForDisplay = (dateString) => {
  const date = createLocalDate(dateString)
  
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(date)
}

/**
 * Obtiene el día del mes desde un string de fecha
 * 
 * @param {string} dateString - Fecha en formato 'YYYY-MM-DD'
 * @returns {number} - Día del mes (1-31)
 */
export const getDayFromDateString = (dateString) => {
  return createLocalDate(dateString).getDate()
}

/**
 * Obtiene el día de la semana desde un string de fecha
 * 
 * @param {string} dateString - Fecha en formato 'YYYY-MM-DD'
 * @returns {number} - Día de la semana (0=domingo, 1=lunes, etc.)
 */
export const getDayOfWeekFromDateString = (dateString) => {
  return createLocalDate(dateString).getDay()
}

/**
 * Compara dos fechas string para ordenamiento
 * 
 * @param {string} dateA - Primera fecha en formato 'YYYY-MM-DD'
 * @param {string} dateB - Segunda fecha en formato 'YYYY-MM-DD'
 * @returns {number} - Resultado de comparación para Array.sort()
 */
export const compareDateStrings = (dateA, dateB) => {
  const dateObjA = createLocalDate(dateA)
  const dateObjB = createLocalDate(dateB)
  return dateObjA - dateObjB
}

/**
 * Verifica si dos fechas string están en el mismo año y mes
 * 
 * @param {string} dateString - Fecha a verificar en formato 'YYYY-MM-DD'
 * @param {number} year - Año a comparar
 * @param {number} month - Mes a comparar (1-12)
 * @returns {boolean} - true si está en el mismo año y mes
 */
export const isDateInYearMonth = (dateString, year, month) => {
  const date = createLocalDate(dateString)
  return date.getFullYear() === year && (date.getMonth() + 1) === month
}
