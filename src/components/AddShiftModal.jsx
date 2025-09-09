import React, { useState, useEffect } from 'react'
import { X, Save, Users, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import { createClient } from '@supabase/supabase-js'
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
  
  // Estados para cada turno - trabajadores seleccionados
  const [shiftAssignments, setShiftAssignments] = useState({
    primer_turno: [],
    segundo_turno: [],
    tercer_turno: []
  })

  // Conexión directa a Supabase
  const supabase = createClient(
    'https://csqxopqlgujduhmwxixo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
  )

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

  // Verificar si la fecha es editable (ayer, hoy o futuro)
  const isDateEditable = (date) => {
    if (!date) return false
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Comparar solo fechas (sin horas)
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const compareYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
    
    return compareDate >= compareYesterday
  }

  useEffect(() => {
    if (isOpen) {
      loadCalendarConfig()
      loadExistingAssignments()
    }
  }, [isOpen, selectedDate, existingShifts])

  // Cargar configuración del calendario
  const loadCalendarConfig = () => {
    const config = masterDataService.getCalendarConfig()
    setCalendarConfig(config)
  }

  // Cargar asignaciones existentes
  const loadExistingAssignments = () => {
    if (!selectedDate || !existingShifts.length) return

    const dateKey = formatDateKey(selectedDate)
    const dateShifts = existingShifts.filter(shift => shift.fecha === dateKey)
    
    const assignments = {
      primer_turno: [],
      segundo_turno: [],
      tercer_turno: []
    }

    dateShifts.forEach(shift => {
      if (assignments[shift.turno_tipo] && shift.trabajador?.id) {
        assignments[shift.turno_tipo].push(shift.trabajador.id)
      }
    })

    setShiftAssignments(assignments)
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

  // Obtener tarifa para un turno específico
  const getShiftRate = (turnoType) => {
    if (!calendarConfig || !selectedDate) return 0
    
    const dateKey = formatDateKey(selectedDate)
    const shiftNumber = {
      'primer_turno': 1,
      'segundo_turno': 2,
      'tercer_turno': 3
    }[turnoType] || 1
    
    return masterDataService.calculateShiftRate(dateKey, shiftNumber)
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
    // Deshabilitado si la fecha no es editable
    if (!isDateEditable(selectedDate)) {
      return true
    }
    
    // Deshabilitado si ya está en otro turno el mismo día
    return Object.entries(shiftAssignments).some(([type, assignments]) => 
      type !== turnoType && assignments.includes(workerId)
    )
  }

  // Obtener trabajador por ID
  const getWorkerById = (workerId) => {
    return workers.find(w => w.id === workerId)
  }

  // Calcular totales
  const calculateTotals = () => {
    let totalWorkers = 0
    let totalAmount = 0

    turnoTypes.forEach(turno => {
      const assignments = shiftAssignments[turno.id] || []
      const rate = getShiftRate(turno.id)
      totalWorkers += assignments.length
      totalAmount += assignments.length * rate
    })

    return { totalWorkers, totalAmount }
  }

  // Guardar turnos
  const handleSave = async () => {
    if (!selectedDate) return

    // Validar que la fecha sea editable
    if (!isDateEditable(selectedDate)) {
      alert('No se pueden editar turnos de fechas anteriores a ayer.')
      return
    }

    setSaving(true)
    try {
      const dateKey = formatDateKey(selectedDate)
      
      // Primero, eliminar turnos existentes para esta fecha
      const { error: deleteError } = await supabase
        .from('turnos')
        .delete()
        .eq('fecha', dateKey)

      if (deleteError) throw deleteError

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

        if (insertError) throw insertError
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
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

        {/* Alertas y restricciones */}
        {selectedDate && !isDateEditable(selectedDate) && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Fecha no editable
                </p>
                <p className="text-sm text-red-700">
                  No se pueden editar turnos de fechas anteriores a ayer.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedDate && isDateEditable(selectedDate) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-6 mt-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Información de edición
                </p>
                <p className="text-sm text-blue-700">
                  Puedes deseleccionar todos los trabajadores para eliminar todos los turnos del día.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {turnoTypes.map(turno => {
              const assignments = shiftAssignments[turno.id] || []
              const rate = getShiftRate(turno.id)
              const turnoTotal = assignments.length * rate

              return (
                <div key={turno.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${turno.color}-500`}></div>
                      <h4 className="font-semibold">{turno.name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        ${rate.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">por trabajador</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Asignados:</span>
                      <span className="font-medium">
                        {assignments.length}/{MAX_WORKERS_PER_SHIFT}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium text-green-600">
                        ${turnoTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Lista de trabajadores */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {workers.map(worker => {
                      const isSelected = isWorkerSelected(turno.id, worker.id)
                      const isDisabled = isWorkerDisabled(turno.id, worker.id)

                      return (
                        <div
                          key={worker.id}
                          className={`
                            flex items-center gap-3 p-2 rounded border
                            ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          onClick={() => !isDisabled && handleWorkerToggle(turno.id, worker.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => handleWorkerToggle(turno.id, worker.id)}
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
                            <div className="text-xs text-green-600 font-medium">
                              ${rate.toLocaleString()}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Trabajadores asignados preview */}
                  {assignments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Asignados ({assignments.length}):
                      </div>
                      <div className="space-y-1">
                        {assignments.map(workerId => {
                          const worker = getWorkerById(workerId)
                          return worker ? (
                            <div key={workerId} className="text-xs text-gray-600">
                              • {formatWorkerName(worker.nombre)}
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
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">
                  No hay trabajadores activos disponibles
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-4">
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
              disabled={saving || !isDateEditable(selectedDate)}
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
