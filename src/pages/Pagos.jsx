import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Plus, Search, Filter, TrendingUp, TrendingDown, Calendar, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const Pagos = () => {
  const [filter, setFilter] = useState('todos')

  // Datos de ejemplo para demostración
  const transacciones = [
    // Aquí se cargarán las transacciones reales desde la base de datos
  ]

  const estadisticas = {
    totalIngresos: 0,
    totalEgresos: 0,
    balanceNeto: 0,
    transaccionesHoy: 0
  }

  const tiposTransaccion = [
    { value: 'todos', label: 'Todos', color: 'bg-gray-100 text-gray-800' },
    { value: 'ingreso', label: 'Ingresos', color: 'bg-green-100 text-green-800' },
    { value: 'egreso', label: 'Egresos', color: 'bg-red-100 text-red-800' },
    { value: 'pendiente', label: 'Pendientes', color: 'bg-yellow-100 text-yellow-800' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos y Cobros</h1>
          <p className="text-gray-600 mt-2">Gestión financiera y control de transacciones</p>
        </div>
        <Button className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
          <Plus className="h-4 w-4" />
          Nueva Transacción
        </Button>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${estadisticas.totalIngresos.toLocaleString('es-CL')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Egresos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${estadisticas.totalEgresos.toLocaleString('es-CL')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${estadisticas.balanceNeto >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${Math.abs(estadisticas.balanceNeto).toLocaleString('es-CL')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Diferencia mensual</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones Hoy</CardTitle>
            <Receipt className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{estadisticas.transaccionesHoy}</div>
            <p className="text-xs text-muted-foreground mt-1">En el día de hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>
            Registro completo de pagos y cobros realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar por concepto, monto o persona..." 
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input 
                  type="date"
                  className="w-auto"
                />
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Filtros por tipo */}
            <div className="flex flex-wrap gap-2">
              {tiposTransaccion.map((tipo) => (
                <Badge
                  key={tipo.value}
                  variant={filter === tipo.value ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    filter === tipo.value 
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setFilter(tipo.value)}
                >
                  {tipo.label}
                </Badge>
              ))}
            </div>

            {/* Lista de transacciones */}
            {transacciones.length === 0 ? (
              <div className="border rounded-lg p-8 text-center text-gray-500 bg-gradient-to-br from-gray-50 to-white">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No hay transacciones registradas</p>
                <p className="text-sm mt-2 mb-4">Comienza agregando tu primera transacción al sistema</p>
                <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Transacción
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Aquí se renderizarán las transacciones cuando existan */}
                {transacciones.map((transaccion, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaccion.tipo === 'ingreso' 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        {transaccion.tipo === 'ingreso' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaccion.concepto}</p>
                        <p className="text-sm text-gray-500">{transaccion.fecha}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaccion.tipo === 'ingreso' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaccion.tipo === 'ingreso' ? '+' : '-'}
                        ${transaccion.monto.toLocaleString('es-CL')}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={
                          transaccion.estado === 'completado' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }
                      >
                        {transaccion.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Últimos Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No hay ingresos recientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Últimos Egresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No hay egresos recientes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Pagos
