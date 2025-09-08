import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  UserX, 
  UserCheck, 
  Calendar,
  FileText,
  Phone,
  Save,
  X,
  RefreshCw
} from 'lucide-react'
import { useState, useEffect } from 'react'
import supabaseIntegrationService from '@/services/supabaseIntegrationService'

const Workers = () => {
  const [workers, setWorkers] = useState([])
  const [filteredWorkers, setFilteredWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterContract, setFilterContract] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingWorker, setEditingWorker] = useState(null)
  const [editForm, setEditForm] = useState({})

  // Cargar trabajadores desde Supabase
  const loadWorkers = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando trabajadores desde Supabase...')
      
      const workersData = await supabaseIntegrationService.getWorkers()
      console.log('📊 Trabajadores cargados:', workersData.length)
      
      setWorkers(workersData)
      setFilteredWorkers(workersData)
    } catch (error) {
      console.error('❌ Error cargando trabajadores:', error)
      // En caso de error, intentar con array vacío
      setWorkers([])
      setFilteredWorkers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkers()
  }, [])

  // Filtrar trabajadores
  useEffect(() => {
    let filtered = workers.filter(worker => {
      const matchesSearch = worker.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           worker.rut.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesContract = filterContract === 'all' || worker.contrato === filterContract
      const matchesStatus = filterStatus === 'all' || worker.estado === filterStatus
      
      return matchesSearch && matchesContract && matchesStatus
    })
    
    setFilteredWorkers(filtered)
  }, [workers, searchTerm, filterContract, filterStatus])

  // Editar trabajador
  const startEdit = (worker) => {
    setEditingWorker(worker.id)
    setEditForm({
      nombre: worker.nombre,
      telefono: worker.telefono,
      contrato: worker.contrato,
      estado: worker.estado
    })
  }

  // Guardar edición
  const saveEdit = async () => {
    try {
      console.log('💾 Guardando trabajador editado:', editForm)
      
      // Buscar el trabajador actual
      const currentWorker = workers.find(w => w.id === editingWorker)
      if (!currentWorker) {
        alert('Error: Trabajador no encontrado')
        return
      }
      
      // Preparar datos actualizados
      const updatedWorker = {
        ...currentWorker,
        ...editForm,
        id: editingWorker
      }
      
      const savedWorker = await supabaseIntegrationService.saveWorker(updatedWorker)
      console.log('✅ Trabajador actualizado:', savedWorker)
      
      // Recargar datos y limpiar formulario
      await loadWorkers()
      setEditingWorker(null)
      setEditForm({})
    } catch (error) {
      console.error('❌ Error guardando trabajador:', error)
      alert('Error actualizando trabajador: ' + error.message)
    }
  }

  // Cambiar estado (activar/desactivar)
  const toggleWorkerStatus = async (worker) => {
    try {
      const newStatus = worker.estado === 'activo' ? 'inactivo' : 'activo'
      console.log('🔄 Cambiando estado del trabajador:', worker.nombre, 'a', newStatus)
      
      const updatedWorker = {
        ...worker,
        estado: newStatus
      }
      
      const savedWorker = await supabaseIntegrationService.saveWorker(updatedWorker)
      console.log('✅ Estado actualizado:', savedWorker)
      
      await loadWorkers()
    } catch (error) {
      console.error('❌ Error cambiando estado:', error)
      alert('Error cambiando estado: ' + error.message)
    }
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const activeWorkers = workers.filter(w => w.estado === 'activo')
  const inactiveWorkers = workers.filter(w => w.estado === 'inactivo')
  const contractTypes = workers.reduce((acc, w) => {
    acc[w.contrato] = (acc[w.contrato] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-lg text-gray-600">Cargando trabajadores...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trabajadores</h1>
          <p className="text-gray-600 mt-2">
            Gestiona el personal de tu empresa de transporte
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadWorkers} 
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{workers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{activeWorkers.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactivos</p>
                <p className="text-2xl font-bold text-red-600">{inactiveWorkers.length}</p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos Fijo</p>
                <p className="text-2xl font-bold text-blue-600">{contractTypes.fijo || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtro por contrato */}
            <div>
              <Label className="text-sm font-medium">Contrato</Label>
              <select
                value={filterContract}
                onChange={(e) => setFilterContract(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los contratos</option>
                <option value="fijo">Fijo</option>
                <option value="eventual">Eventual</option>
                <option value="planta">Planta</option>
              </select>
            </div>
            
            {/* Filtro por estado */}
            <div>
              <Label className="text-sm font-medium">Estado</Label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
            
            {/* Botón limpiar filtros */}
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterContract('all')
                  setFilterStatus('all')
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
          
          {/* Resumen de filtros */}
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredWorkers.length} de {workers.length} trabajadores
          </div>
        </CardContent>
      </Card>

      {/* Workers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Trabajadores</CardTitle>
          <CardDescription>
            Personal registrado en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {workers.length === 0 ? 'No hay trabajadores' : 'No hay trabajadores que coincidan'}
              </h3>
              <p className="mt-2 text-gray-500">
                {workers.length === 0 
                  ? 'Los trabajadores se cargarán automáticamente desde la base de datos.'
                  : 'Intenta ajustar los filtros de búsqueda.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">RUT</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Contrato</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Teléfono</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Última Actualización</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {editingWorker === worker.id ? (
                          <Input
                            value={editForm.nombre}
                            onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                            className="text-sm"
                          />
                        ) : (
                          <div className="font-medium text-gray-900">{worker.nombre}</div>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="text-gray-600 font-mono text-sm">{worker.rut}</div>
                      </td>
                      
                      <td className="py-3 px-4">
                        {editingWorker === worker.id ? (
                          <select
                            value={editForm.contrato}
                            onChange={(e) => setEditForm({...editForm, contrato: e.target.value})}
                            className="text-sm px-2 py-1 border rounded"
                          >
                            <option value="fijo">Fijo</option>
                            <option value="eventual">Eventual</option>
                            <option value="planta">Planta</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            worker.contrato === 'fijo' 
                              ? 'bg-blue-100 text-blue-800'
                              : worker.contrato === 'planta'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {worker.contrato}
                          </span>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        {editingWorker === worker.id ? (
                          <Input
                            value={editForm.telefono}
                            onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                            placeholder="Teléfono"
                            className="text-sm"
                          />
                        ) : (
                          <div className="text-gray-600">
                            {worker.telefono || (
                              <span className="text-gray-400 italic">Sin teléfono</span>
                            )}
                          </div>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        {editingWorker === worker.id ? (
                          <select
                            value={editForm.estado}
                            onChange={(e) => setEditForm({...editForm, estado: e.target.value})}
                            className="text-sm px-2 py-1 border rounded"
                          >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            worker.estado === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <div className="flex items-center gap-1">
                              {worker.estado === 'activo' ? (
                                <UserCheck className="h-3 w-3" />
                              ) : (
                                <UserX className="h-3 w-3" />
                              )}
                              {worker.estado}
                            </div>
                          </span>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(worker.updated_at)}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        {editingWorker === worker.id ? (
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              onClick={saveEdit}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingWorker(null)
                                setEditForm({})
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => startEdit(worker)}
                              className="h-8 w-8 p-0"
                              title="Editar trabajador"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant={worker.estado === 'activo' ? 'destructive' : 'default'}
                              onClick={() => toggleWorkerStatus(worker)}
                              className="h-8 w-8 p-0"
                              title={worker.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            >
                              {worker.estado === 'activo' ? (
                                <UserX className="h-3 w-3" />
                              ) : (
                                <UserCheck className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Workers
