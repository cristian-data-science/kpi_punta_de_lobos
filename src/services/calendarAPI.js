// Ejemplo de cómo acceder a la configuración del calendario desde otros procesos
// Este archivo muestra diferentes formas de leer los datos persistentes

import masterDataService from '../services/masterDataService'

// === EJEMPLOS DE USO PARA OTROS PROCESOS ===

// 1. Obtener configuración completa del calendario
export const getCalendarConfiguration = () => {
  try {
    const calendarData = masterDataService.getCalendarData()
    console.log('📅 Configuración del calendario:', calendarData)
    return calendarData
  } catch (error) {
    console.error('Error obteniendo configuración del calendario:', error)
    return null
  }
}

// 2. Calcular tarifa para una fecha y turno específico
export const calculatePaymentForDate = (date, shiftType) => {
  try {
    const rate = masterDataService.calculateShiftRate(date, shiftType)
    console.log(`💰 Tarifa para ${date} turno ${shiftType}: $${rate.toLocaleString()}`)
    return rate
  } catch (error) {
    console.error('Error calculando tarifa:', error)
    return 0
  }
}

// 3. Obtener todas las tarifas de la semana actual
export const getCurrentWeekPayments = () => {
  try {
    const weekRates = masterDataService.getCurrentWeekRates()
    console.log('📊 Tarifas de la semana actual:', weekRates)
    return weekRates
  } catch (error) {
    console.error('Error obteniendo tarifas de la semana:', error)
    return []
  }
}

// 4. Verificar si una fecha es feriado
export const isHoliday = (date) => {
  try {
    const config = masterDataService.getCalendarConfig()
    const isHolidayDate = config.holidays.includes(date)
    console.log(`🏖️ ¿${date} es feriado?`, isHolidayDate)
    return isHolidayDate
  } catch (error) {
    console.error('Error verificando feriado:', error)
    return false
  }
}

// 5. Obtener snapshot completo del sistema
export const getSystemData = () => {
  try {
    const snapshot = masterDataService.getSystemSnapshot()
    console.log('🏢 Snapshot del sistema:', snapshot)
    return snapshot
  } catch (error) {
    console.error('Error obteniendo snapshot del sistema:', error)
    return null
  }
}

// 6. Suscribirse a cambios en la configuración
export const subscribeToConfigChanges = (callback) => {
  try {
    const unsubscribe = masterDataService.subscribe((change) => {
      console.log('🔄 Cambio detectado en configuración:', change)
      callback(change)
    })
    
    console.log('✅ Suscrito a cambios de configuración')
    return unsubscribe
  } catch (error) {
    console.error('Error suscribiendo a cambios:', error)
    return () => {}
  }
}

// === EJEMPLO DE INTEGRACIÓN COMPLETA ===

export class CalendarIntegration {
  constructor() {
    this.unsubscribe = null
    this.cache = {
      config: null,
      lastUpdate: null
    }
    
    this.init()
  }

  init() {
    // Cargar configuración inicial
    this.refreshConfig()
    
    // Suscribirse a cambios
    this.unsubscribe = subscribeToConfigChanges((change) => {
      this.handleConfigChange(change)
    })
  }

  refreshConfig() {
    this.cache.config = getCalendarConfiguration()
    this.cache.lastUpdate = new Date().toISOString()
  }

  handleConfigChange(change) {
    console.log('🔄 Configuración actualizada:', change)
    this.refreshConfig()
    
    // Aquí puedes disparar eventos personalizados o actualizar otros sistemas
    this.notifyExternalSystems(change)
  }

  notifyExternalSystems(change) {
    // Ejemplo: enviar datos a un servidor externo
    // fetch('/api/calendar-update', {
    //   method: 'POST',
    //   body: JSON.stringify(change)
    // })
    
    // Ejemplo: disparar evento personalizado
    window.dispatchEvent(new CustomEvent('calendarConfigChanged', {
      detail: change
    }))
  }

  // Método para obtener tarifas optimizado con caché
  getShiftRate(date, shiftType) {
    if (!this.cache.config) {
      this.refreshConfig()
    }
    
    return calculatePaymentForDate(date, shiftType)
  }

  // Método para limpiar recursos
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}

// === EXPORTACIÓN PARA USO DIRECTO ===

// Exportar instancia singleton para uso global
export const calendarIntegration = new CalendarIntegration()

// Función de conveniencia para acceso rápido
export const getQuickCalendarData = () => {
  return {
    config: masterDataService.getCalendarConfig(),
    currentWeek: masterDataService.getCurrentWeekRates(),
    timestamp: new Date().toISOString()
  }
}

// Ejemplos de uso:
/*
import { 
  getCalendarConfiguration, 
  calculatePaymentForDate, 
  getCurrentWeekPayments,
  calendarIntegration 
} from './calendarAPI'

// Uso básico
const config = getCalendarConfiguration()
const rate = calculatePaymentForDate('2025-08-24', 3)
const weekRates = getCurrentWeekPayments()

// Uso avanzado con integración
const integration = new CalendarIntegration()
const shiftRate = integration.getShiftRate('2025-08-24', 1)

// Escuchar cambios
window.addEventListener('calendarConfigChanged', (event) => {
  console.log('Calendar config changed:', event.detail)
})
*/
