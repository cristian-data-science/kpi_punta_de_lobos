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
  RefreshCw,
  Trash2,
  AlertTriangle,
  Upload,
  DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '../services/supabaseClient.js'
import AddWorkerModal from '../components/AddWorkerModal'
import BulkUploadWorkersModal from '../components/BulkUploadWorkersModal'

const Workers = () => {
  const [workers, setWorkers] = useState([])
  const [filteredWorkers, setFilteredWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterContract, setFilterContract] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingWorker, setEditingWorker] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [workerToDelete, setWorkerToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [showBulkSalaryModal, setShowBulkSalaryModal] = useState(false)
  const [bulkSalary, setBulkSalary] = useState('')
  const [isApplyingBulkSalary, setIsApplyingBulkSalary] = useState(false)

  // Conexión singleton de Supabase
  const supabase = getSupabaseClient()

  // Cargar trabajadores directamente desde Supabase
  const loadWorkers = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando trabajadores directamente desde Supabase...')
      
      const { data, error } = await supabase
        .from('trabajadores')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      console.log('✅ Trabajadores cargados exitosamente:', data?.length || 0)
      console.log('📋 Datos:', data)
      
      setWorkers(data || [])
      setFilteredWorkers(data || [])
    } catch (error) {
      console.error('❌ Error cargando trabajadores:', error)
      setWorkers([])
      setFilteredWorkers([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadWorkers()
  }, [])

  // Filtrar trabajadores
  useEffect(() => {
    let filtered = workers

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(worker =>
        worker.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.rut?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por contrato
    if (filterContract !== 'all') {
      filtered = filtered.filter(worker => worker.contrato === filterContract)
    }

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(worker => worker.estado === filterStatus)
    }

    setFilteredWorkers(filtered)
  }, [workers, searchTerm, filterContract, filterStatus])

  // Iniciar edición
  const startEdit = (worker) => {
    setEditingWorker(worker.id)
    setEditForm({
      nombre: worker.nombre,
      contrato: worker.contrato,
      telefono: worker.telefono || '',
      estado: worker.estado,
      sueldo_base: worker.sueldo_base || 0,
      dias_trabajados: worker.dias_trabajados || 30
    })
  }

  // Guardar edición
  const saveEdit = async () => {
    try {
      console.log('💾 Guardando trabajador editado:', editForm)
      
      // Nota: El RUT no se edita en línea, por lo que no necesitamos procesarlo aquí
      const { data, error } = await supabase
        .from('trabajadores')
        .update({
          nombre: editForm.nombre.toUpperCase(), // Asegurar que se guarde en MAYÚSCULAS
          contrato: editForm.contrato,
          telefono: editForm.telefono,
          estado: editForm.estado,
          sueldo_base: parseInt(editForm.sueldo_base) || 0,
          dias_trabajados: parseInt(editForm.dias_trabajados) || 30
        })
        .eq('id', editingWorker)
        .select()
      
      if (error) {
        throw error
      }
      
      console.log('✅ Trabajador actualizado:', data)
      
      // Recargar datos y limpiar formulario
      await loadWorkers()
      setEditingWorker(null)
      setEditForm({})
    } catch (error) {
      console.error('❌ Error guardando trabajador:', error)
      alert('Error actualizando trabajador: ' + error.message)
    }
  }

  // Función para asegurar formato correcto de RUT (con guión)
  const ensureRutWithHyphen = (rut) => {
    if (!rut) return rut
    
    // Si ya tiene guión, devolverlo tal como está
    if (rut.includes('-')) return rut
    
    // Si no tiene guión y tiene la longitud correcta (8-9 dígitos)
    if (rut.length >= 8 && rut.length <= 9) {
      // Separar los últimos dígitos (dígito verificador)
      const rutNumber = rut.slice(0, -1)
      const verifierDigit = rut.slice(-1)
      
      // Agregar el guión
      return `${rutNumber}-${verifierDigit}`
    }
    
    // Si no se puede formatear, devolver original
    return rut
  }

  // Crear nuevo trabajador
  const createWorker = async (workerData) => {
    try {
      setIsCreating(true)
      console.log('👤 Creando nuevo trabajador:', workerData)
      
      // Asegurar formato correcto de RUT antes de verificar duplicados
      const formattedRut = ensureRutWithHyphen(workerData.rut)
      console.log('🔧 RUT formateado:', workerData.rut, '→', formattedRut)
      
      // Verificar que el RUT no exista
      const { data: existingWorker } = await supabase
        .from('trabajadores')
        .select('id, rut')
        .eq('rut', formattedRut)
        .single()
      
      if (existingWorker) {
        throw new Error('Ya existe un trabajador con este RUT')
      }
      
      // Asegurar que el nombre se guarde en MAYÚSCULAS y RUT con guión
      const workerDataForDB = {
        ...workerData,
        nombre: workerData.nombre.toUpperCase(),
        rut: formattedRut // Asegurar formato con guión
      }
      
      const { data, error } = await supabase
        .from('trabajadores')
        .insert([workerDataForDB])
        .select()
      
      if (error) {
        throw error
      }
      
      console.log('✅ Trabajador creado exitosamente:', data)
      
      // Recargar datos y cerrar modal
      await loadWorkers()
      setIsAddModalOpen(false)
      
      // Mostrar mensaje de éxito
      alert('Trabajador creado exitosamente')
    } catch (error) {
      console.error('❌ Error creando trabajador:', error)
      alert('Error creando trabajador: ' + error.message)
    } finally {
      setIsCreating(false)
    }
  }

  // Cambiar estado (activar/desactivar)
  const toggleWorkerStatus = async (worker) => {
    try {
      const newStatus = worker.estado === 'activo' ? 'inactivo' : 'activo'
      console.log('🔄 Cambiando estado del trabajador:', worker.nombre, 'a', newStatus)
      
      // Si se desactiva, resetear valores de sueldo a 0
      const updateData = newStatus === 'inactivo'
        ? { estado: newStatus, sueldo_base: 0, dias_trabajados: 0, sueldo_proporcional: 0 }
        : { estado: newStatus }
      
      const { data, error } = await supabase
        .from('trabajadores')
        .update(updateData)
        .eq('id', worker.id)
        .select()
      
      if (error) {
        throw error
      }
      
      console.log('✅ Estado actualizado:', data)
      if (newStatus === 'inactivo') {
        console.log('💰 Sueldos reseteados a 0 para trabajador inactivo')
      }
      await loadWorkers()
    } catch (error) {
      console.error('❌ Error cambiando estado:', error)
      alert('Error cambiando estado: ' + error.message)
    }
  }

  // Eliminar trabajador permanentemente
  const deleteWorker = async (worker) => {
    try {
      setIsDeleting(true)
      console.log('🗑️ Eliminando trabajador permanentemente:', worker.nombre)
      
      const { error } = await supabase
        .from('trabajadores')
        .delete()
        .eq('id', worker.id)
      
      if (error) {
        throw error
      }
      
      console.log('✅ Trabajador eliminado permanentemente')
      
      // Recargar datos y cerrar modal
      await loadWorkers()
      setWorkerToDelete(null)
      
      // Mostrar mensaje de confirmación
      alert(`Trabajador "${worker.nombre}" eliminado permanentemente`)
    } catch (error) {
      console.error('❌ Error eliminando trabajador:', error)
      alert('Error eliminando trabajador: ' + error.message)
    } finally {
      setIsDeleting(false)
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

  // Aplicar sueldo base masivo solo a trabajadores activos
  const applyBulkSalary = async () => {
    try {
      setIsApplyingBulkSalary(true)
      const salaryValue = parseInt(bulkSalary)
      
      if (isNaN(salaryValue) || salaryValue < 0) {
        alert('Por favor ingresa un sueldo válido (número entero mayor o igual a 0)')
        return
      }

      console.log('💰 Aplicando sueldo base masivo:', salaryValue, 'solo a trabajadores activos')
      
      // Actualizar solo trabajadores activos
      const { data, error } = await supabase
        .from('trabajadores')
        .update({ sueldo_base: salaryValue })
        .eq('estado', 'activo') // Solo trabajadores activos
        .select()
      
      if (error) {
        throw error
      }
      
      console.log('✅ Sueldo base actualizado para', data?.length || 0, 'trabajadores activos')
      
      // Recargar datos y cerrar modal
      await loadWorkers()
      setShowBulkSalaryModal(false)
      setBulkSalary('')
      
      // Mostrar mensaje de éxito
      alert(`Sueldo base de $${salaryValue.toLocaleString('es-CL')} aplicado exitosamente a ${data?.length || 0} trabajadores activos`)
    } catch (error) {
      console.error('❌ Error aplicando sueldo masivo:', error)
      alert('Error aplicando sueldo masivo: ' + error.message)
    } finally {
      setIsApplyingBulkSalary(false)
    }
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('')
    setFilterContract('all')
    setFilterStatus('all')
  }

  // Estadísticas
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trabajadores</h1>
          <p className="text-gray-600 mt-2">
            Gestiona el personal de tu empresa de transporte
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowBulkSalaryModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            disabled={loading || workers.length === 0}
            title="Aplicar sueldo base a todos los trabajadores"
          >
            <DollarSign className="h-4 w-4" />
            Aplicar Sueldo Base
          </Button>
          <Button 
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            disabled={loading || isCreating}
          >
            <Upload className="h-4 w-4" />
            Carga Masiva
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            disabled={loading || isCreating}
          >
            <Plus className="h-4 w-4" />
            Agregar Trabajador
          </Button>
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Mostrando {filteredWorkers.length} de {workers.length} trabajadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por nombre o RUT...</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Buscar por nombre o RUT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por contrato */}
            <div className="space-y-2">
              <Label htmlFor="contract-filter">Contrato</Label>
              <select
                id="contract-filter"
                value={filterContract}
                onChange={(e) => setFilterContract(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los contratos</option>
                <option value="planta">Planta</option>
                <option value="eventual">Eventual</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Estado</Label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="licencia">Licencia</option>
                <option value="vacaciones">Vacaciones</option>
              </select>
            </div>

            {/* Limpiar filtros */}
            <div className="space-y-2 flex items-end">
              <Button 
                onClick={clearFilters}
                variant="outline" 
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de trabajadores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Trabajadores</CardTitle>
          <CardDescription>Personal registrado en el sistema</CardDescription>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Sueldo Base</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Días</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Sueldo Proporcional</th>
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
                            <option value="planta">Planta</option>
                            <option value="eventual">Eventual</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            worker.contrato === 'fijo'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : worker.contrato === 'planta'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {worker.contrato}
                          </span>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        {editingWorker === worker.id ? (
                          <Input
                            type="number"
                            value={editForm.sueldo_base || ''}
                            onChange={(e) => setEditForm({...editForm, sueldo_base: e.target.value})}
                            placeholder="Sueldo"
                            className="text-sm w-32"
                            step="1000"
                            min="0"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium">
                            {worker.sueldo_base ? 
                              `$${parseInt(worker.sueldo_base).toLocaleString('es-CL')}` : 
                              <span className="text-gray-400 italic">$0</span>
                            }
                          </div>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        {editingWorker === worker.id ? (
                          <Input
                            type="number"
                            value={editForm.dias_trabajados || 30}
                            onChange={(e) => setEditForm({...editForm, dias_trabajados: e.target.value})}
                            className="text-sm w-16"
                            min="1"
                            max="31"
                          />
                        ) : (
                          <div className="text-gray-600">
                            {worker.dias_trabajados || 30}
                          </div>
                        )}
                      </td>
                      
                      {/* Sueldo Proporcional desde BD con Preview en Tiempo Real */}
                      <td className="py-3 px-4">
                        {editingWorker === worker.id && (editForm.contrato === 'planta' || editForm.contrato === 'fijo') ? (
                          <div>
                            {/* Preview en tiempo real del cálculo */}
                            <div className="text-sm font-semibold text-blue-600">
                              ${Math.round((parseInt(editForm.sueldo_base) || 0) * ((parseInt(editForm.dias_trabajados) || 30) / 30)).toLocaleString('es-CL')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {((parseInt(editForm.dias_trabajados) || 30) / 30 * 100).toFixed(0)}% del base
                            </div>
                          </div>
                        ) : editingWorker === worker.id && editForm.contrato === 'eventual' ? (
                          <div>
                            <div className="text-sm font-semibold text-gray-400">
                              $0
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              (Eventual: N/A)
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-semibold text-blue-600">
                              ${(worker.sueldo_proporcional || 0).toLocaleString('es-CL')}
                            </div>
                            {worker.contrato === 'eventual' && (
                              <div className="text-xs text-gray-500 mt-1">
                                (Eventual: N/A)
                              </div>
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
                            <option value="licencia">Licencia</option>
                            <option value="vacaciones">Vacaciones</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            worker.estado === 'activo'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : worker.estado === 'licencia'
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : worker.estado === 'vacaciones'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {worker.estado === 'activo' ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <UserX className="h-3 w-3" />
                            )}
                            {worker.estado}
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
                            {/* Botón eliminar solo para trabajadores inactivos */}
                            {worker.estado === 'inactivo' && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => setWorkerToDelete(worker)}
                                className="h-8 w-8 p-0"
                                title="Eliminar permanentemente"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
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

      {/* Modal para agregar trabajador */}
      <AddWorkerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={createWorker}
        isSaving={isCreating}
      />

      {/* Modal para carga masiva */}
      <BulkUploadWorkersModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onWorkersUploaded={() => {
          loadWorkers()
          setShowBulkUpload(false)
        }}
      />

      {/* Modal de confirmación para eliminar trabajador */}
      {workerToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-red-600">
                    Eliminar Trabajador
                  </CardTitle>
                  <CardDescription>
                    Esta acción no se puede deshacer
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 mb-1">
                      ⚠️ Advertencia Importante
                    </p>
                    <p className="text-red-700">
                      Estás a punto de eliminar permanentemente al trabajador{' '}
                      <strong>"{workerToDelete.nombre}"</strong>. 
                    </p>
                    <p className="text-red-700 mt-1">
                      Esta acción eliminará todos los datos relacionados y{' '}
                      <strong>NO SE PUEDE DESHACER</strong>.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setWorkerToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteWorker(workerToDelete)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Permanentemente
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para aplicar sueldo base masivo */}
      {showBulkSalaryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-purple-600">
                    Aplicar Sueldo Base para Todos
                  </CardTitle>
                  <CardDescription>
                    Establecer el mismo sueldo base para todos los trabajadores
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Información */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-800 mb-1">
                      ⚠️ Operación Masiva
                    </p>
                    <p className="text-purple-700">
                      Esta acción aplicará el mismo sueldo base a{' '}
                      <strong className="font-bold">{workers.length} trabajadores</strong>.
                    </p>
                    <p className="text-purple-700 mt-1">
                      Los valores actuales serán reemplazados. Esta operación es <strong>inmediata</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Input de sueldo */}
              <div className="space-y-2">
                <Label htmlFor="bulk-salary" className="text-base font-medium">
                  Sueldo Base a Aplicar (CLP)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="bulk-salary"
                    type="number"
                    value={bulkSalary}
                    onChange={(e) => setBulkSalary(e.target.value)}
                    placeholder="Ej: 600000"
                    step="10000"
                    min="0"
                    disabled={isApplyingBulkSalary}
                    className="pl-10 text-lg"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Ingresa el sueldo base mensual que se aplicará a todos los trabajadores
                </p>
              </div>

              {/* Preview del sueldo */}
              {bulkSalary && parseInt(bulkSalary) > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-900">
                      Sueldo a aplicar:
                    </span>
                    <span className="text-xl font-bold text-green-700">
                      ${parseInt(bulkSalary).toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    Se aplicará a {workers.length} trabajadores
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkSalaryModal(false)
                    setBulkSalary('')
                  }}
                  disabled={isApplyingBulkSalary}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={applyBulkSalary}
                  disabled={isApplyingBulkSalary || !bulkSalary || parseInt(bulkSalary) < 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isApplyingBulkSalary ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Aplicar a Todos
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Workers
