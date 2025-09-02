import { useState, useEffect } from 'react'
import masterDataService from '../services/masterDataService'
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
  Calculator,
  Calendar,
  Gift,
  Star,
  Download
} from 'lucide-react'

function Payments() {
  const [workerPayments, setWorkerPayments] = useState([])
  const [expandedWorkers, setExpandedWorkers] = useState(new Set())
  const [lastUpdate, setLastUpdate] = useState(null)
  
  // Estados para el filtro de mes
  const [viewMode, setViewMode] = useState('total') // 'total' o 'monthly'
  const [selectedMonth, setSelectedMonth] = useState('') // Mes seleccionado para filtrar
  const [filteredPayments, setFilteredPayments] = useState([])

  // Cargar datos de pagos - SOLO VISTA TOTAL
  const loadPaymentData = () => {
    const payments = masterDataService.calculateWorkerPayments()
    setWorkerPayments(payments)
    setLastUpdate(new Date())
    
    // Si estamos en modo mensual y hay un mes seleccionado, filtrar
    if (viewMode === 'monthly' && selectedMonth) {
      filterPaymentsByMonth(payments, selectedMonth)
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
        const turnoDate = new Date(turno.fecha)
        return turnoDate.getFullYear() === parseInt(year) && 
               (turnoDate.getMonth() + 1) === parseInt(monthNum)
      })

      if (turnosDelMes.length === 0) return null

      // Recalcular estadísticas para el mes
      const totalMonto = turnosDelMes.reduce((sum, turno) => sum + turno.tarifa, 0)
      const feriadosTrabajados = turnosDelMes.filter(turno => turno.isHoliday && !turno.isSunday).length
      const domingosTrabajados = turnosDelMes.filter(turno => turno.isSunday).length

      // Recalcular desgloses
      const desglosePorTipo = {}
      const desglosePorDia = {}

      turnosDelMes.forEach(turno => {
        // Por tipo de turno
        if (!desglosePorTipo[turno.turno]) {
          desglosePorTipo[turno.turno] = { cantidad: 0, monto: 0 }
        }
        desglosePorTipo[turno.turno].cantidad++
        desglosePorTipo[turno.turno].monto += turno.tarifa

        // Por tipo de día
        if (!desglosePorDia[turno.categoriasDia]) {
          desglosePorDia[turno.categoriasDia] = { cantidad: 0, monto: 0 }
        }
        desglosePorDia[turno.categoriasDia].cantidad++
        desglosePorDia[turno.categoriasDia].monto += turno.tarifa
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

  const getAveragePaymentPerWorker = () => {
    const currentData = getCurrentPaymentsData()
    if (currentData.length === 0) return 0
    return getTotalPayments() / currentData.length
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
        const turnoDate = new Date(turno.fecha)
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
    
    // Encontrar días que aparecen en registros pero sin turnos
    // (esto sería si hay fechas en la BD pero sin turnos, caso raro pero posible)
    const daysWithoutShifts = daysWithRecords.filter(day => {
      const turnosForDay = allTurnosInMonth.filter(turno => turno.day === day)
      return turnosForDay.length === 0
    })

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

    // Warning por días sin turnos (secundario)
    if (daysWithoutShifts.length > 0) {
      return {
        type: 'days-without-shifts',
        message: `Hay ${daysWithoutShifts.length} día(s) sin turnos registrados en ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}: día ${daysWithoutShifts.join(', ')}`,
        count: daysWithoutShifts.length,
        days: daysWithoutShifts
      }
    }

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
    const date = new Date(dateString)
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
      
      // HOJA 1: RESUMEN - Nombre corto para evitar truncamiento
      let sheetTitle = 'Resumen'
      if (viewMode === 'monthly' && selectedMonth) {
        const [year, month] = selectedMonth.split('-')
        // Nombre corto: "Ago 2025" en lugar de "Agosto de 2025"
        const monthName = new Date(year, month - 1).toLocaleDateString('es-CL', { month: 'short' })
        // Quitar el punto del final si existe
        sheetTitle = `${monthName.replace('.', '').charAt(0).toUpperCase() + monthName.replace('.', '').slice(1)} ${year}`
      }
      
      const worksheet = workbook.addWorksheet(sheetTitle)

      // Configurar el encabezado
      worksheet.columns = [
        { header: 'Trabajador', key: 'trabajador', width: 25 },
        { header: 'Total Turnos', key: 'totalTurnos', width: 15 },
        { header: 'Feriados', key: 'feriados', width: 12 },
        { header: 'Domingos', key: 'domingos', width: 12 },
        { header: 'Total a Pagar', key: 'totalPago', width: 18 }
      ]

      // Aplicar estilos al encabezado
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        }
      })

      // Agregar datos
      currentData.forEach((worker, index) => {
        const row = worksheet.addRow({
          trabajador: worker.conductorNombre,
          totalTurnos: worker.totalTurnos,
          feriados: worker.feriadosTrabajados,
          domingos: worker.domingosTrabajados,
          totalPago: worker.totalMonto
        })

        // Alternar colores de fila
        if (index % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } }
          })
        }

        // Formatear la columna de dinero
        row.getCell('totalPago').numFmt = '"$"#,##0'
        
        // Aplicar bordes
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'CCCCCC' } },
            left: { style: 'thin', color: { argb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
            right: { style: 'thin', color: { argb: 'CCCCCC' } }
          }
        })
      })

      // Agregar fila de totales
      const totalRow = worksheet.addRow({
        trabajador: 'TOTAL',
        totalTurnos: getTotalShifts(),
        feriados: getTotalHolidays(),
        domingos: getTotalSundays(),
        totalPago: getTotalPayments()
      })

      // Estilizar fila de totales
      totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F4FD' } }
        cell.border = {
          top: { style: 'medium', color: { argb: '366092' } },
          left: { style: 'thin', color: { argb: '366092' } },
          bottom: { style: 'medium', color: { argb: '366092' } },
          right: { style: 'thin', color: { argb: '366092' } }
        }
        if (colNumber === 5) { // Columna de total pago
          cell.numFmt = '"$"#,##0'
        }
      })

      // HOJA 2: DETALLES - Siempre se crea, tanto para vista total como mensual
      const detailSheet = workbook.addWorksheet('Detalles')
        
        // Configurar columnas del detalle
        detailSheet.columns = [
          { header: 'Trabajador', key: 'trabajador', width: 25 },
          { header: 'Fecha', key: 'fecha', width: 12 },
          { header: 'Día', key: 'dia', width: 12 },
          { header: 'Tipo Turno', key: 'tipoTurno', width: 15 },
          { header: 'Categoría Día', key: 'categoriaDia', width: 18 },
          { header: 'Tarifa', key: 'tarifa', width: 15 }
        ]

        // Aplicar estilos al encabezado de detalles
        detailSheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFF' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2D5B2D' } }
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } }
          }
        })

        // Agregar todos los turnos detallados
        let rowIndex = 2
        currentData.forEach((worker) => {
          // Ordenar turnos por fecha
          const turnosOrdenados = worker.turnos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          
          turnosOrdenados.forEach((turno) => {
            const row = detailSheet.addRow({
              trabajador: worker.conductorNombre,
              fecha: turno.fecha,
              dia: formatDate(turno.fecha),
              tipoTurno: turno.turno,
              categoriaDia: turno.categoriasDia,
              tarifa: turno.tarifa
            })

            // Alternar colores de fila
            if ((rowIndex - 2) % 2 === 1) {
              row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F8F0' } }
              })
            }

            // Formatear la columna de tarifa
            row.getCell('tarifa').numFmt = '"$"#,##0'
            
            // Aplicar bordes
            row.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin', color: { argb: 'CCCCCC' } },
                left: { style: 'thin', color: { argb: 'CCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
                right: { style: 'thin', color: { argb: 'CCCCCC' } }
              }
            })

            // Colorear filas especiales
            if (turno.isSunday) {
              row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E8FF' } }
              })
            } else if (turno.isHoliday) {
              row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } }
              })
            } else if (turno.categoriasDia === 'Sábados 3er turno') {
              row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEB' } }
              })
            }

            rowIndex++
          })
        })

        // Agregar fila de total en detalles
        const detailTotalRow = detailSheet.addRow({
          trabajador: '',
          fecha: '',
          dia: '',
          tipoTurno: '',
          categoriaDia: 'TOTAL GENERAL:',
          tarifa: getTotalPayments()
        })

        detailTotalRow.eachCell((cell, colNumber) => {
          cell.font = { bold: true }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E8' } }
          cell.border = {
            top: { style: 'medium', color: { argb: '2D5B2D' } },
            left: { style: 'thin', color: { argb: '2D5B2D' } },
            bottom: { style: 'medium', color: { argb: '2D5B2D' } },
            right: { style: 'thin', color: { argb: '2D5B2D' } }
          }
          if (colNumber === 6) { // Columna de tarifa
            cell.numFmt = '"$"#,##0'
          }
        })

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

  if (workerPayments.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pagos por Turnos</h1>
            <p className="text-gray-600 mt-2">
              Cálculo automático de pagos basado en turnos trabajados y tarifas del calendario
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos de turnos</h3>
            <p className="text-gray-600 mb-4">
              Para ver los pagos por turnos, primero necesitas registrar turnos en el calendario.
            </p>
            <Button 
              onClick={() => window.location.href = '/calendar'} 
              className="mr-2"
            >
              Ir al Calendario
            </Button>
            <Button 
              onClick={() => window.location.href = '/upload-files'} 
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
            Cálculo automático de pagos basado en turnos trabajados y tarifas del calendario
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
              : warning.type === 'days-without-shifts'
              ? 'bg-orange-50 border-orange-400 text-orange-700'
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
                ) : warning.type === 'days-without-shifts' ? (
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                   warning.type === 'days-without-shifts' ? 'Días sin turnos' :
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total a Pagar</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(getTotalPayments())}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trabajadores</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getCurrentPaymentsData().length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Turnos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {getTotalShifts()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Feriados</p>
                <p className="text-2xl font-bold text-red-600">
                  {getTotalHolidays()}
                </p>
              </div>
              <Gift className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Domingos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {getTotalSundays()}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(getAveragePaymentPerWorker())}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-indigo-600" />
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
                <div key={worker.conductorNombre} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
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
                                    <tr key={turnoIndex} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 border-b border-gray-50 last:border-b-0">
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
                <span className="text-sm font-medium text-gray-900">Promedio por trabajador</span>
                <span className="text-sm text-gray-600">{formatCurrency(getAveragePaymentPerWorker())}</span>
              </div>
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
