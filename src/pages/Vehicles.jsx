import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Truck, Plus, Search, Filter, AlertTriangle, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import masterDataService from '@/services/masterDataService'

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    setVehicles(masterDataService.getVehicles())
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Operativo':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'Mantenimiento':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Operativo':
        return 'bg-green-100 text-green-800'
      case 'Mantenimiento':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-red-100 text-red-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehículos</h1>
          <p className="text-gray-600 mt-2">
            Gestiona la flota de vehículos de transporte
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Vehículo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Operativos</p>
                <p className="text-2xl font-bold text-green-600">{vehicles.filter(v => v.status === 'Operativo').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
                <p className="text-2xl font-bold text-orange-600">{vehicles.filter(v => v.status === 'Mantenimiento').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Otros Estados</p>
                <p className="text-2xl font-bold text-blue-600">{vehicles.filter(v => v.status !== 'Operativo' && v.status !== 'Mantenimiento').length}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
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
                placeholder="Buscar vehículos por patente, marca o modelo..."
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

      {/* Vehicles List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vehículos</CardTitle>
          <CardDescription>
            Flota de camiones registrada en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No hay vehículos</h3>
              <p className="mt-2 text-gray-500">Comienza agregando vehículos a tu flota.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Patente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Vehículo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Año</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Conductor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Próximo Mantto.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{vehicle.plate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{vehicle.year}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(vehicle.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{vehicle.driver}</td>
                    <td className="py-3 px-4 text-gray-600">{vehicle.nextMaintenance}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Ver
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

      {/* Maintenance Alert - Solo mostrar si hay vehículos */}
      {vehicles.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-900">
                  Información de Mantenimientos
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  {vehicles.filter(v => v.status === 'Mantenimiento').length} vehículo(s) en mantenimiento actualmente.
                </p>
              </div>
              <Button variant="outline" className="ml-auto">
                Ver Calendario
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Vehicles
