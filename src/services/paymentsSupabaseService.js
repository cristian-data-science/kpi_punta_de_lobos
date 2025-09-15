/**
 * 🏗️ Servicio de Pagos con Integración Directa a Supabase
 * 
 * Este servicio reemplaza la lógica de pagos del masterDataService
 * para leer directamente desde las tablas de Supabase:
 * - turnos: datos de turnos trabajados 
 * - trabajadores: información de trabajadores
 * - shift_rates: tarifas por turno desde Supabase
 * - holidays: feriados desde Supabase
 * 
 * Mantiene compatibilidad con la interfaz existente de Payments.jsx
 */

import { getSupabaseClient } from './supabaseClient.js'
import masterDataService from './masterDataService'

class PaymentsSupabaseService {
  constructor() {
    // Usar cliente singleton de Supabase
    this.supabase = getSupabaseClient()
    
    // Cache para configuración de calendario
    this.calendarConfigCache = null
    this.cacheExpiry = null
    
    console.log('🏗️ PaymentsSupabaseService inicializado con cliente singleton')
  }

  /**
   * 📅 Cargar configuración de calendario desde Supabase (tarifas + feriados)
   * Con cache de 5 minutos para optimizar performance
   */
  async loadCalendarConfigFromSupabase() {
    try {
      // Verificar cache (válido por 5 minutos)
      const now = Date.now()
      if (this.calendarConfigCache && this.cacheExpiry && now < this.cacheExpiry) {
        return this.calendarConfigCache
      }

      console.log('📅 Cargando configuración de calendario desde Supabase...')
      
      // Cargar tarifas y feriados en paralelo
      const [ratesResult, holidaysResult] = await Promise.all([
        this.supabase.from('shift_rates').select('*').order('rate_name'),
        this.supabase.from('holidays').select('holiday_date').order('holiday_date')
      ])

      if (ratesResult.error) throw ratesResult.error
      if (holidaysResult.error) throw holidaysResult.error

      // Convertir tarifas a formato esperado
      const shiftRates = {}
      ratesResult.data.forEach(rate => {
        shiftRates[rate.rate_name] = rate.rate_value
      })

      // Convertir feriados a formato esperado
      const holidays = holidaysResult.data.map(h => h.holiday_date)

      const config = { shiftRates, holidays }
      
      // Actualizar cache (válido por 5 minutos)
      this.calendarConfigCache = config
      this.cacheExpiry = now + (5 * 60 * 1000)
      
      console.log(`✅ Configuración cargada: ${Object.keys(shiftRates).length} tarifas, ${holidays.length} feriados`)
      return config
      
    } catch (error) {
      console.error('❌ Error cargando configuración desde Supabase:', error)
      console.log('🔄 Fallback a masterDataService')
      
      // Fallback a masterDataService si falla Supabase
      return masterDataService.getCalendarConfig()
    }
  }

  /**
   * 💰 Calcular tarifa para un turno específico (usando datos de Supabase)
   * Lógica idéntica a masterDataService.calculateShiftRate pero con datos de Supabase
   */
  async calculateShiftRateFromSupabase(date, shiftType) {
    try {
      const config = await this.loadCalendarConfigFromSupabase()
      
      // Validación defensiva
      if (!config || !config.holidays || !Array.isArray(config.holidays)) {
        console.warn('⚠️ Configuración inválida, usando fallback')
        return masterDataService.calculateShiftRate(date, shiftType)
      }
      
      // Crear fecha local correctamente para evitar problemas de zona horaria
      let dateObj
      if (typeof date === 'string') {
        const [year, month, day] = date.split('-').map(Number)
        dateObj = new Date(year, month - 1, day) // month - 1 porque van de 0-11
      } else {
        dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      }
      
      const dayOfWeek = dateObj.getDay() // 0 = Domingo, 1 = Lunes, etc.
      const isHoliday = config.holidays.includes(date)
      const validShiftType = shiftType || 1

      // REGLA 1: Domingo siempre paga 35.000 cualquier turno
      if (dayOfWeek === 0) {
        return config.shiftRates.sunday || 35000
      }

      // REGLA 2: Si es festivo (y no es domingo), paga 27.500 cualquier turno
      if (isHoliday && dayOfWeek !== 0) {
        return config.shiftRates.holiday || 27500
      }

      // REGLA 3: Si no aplica lo anterior y es sábado 3er turno, paga 27.500
      if (dayOfWeek === 6 && validShiftType === 3) {
        return config.shiftRates.thirdShiftSaturday || 27500
      }

      // REGLA 4: Si no aplica lo anterior y es lunes a viernes 3er turno, paga 22.500
      if (validShiftType === 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
        return config.shiftRates.thirdShiftWeekday || 22500
      }

      // REGLA 5: En los demás casos (1° o 2° turno lunes a sábado), paga 20.000
      return config.shiftRates.firstSecondShift || 20000
      
    } catch (error) {
      console.error('❌ Error calculando tarifa desde Supabase:', error)
      console.log('🔄 Fallback a masterDataService')
      return masterDataService.calculateShiftRate(date, shiftType)
    }
  }

  /**
   * 🔄 Cargar turnos COMPLETADOS desde Supabase con información del trabajador
   * Solo cuenta turnos con estado 'completado' para el pago
   * IMPORTANTE: Usa el campo 'pago' directamente sin recalcular tarifas
   */
  async loadTurnosFromSupabase() {
    try {
      console.log('📊 Cargando turnos COMPLETADOS desde Supabase...')
      
      const { data: turnos, error } = await this.supabase
        .from('turnos')
        .select(`
          *,
          trabajador:trabajador_id (
            id,
            nombre,
            rut
          )
        `)
        .eq('estado', 'completado')  // ✅ SOLO TURNOS COMPLETADOS
        .order('fecha', { ascending: false })

      if (error) {
        console.error('❌ Error cargando turnos desde Supabase:', error)
        throw error
      }

      console.log(`✅ ${turnos.length} turnos COMPLETADOS cargados desde Supabase`)
      console.log('� Usando campo "pago" guardado en BD - NO recalcula tarifas')
      
      // Transformar datos de Supabase al formato esperado por la lógica de pagos
      const turnosTransformados = turnos.map(turno => ({
        id: turno.id,
        fecha: turno.fecha,
        conductorNombre: turno.trabajador?.nombre || 'Trabajador no encontrado',
        turno: this.mapTurnoType(turno.turno_tipo), // Convertir de turno_tipo a formato legacy
        estado: turno.estado,  // Siempre será 'completado' debido al filtro
        pago: turno.pago || 0  // ✅ USAR PAGO GUARDADO EN SUPABASE
      }))

      return turnosTransformados
    } catch (error) {
      console.error('❌ Error en loadTurnosFromSupabase:', error)
      return []
    }
  }

  /**
   * 📅 Cargar turnos de un mes específico (SOLUCIONA PROBLEMA LÍMITE SUPABASE)
   * Carga solo turnos de un año/mes específico para evitar límite 1000 registros
   */
  async loadTurnosForMonth(year, month) {
    try {
      // Calcular rango de fechas del mes
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate() // Último día del mes
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      
      console.log(`📅 Cargando turnos para ${year}-${String(month).padStart(2, '0')} (${startDate} a ${endDate})`)

      const { data: turnos, error } = await this.supabase
        .from('turnos')
        .select(`
          *,
          trabajador:trabajador_id (
            id,
            nombre,
            rut
          )
        `)
        .eq('estado', 'completado')
        .gte('fecha', startDate)
        .lte('fecha', endDate)
        .order('fecha', { ascending: true })

      if (error) throw error

      // Transformar al formato esperado
      const turnosTransformados = turnos.map(turno => ({
        fecha: turno.fecha,
        conductorNombre: turno.trabajador?.nombre || 'Trabajador no encontrado',
        turno: this.mapTurnoType(turno.turno_tipo),
        estado: turno.estado,
        pago: turno.pago || 0
      }))

      console.log(`✅ Cargados ${turnosTransformados.length} turnos para ${year}-${month}`)
      return turnosTransformados
      
    } catch (error) {
      console.error(`❌ Error cargando turnos para ${year}-${month}:`, error)
      return []
    }
  }

  /**
   * 📊 Obtener meses disponibles directamente de Supabase (QUERY LIGERA CON PAGINACIÓN)
   * Solo extrae fechas sin datos completos para evitar límites
   */
  async getAvailableMonthsFromSupabase() {
    try {
      console.log('📊 Obteniendo meses disponibles desde Supabase...')
      
      // Usar paginación para obtener TODAS las fechas (no solo 1000)
      let allFechas = []
      let page = 0
      const pageSize = 1000
      let hasMore = true
      
      while (hasMore) {
        const { data: fechas, error } = await this.supabase
          .from('turnos')
          .select('fecha')
          .eq('estado', 'completado')
          .order('fecha', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) throw error

        allFechas = allFechas.concat(fechas)
        hasMore = fechas.length === pageSize
        page++
        
        console.log(`📅 Página ${page}: ${fechas.length} fechas cargadas (total: ${allFechas.length})`)
      }

      // Extraer meses únicos
      const monthsSet = new Set()
      allFechas.forEach(row => {
        const [year, month] = row.fecha.split('-')
        monthsSet.add(`${year}-${month}`)
      })

      const availableMonths = Array.from(monthsSet).sort().reverse()
      console.log(`✅ Meses disponibles: ${availableMonths.join(', ')}`)
      console.log(`📊 Total fechas procesadas: ${allFechas.length}`)
      
      return availableMonths
      
    } catch (error) {
      console.error('❌ Error obteniendo meses disponibles:', error)
      return []
    }
  }

  /**
   * 🔄 Mapear tipos de turno de Supabase al formato legacy
   */
  mapTurnoType(turnoTipo) {
    const map = {
      'primer_turno': 'PRIMER TURNO',
      'segundo_turno': 'SEGUNDO TURNO',
      'tercer_turno': 'TERCER TURNO'
    }
    return map[turnoTipo] || 'PRIMER TURNO'
  }

  /**
   * 💰 Calcular pagos de trabajadores desde turnos ya cargados (OPTIMIZADO)
   * Función específica para usar con datos de un mes específico
   */
  async calculateWorkerPaymentsFromTurnos(turnos) {
    try {
      if (turnos.length === 0) {
        console.warn('⚠️ No hay turnos para calcular pagos')
        return []
      }

      // 2. Obtener configuración de tarifas desde Supabase
      const calendarConfig = await this.loadCalendarConfigFromSupabase()
      
      // Validación defensiva
      if (!calendarConfig || !calendarConfig.holidays || !Array.isArray(calendarConfig.holidays)) {
        console.warn('⚠️ Configuración de calendario corrupta, usando fallback')
        return []
      }

      // 3. Procesar turnos y aplicar lógica de categorías
      const turnosConCategorias = turnos.map(turno => {
        const fecha = new Date(turno.fecha + 'T00:00:00.000Z')
        const dayOfWeek = fecha.getUTCDay()
        
        // Verificar si es feriado (no domingo)
        const isHoliday = calendarConfig.holidays.some(holiday => 
          holiday.date === turno.fecha && !holiday.isSunday
        )
        
        const isSunday = dayOfWeek === 0
        const isSaturday = dayOfWeek === 6
        
        let categoriasDia = 'Días normales'
        if (isSunday) {
          categoriasDia = 'Domingos'
        } else if (isHoliday) {
          categoriasDia = 'Feriados'
        } else if (isSaturday) {
          categoriasDia = 'Sábados'
        }
        
        return {
          ...turno,
          isHoliday,
          isSunday,
          isSaturday,
          categoriasDia,
          // 💰 USAR VALOR HISTÓRICO del campo 'pago' (NO recalcular)
          tarifa: turno.pago || 0  // 'pago' es el valor guardado en BD
        }
      })

      // 4. Agrupar por trabajador
      const trabajadoresMap = new Map()
      
      turnosConCategorias.forEach(turno => {
        if (!trabajadoresMap.has(turno.conductorNombre)) {
          trabajadoresMap.set(turno.conductorNombre, {
            nombre: turno.conductorNombre,
            conductorNombre: turno.conductorNombre, // 🔧 AGREGAR: Campo requerido para UI
            turnos: [],
            totalTurnos: 0,
            totalMonto: 0,
            feriadosTrabajados: 0,
            domingosTrabajados: 0,
            desglosePorTipo: {},
            desglosePorDia: {}
          })
        }

        const worker = trabajadoresMap.get(turno.conductorNombre)
        worker.turnos.push(turno)
        worker.totalTurnos++
        worker.totalMonto += turno.tarifa

        // Contadores específicos
        if (turno.isHoliday && !turno.isSunday) worker.feriadosTrabajados++
        if (turno.isSunday) worker.domingosTrabajados++

        // Desglose por tipo de turno
        if (!worker.desglosePorTipo[turno.turno]) {
          worker.desglosePorTipo[turno.turno] = { cantidad: 0, monto: 0 }
        }
        worker.desglosePorTipo[turno.turno].cantidad++
        worker.desglosePorTipo[turno.turno].monto += turno.tarifa

        // Desglose por tipo de día
        if (!worker.desglosePorDia[turno.categoriasDia]) {
          worker.desglosePorDia[turno.categoriasDia] = { cantidad: 0, monto: 0 }
        }
        worker.desglosePorDia[turno.categoriasDia].cantidad++
        worker.desglosePorDia[turno.categoriasDia].monto += turno.tarifa
      })

      const resultado = Array.from(trabajadoresMap.values())
      console.log(`💰 Pagos calculados desde turnos: ${resultado.length} trabajadores`)
      
      return resultado
      
    } catch (error) {
      console.error('❌ Error calculando pagos desde turnos:', error)
      return []
    }
  }

  /**
   * 📊 Calcular pagos de trabajadores usando datos de Supabase
   * Compatible con la interfaz de masterDataService.calculateWorkerPayments()
   */
  async calculateWorkerPayments(workerId = null) {
    try {
      // 1. Cargar turnos desde Supabase
      const turnos = await this.loadTurnosFromSupabase()
      
      if (turnos.length === 0) {
        console.warn('⚠️ No hay turnos COMPLETADOS en Supabase para calcular pagos')
        console.warn('💡 Asegúrate de marcar los turnos como "completado" en la sección Turnos')
        return []
      }

      // 2. Obtener configuración de tarifas desde Supabase
      const calendarConfig = await this.loadCalendarConfigFromSupabase()
      
      // Validación defensiva
      if (!calendarConfig || !calendarConfig.holidays || !Array.isArray(calendarConfig.holidays)) {
        console.warn('⚠️ Configuración de calendario corrupta, usando fallback')
        return []
      }

      // 3. Procesar cálculos de pagos usando campo 'pago' de Supabase
      const paymentCalculations = new Map()

      // Procesar todos los turnos usando el pago guardado en BD
      for (const turno of turnos) {
        // Filtrar por workerId si se especifica
        if (workerId && turno.conductorNombre !== workerId) continue

        const conductorNombre = turno.conductorNombre
        const fecha = turno.fecha
        
        // ✅ USAR PAGO GUARDADO EN SUPABASE - NO RECALCULAR
        const pago = turno.pago || 0

        // Determinar tipo de día SOLO para estadísticas - usar timezone local
        const [year, month, day] = fecha.split('-')
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const dayOfWeek = dateObj.getDay()
        const isHoliday = calendarConfig?.holidays?.includes(fecha) || false
        const isSunday = dayOfWeek === 0

        // Inicializar trabajador si no existe
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
        calculation.totalMonto += pago  // ✅ USAR PAGO DE SUPABASE

        // Contar feriados y domingos para estadísticas
        if (isHoliday && !isSunday) calculation.feriadosTrabajados++
        if (isSunday) calculation.domingosTrabajados++

        // Determinar categoría de día para desglose
        let categoriasDia = 'Días normales'
        const turnoNumber = this.getTurnoNumber(turno.turno)
        if (isSunday) {
          categoriasDia = 'Domingos'
        } else if (isHoliday) {
          categoriasDia = 'Feriados'
        } else if (dayOfWeek === 6 && turnoNumber === 3) {
          categoriasDia = 'Sábados 3er turno'
        }

        // Agregar turno individual usando pago guardado
        calculation.turnos.push({
          fecha,
          turno: turno.turno,
          tarifa: pago,  // ✅ USAR PAGO GUARDADO
          isHoliday,
          isSunday,
          dayOfWeek,
          categoriasDia
        })

        // Actualizar desglose por tipo usando pago guardado
        if (calculation.desglosePorTipo[turno.turno]) {
          calculation.desglosePorTipo[turno.turno].cantidad++
          calculation.desglosePorTipo[turno.turno].monto += pago  // ✅ USAR PAGO
        }

        // Actualizar desglose por día usando pago guardado
        if (calculation.desglosePorDia[categoriasDia]) {
          calculation.desglosePorDia[categoriasDia].cantidad++
          calculation.desglosePorDia[categoriasDia].monto += pago  // ✅ USAR PAGO
        }
      }

      const result = Array.from(paymentCalculations.values())
      console.log(`✅ Cálculo de pagos completado: ${result.length} trabajadores procesados`)
      console.log(`📊 Total turnos COMPLETADOS procesados: ${turnos.length}`)
      console.log('💰 USANDO CAMPO "PAGO" GUARDADO - NO recalcula con tarifas actuales')
      
      return result

    } catch (error) {
      console.error('❌ Error en calculateWorkerPayments:', error)
      return []
    }
  }

  /**
   * 🔄 Convertir tipo de turno a número (compatibilidad con masterDataService)
   */
  getTurnoNumber(turnoString) {
    if (!turnoString) return 1
    
    const turno = turnoString.toUpperCase()
    if (turno.includes('PRIMER')) return 1
    if (turno.includes('SEGUNDO')) return 2
    if (turno.includes('TERCER')) return 3
    
    return 1 // Por defecto primer turno
  }

  /**
   * 📊 Verificar conexión con Supabase y estadísticas (solo turnos completados)
   */
  async getSupabaseStats() {
    try {
      // Total de turnos completados (los que generan pago)
      const { count: turnosCompletados } = await this.supabase
        .from('turnos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'completado')

      // Total de turnos programados (para información)
      const { count: turnosProgramados } = await this.supabase
        .from('turnos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'programado')

      // Total de trabajadores
      const { count: trabajadoresCount } = await this.supabase
        .from('trabajadores')
        .select('*', { count: 'exact', head: true })

      return {
        connected: true,
        turnosCompletados,
        turnosProgramados, 
        turnosTotal: turnosCompletados + turnosProgramados,
        trabajadoresTotal: trabajadoresCount,
        timestamp: new Date().toISOString(),
        note: 'Solo los turnos completados generan pagos'
      }
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de Supabase:', error)
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 🔄 Método de prueba para verificar que todo funciona
   */
  async testConnection() {
    try {
      console.log('🧪 Probando conexión con Supabase...')
      
      const stats = await this.getSupabaseStats()
      console.log('📊 Estadísticas de Supabase:', stats)
      
      const turnos = await this.loadTurnosFromSupabase()
      console.log(`📋 Turnos cargados: ${turnos.length}`)
      
      if (turnos.length > 0) {
        const payments = await this.calculateWorkerPayments()
        console.log(`💰 Pagos calculados para ${payments.length} trabajadores`)
      }
      
      return {
        success: true,
        stats,
        turnosCount: turnos.length,
        message: 'Conexión exitosa con Supabase'
      }
    } catch (error) {
      console.error('❌ Error en test de conexión:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Crear instancia singleton
const paymentsSupabaseService = new PaymentsSupabaseService()

export default paymentsSupabaseService