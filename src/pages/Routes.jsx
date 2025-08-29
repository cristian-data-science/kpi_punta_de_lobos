import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Route, Plus, Search, Filter, MapPin, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import masterDataService from '@/services/masterDataService'

const Routes = () => {
  const [routes, setRoutes] = useState([])

  useEffect(() => {
    setRoutes(masterDataService.getRoutes())
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activa':
        return 'bg-green-100 text-green-800'
      case 'En Pausa':
        return 'bg-orange-100 text-orange-800'
      case 'Inactiva':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rutas</h1>
          <p className="text-gray-600 mt-2">
            Gestiona las rutas de transporte y asignaciones
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Ruta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rutas</p>
                <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
              </div>
              <Route className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">{routes.filter(r => r.status === 'Activa').length}</p>
              </div>
              <Route className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Pausa</p>
                <p className="text-2xl font-bold text-orange-600">{routes.filter(r => r.status === 'En Pausa').length}</p>
              </div>
              <Route className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asignadas</p>
                <p className="text-2xl font-bold text-blue-600">{routes.filter(r => r.assignedVehicle && r.assignedVehicle !== '-').length}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar rutas por código, nombre o destino..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Rutas</CardTitle>
          <CardDescription>
            Rutas de transporte configuradas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-12">
              <Route className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No hay rutas</h3>
              <p className="mt-2 text-gray-500">Comienza agregando rutas al sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Ruta</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Origen</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Destino</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Distancia</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tiempo Est.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Asignación</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{route.code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{route.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-green-600" />
                        <span className="text-gray-600">{route.origin}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-600" />
                        <span className="text-gray-600">{route.destination}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{route.distance}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{route.estimatedTime}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                        {route.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {route.assignedVehicle !== '-' ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{route.assignedVehicle}</div>
                          <div className="text-gray-500">{route.driver}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                        <Button variant="outline" size="sm">
                          Asignar
                        </Button>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Planificador de Rutas
            </CardTitle>
            <CardDescription>
              Optimiza rutas y calcula distancias automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Abrir Planificador
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Seguimiento en Tiempo Real
            </CardTitle>
            <CardDescription>
              Monitorea el progreso de las rutas activas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Ver Seguimiento
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Routes
