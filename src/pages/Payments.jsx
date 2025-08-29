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

  // Cargar datos de pagos
  const loadPaymentData = () => {
    const payments = masterDataService.calculateWorkerPayments()
    setWorkerPayments(payments)
    setLastUpdate(new Date())
  }

  useEffect(() => {
    loadPaymentData()
  }, [])

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('es-CL', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Expandir/contraer detalles del trabajador
  const toggleWorkerExpansion = (workerName) => {
    const newExpanded = new Set(expandedWorkers)
    if (newExpanded.has(workerName)) {
      newExpanded.delete(workerName)
    } else {
      newExpanded.add(workerName)
    }
    setExpandedWorkers(newExpanded)
  }

  // Cálculos para estadísticas
  const getTotalPayments = () => {
    if (!workerPayments || !Array.isArray(workerPayments)) return 0
    return workerPayments.reduce((sum, worker) => sum + (worker?.totalMonto || 0), 0)
  }

  const getAveragePaymentPerWorker = () => {
    if (!workerPayments || workerPayments.length === 0) return 0
    return getTotalPayments() / workerPayments.length
  }

  const getTotalShifts = () => {
    if (!workerPayments || !Array.isArray(workerPayments)) return 0
    return workerPayments.reduce((sum, worker) => sum + (worker?.turnos?.length || 0), 0)
  }

  const getTotalHolidays = () => {
    if (!workerPayments || !Array.isArray(workerPayments)) return 0
    return workerPayments.reduce((sum, worker) => sum + (worker?.feriadosTrabajados || 0), 0)
  }

  const getTotalSundays = () => {
    if (!workerPayments || !Array.isArray(workerPayments)) return 0
    return workerPayments.reduce((sum, worker) => sum + (worker?.domingosTrabajados || 0), 0)
  }

  // Exportar pagos a Excel con estilos usando ExcelJS
  const exportToExcel = async () => {
    console.log('Iniciando exportToExcel con ExcelJS...')
    console.log('workerPayments:', workerPayments)
    
    if (!workerPayments || workerPayments.length === 0) {
      alert('No hay datos de pagos para exportar')
      return
    }

    try {
      // Crear un nuevo workbook
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Pagos por Turnos')

      // Configurar ancho de columnas
      worksheet.columns = [
        { width: 30 }, // Trabajador
        { width: 15 }, // Fecha
        { width: 18 }, // Día de la Semana
        { width: 15 }, // Tipo de Turno
        { width: 20 }, // Categoría del Día
        { width: 16 }, // Tarifa
        { width: 10 }, // Feriado
        { width: 10 }  // Domingo
      ]

      let currentRow = 1

      // Título principal
      worksheet.mergeCells('A1:H1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = 'REPORTE DE PAGOS POR TURNOS'
      titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF1F2937' } }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
      titleCell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      }
      worksheet.getRow(1).height = 35

      currentRow++

      // Subtítulo fecha
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
      const subtitleCell = worksheet.getCell(`A${currentRow}`)
      subtitleCell.value = `Fecha de Generación: ${new Date().toLocaleDateString('es-CL')}`
      subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF6B7280' } }
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      worksheet.getRow(currentRow).height = 20

      currentRow += 2 // Línea vacía

      // Encabezados
      const headers = ['Trabajador', 'Fecha', 'Día de la Semana', 'Tipo de Turno', 'Categoría del Día', 'Tarifa', 'Feriado', 'Domingo']
      const headerRow = worksheet.getRow(currentRow)
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        }
      })
      worksheet.getRow(currentRow).height = 25
      currentRow += 2 // Línea vacía después de encabezados

      // Procesar cada trabajador
      workerPayments.forEach(worker => {
        if (!worker) return

        // Resumen del trabajador
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
        const workerSummaryCell = worksheet.getCell(`A${currentRow}`)
        workerSummaryCell.value = `RESUMEN: ${worker.conductorNombre || 'Sin nombre'}`
        workerSummaryCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1F2937' } }
        workerSummaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }
        workerSummaryCell.alignment = { horizontal: 'left', vertical: 'middle' }
        workerSummaryCell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thick', color: { argb: 'FFF59E0B' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        }
        worksheet.getRow(currentRow).height = 22
        currentRow++

        // Detalles del trabajador
        const detailRow = worksheet.getRow(currentRow)
        detailRow.getCell(1).value = `Total Turnos: ${worker.turnos ? worker.turnos.length : 0}`
        detailRow.getCell(1).font = { name: 'Arial', size: 10, bold: true }
        
        detailRow.getCell(2).value = `TOTAL A PAGAR: ${formatCurrency(worker.totalMonto || 0)}`
        detailRow.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        detailRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
        detailRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
        detailRow.getCell(2).border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thick', color: { argb: 'FF059669' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        }
        
        detailRow.getCell(3).value = `Feriados: ${worker.feriadosTrabajados || 0}`
        detailRow.getCell(3).font = { name: 'Arial', size: 10, bold: true }
        
        detailRow.getCell(4).value = `Domingos: ${worker.domingosTrabajados || 0}`
        detailRow.getCell(4).font = { name: 'Arial', size: 10, bold: true }
        
        worksheet.getRow(currentRow).height = 20
        currentRow += 2 // Línea vacía

        // Turnos del trabajador
        if (worker.turnos && Array.isArray(worker.turnos)) {
          worker.turnos
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .forEach(turno => {
              if (!turno) return
              
              const turnoRow = worksheet.getRow(currentRow)
              const values = [
                worker.conductorNombre || 'Sin nombre',
                turno.fecha || '',
                turno.fecha ? formatDate(turno.fecha) : '',
                turno.turno || '',
                turno.categoriasDia || '',
                turno.tarifa ? formatCurrency(turno.tarifa) : '',
                turno.isHoliday ? 'SÍ' : 'NO',
                turno.isSunday ? 'SÍ' : 'NO'
              ]
              
              values.forEach((value, index) => {
                const cell = turnoRow.getCell(index + 1)
                cell.value = value
                cell.font = { name: 'Arial', size: 10, color: { argb: 'FF374151' } }
                cell.alignment = { horizontal: index === 5 ? 'right' : 'left', vertical: 'middle' }
                cell.border = { bottom: { style: 'hair', color: { argb: 'FFF3F4F6' } } }
                
                // Estilo especial para montos
                if (index === 5 && value.includes('$')) {
                  cell.font = { name: 'Arial', size: 10, color: { argb: 'FF059669' }, bold: true }
                }
              })
              
              worksheet.getRow(currentRow).height = 18
              currentRow++
            })
        }

        currentRow++ // Línea vacía entre trabajadores
      })

      // Resumen general
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`)
      const generalSummaryCell = worksheet.getCell(`A${currentRow}`)
      generalSummaryCell.value = 'RESUMEN GENERAL'
      generalSummaryCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
      generalSummaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } }
      generalSummaryCell.alignment = { horizontal: 'center', vertical: 'middle' }
      generalSummaryCell.border = {
        top: { style: 'thick', color: { argb: 'FF5B21B6' } },
        bottom: { style: 'thick', color: { argb: 'FF5B21B6' } },
        left: { style: 'thick', color: { argb: 'FF5B21B6' } },
        right: { style: 'thick', color: { argb: 'FF5B21B6' } }
      }
      worksheet.getRow(currentRow).height = 30
      currentRow++

      // Datos del resumen general
      const summaryData = [
        ['Total Trabajadores:', workerPayments ? workerPayments.length : 0],
        ['Total Turnos:', getTotalShifts() || 0],
        ['TOTAL GENERAL A PAGAR:', formatCurrency(getTotalPayments() || 0)],
        ['Total Feriados Trabajados:', getTotalHolidays() || 0],
        ['Total Domingos Trabajados:', getTotalSundays() || 0],
        ['Promedio por Trabajador:', formatCurrency(getAveragePaymentPerWorker() || 0)]
      ]

      summaryData.forEach((data, index) => {
        const row = worksheet.getRow(currentRow)
        row.getCell(1).value = data[0]
        row.getCell(2).value = data[1]
        
        if (data[0].includes('TOTAL GENERAL A PAGAR:')) {
          row.getCell(1).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
          row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } }
          row.getCell(2).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
          row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } }
          worksheet.getRow(currentRow).height = 25
        } else {
          row.getCell(1).font = { name: 'Arial', size: 11, bold: true }
          row.getCell(2).font = { name: 'Arial', size: 11, bold: true }
          worksheet.getRow(currentRow).height = 20
        }
        
        currentRow++
      })

      // Generar archivo
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      const fileName = `Pagos_Turnos_${dateStr}.xlsx`

      // Crear buffer y descargar
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)

      console.log('Excel exportado exitosamente:', fileName)
      
    } catch (error) {
      console.error('Error en exportToExcel:', error)
      alert(`Error al exportar: ${error.message}`)
    }
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
            Exportar Excel
          </Button>
          <Button onClick={loadPaymentData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar Cálculos
          </Button>
        </div>
      </div>

      {workerPayments.length === 0 ? (
        /* Estado vacío */
        <Card className="text-center py-12">
          <CardContent>
            <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay turnos para calcular</h3>
            <p className="text-gray-500 mb-4">
              Sube planillas de turnos en la sección "Subir Archivos" para generar los cálculos de pagos automáticamente.
            </p>
            <Button variant="outline">
              Ir a Subir Archivos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
                      {workerPayments.length}
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
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Pagos por Trabajador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workerPayments.map((worker) => {
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
                                  {worker.turnos.length} turnos
                                </span>
                                {worker.feriadosTrabajados > 0 && (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <Gift className="h-3 w-3" />
                                    {worker.feriadosTrabajados}
                                  </span>
                                )}
                                {worker.domingosTrabajados > 0 && (
                                  <span className="flex items-center gap-1 text-purple-600">
                                    <Star className="h-3 w-3" />
                                    {worker.domingosTrabajados}
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
                                {formatCurrency(worker.totalMonto / worker.turnos.length)}/turno
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
                              <h4 className="font-semibold text-gray-900 text-sm">Turnos Trabajados ({worker.turnos.length})</h4>
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
                    const totalTurnos = workerPayments.reduce((sum, worker) => 
                      sum + worker.desglosePorTipo[turnoType].cantidad, 0)
                    const totalMonto = workerPayments.reduce((sum, worker) => 
                      sum + worker.desglosePorTipo[turnoType].monto, 0)
                    
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
                    <span className="text-sm text-gray-600">{workerPayments.length}</span>
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
        </>
      )}
    </div>
  )
}

export default Payments
