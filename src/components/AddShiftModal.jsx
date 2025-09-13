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
  onShiftsUpdated 
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
    }
  }, [isOpen, selectedDate, existingShifts])

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

    dateShifts.forEach(shift => {
      if (assignments[shift.turno_tipo] && shift.trabajador?.id) {
        assignments[shift.turno_tipo].push(shift.trabajador.id)
        shiftsData[shift.turno_tipo].push({
          id: shift.id,
          trabajador_id: shift.trabajador.id,
          estado: shift.estado,
          pago: shift.pago || 0
        })
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

  // Manejar selección/deselección de trabajador
  const handleWorkerToggle = (turnoType, workerId) => {
    setShiftAssignments(prev => {
      const currentAssignments = prev[turnoType] || []
      const isSelected = currentAssignments.includes(workerId)
      
      if (isSelected) {
        // Deseleccionar trabajador
        return {
          ...prev,
          [turnoType]: currentAssignments.filter(id => id !== workerId)
        }
      } else {
        // Verificar límite máximo
        if (currentAssignments.length >= MAX_WORKERS_PER_SHIFT) {
          alert(`Máximo ${MAX_WORKERS_PER_SHIFT} trabajadores por turno`)
          return prev
        }
        
        // Verificar si el trabajador ya está asignado en otro turno el mismo día
        const isAssignedInOtherShift = Object.entries(prev).some(([type, assignments]) => 
          type !== turnoType && assignments.includes(workerId)
        )
        
        if (isAssignedInOtherShift) {
          alert('El trabajador ya está asignado en otro turno para esta fecha')
          return prev
        }
        
        // Agregar trabajador
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

  // Verificar si un trabajador está deshabilitado
  const isWorkerDisabled = (turnoType, workerId) => {
    // En modo edición, solo deshabilitar si el trabajador está seleccionado en OTRO turno
    // pero permitir moverlo si ya estaba asignado (para poder editarlo)
    const otherTurnoAssignments = Object.entries(shiftAssignments).filter(([type]) => type !== turnoType)
    
    return otherTurnoAssignments.some(([type, assignments]) => {
      return assignments.includes(workerId)
    })
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

  // Guardar turnos
  const handleSave = async () => {
    if (!selectedDate) return

    // La fecha está validada - se permite editar cualquier fecha

    setSaving(true)
    try {
      const dateKey = formatDateKey(selectedDate)
      console.log(`🔄 Procesando turnos para ${dateKey}`)
      
      // Primero, eliminar turnos existentes para esta fecha
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

      turnoTypes.forEach(turno => {
        const assignments = shiftAssignments[turno.id] || []
        assignments.forEach(workerId => {
          turnosToCreate.push({
            trabajador_id: workerId,
            fecha: dateKey,
            turno_tipo: turno.id,
            estado: 'programado'
          })
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
  <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full h-[95vh] flex flex-col overflow-hidden">
        {/* Header - Fijo */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b">
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Información de edición */}
        {selectedDate && (
          <div className="flex-shrink-0 bg-blue-50 border-l-4 border-blue-400 p-4 mx-6 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Información de Tarifas y Estados
                  </p>
                  <p className="text-sm text-blue-700">
                    • <strong>PROGRAMADO:</strong> Muestra tarifas actuales del sistema<br/>
                    • <strong>COMPLETADO:</strong> Muestra el pago real registrado<br/>
                    • Usa "Eliminar todos" para borrar todos los turnos del día
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllAssignments}
                className="text-red-600 border-red-300 hover:bg-red-50 ml-4"
                title="Eliminar todos los turnos de este día"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar todos
              </Button>
            </div>
          </div>
        )}

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
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {workers.map(worker => {
                      const isSelected = isWorkerSelected(turno.id, worker.id)
                      const isDisabled = isWorkerDisabled(turno.id, worker.id)

                      return (
                        <div
                          key={`${turno.id}-${worker.id}-${selectedDate}`}
                          className={`
                            flex items-center gap-3 p-2 rounded border
                            ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
                            ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          onClick={() => {
                            const isCurrentlySelected = shiftAssignments[turno.id]?.includes(worker.id)
                            // Permitir deseleccionar siempre, solo verificar disabled para seleccionar
                            if (isCurrentlySelected || !isDisabled) {
                              handleWorkerToggle(turno.id, worker.id)
                            }
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled && !isSelected} // Solo deshabilitar si no está seleccionado
                            onChange={() => {
                              // Permitir deseleccionar siempre
                              if (isSelected || !isDisabled) {
                                handleWorkerToggle(turno.id, worker.id)
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {formatWorkerName(worker.nombre)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {worker.rut}
                            </div>
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
                      <div className="space-y-0.5 max-h-16 overflow-y-auto">
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
