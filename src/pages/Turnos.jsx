import { useState, useEffect } from 'react'
import './Turnos.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, Users, CheckCircle2, AlertCircle, Plus, Edit2, Trash2, RefreshCw, X, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import WeeklySchedule from '@/components/WeeklySchedule/WeeklySchedule'
import {
  getTurnos,
  createTurno,
  updateTurno,
  deleteTurno,
  getPersonas
} from '@/services/supabaseHelpers'
import {
  getWeekStart,
  getWeekEnd,
  turnosToBlocks,
  goToNextWeek,
  goToPreviousWeek
} from '@/utils/scheduleHelpers'

const Turnos = () => {
  const [turnos, setTurnos] = useState([])
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTurno, setEditingTurno] = useState(null)
  const [message, setMessage] = useState(null)
  const [viewMode, setViewMode] = useState('calendar')
  const [quickCreateMode, setQuickCreateMode] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [stats, setStats] = useState({
    turnosHoy: 0,
    enCurso: 0,
    completados: 0,
    programados: 0
  })
  const [formData, setFormData] = useState({
    persona_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fin: '17:00',
    hora_almuerzo: '13:00', // DEFAULT: 1 PM (editable)
    tipo_turno: 'completo',
    estado: 'programado',
    puesto: '',
    ubicacion: '',
    notas: ''
  })

  useEffect(() => {
    loadData()
  }, [currentWeekStart])

  const loadData = async () => {
    setLoading(true)
    try {
      // Obtener turnos de la semana actual
      const weekEnd = getWeekEnd(currentWeekStart)
      const [turnosRes, personasRes] = await Promise.all([
        getTurnos({ fechaDesde: currentWeekStart, fechaHasta: weekEnd }),
        getPersonas(1, 100)
      ])

      if (turnosRes.error) {
        setMessage({ type: 'error', text: `Error al cargar turnos: ${turnosRes.error.message}` })
      } else {
        setTurnos(turnosRes.data || [])
        calculateStats(turnosRes.data || [])
      }

      if (personasRes.error) {
        setMessage({ type: 'error', text: `Error al cargar personas: ${personasRes.error.message}` })
      } else {
        setPersonas(personasRes.data || [])
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (turnosData) => {
    const hoy = new Date().toISOString().split('T')[0]
    const newStats = {
      turnosHoy: turnosData.filter(t => t.fecha === hoy).length,
      enCurso: turnosData.filter(t => t.estado === 'en_curso').length,
      completados: turnosData.filter(t => t.estado === 'completado').length,
      programados: turnosData.filter(t => t.estado === 'programado').length
    }
    setStats(newStats)
  }

  // Convertir turnos a bloques para el calendario semanal
  const scheduleBlocks = turnosToBlocks(turnos, currentWeekStart)

  // Manejar click en bloque del calendario (editar)
  const handleBlockClick = (block) => {
    if (block.turnoData) {
      handleEdit(block.turnoData)
    }
  }

  // Manejar click en celda vacía del calendario (crear)
  const handleCellClick = (day, hour) => {
    const clickDate = new Date(currentWeekStart + 'T00:00:00')
    clickDate.setDate(clickDate.getDate() + day)
    const fecha = clickDate.toISOString().split('T')[0]
    const hora_inicio = `${String(hour).padStart(2, '0')}:00`
    const hora_fin = `${String(hour + 1).padStart(2, '0')}:00`
    
    setFormData({
      ...formData,
      fecha,
      hora_inicio,
      hora_fin
    })
    setQuickCreateMode(true)
    setShowModal(true)
  }

  // Navegación semanal
  const handleNextWeek = () => {
    setCurrentWeekStart(goToNextWeek(currentWeekStart))
  }

  const handlePreviousWeek = () => {
    setCurrentWeekStart(goToPreviousWeek(currentWeekStart))
  }

  const handleGoToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Preparar datos: convertir hora_almuerzo vacía a null para BD
      const dataToSend = {
        ...formData,
        hora_almuerzo: formData.hora_almuerzo || null // "" -> null
      }
      
      console.log('📝 Actualizando turno con datos:', dataToSend)
      
      if (editingTurno) {
        const { error } = await updateTurno(editingTurno.id, dataToSend)
        if (error) {
          setMessage({ type: 'error', text: `Error al actualizar: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: '✅ Turno actualizado exitosamente' })
          closeModal()
          loadData()
        }
      } else {
        const { error } = await createTurno(dataToSend)
        if (error) {
          setMessage({ type: 'error', text: `Error al crear: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: '✅ Turno creado exitosamente' })
          closeModal()
          loadData()
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickCreate = async () => {
    if (!formData.persona_id) {
      setMessage({ type: 'error', text: 'Selecciona una persona' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Preparar datos: convertir hora_almuerzo vacía a null
      const dataToSend = {
        ...formData,
        hora_almuerzo: formData.hora_almuerzo || null
      }
      
      const { error } = await createTurno(dataToSend)
      if (error) {
        setMessage({ type: 'error', text: `Error al crear: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: '✅ Turno creado exitosamente' })
        closeModal()
        loadData()
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (turno) => {
    setEditingTurno(turno)
    
    // Normalizar hora_almuerzo: puede venir como "HH:mm:ss" de Postgres, convertir a "HH:mm"
    const horaAlmuerzo = turno.hora_almuerzo 
      ? (turno.hora_almuerzo.length > 5 ? turno.hora_almuerzo.substring(0, 5) : turno.hora_almuerzo)
      : '13:00' // Default si no existe
    
    console.log('📝 Editando turno:', turno, '→ hora_almuerzo normalizada:', horaAlmuerzo)
    
    setFormData({
      persona_id: turno.persona_id || '',
      fecha: turno.fecha || new Date().toISOString().split('T')[0],
      hora_inicio: turno.hora_inicio || '09:00',
      hora_fin: turno.hora_fin || '17:00',
      hora_almuerzo: horaAlmuerzo,
      tipo_turno: turno.tipo_turno || 'completo',
      estado: turno.estado || 'programado',
      puesto: turno.puesto || '',
      ubicacion: turno.ubicacion || '',
      notas: turno.notas || ''
    })
    setQuickCreateMode(false)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este turno? Esta acción no se puede deshacer.')) return

    setLoading(true)
    try {
      const { error } = await deleteTurno(id)
      if (error) {
        setMessage({ type: 'error', text: `Error al eliminar: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: '✅ Turno eliminado exitosamente' })
        closeModal() // Cerrar modal después de eliminar
        loadData()
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTurno(null)
    setQuickCreateMode(false)
    setFormData({
      persona_id: '',
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: '09:00',
      hora_fin: '17:00',
      hora_almuerzo: '13:00', // DEFAULT: 1 PM
      tipo_turno: 'completo',
      estado: 'programado',
      puesto: '',
      ubicacion: '',
      notas: ''
    })
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      programado: { color: 'bg-blue-100 text-blue-700', label: 'Programado' },
      en_curso: { color: 'bg-green-100 text-green-700', label: 'En Curso' },
      completado: { color: 'bg-gray-100 text-gray-700', label: 'Completado' },
      cancelado: { color: 'bg-red-100 text-red-700', label: 'Cancelado' },
      ausente: { color: 'bg-orange-100 text-orange-700', label: 'Ausente' }
    }
    return badges[estado] || badges.programado
  }

  const turnosHoy = turnos.filter(t => t.fecha === new Date().toISOString().split('T')[0])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">⏰ Gestión de Turnos</h1>
          <p className="text-gray-600 mt-1">Visualiza y gestiona turnos del equipo</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGoToToday} variant="outline">
            Hoy
          </Button>
          <Button
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            variant="outline"
          >
            {viewMode === 'calendar' ? <Users className="mr-2 h-4 w-4" /> : <CalendarDays className="mr-2 h-4 w-4" />}
            {viewMode === 'calendar' ? 'Ver Lista' : 'Ver Calendario'}
          </Button>
          <Button onClick={() => {
            setQuickCreateMode(false)
            setShowModal(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Turno
          </Button>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.turnosHoy}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Curso</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enCurso}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Programados</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.programados}</div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'calendar' ? (
        <Card>
          <CardContent className="p-0">
            <WeeklySchedule
              events={scheduleBlocks}
              weekStart={currentWeekStart}
              onBlockClick={handleBlockClick}
              onCellClick={handleCellClick}
              onNextWeek={handleNextWeek}
              onPreviousWeek={handlePreviousWeek}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>📋 Lista de Turnos</CardTitle>
            <CardDescription>
              {turnosHoy.length > 0 ? `${turnosHoy.length} turnos para hoy` : 'No hay turnos para hoy'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando turnos...</div>
            ) : turnos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay turnos registrados. Crea uno nuevo.
              </div>
            ) : (
              <div className="space-y-3">
                {turnos.map(turno => {
                  const badge = getEstadoBadge(turno.estado)
                  return (
                    <div key={turno.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {turno.persona?.nombre || 'Sin asignar'}
                            </h3>
                            <Badge className={badge.color}>
                              {badge.label}
                            </Badge>
                            {turno.tipo_turno && (
                              <Badge variant="outline">
                                {turno.tipo_turno}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{turno.fecha}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{turno.hora_inicio} - {turno.hora_fin}</span>
                            </div>
                            {turno.puesto && (
                              <div className="text-sm">
                                <strong>Puesto:</strong> {turno.puesto}
                              </div>
                            )}
                            {turno.ubicacion && (
                              <div className="text-sm">
                                <strong>Ubicación:</strong> {turno.ubicacion}
                              </div>
                            )}
                            {turno.notas && (
                              <div className="text-sm text-gray-500">
                                {turno.notas}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(turno)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(turno.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {editingTurno ? '✏️ Editar Turno' : quickCreateMode ? '⚡ Crear Turno Rápido' : '➕ Nuevo Turno'}
                </h2>
                <Button variant="ghost" onClick={closeModal}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={quickCreateMode ? (e) => { e.preventDefault(); handleQuickCreate() } : handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="persona_id" className="text-sm font-medium">Persona *</Label>
                  <select
                    id="persona_id"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    value={formData.persona_id}
                    onChange={(e) => setFormData({ ...formData, persona_id: e.target.value })}
                    required
                  >
                    <option value="">Selecciona una persona</option>
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} - {p.tipo}
                      </option>
                    ))}
                  </select>
                </div>

                {!quickCreateMode && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="fecha" className="text-sm font-medium">Fecha</Label>
                        <Input
                          id="fecha"
                          type="date"
                          value={formData.fecha}
                          onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hora_inicio" className="text-sm font-medium">Hora Inicio</Label>
                        <Input
                          id="hora_inicio"
                          type="time"
                          value={formData.hora_inicio}
                          onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hora_fin" className="text-sm font-medium">Hora Fin</Label>
                        <Input
                          id="hora_fin"
                          type="time"
                          value={formData.hora_fin}
                          onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hora_almuerzo" className="text-sm font-medium">Hora Almuerzo (1 hora)</Label>
                        <select
                          id="hora_almuerzo"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          value={formData.hora_almuerzo}
                          onChange={(e) => setFormData({ ...formData, hora_almuerzo: e.target.value })}
                        >
                          <option value="">Sin almuerzo</option>
                          <option value="12:00">12:00 - 13:00</option>
                          <option value="12:30">12:30 - 13:30</option>
                          <option value="13:00">13:00 - 14:00</option>
                          <option value="13:30">13:30 - 14:30</option>
                          <option value="14:00">14:00 - 15:00</option>
                          <option value="14:30">14:30 - 15:30</option>
                          <option value="15:00">15:00 - 16:00</option>
                        </select>
                        <small className="text-xs text-gray-500 mt-1 block">Duración fija: 1 hora. Se dibuja como línea divisoria en el turno.</small>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tipo_turno" className="text-sm font-medium">Tipo de Turno</Label>
                        <select
                          id="tipo_turno"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          value={formData.tipo_turno}
                          onChange={(e) => setFormData({ ...formData, tipo_turno: e.target.value })}
                        >
                          <option value="completo">Completo</option>
                          <option value="medio">Medio Día</option>
                          <option value="parcial">Parcial</option>
                          <option value="nocturno">Nocturno</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="estado" className="text-sm font-medium">Estado</Label>
                        <select
                          id="estado"
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          value={formData.estado}
                          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        >
                          <option value="programado">Programado</option>
                          <option value="en_curso">En Curso</option>
                          <option value="completado">Completado</option>
                          <option value="cancelado">Cancelado</option>
                          <option value="ausente">Ausente</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="puesto" className="text-sm font-medium">Puesto</Label>
                        <Input
                          id="puesto"
                          value={formData.puesto}
                          onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                          placeholder="Ej: Recepción, Instructor, etc."
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ubicacion" className="text-sm font-medium">Ubicación</Label>
                        <Input
                          id="ubicacion"
                          value={formData.ubicacion}
                          onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                          placeholder="Ej: Punta de Lobos"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notas" className="text-sm font-medium">Notas</Label>
                      <textarea
                        id="notas"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        rows="3"
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        placeholder="Notas adicionales..."
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center gap-2 pt-4">
                  {/* Botón de eliminar (solo cuando se está editando) */}
                  {editingTurno && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => handleDelete(editingTurno.id)}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  )}
                  
                  {/* Espaciador para alinear botones a la derecha cuando no hay botón eliminar */}
                  {!editingTurno && <div></div>}
                  
                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={closeModal}>
                      Cancelar
                    </Button>
                    {quickCreateMode && !editingTurno && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuickCreateMode(false)}
                      >
                        Más Opciones
                      </Button>
                    )}
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Guardando...' : editingTurno ? 'Actualizar' : 'Crear Turno'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Turnos
