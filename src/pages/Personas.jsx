import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, Search, Edit2, Trash2, Mail, Phone, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  getPersonas, 
  createPersona, 
  updatePersona, 
  deletePersona,
  searchPersonas 
} from '@/services/supabaseHelpers'

const Personas = () => {
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPersona, setEditingPersona] = useState(null)
  const [message, setMessage] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    tipo: 'visitante',
    estado: 'activo',
    tarifa_hora: 8000,
    notas: ''
  })

  // Cargar personas al iniciar
  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    setLoading(true)
    try {
      const { data, error } = await getPersonas(1, 100)
      if (error) {
        setMessage({ type: 'error', text: `Error al cargar: ${error.message}` })
      } else {
        setPersonas(data || [])
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadPersonas()
      return
    }

    setLoading(true)
    try {
      const { data, error } = await searchPersonas(searchTerm)
      if (error) {
        setMessage({ type: 'error', text: `Error en búsqueda: ${error.message}` })
      } else {
        setPersonas(data || [])
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
      if (editingPersona) {
        // Actualizar
        const { error } = await updatePersona(editingPersona.id, formData)
        if (error) {
          setMessage({ type: 'error', text: `Error al actualizar: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: '✅ Persona actualizada exitosamente' })
          closeModal()
          loadPersonas()
        }
      } else {
        // Crear
        const { error } = await createPersona(formData)
        if (error) {
          setMessage({ type: 'error', text: `Error al crear: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: '✅ Persona creada exitosamente' })
          closeModal()
          loadPersonas()
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (persona) => {
    setEditingPersona(persona)
    setFormData({
      nombre: persona.nombre || '',
      rut: persona.rut || '',
      email: persona.email || '',
      telefono: persona.telefono || '',
      tipo: persona.tipo || 'visitante',
      estado: persona.estado || 'activo',
      tarifa_hora: persona.tarifa_hora || 8000,
      notas: persona.notas || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta persona?')) return

    setLoading(true)
    try {
      const { error } = await deletePersona(id)
      if (error) {
        setMessage({ type: 'error', text: `Error al eliminar: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: '✅ Persona eliminada' })
        loadPersonas()
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPersona(null)
    setFormData({
      nombre: '',
      rut: '',
      email: '',
      telefono: '',
      tipo: 'visitante',
      estado: 'activo',
      tarifa_hora: 8000,
      notas: ''
    })
  }

  const getTipoBadgeColor = (tipo) => {
    const colors = {
      visitante: 'bg-blue-100 text-blue-700',
      guia: 'bg-green-100 text-green-700',
      staff: 'bg-purple-100 text-purple-700',
      instructor: 'bg-orange-100 text-orange-700',
      otro: 'bg-gray-100 text-gray-700'
    }
    return colors[tipo] || colors.otro
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-600 mt-2">Gestión de personas registradas</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadPersonas}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Agregar Persona
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Personas ({personas.length})</CardTitle>
          <CardDescription>
            Administra el registro de personas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nombre, RUT o email..." 
                className="flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                Buscar
              </Button>
            </div>
            
            {loading && !personas.length ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Cargando...</p>
              </div>
            ) : personas.length === 0 ? (
              <div className="border rounded-lg p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No hay personas registradas</p>
                <p className="text-sm mt-2">Comienza agregando la primera persona al sistema</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {personas.map((persona) => (
                  <div 
                    key={persona.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{persona.nombre}</h3>
                          <Badge className={getTipoBadgeColor(persona.tipo)}>
                            {persona.tipo}
                          </Badge>
                          {persona.estado === 'inactivo' && (
                            <Badge variant="destructive">Inactivo</Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          {persona.rut && <p>RUT: {persona.rut}</p>}
                          {persona.email && (
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {persona.email}
                            </p>
                          )}
                          {persona.telefono && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {persona.telefono}
                            </p>
                          )}
                          {persona.tarifa_hora && (
                            <p className="text-green-600 font-medium">
                              Tarifa: ${parseInt(persona.tarifa_hora).toLocaleString('es-CL')}/hora
                            </p>
                          )}
                          {persona.notas && (
                            <p className="text-xs mt-2 text-gray-500">{persona.notas}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(persona)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(persona.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingPersona ? 'Editar Persona' : 'Agregar Persona'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="visitante">Visitante</option>
                    <option value="guia">Guía</option>
                    <option value="staff">Staff</option>
                    <option value="instructor">Instructor</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <select
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="tarifa_hora">Tarifa por Hora (CLP)</Label>
                  <Input
                    id="tarifa_hora"
                    type="number"
                    value={formData.tarifa_hora}
                    onChange={(e) => setFormData({ ...formData, tarifa_hora: parseInt(e.target.value) || 0 })}
                    placeholder="Ej: 5250, 8000, 12500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Monto en pesos chilenos que cobra esta persona por hora de trabajo. Puede ser cualquier valor (ej: 5250, 8000, 12500).
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="notas">Notas</Label>
                <textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : editingPersona ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Personas
