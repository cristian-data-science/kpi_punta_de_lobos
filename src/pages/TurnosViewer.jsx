import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrabajador } from '@/contexts/TrabajadorContext'
import { getTurnos } from '@/services/supabaseHelpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, Users, CheckCircle2, AlertCircle, RefreshCw, LogOut, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import WeeklySchedule from '@/components/WeeklySchedule/WeeklySchedule'
import {
  getWeekStart,
  getWeekEnd,
  turnosToBlocks,
  goToNextWeek,
  goToPreviousWeek
} from '@/utils/scheduleHelpers'
import './Turnos.css'

const TurnosViewer = () => {
  const { trabajador, isAuthenticated, loading: authLoading, logoutTrabajador } = useTrabajador()
  const navigate = useNavigate()
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [viewMode, setViewMode] = useState('calendar')
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [stats, setStats] = useState({
    turnosHoy: 0,
    turnosActivos: 0,
    completados: 0,
    programados: 0
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/trabajador/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (trabajador) {
      loadTurnos()
    }
  }, [trabajador, currentWeekStart])

  const loadTurnos = async () => {
    if (!trabajador) return

    setLoading(true)
    try {
      // Obtener TODOS los turnos de la semana actual (sin filtrar por persona)
      const weekEnd = getWeekEnd(currentWeekStart)
      const { data, error } = await getTurnos({
        fechaDesde: currentWeekStart,
        fechaHasta: weekEnd
      })

      if (error) {
        setMessage({ type: 'error', text: `Error al cargar turnos: ${error.message}` })
      } else {
        setTurnos(data || [])
        calculateStats(data || [])
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
      turnosActivos: turnosData.filter(t => t.estado === 'en_curso').length,
      completados: turnosData.filter(t => t.estado === 'completado').length,
      programados: turnosData.filter(t => t.estado === 'programado').length
    }
    setStats(newStats)
  }

  // Convertir turnos a bloques para el calendario semanal
  const scheduleBlocks = turnosToBlocks(turnos, currentWeekStart)

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

  const handleLogout = () => {
    logoutTrabajador()
    navigate('/trabajador/login')
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

  // Si está cargando la autenticación, mostrar spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no renderizar nada (el useEffect redirigirá)
  if (!isAuthenticated || !trabajador) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header con información del trabajador */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📅 Calendario de Turnos
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenido, <strong>{trabajador.nombre}</strong>
            </p>
            <p className="text-sm text-gray-500">RUT: {trabajador.rut}</p>
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
            <Button onClick={loadTurnos} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleLogout} variant="outline" className="text-red-600 hover:text-red-700">
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>

        {message && (
          <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.turnosHoy}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.turnosActivos}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completados}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Programados</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.programados}</div>
            </CardContent>
          </Card>
        </div>

        {/* Vista de calendario o lista */}
        {viewMode === 'calendar' ? (
          <Card className="bg-white shadow-lg">
            <CardContent className="p-0">
              <WeeklySchedule
                events={scheduleBlocks}
                weekStart={currentWeekStart}
                onBlockClick={() => {}} // No hacer nada en click (solo lectura)
                onCellClick={() => {}} // No hacer nada en click (solo lectura)
                onNextWeek={handleNextWeek}
                onPreviousWeek={handlePreviousWeek}
                readOnly={true} // Modo solo lectura
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>📋 Lista de Turnos</CardTitle>
              <CardDescription>
                {turnos.length > 0 ? `${turnos.length} turnos esta semana` : 'No hay turnos esta semana'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando turnos...</div>
              ) : turnos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay turnos programados para esta semana.
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
                              <h3 className="font-semibold text-gray-900">
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
                                <span className="font-semibold">{turno.fecha}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{turno.hora_inicio} - {turno.hora_fin}</span>
                              </div>
                              {turno.hora_almuerzo && (
                                <div className="flex items-center gap-2 text-orange-600">
                                  <Clock className="h-4 w-4" />
                                  <span>Almuerzo: {turno.hora_almuerzo}</span>
                                </div>
                              )}
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
                                <div className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                                  <strong>Notas:</strong> {turno.notas}
                                </div>
                              )}
                            </div>
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

        {/* Footer informativo */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Visualizando todos los turnos de la organización.</p>
          <p className="text-xs mt-1">Punta de Lobos © 2025</p>
        </div>
      </div>
    </div>
  )
}

export default TurnosViewer
