/**
 * 🏗️ Servicio de Cobros con Integración Directa a Supabase
 * 
 * Este servicio reemplaza la lógica de cobros del masterDataService
 * para leer directamente desde las tablas de Supabase:
 * - turnos: datos de turnos COMPLETADOS únicamente
 * - trabajadores: información de trabajadores
 * 
 * Mantiene compatibilidad con la interfaz existente de Cobros.jsx
 */

import { getSupabaseClient } from './supabaseClient.js'
import masterDataService from './masterDataService'

class CobrosSupabaseService {
  constructor() {
    // Usar cliente singleton de Supabase
    this.supabase = getSupabaseClient()
    
    console.log('🏗️ CobrosSupabaseService inicializado con cliente singleton')
  }

  /**
   * 🔄 Cargar turnos COMPLETADOS desde Supabase con información del trabajador
   * Solo incluye turnos con estado 'completado' para el cálculo de cobros
   * IMPORTANTE: Usa el campo 'cobro' guardado sin recalcular con tarifas actuales
   */
  async loadTurnosFromSupabase() {
    try {
      console.log('📊 Cargando turnos COMPLETADOS desde Supabase para cobros...')
      
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
      console.log('� Usando campo "cobro" guardado en BD - NO recalcula tarifas')
      
      // Transformar datos de Supabase al formato esperado por la lógica de cobros
      const turnosTransformados = turnos.map(turno => ({
        id: turno.id,
        fecha: turno.fecha,
        conductorNombre: turno.trabajador?.nombre || 'Trabajador no encontrado',
        turno: this.mapTurnoType(turno.turno_tipo), // Convertir de turno_tipo a formato legacy
        estado: turno.estado,  // Siempre será 'completado' debido al filtro
        trabajadorId: turno.trabajador_id,
        cobro: turno.cobro || 0,  // ✅ INCLUIR COBRO GUARDADO EN SUPABASE
        // Campos adicionales que puede necesitar Cobros
        turno_tipo: turno.turno_tipo,
        created_at: turno.created_at
      }))

      if (turnosTransformados.length === 0) {
        console.warn('⚠️ No hay turnos COMPLETADOS en Supabase para calcular cobros')
        console.warn('💡 Asegúrate de marcar los turnos como "completado" en la sección Turnos')
        return []
      }

      return turnosTransformados
    } catch (error) {
      console.error('❌ Error en loadTurnosFromSupabase:', error)
      return []
    }
  }

  /**
   * 📅 Cargar turnos de una semana específica (SOLUCIONA PROBLEMA LÍMITE SUPABASE)
   * Carga solo turnos COMPLETADOS de una semana específica para evitar límite 1000 registros
   */
  async loadTurnosForWeek(year, weekNumber) {
    try {
      // Calcular rango de fechas de la semana
      const weekDates = this.getWeekDates(year, weekNumber)
      const startDate = weekDates.startDate.toISOString().split('T')[0]
      const endDate = weekDates.endDate.toISOString().split('T')[0]
      
      console.log(`📅 Cargando turnos para semana ${weekNumber} de ${year} (${startDate} a ${endDate})`)

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
        cobro: turno.cobro || 0 // ✅ USAR COBRO HISTÓRICO GUARDADO
      }))

      console.log(`✅ Cargados ${turnosTransformados.length} turnos para semana ${weekNumber}-${year}`)
      return turnosTransformados
      
    } catch (error) {
      console.error(`❌ Error cargando turnos para semana ${weekNumber}-${year}:`, error)
      return []
    }
  }

  /**
   * 📊 Obtener semanas disponibles directamente de Supabase (QUERY LIGERA CON PAGINACIÓN)
   * Solo extrae fechas sin datos completos para evitar límites
   */
  async getAvailableWeeksFromSupabase() {
    try {
      console.log('📊 Obteniendo semanas disponibles desde Supabase...')
      
      // Usar paginación para obtener TODAS las fechas
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

      // Extraer semanas únicas
      const weeksSet = new Set()
      allFechas.forEach(row => {
        const date = new Date(row.fecha)
        const year = date.getFullYear()
        const weekNumber = this.getWeekNumberForDate(date)
        weeksSet.add(`${year}-W${String(weekNumber).padStart(2, '0')}`)
      })

      const availableWeeks = Array.from(weeksSet).sort().reverse()
      console.log(`✅ Semanas disponibles: ${availableWeeks.join(', ')}`)
      console.log(`📊 Total fechas procesadas: ${allFechas.length}`)
      
      return availableWeeks
      
    } catch (error) {
      console.error('❌ Error obteniendo semanas disponibles:', error)
      return []
    }
  }

  /**
   * 🗓️ Obtener fechas de inicio y fin de una semana (ISO 8601 adaptado)
   */
  getWeekDates(year, week) {
    // Usar algoritmo ISO 8601 mejorado
    const jan4 = new Date(year, 0, 4) // 4 de enero siempre está en la semana 1
    const jan4Day = jan4.getDay() || 7 // Lunes = 1, Domingo = 7
    const week1Monday = new Date(jan4)
    week1Monday.setDate(jan4.getDate() - jan4Day + 1) // Retroceder al lunes de esa semana
    
    // Calcular el lunes de la semana deseada
    const targetMonday = new Date(week1Monday)
    targetMonday.setDate(week1Monday.getDate() + (week - 1) * 7)
    
    const startDate = new Date(targetMonday)
    const endDate = new Date(targetMonday)
    endDate.setDate(startDate.getDate() + 6)
    
    return { startDate, endDate }
  }

  /**
   * 📊 Obtener número de semana para una fecha específica (algoritmo ISO 8601 adaptado)
   */
  getWeekNumberForDate(date) {
    // Crear una copia de la fecha para evitar modificarla
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Para turnos laborales, si es domingo, usar el lunes siguiente para calcular la semana
    const dayOfWeek = d.getDay()
    const calculationDate = new Date(d)
    
    if (dayOfWeek === 0) { // Si es domingo
      calculationDate.setDate(d.getDate() + 1) // Usar el lunes siguiente
    }
    
    // Obtener el jueves de esta semana (para determinar el año ISO)
    const calcDayOfWeek = calculationDate.getDay() || 7 // Lunes = 1, Domingo = 7
    const thursday = new Date(calculationDate)
    thursday.setDate(calculationDate.getDate() + 4 - calcDayOfWeek)
    
    // El año ISO es el año del jueves de esta semana
    const isoYear = thursday.getFullYear()
    
    // Obtener el primer jueves del año ISO
    const jan4 = new Date(isoYear, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const firstThursday = new Date(jan4)
    firstThursday.setDate(jan4.getDate() - jan4Day + 4)
    
    // Calcular número de semana
    const weekNumber = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    
    return weekNumber
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
   * 📊 Calcular cobros usando campo 'cobro' guardado en Supabase
   * Compatible con la interfaz existente de Cobros.jsx
   */
  async calculateTurnosCobros(tarifaPorTurno = 50000) {
    try {
      console.log('💰 Calculando cobros usando campo "cobro" guardado en BD')
      console.log('⚠️ Parámetro tarifaPorTurno IGNORADO - usa valores históricos')
      
      // 1. Cargar turnos completados desde Supabase
      const turnos = await this.loadTurnosFromSupabase()
      
      if (turnos.length === 0) {
        console.warn('⚠️ No hay turnos completados para calcular cobros')
        return []
      }

      // 2. Procesar cálculos de cobros usando campo 'cobro' guardado
      const cobrosCalculations = new Map()

      turnos.forEach(turno => {
        const conductorNombre = turno.conductorNombre
        const fecha = turno.fecha
        const cobro = turno.cobro || 0  // ✅ USAR COBRO GUARDADO EN SUPABASE

        // Inicializar trabajador si no existe
        if (!cobrosCalculations.has(conductorNombre)) {
          cobrosCalculations.set(conductorNombre, {
            conductorNombre,
            totalTurnos: 0,
            totalCobro: 0,
            turnos: [],
            tarifaPorTurno: 'Histórico' // Indicar que usa valores históricos
          })
        }

        const calculation = cobrosCalculations.get(conductorNombre)
        calculation.totalTurnos++
        calculation.totalCobro += cobro  // ✅ SUMAR COBRO GUARDADO

        // Agregar turno individual con cobro guardado
        calculation.turnos.push({
          fecha,
          turno: turno.turno,
          cobro,  // ✅ COBRO GUARDADO EN SUPABASE
          turno_tipo: turno.turno_tipo
        })
      })

      const result = Array.from(cobrosCalculations.values())
      console.log(`✅ Cálculo de cobros completado: ${result.length} trabajadores procesados`)
      console.log(`📊 Total turnos COMPLETADOS procesados: ${turnos.length}`)
      console.log('💰 USANDO CAMPO "COBRO" GUARDADO - NO recalcula con tarifas actuales')
      
      return result

    } catch (error) {
      console.error('❌ Error en calculateTurnosCobros:', error)
      return []
    }
  }

  /**
   * 📊 Filtrar turnos por período (compatible con Cobros.jsx)
   */
  async filterTurnosByPeriod(period, viewMode = 'monthly') {
    try {
      const allTurnos = await this.loadTurnosFromSupabase()
      
      if (!period || !allTurnos.length) {
        return []
      }

      let filtered = []

      if (viewMode === 'monthly') {
        // Filtro mensual: YYYY-MM
        const [year, month] = period.split('-')
        filtered = allTurnos.filter(turno => {
          const turnoYear = turno.fecha.substring(0, 4)
          const turnoMonth = turno.fecha.substring(5, 7)
          return turnoYear === year && turnoMonth === month
        })
      } else if (viewMode === 'weekly') {
        // Filtro semanal: usar lógica de semana ISO adaptada
        filtered = allTurnos.filter(turno => {
          const turnoDate = new Date(turno.fecha)
          const weekNumber = this.getWeekNumberForDate(turnoDate)
          return weekNumber.toString() === period
        })
      }

      console.log(`📅 Turnos filtrados para período ${period}: ${filtered.length} turnos`)
      return filtered

    } catch (error) {
      console.error('❌ Error filtrando turnos por período:', error)
      return []
    }
  }

  /**
   * 🔄 Función de cálculo de semana (compatible con Cobros.jsx)
   */
  getWeekNumberForDate(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const calculationDate = new Date(d)
    
    if (d.getDay() === 0) { // Si es domingo
      calculationDate.setDate(d.getDate() - 6)
    }
    
    const dayOfWeek = calculationDate.getDay()
    const thursday = new Date(calculationDate)
    const daysToThursday = 4 - dayOfWeek
    thursday.setDate(calculationDate.getDate() + daysToThursday)
    
    const isoYear = thursday.getFullYear()
    const jan4 = new Date(isoYear, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const firstThursday = new Date(jan4)
    firstThursday.setDate(jan4.getDate() - jan4Day + 4)
    
    const weekNumber = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    
    return weekNumber
  }

  /**
   * 📊 Obtener períodos disponibles para filtros
   */
  async getAvailablePeriods(viewMode = 'monthly') {
    try {
      const turnos = await this.loadTurnosFromSupabase()
      const periods = new Set()

      turnos.forEach(turno => {
        if (viewMode === 'monthly') {
          const yearMonth = turno.fecha.substring(0, 7) // YYYY-MM
          periods.add(yearMonth)
        } else if (viewMode === 'weekly') {
          const turnoDate = new Date(turno.fecha)
          const weekNumber = this.getWeekNumberForDate(turnoDate)
          const year = turnoDate.getFullYear()
          periods.add(`${year}-W${weekNumber.toString().padStart(2, '0')}`)
        }
      })

      return Array.from(periods).sort().reverse() // Más recientes primero
    } catch (error) {
      console.error('❌ Error obteniendo períodos disponibles:', error)
      return []
    }
  }

  /**
   * 📊 Verificar conexión con Supabase y estadísticas (solo turnos completados)
   */
  async getSupabaseStats() {
    try {
      // Total de turnos completados (los que generan cobro)
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
        note: 'Solo los turnos completados generan cobros'
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
      console.log('🧪 Probando conexión con Supabase para Cobros...')
      
      const stats = await this.getSupabaseStats()
      console.log('📊 Estadísticas de Supabase:', stats)
      
      const turnos = await this.loadTurnosFromSupabase()
      console.log(`📋 Turnos completados cargados: ${turnos.length}`)
      
      if (turnos.length > 0) {
        const cobros = await this.calculateTurnosCobros(50000)
        console.log(`💰 Cobros calculados para ${cobros.length} trabajadores`)
      }
      
      return {
        success: true,
        stats,
        turnosCount: turnos.length,
        message: 'Conexión exitosa con Supabase para Cobros'
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
const cobrosSupabaseService = new CobrosSupabaseService()

export default cobrosSupabaseService