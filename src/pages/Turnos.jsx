import React, { useState, useEffect } from 'react'
import { Clock, Plus, Calendar, Calendar as CalendarIcon, Copy, Edit, Trash2, Save, X, Users, Table, Grid, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { createClient } from '@supabase/supabase-js'
import masterDataService from '../services/masterDataService'
import AddShiftModal from '../components/AddShiftModal'
import CopyShiftModal from '../components/CopyShiftModal'

const Turnos = () => {
  // Estados principales
  const [turnos, setTurnos] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [calendarConfig, setCalendarConfig] = useState(null)
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterWorker, setFilterWorker] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Estado para la vista (calendario o tabla)
  const [viewMode, setViewMode] = useState('calendar')

  // Conexión directa a Supabase (siguiendo patrón de Workers.jsx)
  const supabase = createClient(
    'https://csqxopqlgujduhmwxixo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
  )

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadCalendarConfig()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadTurnos(),
        loadWorkers()
      ])
    } catch (error) {
      console.error('Error cargando datos iniciales:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar turnos desde Supabase
  const loadTurnos = async () => {
    try {
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
        .order('fecha', { ascending: false })

      if (error) throw error
      
      console.log('✅ Turnos cargados:', data?.length || 0)
      setTurnos(data || [])
    } catch (error) {
      console.error('❌ Error cargando turnos:', error)
      setTurnos([])
    }
  }

  // Cargar trabajadores desde Supabase
  const loadWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('trabajadores')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre')

      if (error) throw error
      
      console.log('✅ Trabajadores cargados:', data?.length || 0)
      setWorkers(data || [])
    } catch (error) {
      console.error('❌ Error cargando trabajadores:', error)
      setWorkers([])
    }
  }

  // Cargar configuración del calendario
  const loadCalendarConfig = () => {
    const config = masterDataService.getCalendarConfig()
    setCalendarConfig(config)
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

  // Obtener tarifa para un día y turno específico
  const getShiftRate = (date, shiftType) => {
    if (!calendarConfig) return 0
    const dateKey = formatDateKey(date)
    
    // Mapear tipos de turno para cálculo de tarifa
    const shiftNumber = {
      'primer_turno': 1,
      'segundo_turno': 2,
      'tercer_turno': 3
    }[shiftType] || 1
    
    return masterDataService.calculateShiftRate(dateKey, shiftNumber)
  }

  // Alias para compatibilidad con vista de tabla
  const getTarifa = (date, shiftType) => {
    return getShiftRate(date, shiftType)
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

  // Obtener turnos para una fecha específica (con filtros aplicados)
  const getTurnosForDate = (date) => {
    const dateKey = formatDateKey(date)
    const turnosDate = turnos.filter(turno => turno.fecha === dateKey)
    return getFilteredTurnos(turnosDate)
  }

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

  // Agrupar turnos por tipo para una fecha
  const groupTurnosByType = (date) => {
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

  // Calcular estadísticas filtradas
  const getFilteredStats = () => {
    const filteredTurnos = getFilteredTurnos(turnos)
    const weekTurnos = weekDays.reduce((total, day) => total + getTurnosForDate(day).length, 0)
    
    return {
      totalWorkers: workers.length,
      weekTurnos: weekTurnos,
      programados: filteredTurnos.filter(t => t.estado === 'programado').length,
      completados: filteredTurnos.filter(t => t.estado === 'completado').length,
      filteredTotal: filteredTurnos.length
    }
  }

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

  const monday = getMonday(currentWeek)
  const weekDays = getWeekDays(monday)
  const weekRange = `${monday.getDate()} ${monday.toLocaleDateString('es-CL', { month: 'short' })} - ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}`
  const stats = getFilteredStats()

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
          {/* Botones de Vista */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2 rounded-none border-0 px-3 py-2"
              size="sm"
            >
              <Calendar className="h-4 w-4" />
              Calendario
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
              className="flex items-center gap-2 rounded-none border-0 px-3 py-2"
              size="sm"
            >
              <Table className="h-4 w-4" />
              Tabla
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setIsCopyModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar Turnos
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
                {workers.map(worker => (
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
                <p className="text-sm text-gray-600">Turnos Programados</p>
                <p className="text-2xl font-bold">{stats.programados}</p>
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
              <Badge className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Turnos Completados</p>
                <p className="text-2xl font-bold">{stats.completados}</p>
                {(searchTerm || filterWorker !== 'all' || filterStatus !== 'all') && (
                  <p className="text-xs text-gray-500">filtrados</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista Semanal / Tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {viewMode === 'calendar' ? <CalendarIcon className="h-5 w-5" /> : <Table className="h-5 w-5" />}
              {viewMode === 'calendar' ? `Semana: ${weekRange}` : 'Vista de Tabla'}
            </CardTitle>
            {viewMode === 'calendar' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  ← Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                  Hoy
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  Siguiente →
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'calendar' ? (
            // Vista de Calendario
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
                      const tarifa = getShiftRate(day, tipoTurno)
                      
                      return (
                        <div key={tipoTurno} className="bg-white rounded p-2 border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {getTurnoDisplayName(tipoTurno)}
                            </span>
                            <span className="text-xs text-green-600 font-medium">
                              ${tarifa.toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {turnosType.length > 0 ? (
                              turnosType.map(turno => (
                                <div key={turno.id} className="text-xs flex items-center justify-between">
                                  <span 
                                    className="text-gray-800 font-medium"
                                    title={turno.estado === 'programado' ? 'Turno programado' : turno.estado}
                                  >
                                    {formatWorkerName(turno.trabajador?.nombre || 'Sin nombre')}
                                  </span>
                                  {turno.estado === 'programado' ? (
                                    <Check 
                                      className="h-3 w-3 text-green-600 ml-1" 
                                      title="Turno programado"
                                    />
                                  ) : (
                                    <Badge 
                                      className={`ml-1 text-xs ${getStatusBadgeColor(turno.estado)}`}
                                      variant="secondary"
                                    >
                                      {turno.estado}
                                    </Badge>
                                  )}
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

                  {/* Botón para agregar turnos */}
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateShifts(day)}
                      disabled={!isDateEditable(day)}
                      className={`w-full text-xs ${!isDateEditable(day) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={!isDateEditable(day) ? 'No se pueden editar turnos de fechas anteriores a ayer' : `Asignar trabajadores para ${formatDate(day)}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {totalTurnos > 0 ? 'Editar' : 'Asignar'}
                    </Button>
                  </div>
                </div>
              )
            })}
            </div>
          ) : (
            // Vista de Tabla
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trabajador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Turno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarifa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredTurnos().map((turno) => (
                      <tr key={turno.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(new Date(turno.fecha))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatWorkerName(turno.trabajador?.nombre || 'Sin nombre')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">
                            {turno.turno_tipo.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusBadgeColor(turno.estado)} variant="secondary">
                            {turno.estado}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat('es-CL', { 
                            style: 'currency', 
                            currency: 'CLP' 
                          }).format(getTarifa(new Date(turno.fecha), turno.turno_tipo))}
                        </td>
                      </tr>
                    ))}
                    {getFilteredTurnos().length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          No se encontraron turnos con los filtros aplicados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de asignación de turnos */}
      <AddShiftModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedDate={selectedDate}
        workers={workers}
        existingShifts={turnos}
        onShiftsUpdated={loadTurnos}
      />

      {/* Modal de copia de turnos */}
      <CopyShiftModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onShiftsUpdated={loadTurnos}
      />
    </div>
  )
}

export default Turnos
