import persistentStorage from './persistentStorage'
import configService from './configService'

// Servicio para gestión de datos maestros
class MasterDataService {
  constructor() {
    this.initializeDefaultData()
    this.observers = [] // Para notificar cambios a otros procesos
  }

  // Inicializar datos vacíos si no existen
  initializeDefaultData() {
    if (!persistentStorage.exists('workers')) {
      this.saveWorkers([])
    }

    if (!persistentStorage.exists('vehicles')) {
      this.saveVehicles([])
    }

    if (!persistentStorage.exists('routes')) {
      this.saveRoutes([])
    }

    if (!persistentStorage.exists('payments')) {
      this.savePayments([])
    }

    if (!persistentStorage.exists('worker_shifts')) {
      this.saveWorkerShifts([])
    }

    if (!persistentStorage.exists('calendar_config')) {
      this.saveCalendarConfig(this.getDefaultCalendarConfig())
    }
  }

  // Resetear todos los datos del sistema
  resetAllData() {
    this.saveWorkers([])
    this.saveVehicles([])
    this.saveRoutes([])
    this.savePayments([])
    this.saveWorkerShifts([])
    this.saveCalendarConfig(this.getDefaultCalendarConfig())
    return true
  }

  // Cargar datos de demostración
  loadDemoData() {
    // Datos demo para trabajadores
    const demoWorkers = [
      {
        id: 1,
        name: "Juan Pérez García",
        rut: "12.345.678-9",
        position: "Conductor",
        phone: "+56 9 8765 4321",
        status: "Activo",
        hireDate: "2023-01-15"
      },
      {
        id: 2,
        name: "María González López",
        rut: "98.765.432-1",
        position: "Conductor",
        phone: "+56 9 1234 5678",
        status: "Activo",
        hireDate: "2023-03-20"
      },
      {
        id: 3,
        name: "Carlos Rodríguez Silva",
        rut: "11.222.333-4",
        position: "Mecánico",
        phone: "+56 9 5555 6666",
        status: "Activo",
        hireDate: "2023-05-10"
      }
    ]

    // Datos demo para vehículos
    const demoVehicles = [
      {
        id: 1,
        plate: "FTR-123",
        brand: "Volvo",
        model: "FH16",
        year: 2020,
        status: "Operativo",
        driver: "Juan Pérez García",
        lastMaintenance: "2025-01-15",
        nextMaintenance: "2025-04-15"
      },
      {
        id: 2,
        plate: "CHV-456",
        brand: "Mercedes-Benz",
        model: "Actros",
        year: 2019,
        status: "Mantenimiento",
        driver: "-",
        lastMaintenance: "2025-01-20",
        nextMaintenance: "2025-02-20"
      },
      {
        id: 3,
        plate: "SCN-789",
        brand: "Scania",
        model: "R450",
        year: 2021,
        status: "Operativo",
        driver: "María González López",
        lastMaintenance: "2025-01-10",
        nextMaintenance: "2025-04-10"
      }
    ]

    // Datos demo para rutas
    const demoRoutes = [
      {
        id: 1,
        code: "RT-001",
        name: "Santiago - Valparaíso",
        origin: "Santiago Centro",
        destination: "Puerto Valparaíso",
        distance: "120 km",
        estimatedTime: "2h 30min",
        status: "Activa",
        assignedVehicle: "FTR-123",
        driver: "Juan Pérez García"
      },
      {
        id: 2,
        code: "RT-002",
        name: "Santiago - Concepción",
        origin: "Santiago Sur",
        destination: "Concepción Centro",
        distance: "515 km",
        estimatedTime: "6h 45min",
        status: "Activa",
        assignedVehicle: "SCN-789",
        driver: "María González López"
      }
    ]

    // Datos demo para pagos
    const demoPayments = [
      {
        id: 1,
        worker: "Juan Pérez García",
        rut: "12.345.678-9",
        amount: 850000,
        period: "Enero 2025",
        status: "Pagado",
        paymentDate: "2025-01-31",
        method: "Transferencia"
      },
      {
        id: 2,
        worker: "María González López",
        rut: "98.765.432-1",
        amount: 820000,
        period: "Enero 2025",
        status: "Pendiente",
        paymentDate: "-",
        method: "Transferencia"
      },
      {
        id: 3,
        worker: "Carlos Rodríguez Silva",
        rut: "11.222.333-4",
        amount: 750000,
        period: "Enero 2025",
        status: "Pagado",
        paymentDate: "2025-01-31",
        method: "Efectivo"
      }
    ]

    // Cargar todos los datos demo
    this.saveWorkers(demoWorkers)
    this.saveVehicles(demoVehicles)
    this.saveRoutes(demoRoutes)
    this.savePayments(demoPayments)

    return true
  }

  // Trabajadores
  getWorkers() {
    return persistentStorage.load('workers') || []
  }

  saveWorkers(workers) {
    return persistentStorage.save('workers', workers)
  }

  addWorker(worker) {
    const workers = this.getWorkers()
    const newId = Math.max(...workers.map(w => w.id), 0) + 1
    const newWorker = { ...worker, id: newId }
    workers.push(newWorker)
    return this.saveWorkers(workers)
  }

  updateWorker(id, updates) {
    const workers = this.getWorkers()
    const index = workers.findIndex(w => w.id === id)
    if (index !== -1) {
      workers[index] = { ...workers[index], ...updates }
      return this.saveWorkers(workers)
    }
    return false
  }

  deleteWorker(id) {
    const workers = this.getWorkers()
    const filtered = workers.filter(w => w.id !== id)
    return this.saveWorkers(filtered)
  }

  // Vehículos
  getVehicles() {
    return persistentStorage.load('vehicles') || []
  }

  saveVehicles(vehicles) {
    return persistentStorage.save('vehicles', vehicles)
  }

  addVehicle(vehicle) {
    const vehicles = this.getVehicles()
    const newId = Math.max(...vehicles.map(v => v.id), 0) + 1
    const newVehicle = { ...vehicle, id: newId }
    vehicles.push(newVehicle)
    return this.saveVehicles(vehicles)
  }

  updateVehicle(id, updates) {
    const vehicles = this.getVehicles()
    const index = vehicles.findIndex(v => v.id === id)
    if (index !== -1) {
      vehicles[index] = { ...vehicles[index], ...updates }
      return this.saveVehicles(vehicles)
    }
    return false
  }

  deleteVehicle(id) {
    const vehicles = this.getVehicles()
    const filtered = vehicles.filter(v => v.id !== id)
    return this.saveVehicles(filtered)
  }

  // Rutas
  getRoutes() {
    return persistentStorage.load('routes') || []
  }

  saveRoutes(routes) {
    return persistentStorage.save('routes', routes)
  }

  addRoute(route) {
    const routes = this.getRoutes()
    const newId = Math.max(...routes.map(r => r.id), 0) + 1
    const newRoute = { ...route, id: newId }
    routes.push(newRoute)
    return this.saveRoutes(routes)
  }

  updateRoute(id, updates) {
    const routes = this.getRoutes()
    const index = routes.findIndex(r => r.id === id)
    if (index !== -1) {
      routes[index] = { ...routes[index], ...updates }
      return this.saveRoutes(routes)
    }
    return false
  }

  deleteRoute(id) {
    const routes = this.getRoutes()
    const filtered = routes.filter(r => r.id !== id)
    return this.saveRoutes(filtered)
  }

  // Pagos
  getPayments() {
    return persistentStorage.load('payments') || []
  }

  savePayments(payments) {
    return persistentStorage.save('payments', payments)
  }

  addPayment(payment) {
    const payments = this.getPayments()
    const newId = Math.max(...payments.map(p => p.id), 0) + 1
    const newPayment = { ...payment, id: newId }
    payments.push(newPayment)
    return this.savePayments(payments)
  }

  // Turnos de trabajadores
  getWorkerShifts() {
    return persistentStorage.load('worker_shifts') || []
  }

  saveWorkerShifts(shifts) {
    return persistentStorage.save('worker_shifts', shifts)
  }

  addWorkerShifts(shiftsData) {
    const existingShifts = this.getWorkerShifts()
    
    // Obtener fechas únicas de los nuevos turnos a agregar
    const newShiftDates = [...new Set(shiftsData.map(shift => shift.fecha))]
    
    // Filtrar turnos existentes que NO estén en las fechas de los nuevos turnos
    // Esto evita duplicados al reemplazar turnos de fechas ya existentes
    const filteredExistingShifts = existingShifts.filter(existingShift => 
      !newShiftDates.includes(existingShift.fecha)
    )
    
    console.log(`🔄 Reemplazando turnos para fechas: ${newShiftDates.join(', ')}`)
    console.log(`📊 Turnos antes: ${existingShifts.length}, después del filtro: ${filteredExistingShifts.length}`)
    
    // Agregar los nuevos turnos con ID único
    const newShiftsWithIds = shiftsData.map(shift => ({
      ...shift,
      id: Date.now() + Math.random()
    }))
    
    // Combinar turnos filtrados con nuevos turnos
    const allShifts = [...filteredExistingShifts, ...newShiftsWithIds]
    
    console.log(`✅ Total final de turnos: ${allShifts.length}`)
    
    return this.saveWorkerShifts(allShifts)
  }

  // Calcular pagos basados en turnos y tarifas del calendario
  calculateWorkerPayments(workerId = null) {
    const shifts = this.getWorkerShifts()
    const workers = this.getWorkers()
    const calendarConfig = this.getCalendarConfig()
    
    // Validación defensiva para la configuración del calendario
    if (!calendarConfig || !calendarConfig.holidays || !Array.isArray(calendarConfig.holidays)) {
      console.warn('Configuración de calendario corrupta en calculateWorkerPayments, restableciendo configuración por defecto')
      const defaultConfig = this.getDefaultCalendarConfig()
      this.saveCalendarConfig(defaultConfig)
      // Reintentar con la configuración corregida
      return this.calculateWorkerPayments(workerId)
    }
    
    const paymentCalculations = new Map()

    shifts.forEach(shift => {
      // Si se especifica un workerId, filtrar solo esos turnos
      if (workerId && shift.conductorNombre !== workerId) return

      const conductorNombre = shift.conductorNombre
      const fecha = shift.fecha
      const turno = this.getTurnoNumber(shift.turno)
      const tarifa = this.calculateShiftRate(fecha, turno)

      // Determinar tipo de día
      const dateObj = new Date(fecha + 'T00:00:00')
      const dayOfWeek = dateObj.getDay()
      const isHoliday = calendarConfig.holidays.includes(fecha)
      const isSunday = dayOfWeek === 0

      if (!paymentCalculations.has(conductorNombre)) {
        paymentCalculations.set(conductorNombre, {
          conductorNombre,
          totalTurnos: 0,
          totalMonto: 0,
          feriadosTrabajados: 0,
          domingosTrabajados: 0,
          turnos: [],
          desglosePorTipo: {
            'PRIMER TURNO': { cantidad: 0, monto: 0 },
            'SEGUNDO TURNO': { cantidad: 0, monto: 0 },
            'TERCER TURNO': { cantidad: 0, monto: 0 }
          },
          desglosePorDia: {
            'Días normales': { cantidad: 0, monto: 0 },
            'Sábados 3er turno': { cantidad: 0, monto: 0 },
            'Feriados': { cantidad: 0, monto: 0 },
            'Domingos': { cantidad: 0, monto: 0 }
          }
        })
      }

      const calculation = paymentCalculations.get(conductorNombre)
      calculation.totalTurnos++
      calculation.totalMonto += tarifa

      // Contar feriados y domingos
      if (isHoliday && !isSunday) calculation.feriadosTrabajados++
      if (isSunday) calculation.domingosTrabajados++

      // Determinar categoría de día para desglose
      let categoriasDia = 'Días normales'
      if (isSunday) {
        categoriasDia = 'Domingos'
      } else if (isHoliday) {
        categoriasDia = 'Feriados'
      } else if (dayOfWeek === 6 && turno === 3) {
        categoriasDia = 'Sábados 3er turno'
      }

      calculation.turnos.push({
        fecha,
        turno: shift.turno,
        tarifa,
        isHoliday,
        isSunday,
        dayOfWeek,
        categoriasDia
      })

      // Actualizar desglose por tipo
      if (calculation.desglosePorTipo[shift.turno]) {
        calculation.desglosePorTipo[shift.turno].cantidad++
        calculation.desglosePorTipo[shift.turno].monto += tarifa
      }

      // Actualizar desglose por día
      if (calculation.desglosePorDia[categoriasDia]) {
        calculation.desglosePorDia[categoriasDia].cantidad++
        calculation.desglosePorDia[categoriasDia].monto += tarifa
      }
    })

    return Array.from(paymentCalculations.values())
  }

  // Convertir tipo de turno a número
  getTurnoNumber(turnoString) {
    if (!turnoString) return 1
    
    const turno = turnoString.toUpperCase()
    if (turno.includes('PRIMER')) return 1
    if (turno.includes('SEGUNDO')) return 2
    if (turno.includes('TERCER')) return 3
    
    return 1 // Por defecto primer turno
  }

  updatePayment(id, updates) {
    const payments = this.getPayments()
    const index = payments.findIndex(p => p.id === id)
    if (index !== -1) {
      payments[index] = { ...payments[index], ...updates }
      return this.savePayments(payments)
    }
    return false
  }

  deletePayment(id) {
    const payments = this.getPayments()
    const filtered = payments.filter(p => p.id !== id)
    return this.savePayments(filtered)
  }

  // Estadísticas
  getStats() {
    const workers = this.getWorkers()
    const vehicles = this.getVehicles()
    const routes = this.getRoutes()
    const payments = this.getPayments()

    return {
      totalWorkers: workers.length,
      activeWorkers: workers.filter(w => w.status === 'Activo').length,
      totalVehicles: vehicles.length,
      operativeVehicles: vehicles.filter(v => v.status === 'Operativo').length,
      maintenanceVehicles: vehicles.filter(v => v.status === 'Mantenimiento').length,
      totalRoutes: routes.length,
      activeRoutes: routes.filter(r => r.status === 'Activa').length,
      totalPayments: payments.length,
      paidPayments: payments.filter(p => p.status === 'Pagado').length,
      pendingPayments: payments.filter(p => p.status === 'Pendiente').length
    }
  }

  // Exportar todos los datos
  exportAllData() {
    return {
      workers: this.getWorkers(),
      vehicles: this.getVehicles(),
      routes: this.getRoutes(),
      payments: this.getPayments(),
      exportDate: new Date().toISOString()
    }
  }

  // Importar datos
  importData(data) {
    try {
      if (data.workers) this.saveWorkers(data.workers)
      if (data.vehicles) this.saveVehicles(data.vehicles)
      if (data.routes) this.saveRoutes(data.routes)
      if (data.payments) this.savePayments(data.payments)
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  // === GESTIÓN DE CONFIGURACIÓN DE CALENDARIO ===

  // Validar estructura de configuración del calendario
  isValidCalendarConfig(config) {
    return config && 
           typeof config === 'object' && 
           config.holidays && 
           Array.isArray(config.holidays) && 
           config.shiftRates && 
           typeof config.shiftRates === 'object' &&
           typeof config.shiftRates.firstSecondShift === 'number' &&
           typeof config.shiftRates.thirdShiftWeekday === 'number' &&
           typeof config.shiftRates.sunday === 'number'
  }

  // Configuración por defecto del calendario
  getDefaultCalendarConfig() {
    return {
      shiftRates: {
        firstSecondShift: 20000,      // Primeros y segundos turnos (Lun-Sáb)
        thirdShiftWeekday: 22500,     // Tercer turno (Lun-Vie)
        thirdShiftSaturday: 27500,    // Tercer turno sábado
        holiday: 27500,               // Festivos (cualquier turno)
        sunday: 35000                 // Domingo (todos los turnos)
      },
      holidays: [
        // Feriados chilenos por defecto
        '2025-01-01', // Año Nuevo
        '2025-04-18', // Viernes Santo
        '2025-04-19', // Sábado Santo
        '2025-05-01', // Día del Trabajador
        '2025-05-21', // Día de las Glorias Navales
        '2025-09-18', // Fiestas Patrias
        '2025-09-19', // Día del Ejército
        '2025-12-25'  // Navidad
      ]
    }
  }

  // Obtener configuración del calendario
  getCalendarConfig() {
    // Fuente única: configService (sin perder compatibilidad con legacy)
    let calendar = configService.getCalendar()

    // Validación básica
    if (!this.isValidCalendarConfig(calendar)) {
      console.warn('Configuración de calendario inválida, restableciendo configuración por defecto (vía configService)')
      calendar = configService.updateCalendar(this.getDefaultCalendarConfig())
    }

    // Migración automática para configuraciones antiguas
    let migrated = false
    if (!calendar.shiftRates.thirdShiftSaturday) {
      calendar.shiftRates.thirdShiftSaturday = calendar.shiftRates.thirdShiftSatHoliday || 27500
      migrated = true
    }
    if (!calendar.shiftRates.holiday) {
      calendar.shiftRates.holiday = calendar.shiftRates.thirdShiftSatHoliday || 27500
      migrated = true
    }

    // Persistir migración solo si hubo cambios
    if (migrated) {
      this.saveCalendarConfig(calendar)
    }

    return calendar
  }

  // Guardar configuración del calendario
  saveCalendarConfig(config) {
    persistentStorage.save('calendar_config', config)
  }

  // Agregar feriado (persistencia inmediata y compatibilidad)
  addHoliday(date) {
    const updated = configService.addHoliday(date)
    this.saveCalendarConfig(updated)
  }

  // Eliminar feriado
  removeHoliday(date) {
    const updated = configService.removeHoliday(date)
    this.saveCalendarConfig(updated)
  }

  // Actualizar tarifas de turnos
  updateShiftRates(rates) {
    const updated = configService.updateShiftRates(rates)
    this.saveCalendarConfig(updated)
  }

  // Calcular tarifa para un día específico
  calculateShiftRate(date, shiftType) {
    const config = this.getCalendarConfig()
    
    // Validación defensiva para asegurar que la configuración tenga la estructura correcta
    if (!config || !config.holidays || !Array.isArray(config.holidays)) {
      console.warn('Configuración de calendario corrupta, restableciendo configuración por defecto')
      const defaultConfig = this.getDefaultCalendarConfig()
      this.saveCalendarConfig(defaultConfig)
      return this.calculateShiftRate(date, shiftType) // Recursión con configuración corregida
    }
    
    // Crear fecha local correctamente para evitar problemas de zona horaria
    let dateObj
    if (typeof date === 'string') {
      // Crear fecha local usando constructor específico para evitar zona horaria UTC
      const [year, month, day] = date.split('-').map(Number)
      dateObj = new Date(year, month - 1, day) // month - 1 porque van de 0-11
    } else {
      dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    }
    
    const dayOfWeek = dateObj.getDay() // 0 = Domingo, 1 = Lunes, etc.
    const isHoliday = config.holidays.includes(date)

    // Validar tipo de turno
    const validShiftType = shiftType || 1 // Por defecto primer turno

    // REGLA 1: Domingo siempre paga 35.000 cualquier turno
    if (dayOfWeek === 0) {
      return config.shiftRates.sunday // 35.000
    }

    // REGLA 2: Si es festivo (y no es domingo), paga 27.500 cualquier turno
    if (isHoliday && dayOfWeek !== 0) {
      return config.shiftRates.holiday // 27.500
    }

    // REGLA 3: Si no aplica lo anterior y es sábado 3er turno, paga 27.500
    if (dayOfWeek === 6 && validShiftType === 3) {
      return config.shiftRates.thirdShiftSaturday // 27.500
    }

    // REGLA 4: Si no aplica lo anterior y es lunes a viernes 3er turno, paga 22.500
    if (validShiftType === 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      return config.shiftRates.thirdShiftWeekday // 22.500
    }

    // REGLA 5: En los demás casos (1° o 2° turno lunes a sábado), paga 20.000
    return config.shiftRates.firstSecondShift // 20.000
  }

  // Obtener la tarifa más alta para un día (usado para domingo festivo)
  getHighestRate(date) {
    const config = this.getCalendarConfig()
    
    // Crear fecha local correctamente
    let dateObj
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number)
      dateObj = new Date(year, month - 1, day)
    } else {
      dateObj = new Date(date)
    }
    
    const dayOfWeek = dateObj.getDay()
    const isHoliday = config.holidays.includes(date)

    // Si es domingo (festivo o no), siempre es la tarifa de domingo
    if (dayOfWeek === 0) {
      return config.shiftRates.sunday
    }

    // Para otros días, comparar las tarifas posibles
    const rates = [
      this.calculateShiftRate(date, 1),
      this.calculateShiftRate(date, 3)
    ]

    return Math.max(...rates)
  }

  // === EXPORTACIÓN E IMPORTACIÓN DE CONFIGURACIÓN ===

  // Exportar configuración completa del calendario
  exportCalendarConfig() {
    const config = this.getCalendarConfig()
    const exportData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      config: config,
      metadata: {
        totalHolidays: config.holidays.length,
        generatedBy: "TransApp Calendar System"
      }
    }
    
    return exportData
  }

  // Descargar configuración como archivo JSON
  downloadCalendarConfig() {
    const exportData = this.exportCalendarConfig()
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `transapp_calendar_config_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Importar configuración desde archivo
  async importCalendarConfig(file) {
    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      
      if (importData.config && importData.config.shiftRates && importData.config.holidays) {
        this.saveCalendarConfig(importData.config)
        return { success: true, message: "Configuración importada correctamente" }
      } else {
        return { success: false, message: "Formato de archivo inválido" }
      }
    } catch (error) {
      console.error('Error importing calendar config:', error)
      return { success: false, message: "Error al procesar el archivo" }
    }
  }

  // === API PARA OTROS PROCESOS ===

  // Obtener datos completos del sistema para procesos externos
  getSystemSnapshot() {
    return {
      timestamp: new Date().toISOString(),
      workers: this.getWorkers(),
      vehicles: this.getVehicles(),
      routes: this.getRoutes(),
      payments: this.getPayments(),
      calendarConfig: this.getCalendarConfig(),
      statistics: {
        totalWorkers: this.getWorkers().length,
        totalVehicles: this.getVehicles().length,
        totalRoutes: this.getRoutes().length,
        totalPayments: this.getPayments().length,
        totalHolidays: this.getCalendarConfig().holidays.length
      }
    }
  }

  // Obtener solo configuración de calendario para procesos externos
  getCalendarData() {
    const config = this.getCalendarConfig()
    return {
      timestamp: new Date().toISOString(),
      shiftRates: config.shiftRates,
      holidays: config.holidays,
      calculations: {
        // Ejemplos de cálculos para la semana actual
        currentWeek: this.getCurrentWeekRates(),
        nextWeek: this.getNextWeekRates()
      }
    }
  }

  // Calcular tarifas para la semana actual
  getCurrentWeekRates() {
    const today = new Date()
    const monday = this.getMonday(today)
    const weekRates = []
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      const dateKey = day.toISOString().split('T')[0]
      
      weekRates.push({
        date: dateKey,
        dayName: day.toLocaleDateString('es-CL', { weekday: 'long' }),
        rates: {
          shift1: this.calculateShiftRate(dateKey, 1),
          shift2: this.calculateShiftRate(dateKey, 2),
          shift3: this.calculateShiftRate(dateKey, 3)
        },
        isHoliday: this.getCalendarConfig().holidays.includes(dateKey),
        isSunday: day.getDay() === 0
      })
    }
    
    return weekRates
  }

  // Calcular tarifas para la próxima semana
  getNextWeekRates() {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const monday = this.getMonday(nextWeek)
    const weekRates = []
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      const dateKey = day.toISOString().split('T')[0]
      
      weekRates.push({
        date: dateKey,
        dayName: day.toLocaleDateString('es-CL', { weekday: 'long' }),
        rates: {
          shift1: this.calculateShiftRate(dateKey, 1),
          shift2: this.calculateShiftRate(dateKey, 2),
          shift3: this.calculateShiftRate(dateKey, 3)
        },
        isHoliday: this.getCalendarConfig().holidays.includes(dateKey),
        isSunday: day.getDay() === 0
      })
    }
    
    return weekRates
  }

  // Función auxiliar para obtener el lunes de una semana
  getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // === SISTEMA DE OBSERVADORES ===

  // Suscribirse a cambios de configuración
  subscribe(callback) {
    this.observers.push(callback)
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback)
    }
  }

  // Notificar cambios a todos los observadores
  notifyObservers(changeType, data) {
    this.observers.forEach(callback => {
      try {
        callback({ changeType, data, timestamp: new Date().toISOString() })
      } catch (error) {
        console.error('Error notifying observer:', error)
      }
    })
  }

  // Sobrescribir saveCalendarConfig para notificar cambios
  saveCalendarConfig(config) {
    // 'config' aquí es SOLO la sección de calendario
    configService.updateCalendar({
      shiftRates: config.shiftRates,
      holidays: config.holidays
    })
    // Mantener compatibilidad legacy y notificar
    persistentStorage.save('calendar_config', config)
    this.notifyObservers('calendar_config_updated', config)

    // También guardar en sessionStorage para acceso rápido
    sessionStorage.setItem('transapp_last_calendar_update', new Date().toISOString())
  }
}

// Crear instancia singleton
const masterDataService = new MasterDataService()

export default masterDataService
