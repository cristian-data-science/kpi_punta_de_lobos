import React, { useState } from 'react'
import { Copy, Calendar, X, ArrowRight, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { createClient } from '@supabase/supabase-js'

const CopyShiftModal = ({ 
  isOpen, 
  onClose, 
  onShiftsUpdated 
}) => {
  const [sourceWeekStart, setSourceWeekStart] = useState('')
  const [targetWeekStart, setTargetWeekStart] = useState('')
  const [copying, setCopying] = useState(false)
  const [previewData, setPreviewData] = useState(null)

  // Conexión directa a Supabase
  const supabase = createClient(
    'https://csqxopqlgujduhmwxixo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
  )

  // Obtener el lunes de la semana de una fecha
  const getWeekStart = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que el lunes sea día 1
    const monday = new Date(date.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  // Obtener todos los días de una semana (lunes a domingo)
  const getWeekDays = (mondayDateString) => {
    if (!mondayDateString) return []
    const monday = new Date(mondayDateString)
    const days = []
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push(day.toISOString().split('T')[0])
    }
    
    return days
  }

  // Formatear rango de semana para mostrar
  const formatWeekRange = (mondayDateString) => {
    if (!mondayDateString) return ''
    const monday = new Date(mondayDateString)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    return `${monday.getDate()} ${monday.toLocaleDateString('es-CL', { month: 'short' })} - ${sunday.getDate()} ${sunday.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}`
  }

  // Formatear nombre del trabajador
  const formatWorkerName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'Sin nombre'
    const parts = fullName.trim().split(' ')
    if (parts.length <= 2) return fullName
    return `${parts[0]} ${parts[1]}`
  }

  // Obtener vista previa de turnos de la semana origen
  const loadPreview = async () => {
    if (!sourceWeekStart) {
      setPreviewData(null)
      return
    }

    try {
      // Obtener todos los días de la semana
      const weekDays = getWeekDays(sourceWeekStart)
      
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
        .in('fecha', weekDays)
        .order('fecha')
        .order('turno_tipo')

      if (error) throw error

      // Agrupar por día y tipo de turno
      const groupedByDay = {}
      let totalShifts = 0

      weekDays.forEach(day => {
        groupedByDay[day] = {
          primer_turno: [],
          segundo_turno: [],
          tercer_turno: []
        }
      })

      data.forEach(turno => {
        if (groupedByDay[turno.fecha] && groupedByDay[turno.fecha][turno.turno_tipo]) {
          groupedByDay[turno.fecha][turno.turno_tipo].push(turno)
          totalShifts++
        }
      })

      setPreviewData({
        weekDays,
        shifts: groupedByDay,
        totalShifts
      })

    } catch (error) {
      console.error('Error cargando vista previa:', error)
      setPreviewData(null)
    }
  }

  // Verificar conflictos en semana destino
  const checkConflicts = async () => {
    if (!targetWeekStart) return null

    try {
      const weekDays = getWeekDays(targetWeekStart)
      
      const { data, error } = await supabase
        .from('turnos')
        .select('id, fecha, turno_tipo')
        .in('fecha', weekDays)

      if (error) throw error
      return data.length
    } catch (error) {
      console.error('Error verificando conflictos:', error)
      return null
    }
  }

  // Copiar turnos de semana completa
  const handleCopy = async () => {
    if (!sourceWeekStart || !targetWeekStart || !previewData) return

    setCopying(true)
    try {
      // Verificar conflictos
      const existingShifts = await checkConflicts()
      
      if (existingShifts > 0) {
        const sourceRange = formatWeekRange(sourceWeekStart)
        const targetRange = formatWeekRange(targetWeekStart)
        
        const confirm = window.confirm(
          `La semana destino (${targetRange}) ya tiene ${existingShifts} turnos asignados. ¿Desea reemplazarlos?`
        )
        if (!confirm) {
          setCopying(false)
          return
        }

        // Eliminar turnos existentes de toda la semana destino
        const targetWeekDays = getWeekDays(targetWeekStart)
        const { error: deleteError } = await supabase
          .from('turnos')
          .delete()
          .in('fecha', targetWeekDays)

        if (deleteError) throw deleteError
      }

      // Crear turnos copiados para toda la semana
      const sourceWeekDays = getWeekDays(sourceWeekStart)
      const targetWeekDays = getWeekDays(targetWeekStart)
      const turnosToCreate = []

      sourceWeekDays.forEach((sourceDay, dayIndex) => {
        const targetDay = targetWeekDays[dayIndex]
        const dayShifts = previewData.shifts[sourceDay]
        
        if (dayShifts) {
          Object.entries(dayShifts).forEach(([turnoTipo, turnos]) => {
            turnos.forEach(turno => {
              turnosToCreate.push({
                trabajador_id: turno.trabajador_id,
                fecha: targetDay,
                turno_tipo: turnoTipo,
                estado: 'programado'
              })
            })
          })
        }
      })

      if (turnosToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('turnos')
          .insert(turnosToCreate)

        if (insertError) throw insertError
      }

      const sourceRange = formatWeekRange(sourceWeekStart)
      const targetRange = formatWeekRange(targetWeekStart)
      console.log(`✅ ${turnosToCreate.length} turnos copiados de semana ${sourceRange} a ${targetRange}`)
      
      // Notificar actualización
      if (onShiftsUpdated) {
        onShiftsUpdated()
      }
      
      alert(`Turnos copiados exitosamente`)
      onClose()

    } catch (error) {
      console.error('❌ Error copiando turnos:', error)
      alert('Error al copiar los turnos. Por favor, inténtelo de nuevo.')
    } finally {
      setCopying(false)
    }
  }

  // Cargar vista previa cuando cambia fecha origen
  React.useEffect(() => {
    loadPreview()
  }, [sourceWeekStart])

  // Limpiar cuando se cierra el modal
  React.useEffect(() => {
    if (!isOpen) {
      setSourceWeekStart('')
      setTargetWeekStart('')
      setPreviewData(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const getTurnoDisplayName = (turnoTipo) => {
    const names = {
      'primer_turno': '1° Turno',
      'segundo_turno': '2° Turno', 
      'tercer_turno': '3° Turno'
    }
    return names[turnoTipo] || turnoTipo
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Copy className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Copiar Semana de Turnos
              </h3>
              <p className="text-sm text-gray-600">
                Duplicar una semana completa de turnos a otra semana
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Información */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Copia Semanal de Turnos
                </p>
                <p className="text-sm text-blue-700">
                  Selecciona cualquier día de cada semana. Se copiarán todos los turnos de lunes a domingo.
                </p>
              </div>
            </div>
          </div>

          {/* Selección de semanas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="sourceWeek">Semana Origen</Label>
              <Input
                id="sourceWeek"
                type="date"
                value={sourceWeekStart}
                onChange={(e) => {
                  const weekStart = getWeekStart(e.target.value)
                  setSourceWeekStart(weekStart)
                }}
                className="w-full"
              />
              {sourceWeekStart && (
                <div className="text-sm space-y-1">
                  <p className="text-gray-600">
                    <strong>Semana:</strong> {formatWeekRange(sourceWeekStart)}
                  </p>
                  {previewData && (
                    <p className="text-green-600">
                      <strong>Turnos encontrados:</strong> {previewData.totalShifts}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetWeek">Semana Destino</Label>
              <Input
                id="targetWeek"
                type="date"
                value={targetWeekStart}
                onChange={(e) => {
                  const weekStart = getWeekStart(e.target.value)
                  setTargetWeekStart(weekStart)
                }}
                className="w-full"
              />
              {targetWeekStart && (
                <div className="text-sm space-y-1">
                  <p className="text-gray-600">
                    <strong>Semana:</strong> {formatWeekRange(targetWeekStart)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Flecha visual */}
          {sourceWeekStart && targetWeekStart && (
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-1" />
                  <div className="text-sm font-medium">{formatWeekRange(sourceWeekStart)}</div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400" />
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-1" />
                  <div className="text-sm font-medium">{formatWeekRange(targetWeekStart)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Vista previa */}
          {previewData && previewData.totalShifts > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Vista Previa - {previewData.totalShifts} turnos a copiar
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-2">
                {previewData.weekDays.map((day, index) => {
                  const dayShifts = previewData.shifts[day]
                  const dayName = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]
                  const dayNumber = new Date(day).getDate()
                  
                  const totalDayShifts = Object.values(dayShifts).reduce((sum, shifts) => sum + shifts.length, 0)
                  
                  return (
                    <div key={day} className="bg-white rounded p-2 border border-gray-200">
                      <div className="text-center mb-2">
                        <div className="text-xs font-medium text-gray-600">{dayName}</div>
                        <div className="text-sm font-semibold">{dayNumber}</div>
                        <Badge variant="outline" className="text-xs">
                          {totalDayShifts} turnos
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        {Object.entries(dayShifts).map(([turnoTipo, turnos]) => {
                          if (turnos.length === 0) return null
                          
                          return (
                            <div key={turnoTipo} className="text-xs">
                              <div className="font-medium text-gray-700 mb-0.5">
                                {getTurnoDisplayName(turnoTipo)}
                              </div>
                              {turnos.map(turno => (
                                <div key={turno.id} className="text-gray-600 truncate">
                                  • {formatWorkerName(turno.trabajador?.nombre || 'Sin nombre')}
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mensaje si no hay datos */}
          {sourceWeekStart && previewData && previewData.totalShifts === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No hay turnos asignados en la semana seleccionada
              </p>
            </div>
          )}

          {/* Advertencias */}
          {sourceWeekStart && targetWeekStart && sourceWeekStart === targetWeekStart && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                ⚠️ La semana origen y destino son iguales
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={copying}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCopy} 
            disabled={copying || !sourceWeekStart || !targetWeekStart || !previewData || previewData.totalShifts === 0 || sourceWeekStart === targetWeekStart}
            className="flex items-center gap-2"
          >
            {copying ? (
              <>
                <Copy className="h-4 w-4 animate-pulse" />
                Copiando...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Turnos
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CopyShiftModal
