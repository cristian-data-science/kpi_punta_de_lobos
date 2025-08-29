import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Truck, 
  Route, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { useState, useEffect } from 'react'
import masterDataService from '@/services/masterDataService'

const Dashboard = () => {
  const [workers, setWorkers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [routes, setRoutes] = useState([])
  const [payments, setPayments] = useState([])

  useEffect(() => {
    // Cargar datos reales del servicio
    setWorkers(masterDataService.getWorkers())
    setVehicles(masterDataService.getVehicles())
    setRoutes(masterDataService.getRoutes())
    setPayments(masterDataService.getPayments())
  }, [])

  // Calcular estadísticas dinámicamente
  const activeVehicles = vehicles.filter(v => v.status === 'Operativo').length
  const maintenanceVehicles = vehicles.filter(v => v.status === 'Mantenimiento').length
  const activeRoutes = routes.filter(r => r.status === 'Activa').length
  const pendingPayments = payments.filter(p => p.status === 'Pendiente')
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  // Datos de ejemplo
  const stats = [
    {
      title: "Total Trabajadores",
      value: workers.length.toString(),
      change: workers.length === 0 ? "Sin datos" : `${workers.filter(w => w.status === 'Activo').length} activos`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Vehículos Activos",
      value: activeVehicles.toString(),
      change: vehicles.length === 0 ? "Sin datos" : `${maintenanceVehicles} en mantenimiento`,
      icon: Truck,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Rutas Asignadas",
      value: activeRoutes.toString(),
      change: routes.length === 0 ? "Sin datos" : `${routes.length} total`,
      icon: Route,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Pagos Pendientes",
      value: totalPendingAmount > 0 ? `$${totalPendingAmount.toLocaleString()}` : "$0",
      change: pendingPayments.length === 0 ? "Sin pendientes" : `${pendingPayments.length} trabajadores`,
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ]

  // Generar actividades recientes basadas en datos reales
  const recentActivities = []
  
  // Solo mostrar actividades si hay datos
  if (workers.length > 0 || vehicles.length > 0 || routes.length > 0 || payments.length > 0) {
    if (routes.length > 0) {
      recentActivities.push({
        type: "success",
        message: `Sistema con ${routes.length} ruta(s) registrada(s)`,
        time: "Datos actuales"
      })
    }
    if (vehicles.length > 0) {
      recentActivities.push({
        type: "info",
        message: `${vehicles.length} vehículo(s) en el sistema`,
        time: "Datos actuales"
      })
    }
    if (workers.length > 0) {
      recentActivities.push({
        type: "success",
        message: `${workers.length} trabajador(es) registrado(s)`,
        time: "Datos actuales"
      })
    }
    if (payments.length > 0) {
      recentActivities.push({
        type: "info",
        message: `${payments.length} registro(s) de pago en sistema`,
        time: "Datos actuales"
      })
    }
  } else {
    recentActivities.push({
      type: "info",
      message: "No hay datos en el sistema",
      time: "Sistema limpio"
    })
    recentActivities.push({
      type: "info", 
      message: "Ve a 'Cargar Archivos' para agregar datos demo",
      time: "Sugerencia"
    })
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'info':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Panel de control - Sistema de gestión de transporte
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas actividades del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Estado de la Flota
            </CardTitle>
            <CardDescription>
              Resumen del estado actual de vehículos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Operativos</span>
                </div>
                <span className="text-lg font-bold text-green-900">25</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Mantenimiento</span>
                </div>
                <span className="text-lg font-bold text-orange-900">3</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">En Ruta</span>
                </div>
                <span className="text-lg font-bold text-blue-900">18</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-orange-50 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Bienvenido a TransApp!
              </h3>
              <p className="text-gray-600 mb-4">
                Gestiona tu flota de transporte de manera eficiente. 
                Controla trabajadores, vehículos, rutas y pagos desde un solo lugar.
              </p>
            </div>
            <div className="hidden md:block">
              <Truck className="h-16 w-16 text-orange-600 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
