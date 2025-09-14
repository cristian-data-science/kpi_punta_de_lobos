import React, { useState, useEffect, useRef } from 'react'
import { Calendar as CalendarIcon, Settings, Plus, Trash2, Save, Download, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { getSupabaseClient } from '../services/supabaseClient.js'
import masterDataService from '../services/masterDataService'

// Cliente singleton de Supabase para operaciones de calendario
const supabase = getSupabaseClient()

// Funciones auxiliares para trabajar con Supabase
const calendarService = {
  // Cargar tarifas desde Supabase
  async loadShiftRates() {
    try {
      const { data, error } = await supabase
        .from('shift_rates')
        .select('*')
        .order('rate_name')
      
      if (error) throw error
      
      // Convertir array a objeto con estructura esperada
      const rates = {}
      data.forEach(rate => {
        rates[rate.rate_name] = rate.rate_value
      })
      
      return rates
    } catch (error) {
      console.error('Error cargando tarifas:', error)
      // Fallback a datos por defecto
      return {
        firstSecondShift: 20000,
        thirdShiftWeekday: 22500, 
        thirdShiftSaturday: 27500,
        holiday: 27500,
        sunday: 35000
      }
    }
  },

  // Cargar feriados desde Supabase  
  async loadHolidays() {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('holiday_date')
        .order('holiday_date')
      
      if (error) throw error
      
      return data.map(h => h.holiday_date)
    } catch (error) {
      console.error('Error cargando feriados:', error)
      // Fallback a feriados por defecto
      return [
        '2025-01-01', '2025-04-18', '2025-04-19', '2025-05-01',
        '2025-05-21', '2025-09-18', '2025-09-19', '2025-12-25'
      ]
    }
  },

  // Guardar tarifas en Supabase
  async saveShiftRates(rates) {
    try {
      const updates = Object.entries(rates).map(([rateName, rateValue]) => ({
        rate_name: rateName,
        rate_value: rateValue
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('shift_rates')
          .upsert(update, { 
            onConflict: 'rate_name',
            ignoreDuplicates: false 
          })
        
        if (error) throw error
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error guardando tarifas:', error)
      return { success: false, error: error.message }
    }
  },

  // Agregar feriado en Supabase
  async addHoliday(date, description = '') {
    try {
      const { error } = await supabase
        .from('holidays')
        .insert({ 
          holiday_date: date, 
          description 
        })
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error agregando feriado:', error)
      return { success: false, error: error.message }
    }
  },

  // Eliminar feriado de Supabase
  async removeHoliday(date) {
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('holiday_date', date)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error eliminando feriado:', error)
      return { success: false, error: error.message }
    }
  }
}

const Calendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [calendarConfig, setCalendarConfig] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [newHoliday, setNewHoliday] = useState('')
  const [shiftRates, setShiftRates] = useState({})
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadCalendarConfig()
    const handler = () => loadCalendarConfig()
    window.addEventListener('calendarConfigChanged', handler)
    return () => window.removeEventListener('calendarConfigChanged', handler)
  }, [])

  const loadCalendarConfig = async () => {
    try {
      // Cargar tarifas y feriados desde Supabase
      const [shiftRates, holidays] = await Promise.all([
        calendarService.loadShiftRates(),
        calendarService.loadHolidays()
      ])
      
      const config = {
        shiftRates,
        holidays
      }
      
      setCalendarConfig(config)
      setShiftRates(shiftRates)
    } catch (error) {
      console.error('Error cargando configuración:', error)
      // Fallback a localStorage si falla Supabase
      const config = masterDataService.getCalendarConfig()
      setCalendarConfig(config)
      setShiftRates(config.shiftRates)
    }
  }

  // Obtener el lunes de la semana actual
  const getMonday = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Generar los días de la semana
  const getWeekDays = (monday) => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Formatear fecha para mostrar
  const formatDate = (date) => {
    return date.toLocaleDateString('es-CL', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  // Formatear fecha para comparaciones (YYYY-MM-DD) sin problemas de zona horaria
  const formatDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Formatear fecha desde string YYYY-MM-DD para mostrar
  const formatStoredDate = (dateString) => {
    // Crear fecha local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month - 1 porque los meses van de 0-11
    return date.toLocaleDateString('es-CL')
  }

  // Verificar si una fecha es feriado
  const isHoliday = (date) => {
    if (!calendarConfig) return false
    const dateKey = formatDateKey(date)
    return calendarConfig.holidays.includes(dateKey)
  }

  // Obtener tarifa para un día y turno específico usando datos de Supabase
  const getShiftRate = (date, shiftType) => {
    if (!calendarConfig) return 0
    
    const dateKey = formatDateKey(date)
    const dayOfWeek = date.getDay() // 0 = Domingo, 1 = Lunes, etc.
    const isHolidayDay = calendarConfig.holidays.includes(dateKey)
    const validShiftType = shiftType || 1

    // REGLA 1: Domingo siempre paga tarifa de domingo cualquier turno
    if (dayOfWeek === 0) {
      return calendarConfig.shiftRates.sunday // 35.000
    }

    // REGLA 2: Si es festivo (y no es domingo), paga tarifa de feriado cualquier turno  
    if (isHolidayDay && dayOfWeek !== 0) {
      return calendarConfig.shiftRates.holiday // 27.500
    }

    // REGLA 3: Si no aplica lo anterior y es sábado 3er turno, paga tarifa sábado
    if (dayOfWeek === 6 && validShiftType === 3) {
      return calendarConfig.shiftRates.thirdShiftSaturday // 27.500
    }

    // REGLA 4: Si no aplica lo anterior y es lunes a viernes 3er turno, paga tarifa 3er turno
    if (validShiftType === 3 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      return calendarConfig.shiftRates.thirdShiftWeekday // 22.500
    }

    // REGLA 5: En los demás casos (1° o 2° turno lunes a sábado), paga tarifa normal
    return calendarConfig.shiftRates.firstSecondShift // 20.000
  }

  // Navegación de semanas
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeek(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeek(newDate)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
  }

  // Agregar feriado
  const handleAddHoliday = async () => {
    if (newHoliday) {
      const result = await calendarService.addHoliday(newHoliday)
      if (result.success) {
        setNewHoliday('')
        loadCalendarConfig()
      } else {
        alert(`Error agregando feriado: ${result.error}`)
      }
    }
  }

  // Eliminar feriado
  const handleRemoveHoliday = async (holiday) => {
    const result = await calendarService.removeHoliday(holiday)
    if (result.success) {
      loadCalendarConfig()
    } else {
      alert(`Error eliminando feriado: ${result.error}`)
    }
  }

  // Guardar tarifas
  const handleSaveRates = async () => {
    const result = await calendarService.saveShiftRates(shiftRates)
    if (result.success) {
      loadCalendarConfig()
      setShowSettings(false)
      alert('Tarifas guardadas correctamente')
    } else {
      alert(`Error guardando tarifas: ${result.error}`)
    }
  }

  // Exportar configuración (TODO: actualizar para Supabase)
  const handleExportConfig = async () => {
    try {
      const config = {
        shiftRates: calendarConfig.shiftRates,
        holidays: calendarConfig.holidays,
        exportDate: new Date().toISOString(),
        source: 'supabase'
      }
      
      const dataStr = JSON.stringify(config, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = `calendar-config-${new Date().toISOString().split('T')[0]}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } catch (error) {
      alert('Error exportando configuración: ' + error.message)
    }
  }

  // Importar configuración (TODO: actualizar para Supabase) 
  const handleImportConfig = async (event) => {
    const file = event.target.files[0]
    if (file) {
      try {
        const text = await file.text()
        const config = JSON.parse(text)
        
        // Validar estructura básica
        if (config.shiftRates && config.holidays) {
          // Guardar tarifas
          await calendarService.saveShiftRates(config.shiftRates)
          
          // Guardar feriados (primero limpiar existentes)
          const currentHolidays = calendarConfig.holidays || []
          for (const holiday of currentHolidays) {
            await calendarService.removeHoliday(holiday)
          }
          
          for (const holiday of config.holidays) {
            await calendarService.addHoliday(holiday)
          }
          
          loadCalendarConfig()
          alert('Configuración importada correctamente desde Supabase')
        } else {
          throw new Error('Formato de archivo inválido')
        }
      } catch (error) {
        alert(`Error importando configuración: ${error.message}`)
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!calendarConfig) {
    return <div>Cargando configuración...</div>
  }

  const monday = getMonday(currentWeek)
  const weekDays = getWeekDays(monday)
  const weekRange = `${monday.getDate()} ${monday.toLocaleDateString('es-CL', { month: 'short' })} - ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario de Turnos</h1>
          <p className="text-gray-600">Gestión de horarios y tarifas por turnos</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportConfig}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportConfig}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Configuración Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Calendario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tarifas de turnos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Tarifas por Turno</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="firstSecond">1º y 2º Turno (Lun-Sáb)</Label>
                  <Input
                    id="firstSecond"
                    type="number"
                    value={shiftRates.firstSecondShift}
                    onChange={(e) => setShiftRates(prev => ({
                      ...prev,
                      firstSecondShift: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="thirdWeekday">3º Turno (Lun-Vie)</Label>
                  <Input
                    id="thirdWeekday"
                    type="number"
                    value={shiftRates.thirdShiftWeekday}
                    onChange={(e) => setShiftRates(prev => ({
                      ...prev,
                      thirdShiftWeekday: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="thirdSaturday">3º Turno Sábado</Label>
                  <Input
                    id="thirdSaturday"
                    type="number"
                    value={shiftRates.thirdShiftSaturday || shiftRates.thirdShiftSatHoliday}
                    onChange={(e) => setShiftRates(prev => ({
                      ...prev,
                      thirdShiftSaturday: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="holiday">Festivos (Todos)</Label>
                  <Input
                    id="holiday"
                    type="number"
                    value={shiftRates.holiday || shiftRates.thirdShiftSatHoliday}
                    onChange={(e) => setShiftRates(prev => ({
                      ...prev,
                      holiday: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sunday">Domingo (Todos)</Label>
                  <Input
                    id="sunday"
                    type="number"
                    value={shiftRates.sunday}
                    onChange={(e) => setShiftRates(prev => ({
                      ...prev,
                      sunday: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>
              <Button onClick={handleSaveRates} className="mt-4">
                <Save className="h-4 w-4 mr-2" />
                Guardar Tarifas
              </Button>
            </div>

            {/* Gestión de feriados */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Feriados</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  type="date"
                  value={newHoliday}
                  onChange={(e) => setNewHoliday(e.target.value)}
                  placeholder="Seleccionar fecha"
                />
                <Button onClick={handleAddHoliday}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {calendarConfig.holidays.map((holiday) => (
                  <div key={holiday} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{formatStoredDate(holiday)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveHoliday(holiday)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendario Semanal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Semana: {weekRange}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                ← Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                Siguiente →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const isToday = formatDateKey(day) === formatDateKey(new Date())
              const isHolidayDay = isHoliday(day)
              const isSunday = day.getDay() === 0

              return (
                <div
                  key={index}
                  className={`
                    p-4 border rounded-lg text-center space-y-2
                    ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${isHolidayDay ? 'bg-red-50 border-red-200' : ''}
                    ${isSunday ? 'bg-orange-50 border-orange-200' : ''}
                  `}
                >
                  <div>
                    <div className="font-semibold text-sm">
                      {formatDate(day)}
                    </div>
                    {isHolidayDay && (
                      <div className="text-xs text-red-600 font-medium">
                        FERIADO
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="font-medium text-gray-700">Tarifas:</div>
                    {isSunday ? (
                      // Domingo: todos los turnos pagan $35,000
                      <div className="font-semibold text-orange-600">
                        Todos: ${getShiftRate(day, 1).toLocaleString()}
                      </div>
                    ) : isHolidayDay ? (
                      // Feriado (no domingo): todos los turnos pagan $27,500
                      <div className="font-semibold text-red-600">
                        Todos: ${getShiftRate(day, 1).toLocaleString()}
                      </div>
                    ) : (
                      // Días normales: siempre verificar diferencia entre turnos
                      (() => {
                        const rate1 = getShiftRate(day, 1)
                        const rate3 = getShiftRate(day, 3)
                        // Siempre mostrar desglose para días no festivos (incluye sábados)
                        return (
                          <div className="space-y-1">
                            <div>1º/2º: ${rate1.toLocaleString()}</div>
                            <div>3º: ${rate3.toLocaleString()}</div>
                          </div>
                        )
                      })()
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resumen de tarifas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Tarifas Actuales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${calendarConfig.shiftRates.firstSecondShift.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">1º y 2º Turno<br/>(Lun-Sáb)</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${calendarConfig.shiftRates.thirdShiftWeekday.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">3º Turno<br/>(Lun-Vie)</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                ${(calendarConfig.shiftRates.thirdShiftSaturday || calendarConfig.shiftRates.thirdShiftSatHoliday || 27500).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">3º Turno<br/>Sábado</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                ${(calendarConfig.shiftRates.holiday || calendarConfig.shiftRates.thirdShiftSatHoliday || 27500).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Festivos<br/>(Todos)</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ${calendarConfig.shiftRates.sunday.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Domingo</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Calendar
