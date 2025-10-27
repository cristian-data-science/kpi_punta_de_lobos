import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserX,
  Briefcase,
  CalendarClock,
  TimerReset,
  Target,
  Activity,
  AlertTriangle,
  Award,
  Zap,
  X,
  DollarSign
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getEstadisticas, getTurnos, getPersonas } from '@/services/supabaseHelpers'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPersonas: 0,
    totalTurnos: 0,
    turnosHoy: 0,
    turnosEstaSemana: 0,
    turnosMesActual: 0,
    personasActivas: 0,
    turnosProgramados: 0,
    turnosCompletados: 0,
    turnosEnCurso: 0,
    turnosCancelados: 0,
    turnosAusentes: 0,
    tasaAsistencia: 0,
    promedioHorasDia: 0,
    personasMasActivas: [],
    turnosPorTipo: {},
    proximosTurnos: [],
    montosAPagar: [],
    montoTotalSemanal: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Obtener estadísticas generales
      const estadisticas = await getEstadisticas()
      
      // Obtener turnos con diferentes filtros
      const hoy = new Date().toISOString().split('T')[0]
      const inicioSemana = getStartOfWeek(new Date())
      const finSemana = getEndOfWeek(new Date())
      const inicioMes = getStartOfMonth(new Date())
      const finMes = getEndOfMonth(new Date())

      const [turnosHoyRes, turnosSemanaRes, turnosMesRes, personasRes] = await Promise.all([
        getTurnos({ fecha: hoy }),
        getTurnos({ fechaDesde: inicioSemana, fechaHasta: finSemana }),
        getTurnos({ fechaDesde: inicioMes, fechaHasta: finMes }),
        getPersonas(1, 1000)
      ])

      const turnosHoy = turnosHoyRes.data || []
      const turnosSemana = turnosSemanaRes.data || []
      const turnosMes = turnosMesRes.data || []
      const personas = personasRes.data || []

      // Calcular estadísticas avanzadas
      const turnosProgramados = turnosMes.filter(t => t.estado === 'programado').length
      const turnosCompletados = turnosMes.filter(t => t.estado === 'completado').length
      const turnosEnCurso = turnosHoy.filter(t => t.estado === 'en_curso').length
      const turnosCancelados = turnosMes.filter(t => t.estado === 'cancelado').length
      const turnosAusentes = turnosMes.filter(t => t.estado === 'ausente').length

      // Tasa de asistencia (completados vs total esperados)
      const turnosEsperados = turnosProgramados + turnosCompletados + turnosAusentes + turnosCancelados
      const tasaAsistencia = turnosEsperados > 0 
        ? ((turnosCompletados / turnosEsperados) * 100).toFixed(1)
        : 0

      // Promedio de horas por día
      const totalHoras = turnosMes.reduce((acc, turno) => {
        const inicio = new Date(`2000-01-01T${turno.hora_inicio}`)
        const fin = new Date(`2000-01-01T${turno.hora_fin}`)
        const horas = (fin - inicio) / (1000 * 60 * 60)
        return acc + (horas > 0 ? horas : 0)
      }, 0)
      const diasConTurnos = new Set(turnosMes.map(t => t.fecha)).size
      const promedioHorasDia = diasConTurnos > 0 
        ? (totalHoras / diasConTurnos).toFixed(1)
        : 0

      // Personas más activas este mes
      const turnosPorPersona = turnosMes.reduce((acc, turno) => {
        const personaId = turno.persona_id
        if (!acc[personaId]) {
          acc[personaId] = {
            persona: turno.persona,
            count: 0,
            horasTrabajadas: 0
          }
        }
        acc[personaId].count++
        
        const inicio = new Date(`2000-01-01T${turno.hora_inicio}`)
        const fin = new Date(`2000-01-01T${turno.hora_fin}`)
        const horas = (fin - inicio) / (1000 * 60 * 60)
        acc[personaId].horasTrabajadas += horas > 0 ? horas : 0
        
        return acc
      }, {})

      const personasMasActivas = Object.values(turnosPorPersona)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(p => ({
          nombre: p.persona?.nombre || 'Sin nombre',
          turnos: p.count,
          horas: p.horasTrabajadas.toFixed(1)
        }))

      // Turnos por tipo
      const turnosPorTipo = turnosMes.reduce((acc, turno) => {
        const tipo = turno.tipo_turno || 'sin_tipo'
        acc[tipo] = (acc[tipo] || 0) + 1
        return acc
      }, {})

      // Próximos turnos (hoy y mañana)
      const mañana = new Date()
      mañana.setDate(mañana.getDate() + 1)
      const fechaMañana = mañana.toISOString().split('T')[0]

      const proximosTurnosRes = await getTurnos({ 
        fechaDesde: hoy, 
        fechaHasta: fechaMañana 
      })
      const proximosTurnos = (proximosTurnosRes.data || [])
        .filter(t => t.estado === 'programado' || t.estado === 'en_curso')
        .sort((a, b) => {
          if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
          return a.hora_inicio.localeCompare(b.hora_inicio)
        })
        .slice(0, 5)

      // Calcular montos a pagar basados en turnos y tarifas (como en ReporteTurnos)
      const pagosPorPersona = {}
      let montoTotalSemanal = 0
      
      turnosSemana.forEach(turno => {
        const persona = personas.find(p => p.id === turno.persona_id)
        if (!persona) return
        
        const nombre = persona.nombre || 'Sin asignar'
        
        // Obtener tarifa por persona si existe, sino usar estándar
        const tarifaPorHora = persona.tarifa_hora || 8000 // Tarifa estándar
        const horaInicio = turno.hora_inicio ? parseInt(turno.hora_inicio.split(':')[0]) : 9
        const horaFin = turno.hora_fin ? parseInt(turno.hora_fin.split(':')[0]) : 17
        const horasTrabajadas = horaFin - horaInicio
        
        const montoTurno = horasTrabajadas * tarifaPorHora
        montoTotalSemanal += montoTurno
        
        if (!pagosPorPersona[nombre]) {
          pagosPorPersona[nombre] = {
            persona,
            montoPendiente: 0,
            numeroTurnos: 0,
            horasTotales: 0
          }
        }
        pagosPorPersona[nombre].montoPendiente += montoTurno
        pagosPorPersona[nombre].numeroTurnos++
        pagosPorPersona[nombre].horasTotales += horasTrabajadas
      })

      const montosAPagar = Object.entries(pagosPorPersona)
        .sort(([,a], [,b]) => b.montoPendiente - a.montoPendiente)
        .slice(0, 10)
        .map(([nombre, data]) => ({
          nombre,
          rut: data.persona?.rut || 'Sin RUT',
          monto: data.montoPendiente,
          numeroTurnos: data.numeroTurnos,
          horasTotales: data.horasTotales
        }))

      setStats({
        totalPersonas: personas.length,
        personasActivas: personas.filter(p => p.estado === 'activo').length,
        totalTurnos: turnosMes.length,
        turnosHoy: turnosHoy.length,
        turnosEstaSemana: turnosSemana.length,
        turnosMesActual: turnosMes.length,
        turnosProgramados,
        turnosCompletados,
        turnosEnCurso,
        turnosCancelados,
        turnosAusentes,
        tasaAsistencia,
        promedioHorasDia,
        personasMasActivas,
        turnosPorTipo,
        proximosTurnos,
        montosAPagar,
        montoTotalSemanal
      })
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funciones helper para fechas
  const getStartOfWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff)).toISOString().split('T')[0]
  }

  const getEndOfWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? 0 : 7)
    return new Date(d.setDate(diff)).toISOString().split('T')[0]
  }

  const getStartOfMonth = (date) => {
    const d = new Date(date)
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  }

  const getEndOfMonth = (date) => {
    const d = new Date(date)
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      programado: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Programado', icon: Calendar },
      en_curso: { color: 'bg-green-100 text-green-700 border-green-200', label: 'En Curso', icon: Zap },
      completado: { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Completado', icon: CheckCircle2 },
      cancelado: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelado', icon: X },
      ausente: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Ausente', icon: AlertTriangle }
    }
    return badges[estado] || badges.programado
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Panel de control - Punta de Lobos</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" className="flex items-center gap-2">
          <TimerReset className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Turnos Hoy</CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.turnosHoy}</div>
            <div className="flex items-center gap-2 mt-2">
              {stats.turnosEnCurso > 0 && (
                <Badge className="bg-green-500 text-white text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {stats.turnosEnCurso} activos
                </Badge>
              )}
              <p className="text-xs text-blue-700">Turnos programados hoy</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-900">Esta Semana</CardTitle>
            <CalendarClock className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-900">{stats.turnosEstaSemana}</div>
            <p className="text-xs text-teal-700 mt-2">turnos programados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Personal Activo</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.personasActivas}</div>
            <p className="text-xs text-green-700 mt-2">
              de {stats.totalPersonas} personas totales
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Promedio Diario</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{stats.promedioHorasDia}h</div>
            <p className="text-xs text-orange-700 mt-2">Horas promedio por día</p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas Detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-700">Este Mes</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.turnosMesActual}</div>
            <p className="text-xs text-gray-500">turnos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-700">Completados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.turnosCompletados}</div>
            <p className="text-xs text-gray-500">este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-700">Programados</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.turnosProgramados}</div>
            <p className="text-xs text-gray-500">pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Sección Informativa Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximos Turnos */}
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-teal-600" />
              Próximos Turnos
            </CardTitle>
            <CardDescription>Turnos programados para hoy y mañana</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.proximosTurnos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No hay turnos próximos programados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.proximosTurnos.map((turno, idx) => {
                  const badge = getEstadoBadge(turno.estado)
                  const Icon = badge.icon
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {turno.persona?.nombre || 'Sin asignar'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {turno.fecha === new Date().toISOString().split('T')[0] ? 'Hoy' : 'Mañana'} · {turno.hora_inicio} - {turno.hora_fin}
                          </p>
                          {turno.puesto && (
                            <p className="text-xs text-gray-500">{turno.puesto}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={`${badge.color} border text-xs`}>
                        {badge.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen de Estado */}
        <Card className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 shadow-lg border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <LayoutDashboard className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
            <CardDescription className="text-teal-700">
              Operativo Punta de Lobos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="font-semibold text-gray-900 text-lg">Sistema Activo</p>
                <p className="text-xs text-gray-600 mt-1">Operando normalmente</p>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <UserCheck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold text-gray-900 text-lg">{stats.personasActivas} Activos</p>
                <p className="text-xs text-gray-600 mt-1">Personal disponible</p>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <Zap className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <p className="font-semibold text-gray-900 text-lg">{stats.turnosEnCurso} En Curso</p>
                <p className="text-xs text-gray-600 mt-1">Turnos activos ahora</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal y Pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Más Activo */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              Top Personal Activo
            </CardTitle>
            <CardDescription>Personas con más turnos este mes</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.personasMasActivas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No hay datos de personal disponibles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.personasMasActivas.map((persona, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-amber-400 text-amber-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-300 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{persona.nombre}</p>
                        <p className="text-xs text-gray-600">{persona.horas}h trabajadas</p>
                      </div>
                    </div>
                    <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                      {persona.turnos} turnos
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Montos a Pagar Resumen */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Resumen Pagos Semanales
            </CardTitle>
            <CardDescription>Total a pagar esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.montosAPagar.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No hay turnos esta semana</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Total Semanal */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                  <div className="text-center">
                    <p className="text-sm text-green-600 mb-1">Total Semanal</p>
                    <div className="text-3xl font-bold text-green-800">
                      ${stats.montoTotalSemanal.toLocaleString('es-CL')}
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      {stats.montosAPagar.length} {stats.montosAPagar.length === 1 ? 'persona' : 'personas'}
                    </p>
                  </div>
                </div>
                
                {/* Top 3 montos */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Top 3 Montos</p>
                  {stats.montosAPagar.slice(0, 3).map((persona, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{persona.nombre}</p>
                          <p className="text-xs text-gray-600">
                            {persona.numeroTurnos} turnos · {persona.horasTotales}h
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-700">
                          ${persona.monto.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
