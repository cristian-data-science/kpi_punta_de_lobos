import { useState, useEffect } from 'react'
import masterDataService from '../services/masterDataService'
import cobrosSupabaseService from '../services/cobrosSupabaseService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import ExcelJS from 'exceljs'
import { 
  DollarSign, 
  Users, 
  Clock, 
  RefreshCw, 
  Calculator,
  Calendar,
  TrendingUp,
  Download,
  Settings,
  FileText,
  BarChart3,
  Save
} from 'lucide-react'

function Cobros() {
  // Estados principales
  const [turnosData, setTurnosData] = useState([])
  const [loading, setLoading] = useState(false)
  const [supabaseStats, setSupabaseStats] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  
  // Estados para filtros
  const [viewMode, setViewMode] = useState('monthly') // 'weekly' o 'monthly'
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [filteredTurnos, setFilteredTurnos] = useState([])
  
  // Estados para configuración de cobros
  const [tarifaCobro, setTarifaCobro] = useState(50000) // Tarifa por turno
  const [showConfig, setShowConfig] = useState(false)
  const [tempTarifa, setTempTarifa] = useState(50000)

  // Cargar datos iniciales
  useEffect(() => {
    loadCobroConfig().then(() => loadTurnosData())
  }, [])

  // Efecto para filtrar cuando cambie el período
  useEffect(() => {
    if (selectedPeriod && turnosData.length > 0) {
      filterTurnosByPeriod(selectedPeriod)
    } else {
      setFilteredTurnos([])
    }
  }, [selectedPeriod, turnosData, viewMode])

  // Cargar configuración de cobros desde Supabase
  const loadCobroConfig = async () => {
    try {
      const { data, error } = await cobrosSupabaseService.supabase
        .from('shift_rates')
        .select('rate_value')
        .eq('rate_name', 'cobro_tarifa')
        .single()
      
      if (error) throw error
      
      const tarifa = data.rate_value || 50000
      setTarifaCobro(tarifa)
      setTempTarifa(tarifa)
      console.log('✅ Tarifa cargada desde Supabase:', tarifa)
    } catch (error) {
      console.error('❌ Error cargando tarifa desde Supabase:', error)
      // Usar valor por defecto
      setTarifaCobro(50000)
      setTempTarifa(50000)
    }
  }

  // Guardar configuración de cobros en Supabase
  const saveCobroConfig = async () => {
    try {
      setLoading(true)
      
      const { error } = await cobrosSupabaseService.supabase
        .from('shift_rates')
        .upsert({
          rate_name: 'cobro_tarifa',
          rate_value: tempTarifa
        }, { onConflict: 'rate_name' })
      
      if (error) throw error
      
      setTarifaCobro(tempTarifa)
      setShowConfig(false)
      
      console.log('✅ Tarifa guardada en Supabase:', tempTarifa)
      
      // Recargar datos
      loadTurnosData()
    } catch (error) {
      console.error('❌ Error guardando tarifa en Supabase:', error)
      alert('Error al guardar la tarifa. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos de turnos COMPLETADOS desde Supabase
  const loadTurnosData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Cargando turnos COMPLETADOS desde Supabase para cobros...')
      
      // Cargar turnos completados desde Supabase
      const turnosCompletados = await cobrosSupabaseService.loadTurnosFromSupabase()
      setTurnosData(turnosCompletados)
      
      // Obtener estadísticas de Supabase
      const stats = await cobrosSupabaseService.getSupabaseStats()
      setSupabaseStats(stats)
      
      setLastUpdate(new Date())
      
      console.log(`✅ ${turnosCompletados.length} turnos COMPLETADOS cargados para cobros`)
      console.log('💡 Solo los turnos completados generan cobros')
      
    } catch (error) {
      console.error('❌ Error cargando datos de turnos desde Supabase:', error)
      // Fallback a localStorage si hay error
      console.log('🔄 Usando fallback a localStorage...')
      const shifts = masterDataService.getWorkerShifts()
      setTurnosData(shifts)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar turnos por período seleccionado
  const filterTurnosByPeriod = (period) => {
    if (!period || !turnosData.length) {
      setFilteredTurnos([])
      return
    }

    let filtered = []

    if (viewMode === 'monthly') {
      const [year, monthNum] = period.split('-')
      filtered = turnosData.filter(turno => {
        const turnoDate = new Date(turno.fecha)
        return turnoDate.getFullYear() === parseInt(year) && 
               (turnoDate.getMonth() + 1) === parseInt(monthNum)
      })
    } else if (viewMode === 'weekly') {
      // Para modo semanal, esperamos format 'YYYY-Www' como '2025-W35'
      const [year, week] = period.split('-W')
      const targetWeek = parseInt(week)
      
      filtered = turnosData.filter(turno => {
        const turnoDate = new Date(turno.fecha)
        const turnoWeek = getWeekNumberForDate(turnoDate)
        return turnoWeek === targetWeek
      })
    }

    setFilteredTurnos(filtered)
  }

  // Obtener inicio de semana para un año y número de semana
  const getStartOfWeek = (year, week) => {
    // Usar algoritmo ISO 8601 mejorado
    const jan4 = new Date(year, 0, 4) // 4 de enero siempre está en la semana 1
    const jan4Day = jan4.getDay() || 7 // Lunes = 1, Domingo = 7
    const week1Monday = new Date(jan4)
    week1Monday.setDate(jan4.getDate() - jan4Day + 1) // Retroceder al lunes de esa semana
    
    // Calcular el lunes de la semana deseada
    const targetMonday = new Date(week1Monday)
    targetMonday.setDate(week1Monday.getDate() + (week - 1) * 7)
    
    return targetMonday
  }

  // Obtener fechas de inicio y fin de una semana
  const getWeekDates = (year, week) => {
    const startDate = getStartOfWeek(year, week)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    return { startDate, endDate }
  }

  // Obtener períodos disponibles para filtro
  const getAvailablePeriods = () => {
    if (!turnosData.length) return []
    
    const periods = new Set()
    
    turnosData.forEach(turno => {
      const date = new Date(turno.fecha)
      
      if (viewMode === 'monthly') {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        periods.add(monthKey)
      } else if (viewMode === 'weekly') {
        // Encontrar en qué semana cae esta fecha
        const weekNumber = getWeekNumberForDate(date)
        const weekKey = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
        periods.add(weekKey)
      }
    })
    
    return Array.from(periods).sort().reverse()
  }

  // Obtener número de semana para una fecha específica (algoritmo ISO 8601 adaptado para turnos)
  const getWeekNumberForDate = (date) => {
    // Crear una copia de la fecha para evitar modificarla
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Para turnos laborales, si es domingo, usar el lunes siguiente para calcular la semana
    const dayOfWeek = d.getDay()
    const calculationDate = new Date(d)
    
    if (dayOfWeek === 0) { // Si es domingo
      calculationDate.setDate(d.getDate() + 1) // Usar el lunes siguiente
    }
    
    // Obtener el jueves de esta semana (para determinar el año ISO)
    const calcDayOfWeek = calculationDate.getDay() || 7 // Lunes = 1, Domingo = 7
    const thursday = new Date(calculationDate)
    thursday.setDate(calculationDate.getDate() + 4 - calcDayOfWeek)
    
    // El año ISO es el año del jueves de esta semana
    const isoYear = thursday.getFullYear()
    
    // Obtener el primer jueves del año ISO
    const jan4 = new Date(isoYear, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const firstThursday = new Date(jan4)
    firstThursday.setDate(jan4.getDate() - jan4Day + 4)
    
    // Calcular número de semana
    const weekNumber = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    
    return weekNumber
  }

  // Obtener número de semana del año (mantenido para compatibilidad)
  const getWeekNumber = (date) => {
    return getWeekNumberForDate(date)
  }

  // Formatear período para mostrar
  const formatPeriodLabel = (period) => {
    if (viewMode === 'monthly') {
      const [year, month] = period.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    } else if (viewMode === 'weekly') {
      const [year, week] = period.split('-W')
      const { startDate, endDate } = getWeekDates(parseInt(year), parseInt(week))
      
      const formatDate = (date) => {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
      }
      
      return `Semana ${week} de ${year} (${formatDate(startDate)} - ${formatDate(endDate)})`
    }
    return period
  }

  // Obtener datos actuales (filtrados o todos)
  const getCurrentTurnosData = () => {
    return selectedPeriod && filteredTurnos.length > 0 ? filteredTurnos : turnosData
  }

  // Calcular total de turnos
  const getTotalTurnos = () => {
    return getCurrentTurnosData().length
  }

  // Calcular total a cobrar usando valores guardados en BD
  const getTotalCobrar = () => {
    const currentData = getCurrentTurnosData()
    return currentData.reduce((total, turno) => total + (turno.cobro || 0), 0)
  }

  // Calcular turnos por trabajador usando cobros guardados
  const getTurnosPorTrabajador = () => {
    const currentData = getCurrentTurnosData()
    const trabajadores = new Map()
    
    currentData.forEach(turno => {
      const nombre = turno.conductorNombre
      if (!trabajadores.has(nombre)) {
        trabajadores.set(nombre, {
          nombre,
          turnos: 0,
          totalCobro: 0
        })
      }
      
      const trabajador = trabajadores.get(nombre)
      trabajador.turnos++
      trabajador.totalCobro += (turno.cobro || 0)  // ✅ USAR COBRO GUARDADO
    })
    
    return Array.from(trabajadores.values()).sort((a, b) => b.turnos - a.turnos)
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    // Crear fecha en timezone local para evitar problemas de UTC
    const [year, month, day] = dateString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date)
  }

  // Exportar a Excel
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook()
      const currentData = getCurrentTurnosData()
      const trabajadoresData = getTurnosPorTrabajador()
      
      // Metadatos
      workbook.creator = 'TransApp'
      workbook.created = new Date()
      
      // Hoja de resumen
      const summarySheet = workbook.addWorksheet('Resumen de Cobros')
      
      // Título profesional con gradiente visual
      const titleRow = summarySheet.addRow(['RESUMEN DE COBROS - TRANSAPP'])
      titleRow.font = { size: 18, bold: true, color: { argb: 'FFFFFF' }, name: 'Arial Black' }
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } }
      titleRow.alignment = { horizontal: 'left', vertical: 'middle' }
      titleRow.border = {
        top: { style: 'thick', color: { argb: '1E40AF' } },
        left: { style: 'thick', color: { argb: '1E40AF' } },
        bottom: { style: 'thick', color: { argb: '1E40AF' } },
        right: { style: 'thick', color: { argb: '1E40AF' } }
      }
      summarySheet.mergeCells('A1:D1')
      titleRow.height = 40
      
      // Información del período con estilo empresarial
      const periodInfo = selectedPeriod ? formatPeriodLabel(selectedPeriod) : 'Todos los períodos'
      const periodRow = summarySheet.addRow(['Período:', periodInfo, '', ''])
      periodRow.font = { size: 11, bold: true, color: { argb: '374151' } }
      periodRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } }
      periodRow.alignment = { horizontal: 'left', vertical: 'middle' }
      periodRow.height = 22
      
      const tarifaRow = summarySheet.addRow(['Tarifa por turno:', formatCurrency(tarifaCobro), '', ''])
      tarifaRow.font = { size: 11, bold: true, color: { argb: '374151' } }
      tarifaRow.getCell(2).font = { size: 11, bold: true, color: { argb: '059669' } }
      tarifaRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } }
      tarifaRow.alignment = { horizontal: 'left', vertical: 'middle' }
      tarifaRow.height = 22
      
      const fechaRow = summarySheet.addRow(['Fecha de exportación:', new Date().toLocaleDateString('es-CL'), '', ''])
      fechaRow.font = { size: 11, color: { argb: '6B7280' } }
      fechaRow.getCell(1).font = { size: 11, bold: true, color: { argb: '374151' } }
      fechaRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } }
      fechaRow.alignment = { horizontal: 'left', vertical: 'middle' }
      fechaRow.height = 22
      
      summarySheet.addRow(['']) // Espacio
      
      // Resumen general con diseño destacado
      const resumenRow = summarySheet.addRow(['RESUMEN GENERAL'])
      resumenRow.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } }
      resumenRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } }
      resumenRow.alignment = { horizontal: 'left', vertical: 'middle' }
      resumenRow.border = {
        top: { style: 'medium', color: { argb: '991B1B' } },
        left: { style: 'medium', color: { argb: '991B1B' } },
        bottom: { style: 'medium', color: { argb: '991B1B' } },
        right: { style: 'medium', color: { argb: '991B1B' } }
      }
      resumenRow.height = 28
      
      const totalTurnosRow = summarySheet.addRow(['Total de turnos:', getTotalTurnos()])
      totalTurnosRow.font = { size: 12, bold: true, color: { argb: '1F2937' } }
      totalTurnosRow.getCell(2).font = { size: 12, bold: true, color: { argb: '7C3AED' } }
      totalTurnosRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3F2' } }
      totalTurnosRow.alignment = { horizontal: 'left', vertical: 'middle' }
      totalTurnosRow.height = 24
      
      const totalCobrarRow = summarySheet.addRow(['Total a cobrar:', formatCurrency(getTotalCobrar())])
      totalCobrarRow.font = { size: 12, bold: true, color: { argb: '1F2937' } }
      totalCobrarRow.getCell(2).font = { size: 12, bold: true, color: { argb: '059669' } }
      totalCobrarRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3F2' } }
      totalCobrarRow.alignment = { horizontal: 'left', vertical: 'middle' }
      totalCobrarRow.height = 24
      
      summarySheet.addRow(['']) // Espacio
      
      // Resumen por trabajador con estilo tabla profesional
      const resumenTrabajadorRow = summarySheet.addRow(['RESUMEN POR TRABAJADOR'])
      resumenTrabajadorRow.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } }
      resumenTrabajadorRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } }
      resumenTrabajadorRow.alignment = { horizontal: 'left', vertical: 'middle' }
      resumenTrabajadorRow.border = {
        top: { style: 'medium', color: { argb: '047857' } },
        left: { style: 'medium', color: { argb: '047857' } },
        bottom: { style: 'medium', color: { argb: '047857' } },
        right: { style: 'medium', color: { argb: '047857' } }
      }
      resumenTrabajadorRow.height = 28
      
      const headerRow = summarySheet.addRow(['Trabajador', 'Turnos', 'Total a Cobrar', 'Tarifa'])
      headerRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '374151' } }
      headerRow.alignment = { horizontal: 'left', vertical: 'middle' }
      headerRow.height = 25
      
      // Aplicar bordes profesionales a los headers
      for (let col = 1; col <= 4; col++) {
        const cell = headerRow.getCell(col)
        cell.border = {
          top: { style: 'medium', color: { argb: '1F2937' } },
          left: { style: 'medium', color: { argb: '1F2937' } },
          bottom: { style: 'medium', color: { argb: '1F2937' } },
          right: { style: 'medium', color: { argb: '1F2937' } }
        }
      }
      
      trabajadoresData.forEach((trabajador, index) => {
        const dataRow = summarySheet.addRow([
          trabajador.nombre,
          trabajador.turnos,
          formatCurrency(trabajador.totalCobro),
          formatCurrency(tarifaCobro)
        ])
        
        // Colores alternados profesionales
        const bgColor = index % 2 === 0 ? 'FFFFFF' : 'F8FAFC'
        dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
        dataRow.alignment = { horizontal: 'left', vertical: 'middle' }
        dataRow.height = 22
        
        // Estilos específicos por columna
        for (let col = 1; col <= 4; col++) {
          const cell = dataRow.getCell(col)
          
          switch (col) {
            case 1: // Trabajador
              cell.font = { size: 11, bold: true, color: { argb: '1E40AF' } }
              break
            case 2: // Turnos
              cell.font = { size: 11, bold: true, color: { argb: '7C3AED' } }
              break
            case 3: // Total a Cobrar
              cell.font = { size: 11, bold: true, color: { argb: '059669' } }
              cell.numFmt = '"$"#,##0'
              break
            case 4: // Tarifa
              cell.font = { size: 11, color: { argb: '6B7280' } }
              cell.numFmt = '"$"#,##0'
              break
          }
          
          // Bordes elegantes
          cell.border = {
            top: { style: 'thin', color: { argb: 'E5E7EB' } },
            left: { style: 'thin', color: { argb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
            right: { style: 'thin', color: { argb: 'E5E7EB' } }
          }
        }
      })
      
      // Hoja de detalles con estilo profesional
      const detailSheet = workbook.addWorksheet('Detalle de Turnos')
      detailSheet.views = [{ showGridLines: false }]
      
      // Título de la hoja de detalles
      const detailTitleRow = detailSheet.addRow(['DETALLE COMPLETO DE TURNOS'])
      detailTitleRow.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } }
      detailTitleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } }
      detailTitleRow.alignment = { horizontal: 'left', vertical: 'middle' }
      detailTitleRow.border = {
        top: { style: 'thick', color: { argb: 'B91C1C' } },
        left: { style: 'thick', color: { argb: 'B91C1C' } },
        bottom: { style: 'thick', color: { argb: 'B91C1C' } },
        right: { style: 'thick', color: { argb: 'B91C1C' } }
      }
      detailSheet.mergeCells('A1:E1')
      detailTitleRow.height = 35
      
      // Espaciado
      detailSheet.addRow([''])
      
      // Encabezados con estilo empresarial
      const detailHeaderRow = detailSheet.addRow(['Fecha', 'Día', 'Trabajador', 'Turno', 'Cobro'])
      detailHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
      detailHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6B7280' } }
      detailHeaderRow.alignment = { horizontal: 'left', vertical: 'middle' }
      detailHeaderRow.height = 26
      
      // Aplicar bordes profesionales a los headers de detalles
      for (let col = 1; col <= 5; col++) {
        const cell = detailHeaderRow.getCell(col)
        cell.border = {
          top: { style: 'medium', color: { argb: '4B5563' } },
          left: { style: 'medium', color: { argb: '4B5563' } },
          bottom: { style: 'medium', color: { argb: '4B5563' } },
          right: { style: 'medium', color: { argb: '4B5563' } }
        }
      }
      
      // Datos detallados con formato profesional
      currentData
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .forEach((turno, index) => {
          const detailRow = detailSheet.addRow([
            turno.fecha,
            formatDate(turno.fecha),
            turno.conductorNombre,
            turno.turno,
            formatCurrency(tarifaCobro)
          ])
          
          // Colores alternados elegantes
          const bgColor = index % 2 === 0 ? 'FFFFFF' : 'F1F5F9'
          detailRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
          detailRow.alignment = { horizontal: 'left', vertical: 'middle' }
          detailRow.height = 20
          
          // Estilos específicos por columna en detalles
          for (let col = 1; col <= 5; col++) {
            const cell = detailRow.getCell(col)
            
            switch (col) {
              case 1: // Fecha
                cell.font = { size: 10, bold: true, color: { argb: '1F2937' } }
                break
              case 2: // Día
                cell.font = { size: 10, color: { argb: '6366F1' } }
                break
              case 3: // Trabajador
                cell.font = { size: 10, bold: true, color: { argb: '1E40AF' } }
                break
              case 4: // Turno
                cell.font = { size: 10, color: { argb: 'DC2626' } }
                break
              case 5: // Cobro
                cell.font = { size: 10, bold: true, color: { argb: '059669' } }
                cell.numFmt = '"$"#,##0'
                break
            }
            
            // Bordes sutiles para los detalles
            cell.border = {
              top: { style: 'thin', color: { argb: 'E5E7EB' } },
              left: { style: 'thin', color: { argb: 'E5E7EB' } },
              bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
              right: { style: 'thin', color: { argb: 'E5E7EB' } }
            }
          }
        })
      
      // Configurar anchos de columna optimizados
      summarySheet.columns = [
        { width: 25 }, // Trabajador
        { width: 12 }, // Turnos
        { width: 18 }, // Total a Cobrar
        { width: 15 }  // Tarifa
      ]
      
      detailSheet.columns = [
        { width: 12 }, // Fecha
        { width: 15 }, // Día
        { width: 25 }, // Trabajador
        { width: 15 }, // Turno
        { width: 15 }  // Cobro
      ]
      
      // Generar y descargar archivo
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const periodLabel = selectedPeriod ? `_${formatPeriodLabel(selectedPeriod).replace(/\s+/g, '_')}` : '_Todos'
      link.download = `Cobros_TransApp${periodLabel}.xlsx`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error al exportar:', error)
      alert('Error al generar el archivo Excel')
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cobros</h1>
          <p className="text-gray-600 mt-1">Gestión de cobros por servicios de transporte</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar Tarifa
          </Button>
          <Button
            onClick={loadTurnosData}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Información sobre turnos completados */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 rounded-full p-1 mt-0.5">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-blue-800 font-semibold mb-1">Solo turnos completados generan cobros</h3>
            <p className="text-blue-700 text-sm">
              Tarifa fija de {formatCurrency(tarifaCobro)} por turno completado
              {supabaseStats && (
                <span className="font-medium">
                  {' '}• Total disponible: {supabaseStats.turnosCompletados || 0} turnos completados
                  {supabaseStats.turnosProgramados > 0 && 
                    ` (${supabaseStats.turnosProgramados} programados no incluidos)`}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Panel de configuración de tarifa */}
      {showConfig && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Settings className="h-5 w-5" />
              Configuración de Tarifa de Cobro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tarifa">Tarifa por turno</Label>
                <Input
                  id="tarifa"
                  type="number"
                  value={tempTarifa}
                  onChange={(e) => setTempTarifa(parseInt(e.target.value) || 0)}
                  placeholder="Ingrese la tarifa por turno"
                  className="mt-2"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Valor actual: {formatCurrency(tempTarifa)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Esta tarifa se guarda en Supabase y se aplica a todos los turnos completados
                </p>
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={saveCobroConfig} 
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTempTarifa(tarifaCobro)
                    setShowConfig(false)
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de modo de vista */}
            <div>
              <Label>Tipo de período</Label>
              <select
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value)
                  setSelectedPeriod('')
                }}
                className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Mensual</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>

            {/* Selector de período */}
            <div>
              <Label>
                {viewMode === 'monthly' ? 'Mes' : 'Semana'}
              </Label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los períodos</option>
                {getAvailablePeriods().map(period => (
                  <option key={period} value={period}>
                    {formatPeriodLabel(period)}
                  </option>
                ))}
              </select>
            </div>

            {/* Información actual */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <div>Tarifa actual: <span className="font-semibold text-blue-600">{formatCurrency(tarifaCobro)}</span></div>
                <div>Última actualización: {lastUpdate?.toLocaleTimeString('es-CL')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total a Cobrar</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalCobrar())}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Turnos</p>
                <p className="text-2xl font-bold text-blue-600">{getTotalTurnos()}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trabajadores</p>
                <p className="text-2xl font-bold text-purple-600">{getTurnosPorTrabajador().length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tarifa por Turno</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(tarifaCobro)}</p>
              </div>
              <Calculator className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen por trabajador */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Resumen por Trabajador ({getTurnosPorTrabajador().length})
            </CardTitle>
            <Button 
              onClick={exportToExcel}
              className="flex items-center gap-2"
              disabled={getTotalTurnos() === 0}
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {getTurnosPorTrabajador().length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Trabajador</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Turnos</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total a Cobrar</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Tarifa</th>
                  </tr>
                </thead>
                <tbody>
                  {getTurnosPorTrabajador().map((trabajador, index) => (
                    <tr key={trabajador.nombre} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {trabajador.nombre?.charAt(0).toUpperCase() || 'T'}
                          </div>
                          <span className="font-medium text-gray-900">{trabajador.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {trabajador.turnos}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">
                        {formatCurrency(trabajador.totalCobro)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {formatCurrency(tarifaCobro)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos para mostrar</h3>
              <p className="text-gray-600">
                {selectedPeriod 
                  ? `No se encontraron turnos para ${formatPeriodLabel(selectedPeriod)}`
                  : 'No hay turnos registrados en el sistema'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Total bruto a cobrar</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(getTotalCobrar())}</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Promedio por trabajador</span>
                <span className="text-sm text-gray-600">
                  {getTurnosPorTrabajador().length > 0 
                    ? formatCurrency(getTotalCobrar() / getTurnosPorTrabajador().length)
                    : formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Tarifa configurada</span>
                <span className="text-sm font-semibold text-blue-600">
                  {formatCurrency(tarifaCobro)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Información del Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Período seleccionado</span>
                <span className="text-sm text-gray-600">
                  {selectedPeriod ? formatPeriodLabel(selectedPeriod) : 'Todos los períodos'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Tipo de vista</span>
                <span className="text-sm text-gray-600">
                  {viewMode === 'monthly' ? 'Mensual' : 'Semanal'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Modo de cálculo</span>
                <span className="text-sm font-semibold text-blue-600">Manual (Tarifa Fija)</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Total de trabajadores</span>
                <span className="text-sm text-gray-600">{getTurnosPorTrabajador().length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Cobros
