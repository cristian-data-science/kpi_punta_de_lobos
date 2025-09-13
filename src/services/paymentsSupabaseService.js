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
   * Reemplaza masterDataService.getWorkerShifts()
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
      console.log('💡 Nota: Solo se incluyen turnos con estado "completado" para el cálculo de pagos')
      
      // Transformar datos de Supabase al formato esperado por la lógica de pagos
      const turnosTransformados = turnos.map(turno => ({
        id: turno.id,
        fecha: turno.fecha,
        conductorNombre: turno.trabajador?.nombre || 'Trabajador no encontrado',
        turno: this.mapTurnoType(turno.turno_tipo), // Convertir de turno_tipo a formato legacy
        estado: turno.estado  // Siempre será 'completado' debido al filtro
      }))

      return turnosTransformados
    } catch (error) {
      console.error('❌ Error en loadTurnosFromSupabase:', error)
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

      // 3. Procesar cálculos de pagos con tarifas de Supabase
      const paymentCalculations = new Map()

      // Procesar todos los turnos de forma asíncrona
      for (const turno of turnos) {
        // Filtrar por workerId si se especifica
        if (workerId && turno.conductorNombre !== workerId) continue

        const conductorNombre = turno.conductorNombre
        const fecha = turno.fecha
        const turnoNumber = this.getTurnoNumber(turno.turno)
        
        // Usar la nueva función que obtiene tarifas desde Supabase
        const tarifa = await this.calculateShiftRateFromSupabase(fecha, turnoNumber)

        // Determinar tipo de día - usar timezone local para consistencia
        const [year, month, day] = fecha.split('-')
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const dayOfWeek = dateObj.getDay()
        const isHoliday = calendarConfig.holidays.includes(fecha)
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
        } else if (dayOfWeek === 6 && turnoNumber === 3) {
          categoriasDia = 'Sábados 3er turno'
        }

        // Agregar turno individual
        calculation.turnos.push({
          fecha,
          turno: turno.turno,
          tarifa,
          isHoliday,
          isSunday,
          dayOfWeek,
          categoriasDia
        })

        // Actualizar desglose por tipo
        if (calculation.desglosePorTipo[turno.turno]) {
          calculation.desglosePorTipo[turno.turno].cantidad++
          calculation.desglosePorTipo[turno.turno].monto += tarifa
        }

        // Actualizar desglose por día
        if (calculation.desglosePorDia[categoriasDia]) {
          calculation.desglosePorDia[categoriasDia].cantidad++
          calculation.desglosePorDia[categoriasDia].monto += tarifa
        }
      }

      const result = Array.from(paymentCalculations.values())
      console.log(`✅ Cálculo de pagos completado: ${result.length} trabajadores procesados`)
      console.log(`📊 Total turnos COMPLETADOS procesados: ${turnos.length}`)
      console.log('💰 Solo turnos con estado "completado" generan pagos')
      
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