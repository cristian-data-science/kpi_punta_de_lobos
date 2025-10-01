import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Clock, Plus, Calendar, Calendar as CalendarIcon, Copy, Edit, Trash2, Save, X, Users, Grid, Check, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import masterDataService from '../services/masterDataService'
import getSupabaseClient from '../services/supabaseClient'
import AddShiftModal from '../components/AddShiftModal'
import CopyShiftModal from '../components/CopyShiftModal'

const Turnos = () => {
  try {
  // Estados principales
  const [turnos, setTurnos] = useState([])
  const [workers, setWorkers] = useState([]) // TODOS los trabajadores (activos + inactivos) para validación
  const [activeWorkers, setActiveWorkers] = useState([]) // Solo trabajadores activos para asignación
  
  // 🚀 SISTEMA INTELIGENTE: Cache de turnos por mes
  const [loadedMonths, setLoadedMonths] = useState(new Set()) // Meses ya cargados
  const [currentViewMonth, setCurrentViewMonth] = useState(null) // Mes actualmente en vista
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isMarkingWeekCompleted, setIsMarkingWeekCompleted] = useState(false)
  const [calendarConfig, setCalendarConfig] = useState(null)
  const [currentRates, setCurrentRates] = useState({}) // Tarifas actuales desde Supabase
  const [currentHolidays, setCurrentHolidays] = useState([]) // Feriados actuales
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterWorker, setFilterWorker] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // 🆕 NUEVOS ESTADOS - Configuración de Reglas de Turnos
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [turnosConfig, setTurnosConfig] = useState({
    // Reglas de solapamiento
    allowedCombinations: {
      '1_3': true,  // 1º + 3º permitido
      '1_2': false, // 1º + 2º NO permitido
      '2_3': false  // 2º + 3º NO permitido
    },
    // Regla de día siguiente
    nextDayRules: {
      after3rd: ['segundo_turno'], // Si hace 3º, al día siguiente solo 2º
      enforceNextDayRule: true
    },
    // Límites por tipo de turno
    shiftLimits: {
      primer_turno: 8,   // Máximo 8 trabajadores por 1er turno
      segundo_turno: 8,  // Máximo 8 trabajadores por 2do turno
      tercer_turno: 8    // Máximo 8 trabajadores por 3er turno
    },
    // Configuración adicional
    enforceRules: true, // Activar/desactivar todas las reglas
    showAlerts: true    // Mostrar alertas cuando se rompan reglas
  })

  // Obtener cliente Supabase singleton
  const supabase = useMemo(() => getSupabaseClient(), [])

  // Cargar datos iniciales - SIMPLIFICADO y sin estado de control problemático
  useEffect(() => {
    console.log('🚀 Iniciando carga de datos del componente Turnos...')
    loadInitialData()
    loadTurnosConfig() // 🆕 Cargar configuración de reglas
  }, []) // Solo se ejecuta una vez al montar

  useEffect(() => {
    console.log('📊 Cargando configuración del calendario y tarifas...')
    loadCalendarConfig()
    loadCurrentRates()
  }, []) // Solo se ejecuta una vez al montar

  const loadInitialData = async () => {
    setLoading(true)
    console.log('📥 Cargando datos iniciales del componente...')
    try {
      await Promise.all([
        loadTurnos(),
        loadWorkers()
      ])
      console.log('✅ Datos iniciales cargados exitosamente')
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🚀 NUEVO: Cargar turnos de un mes específico (OPTIMIZADO)
  const loadTurnosForMonth = async (monthKey) => {
    // monthKey formato: '2025-06', '2025-07', etc.
    
    if (loadedMonths.has(monthKey)) {
      console.log(`✅ Mes ${monthKey} ya está cargado, omitiendo`)
      return
    }
    
    try {
      console.log(`🔍 Cargando turnos para mes: ${monthKey}`)
      
      const startOfMonth = `${monthKey}-01`
      const year = parseInt(monthKey.split('-')[0])
      const month = parseInt(monthKey.split('-')[1])
      const lastDay = new Date(year, month, 0).getDate()
      const endOfMonth = `${monthKey}-${lastDay.toString().padStart(2, '0')}`
      
      const { data, error } = await supabase
        .from('turnos')
        .select(`
          *,
          trabajador:trabajador_id (
            id,
            nombre,
            rut
          )
        `)
        .gte('fecha', startOfMonth)
        .lte('fecha', endOfMonth)
        .order('fecha', { ascending: false })

      if (error) throw error
      
      console.log(`✅ Mes ${monthKey}: ${data?.length || 0} turnos cargados`)
      
      // Agregar nuevos turnos al estado existente
      setTurnos(prevTurnos => {
        const newTurnos = [...prevTurnos, ...(data || [])]
        // Eliminar duplicados por ID
        const uniqueTurnos = newTurnos.filter((turno, index, self) => 
          index === self.findIndex(t => t.id === turno.id)
        )
        return uniqueTurnos
      })
      
      // Marcar mes como cargado
      setLoadedMonths(prev => new Set([...prev, monthKey]))
      
    } catch (error) {
      console.error(`❌ Error cargando mes ${monthKey}:`, error)
    }
  }

  // 🚀 NUEVO: Detectar semanas que cruzan meses y cargar todos los meses necesarios
  useEffect(() => {
    if (currentWeek) {
      const monday = getMonday(currentWeek)
      const weekDays = getWeekDays(monday)
      
      // Obtener todos los meses únicos que contiene esta semana
      const monthsInWeek = new Set()
      weekDays.forEach(day => {
        const monthKey = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}`
        monthsInWeek.add(monthKey)
      })
      
      console.log(`📅 Semana contiene meses:`, Array.from(monthsInWeek))
      
      // Cargar todos los meses que no estén cargados
      const monthsToLoad = Array.from(monthsInWeek).filter(monthKey => !loadedMonths.has(monthKey))
      
      if (monthsToLoad.length > 0) {
        console.log(`� Cargando meses faltantes:`, monthsToLoad)
        monthsToLoad.forEach(monthKey => {
          loadTurnosForMonth(monthKey)
        })
      }
      
      // Actualizar el mes de vista principal (usar el del lunes)
      const primaryMonthKey = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}`
      if (primaryMonthKey !== currentViewMonth) {
        console.log(`📅 Vista cambió a mes principal: ${primaryMonthKey}`)
        setCurrentViewMonth(primaryMonthKey)
      }
    }
  }, [currentWeek, currentViewMonth, loadedMonths])

  // Función inicial: carga el mes actual
  const loadTurnos = async () => {
    const today = new Date()
    const currentMonthKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
    console.log(`🚀 Carga inicial: mes ${currentMonthKey}`)
    await loadTurnosForMonth(currentMonthKey)
  }

  // 🆕 FUNCIÓN DE REFRESCO INTELIGENTE: Recargar meses específicos
  const refreshMonthsData = async (dates = []) => {
    if (!dates || dates.length === 0) {
      // Si no se pasan fechas, refrescar el mes de la semana actual
      const monday = getMonday(currentWeek)
      const weekDays = getWeekDays(monday)
      dates = weekDays.map(day => formatDateKey(day))
    }
    
    // Obtener todos los meses únicos de las fechas afectadas
    const monthsToRefresh = new Set()
    dates.forEach(dateStr => {
      const [year, month] = dateStr.split('-')
      const monthKey = `${year}-${month}`
      monthsToRefresh.add(monthKey)
    })
    
    console.log(`🔄 Refrescando meses después de operación CRUD:`, Array.from(monthsToRefresh))
    
    // Limpiar los meses del cache y recargarlos
    monthsToRefresh.forEach(monthKey => {
      // Remover del cache para forzar recarga
      setLoadedMonths(prev => {
        const newSet = new Set(prev)
        newSet.delete(monthKey)
        return newSet
      })
      
      // Limpiar turnos del mes del estado
      setTurnos(prevTurnos => {
        return prevTurnos.filter(turno => {
          const turnoMonthKey = turno.fecha.substring(0, 7) // YYYY-MM
          return turnoMonthKey !== monthKey
        })
      })
    })
    
    // Recargar todos los meses afectados
    const refreshPromises = Array.from(monthsToRefresh).map(monthKey => 
      loadTurnosForMonth(monthKey)
    )
    
    await Promise.all(refreshPromises)
    console.log(`✅ Refresco completado para ${monthsToRefresh.size} mes(es)`)
  }

  // 🆕 CALLBACK MEJORADO: Para operaciones CRUD desde modales
  const handleShiftsUpdated = async (affectedDates = []) => {
    console.log(`📝 Turnos actualizados, refrescando meses afectados...`)
    await refreshMonthsData(affectedDates)
  }

  // Cargar trabajadores desde Supabase
  const loadWorkers = async () => {
    try {
      // 🔴 CAMBIO: Cargar TODOS los trabajadores para validación de estado
      const { data, error } = await supabase
        .from('trabajadores')
        .select('*')
        .order('nombre')

      if (error) throw error
      
      console.log('✅ Trabajadores cargados (todos):', data?.length || 0)
      setWorkers(data || []) // Todos los trabajadores
      
      // Crear array separado solo con trabajadores activos para asignación
      const activos = (data || []).filter(w => w.estado === 'activo')
      console.log('🟢 Trabajadores activos:', activos.length)
      setActiveWorkers(activos)
      
    } catch (error) {
      console.error('❌ Error cargando trabajadores:', error)
      setWorkers([])
      setActiveWorkers([])
    }
  }

  // Cargar configuración del calendario
  const loadCalendarConfig = () => {
    const config = masterDataService.getCalendarConfig()
    setCalendarConfig(config)
  }

  // 🆕 Cargar tarifas actuales desde Supabase
  const loadCurrentRates = async () => {
    try {
      console.log('📊 Cargando tarifas actuales desde Supabase...')
      
      const [ratesResult, holidaysResult] = await Promise.all([
        supabase.from('shift_rates').select('*').order('rate_name'),
        supabase.from('holidays').select('holiday_date').order('holiday_date')
      ])

      if (ratesResult.error) throw ratesResult.error
      if (holidaysResult.error) throw holidaysResult.error

      // Convertir a formato para uso directo
      const rates = {}
      ratesResult.data.forEach(rate => {
        rates[rate.rate_name] = rate.rate_value
      })
      
      const holidays = holidaysResult.data.map(h => h.holiday_date)
      
      setCurrentRates(rates)
      setCurrentHolidays(holidays)
      
      console.log(`✅ Tarifas actuales cargadas: ${Object.keys(rates).length} tarifas`)
      console.log(`✅ Feriados cargados: ${holidays.length} feriados`)
      
    } catch (error) {
      console.error('❌ Error cargando tarifas actuales:', error)
    }
  }

  // 🆕 FUNCIONES DE CONFIGURACIÓN DE REGLAS DE TURNOS
  
  // Cargar configuración de reglas desde localStorage
  const loadTurnosConfig = () => {
    try {
      const savedConfig = localStorage.getItem('transapp_turnos_config')
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig)
        setTurnosConfig({ ...turnosConfig, ...parsedConfig })
        console.log('⚙️ Configuración de turnos cargada:', parsedConfig)
      }
    } catch (error) {
      console.error('❌ Error cargando configuración de turnos:', error)
    }
  }
  
  // Guardar configuración de reglas en localStorage
  const saveTurnosConfig = (newConfig) => {
    try {
      localStorage.setItem('transapp_turnos_config', JSON.stringify(newConfig))
      setTurnosConfig(newConfig)
      console.log('✅ Configuración de turnos guardada:', newConfig)
    } catch (error) {
      console.error('❌ Error guardando configuración de turnos:', error)
    }
  }
  
  // Validar reglas de solapamiento para un trabajador en un día
  const validateOverlapRules = (workerId, dateKey, newShiftType, existingAssignments = {}) => {
    if (!turnosConfig.enforceRules) return { valid: true, message: '' }
    
    // Obtener turnos existentes del trabajador para esa fecha
    const workerDayShifts = turnos.filter(t => 
      t.trabajador_id === workerId && 
      t.fecha === dateKey &&
      t.estado !== 'cancelado'
    ).map(t => t.turno_tipo)
    
    // Agregar asignaciones del modal actual
    Object.entries(existingAssignments).forEach(([shiftType, workerIds]) => {
      if (Array.isArray(workerIds) && workerIds.includes(workerId) && shiftType !== newShiftType) {
        workerDayShifts.push(shiftType)
      }
    })
    
    // Verificar combinaciones no permitidas
    const shiftNumbers = {
      'primer_turno': 1,
      'segundo_turno': 2,
      'tercer_turno': 3
    }
    
    const currentShiftNum = shiftNumbers[newShiftType]
    const existingShiftNums = workerDayShifts.map(s => shiftNumbers[s])
    
    for (const existingNum of existingShiftNums) {
      const combination = `${Math.min(currentShiftNum, existingNum)}_${Math.max(currentShiftNum, existingNum)}`
      
      if (turnosConfig.allowedCombinations[combination] === false) {
        const shiftNames = {
          1: '1º Turno',
          2: '2º Turno', 
          3: '3º Turno'
        }
        return {
          valid: false,
          message: `No se permite la combinación ${shiftNames[Math.min(currentShiftNum, existingNum)]} + ${shiftNames[Math.max(currentShiftNum, existingNum)]} el mismo día`
        }
      }
    }
    
    return { valid: true, message: '' }
  }
  
  // Validar regla de día siguiente
  const validateNextDayRules = (workerId, dateKey, shiftType) => {
    if (!turnosConfig.enforceRules || !turnosConfig.nextDayRules.enforceNextDayRule) {
      return { valid: true, message: '' }
    }
    
    // Calcular fecha del día anterior
    const currentDate = new Date(dateKey)
    const previousDay = new Date(currentDate)
    previousDay.setDate(currentDate.getDate() - 1)
    const previousDayKey = formatDateKey(previousDay)
    
    // Verificar si el trabajador tuvo 3er turno el día anterior
    const had3rdShiftYesterday = turnos.some(t => 
      t.trabajador_id === workerId &&
      t.fecha === previousDayKey &&
      t.turno_tipo === 'tercer_turno' &&
      t.estado !== 'cancelado'
    )
    
    if (had3rdShiftYesterday) {
      const allowedNextDay = turnosConfig.nextDayRules.after3rd
      if (!allowedNextDay.includes(shiftType)) {
        return {
          valid: false,
          message: `El trabajador tuvo 3º turno ayer. Hoy solo puede tener: ${allowedNextDay.map(s => {
            const names = { 'primer_turno': '1º', 'segundo_turno': '2º', 'tercer_turno': '3º' }
            return names[s]
          }).join(', ')} Turno`
        }
      }
    }
    
    return { valid: true, message: '' }
  }
  
  // Validar límites por tipo de turno
  const validateShiftLimits = (shiftType, currentAssignments = []) => {
    if (!turnosConfig.enforceRules) return { valid: true, message: '' }
    
    const assignmentsArray = Array.isArray(currentAssignments) ? currentAssignments : []
    const limit = turnosConfig.shiftLimits[shiftType] || 5
    const currentCount = assignmentsArray.length
    
    if (currentCount >= limit) {
      const shiftNames = {
        'primer_turno': '1º Turno',
        'segundo_turno': '2º Turno',
        'tercer_turno': '3º Turno'
      }
      return {
        valid: false,
        message: `Límite alcanzado para ${shiftNames[shiftType]}: máximo ${limit} trabajadores`
      }
    }
    
    return { valid: true, message: '' }
  }
  
  // Función principal de validación (exportable para AddShiftModal)
  const validateTurnosRules = (workerId, dateKey, shiftType, existingAssignments) => {
    const validations = [
      validateOverlapRules(workerId, dateKey, shiftType, existingAssignments),
      validateNextDayRules(workerId, dateKey, shiftType),
      validateShiftLimits(shiftType, existingAssignments[shiftType] || [])
    ]
    
    const failedValidation = validations.find(v => !v.valid)
    return failedValidation || { valid: true, message: '' }
  }

  // ⭐ FUNCIÓN ESPECÍFICA: Calcular tarifa de COBRO desde campo cobro_tarifa
  const calculateCobroRateFromSupabase = async (fecha, turnoTipo) => {
    try {
      console.log(`🧾 Calculando tarifa de COBRO para fecha: ${fecha}, turno: ${turnoTipo}`)
      
      // Cargar ESPECÍFICAMENTE la fila donde rate_name = 'cobro_tarifa'
      const { data: cobroData, error: cobroError } = await supabase
        .from('shift_rates')
        .select('rate_value')
        .eq('rate_name', 'cobro_tarifa')
        .single()

      if (cobroError) {
        console.error('❌ Error cargando tarifa de cobro:', cobroError)
        throw cobroError
      }

      // La tarifa de cobro está en rate_value del registro cobro_tarifa
      const tarifaCobro = cobroData.rate_value
      console.log(`🧾 Tarifa de cobro obtenida desde rate_name='cobro_tarifa': $${tarifaCobro}`)
      
      return Math.floor(Number(tarifaCobro))
      
    } catch (error) {
      console.error('❌ Error calculando tarifa de cobro:', error)
      // Fallback a tarifa de cobro por defecto
      return 25000 // Valor por defecto para cobros
    }
  }

  // ⭐ FUNCIÓN ORIGINAL: Calcular tarifa desde Supabase (para turnos individuales)
  const calculateShiftRateFromSupabase = async (fecha, turnoTipo) => {
    try {
      console.log(`💰 Calculando tarifa para fecha: ${fecha}, turno: ${turnoTipo}`)
      
      // Cargar tarifas y feriados desde Supabase
      const [ratesResult, holidaysResult] = await Promise.all([
        supabase.from('shift_rates').select('*').order('rate_name'),
        supabase.from('holidays').select('holiday_date').order('holiday_date')
      ])

      if (ratesResult.error) throw ratesResult.error
      if (holidaysResult.error) throw holidaysResult.error

      // Convertir tarifas a formato esperado
      const shiftRates = {}
      ratesResult.data.forEach(rate => {
        shiftRates[rate.rate_name] = rate.rate_value
      })

      // Convertir feriados a array de fechas
      const holidays = holidaysResult.data.map(h => h.holiday_date)

      return calculateShiftRateInMemory(fecha, turnoTipo, shiftRates, holidays)
      
    } catch (error) {
      console.error('❌ Error calculando tarifa desde Supabase:', error)
      // Fallback a tarifas por defecto (asegurar entero)
      return 20000
    }
  }

  // ⚡ NUEVA FUNCIÓN OPTIMIZADA: Calcular tarifa en memoria (sin queries)
  const calculateShiftRateInMemory = (fecha, turnoTipo, shiftRates, holidays) => {
    try {
      // Crear fecha local correctamente para evitar problemas de zona horaria
      const [year, month, day] = fecha.split('-').map(Number)
      const dateObj = new Date(year, month - 1, day) // month - 1 porque van de 0-11
      
      const dayOfWeek = dateObj.getDay() // 0 = Domingo, 1 = Lunes, etc.
      const isHoliday = holidays.includes(fecha)
      
      // Convertir turno_tipo a número
      const shiftTypeNumber = turnoTipo === 'primer_turno' ? 1 : 
                             turnoTipo === 'segundo_turno' ? 2 : 
                             turnoTipo === 'tercer_turno' ? 3 : 1

      // REGLAS DE TARIFAS (misma lógica que antes)
      
      // REGLA 1: Domingo siempre paga tarifa de domingo cualquier turno
      if (dayOfWeek === 0) {
        return Math.floor(shiftRates.sunday || 35000) // Asegurar entero
      }

      // REGLA 2: Si es festivo (y no es domingo), paga tarifa de feriado cualquier turno  
      if (isHoliday && dayOfWeek !== 0) {
        return Math.floor(shiftRates.holiday || 27500) // Asegurar entero
      }

      // REGLA 3: Si no aplica lo anterior y es sábado 3er turno, paga tarifa sábado
      if (dayOfWeek === 6 && shiftTypeNumber === 3) {
        return Math.floor(shiftRates.thirdShiftSaturday || 27500) // Asegurar entero
      }

      // REGLA 4: Si no aplica lo anterior y es lunes a viernes 3er turno, paga tarifa 3er turno
      if (shiftTypeNumber === 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
        return Math.floor(shiftRates.thirdShiftWeekday || 22500) // Asegurar entero
      }

      // REGLA 5: En los demás casos (1° o 2° turno lunes a sábado), paga tarifa normal
      return Math.floor(shiftRates.firstSecondShift || 20000) // Asegurar entero
      
    } catch (error) {
      console.error('❌ Error calculando tarifa en memoria:', error)
      // Fallback a tarifa por defecto
      return 20000
    }
  }

  // Obtener el lunes de la semana
  const getMonday = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Generar días de la semana
  const getWeekDays = (monday) => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Calcular número de semana ISO 8601
  const getWeekNumber = (date) => {
    const target = new Date(date.valueOf())
    const dayNr = (date.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNr + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000)
  }

  // Formatear fecha para mostrar
  const formatDate = (date) => {
    return date.toLocaleDateString('es-CL', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  // Formatear fecha para comparaciones (YYYY-MM-DD)
  const formatDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Verificar si una fecha es feriado
  const isHoliday = (date) => {
    if (!calendarConfig) return false
    const dateKey = formatDateKey(date)
    return calendarConfig.holidays.includes(dateKey)
  }

  // 🆕 Obtener tarifa para un día y turno específico (INTELIGENTE)
  const getShiftRate = (date, shiftType) => {
    // Para vista general (cuando no hay turno específico), mostrar tarifa actual
    if (Object.keys(currentRates).length === 0) return 0
    
    const dateKey = formatDateKey(date)
    return calculateShiftRateInMemory(dateKey, shiftType, currentRates, currentHolidays)
  }

  // 🆕 Obtener valor para mostrar (tarifa actual vs pago fijo)
  const getDisplayValue = (turno) => {
    if (turno.estado === 'completado' && turno.pago != null) {
      // Turno completado: mostrar el pago que se guardó
      return turno.pago
    } else {
      // Turno programado: calcular tarifa actual
      if (Object.keys(currentRates).length === 0) return 0
      return calculateShiftRateInMemory(turno.fecha, turno.turno_tipo, currentRates, currentHolidays)
    }
  }

  // Permitir edición de turnos en cualquier fecha
  const isDateEditable = (date) => {
    return date ? true : false
  }

  // Filtrar turnos según criterios
  const getFilteredTurnos = (turnosParam = null) => {
    const targetTurnos = turnosParam || turnos
    return targetTurnos.filter(turno => {
      // Filtro por búsqueda de nombre
      if (searchTerm) {
        const workerName = turno.trabajador?.nombre?.toLowerCase() || ''
        if (!workerName.includes(searchTerm.toLowerCase())) {
          return false
        }
      }

      // Filtro por trabajador específico
      if (filterWorker !== 'all' && turno.trabajador_id !== filterWorker) {
        return false
      }

      // Filtro por estado
      if (filterStatus !== 'all' && turno.estado !== filterStatus) {
        return false
      }

      return true
    })
  }

  // Obtener turnos para una fecha específica (con filtros aplicados) - MEMOIZADO
  const getTurnosForDate = useCallback((date) => {
    const dateKey = formatDateKey(date)
    const turnosDate = turnos.filter(turno => turno.fecha === dateKey)
    
    // � NUEVO: Filtrar turnos de trabajadores INACTIVOS en la vista del calendario
    // 🔴 AJUSTE: Solo ocultar turnos PROGRAMADOS de trabajadores inactivos
    // Los turnos COMPLETADOS se mantienen visibles (históricos para pagos/cobros)
    const turnosConValidacion = turnosDate.filter(turno => {
      // Buscar el trabajador completo en el array de workers
      const worker = workers.find(w => w.id === turno.trabajador_id)
      
      // Si es turno completado, siempre mostrar (histórico)
      if (turno.estado === 'completado') {
        return true
      }
      
      // Si es turno programado, solo mostrar si trabajador está activo
      return worker && worker.estado === 'activo'
    })
    
    // 🔴 DEBUG: Console logs temporales para diagnosticar
    if (dateKey === '2025-07-01' || dateKey === '2025-06-30' || dateKey === '2025-07-21') {
      console.log(`🔍 DEBUG getTurnosForDate:`)
      console.log(`  - Fecha buscada: ${dateKey}`)
      console.log(`  - Total turnos en estado: ${turnos.length}`)
      console.log(`  - Turnos para esta fecha: ${turnosDate.length}`)
      console.log(`  - Turnos validados (completados + programados activos): ${turnosConValidacion.length}`)
      console.log(`  - Primeras 3 fechas en estado:`, turnos.slice(0, 3).map(t => t.fecha))
    }
    
    return getFilteredTurnos(turnosConValidacion)
  }, [turnos, workers, searchTerm, filterWorker, filterStatus])

  // Agrupar turnos por tipo para una fecha - MEMOIZADO
  const groupTurnosByType = useCallback((date) => {
    const turnosDate = getTurnosForDate(date)
    const grouped = {
      primer_turno: [],
      segundo_turno: [],
      tercer_turno: []
    }

    turnosDate.forEach(turno => {
      if (grouped[turno.turno_tipo]) {
        grouped[turno.turno_tipo].push(turno)
      }
    })

    return grouped
  }, [getTurnosForDate])

  // Formatear nombre a primer nombre y primer apellido
  const formatWorkerName = (fullName) => {
    if (!fullName) return 'Sin nombre'
    const parts = fullName.trim().split(' ')
    if (parts.length === 1) return parts[0]
    if (parts.length === 2) return fullName // Si solo hay 2 partes, devolver tal como está
    
    // Para 3+ partes: "Primer Segundo Apellido1 Apellido2"
    // Tomar primer nombre (parts[0]) + primer apellido (parts[2])
    if (parts.length >= 3) {
      return `${parts[0]} ${parts[2]}`
    }
    
    return fullName
  }

  // Navegación de semanas
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeek(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeek(newDate)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
  }

  // Crear turnos para una fecha (placeholder - se implementará en modal)
  const handleCreateShifts = (date) => {
    setSelectedDate(date)
    setIsAddModalOpen(true)
  }

  // Marcar turno como completado y calcular pago
  const handleMarkAsCompleted = async (turnoId) => {
    try {
      console.log(`🔄 Marcando turno ${turnoId} como completado y calculando pago...`)
      
      // Primero obtener los datos del turno para calcular la tarifa
      const { data: turnoData, error: fetchError } = await supabase
        .from('turnos')
        .select('fecha, turno_tipo')
        .eq('id', turnoId)
        .single()

      if (fetchError) {
        console.error('❌ Error obteniendo datos del turno:', fetchError)
        alert('Error al obtener los datos del turno')
        return
      }

      // Calcular la tarifa de pago usando las tablas de Supabase
      const tarifaPago = await calculateShiftRateFromSupabase(turnoData.fecha, turnoData.turno_tipo)
      
      // Calcular la tarifa de cobro usando ESPECÍFICAMENTE el campo cobro_tarifa
      const tarifaCobro = await calculateCobroRateFromSupabase(turnoData.fecha, turnoData.turno_tipo)
      
      // VALIDACIÓN: Asegurar que las tarifas son enteros válidos
      const pagoValidado = Math.floor(Number(tarifaPago))
      const cobroValidado = Math.floor(Number(tarifaCobro))
      
      if (isNaN(pagoValidado) || pagoValidado < 0 || isNaN(cobroValidado) || cobroValidado < 0) {
        console.error(`❌ Tarifas inválidas para turno ${turnoId}: pago=${tarifaPago} cobro=${tarifaCobro}`)
        alert('Error calculando las tarifas del turno. Inténtelo de nuevo.')
        return
      }
      
      console.log(`💰 Tarifas calculadas - Pago: $${pagoValidado.toLocaleString()} | Cobro: $${cobroValidado.toLocaleString()}`)
      
      // Actualizar turno como completado Y guardar pago y cobro calculados
      const { error } = await supabase
        .from('turnos')
        .update({ 
          estado: 'completado',
          pago: pagoValidado,  // Tarifa de pago (variable según turno/día)
          cobro: cobroValidado // Tarifa de cobro (campo cobro_tarifa fijo)
        })
        .eq('id', turnoId)

      if (error) {
        console.error('❌ Error actualizando turno:', error)
        alert('Error al marcar el turno como completado. Inténtelo de nuevo.')
        return
      }

      console.log(`✅ Turno marcado como completado - Pago: $${pagoValidado.toLocaleString()} | Cobro: $${cobroValidado.toLocaleString()}`)
      
      // 🔄 Recargar meses afectados para mostrar el cambio
      await handleShiftsUpdated([fecha])
      
      // Mostrar confirmación
      alert(`Turno marcado como completado exitosamente\nPago: $${pagoValidado.toLocaleString()}\nCobro: $${cobroValidado.toLocaleString()}`)
      
    } catch (error) {
      console.error('❌ Error inesperado:', error)
      alert('Error inesperado al actualizar el turno')
    }
  }

  // Marcar todos los turnos de la semana como completados y calcular pagos
  const handleMarkWeekAsCompleted = async () => {
    if (isMarkingWeekCompleted) return // Prevenir múltiples llamadas simultáneas
    
    try {
      setIsMarkingWeekCompleted(true) // Activar loading state
      
      // Obtener todos los turnos programados de la semana actual
      const weekStartKey = formatDateKey(weekDays[0])
      const weekEndKey = formatDateKey(weekDays[6])
      
      const { data: weekTurnos, error: fetchError } = await supabase
        .from('turnos')
        .select('id, fecha, turno_tipo, trabajador_id')
        .gte('fecha', weekStartKey)
        .lte('fecha', weekEndKey)
        .eq('estado', 'programado')
      
      if (fetchError) {
        console.error('❌ Error obteniendo turnos:', fetchError)
        alert('Error al obtener los turnos de la semana')
        return
      }
      
      if (weekTurnos.length === 0) {
        alert('No hay turnos programados en esta semana para marcar como completados')
        return
      }
      
      // Confirmación
      const confirmation = window.confirm(
        `¿Estás seguro de que quieres marcar TODOS los ${weekTurnos.length} turnos de la semana ${weekRange} como completados y calcular sus pagos?\n\nEsta acción no se puede deshacer fácilmente.`
      )
      
      if (!confirmation) return
      
      console.log(`� OPTIMIZADO: Procesando ${weekTurnos.length} turnos de la semana...`)
      
      // ⚡ OPTIMIZACIÓN 1: Cargar tarifas de pago, tarifa de cobro y feriados UNA SOLA VEZ
      console.log('📊 Cargando tarifas de pago, cobro y feriados...')
      const [ratesResult, holidaysResult] = await Promise.all([
        supabase.from('shift_rates').select('*').order('rate_name'),
        supabase.from('holidays').select('holiday_date').order('holiday_date')
      ])

      if (ratesResult.error) throw ratesResult.error
      if (holidaysResult.error) throw holidaysResult.error

      // Convertir tarifas de PAGO a formato optimizado (variable por turno/día)
      const shiftRates = {}
      ratesResult.data.forEach(rate => {
        shiftRates[rate.rate_name] = rate.rate_value
      })
      
      // Obtener tarifa de COBRO específicamente del rate_name 'cobro_tarifa'
      const cobroTarifaRecord = ratesResult.data.find(rate => rate.rate_name === 'cobro_tarifa')
      const tarifaCobroFija = cobroTarifaRecord ? cobroTarifaRecord.rate_value : 25000 // Fallback
      console.log(`🧾 Tarifa de cobro fija cargada desde rate_name='cobro_tarifa': $${tarifaCobroFija}`)
      const holidays = holidaysResult.data.map(h => h.holiday_date)
      
      console.log(`✅ Tarifas cargadas: ${Object.keys(shiftRates).length}`)
      console.log(`✅ Feriados cargados: ${holidays.length}`)
      
      // ⚡ OPTIMIZACIÓN 2: Calcular todas las tarifas EN MEMORIA (sin queries)
      console.log('💰 Calculando tarifas de pago (variables) y cobro (fija) en memoria...')
      
      const turnosConPagoYCobro = weekTurnos.map(turno => {
        // Calcular tarifa de PAGO (variable según turno/día/feriado)
        const tarifaPago = calculateShiftRateInMemory(turno.fecha, turno.turno_tipo, shiftRates, holidays)
        
        // Usar tarifa de COBRO fija (campo cobro_tarifa)
        const tarifaCobro = tarifaCobroFija
        
        return {
          id: turno.id,
          pago: Math.floor(Number(tarifaPago)), // Tarifa variable según turno
          cobro: Math.floor(Number(tarifaCobro)) // Tarifa fija de cobro_tarifa
        }
      })
      
      let totalPagos = turnosConPagoYCobro.reduce((sum, turno) => sum + turno.pago, 0)
      let totalCobros = turnosConPagoYCobro.reduce((sum, turno) => sum + turno.cobro, 0)
      console.log(`💰 Total pagos calculado: $${totalPagos.toLocaleString()}`)
      console.log(`🧾 Total cobros calculado: $${totalCobros.toLocaleString()}`)
      
      // ⚡ OPTIMIZACIÓN 3: Update masivo con una sola query (incluyendo cobro)
      console.log('🔄 Ejecutando update masivo con pago y cobro...')
      
      const updates = turnosConPagoYCobro.map(turno => 
        supabase
          .from('turnos')
          .update({ 
            estado: 'completado',
            pago: turno.pago,
            cobro: turno.cobro
          })
          .eq('id', turno.id)
      )
      
      // Ejecutar todos los updates en paralelo
      const results = await Promise.allSettled(updates)
      
      // Contar éxitos y fallos
      const exitosos = results.filter(r => r.status === 'fulfilled').length
      const fallidos = results.filter(r => r.status === 'rejected').length
      
      console.log(`✅ Turnos actualizados: ${exitosos}`)
      console.log(`❌ Turnos fallidos: ${fallidos}`)
      
      if (exitosos === 0) {
        alert('Error al actualizar los turnos. Inténtelo de nuevo.')
        return
      }
      
      // 🔄 Recargar meses afectados para mostrar los cambios
      const affectedDates = weekTurnos.map(t => t.fecha)
      await handleShiftsUpdated(affectedDates)
      
      // Mostrar confirmación detallada
      alert(
        `🚀 OPTIMIZADO: ${exitosos} turnos procesados exitosamente!\n\n` +
        `💰 Total pagos calculados: $${totalPagos.toLocaleString()}\n` +
        `🧾 Total cobros calculados: $${totalCobros.toLocaleString()}\n` +
        `📊 Promedio pago por turno: $${Math.round(totalPagos / exitosos).toLocaleString()}\n` +
        `📋 Promedio cobro por turno: $${Math.round(totalCobros / exitosos).toLocaleString()}` +
        `${fallidos > 0 ? `\n⚠️ ${fallidos} turnos fallaron` : ''}`
      )
      
    } catch (error) {
      console.error('❌ Error inesperado:', error)
      alert('Error inesperado al actualizar los turnos de la semana')
    } finally {
      setIsMarkingWeekCompleted(false) // Desactivar loading state
    }
  }

  // Verificar si la semana actual está vacía
  const isWeekEmpty = () => {
    const weekStartKey = formatDateKey(weekDays[0])
    const weekEndKey = formatDateKey(weekDays[6])
    
    return !turnos.some(turno => 
      turno.fecha >= weekStartKey && turno.fecha <= weekEndKey
    )
  }

  // Verificar si la semana actual tiene turnos completados
  const hasWeekCompletedShifts = () => {
    const weekStartKey = formatDateKey(weekDays[0])
    const weekEndKey = formatDateKey(weekDays[6])
    
    return turnos.some(turno => 
      turno.fecha >= weekStartKey && 
      turno.fecha <= weekEndKey && 
      turno.estado === 'completado'
    )
  }

  // Verificar si la semana está 100% completada (todos los turnos completados)
  const isWeekFullyCompleted = () => {
    const weekStartKey = formatDateKey(weekDays[0])
    const weekEndKey = formatDateKey(weekDays[6])
    
    const weekTurnos = turnos.filter(turno => 
      turno.fecha >= weekStartKey && 
      turno.fecha <= weekEndKey
    )
    
    // Si no hay turnos, no mostrar aviso
    if (weekTurnos.length === 0) return false
    
    // Verificar que TODOS los turnos estén completados
    return weekTurnos.every(turno => turno.estado === 'completado')
  }

  // Verificar si hay turnos programados pendientes en la semana actual
  const hasWeekPendingShifts = () => {
    const weekStartKey = formatDateKey(weekDays[0])
    const weekEndKey = formatDateKey(weekDays[6])
    
    // Verificar si hay turnos programados en la semana (sin importar la fecha)
    return turnos.some(turno => 
      turno.fecha >= weekStartKey && 
      turno.fecha <= weekEndKey && 
      turno.estado === 'programado'
    )
  }

  // 🆕 Obtener tarifas reales pagadas de turnos completados en la semana
  const getWeekCompletedTariffs = () => {
    const weekStartKey = formatDateKey(weekDays[0])
    const weekEndKey = formatDateKey(weekDays[6])
    
    // Filtrar solo turnos completados de la semana con campo pago
    const completedTurnos = turnos.filter(turno => 
      turno.fecha >= weekStartKey && 
      turno.fecha <= weekEndKey && 
      turno.estado === 'completado' &&
      turno.pago != null && turno.pago > 0
    )
    
    if (completedTurnos.length === 0) return null
    
    // Agrupar por tipo de turno y obtener tarifas únicas pagadas
    const tarifasPagadas = {}
    const shiftTypes = ['primer_turno', 'segundo_turno', 'tercer_turno']
    
    shiftTypes.forEach(tipo => {
      const turnosTipo = completedTurnos.filter(t => t.turno_tipo === tipo)
      if (turnosTipo.length > 0) {
        // Obtener tarifas únicas pagadas para este tipo de turno
        const tarifasUnicas = [...new Set(turnosTipo.map(t => t.pago))]
        tarifasPagadas[tipo] = {
          tarifas: tarifasUnicas,
          cantidad: turnosTipo.length
        }
      }
    })
    
    return Object.keys(tarifasPagadas).length > 0 ? tarifasPagadas : null
  }

  // Contar TODOS los turnos programados de la semana
  const getPendingShiftsCount = () => {
    const weekStartKey = formatDateKey(weekDays[0])
    const weekEndKey = formatDateKey(weekDays[6])
    
    const programmedCount = turnos.filter(turno => 
      turno.fecha >= weekStartKey && 
      turno.fecha <= weekEndKey && 
      turno.estado === 'programado'
    ).length
    
    // console.log('🔍 DEBUG: Turnos programados en semana:', programmedCount) // Debug temporal desactivado
    
    return programmedCount
  }

  // Contar TODOS los turnos programados de la semana (para debug)
  const getAllWeekProgrammedCount = () => {
    const weekStartKey = formatDateKey(weekDays[0])
    const weekEndKey = formatDateKey(weekDays[6])
    
    return turnos.filter(turno => 
      turno.fecha >= weekStartKey && 
      turno.fecha <= weekEndKey && 
      turno.estado === 'programado'
    ).length
  }

  // Contar TODOS los turnos completados de la semana (para debug)
  const getAllWeekCompletedCount = () => {
    const weekStartKey = formatDateKey(weekDays[0])
    const weekEndKey = formatDateKey(weekDays[6])
    
    return turnos.filter(turno => 
      turno.fecha >= weekStartKey && 
      turno.fecha <= weekEndKey && 
      turno.estado === 'completado'
    ).length
  }

  // 🆕 NUEVA FUNCIÓN: Detectar el mes predominante de la semana actual
  const getMesPredominante = () => {
    // Contar días por mes en la semana actual
    const mesesCount = {}
    
    weekDays.forEach(day => {
      const monthKey = `${day.getFullYear()}-${day.getMonth()}`
      mesesCount[monthKey] = (mesesCount[monthKey] || 0) + 1
    })
    
    // Encontrar el mes con más días
    let maxCount = 0
    let mesPredominante = null
    
    Object.entries(mesesCount).forEach(([monthKey, count]) => {
      if (count > maxCount) {
        maxCount = count
        mesPredominante = monthKey
      }
    })
    
    return mesPredominante
  }

  // 🆕 NUEVA FUNCIÓN: Contador de turnos completados del mes predominante
  const getTurnosCompletadosDelMes = () => {
    const mesPredominante = getMesPredominante()
    if (!mesPredominante) return 0
    
    const [year, month] = mesPredominante.split('-').map(Number)
    
    return turnos.filter(turno => {
      if (turno.estado !== 'completado') return false
      
      const [turnoYear, turnoMonth] = turno.fecha.split('-').map(Number)
      return turnoYear === year && (turnoMonth - 1) === month // month es 0-based
    }).length
  }

  // Rollback: Convertir turnos completados de vuelta a programados
  const handleRollbackWeekToProgrammed = async () => {
    try {
      // Obtener todos los turnos completados de la semana actual
      const weekStartKey = formatDateKey(weekDays[0])
      const weekEndKey = formatDateKey(weekDays[6])
      
      const { data: weekTurnos, error: fetchError } = await supabase
        .from('turnos')
        .select('id, fecha, trabajador_id')
        .gte('fecha', weekStartKey)
        .lte('fecha', weekEndKey)
        .eq('estado', 'completado')
      
      if (fetchError) {
        console.error('❌ Error obteniendo turnos completados:', fetchError)
        alert('Error al obtener los turnos completados de la semana')
        return
      }
      
      if (weekTurnos.length === 0) {
        alert('No hay turnos completados en esta semana para convertir a programados')
        return
      }
      
      // Confirmación
      const confirmation = window.confirm(
        `¿Estás seguro de que quieres REVERTIR todos los ${weekTurnos.length} turnos completados de la semana ${weekRange} de vuelta a programados?\n\nEsto BORRARÁ los pagos y cobros calculados y los pondrá en $0.\nEsta acción afectará los cálculos de pagos y cobros.`
      )
      
      if (!confirmation) return
      
      console.log(`🔄 Revirtiendo ${weekTurnos.length} turnos completados a programados...`)
      
      // Actualizar todos los turnos de completado a programado Y resetear pago Y cobro a 0
      const { error: updateError } = await supabase
        .from('turnos')
        .update({ 
          estado: 'programado',
          pago: 0,
          cobro: 0
        })
        .gte('fecha', weekStartKey)
        .lte('fecha', weekEndKey)
        .eq('estado', 'completado')
      
      if (updateError) {
        console.error('❌ Error actualizando turnos:', updateError)
        alert('Error al revertir los turnos a programados. Inténtelo de nuevo.')
        return
      }
      
      console.log('✅ Todos los turnos de la semana revertidos a programados con pagos y cobros reseteados a $0')
      
      // 🔄 Recargar meses afectados para mostrar los cambios
      const affectedDates = weekTurnos.map(t => t.fecha)
      await handleShiftsUpdated(affectedDates)
      
      // Mostrar confirmación
      alert(`✅ ${weekTurnos.length} turnos de la semana ${weekRange} revertidos a programados exitosamente\n\n💰 Pagos reseteados a $0\n🧾 Cobros reseteados a $0`)
      
    } catch (error) {
      console.error('❌ Error inesperado:', error)
      alert('Error inesperado al revertir los turnos de la semana')
    }
  }

  // Generar turnos aleatorios - 15 turnos por día (5 por cada tipo de turno)
  const generateRandomShifts = () => {
    // 🔴 CAMBIO: Usar activeWorkers en lugar de workers
    if (activeWorkers.length === 0) {
      return []
    }

    const shiftTypes = ['primer_turno', 'segundo_turno', 'tercer_turno']
    const randomShifts = []
    
    // Para cada día de la semana, generar exactamente 15 turnos (5 por cada tipo)
    weekDays.forEach(day => {
      const dateKey = formatDateKey(day)
      
      // Set para rastrear combinaciones únicas por día
      const dayAssignments = new Set()
      
      // Para cada tipo de turno, generar 5 turnos en este día
      shiftTypes.forEach(shiftType => {
        const assignedWorkersForShift = new Set() // Evitar duplicados en el mismo turno
        let attempts = 0
        const maxAttempts = activeWorkers.length * 3 // Límite de intentos para evitar loop infinito
        
        for (let i = 0; i < 5 && attempts < maxAttempts; i++) {
          attempts++
          
          // Seleccionar trabajador aleatorio de los ACTIVOS
          const randomWorker = activeWorkers[Math.floor(Math.random() * activeWorkers.length)]
          const uniqueShiftKey = `${randomWorker.id}-${shiftType}`
          const uniqueDayKey = `${randomWorker.id}-${dateKey}`
          
          // Verificar que el trabajador no esté ya asignado a este turno específico
          if (assignedWorkersForShift.has(randomWorker.id)) {
            i-- // Reintentar este slot
            continue
          }
          
          // Verificar que el trabajador no tenga ya otro turno este día (opcional, comentar si se permite)
          // if (dayAssignments.has(uniqueDayKey)) {
          //   i-- // Reintentar este slot  
          //   continue
          // }
          
          // Asignar trabajador
          assignedWorkersForShift.add(randomWorker.id)
          dayAssignments.add(uniqueDayKey)
          
          randomShifts.push({
            trabajador_id: randomWorker.id,
            fecha: dateKey,
            turno_tipo: shiftType,
            estado: 'programado'
          })
        }
        
        // Si no se pudieron llenar todos los slots, agregar mensaje de debug
        if (assignedWorkersForShift.size < 5) {
          console.warn(`⚠️ Solo se pudieron asignar ${assignedWorkersForShift.size}/5 trabajadores para ${shiftType} en ${dateKey}`)
        }
      })
    })
    
    return randomShifts
  }

  // Crear turnos aleatorios con confirmación
  const handleCreateRandomShifts = async () => {
    try {
      // 🔴 CAMBIO: Usar activeWorkers para validación
      if (activeWorkers.length === 0) {
        alert('No hay trabajadores activos disponibles para crear turnos aleatorios')
        return
      }

      // Generar turnos aleatorios
      const randomShifts = generateRandomShifts()
      
      if (randomShifts.length === 0) {
        alert('No se pudieron generar turnos aleatorios')
        return
      }

      // Crear mensaje de confirmación simple
      const confirmMessage = `¿Estás seguro de que quieres crear ${randomShifts.length} turnos aleatorios para la semana ${weekRange}?

Esta acción creará turnos reales en la base de datos.`

      const confirmation = window.confirm(confirmMessage)
      
      if (!confirmation) {
        console.log('❌ Creación de turnos aleatorios cancelada por el usuario')
        return
      }

      console.log(`🔄 Creando ${randomShifts.length} turnos aleatorios...`)

      // Insertar turnos en Supabase
      const { error: insertError } = await supabase
        .from('turnos')
        .insert(randomShifts)

      if (insertError) {
        console.error('❌ Error insertando turnos aleatorios:', insertError)
        alert('Error al crear los turnos aleatorios. Inténtelo de nuevo.')
        return
      }

      console.log('✅ Turnos aleatorios creados exitosamente')
      
      // 🔄 Recargar meses afectados para mostrar los cambios
      const affectedDates = randomShifts.map(shift => shift.fecha)
      await handleShiftsUpdated(affectedDates)
      
      // Mostrar confirmación
      alert(`✅ ${randomShifts.length} turnos aleatorios creados exitosamente para la semana ${weekRange}`)
      
    } catch (error) {
      console.error('❌ Error inesperado creando turnos aleatorios:', error)
      alert('Error inesperado al crear turnos aleatorios')
    }
  }

  // Mapear tipo de turno a display
  const getTurnoDisplayName = (turnoTipo) => {
    const names = {
      'primer_turno': '1° Turno',
      'segundo_turno': '2° Turno', 
      'tercer_turno': '3° Turno'
    }
    return names[turnoTipo] || turnoTipo
  }

  // Obtener color del badge según estado
  const getStatusBadgeColor = (estado) => {
    switch (estado) {
      case 'programado': return 'bg-blue-100 text-blue-800'
      case 'completado': return 'bg-green-100 text-green-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Memoizar variables derivadas para evitar re-cálculos
  const monday = useMemo(() => getMonday(currentWeek), [currentWeek])
  const weekDays = useMemo(() => getWeekDays(monday), [monday])
  const weekNumber = useMemo(() => getWeekNumber(monday), [monday])
  const weekRange = useMemo(() => 
    `Semana ${weekNumber} (${monday.getDate()} ${monday.toLocaleDateString('es-CL', { month: 'short' })} - ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })})`,
    [monday, weekDays, weekNumber]
  )

  // Calcular estadísticas filtradas - MEMOIZADO
  const stats = useMemo(() => {
    const filteredTurnos = getFilteredTurnos(turnos)
    const weekTurnos = weekDays.reduce((total, day) => total + getTurnosForDate(day).length, 0)
    
    // Filtrar solo turnos futuros (desde mañana)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowKey = tomorrow.getFullYear() + '-' + 
                       String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(tomorrow.getDate()).padStart(2, '0')
    
    const futureTurnos = filteredTurnos.filter(t => t.fecha >= tomorrowKey)
    
    return {
      totalWorkers: activeWorkers.length, // 🔴 CAMBIO: Solo contar trabajadores activos
      weekTurnos: weekTurnos,
      programados: futureTurnos.filter(t => t.estado === 'programado').length,
      // 🔧 NUEVO: Usar contador mensual dinámico del mes predominante
      completados: getTurnosCompletadosDelMes(),
      filteredTotal: filteredTurnos.length
    }
  }, [turnos, weekDays, activeWorkers.length, searchTerm, filterWorker, filterStatus, getTurnosForDate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando turnos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Gestión de Turnos
          </h1>
          <p className="text-gray-600">Asignación y control de turnos de trabajo</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCopyModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar Turnos
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
            {(searchTerm || filterWorker !== 'all' || filterStatus !== 'all') && (
              <Badge variant="secondary" className="text-xs">
                Filtros activos
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar por nombre de trabajador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <select
                value={filterWorker}
                onChange={(e) => setFilterWorker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los trabajadores</option>
                {/* 🔴 CAMBIO: Usar activeWorkers para el filtro */}
                {activeWorkers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {formatWorkerName(worker.nombre)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="programado">Programado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setFilterWorker('all')
                  setFilterStatus('all')
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Trabajadores Activos</p>
                <p className="text-2xl font-bold">{stats.totalWorkers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Turnos Esta Semana</p>
                <p className="text-2xl font-bold">{stats.weekTurnos}</p>
                {(searchTerm || filterWorker !== 'all' || filterStatus !== 'all') && (
                  <p className="text-xs text-gray-500">filtrados</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Turnos Futuros</p>
                <p className="text-2xl font-bold">{stats.programados}</p>
                {(searchTerm || filterWorker !== 'all' || filterStatus !== 'all') && (
                  <p className="text-xs text-gray-500">desde mañana</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Turnos Completados Este Mes</p>
                <p className="text-2xl font-bold">{stats.completados}</p>
                {(searchTerm || filterWorker !== 'all' || filterStatus !== 'all') && (
                  <p className="text-xs text-gray-500">filtrados</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista Semanal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {weekRange}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* 🆕 Réplica exacta del "Resumen de Tarifas Actuales" del Calendar.jsx */}
          {(() => {
            const tarifasPagadas = getWeekCompletedTariffs()
            if (!tarifasPagadas) return null
            
            // Extraer TODAS las tarifas reales del campo pago de turnos completados CON SU CONTEXTO
            const weekStartKey = formatDateKey(weekDays[0])
            const weekEndKey = formatDateKey(weekDays[6])
            
            const turnosCompletados = turnos.filter(turno => 
              turno.fecha >= weekStartKey && 
              turno.fecha <= weekEndKey && 
              turno.estado === 'completado' &&
              turno.pago != null && turno.pago > 0
            )
            
            if (turnosCompletados.length === 0) return null
            
            // Analizar cada turno completado para determinar su categoría REAL
            const categoriasEncontradas = new Map()
            
            turnosCompletados.forEach(turno => {
              const [year, month, day] = turno.fecha.split('-').map(Number)
              const dateObj = new Date(year, month - 1, day)
              const dayOfWeek = dateObj.getDay() // 0 = Domingo, 1 = Lunes, etc.
              const isHoliday = currentHolidays.includes(turno.fecha)
              const shiftTypeNumber = turno.turno_tipo === 'primer_turno' ? 1 : 
                                     turno.turno_tipo === 'segundo_turno' ? 2 : 3
              
              let categoria
              
              // Aplicar las MISMAS REGLAS que se usan para calcular tarifas
              if (dayOfWeek === 0) {
                // Domingo
                categoria = { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Domingo', subtitle: '' }
              } else if (isHoliday && dayOfWeek !== 0) {
                // Festivo (no domingo)
                categoria = { bg: 'bg-red-50', text: 'text-red-600', label: 'Festivos', subtitle: '(Todos)' }
              } else if (dayOfWeek === 6 && shiftTypeNumber === 3) {
                // Sábado 3er turno
                categoria = { bg: 'bg-yellow-50', text: 'text-yellow-600', label: '3º Turno', subtitle: 'Sábado' }
              } else if (shiftTypeNumber === 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
                // Lunes a viernes 3er turno
                categoria = { bg: 'bg-green-50', text: 'text-green-600', label: '3º Turno', subtitle: '(Lun-Vie)' }
              } else {
                // 1º y 2º turno lunes a sábado
                categoria = { bg: 'bg-blue-50', text: 'text-blue-600', label: '1º y 2º Turno', subtitle: '(Lun-Sáb)' }
              }
              
              const key = `${categoria.label}-${categoria.subtitle}`
              if (!categoriasEncontradas.has(key)) {
                categoriasEncontradas.set(key, {
                  ...categoria,
                  tarifa: turno.pago
                })
              }
            })
            
            const categoriasFinales = Array.from(categoriasEncontradas.values())
                                           .sort((a, b) => {
                                             // "1º y 2º Turno (Lun-Sáb)" siempre primero
                                             if (a.label === '1º y 2º Turno' && a.subtitle === '(Lun-Sáb)') return -1
                                             if (b.label === '1º y 2º Turno' && b.subtitle === '(Lun-Sáb)') return 1
                                             // Los demás ordenados por tarifa (menor a mayor)
                                             return a.tarifa - b.tarifa
                                           })
            
            return (
              <div className="mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>💰 Tarifas Pagadas Esta Semana</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                      {categoriasFinales.map((categoria, index) => (
                        <div key={index} className={`px-3 py-2 ${categoria.bg} rounded-lg`}>
                          <div className={`text-lg font-bold ${categoria.text}`}>
                            ${categoria.tarifa.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">{categoria.label}{categoria.subtitle && <><br/>{categoria.subtitle}</>}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })()}

          {/* Leyenda para vista calendario */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold text-lg">✓</span>
                <span className="text-gray-700">Completado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 font-bold text-lg">●</span>
                <span className="text-gray-700">Programado</span>
              </div>
            </div>
          </div>

          {/* Aviso de turnos programados pendientes */}
          {hasWeekPendingShifts() && !isWeekFullyCompleted() && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-orange-800">
                        Turnos Sin Completar
                      </h3>
                      <p className="text-sm text-orange-700">
                        Hay {getPendingShiftsCount()} turno{getPendingShiftsCount() !== 1 ? 's' : ''} programado{getPendingShiftsCount() !== 1 ? 's' : ''} en esta semana que aún no {getPendingShiftsCount() !== 1 ? 'han' : 'ha'} sido completado{getPendingShiftsCount() !== 1 ? 's' : ''}.
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Total semana: {stats.weekTurnos} turnos • Programados: {getAllWeekProgrammedCount()} • Completados: {getAllWeekCompletedCount()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso verde de semana completada */}
              {isWeekFullyCompleted() && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-800">
                        ¡Semana Completada!
                      </h3>
                      <p className="text-sm text-green-700">
                        Todos los {stats.weekTurnos} turnos de esta semana han sido completados exitosamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 🔄 BOTONES MOVIDOS: Navegación y acciones más cerca del calendario */}
              <div className="flex flex-wrap gap-2 justify-center mb-4 p-4 bg-gray-50 rounded-lg">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  ← Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                  Hoy
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  Siguiente →
                </Button>
                <div className="border-l border-gray-300 mx-2 h-8"></div>
                {isWeekEmpty() ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCreateRandomShifts}
                    className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Crear turnos aleatorios
                  </Button>
                ) : hasWeekCompletedShifts() ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRollbackWeekToProgrammed}
                    className="bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Revertir a programado
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMarkWeekAsCompleted}
                    disabled={isMarkingWeekCompleted}
                    className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100 disabled:opacity-60"
                  >
                    {isMarkingWeekCompleted ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Marcar semana completada
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
              const isToday = formatDateKey(day) === formatDateKey(new Date())
              const isHolidayDay = isHoliday(day)
              const isSunday = day.getDay() === 0
              const turnosByType = groupTurnosByType(day)
              const totalTurnos = getTurnosForDate(day).length

              return (
                <div
                  key={index}
                  className={`
                    p-4 border rounded-lg space-y-3 min-h-[200px]
                    ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${isHolidayDay ? 'bg-red-50 border-red-200' : ''}
                    ${isSunday ? 'bg-orange-50 border-orange-200' : ''}
                  `}
                >
                  {/* Header del día */}
                  <div className="text-center">
                    <div className="font-semibold text-sm">
                      {formatDate(day)}
                    </div>
                    {isHolidayDay && (
                      <div className="text-xs text-red-600 font-medium">
                        FERIADO
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {totalTurnos} turno{totalTurnos !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Turnos por tipo */}
                  <div className="space-y-2">
                    {['primer_turno', 'segundo_turno', 'tercer_turno'].map(tipoTurno => {
                      const turnosType = turnosByType[tipoTurno] || []
                      // Para turnos completados, usar el campo pago real; para programados, calcular tarifa actual
                      const tarifa = turnosType.length > 0 && turnosType[0].estado === 'completado' && turnosType[0].pago > 0 
                        ? turnosType[0].pago 
                        : getShiftRate(day, tipoTurno)
                      
                      return (
                        <div key={tipoTurno} className="bg-white rounded p-2 border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {getTurnoDisplayName(tipoTurno)}
                            </span>
                            {/* Solo mostrar tarifa cuando la semana esté completada */}
                            {isWeekFullyCompleted() && (
                              <span className="text-xs text-green-600 font-medium" title="Tarifa pagada cuando se completó">
                                ${tarifa.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {turnosType.length > 0 ? (
                              turnosType.map((turno, turnoIndex) => (
                                <div key={`${turno.id}-${formatDateKey(day)}-${tipoTurno}-${turnoIndex}`} className="text-xs flex items-center justify-between bg-gray-50 rounded p-1">
                                  <span 
                                    className="text-gray-800 font-medium truncate flex-1 mr-2"
                                    title={`${turno.trabajador?.nombre || 'Sin nombre'} - ${turno.estado}`}
                                  >
                                    {formatWorkerName(turno.trabajador?.nombre || 'Sin nombre')}
                                  </span>
                                  <span className={`text-sm font-bold flex-shrink-0 ${
                                    turno.estado === 'completado' 
                                      ? 'text-green-600' 
                                      : 'text-blue-600'
                                  }`}>
                                    {turno.estado === 'completado' ? '✓' : '●'}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">Sin asignar</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Botón para agregar turnos - Solo si la semana no está completada */}
                  {!isWeekFullyCompleted() && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateShifts(day)}
                        className="w-full text-xs"
                        title={`Asignar trabajadores para ${formatDate(day)}`}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {totalTurnos > 0 ? 'Editar' : 'Asignar'}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
            </div>
        </CardContent>
      </Card>

      {/* Modal de asignación de turnos */}
      <AddShiftModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedDate={selectedDate}
        workers={activeWorkers}
        existingShifts={turnos}
        onShiftsUpdated={handleShiftsUpdated}
        turnosConfig={turnosConfig}
        validateTurnosRules={validateTurnosRules}
      />

      {/* Modal de copia de turnos */}
      <CopyShiftModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onShiftsUpdated={handleShiftsUpdated}
      />

      {/* Modal de Configuración de Reglas de Turnos */}
      {showConfigModal && (
        <div 
          className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-50 flex items-start justify-center p-4 pt-20"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfigModal(false)
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-900">Configuración de Reglas de Turnos</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfigModal(false)}
                  className="hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-8 overflow-y-auto flex-1">
              {/* Control general de reglas */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Aplicar Reglas de Turnos</h3>
                  <p className="text-sm text-gray-600">Activar/desactivar todas las validaciones de turnos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={turnosConfig.enforceRules}
                    onChange={(e) => saveTurnosConfig({ ...turnosConfig, enforceRules: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {turnosConfig.enforceRules && (
                <>
                  {/* Reglas de solapamiento */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Reglas de Solapamiento de Turnos
                    </h3>
                    <p className="text-sm text-gray-600">Define qué combinaciones de turnos puede tener un trabajador en el mismo día</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">1º + 3º Turno</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={turnosConfig.allowedCombinations['1_3']}
                              onChange={(e) => saveTurnosConfig({ 
                                ...turnosConfig, 
                                allowedCombinations: { ...turnosConfig.allowedCombinations, '1_3': e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          {turnosConfig.allowedCombinations['1_3'] ? 'Permitido' : 'No permitido'}
                        </p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">1º + 2º Turno</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={turnosConfig.allowedCombinations['1_2']}
                              onChange={(e) => saveTurnosConfig({ 
                                ...turnosConfig, 
                                allowedCombinations: { ...turnosConfig.allowedCombinations, '1_2': e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          {turnosConfig.allowedCombinations['1_2'] ? 'Permitido' : 'No permitido'}
                        </p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">2º + 3º Turno</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={turnosConfig.allowedCombinations['2_3']}
                              onChange={(e) => saveTurnosConfig({ 
                                ...turnosConfig, 
                                allowedCombinations: { ...turnosConfig.allowedCombinations, '2_3': e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          {turnosConfig.allowedCombinations['2_3'] ? 'Permitido' : 'No permitido'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reglas de día siguiente */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Reglas de Día Siguiente
                    </h3>
                    <p className="text-sm text-gray-600">Define restricciones para el día siguiente después de ciertos turnos</p>
                    
                    <div className="p-4 border rounded-lg bg-purple-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-purple-900">Aplicar regla de día siguiente</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={turnosConfig.nextDayRules.enforceNextDayRule}
                            onChange={(e) => saveTurnosConfig({ 
                              ...turnosConfig, 
                              nextDayRules: { ...turnosConfig.nextDayRules, enforceNextDayRule: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                      <div className="text-sm text-purple-800 bg-purple-100 p-3 rounded">
                        <strong>Regla:</strong> Si un trabajador hace 3º turno, al día siguiente solo puede hacer 2º turno.
                      </div>
                    </div>
                  </div>

                  {/* Límites por tipo de turno */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Cantidad Máxima por Tipo de Turno
                    </h3>
                    <p className="text-sm text-gray-600">Establece el número máximo de trabajadores por cada tipo de turno</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">1º Turno</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={turnosConfig.shiftLimits.primer_turno}
                          onChange={(e) => saveTurnosConfig({ 
                            ...turnosConfig, 
                            shiftLimits: { ...turnosConfig.shiftLimits, primer_turno: parseInt(e.target.value) || 5 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Máximo trabajadores</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">2º Turno</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={turnosConfig.shiftLimits.segundo_turno}
                          onChange={(e) => saveTurnosConfig({ 
                            ...turnosConfig, 
                            shiftLimits: { ...turnosConfig.shiftLimits, segundo_turno: parseInt(e.target.value) || 5 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Máximo trabajadores</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">3º Turno</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={turnosConfig.shiftLimits.tercer_turno}
                          onChange={(e) => saveTurnosConfig({ 
                            ...turnosConfig, 
                            shiftLimits: { ...turnosConfig.shiftLimits, tercer_turno: parseInt(e.target.value) || 5 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Máximo trabajadores</p>
                      </div>
                    </div>
                  </div>

                  {/* Configuración de alertas */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-yellow-900 flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Mostrar Alertas
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={turnosConfig.showAlerts}
                          onChange={(e) => saveTurnosConfig({ ...turnosConfig, showAlerts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-yellow-800">Mostrar alertas cuando se rompan las reglas de turnos</p>
                  </div>
                </>
              )}
            </div>
            
            {/* Footer con botones */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const defaultConfig = {
                      allowedCombinations: { '1_3': true, '1_2': false, '2_3': false },
                      nextDayRules: { after3rd: ['segundo_turno'], enforceNextDayRule: true },
                      shiftLimits: { primer_turno: 8, segundo_turno: 8, tercer_turno: 8 },
                      enforceRules: true,
                      showAlerts: true
                    }
                    saveTurnosConfig(defaultConfig)
                  }}
                >
                  Restaurar por Defecto
                </Button>
                
                <div className="text-sm text-gray-500 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Los cambios se guardan automáticamente
                </div>
                
                <Button onClick={() => setShowConfigModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  } catch (error) {
    console.error('❌ ERROR CRÍTICO en componente Turnos:', error)
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error en Turnos</h1>
        <p className="text-gray-600 mb-4">Ha ocurrido un error al cargar el componente de turnos.</p>
        <p className="text-sm text-gray-500">Error: {error.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Recargar Página
        </Button>
      </div>
    )
  }
}

export default Turnos
