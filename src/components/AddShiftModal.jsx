import React, { useState, useEffect } from 'react'
import { X, Save, Users, Clock, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import { getSupabaseClient } from '../services/supabaseClient.js'
import masterDataService from '../services/masterDataService'

const AddShiftModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  workers = [], 
  existingShifts = [],
  onShiftsUpdated,
  turnosConfig = {},
  validateTurnosRules = () => ({ isValid: true, violations: [] })
}) => {
  // Estados del modal
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [calendarConfig, setCalendarConfig] = useState(null)
  const [currentRates, setCurrentRates] = useState(null)
  const [existingShiftsData, setExistingShiftsData] = useState({}) // Datos completos de turnos existentes
  
  // Estados para cada turno - trabajadores seleccionados
  const [shiftAssignments, setShiftAssignments] = useState({
    primer_turno: [],
    segundo_turno: [],
    tercer_turno: []
  })
  
  // Estado para alertas de validación
  const [validationAlerts, setValidationAlerts] = useState([])
  
  // 🆕 NUEVO: Estado para warnings específicos por trabajador
  // Estructura: { 'turnoType-workerId': [{ type, message }] }
  const [workerWarnings, setWorkerWarnings] = useState({})
  
  // Estado para todos los turnos (para validaciones de día siguiente)
  const [allTurnos, setAllTurnos] = useState([])

  // Usar cliente singleton de Supabase
  const supabase = getSupabaseClient()

  // Tipos de turno
  const turnoTypes = [
    { id: 'primer_turno', name: '1° Turno', color: 'blue' },
    { id: 'segundo_turno', name: '2° Turno', color: 'green' },
    { id: 'tercer_turno', name: '3° Turno', color: 'orange' }
  ]

  // Configuración máxima de trabajadores por turno
  const MAX_WORKERS_PER_SHIFT = 5

  // Formatear nombre del trabajador (primer nombre + primer apellido)
  const formatWorkerName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'Sin nombre'
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

  // Permitir edición de turnos en cualquier fecha
  const isDateEditable = (date) => {
    return date ? true : false
  }

  useEffect(() => {
    if (isOpen) {
      loadCalendarConfig()
      loadCurrentRates()
      loadExistingAssignments()
      loadAllTurnos() // Cargar todos los turnos para validaciones de día siguiente
    }
  }, [isOpen, selectedDate, existingShifts])

  // 🆕 Limpiar y recalcular warnings cuando cambia la fecha seleccionada
  useEffect(() => {
    if (!selectedDate) return
    
    // Limpiar warnings existentes
    setWorkerWarnings({})
    
    // Recalcular warnings para trabajadores ya asignados
    if (Object.keys(shiftAssignments).length > 0) {
      recalculateAllWarnings()
    }
  }, [selectedDate])

  // Cargar las tarifas actuales desde la base de datos (SOLO LECTURA)
  const loadCurrentRates = async () => {
    try {
      const { data: rates, error } = await supabase
        .from('shift_rates')
        .select('rate_name, rate_value')
      
      if (error) {
        console.error('❌ Error cargando tarifas:', error)
        return
      }

      const ratesMap = {}
      rates.forEach(rate => {
        ratesMap[rate.rate_name] = rate.rate_value
      })
      
      setCurrentRates(ratesMap)
      console.log('✅ Tarifas actuales cargadas (solo lectura):', ratesMap)
    } catch (error) {
      console.error('❌ Error en loadCurrentRates:', error)
    }
  }

  // Cargar configuración del calendario
  const loadCalendarConfig = () => {
    const config = masterDataService.getCalendarConfig()
    setCalendarConfig(config)
  }

  // Validar reglas de turnos cuando cambian las asignaciones
  const validateCurrentAssignments = () => {
    if (!turnosConfig.enforceRules || !turnosConfig.showAlerts) {
      setValidationAlerts([])
      return
    }

    const allAlerts = []

    // Crear turnos simulados para validación
    const simulatedTurnos = []
    Object.entries(shiftAssignments).forEach(([turnoTipo, trabajadores]) => {
      trabajadores.forEach(trabajadorId => {
        const worker = workers.find(w => w.id === trabajadorId)
        if (worker) {
          simulatedTurnos.push({
            fecha: selectedDate.toISOString().split('T')[0],
            turno_tipo: turnoTipo,
            trabajador_id: trabajadorId,
            trabajador: { nombre: worker.nombre }
          })
        }
      })
    })

    // Validar cada trabajador
    Object.entries(shiftAssignments).forEach(([turnoTipo, trabajadores]) => {
      trabajadores.forEach(trabajadorId => {
        const worker = workers.find(w => w.id === trabajadorId)
        if (!worker) return

        const validation = validateTurnosRules(
          trabajadorId,
          selectedDate.toISOString().split('T')[0], 
          turnoTipo, 
          shiftAssignments
        )

        if (!validation.valid) {
          allAlerts.push({
            id: `${trabajadorId}-${turnoTipo}-overlap`,
            type: 'warning',
            message: `${formatWorkerName(worker.nombre)}: ${validation.message}`
          })
        }
      })
    })

    // Validar límites por tipo de turno
    Object.entries(shiftAssignments).forEach(([turnoTipo, trabajadores]) => {
      const limit = turnosConfig.shiftLimits?.[turnoTipo] || 8
      if (trabajadores.length > limit) {
        allAlerts.push({
          id: `limit-${turnoTipo}`,
          type: 'error',
          message: `${turnoTipo.replace('_', ' ').toUpperCase()}: Excede el límite máximo de ${limit} trabajadores (actual: ${trabajadores.length})`
        })
      }
    })

    setValidationAlerts(allAlerts)
  }

  // Ejecutar validación cuando cambien las asignaciones
  useEffect(() => {
    validateCurrentAssignments()
  }, [shiftAssignments, turnosConfig, selectedDate])

  // Cargar todos los turnos para validaciones de día siguiente
  const loadAllTurnos = async () => {
    try {
      const { data: turnos, error } = await supabase
        .from('turnos')
        .select('*')
        .order('fecha', { ascending: false })
      
      if (error) {
        console.error('❌ Error cargando todos los turnos:', error)
        return
      }

      setAllTurnos(turnos)
    } catch (error) {
      console.error('❌ Error en loadAllTurnos:', error)
    }
  }

  // Validar reglas de día siguiente usando datos locales - MODO AVISO (no bloquea)
  const validateNextDayRulesLocal = (workerId, dateKey, shiftType) => {
    if (!turnosConfig.enforceRules || !turnosConfig.nextDayRules.enforceNextDayRule) {
      return { valid: true, warning: false, message: '' }
    }
    
    // Calcular fecha del día anterior
    const currentDate = new Date(dateKey)
    const previousDay = new Date(currentDate)
    previousDay.setDate(currentDate.getDate() - 1)
    const previousDayKey = previousDay.toISOString().split('T')[0]
    
    // Verificar si el trabajador tuvo 3er turno el día anterior
    const had3rdShiftYesterday = allTurnos.some(t => 
      t.trabajador_id === workerId &&
      t.fecha === previousDayKey &&
      t.turno_tipo === 'tercer_turno' &&
      t.estado !== 'cancelado'
    )
    
    if (had3rdShiftYesterday) {
      const allowedNextDay = turnosConfig.nextDayRules.after3rd || ['segundo_turno']
      if (!allowedNextDay.includes(shiftType)) {
        // 🆕 CAMBIO: Ya no bloquea (valid: true), solo advierte
        return {
          valid: true,
          warning: true,
          warningType: 'continuous-shift',
          message: 'Turno continuo / descanso insuficiente (tuvo 3º turno ayer)'
        }
      }
    }
    
    return { valid: true, warning: false, message: '' }
  }

  // Cargar asignaciones existentes y sus datos completos
  const loadExistingAssignments = () => {
    if (!selectedDate || !existingShifts.length) return

    const dateKey = formatDateKey(selectedDate)
    const dateShifts = existingShifts.filter(shift => shift.fecha === dateKey)
    
    const assignments = {
      primer_turno: [],
      segundo_turno: [],
      tercer_turno: []
    }

    const shiftsData = {
      primer_turno: [],
      segundo_turno: [],
      tercer_turno: []
    }

    // Usar Set para prevenir duplicados por trabajador_id y turno_tipo
    const seenWorkerShifts = new Set()

    dateShifts.forEach(shift => {
      if (assignments[shift.turno_tipo] && shift.trabajador?.id) {
        // Crear clave única para trabajador + turno
        const uniqueKey = `${shift.trabajador.id}-${shift.turno_tipo}`
        
        // Solo agregar si no hemos visto esta combinación antes
        if (!seenWorkerShifts.has(uniqueKey)) {
          seenWorkerShifts.add(uniqueKey)
          assignments[shift.turno_tipo].push(shift.trabajador.id)
          shiftsData[shift.turno_tipo].push({
            id: shift.id,
            trabajador_id: shift.trabajador.id,
            estado: shift.estado,
            pago: shift.pago || 0
          })
        }
      }
    })

    setShiftAssignments(assignments)
    setExistingShiftsData(shiftsData)
  }

  // Formatear fecha para comparaciones
  const formatDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Formatear fecha para mostrar
  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('es-CL', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  // Verificar si una fecha es feriado
  const isHoliday = (date) => {
    if (!calendarConfig) return false
    const dateKey = formatDateKey(date)
    return calendarConfig.holidays.includes(dateKey)
  }

  // Calcular tarifa usando el algoritmo optimizado similar a Turnos.jsx
  const calculateShiftRateInMemory = (dateString, shiftType) => {
    if (!currentRates) return 0
    
    const [year, month, day] = dateString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const dayOfWeek = date.getDay()
    const isHolidayDate = calendarConfig?.holidays?.includes(dateString) || false
    
    // Domingo (cualquier turno) = $35,000
    if (dayOfWeek === 0) {
      return currentRates['sunday'] || 35000
    }
    
    // Feriados no domingo (cualquier turno) = $27,500
    if (isHolidayDate) {
      return currentRates['holiday'] || 27500
    }
    
    // Sábado tercer turno = $27,500
    if (dayOfWeek === 6 && shiftType === 'tercer_turno') {
      return currentRates['thirdShiftSaturday'] || 27500
    }
    
    // Día de semana tercer turno = $22,500
    if (shiftType === 'tercer_turno') {
      return currentRates['thirdShiftWeekday'] || 22500
    }
    
    // Todos los demás (primer y segundo turno días de semana/sábado) = $20,000
    return currentRates['firstSecondShift'] || 20000
  }

  // Obtener tarifa para un turno específico (versión actualizada)
  const getShiftRate = (turnoType) => {
    if (!currentRates || !selectedDate) return 0
    
    const dateKey = formatDateKey(selectedDate)
    return calculateShiftRateInMemory(dateKey, turnoType)
  }

  // Manejar selección/deselección de trabajador - MODO AVISO (no bloquea)
  const handleWorkerToggle = (turnoType, workerId) => {
    setShiftAssignments(prev => {
      const currentAssignments = prev[turnoType] || []
      const isSelected = currentAssignments.includes(workerId)
      
      if (isSelected) {
        // Deseleccionar trabajador y limpiar sus warnings
        const warningKey = `${turnoType}-${workerId}`
        setWorkerWarnings(prevWarnings => {
          const newWarnings = { ...prevWarnings }
          delete newWarnings[warningKey]
          return newWarnings
        })
        
        return {
          ...prev,
          [turnoType]: currentAssignments.filter(id => id !== workerId)
        }
      } else {
        // 🆕 PERMITIR ASIGNACIÓN - ya no hay bloqueos, solo warnings
        const warnings = []
        
        // Detectar exceso de límite (ya no bloquea)
        const maxLimit = turnosConfig.shiftLimits?.[turnoType] || MAX_WORKERS_PER_SHIFT
        if (currentAssignments.length >= maxLimit) {
          warnings.push({
            type: 'limit-exceeded',
            message: `Excede el máximo configurado (${maxLimit})`
          })
        }
        
        // Detectar combinación no recomendada (ya no bloquea)
        if (turnosConfig.enforceRules) {
          const isAssignedInOtherShift = Object.entries(prev).some(([type, assignments]) => 
            type !== turnoType && assignments.includes(workerId)
          )
          
          if (isAssignedInOtherShift) {
            const otherType = Object.entries(prev).find(([type, assignments]) => 
              type !== turnoType && assignments.includes(workerId)
            )[0]
            
            const shiftNumbers = {
              'primer_turno': 1,
              'segundo_turno': 2,
              'tercer_turno': 3
            }
            
            const currentShiftNum = shiftNumbers[turnoType]
            const otherShiftNum = shiftNumbers[otherType]
            const combination = `${Math.min(currentShiftNum, otherShiftNum)}_${Math.max(currentShiftNum, otherShiftNum)}`
            
            if (turnosConfig.allowedCombinations[combination] === false) {
              const shiftNames = {
                'primer_turno': '1º',
                'segundo_turno': '2º',
                'tercer_turno': '3º'
              }
              warnings.push({
                type: 'combination-not-recommended',
                message: `Combinación de turnos no recomendada (${shiftNames[otherType]} + ${shiftNames[currentShiftNum]})`
              })
            }
          }
          
          // Detectar turno continuo (ya no bloquea)
          if (turnosConfig.nextDayRules.enforceNextDayRule) {
            const nextDayValidation = validateNextDayRulesLocal(workerId, selectedDate.toISOString().split('T')[0], turnoType)
            if (nextDayValidation.warning) {
              warnings.push({
                type: nextDayValidation.warningType,
                message: nextDayValidation.message
              })
            }
          }
        }
        
        // Guardar warnings para este trabajador
        if (warnings.length > 0) {
          const warningKey = `${turnoType}-${workerId}`
          setWorkerWarnings(prevWarnings => ({
            ...prevWarnings,
            [warningKey]: warnings
          }))
        }
        
        // Agregar trabajador (siempre se permite)
        return {
          ...prev,
          [turnoType]: [...currentAssignments, workerId]
        }
      }
    })
  }

  // Verificar si un trabajador está seleccionado
  const isWorkerSelected = (turnoType, workerId) => {
    return shiftAssignments[turnoType]?.includes(workerId) || false
  }

  // 🆕 NUEVO: Obtener warnings para un trabajador específico (reemplaza isWorkerDisabled)
  const getWorkerWarnings = (turnoType, workerId) => {
    const warningKey = `${turnoType}-${workerId}`
    return workerWarnings[warningKey] || []
  }
  
  // Verificar si un trabajador tiene warnings
  const hasWorkerWarnings = (turnoType, workerId) => {
    const warnings = getWorkerWarnings(turnoType, workerId)
    return warnings.length > 0
  }

  // 🆕 Recalcular todos los warnings para trabajadores ya asignados (cuando cambia fecha)
  const recalculateAllWarnings = () => {
    if (!selectedDate) return
    
    const newWarnings = {}
    const dateKey = selectedDate.toISOString().split('T')[0]
    
    // Recorrer todas las asignaciones actuales
    Object.entries(shiftAssignments).forEach(([turnoType, workerIds]) => {
      workerIds.forEach(workerId => {
        const warnings = []
        
        // Detectar exceso de límite
        const maxLimit = turnosConfig.shiftLimits?.[turnoType] || MAX_WORKERS_PER_SHIFT
        const currentAssignments = shiftAssignments[turnoType] || []
        if (currentAssignments.length > maxLimit) {
          const position = currentAssignments.indexOf(workerId) + 1
          if (position > maxLimit) {
            warnings.push({
              type: 'limit-exceeded',
              message: `Excede el máximo configurado (${maxLimit})`
            })
          }
        }
        
        // Detectar combinación no recomendada
        if (turnosConfig.enforceRules) {
          const isAssignedInOtherShift = Object.entries(shiftAssignments).some(([type, assignments]) => 
            type !== turnoType && assignments.includes(workerId)
          )
          
          if (isAssignedInOtherShift) {
            const otherType = Object.entries(shiftAssignments).find(([type, assignments]) => 
              type !== turnoType && assignments.includes(workerId)
            )[0]
            
            const shiftNumbers = {
              'primer_turno': 1,
              'segundo_turno': 2,
              'tercer_turno': 3
            }
            
            const currentShiftNum = shiftNumbers[turnoType]
            const otherShiftNum = shiftNumbers[otherType]
            const combination = `${Math.min(currentShiftNum, otherShiftNum)}_${Math.max(currentShiftNum, otherShiftNum)}`
            
            if (turnosConfig.allowedCombinations[combination] === false) {
              const shiftNames = {
                'primer_turno': '1º',
                'segundo_turno': '2º',
                'tercer_turno': '3º'
              }
              warnings.push({
                type: 'combination-not-recommended',
                message: `Combinación de turnos no recomendada (${shiftNames[otherType]} + ${shiftNames[turnoType]})`
              })
            }
          }
          
          // Detectar turno continuo - CRÍTICO: usar fecha actual
          if (turnosConfig.nextDayRules.enforceNextDayRule) {
            const nextDayValidation = validateNextDayRulesLocal(workerId, dateKey, turnoType)
            if (nextDayValidation.warning) {
              warnings.push({
                type: nextDayValidation.warningType,
                message: nextDayValidation.message
              })
            }
          }
        }
        
        // Guardar warnings si hay alguno
        if (warnings.length > 0) {
          const warningKey = `${turnoType}-${workerId}`
          newWarnings[warningKey] = warnings
        }
      })
    })
    
    setWorkerWarnings(newWarnings)
  }

  // Obtener trabajador por ID
  const getWorkerById = (workerId) => {
    return workers.find(w => w.id === workerId)
  }

  // Obtener información de un turno específico de un trabajador
  const getWorkerShiftInfo = (turnoType, workerId) => {
    const shiftsForType = existingShiftsData[turnoType] || []
    return shiftsForType.find(shift => shift.trabajador_id === workerId)
  }

  // Obtener el valor a mostrar para un trabajador (tarifa actual o pago real)
  const getDisplayValueForWorker = (turnoType, workerId) => {
    const shiftInfo = getWorkerShiftInfo(turnoType, workerId)
    
    if (shiftInfo && shiftInfo.estado === 'completado' && shiftInfo.pago > 0) {
      // Si está completado y tiene pago, mostrar el pago real
      return shiftInfo.pago
    } else {
      // Si está programado o sin pago, mostrar tarifa actual
      return getShiftRate(turnoType)
    }
  }

  // Obtener el estado de un trabajador en un turno
  const getWorkerShiftStatus = (turnoType, workerId) => {
    const shiftInfo = getWorkerShiftInfo(turnoType, workerId)
    return shiftInfo ? shiftInfo.estado : 'programado'
  }

  // Limpiar todas las asignaciones (eliminar todos los turnos)
  const clearAllAssignments = () => {
    const confirmation = window.confirm(
      `¿Estás seguro de que quieres eliminar TODOS los turnos del ${formatDisplayDate(selectedDate)}?\n\nEsta acción no se puede deshacer.`
    )
    
    if (confirmation) {
      const emptyAssignments = {}
      turnoTypes.forEach(turno => {
        emptyAssignments[turno.id] = []
      })
      setShiftAssignments(emptyAssignments)
      console.log('🗑️ Todas las asignaciones han sido limpiadas')
    }
  }

  // Calcular totales usando valores reales (tarifas actuales o pagos completados)
  const calculateTotals = () => {
    let totalWorkers = 0
    let totalAmount = 0

    turnoTypes.forEach(turno => {
      const assignments = shiftAssignments[turno.id] || []
      totalWorkers += assignments.length
      
      // Sumar el valor real para cada trabajador (tarifa actual o pago completado)
      assignments.forEach(workerId => {
        totalAmount += getDisplayValueForWorker(turno.id, workerId)
      })
    })

    return { totalWorkers, totalAmount }
  }

  // Limpiar duplicados existentes en la base de datos
  const cleanDuplicateShifts = async (dateKey) => {
    try {
      console.log(`🧹 Limpiando duplicados para ${dateKey}`)
      
      // Obtener todos los turnos de la fecha
      const { data: allShifts, error: fetchError } = await supabase
        .from('turnos')
        .select('*')
        .eq('fecha', dateKey)
        .order('created_at', { ascending: true })

      if (fetchError) {
        console.error('❌ Error obteniendo turnos:', fetchError)
        return false
      }

      if (!allShifts || allShifts.length === 0) return true

      // Encontrar duplicados (mismo trabajador_id + turno_tipo + fecha)
      const uniqueShifts = []
      const duplicateIds = []
      const seenCombinations = new Set()

      allShifts.forEach(shift => {
        const uniqueKey = `${shift.trabajador_id}-${shift.turno_tipo}`
        
        if (!seenCombinations.has(uniqueKey)) {
          seenCombinations.add(uniqueKey)
          uniqueShifts.push(shift)
        } else {
          duplicateIds.push(shift.id)
          console.log(`🗑️ Duplicado encontrado: trabajador ${shift.trabajador_id} en ${shift.turno_tipo}`)
        }
      })

      // Eliminar duplicados si los hay
      if (duplicateIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('turnos')
          .delete()
          .in('id', duplicateIds)

        if (deleteError) {
          console.error('❌ Error eliminando duplicados:', deleteError)
          return false
        }

        console.log(`✅ ${duplicateIds.length} duplicados eliminados`)
      }

      return true
    } catch (error) {
      console.error('❌ Error en cleanDuplicateShifts:', error)
      return false
    }
  }

  // Guardar turnos
  const handleSave = async () => {
    if (!selectedDate) return

    // La fecha está validada - se permite editar cualquier fecha

    setSaving(true)
    try {
      const dateKey = formatDateKey(selectedDate)
      console.log(`🔄 Procesando turnos para ${dateKey}`)
      
      // Primero, limpiar duplicados existentes
      const cleanupSuccess = await cleanDuplicateShifts(dateKey)
      if (!cleanupSuccess) {
        throw new Error('Error limpiando duplicados existentes')
      }
      
      // Luego, eliminar turnos existentes para esta fecha
      const { error: deleteError } = await supabase
        .from('turnos')
        .delete()
        .eq('fecha', dateKey)

      if (deleteError) {
        console.error('❌ Error eliminando turnos:', deleteError)
        throw deleteError
      }

      // Crear nuevos turnos
      const turnosToCreate = []
      const seenCombinations = new Set() // Prevenir duplicados

      turnoTypes.forEach(turno => {
        const assignments = shiftAssignments[turno.id] || []
        assignments.forEach(workerId => {
          const uniqueKey = `${workerId}-${turno.id}-${dateKey}`
          
          // Solo agregar si no hemos visto esta combinación
          if (!seenCombinations.has(uniqueKey)) {
            seenCombinations.add(uniqueKey)
            turnosToCreate.push({
              trabajador_id: workerId,
              fecha: dateKey,
              turno_tipo: turno.id,
              estado: 'programado'
            })
          } else {
            console.warn(`⚠️ Duplicado prevenido: ${workerId} en ${turno.id} para ${dateKey}`)
          }
        })
      })

      if (turnosToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('turnos')
          .insert(turnosToCreate)

        if (insertError) {
          console.error('❌ Error insertando turnos:', insertError)
          throw insertError
        }
        console.log(`✅ ${turnosToCreate.length} turnos guardados para ${dateKey}`)
      } else {
        console.log(`🗑️ Todos los turnos eliminados para ${dateKey}`)
      }
      
      // Notificar actualización
      if (onShiftsUpdated) {
        onShiftsUpdated()
      }
      
      onClose()
    } catch (error) {
      console.error('❌ Error guardando turnos:', error)
      alert('Error al guardar los turnos. Por favor, inténtelo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const { totalWorkers, totalAmount } = calculateTotals()
  const isHolidayDate = selectedDate && isHoliday(selectedDate)
  const isSunday = selectedDate && selectedDate.getDay() === 0

  return (
  <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[60] flex items-start justify-center p-4 pt-20">
      <div className="bg-white rounded-lg max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header - Fijo */}
        <div className="flex-shrink-0 border-b">
          {/* Header principal: Título a la izquierda, información a la derecha */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Asignar Turnos
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedDate && formatDisplayDate(selectedDate)}
                  {isHolidayDate && (
                    <Badge className="ml-2 bg-red-100 text-red-800">
                      FERIADO
                    </Badge>
                  )}
                  {isSunday && (
                    <Badge className="ml-2 bg-orange-100 text-orange-800">
                      DOMINGO
                    </Badge>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Información de tarifas y sistema de avisos */}
              {selectedDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-blue-800 mb-1">
                        Información del Sistema
                      </p>
                      <div className="text-blue-700 space-y-0.5">
                        <p>• <strong>PROGRAMADO:</strong> Tarifas del sistema</p>
                        <p>• <strong>COMPLETADO:</strong> Pago real registrado</p>
                        <p>• <strong>Avisos:</strong> Los avisos NO bloquean el guardado</p>
                        <p>• Usa "Eliminar todos" para borrar turnos</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alertas de validación - MODO INFORMATIVO (no bloquea guardado) */}
              {validationAlerts.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 max-w-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium text-orange-800 mb-1">
                        ⚠️ Avisos (no bloquean guardado)
                      </p>
                      <div className="text-orange-700 space-y-0.5">
                        {validationAlerts.slice(0, 3).map(alert => (
                          <p key={alert.id} className="flex items-start gap-1">
                            <span className="font-bold text-orange-600">
                              ⚠️
                            </span>
                            <span className="text-xs">{alert.message}</span>
                          </p>
                        ))}
                        {validationAlerts.length > 3 && (
                          <p className="text-orange-600 font-medium">
                            ...y {validationAlerts.length - 3} avisos más
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón cerrar */}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Barra de separación con botón eliminar */}
          {selectedDate && (
            <div className="bg-gray-50 px-6 py-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllAssignments}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                title="Eliminar todos los turnos de este día"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar todos
              </Button>
            </div>
          )}
        </div>

        {/* Content - Scrolleable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {turnoTypes.map((turno, index) => {
              const assignments = shiftAssignments[turno.id] || []
              const rate = getShiftRate(turno.id)
              // Calcular total real sumando valores individuales
              const turnoTotal = assignments.reduce((sum, workerId) => 
                sum + getDisplayValueForWorker(turno.id, workerId), 0
              )

              return (
                <div key={`${selectedDate}-${turno.id}-${index}`} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${turno.color}-500`}></div>
                      <h4 className="font-semibold text-sm">{turno.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs font-medium text-green-600">
                          ${rate.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">tarifa actual</div>
                      </div>
                      {assignments.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShiftAssignments(prev => ({
                              ...prev,
                              [turno.id]: []
                            }))
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title={`Eliminar todos los trabajadores de ${turno.name}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Asignados:</span>
                      <span className="font-medium">
                        {assignments.length}/{MAX_WORKERS_PER_SHIFT}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium text-green-600">
                        ${turnoTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Lista de trabajadores */}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {workers.map(worker => {
                      const isSelected = isWorkerSelected(turno.id, worker.id)
                      const warnings = getWorkerWarnings(turno.id, worker.id)
                      const hasWarnings = warnings.length > 0
                      
                      // Determinar color de fondo según tipo de warning
                      const getWarningBgColor = () => {
                        if (!hasWarnings) return ''
                        const warningTypes = warnings.map(w => w.type)
                        if (warningTypes.includes('continuous-shift')) return 'bg-red-50 border-red-300'
                        if (warningTypes.includes('combination-not-recommended')) return 'bg-orange-50 border-orange-300'
                        if (warningTypes.includes('limit-exceeded')) return 'bg-yellow-50 border-yellow-300'
                        return 'bg-yellow-50 border-yellow-300'
                      }

                      return (
                        <div
                          key={`${turno.id}-${worker.id}-${selectedDate}`}
                          className={`
                            flex items-center gap-3 p-2 rounded border cursor-pointer
                            ${isSelected && !hasWarnings ? 'bg-blue-50 border-blue-200' : ''}
                            ${isSelected && hasWarnings ? getWarningBgColor() : ''}
                            ${!isSelected ? 'hover:bg-gray-50' : ''}
                          `}
                          onClick={() => handleWorkerToggle(turno.id, worker.id)}
                          title={hasWarnings ? warnings.map(w => w.message).join(' | ') : ''}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleWorkerToggle(turno.id, worker.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {formatWorkerName(worker.nombre)}
                              </div>
                              {hasWarnings && (
                                <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {worker.rut}
                            </div>
                            {/* Mostrar warnings debajo del nombre */}
                            {hasWarnings && (
                              <div className="mt-1 space-y-0.5">
                                {warnings.map((warning, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`text-xs font-medium ${
                                      warning.type === 'continuous-shift' ? 'text-red-600' :
                                      warning.type === 'combination-not-recommended' ? 'text-orange-600' :
                                      warning.type === 'limit-exceeded' ? 'text-yellow-600' :
                                      'text-yellow-600'
                                    }`}
                                  >
                                    ⚠️ {warning.message}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex flex-col items-end">
                              <div className="text-xs font-medium text-green-600">
                                ${getDisplayValueForWorker(turno.id, worker.id).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {getWorkerShiftStatus(turno.id, worker.id) === 'completado' ? 
                                  <Badge className="h-4 text-xs bg-green-100 text-green-800">COMPLETADO</Badge> : 
                                  <Badge className="h-4 text-xs bg-blue-100 text-blue-800">PROGRAMADO</Badge>
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Trabajadores asignados preview */}
                  {assignments.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Asignados ({assignments.length}):
                      </div>
                      <div className="space-y-0.5 max-h-32 overflow-y-auto">
                        {assignments.map((workerId, idx) => {
                          const worker = getWorkerById(workerId)
                          const status = getWorkerShiftStatus(turno.id, workerId)
                          return worker ? (
                            <div key={`${turno.id}-${workerId}-${idx}`} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 truncate">
                                • {formatWorkerName(worker.nombre)}
                              </span>
                              <Badge className={`ml-2 h-4 text-xs ${status === 'completado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {status === 'completado' ? 'COMPLETADO' : 'PROGRAMADO'}
                              </Badge>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Warnings */}
          {workers.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  No hay trabajadores activos disponibles
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fijo */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-t bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-600">Total trabajadores:</span>
              <span className="font-semibold ml-2">{totalWorkers}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Costo total:</span>
              <span className="font-semibold text-green-600 ml-2">
                ${totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Turnos
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddShiftModal
