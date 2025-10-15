import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Plus, RefreshCw, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getCobros,
  createCobro,
  updateCobro,
  deleteCobro,
  getPersonas,
  getResumenFinanciero
} from '@/services/supabaseHelpers'

const Cobros = () => {
  const [cobros, setCobros] = useState([])
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCobro, setEditingCobro] = useState(null)
  const [message, setMessage] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [formData, setFormData] = useState({
    persona_id: '',
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    moneda: 'CLP',
    tipo: 'cobro',
    metodo_pago: 'efectivo',
    estado: 'pendiente',
    concepto: '',
    descripcion: '',
    referencia: '',
    notas: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cobrosRes, personasRes, resumenRes] = await Promise.all([
        getCobros(),
        getPersonas(1, 100),
        getResumenFinanciero()
      ])

      if (cobrosRes.error) {
        setMessage({ type: 'error', text: `Error al cargar cobros: ${cobrosRes.error.message}` })
      } else {
        setCobros(cobrosRes.data || [])
      }

      if (personasRes.error) {
        setMessage({ type: 'error', text: `Error al cargar personas: ${personasRes.error.message}` })
      } else {
        setPersonas(personasRes.data || [])
      }

      setResumen(resumenRes)
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
      const cobroData = {
        ...formData,
        monto: parseFloat(formData.monto)
      }

      if (editingCobro) {
        const { error } = await updateCobro(editingCobro.id, cobroData)
        if (error) {
          setMessage({ type: 'error', text: `Error al actualizar: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: '✅ Cobro actualizado exitosamente' })
          closeModal()
          loadData()
        }
      } else {
        const { error } = await createCobro(cobroData)
        if (error) {
          setMessage({ type: 'error', text: `Error al crear: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: '✅ Cobro creado exitosamente' })
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

  const handleEdit = (cobro) => {
    setEditingCobro(cobro)
    setFormData({
      persona_id: cobro.persona_id || '',
      fecha: cobro.fecha || new Date().toISOString().split('T')[0],
      monto: cobro.monto?.toString() || '',
      moneda: cobro.moneda || 'CLP',
      tipo: cobro.tipo || 'cobro',
      metodo_pago: cobro.metodo_pago || 'efectivo',
      estado: cobro.estado || 'pendiente',
      concepto: cobro.concepto || '',
      descripcion: cobro.descripcion || '',
      referencia: cobro.referencia || '',
      notas: cobro.notas || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cobro?')) return

    setLoading(true)
    try {
      const { error } = await deleteCobro(id)
      if (error) {
        setMessage({ type: 'error', text: `Error al eliminar: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: '✅ Cobro eliminado' })
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
    setEditingCobro(null)
    setFormData({
      persona_id: '',
      fecha: new Date().toISOString().split('T')[0],
      monto: '',
      moneda: 'CLP',
      tipo: 'cobro',
      metodo_pago: 'efectivo',
      estado: 'pendiente',
      concepto: '',
      descripcion: '',
      referencia: '',
      notas: ''
    })
  }

  const getTipoBadge = (tipo) => {
    const badges = {
      cobro: { color: 'bg-green-100 text-green-700', label: 'Cobro', icon: TrendingUp },
      pago: { color: 'bg-red-100 text-red-700', label: 'Pago', icon: TrendingDown },
      reembolso: { color: 'bg-orange-100 text-orange-700', label: 'Reembolso', icon: TrendingDown },
      descuento: { color: 'bg-blue-100 text-blue-700', label: 'Descuento', icon: TrendingDown }
    }
    return badges[tipo] || badges.cobro
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { color: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
      pagado: { color: 'bg-green-100 text-green-700', label: 'Pagado' },
      parcial: { color: 'bg-blue-100 text-blue-700', label: 'Parcial' },
      cancelado: { color: 'bg-red-100 text-red-700', label: 'Cancelado' },
      reembolsado: { color: 'bg-purple-100 text-purple-700', label: 'Reembolsado' }
    }
    return badges[estado] || badges.pendiente
  }

  const formatMonto = (monto, moneda = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: moneda
    }).format(monto)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cobros y Pagos</h1>
          <p className="text-gray-600 mt-2">Gestión financiera y control de transacciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Resumen Financiero */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cobros</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatMonto(resumen.totalCobros)}
              </div>
              <p className="text-xs text-muted-foreground">Ingresos totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatMonto(resumen.totalPagos)}
              </div>
              <p className="text-xs text-muted-foreground">Egresos totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${resumen.balanceTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMonto(resumen.balanceTotal)}
              </div>
              <p className="text-xs text-muted-foreground">Balance neto</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cobros.length}</div>
              <p className="text-xs text-muted-foreground">Total registradas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Cobros */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones ({cobros.length})</CardTitle>
          <CardDescription>
            Historial completo de cobros y pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !cobros.length ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Cargando...</p>
            </div>
          ) : cobros.length === 0 ? (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
              <div className="text-center">
                <DollarSign className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay transacciones registradas</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cobros.map((cobro) => {
                const tipoBadge = getTipoBadge(cobro.tipo)
                const estadoBadge = getEstadoBadge(cobro.estado)
                const Icon = tipoBadge.icon

                return (
                  <div key={cobro.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5" />
                          <h3 className="font-semibold">{cobro.concepto || 'Sin concepto'}</h3>
                          <Badge className={tipoBadge.color}>{tipoBadge.label}</Badge>
                          <Badge className={estadoBadge.color}>{estadoBadge.label}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="text-xl font-bold text-gray-900">
                            {formatMonto(cobro.monto, cobro.moneda)}
                          </p>
                          <p>📅 {cobro.fecha}</p>
                          {cobro.persona?.nombre && <p>👤 {cobro.persona.nombre}</p>}
                          {cobro.metodo_pago && <p>💳 {cobro.metodo_pago}</p>}
                          {cobro.descripcion && <p className="text-gray-500">{cobro.descripcion}</p>}
                          {cobro.referencia && <p className="text-xs text-gray-400">Ref: {cobro.referencia}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(cobro)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(cobro.id)}>
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
              {editingCobro ? 'Editar Transacción' : 'Nueva Transacción'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="cobro">Cobro (Ingreso)</option>
                    <option value="pago">Pago (Egreso)</option>
                    <option value="reembolso">Reembolso</option>
                    <option value="descuento">Descuento</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="persona_id">Persona</Label>
                  <select
                    id="persona_id"
                    value={formData.persona_id}
                    onChange={(e) => setFormData({ ...formData, persona_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
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
                  <Label htmlFor="monto">Monto *</Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="moneda">Moneda</Label>
                  <select
                    id="moneda"
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="CLP">CLP (Peso Chileno)</option>
                    <option value="USD">USD (Dólar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="BRL">BRL (Real)</option>
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
                  <Label htmlFor="metodo_pago">Método de Pago</Label>
                  <select
                    id="metodo_pago"
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
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
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="parcial">Parcial</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="reembolsado">Reembolsado</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="referencia">Referencia</Label>
                  <Input
                    id="referencia"
                    value={formData.referencia}
                    onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                    placeholder="N° de transacción, factura, etc."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="concepto">Concepto *</Label>
                <Input
                  id="concepto"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  required
                  placeholder="Ej: Clase de surf, Salario mensual, etc."
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="2"
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
                  {loading ? 'Guardando...' : editingCobro ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cobros
