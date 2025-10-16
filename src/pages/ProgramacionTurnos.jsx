import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, Clock, Users, CheckCircle2, AlertCircle, Plus, RefreshCw, 
  Settings, TrendingUp, DollarSign, CalendarDays, UserCheck, XCircle,
  Zap, Target, Activity, MapPin 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import WeeklySchedule from '@/components/WeeklySchedule/WeeklySchedule'
import {
  getTurnosV2,
  asignarPersonaTurno,
  desasignarPersonaTurno,
  calcularEstadisticasMes,
  formatMonto
} from '@/services/turnosV2Helpers'
import { getPersonas } from '@/services/supabaseHelpers'
import {
  getWeekStart,
  goToNextWeek,
  goToPreviousWeek
} from '@/utils/scheduleHelpers'

const ProgramacionTurnos = () => {
  // Estados principales
  const [turnos, setTurnos] = useState([])
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  
  // Estados de configuración
  const [temporada, setTemporada] = useState('baja') // baja | alta
  const [horario, setHorario] = useState('invierno') // invierno | verano
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1)
  const [anioActual, setAnioActual] = useState(new Date().getFullYear())
  const [vistaCalendario, setVistaCalendario] = useState('mensual') // semanal | bisemanal | mensual | bimensual
  
  // Estados del calendario
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [showModal, setShowModal] = useState(false)
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null)
  
  // Estados del modal de programación masiva
  const [showProgramacionModal, setShowProgramacionModal] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [asignacionesMockup, setAsignacionesMockup] = useState({})

  // Calcular el inicio del período según la vista (DESPUÉS de currentWeekStart)
  const currentPeriodStart = useMemo(() => {
    if (!currentWeekStart) return null
    
    const baseDate = new Date(currentWeekStart)
    
    switch (vistaCalendario) {
      case 'semanal':
        return currentWeekStart // Una semana normal
      
      case 'bisemanal':
        return currentWeekStart // 2 semanas empezando desde la semana actual
      
      case 'mensual': {
        // Empezar desde la primera semana del mes
        const year = baseDate.getFullYear()
        const month = baseDate.getMonth()
        const firstDayOfMonth = new Date(year, month, 1)
        // Encontrar el lunes más cercano anterior o igual al 1ro del mes
        const dayOfWeek = firstDayOfMonth.getDay()
        const daysToSubtract = (dayOfWeek === 0) ? 6 : dayOfWeek - 1
        const firstMonday = new Date(firstDayOfMonth)
        firstMonday.setDate(firstDayOfMonth.getDate() - daysToSubtract)
        return firstMonday.toISOString().split('T')[0]
      }
      
      case 'bimensual': {
        // Similar a mensual pero para 2 meses
        const yearBi = baseDate.getFullYear()
        const monthBi = baseDate.getMonth()
        const firstDayBi = new Date(yearBi, monthBi, 1)
        const dayOfWeekBi = firstDayBi.getDay()
        const daysToSubtractBi = (dayOfWeekBi === 0) ? 6 : dayOfWeekBi - 1
        const firstMondayBi = new Date(firstDayBi)
        firstMondayBi.setDate(firstDayBi.getDate() - daysToSubtractBi)
        return firstMondayBi.toISOString().split('T')[0]
      }
      
      default:
        return currentWeekStart
    }
  }, [currentWeekStart, vistaCalendario])

  // Calcular número de días según la vista
  const daysToShow = useMemo(() => {
    const daysMap = {
      'semanal': 7,
      'bisemanal': 14,
      'mensual': 28,
      'bimensual': 56
    }
    return daysMap[vistaCalendario] || 7
  }, [vistaCalendario])
  
  // Estados de estadísticas
  const [estadisticas, setEstadisticas] = useState(null)

  // Función para calcular semana del ciclo (1-4) basada en la fecha
  // Si un mes tiene 5 semanas, la semana 5 usa plantillas de semana 1
  const calcularSemanaCiclo = (fecha) => {
    const mesInicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
    const diasDesdeInicio = Math.floor((fecha - mesInicio) / (1000 * 60 * 60 * 24))
    const semanaDelMes = Math.floor(diasDesdeInicio / 7) + 1
    
    // Ciclo de 4 semanas: semana 5 = semana 1, semana 6 = semana 2, etc.
    const semanaCiclo = ((semanaDelMes - 1) % 4) + 1
    
    console.log(`📅 Fecha: ${fecha.toLocaleDateString()}, Semana del mes: ${semanaDelMes}, Semana del ciclo: ${semanaCiclo}`)
    return semanaCiclo
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temporada, horario, mesActual, anioActual, vistaCalendario])

  // Recargar turnos cuando cambie la semana
  useEffect(() => {
    if (turnos.length > 0 || !loading) {
      loadTurnos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart])

  const loadData = async () => {
    setLoading(true)
    try {
      // Cargar personas activas
      const personasRes = await getPersonas(1, 100)

      if (personasRes.error) {
        setMessage({ type: 'error', text: `Error al cargar personas: ${personasRes.error.message}` })
      } else {
        setPersonas(personasRes.data.filter(p => p.estado === 'activo') || [])
      }

      // Cargar turnos según filtros
      await loadTurnos()
      await loadEstadisticas()
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const loadTurnos = async () => {
    try {
      let semanasACargar = []
      
      // Determinar qué semanas cargar según la vista
      if (vistaCalendario === 'semanal') {
        // Solo la semana actual del ciclo
        const semanaDelCiclo = calcularSemanaCiclo(new Date(currentWeekStart))
        semanasACargar = [semanaDelCiclo]
      } else if (vistaCalendario === 'bisemanal') {
        // Semana actual y siguiente del ciclo
        const semanaActual = calcularSemanaCiclo(new Date(currentWeekStart))
        const semanaSiguiente = (semanaActual % 4) + 1
        semanasACargar = [semanaActual, semanaSiguiente]
      } else if (vistaCalendario === 'mensual') {
        // Todas las 4 semanas del ciclo
        semanasACargar = [1, 2, 3, 4]
      } else if (vistaCalendario === 'bimensual') {
        // Todas las 4 semanas del ciclo (igual que mensual para efectos de plantillas)
        semanasACargar = [1, 2, 3, 4]
      }

      // Cargar turnos para todas las semanas necesarias
      const allTurnos = []
      
      for (const semana of semanasACargar) {
        const { data, error } = await getTurnosV2({
          temporada,
          horario,
          semana_ciclo: semana,
          es_activo: true
        })

        if (error) {
          console.error(`Error cargando semana ${semana}:`, error)
        } else {
          allTurnos.push(...(data || []))
        }
      }

      setTurnos(allTurnos)
      
    } catch (error) {
      console.error('Error cargando turnos:', error)
      setMessage({ type: 'error', text: `Error cargando turnos: ${error.message}` })
    }
  }

  const loadEstadisticas = async () => {
    try {
      const { data, error } = await calcularEstadisticasMes(mesActual, anioActual)
      
      if (error) {
        console.warn('Error al calcular estadísticas:', error)
      } else {
        setEstadisticas(data)
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  // Convertir turnos a bloques para el calendario
  const convertirTurnosABloques = () => {
    const bloques = []
    
    // Determinar cuántas semanas necesitamos generar según la vista
    let semanasAGenerar = 1
    if (vistaCalendario === 'bisemanal') {
      semanasAGenerar = 2
    } else if (vistaCalendario === 'mensual') {
      semanasAGenerar = 4
    } else if (vistaCalendario === 'bimensual') {
      semanasAGenerar = 8
    }
    
    // Generar bloques para cada semana
    for (let semanaIndex = 0; semanaIndex < semanasAGenerar; semanaIndex++) {
      turnos.forEach(turno => {
        // Validar que el turno tiene los campos necesarios
        if (!turno.dia_semana || !turno.hora_inicio || !turno.hora_fin) {
          console.warn('⚠️ Turno incompleto:', turno)
          return
        }

        // Mapeo de días de semana a números (0 = domingo, 1 = lunes, etc.)
        const diasMap = {
          'domingo': 0,
          'lunes': 1,
          'martes': 2,
          'miercoles': 3,
          'jueves': 4,
          'viernes': 5,
          'sabado': 6
        }
        
        const diaEnSemana = diasMap[turno.dia_semana]
        // Calcular el día absoluto considerando la semana
        const diaAbsoluto = (semanaIndex * 7) + diaEnSemana
        
        // Determinar color según estado
        let color = '#94a3b8' // gris por defecto (disponible)
        if (turno.estado === 'asignado') {
          color = '#3b82f6' // azul
        } else if (turno.estado === 'completado') {
          color = '#22c55e' // verde
        } else if (turno.estado === 'cancelado') {
          color = '#ef4444' // rojo
        }

        const bloque = {
          id: `${turno.id}-sem${semanaIndex}`,
          day: diaAbsoluto,
          start: turno.hora_inicio,
          end: turno.hora_fin,
          label: turno.codigo_turno || 'Turno',
          type: turno.puesto || 'turno',
          person: turno.persona?.nombre || '',
          color: color,
          data: { ...turno, semanaIndex }
        }

        bloques.push(bloque)
      })
    }
    
    return bloques
  }

  const handleBlockClick = (block) => {
    if (block.turnoData) {
      setTurnoSeleccionado(block.turnoData)
      setShowModal(true)
    }
  }

  const handleAsignarTurno = async (personaId) => {
    if (!turnoSeleccionado) return

    setLoading(true)
    setMessage(null)

    try {
      // Generar fecha del turno (primer día del tipo en el mes seleccionado)
      const fecha = `${anioActual}-${String(mesActual).padStart(2, '0')}-01`
      
      const { error } = await asignarPersonaTurno(
        turnoSeleccionado.id,
        personaId,
        fecha,
        mesActual,
        anioActual
      )

      if (error) {
        setMessage({ type: 'error', text: `Error al asignar: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: '✅ Turno asignado exitosamente' })
        setShowModal(false)
        setTurnoSeleccionado(null)
        await loadData()
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleDesasignarTurno = async () => {
    if (!turnoSeleccionado) return

    if (!confirm('¿Deseas desasignar esta persona del turno?')) return

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await desasignarPersonaTurno(turnoSeleccionado.id)

      if (error) {
        setMessage({ type: 'error', text: `Error al desasignar: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: '✅ Persona desasignada exitosamente' })
        setShowModal(false)
        setTurnoSeleccionado(null)
        await loadData()
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(goToNextWeek(currentWeekStart))
  }

  const handlePreviousWeek = () => {
    setCurrentWeekStart(goToPreviousWeek(currentWeekStart))
  }

  const handleGoToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  // Funciones del mockup de programación masiva
  const tiposTurno = ['GP1', 'GP2', 'GP3', 'GP4', 'Voluntario']
  
  const personasMockup = personas.length > 0 ? personas : [
    { id: 1, nombre: 'Carlos Mendoza', tipo: 'staff', rut: '12.345.678-9' },
    { id: 2, nombre: 'María Silva', tipo: 'guia', rut: '23.456.789-0' },
    { id: 3, nombre: 'Pedro González', tipo: 'instructor', rut: '34.567.890-1' },
    { id: 4, nombre: 'Ana Torres', tipo: 'voluntario', rut: '45.678.901-2' },
    { id: 5, nombre: 'Luis Ramírez', tipo: 'staff', rut: '56.789.012-3' }
  ]

  const calcularEstadisticasRango = () => {
    if (!fechaInicio || !fechaFin) return null

    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1
    
    let diasSemana = 0
    let diasFinSemana = 0
    
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay()
      if (diaSemana === 0 || diaSemana === 6) {
        diasFinSemana++
      } else {
        diasSemana++
      }
    }

    const turnosAsignados = Object.keys(asignacionesMockup).length
    const personasAsignadas = new Set(Object.values(asignacionesMockup)).size
    const turnosSinAsignar = tiposTurno.length - turnosAsignados
    
    // Simular cobertura necesaria (3 turnos por día)
    const coberturaRequerida = diasTotales * 3 // 3 turnos por día
    const coberturaPendiente = Math.max(0, coberturaRequerida - turnosAsignados)
    
    return {
      diasTotales,
      diasSemana,
      diasFinSemana,
      turnosAsignados,
      turnosSinAsignar,
      personasAsignadas,
      coberturaRequerida,
      coberturaPendiente,
      porcentajeCobertura: coberturaRequerida > 0 ? (turnosAsignados / coberturaRequerida * 100).toFixed(1) : 0
    }
  }

  const handleAsignarTipoTurno = (tipoTurno, personaId) => {
    console.log('Asignando:', tipoTurno, 'a persona:', personaId)
    // Solo permitir una persona por tipo de turno
    if (personaId && isPersonaDisponible(personaId)) {
      setAsignacionesMockup(prev => {
        const newAssignments = { ...prev, [tipoTurno]: personaId }
        console.log('Nuevas asignaciones:', newAssignments)
        return newAssignments
      })
    }
  }

  const handleRemoverAsignacion = (tipoTurno) => {
    console.log('Removiendo asignación de:', tipoTurno)
    setAsignacionesMockup(prev => {
      const newAssignments = { ...prev }
      delete newAssignments[tipoTurno]
      console.log('Asignaciones después de remover:', newAssignments)
      return newAssignments
    })
  }

  // Obtener personas ya asignadas
  const getPersonasAsignadas = () => {
    return new Set(Object.values(asignacionesMockup))
  }

  // Verificar si una persona está disponible
  const isPersonaDisponible = (personaId) => {
    return !getPersonasAsignadas().has(personaId)
  }

  const inicializarFechas = () => {
    const hoy = new Date()
    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1) // Lunes de esta semana
    
    const finSemana = new Date(inicioSemana)
    finSemana.setDate(inicioSemana.getDate() + 6) // Domingo de esta semana
    
    setFechaInicio(inicioSemana.toISOString().split('T')[0])
    setFechaFin(finSemana.toISOString().split('T')[0])
  }

  const abrirModalProgramacion = () => {
    inicializarFechas()
    setAsignacionesMockup({})
    setShowProgramacionModal(true)
  }

  const scheduleBlocks = convertirTurnosABloques()

  // Calcular estadísticas rápidas
  const turnosAsignados = turnos.filter(t => t.estado === 'asignado' || t.estado === 'completado').length
  const turnosDisponibles = turnos.filter(t => t.estado === 'disponible').length
  const personasAsignadas = new Set(turnos.filter(t => t.persona_id).map(t => t.persona_id)).size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📅 Programación de Turnos</h1>
          <p className="text-gray-600 mt-1">Asigna guardas a turnos mensuales</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={abrirModalProgramacion}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Zap className="mr-2 h-4 w-4" />
            Programar Turnos
          </Button>
          <Button onClick={handleGoToToday} variant="outline">
            Hoy
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

      {/* Filtros de configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del Escenario
          </CardTitle>
          <CardDescription>
            Selecciona temporada, horario, mes y vista del calendario para programar turnos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Temporada</Label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={temporada}
                onChange={(e) => setTemporada(e.target.value)}
              >
                <option value="baja">Temporada Baja</option>
                <option value="alta">Temporada Alta</option>
              </select>
            </div>
            <div>
              <Label>Horario</Label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              >
                <option value="invierno">Horario Invierno</option>
                <option value="verano">Horario Verano</option>
              </select>
            </div>
            <div>
              <Label>Mes</Label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={mesActual}
                onChange={(e) => setMesActual(parseInt(e.target.value))}
              >
                <option value={1}>Enero</option>
                <option value={2}>Febrero</option>
                <option value={3}>Marzo</option>
                <option value={4}>Abril</option>
                <option value={5}>Mayo</option>
                <option value={6}>Junio</option>
                <option value={7}>Julio</option>
                <option value={8}>Agosto</option>
                <option value={9}>Septiembre</option>
                <option value={10}>Octubre</option>
                <option value={11}>Noviembre</option>
                <option value={12}>Diciembre</option>
              </select>
            </div>
            <div>
              <Label>Año</Label>
              <Input
                type="number"
                value={anioActual}
                onChange={(e) => setAnioActual(parseInt(e.target.value))}
                min="2024"
                max="2030"
              />
            </div>
            <div>
              <Label>Vista Calendario</Label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={vistaCalendario}
                onChange={(e) => setVistaCalendario(e.target.value)}
              >
                <option value="semanal">📅 Semanal (1 semana)</option>
                <option value="bisemanal">📅 Bi-semanal (2 semanas)</option>
                <option value="mensual">📅 Mensual (4 semanas)</option>
                <option value="bimensual">📅 Bi-mensual (8 semanas)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-blue-700 bg-blue-50">
              {temporada === 'baja' ? '❄️ Temporada Baja' : '☀️ Temporada Alta'}
            </Badge>
            <Badge variant="outline" className="text-teal-700 bg-teal-50">
              {horario === 'invierno' ? '🌙 Horario Invierno' : '🌞 Horario Verano'}
            </Badge>
            <Badge variant="outline" className="text-purple-700 bg-purple-50">
              📅 {new Date(anioActual, mesActual - 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
            </Badge>
            <Badge variant="outline" className="text-green-700 bg-green-50">
              {vistaCalendario === 'semanal' ? '📆 Vista Semanal' : 
               vistaCalendario === 'bisemanal' ? '📆 Vista Bi-semanal' :
               vistaCalendario === 'mensual' ? '📆 Vista Mensual' :
               '📆 Vista Bi-mensual'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cards de estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Turnos Totales</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnos.length}</div>
            <p className="text-xs text-gray-500 mt-1">Plantillas disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Asignados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnosAsignados}</div>
            <p className="text-xs text-gray-500 mt-1">
              {turnos.length > 0 ? `${Math.round((turnosAsignados / turnos.length) * 100)}%` : '0%'} completado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Por Asignar</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnosDisponibles}</div>
            <p className="text-xs text-gray-500 mt-1">Turnos pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Personas</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personasAsignadas}</div>
            <p className="text-xs text-gray-500 mt-1">Guardas asignados</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendario semanal */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>📋 Calendario de Turnos</CardTitle>
              <CardDescription>
                Haz clic en un turno para asignar o modificar persona
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              Semana {calcularSemanaCiclo(new Date(currentWeekStart))} de 4
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <WeeklySchedule
            events={scheduleBlocks}
            weekStart={currentPeriodStart}
            onBlockClick={handleBlockClick}
            onNextWeek={handleNextWeek}
            onPreviousWeek={handlePreviousWeek}
            daysToShow={daysToShow}
            viewMode={vistaCalendario}
          />
        </CardContent>
      </Card>

      {/* Dashboard de estadísticas por persona */}
      {estadisticas && estadisticas.porPersona.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estadísticas por Persona - {new Date(anioActual, mesActual - 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <CardDescription>
              Resumen de turnos, días y montos asignados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Persona</th>
                    <th className="text-center p-3 font-semibold">Turnos</th>
                    <th className="text-center p-3 font-semibold">Días Semana</th>
                    <th className="text-center p-3 font-semibold">Sábados</th>
                    <th className="text-center p-3 font-semibold">Domingos</th>
                    <th className="text-center p-3 font-semibold">Horas Totales</th>
                    <th className="text-right p-3 font-semibold">Monto a Pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {estadisticas.porPersona.map((stat, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{stat.persona.nombre}</div>
                        <div className="text-xs text-gray-500">{stat.persona.rut}</div>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="outline">{stat.turnosAsignados}</Badge>
                      </td>
                      <td className="text-center p-3">{stat.diasSemana}</td>
                      <td className="text-center p-3">
                        <Badge className="bg-blue-100 text-blue-700">{stat.sabados}</Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge className="bg-green-100 text-green-700">{stat.domingos}</Badge>
                      </td>
                      <td className="text-center p-3">{stat.horasTotales.toFixed(1)}h</td>
                      <td className="text-right p-3 font-semibold text-green-700">
                        {formatMonto(stat.montoTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-100 font-bold">
                    <td className="p-3">TOTAL</td>
                    <td className="text-center p-3">{estadisticas.totales.turnosAsignados}</td>
                    <td colSpan="4" className="text-center p-3">
                      {estadisticas.totales.personasInvolucradas} personas
                    </td>
                    <td className="text-right p-3 text-green-700">
                      {formatMonto(estadisticas.totales.montoTotalMes)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de asignación */}
      {showModal && turnoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">
              {turnoSeleccionado.persona ? '✏️ Modificar Asignación' : '➕ Asignar Persona'}
            </h2>

            {/* Información del turno */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Información del Turno</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Código:</strong> {turnoSeleccionado.codigo_turno}</div>
                <div><strong>Puesto:</strong> {turnoSeleccionado.puesto}</div>
                <div><strong>Día:</strong> {turnoSeleccionado.dia_semana}</div>
                <div><strong>Semana:</strong> Semana {turnoSeleccionado.semana_ciclo}</div>
                <div><strong>Horario:</strong> {turnoSeleccionado.hora_inicio} - {turnoSeleccionado.hora_fin}</div>
                <div><strong>Estado:</strong> 
                  <Badge className="ml-2">
                    {turnoSeleccionado.estado}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Persona actual */}
            {turnoSeleccionado.persona && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2 text-blue-900">Persona Asignada Actualmente</h3>
                <div className="text-sm">
                  <div className="font-medium text-blue-700">{turnoSeleccionado.persona.nombre}</div>
                  <div className="text-blue-600">{turnoSeleccionado.persona.rut}</div>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                  onClick={handleDesasignarTurno}
                  disabled={loading}
                >
                  Desasignar
                </Button>
              </div>
            )}

            {/* Lista de personas */}
            <div className="mb-4">
              <h3 className="font-semibold mb-3">
                {turnoSeleccionado.persona ? 'Cambiar a:' : 'Selecciona una persona:'}
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {personas.map(persona => (
                  <button
                    key={persona.id}
                    onClick={() => handleAsignarTurno(persona.id)}
                    disabled={loading}
                    className="w-full p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium">{persona.nombre}</div>
                    <div className="text-sm text-gray-600">{persona.rut} - {persona.tipo}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Programación Masiva - MOCKUP EXPLICATIVO */}
      {showProgramacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowProgramacionModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-purple-800">⚡ Programador Inteligente de Turnos</h2>
                <p className="text-gray-600 mt-1">Asigna personas a tipos de turnos para un rango de fechas específico</p>
              </div>
              <Button variant="outline" onClick={() => setShowProgramacionModal(false)}>
                ✕ Cerrar
              </Button>
            </div>

            {/* Sección 1: Selección de Fechas */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Paso 1: Seleccionar Rango de Fechas
                </CardTitle>
                <CardDescription>Define el período que quieres cubrir con turnos programados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fechaFin">Fecha de Fin</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Estadísticas del rango */}
                {fechaInicio && fechaFin && (() => {
                  const stats = calcularEstadisticasRango()
                  return stats && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-700">{stats.diasTotales}</div>
                        <div className="text-xs text-blue-600">Días totales</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-700">{stats.diasSemana}</div>
                        <div className="text-xs text-green-600">Días de semana</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-700">{stats.diasFinSemana}</div>
                        <div className="text-xs text-orange-600">Fin de semana</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-700">{stats.coberturaRequerida}</div>
                        <div className="text-xs text-purple-600">Turnos requeridos</div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Sección 2: Asignación de Personas por Tipo de Turno */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Paso 2: Asignar Personas por Tipo de Turno
                </CardTitle>
                <CardDescription>Arrastra y asigna personas a los diferentes tipos de turnos disponibles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Lista de tipos de turno */}
                  <div>
                    <h4 className="font-semibold mb-3">Tipos de Turno Disponibles</h4>
                    <div className="space-y-3">
                      {tiposTurno.map(tipo => {
                        const personaAsignada = asignacionesMockup[tipo]
                        const persona = personaAsignada ? personasMockup.find(p => p.id === personaAsignada) : null
                        
                        return (
                          <div key={tipo} className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[80px]">
                            <div className="flex justify-between items-center mb-2">
                              <Badge variant="outline" className="font-medium">
                                {tipo}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                {persona ? 'Asignado' : 'Disponible'}
                              </div>
                            </div>
                            
                            {/* Mostrar persona asignada */}
                            {persona ? (
                              <div className="bg-blue-50 border border-blue-200 p-3 rounded flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{persona.nombre}</div>
                                  <div className="text-xs text-gray-600">{persona.rut}</div>
                                  <Badge variant="secondary" className="mt-1 text-xs">{persona.tipo}</Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoverAsignacion(tipo)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              /* Dropdown para asignar persona cuando no hay nadie */
                              <div className="mt-2">
                                <select
                                  className="w-full text-sm p-2 border rounded"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const personaId = parseInt(e.target.value)
                                      console.log('Seleccionando persona:', personaId, 'para turno:', tipo)
                                      handleAsignarTipoTurno(tipo, personaId)
                                      e.target.value = ''
                                    }
                                  }}
                                >
                                  <option value="">+ Asignar persona a {tipo}</option>
                                  {personasMockup
                                    .filter(p => isPersonaDisponible(p.id))
                                    .map(persona => (
                                      <option key={persona.id} value={persona.id}>
                                        {persona.nombre} ({persona.tipo})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Panel de personas disponibles */}
                  <div>
                    <h4 className="font-semibold mb-3">Personas Disponibles</h4>
                    <div className="space-y-2 h-96 overflow-y-auto border rounded-lg p-2">
                      {personasMockup.map(persona => {
                        const estaAsignada = !isPersonaDisponible(persona.id)
                        const turnoAsignado = estaAsignada ? 
                          Object.entries(asignacionesMockup).find(([, id]) => id === persona.id)?.[0] : null
                        
                        return (
                          <div 
                            key={persona.id} 
                            className={`border rounded-lg p-3 transition-all ${
                              estaAsignada 
                                ? 'bg-gray-100 border-gray-300 opacity-60' 
                                : 'bg-white border-gray-200 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">{persona.nombre}</div>
                                <div className="text-sm text-gray-600">{persona.rut}</div>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {persona.tipo}
                                  </Badge>
                                  {estaAsignada && (
                                    <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                      Asignado a {turnoAsignado}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${estaAsignada ? 'text-red-500' : 'text-green-500'}`}>
                                  {estaAsignada ? '✕' : '✓'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {estaAsignada ? 'No disponible' : 'Disponible'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sección 3: Estadísticas y Cobertura */}
            {fechaInicio && fechaFin && (() => {
              const stats = calcularEstadisticasRango()
              return stats && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-orange-600" />
                      Paso 3: Análisis de Cobertura
                    </CardTitle>
                    <CardDescription>Estadísticas de la programación actual y áreas faltantes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Progreso general */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                        <h5 className="font-semibold text-blue-800 mb-3">📊 Asignación de Turnos</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Turnos asignados:</span>
                            <span className="font-bold text-blue-700">{stats.turnosAsignados} de {tiposTurno.length}</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(stats.turnosAsignados / tiposTurno.length) * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-blue-600">
                            {stats.turnosAsignados} asignados • {stats.turnosSinAsignar} pendientes
                          </div>
                        </div>
                      </div>

                      {/* Personas involucradas */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-800 mb-3">👥 Equipo</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Personas asignadas:</span>
                            <Badge className="bg-green-600">{stats.personasAsignadas}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Total disponibles:</span>
                            <Badge variant="outline">{personasMockup.length}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Faltantes */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                        <h5 className="font-semibold text-orange-800 mb-3">⚠️ Pendientes</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Turnos faltantes:</span>
                            <Badge className="bg-orange-600">{stats.coberturaPendiente}</Badge>
                          </div>
                          <div className="text-xs text-orange-600">
                            {stats.coberturaPendiente === 0 ? '✅ Cobertura completa' : 
                             `Necesitas asignar ${stats.coberturaPendiente} turnos más`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recomendaciones */}
                    {stats.coberturaPendiente > 0 && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h6 className="font-semibold text-yellow-800 mb-2">💡 Recomendaciones</h6>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Faltan {stats.coberturaPendiente} asignaciones para completar la cobertura</li>
                          <li>• Considera asignar más personas a turnos de fin de semana ({stats.diasFinSemana} días)</li>
                          <li>• Revisa que todas las personas tengan carga de trabajo equilibrada</li>
                        </ul>
                      </div>
                    )}

                    {stats.coberturaPendiente === 0 && stats.turnosAsignados > 0 && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h6 className="font-semibold text-green-800 mb-2">🎉 ¡Cobertura Completa!</h6>
                        <p className="text-sm text-green-700">
                          Has asignado exitosamente todos los turnos necesarios para el período seleccionado. 
                          La programación está lista para ser implementada.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })()}

            {/* Botones de acción */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                <MapPin className="inline h-4 w-4 mr-1" />
                Este es un mockup interactivo. Las asignaciones no se guardan por ahora.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowProgramacionModal(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  onClick={() => {
                    const asignaciones = Object.entries(asignacionesMockup)
                    const personas = asignaciones.map(([turno, personaId]) => {
                      const persona = personasMockup.find(p => p.id === personaId)
                      return `${turno}: ${persona?.nombre || 'Desconocido'}`
                    }).join('\n')
                    
                    if (asignaciones.length === 0) {
                      alert('⚠️ No hay asignaciones para aplicar. Asigna al menos una persona a un turno.')
                      return
                    }
                    
                    const mensaje = `✅ PROGRAMACIÓN APLICADA EXITOSAMENTE\n\nAsignaciones realizadas:\n${personas}\n\nPeríodo: ${fechaInicio || 'No definido'} al ${fechaFin || 'No definido'}\n\n💡 En la versión final, esto se guardaría en la base de datos.`
                    alert(mensaje)
                    
                    // Limpiar el modal
                    setAsignacionesMockup({})
                    setFechaInicio('')
                    setFechaFin('')
                    setShowProgramacionModal(false)
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aplicar Programación
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgramacionTurnos
