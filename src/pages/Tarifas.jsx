import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { 
  DollarSign, 
  Save, 
  RefreshCw,
  Calendar,
  Settings,
  AlertCircle,
  CheckCircle,
  Edit
} from 'lucide-react'
import { getSupabaseClient } from '../services/supabaseClient'

function Tarifas() {
  const supabase = getSupabaseClient()
  
  // Estados para las tarifas
  const [tarifas, setTarifas] = useState({
    firstSecondShift: 20000,
    thirdShiftWeekday: 22500, 
    thirdShiftSaturday: 27500,
    holiday: 27500,
    sunday: 35000
  })
  
  // Estados para cobros
  const [tarifaCobro, setTarifaCobro] = useState(50000)
  
  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [showCalendarConfig, setShowCalendarConfig] = useState(false)
  const [showCobroConfig, setShowCobroConfig] = useState(false)
  const [tempTarifas, setTempTarifas] = useState({})
  const [tempTarifaCobro, setTempTarifaCobro] = useState(50000)

  // Cargar tarifas al iniciar
  useEffect(() => {
    loadAllTarifas()
  }, [])

  // Cargar todas las tarifas desde Supabase
  const loadAllTarifas = async () => {
    setLoading(true)
    try {
      console.log('📋 Cargando todas las tarifas desde Supabase...')
      
      // Cargar tarifas de calendario y cobros en paralelo
      const [calendarRates, cobroRate] = await Promise.all([
        supabase.from('shift_rates').select('*').neq('rate_name', 'cobro_tarifa'),
        supabase.from('shift_rates').select('rate_value').eq('rate_name', 'cobro_tarifa').single()
      ])
      
      if (calendarRates.error) throw calendarRates.error
      
      // Procesar tarifas de calendario
      const loadedTarifas = { ...tarifas }
      calendarRates.data.forEach(rate => {
        loadedTarifas[rate.rate_name] = rate.rate_value
      })
      
      setTarifas(loadedTarifas)
      setTempTarifas(loadedTarifas)
      
      // Procesar tarifa de cobros
      if (cobroRate.data && !cobroRate.error) {
        setTarifaCobro(cobroRate.data.rate_value)
        setTempTarifaCobro(cobroRate.data.rate_value)
      }
      
      setLastUpdate(new Date())
      console.log('✅ Tarifas cargadas exitosamente')
      
    } catch (error) {
      console.error('❌ Error cargando tarifas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Guardar tarifas de calendario
  const saveCalendarTarifas = async () => {
    setLoading(true)
    try {
      console.log('💾 Guardando tarifas de calendario...')
      
      // Preparar datos para upsert
      const upsertData = Object.entries(tempTarifas).map(([rateName, rateValue]) => ({
        rate_name: rateName,
        rate_value: rateValue
      }))
      
      const { error } = await supabase
        .from('shift_rates')
        .upsert(upsertData, { onConflict: 'rate_name' })
      
      if (error) throw error
      
      setTarifas(tempTarifas)
      setShowCalendarConfig(false)
      setLastUpdate(new Date())
      
      console.log('✅ Tarifas de calendario guardadas')
      
    } catch (error) {
      console.error('❌ Error guardando tarifas de calendario:', error)
    } finally {
      setLoading(false)
    }
  }

  // Guardar tarifa de cobros
  const saveCobroTarifa = async () => {
    setLoading(true)
    try {
      console.log('💾 Guardando tarifa de cobros...')
      
      const { error } = await supabase
        .from('shift_rates')
        .upsert({
          rate_name: 'cobro_tarifa',
          rate_value: tempTarifaCobro
        }, { onConflict: 'rate_name' })
      
      if (error) throw error
      
      setTarifaCobro(tempTarifaCobro)
      setShowCobroConfig(false)
      setLastUpdate(new Date())
      
      console.log('✅ Tarifa de cobros guardada')
      
    } catch (error) {
      console.error('❌ Error guardando tarifa de cobros:', error)
    } finally {
      setLoading(false)
    }
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Obtener descripción de tarifa
  const getTarifaDescription = (key) => {
    const descriptions = {
      firstSecondShift: 'Primer y segundo turno (Lunes - Sábado)',
      thirdShiftWeekday: 'Tercer turno (Lunes - Viernes)', 
      thirdShiftSaturday: 'Tercer turno (Sábados)',
      holiday: 'Días feriados',
      sunday: 'Domingos'
    }
    return descriptions[key] || key
  }

  if (loading && !lastUpdate) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuración de tarifas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Tarifas</h1>
          <p className="text-gray-600 mt-2">
            Gestión centralizada de todas las tarifas del sistema
          </p>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Última actualización: {lastUpdate.toLocaleString('es-CL')}
            </p>
          )}
        </div>
        <Button onClick={loadAllTarifas} className="flex items-center gap-2" disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Tarifas de Calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle>Tarifas de Calendario</CardTitle>
            </div>
            <Button 
              onClick={() => {
                setTempTarifas({ ...tarifas })
                setShowCalendarConfig(true)
              }}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Edit className="h-4 w-4" />
              Editar Tarifas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(tarifas).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {getTarifaDescription(key)}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(value)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600 opacity-60" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tarifa de Cobros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <CardTitle>Tarifa de Cobros</CardTitle>
            </div>
            <Button 
              onClick={() => {
                setTempTarifaCobro(tarifaCobro)
                setShowCobroConfig(true)
              }}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Edit className="h-4 w-4" />
              Editar Tarifa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Tarifa para nuevos turnos en sección Cobros
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(tarifaCobro)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600 opacity-60" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de configuración de calendario */}
      {showCalendarConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Configurar Tarifas de Calendario</h3>
                <Button 
                  onClick={() => setShowCalendarConfig(false)}
                  variant="ghost"
                  className="text-gray-500"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(tempTarifas).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-sm font-medium text-gray-700">
                      {getTarifaDescription(key)}
                    </Label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setTempTarifas(prev => ({
                        ...prev,
                        [key]: parseInt(e.target.value) || 0
                      }))}
                      className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button 
                  onClick={saveCalendarTarifas}
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </Button>
                <Button 
                  onClick={() => setShowCalendarConfig(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuración de cobros */}
      {showCobroConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Configurar Tarifa de Cobros</h3>
                <Button 
                  onClick={() => setShowCobroConfig(false)}
                  variant="ghost"
                  className="text-gray-500"
                >
                  ✕
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Tarifa para nuevos turnos
                </Label>
                <input
                  type="number"
                  value={tempTarifaCobro}
                  onChange={(e) => setTempTarifaCobro(parseInt(e.target.value) || 0)}
                  className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="1000"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Esta tarifa se utiliza en la sección Cobros para nuevos turnos
                </p>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button 
                  onClick={saveCobroTarifa}
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </Button>
                <Button 
                  onClick={() => setShowCobroConfig(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información del sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Tarifas de Calendario</p>
                <p className="text-xs text-blue-600">Se usan para cálculo de pagos automático</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Tarifa de Cobros</p>
                <p className="text-xs text-green-600">Se usa para facturación de nuevos servicios</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Información Importante</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Los cambios en las tarifas se guardan directamente en la base de datos. 
                  Las tarifas históricas no se modifican para preservar la integridad de los cálculos anteriores.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Tarifas
