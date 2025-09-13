import { useState, useEffect } from 'react'
import masterDataService from '../services/masterDataService'
import paymentsSupabaseService from '../services/paymentsSupabaseService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import ExcelJS from 'exceljs'
import { 
  DollarSign, 
  Users, 
  Clock, 
  RefreshCw, 
  ChevronDown, 
  TrendingUp, 
  Calendar,
  Gift,
  Star,
  Download
} from 'lucide-react'

function Payments() {
  const [workerPayments, setWorkerPayments] = useState([])
  const [expandedWorkers, setExpandedWorkers] = useState(new Set())
  const [lastUpdate, setLastUpdate] = useState(null)
  const [loading, setLoading] = useState(false) // Estado de carga
  
  // Estados para el filtro de mes
  const [viewMode, setViewMode] = useState('total') // 'total' o 'monthly'
  const [selectedMonth, setSelectedMonth] = useState('') // Mes seleccionado para filtrar
  const [filteredPayments, setFilteredPayments] = useState([])

  // Obtener número de semana para una fecha específica (algoritmo adaptado para la empresa)
  const getWeekNumberForDate = (date) => {
    // Crear una copia de la fecha para evitar modificarla
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Para la lógica de la empresa: el domingo pertenece a la semana anterior
    const calculationDate = new Date(d)
    
    if (d.getDay() === 0) { // Si es domingo
      // Retroceder al lunes anterior para calcular la semana
      calculationDate.setDate(d.getDate() - 6)
    }
    
    // Obtener el jueves de esta semana (para determinar el año ISO)
    const dayOfWeek = calculationDate.getDay() // 0=dom, 1=lun, ..., 6=sab
    const thursday = new Date(calculationDate)
    
    // Calcular días para llegar al jueves desde el día actual
    const daysToThursday = 4 - dayOfWeek // Días para llegar al jueves
    thursday.setDate(calculationDate.getDate() + daysToThursday)
    
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

  // Cargar datos de pagos - USANDO SUPABASE
  const loadPaymentData = async () => {
    setLoading(true)
    try {
      console.log('💰 Cargando datos de pagos desde Supabase...')
      
      const payments = await paymentsSupabaseService.calculateWorkerPayments()
      setWorkerPayments(payments)
      setLastUpdate(new Date())
      
      console.log(`✅ Pagos cargados: ${payments.length} trabajadores procesados`)
      
      // Si estamos en modo mensual y hay un mes seleccionado, filtrar
      if (viewMode === 'monthly' && selectedMonth) {
        filterPaymentsByMonth(payments, selectedMonth)
      }
    } catch (error) {
      console.error('❌ Error cargando datos de pagos:', error)
      setWorkerPayments([])
    } finally {
      setLoading(false)
    }
  }

  // Función para filtrar pagos por mes
  const filterPaymentsByMonth = (payments, month) => {
    if (!month || viewMode !== 'monthly') {
      setFilteredPayments([])
      return
    }

    const [year, monthNum] = month.split('-')
    const filtered = payments.map(worker => {
      // Filtrar turnos del trabajador por el mes seleccionado
      const turnosDelMes = worker.turnos.filter(turno => {
        // Usar timezone local para consistencia
        const [year, month, day] = turno.fecha.split('-')
        const turnoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        
        return turnoDate.getFullYear() === parseInt(year) && 
               (turnoDate.getMonth() + 1) === parseInt(monthNum)
      })

      if (turnosDelMes.length === 0) return null

      // Recalcular estadísticas para el mes usando campo 'pago' guardado
      const totalMonto = turnosDelMes.reduce((sum, turno) => sum + (turno.tarifa || 0), 0)
      const feriadosTrabajados = turnosDelMes.filter(turno => turno.isHoliday && !turno.isSunday).length
      const domingosTrabajados = turnosDelMes.filter(turno => turno.isSunday).length

      // Recalcular desgloses usando pagos guardados
      const desglosePorTipo = {}
      const desglosePorDia = {}

      turnosDelMes.forEach(turno => {
        const pagoTurno = turno.tarifa || 0  // 'tarifa' viene del campo 'pago' de Supabase
        
        // Por tipo de turno
        if (!desglosePorTipo[turno.turno]) {
          desglosePorTipo[turno.turno] = { cantidad: 0, monto: 0 }
        }
        desglosePorTipo[turno.turno].cantidad++
        desglosePorTipo[turno.turno].monto += pagoTurno

        // Por tipo de día
        if (!desglosePorDia[turno.categoriasDia]) {
          desglosePorDia[turno.categoriasDia] = { cantidad: 0, monto: 0 }
        }
        desglosePorDia[turno.categoriasDia].cantidad++
        desglosePorDia[turno.categoriasDia].monto += pagoTurno
      })

      return {
        ...worker,
        turnos: turnosDelMes,
        totalTurnos: turnosDelMes.length,
        totalMonto,
        feriadosTrabajados,
        domingosTrabajados,
        desglosePorTipo,
        desglosePorDia
      }
    }).filter(worker => worker !== null)

    setFilteredPayments(filtered)
  }

  // Función para obtener los datos actuales (total o filtrados)
  const getCurrentPaymentsData = () => {
    return viewMode === 'monthly' && selectedMonth ? filteredPayments : workerPayments
  }

  // Función para obtener los meses disponibles
  const getAvailableMonths = () => {
    const months = new Set()
    workerPayments.forEach(worker => {
      worker.turnos.forEach(turno => {
        const date = new Date(turno.fecha)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        months.add(monthKey)
      })
    })
    return Array.from(months).sort().reverse() // Más recientes primero
  }

  useEffect(() => {
    loadPaymentData()
  }, [])

  // Efecto para filtrar cuando cambie el mes seleccionado
  useEffect(() => {
    if (viewMode === 'monthly' && selectedMonth) {
      filterPaymentsByMonth(workerPayments, selectedMonth)
    } else {
      setFilteredPayments([])
    }
  }, [selectedMonth, viewMode, workerPayments])

  // Función para expandir/colapsar trabajadores
  const toggleWorkerExpansion = (workerName) => {
    setExpandedWorkers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(workerName)) {
        newSet.delete(workerName)
      } else {
        newSet.add(workerName)
      }
      return newSet
    })
  }

  // Función para expandir/colapsar todos los trabajadores
  const toggleAllWorkers = () => {
    const currentData = getCurrentPaymentsData()
    if (expandedWorkers.size === currentData.length) {
      setExpandedWorkers(new Set())
    } else {
      setExpandedWorkers(new Set(currentData.map(worker => worker.conductorNombre)))
    }
  }

  // Funciones para obtener estadísticas (usando datos actuales)
  const getTotalPayments = () => {
    const currentData = getCurrentPaymentsData()
    return currentData.reduce((total, worker) => total + worker.totalMonto, 0)
  }

  const getTotalShifts = () => {
    const currentData = getCurrentPaymentsData()
    return currentData.reduce((total, worker) => total + worker.totalTurnos, 0)
  }

  const getTotalHolidays = () => {
    const currentData = getCurrentPaymentsData()
    return currentData.reduce((total, worker) => total + worker.feriadosTrabajados, 0)
  }

  const getTotalSundays = () => {
    const currentData = getCurrentPaymentsData()
    return currentData.reduce((total, worker) => total + worker.domingosTrabajados, 0)
  }

  // Función para detectar problemas con fechas/turnos
  const getDateWarnings = () => {
    if (viewMode !== 'monthly' || !selectedMonth) return null

    const [year, monthNum] = selectedMonth.split('-')
    const monthName = new Date(year, monthNum - 1).toLocaleDateString('es-CL', { 
      month: 'long', 
      year: 'numeric' 
    })
    
    // Obtener todos los días del mes (1 al último día)
    const totalDaysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate()
    const allDaysInMonth = Array.from({length: totalDaysInMonth}, (_, i) => i + 1)
    
    // Obtener todos los turnos del mes de TODOS los trabajadores (no filtrados)
    const allWorkers = workerPayments
    const allTurnosInMonth = []
    
    allWorkers.forEach(worker => {
      worker.turnos.forEach(turno => {
        // Usar timezone local para consistencia
        const [year, month, day] = turno.fecha.split('-')
        const turnoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        
        if (turnoDate.getFullYear() === parseInt(year) && 
            (turnoDate.getMonth() + 1) === parseInt(monthNum)) {
          allTurnosInMonth.push({
            ...turno,
            day: turnoDate.getDate()
          })
        }
      })
    })

    // Obtener días que aparecen en registros (tienen al menos una fecha)
    const daysWithRecords = [...new Set(allTurnosInMonth.map(turno => turno.day))].sort((a, b) => a - b)
    
    // Encontrar días completamente faltantes (no aparecen en ningún registro)
    const missingDays = allDaysInMonth.filter(day => !daysWithRecords.includes(day))
    
    // ELIMINADO: La lógica de daysWithoutShifts era incorrecta
    // Si un día está en daysWithRecords, significa que SÍ tiene turnos
    // Por lo tanto, esta validación siempre retornaba array vacío

    // Verificar si hay datos filtrados para mostrar el warning de "sin datos"
    const currentData = getCurrentPaymentsData()
    if (currentData.length === 0 && allTurnosInMonth.length > 0) {
      return {
        type: 'no-data',
        message: `No hay turnos para ningún trabajador en ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`
      }
    }

    // Warning por días completamente faltantes (prioritario)
    if (missingDays.length > 0) {
      const daysList = missingDays.length > 10 
        ? `${missingDays.slice(0, 10).join(', ')} y ${missingDays.length - 10} más`
        : missingDays.join(', ')
      
      return {
        type: 'missing-days',
        message: `Faltan registros para ${missingDays.length} día(s) en ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}: día ${daysList}`,
        count: missingDays.length,
        days: missingDays
      }
    }

    // ELIMINADO: Warning por días sin turnos ya que la lógica era incorrecta
    // Si daysWithRecords contiene un día, significa que SÍ tiene turnos

    // Warning si el mes está muy incompleto (menos del 80% de días)
    const completionRate = (daysWithRecords.length / totalDaysInMonth) * 100
    if (completionRate < 80) {
      return {
        type: 'incomplete-month',
        message: `El mes ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} está incompleto: solo ${daysWithRecords.length} de ${totalDaysInMonth} días tienen registros (${Math.round(completionRate)}%)`,
        completionRate: Math.round(completionRate)
      }
    }

    return null
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

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

  // Función para exportar a Excel
  const exportToExcel = async () => {
    try {
      const currentData = getCurrentPaymentsData()
      const workbook = new ExcelJS.Workbook()
      
      // Metadatos del workbook
      workbook.creator = 'TransApp - Sistema de Gestión de Transporte'
      workbook.created = new Date()
      workbook.description = 'Reporte de Pagos por Turnos de Trabajadores'
      workbook.company = 'TransApp'
      
      // HOJA 1: RESUMEN - Nombre corto para evitar truncamiento
      let sheetTitle = 'Resumen'
      if (viewMode === 'monthly' && selectedMonth) {
        const [year, month] = selectedMonth.split('-')
        const monthName = new Date(year, month - 1).toLocaleDateString('es-CL', { month: 'short' })
        sheetTitle = `${monthName.replace('.', '').charAt(0).toUpperCase() + monthName.replace('.', '').slice(1)} ${year}`
      }
      
      const worksheet = workbook.addWorksheet(sheetTitle)
      worksheet.views = [{ showGridLines: false }]

      // Título principal con diseño ejecutivo
      const titleRow = worksheet.addRow(['REPORTE DE PAGOS POR TURNOS - TRANSAPP'])
      titleRow.font = { size: 20, bold: true, color: { argb: 'FFFFFF' }, name: 'Arial Black' }
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } }
      titleRow.alignment = { horizontal: 'left', vertical: 'middle' }
      titleRow.border = {
        top: { style: 'thick', color: { argb: '1E40AF' } },
        left: { style: 'thick', color: { argb: '1E40AF' } },
        bottom: { style: 'thick', color: { argb: '1E40AF' } },
        right: { style: 'thick', color: { argb: '1E40AF' } }
      }
      worksheet.mergeCells('A1:E1')
      titleRow.height = 40

      // Línea de separación
      worksheet.addRow([''])

      // Información del reporte con estilo empresarial
      const infoHeaderRow = worksheet.addRow(['INFORMACIÓN DEL REPORTE'])
      infoHeaderRow.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } }
      infoHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } }
      infoHeaderRow.alignment = { horizontal: 'left', vertical: 'middle' }
      infoHeaderRow.border = {
        top: { style: 'medium', color: { argb: 'DC2626' } },
        left: { style: 'medium', color: { argb: 'DC2626' } },
        bottom: { style: 'medium', color: { argb: 'DC2626' } },
        right: { style: 'medium', color: { argb: 'DC2626' } }
      }
      worksheet.mergeCells('A3:E3')
      infoHeaderRow.height = 28

      const periodRow = worksheet.addRow(['Período:', viewMode === 'monthly' && selectedMonth ? `${sheetTitle}` : 'Todos los períodos', '', '', ''])
      periodRow.font = { size: 11, color: { argb: '374151' } }
      periodRow.getCell(1).font = { size: 11, bold: true, color: { argb: '1F2937' } }
      periodRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } }
      periodRow.alignment = { horizontal: 'left', vertical: 'middle' }
      periodRow.height = 22

      const fechaRow = worksheet.addRow(['Fecha de exportación:', new Date().toLocaleDateString('es-CL'), '', '', ''])
      fechaRow.font = { size: 11, color: { argb: '6B7280' } }
      fechaRow.getCell(1).font = { size: 11, bold: true, color: { argb: '1F2937' } }
      fechaRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } }
      fechaRow.alignment = { horizontal: 'left', vertical: 'middle' }
      fechaRow.height = 22

      const totalGeneralRow = worksheet.addRow(['Total general a pagar:', formatCurrency(getTotalPayments()), '', '', ''])
      totalGeneralRow.font = { size: 12, bold: true, color: { argb: '1F2937' } }
      totalGeneralRow.getCell(1).font = { size: 12, bold: true, color: { argb: '1F2937' } }
      totalGeneralRow.getCell(2).font = { size: 12, bold: true, color: { argb: '059669' } }
      totalGeneralRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } }
      totalGeneralRow.alignment = { horizontal: 'left', vertical: 'middle' }
      totalGeneralRow.height = 25

      // Línea de separación
      worksheet.addRow([''])

      // Encabezado de la tabla principal con estilo premium
      const headerRow = worksheet.addRow(['Trabajador', 'Total Turnos', 'Feriados', 'Domingos', 'Total a Pagar'])
      headerRow.font = { size: 13, bold: true, color: { argb: 'FFFFFF' } }
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } }
      headerRow.alignment = { horizontal: 'left', vertical: 'middle' }
      headerRow.border = {
        top: { style: 'medium', color: { argb: '047857' } },
        left: { style: 'medium', color: { argb: '047857' } },
        bottom: { style: 'medium', color: { argb: '047857' } },
        right: { style: 'medium', color: { argb: '047857' } }
      }
      headerRow.height = 30

      // Agregar datos con estilos alternados profesionales
      currentData.forEach((worker, index) => {
        const row = worksheet.addRow([
          worker.conductorNombre,
          worker.totalTurnos,
          worker.feriadosTrabajados,
          worker.domingosTrabajados,
          worker.totalMonto
        ])

        // Colores alternados para mejor legibilidad
        const backgroundColor = index % 2 === 0 ? 'FFFFFF' : 'F8FAFC'
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: backgroundColor } }
        
        // Estilos específicos por columna
        row.getCell(1).font = { size: 11, color: { argb: '1F2937' } } // Trabajador - texto normal
        row.getCell(2).font = { size: 11, color: { argb: '374151' } } // Total Turnos - número
        row.getCell(3).font = { size: 11, color: { argb: 'DC2626' } } // Feriados - rojo
        row.getCell(4).font = { size: 11, color: { argb: '7C3AED' } } // Domingos - púrpura
        row.getCell(5).font = { size: 11, bold: true, color: { argb: '059669' } } // Total - verde
        
        row.alignment = { horizontal: 'left', vertical: 'middle' }
        row.height = 25
        
        // Bordes profesionales
        row.border = {
          top: { style: 'thin', color: { argb: 'E5E7EB' } },
          left: { style: 'thin', color: { argb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
          right: { style: 'thin', color: { argb: 'E5E7EB' } }
        }
      })

      // Agregar fila de totales
      const totalRow = worksheet.addRow([
        'TOTAL GENERAL',
        getTotalShifts(),
        getTotalHolidays(),
        getTotalSundays(),
        getTotalPayments()
      ])

      // Estilizar fila de totales
      totalRow.eachCell((cell, colNumber) => {
        if (colNumber <= 5) { // Solo aplicar a las 5 columnas que usamos
          cell.font = { size: 11, bold: true, color: { argb: 'FFFFFF' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } }
          cell.border = {
            top: { style: 'medium', color: { argb: '000000' } },
            left: { style: 'medium', color: { argb: '000000' } },
            bottom: { style: 'medium', color: { argb: '000000' } },
            right: { style: 'medium', color: { argb: '000000' } }
          }
          cell.alignment = { horizontal: 'left', vertical: 'middle' }
          
          if (colNumber === 5) { // Solo la columna monetaria
            cell.numFmt = '"$"#,##0'
          }
        }
      })
      totalRow.height = 22

      // HOJA 2: DETALLES COMPLETOS
      const detailSheet = workbook.addWorksheet('Detalles Completos')
      detailSheet.views = [{ showGridLines: false }]
        
      // Título de detalles con estilo profesional
      const detailTitleRow = detailSheet.addRow(['DETALLE COMPLETO DE TURNOS Y TARIFAS'])
      detailTitleRow.font = { size: 18, bold: true, color: { argb: 'FFFFFF' }, name: 'Arial Black' }
      detailTitleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '7C3AED' } }
      detailTitleRow.alignment = { horizontal: 'left', vertical: 'middle' }
      detailTitleRow.border = {
        top: { style: 'thick', color: { argb: '6D28D9' } },
        left: { style: 'thick', color: { argb: '6D28D9' } },
        bottom: { style: 'thick', color: { argb: '6D28D9' } },
        right: { style: 'thick', color: { argb: '6D28D9' } }
      }
      detailSheet.mergeCells('A1:G1')
      detailTitleRow.height = 35

      // Línea de separación
      detailSheet.addRow([''])

      // Encabezados de la tabla de detalles con estilo premium
      const detailHeaderRow = detailSheet.addRow(['Trabajador', 'Fecha', 'Día', 'Tipo Turno', 'Categoría Día', 'Tarifa', 'Semana'])
      detailHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
      detailHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } }
      detailHeaderRow.alignment = { horizontal: 'left', vertical: 'middle' }
      detailHeaderRow.border = {
        top: { style: 'medium', color: { argb: 'B91C1C' } },
        left: { style: 'medium', color: { argb: 'B91C1C' } },
        bottom: { style: 'medium', color: { argb: 'B91C1C' } },
        right: { style: 'medium', color: { argb: 'B91C1C' } }
      }
      detailHeaderRow.height = 28

      // Aplicar bordes SOLO a las columnas con datos (A-G)
      for (let col = 1; col <= 7; col++) {
        const cell = detailHeaderRow.getCell(col)
        cell.border = {
          top: { style: 'medium', color: { argb: '000000' } },
          left: { style: 'medium', color: { argb: '000000' } },
          bottom: { style: 'medium', color: { argb: '000000' } },
          right: { style: 'medium', color: { argb: '000000' } }
        }
        cell.alignment = { horizontal: 'left', vertical: 'middle' }
      }

          // Agregar todos los turnos detallados con estilos profesionales
      let rowIndex = 0
      currentData.forEach((worker) => {
        // Ordenar turnos por fecha
        const turnosOrdenados = worker.turnos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        
        turnosOrdenados.forEach((turno) => {
          const [year, month, day] = turno.fecha.split('-')
          const turnoDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          
          // Usar la función de semana para consistencia con Cobros
          const weekInfo = `Semana ${getWeekNumberForDate(turnoDate)}`
          
          const row = detailSheet.addRow([
            worker.conductorNombre,
            turno.fecha,
            formatDate(turno.fecha),
            turno.turno,
            turno.categoriasDia,
            turno.tarifa,
            weekInfo
          ])

          // Colores específicos según el tipo de día con mejor visual
          let backgroundColor = rowIndex % 2 === 0 ? 'FFFFFF' : 'F8FAFC'
          
          if (turno.isSunday) {
            backgroundColor = 'F3E8FF' // Morado claro para domingos
          } else if (turno.isHoliday) {
            backgroundColor = 'FEF2F2' // Rojo claro para feriados
          } else if (turno.categoriasDia === 'Sábados 3er turno') {
            backgroundColor = 'FFFBEB' // Amarillo claro para sábados 3er turno
          }
          
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: backgroundColor } }
          
          // Estilos específicos por columna
          row.getCell(1).font = { size: 10, bold: true, color: { argb: '1E40AF' } } // Trabajador
          row.getCell(2).font = { size: 10, color: { argb: '374151' } } // Fecha
          row.getCell(3).font = { size: 10, color: { argb: '6B7280' } } // Día
          row.getCell(4).font = { size: 10, color: { argb: '7C3AED' } } // Tipo Turno
          row.getCell(5).font = { size: 10, color: { argb: 'EA580C' } } // Categoría
          row.getCell(6).font = { size: 10, bold: true, color: { argb: '059669' } } // Tarifa
          row.getCell(7).font = { size: 10, color: { argb: 'DC2626' } } // Semana
          
          row.alignment = { horizontal: 'left', vertical: 'middle' }
          row.height = 22
          
          // Bordes profesionales
          row.border = {
            top: { style: 'thin', color: { argb: 'E5E7EB' } },
            left: { style: 'thin', color: { argb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
            right: { style: 'thin', color: { argb: 'E5E7EB' } }
          }

          rowIndex++
        })
      })

      // Agregar fila de total en detalles con estilo premium
      const detailTotalRow = detailSheet.addRow([
        'TOTAL GENERAL',
        '',
        '',
        `${getTotalShifts()} turnos`,
        `${getTotalHolidays()} feriados, ${getTotalSundays()} domingos`,
        getTotalPayments(),
        ''
      ])

      detailTotalRow.font = { size: 12, bold: true, color: { argb: 'FFFFFF' } }
      detailTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } }
      detailTotalRow.alignment = { horizontal: 'left', vertical: 'middle' }
      detailTotalRow.border = {
        top: { style: 'medium', color: { argb: '047857' } },
        left: { style: 'medium', color: { argb: '047857' } },
        bottom: { style: 'medium', color: { argb: '047857' } },
        right: { style: 'medium', color: { argb: '047857' } }
      }
      detailTotalRow.height = 28

      // Configurar anchos de columna optimizados
      worksheet.columns = [
        { width: 25 }, // Trabajador
        { width: 15 }, // Total Turnos
        { width: 12 }, // Feriados
        { width: 12 }, // Domingos
        { width: 18 }  // Total a Pagar
      ]
      
      detailSheet.columns = [
        { width: 25 }, // Trabajador
        { width: 12 }, // Fecha
        { width: 15 }, // Día
        { width: 15 }, // Tipo Turno
        { width: 20 }, // Categoría Día
        { width: 15 }, // Tarifa
        { width: 15 }  // Semana
      ]

      // Agregar filtros automáticos a ambas hojas
      worksheet.autoFilter = {
        from: 'A8',
        to: `F${currentData.length + 8}`
      }
      
      detailSheet.autoFilter = {
        from: 'A3',
        to: `G${rowIndex + 3}`
      }

      // Generar nombre de archivo dinámico
      const fileName = viewMode === 'monthly' && selectedMonth 
        ? `Pagos_${selectedMonth}_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.xlsx`
        : `Pagos_Turnos_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.xlsx`

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al generar el archivo Excel')
    }
  }

  // Mostrar indicador de carga si está cargando y no hay datos
  if (loading && workerPayments.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de pagos desde Supabase...</p>
          </div>
        </div>
      </div>
    )
  }

  if (workerPayments.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pagos por Turnos</h1>
            <p className="text-gray-600 mt-2">
              Cálculo automático de pagos basado en turnos completados y tarifas del calendario
            </p>
          </div>
          <Button onClick={loadPaymentData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay turnos completados</h3>
            <p className="text-gray-600 mb-4">
              Para generar pagos necesitas turnos con estado "completado". Los turnos programados no generan pagos hasta que se marquen como completados.
            </p>
            <Button 
              onClick={() => window.location.href = '/turnos'} 
              className="mr-2"
            >
              Ir a Turnos
            </Button>
            <Button 
              onClick={() => window.location.href = '/upload'} 
              variant="outline"
            >
              Ir a Subir Archivos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos por Turnos</h1>
          <p className="text-gray-600 mt-2">
            Cálculo automático de pagos basado en turnos <span className="font-semibold text-blue-600">completados</span> y tarifas del calendario
          </p>
          <p className="text-sm text-orange-600 mt-1">
            💡 Solo los turnos marcados como "completado" generan pagos
          </p>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Última actualización: {lastUpdate.toLocaleString('es-CL')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportToExcel} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Exportar a Excel
          </Button>
          <Button onClick={loadPaymentData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Selector de Vista y Filtro de Mes */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Selector de vista */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Vista:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="total">Vista Total</option>
              <option value="monthly">Por Mes</option>
            </select>
          </div>

          {/* Selector de mes (solo visible en modo mensual) */}
          {viewMode === 'monthly' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Mes:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar mes...</option>
                {getAvailableMonths().map(month => {
                  const [year, monthNum] = month.split('-')
                  const monthName = new Date(year, monthNum - 1).toLocaleDateString('es-CL', { 
                    month: 'long', 
                    year: 'numeric' 
                  })
                  return (
                    <option key={month} value={month}>
                      {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                    </option>
                  )
                })}
              </select>
            </div>
          )}
        </div>

        {/* Información de filtro activo */}
        {viewMode === 'monthly' && selectedMonth && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <Calendar className="h-4 w-4" />
            <span>
              Mostrando datos de {(() => {
                const [year, monthNum] = selectedMonth.split('-')
                const monthName = new Date(year, monthNum - 1).toLocaleDateString('es-CL', { 
                  month: 'long', 
                  year: 'numeric' 
                })
                return monthName.charAt(0).toUpperCase() + monthName.slice(1)
              })()}
            </span>
          </div>
        )}
      </div>

      {/* Warning de fechas/turnos faltantes */}
      {(() => {
        const warning = getDateWarnings()
        if (!warning) return null

        return (
          <div className={`p-4 rounded-lg border-l-4 ${
            warning.type === 'no-data' 
              ? 'bg-gray-50 border-gray-400 text-gray-700' 
              : warning.type === 'missing-days'
              ? 'bg-red-50 border-red-400 text-red-700'
              : 'bg-yellow-50 border-yellow-400 text-yellow-700'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {warning.type === 'no-data' ? (
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                ) : warning.type === 'missing-days' ? (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {warning.type === 'no-data' ? 'Sin datos' : 
                   warning.type === 'missing-days' ? 'Días faltantes' : 
                   'Mes incompleto'}
                </p>
                <p className="text-sm mt-1">
                  {warning.message}
                </p>
                {warning.workers && warning.workers.length > 0 && (
                  <p className="text-xs mt-2 opacity-75">
                    Trabajadores: {warning.workers.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm font-medium text-gray-600 truncate">Total a Pagar</p>
                <p className="text-xl lg:text-2xl font-bold text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">
                  {formatCurrency(getTotalPayments())}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm font-medium text-gray-600 truncate">Total Turnos</p>
                <p className="text-xl lg:text-2xl font-bold text-orange-600 whitespace-nowrap overflow-hidden text-ellipsis">
                  {getTotalShifts()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm font-medium text-gray-600 truncate">Feriados</p>
                <p className="text-xl lg:text-2xl font-bold text-red-600 whitespace-nowrap overflow-hidden text-ellipsis">
                  {getTotalHolidays()}
                </p>
              </div>
              <Gift className="h-8 w-8 text-red-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-sm font-medium text-gray-600 truncate">Domingos</p>
                <p className="text-xl lg:text-2xl font-bold text-purple-600 whitespace-nowrap overflow-hidden text-ellipsis">
                  {getTotalSundays()}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de trabajadores con pagos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Pagos por Trabajador ({getCurrentPaymentsData().length})
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleAllWorkers}
              className="text-xs"
            >
              {expandedWorkers.size === getCurrentPaymentsData().length ? 'Colapsar Todo' : 'Expandir Todo'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getCurrentPaymentsData().map((worker) => {
              const isExpanded = expandedWorkers.has(worker.conductorNombre)
              
              return (
                <div key={worker.conductorNombre} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150">
                  {/* Header del trabajador */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => toggleWorkerExpansion(worker.conductorNombre)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {worker.conductorNombre?.charAt(0).toUpperCase() || 'T'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{worker.conductorNombre}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {worker.totalTurnos} turnos
                            </span>
                            {worker.feriadosTrabajados > 0 && (
                              <span className="flex items-center gap-1 text-red-600">
                                <Gift className="h-3 w-3" />
                                {worker.feriadosTrabajados} feriados
                              </span>
                            )}
                            {worker.domingosTrabajados > 0 && (
                              <span className="flex items-center gap-1 text-purple-600">
                                <Star className="h-3 w-3" />
                                {worker.domingosTrabajados} domingos
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(worker.totalMonto)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(worker.totalMonto / worker.totalTurnos)}/turno
                          </div>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Vista expandida */}
                  {isExpanded && (
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Desglose por tipo de turno */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h4 className="font-semibold text-gray-900 text-sm">Desglose por Tipo de Turno</h4>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(worker.desglosePorTipo).map(([tipo, data]) => (
                              data.cantidad > 0 && (
                                <div key={tipo} className="group hover:bg-blue-50 transition-colors duration-200 p-2 rounded-lg border border-transparent hover:border-blue-200">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          tipo === 'PRIMER TURNO' ? 'bg-emerald-100 text-emerald-700' :
                                          tipo === 'SEGUNDO TURNO' ? 'bg-blue-100 text-blue-700' :
                                          'bg-purple-100 text-purple-700'
                                        }`}>
                                          {tipo}
                                        </span>
                                        <span className="text-sm text-gray-500">{data.cantidad} turnos</span>
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        Total: {formatCurrency(data.monto)}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-900">{formatCurrency(data.monto)}</div>
                                    </div>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>

                        {/* Desglose por tipo de día */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <h4 className="font-semibold text-gray-900 text-sm">Desglose por Tipo de Día</h4>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(worker.desglosePorDia).map(([tipo, data]) => (
                              data.cantidad > 0 && (
                                <div key={tipo} className="group hover:bg-orange-50 transition-colors duration-200 p-2 rounded-lg border border-transparent hover:border-orange-200">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          tipo === 'Domingos' ? 'bg-purple-100 text-purple-700' :
                                          tipo === 'Feriados' ? 'bg-red-100 text-red-700' :
                                          tipo === 'Sábados 3er turno' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {tipo === 'Domingos' && <Star className="w-3 h-3 mr-1" />}
                                          {tipo === 'Feriados' && <Gift className="w-3 h-3 mr-1" />}
                                          {tipo}
                                        </span>
                                        <span className="text-sm text-gray-500">{data.cantidad} turnos</span>
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        Total: {formatCurrency(data.monto)}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-900">{formatCurrency(data.monto)}</div>
                                    </div>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Lista detallada de turnos */}
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <h4 className="font-semibold text-gray-900 text-sm">Turnos Trabajados ({worker.totalTurnos})</h4>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                  <th className="text-left py-2 px-3 font-semibold text-gray-700 border-b border-gray-200">Fecha</th>
                                  <th className="text-left py-2 px-3 font-semibold text-gray-700 border-b border-gray-200">Día</th>
                                  <th className="text-left py-2 px-3 font-semibold text-gray-700 border-b border-gray-200">Turno</th>
                                  <th className="text-left py-2 px-3 font-semibold text-gray-700 border-b border-gray-200">Categoría</th>
                                  <th className="text-right py-2 px-3 font-semibold text-gray-700 border-b border-gray-200">Tarifa</th>
                                </tr>
                              </thead>
                              <tbody>
                                {worker.turnos
                                  .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                                  .map((turno, turnoIndex) => (
                                    <tr key={turnoIndex} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-colors duration-150 border-b border-gray-50 last:border-b-0">
                                      <td className="py-2 px-3 font-medium text-gray-900">{turno.fecha}</td>
                                      <td className="py-2 px-3">
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-700">{formatDate(turno.fecha)}</span>
                                          {turno.isSunday && (
                                            <div className="flex items-center justify-center w-4 h-4 bg-purple-100 rounded-full">
                                              <Star className="h-2 w-2 text-purple-600" />
                                            </div>
                                          )}
                                          {turno.isHoliday && !turno.isSunday && (
                                            <div className="flex items-center justify-center w-4 h-4 bg-red-100 rounded-full">
                                              <Gift className="h-2 w-2 text-red-600" />
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          turno.turno === 'PRIMER TURNO' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                          turno.turno === 'SEGUNDO TURNO' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                          'bg-purple-100 text-purple-700 border border-purple-200'
                                        }`}>
                                          {turno.turno}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                          turno.categoriasDia === 'Domingos' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                          turno.categoriasDia === 'Feriados' ? 'bg-red-50 text-red-700 border-red-200' :
                                          turno.categoriasDia === 'Sábados 3er turno' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                          'bg-gray-50 text-gray-700 border-gray-200'
                                        }`}>
                                          {turno.categoriasDia === 'Domingos' && <Star className="w-2 h-2 mr-1" />}
                                          {turno.categoriasDia === 'Feriados' && <Gift className="w-2 h-2 mr-1" />}
                                          {turno.categoriasDia}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-right">
                                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-50 text-green-700 font-bold text-sm border border-green-200">
                                          {formatCurrency(turno.tarifa)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200">
                                  <td colSpan={4} className="py-4 px-4 text-right font-bold text-gray-900 text-base">
                                    Total General:
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-800 font-bold text-lg border-2 border-green-300 shadow-sm">
                                      {formatCurrency(worker.totalMonto)}
                                    </span>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Resumen por Tipo de Turno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['PRIMER TURNO', 'SEGUNDO TURNO', 'TERCER TURNO'].map(turnoType => {
                const currentData = getCurrentPaymentsData()
                const totalTurnos = currentData.reduce((sum, worker) => 
                  sum + (worker.desglosePorTipo[turnoType]?.cantidad || 0), 0)
                const totalMonto = currentData.reduce((sum, worker) => 
                  sum + (worker.desglosePorTipo[turnoType]?.monto || 0), 0)
                
                return (
                  <div key={turnoType} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{turnoType}</div>
                      <div className="text-sm text-gray-600">{totalTurnos} turnos trabajados</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(totalMonto)}</div>
                      {totalTurnos > 0 && (
                        <div className="text-xs text-gray-500">
                          {formatCurrency(totalMonto / totalTurnos)}/turno
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Información del Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Total trabajadores activos</span>
                <span className="text-sm text-gray-600">{getCurrentPaymentsData().length}</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Gift className="h-4 w-4 text-red-500" />
                  Total turnos en feriados
                </span>
                <span className="text-sm text-red-600 font-semibold">{getTotalHolidays()}</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Star className="h-4 w-4 text-purple-500" />
                  Total turnos en domingos
                </span>
                <span className="text-sm text-purple-600 font-semibold">{getTotalSundays()}</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Basado en tarifas del calendario</span>
                <span className="text-sm text-green-600">✓ Actualizado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Payments
