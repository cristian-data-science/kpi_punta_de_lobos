import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Plus, Calendar, RefreshCw, Edit2, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getRegistros,
  createRegistro,
  updateRegistro,
  deleteRegistro,
  getPersonas
} from '@/services/supabaseHelpers'

const Registros = () => {
  const [registros, setRegistros] = useState([])
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState(null)
  const [message, setMessage] = useState(null)
  const [formData, setFormData] = useState({
    persona_id: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_actividad: 'surf',
    descripcion: '',
    duracion_minutos: '',
    notas: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [registrosRes, personasRes] = await Promise.all([
        getRegistros(),
        getPersonas(1, 100)
      ])

      if (registrosRes.error) {
        setMessage({ type: 'error', text: `Error al cargar registros: ${registrosRes.error.message}` })
      } else {
        setRegistros(registrosRes.data || [])
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const registroData = {
        ...formData,
        duracion_minutos: formData.duracion_minutos ? parseInt(formData.duracion_minutos) : null
      }

      if (editingRegistro) {
        const { error } = await updateRegistro(editingRegistro.id, registroData)
        if (error) {
          setMessage({ type: 'error', text: `Error al actualizar: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: '✅ Registro actualizado exitosamente' })
          closeModal()
          loadData()
        }
      } else {
        const { error } = await createRegistro(registroData)
        if (error) {
          setMessage({ type: 'error', text: `Error al crear: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: '✅ Registro creado exitosamente' })
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

  const handleEdit = (registro) => {
    setEditingRegistro(registro)
    setFormData({
      persona_id: registro.persona_id || '',
      fecha: registro.fecha || new Date().toISOString().split('T')[0],
      tipo_actividad: registro.tipo_actividad || 'surf',
      descripcion: registro.descripcion || '',
      duracion_minutos: registro.duracion_minutos?.toString() || '',
      notas: registro.notas || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return

    setLoading(true)
    try {
      const { error } = await deleteRegistro(id)
      if (error) {
        setMessage({ type: 'error', text: `Error al eliminar: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: '✅ Registro eliminado' })
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
    setEditingRegistro(null)
    setFormData({
      persona_id: '',
      fecha: new Date().toISOString().split('T')[0],
      tipo_actividad: 'surf',
      descripcion: '',
      duracion_minutos: '',
      notas: ''
    })
  }

  const getTipoActividadBadge = (tipo) => {
    const badges = {
      surf: { color: 'bg-blue-100 text-blue-700', label: '🏄 Surf', icon: '🏄' },
      clase: { color: 'bg-green-100 text-green-700', label: '📚 Clase', icon: '📚' },
      tour: { color: 'bg-purple-100 text-purple-700', label: '🗺️ Tour', icon: '🗺️' },
      evento: { color: 'bg-orange-100 text-orange-700', label: '🎉 Evento', icon: '🎉' },
      mantenimiento: { color: 'bg-gray-100 text-gray-700', label: '🔧 Mantenimiento', icon: '🔧' },
      otro: { color: 'bg-pink-100 text-pink-700', label: '📋 Otro', icon: '📋' }
    }
    return badges[tipo] || badges.otro
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registros</h1>
          <p className="text-gray-600 mt-2">Historial de actividades y eventos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Registro
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registros.length}</div>
            <p className="text-xs text-muted-foreground">Actividades registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registros.filter(r => {
                const fecha = new Date(r.fecha)
                const hoy = new Date()
                const unaSemanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
                return fecha >= unaSemanaAtras
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 7 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Principal</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registros.length > 0 ? getTipoActividadBadge(
                registros.reduce((acc, r) => {
                  acc[r.tipo_actividad] = (acc[r.tipo_actividad] || 0) + 1
                  return acc
                }, {})?.[Object.keys(registros.reduce((acc, r) => {
                  acc[r.tipo_actividad] = (acc[r.tipo_actividad] || 0) + 1
                  return acc
                }, {})).sort((a, b) => 
                  registros.reduce((acc, r) => {
                    acc[r.tipo_actividad] = (acc[r.tipo_actividad] || 0) + 1
                    return acc
                  }, {})[b] - registros.reduce((acc, r) => {
                    acc[r.tipo_actividad] = (acc[r.tipo_actividad] || 0) + 1
                    return acc
                  }, {})[a]
                )[0]] || 'surf'
              ).icon : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Más frecuente</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Actividades Recientes ({registros.length})</CardTitle>
          <CardDescription>
            Registro cronológico de actividades en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !registros.length ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Cargando...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No hay registros disponibles</p>
              <p className="text-sm mt-2">Los registros de actividades aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registros.map((registro) => {
                const tipoBadge = getTipoActividadBadge(registro.tipo_actividad)
                
                return (
                  <div key={registro.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {registro.persona?.nombre || 'Sin persona asignada'}
                          </h3>
                          <Badge className={tipoBadge.color}>
                            {tipoBadge.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📅 {registro.fecha}</p>
                          {registro.duracion_minutos && (
                            <p>⏱️ Duración: {registro.duracion_minutos} minutos</p>
                          )}
                          {registro.descripcion && (
                            <p className="text-gray-700 mt-2">{registro.descripcion}</p>
                          )}
                          {registro.notas && (
                            <p className="text-xs text-gray-500 mt-2">
                              <strong>Notas:</strong> {registro.notas}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(registro)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(registro.id)}>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingRegistro ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="persona_id">Persona *</Label>
                  <select
                    id="persona_id"
                    value={formData.persona_id}
                    onChange={(e) => setFormData({ ...formData, persona_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Seleccionar persona...</option>
                    {personas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.tipo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo_actividad">Tipo de Actividad *</Label>
                  <select
                    id="tipo_actividad"
                    value={formData.tipo_actividad}
                    onChange={(e) => setFormData({ ...formData, tipo_actividad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="surf">🏄 Surf</option>
                    <option value="clase">📚 Clase</option>
                    <option value="tour">🗺️ Tour</option>
                    <option value="evento">🎉 Evento</option>
                    <option value="mantenimiento">🔧 Mantenimiento</option>
                    <option value="otro">📋 Otro</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="duracion_minutos">Duración (minutos)</Label>
                  <Input
                    id="duracion_minutos"
                    type="number"
                    value={formData.duracion_minutos}
                    onChange={(e) => setFormData({ ...formData, duracion_minutos: e.target.value })}
                    placeholder="60"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  placeholder="Detalles de la actividad..."
                />
              </div>
              <div>
                <Label htmlFor="notas">Notas</Label>
                <textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : editingRegistro ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Registros
