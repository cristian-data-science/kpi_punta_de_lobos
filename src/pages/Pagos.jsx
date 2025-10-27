// 💰 PUNTA DE LOBOS - Sistema de Pagos a Trabajadores
// Calcula automáticamente pagos según turnos trabajados y tarifas
// Issue #5: Refactorización Completa del Sistema de Pagos

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  Users, 
  Calendar, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  Clock, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  calcularPagosPorPeriodo,
  obtenerResumenPagos,
  obtenerPagosRegistrados,
  calcularPagosPorSemana,
  marcarComoPagado,
  desmarcarPago,
  sincronizarPagos
} from '@/services/supabaseHelpers'

const Pagos = () => {
  // Estados principales
  const [loading, setLoading] = useState(true)
  const [pagosData, setPagosData] = useState([])
  const [resumen, setResumen] = useState(null)
  const [pagosPorSemana, setPagosPorSemana] = useState(null)
  const [message, setMessage] = useState(null)
  
  // Filtros
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1)
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear())
  const [filtroBusqueda, setFiltroBusqueda] = useState('')

  // Cargar datos al montar y cuando cambien los filtros
  useEffect(() => {
    cargarDatos()
  }, [mesSeleccionado, anioSeleccionado])

  const cargarDatos = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const filters = { mes: mesSeleccionado, anio: anioSeleccionado }
      console.log('🔍 Cargando datos con filtros:', filters)
      
      // Cargar datos en paralelo
      const [pagosCalc, resumenData, pagosSemana] = await Promise.all([
        calcularPagosPorPeriodo(filters),
        obtenerResumenPagos(filters),
        calcularPagosPorSemana(mesSeleccionado, anioSeleccionado)
      ])

      console.log('📊 Resultado calcularPagosPorPeriodo:', pagosCalc)
      console.log('📈 Resultado obtenerResumenPagos:', resumenData)

      if (pagosCalc.error) {
        console.error('❌ Error en pagosCalc:', pagosCalc.error)
        setMessage({ type: 'error', text: `Error al calcular pagos: ${pagosCalc.error.message}` })
      } else {
        console.log('✅ Pagos calculados:', pagosCalc.data?.length || 0, 'personas')
        
        // Obtener pagos registrados para combinar con calculados
        const { data: pagosReg } = await obtenerPagosRegistrados(filters)
        console.log('💰 Pagos registrados:', pagosReg?.length || 0)
        
        // Combinar datos calculados con registrados
        const pagosCombinados = pagosCalc.data?.map(calc => {
          const registrado = pagosReg?.find(r => r.persona_id === calc.persona_id)
          return {
            ...calc,
            estado: registrado?.estado || 'pendiente',
            monto_pagado: registrado?.monto_pagado || 0,
            fecha_pago: registrado?.fecha_pago,
            id_pago: registrado?.id
          }
        }) || []
        
        console.log('🎯 Pagos combinados finales:', pagosCombinados)
        setPagosData(pagosCombinados)
      }

      if (resumenData.error) {
        setMessage({ type: 'error', text: `Error al obtener resumen: ${resumenData.error.message}` })
      } else {
        setResumen(resumenData.data)
      }

      if (pagosSemana.error) {
        console.warn('Error al calcular pagos por semana:', pagosSemana.error)
      } else {
        setPagosPorSemana(pagosSemana.data)
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error)
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  // Formatear montos
  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(monto || 0)
  }

  // Sincronizar pagos con la base de datos
  const handleSincronizar = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const { data, error } = await sincronizarPagos(mesSeleccionado, anioSeleccionado)
      
      if (error) {
        setMessage({ type: 'error', text: `Error al sincronizar: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: `✅ ${data?.length || 0} pagos sincronizados correctamente` })
        await cargarDatos() // Recargar datos
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  // Marcar pago como pagado
  const handleMarcarPagado = async (pago) => {
    if (!window.confirm(`¿Marcar como pagado el pago de ${pago.nombre} por ${formatMonto(pago.monto_calculado)}?`)) {
      return
    }

    setLoading(true)
    try {
      // Si el pago no existe en BD (id_pago es undefined), primero sincronizamos
      if (!pago.id_pago) {
        console.log('📝 Pago no existe en BD, creando primero...')
        const { error: syncError } = await sincronizarPagos(mesSeleccionado, anioSeleccionado)
        
        if (syncError) {
          setMessage({ type: 'error', text: `Error al sincronizar: ${syncError.message}` })
          setLoading(false)
          return
        }
        
        // Recargar datos para obtener el id_pago recién creado
        await cargarDatos()
        
        // Buscar el pago recién creado
        const pagoActualizado = pagosData.find(p => p.persona_id === pago.persona_id)
        
        if (!pagoActualizado?.id_pago) {
          setMessage({ type: 'error', text: 'Error: No se pudo crear el registro de pago' })
          setLoading(false)
          return
        }
        
        // Ahora sí marcar como pagado
        const { error } = await marcarComoPagado(
          pagoActualizado.id_pago, 
          pago.monto_calculado,
          'transferencia',
          null,
          `Pago ${mesSeleccionado}/${anioSeleccionado}`
        )
        
        if (error) {
          setMessage({ type: 'error', text: `Error: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: `✅ Pago marcado como pagado` })
          await cargarDatos()
        }
      } else {
        // El pago ya existe, solo actualizarlo
        const { error } = await marcarComoPagado(
          pago.id_pago, 
          pago.monto_calculado,
          'transferencia',
          null,
          `Pago ${mesSeleccionado}/${anioSeleccionado}`
        )
        
        if (error) {
          setMessage({ type: 'error', text: `Error: ${error.message}` })
        } else {
          setMessage({ type: 'success', text: `✅ Pago marcado como pagado` })
          await cargarDatos()
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  // Desmarcar pago
  const handleDesmarcarPago = async (pago) => {
    if (!pago.id_pago) {
      setMessage({ type: 'error', text: 'Error: Este pago no está registrado en la base de datos' })
      return
    }

    if (!window.confirm(`¿Desmarcar pago de ${pago.nombre}? Esto volverá el estado a pendiente.`)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await desmarcarPago(pago.id_pago)
      
      if (error) {
        setMessage({ type: 'error', text: `Error: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: `✅ Pago desmarcado` })
        await cargarDatos()
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !pagosData.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-teal-600 mb-4" />
          <p className="text-lg text-gray-600">Cargando datos de pagos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-teal-600" />
            Sistema de Pagos a Trabajadores
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión automática de pagos basada en turnos trabajados
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSincronizar} 
            variant="default"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={loading}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Sincronizar Pagos
          </Button>
          <Button 
            onClick={cargarDatos} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Mensajes */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Periodo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="mes">Mes</Label>
              <Select value={mesSeleccionado.toString()} onValueChange={(val) => setMesSeleccionado(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                    <SelectItem key={mes} value={mes.toString()}>
                      {new Date(2024, mes - 1).toLocaleDateString('es-ES', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="anio">Año</Label>
              <Select value={anioSeleccionado.toString()} onValueChange={(val) => setAnioSeleccionado(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((anio) => (
                    <SelectItem key={anio} value={anio.toString()}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="busqueda">Buscar</Label>
              <Input 
                id="busqueda"
                placeholder="Nombre, RUT, tipo..." 
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatMonto(resumen?.total_calculado || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumen?.total_turnos || 0} turnos, {Math.round(resumen?.total_horas || 0)} horas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMonto(resumen?.total_pagado || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumen?.personas_pagadas || 0} personas pagadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatMonto(resumen?.total_pendiente || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumen?.personas_pendientes || 0} personas pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personas Activas</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {resumen?.numero_personas || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Con turnos este periodo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Pagos por Persona
          </CardTitle>
          <CardDescription>
            Listado detallado de pagos calculados desde turnos trabajados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Turnos</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Tarifa/h</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No hay pagos para mostrar. Selecciona un periodo con turnos asignados.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagosData
                    .filter(pago => {
                      if (!filtroBusqueda) return true
                      const busqueda = filtroBusqueda.toLowerCase()
                      return (
                        pago.nombre?.toLowerCase().includes(busqueda) ||
                        pago.rut?.toLowerCase().includes(busqueda) ||
                        pago.tipo?.toLowerCase().includes(busqueda)
                      )
                    })
                    .map((pago, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{pago.nombre}</TableCell>
                        <TableCell className="text-sm text-gray-600">{pago.rut}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pago.tipo}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{pago.numero_turnos}</TableCell>
                        <TableCell className="text-right">{pago.horas_trabajadas?.toFixed(1) || '0.0'}</TableCell>
                        <TableCell className="text-right text-sm">{formatMonto(pago.tarifa_hora)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatMonto(pago.monto_calculado)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={pago.estado === 'pagado' ? 'default' : pago.estado === 'parcial' ? 'secondary' : 'destructive'}
                          >
                            {pago.estado === 'pendiente' && '⏳ Pendiente'}
                            {pago.estado === 'parcial' && '⚠️ Parcial'}
                            {pago.estado === 'pagado' && '✅ Pagado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            {pago.estado === 'pendiente' && (
                              <Button 
                                onClick={() => handleMarcarPagado(pago)} 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={loading}
                                title={!pago.id_pago ? 'Se creará el registro automáticamente' : 'Marcar como pagado'}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Marcar Pagado
                              </Button>
                            )}
                            {(pago.estado === 'pagado' || pago.estado === 'parcial') && pago.id_pago && (
                              <Button 
                                onClick={() => handleDesmarcarPago(pago)} 
                                size="sm"
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                disabled={loading}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Desmarcar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Pagos
