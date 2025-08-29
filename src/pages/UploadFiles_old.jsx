import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, Database, Trash2, AlertCircle, Users, Route, Clock, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import { useState, useRef } from 'react'
import masterDataService from '@/services/masterDataService'
import * as XLSX from 'xlsx'

const UploadFiles = () => {
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [processedResults, setProcessedResults] = useState([])
  const fileInputRef = useRef(null)

  // Función para procesar archivos Excel de planillas de turnos
  const processExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Procesar la primera hoja
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Analizar y procesar los datos usando la nueva lógica
          const processedData = analyzeShiftScheduleNew(worksheet, file.name)
          resolve(processedData)
          
        } catch (error) {
          reject(new Error(`Error procesando archivo ${file.name}: ${error.message}`))
        }
      }
      
      reader.onerror = () => reject(new Error(`Error leyendo archivo ${file.name}`))
      reader.readAsArrayBuffer(file)
    })
  }

  // Función auxiliar para convertir fechas de Excel a JavaScript
  const excelDateToJSDate = (excelDate) => {
    const epoch = new Date(1900, 0, 1);
    return new Date(epoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
  };

  // Nueva función para analizar la planilla de turnos
  const analyzeShiftScheduleNew = (worksheet, fileName) => {
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Buscar el header para encontrar los índices de las columnas
    const headerRowIndex = data.findIndex(row => 
      row.some(cell => cell && typeof cell === 'string' && cell.includes('CANT'))
    );
    
    if (headerRowIndex === -1) {
      return { 
        fileName,
        workers: new Set(),
        shifts: [],
        routes: [],
        errors: ['No se encontró el header con columnas CANT'], 
        warnings: [],
        summary: {
          totalDays: 0,
          totalShifts: 0,
          uniqueWorkers: 0,
          totalWorkerShifts: 0,
          servicesWithoutDriverCount: 0,
          shiftTypeBreakdown: { 'PRIMER TURNO': 0, 'SEGUNDO TURNO': 0, 'TERCER TURNO': 0 }
        }
      };
    }

    const headerRow = data[headerRowIndex];
    const cantIndex = headerRow.findIndex(cell => 
      cell && typeof cell === 'string' && cell.includes('CANT')
    );

    const result = {
      fileName,
      workers: new Set(),
      shifts: [],
      routes: [],
      errors: [],
      warnings: [],
      workerShiftCount: new Map(),
      workerShiftDetails: new Map(),
      servicesWithoutDriver: [],
      summary: {
        totalDays: 0,
        totalShifts: 0,
        uniqueWorkers: 0,
        totalWorkerShifts: 0,
        servicesWithoutDriverCount: 0,
        shiftTypeBreakdown: { 'PRIMER TURNO': 0, 'SEGUNDO TURNO': 0, 'TERCER TURNO': 0 }
      }
    };

    // Procesar filas de datos (después del header)
    const dataRows = data.slice(headerRowIndex + 1);
    let expectedTotal = null;

    // Primero, buscar el total esperado y servicios sin conductor
    dataRows.forEach((row, index) => {
      // Buscar fila con TOTAL y valor numérico
      const totalCellIndex = row.findIndex(cell => 
        cell && typeof cell === 'string' && cell.toString().includes('TOTAL')
      );
      
      if (totalCellIndex !== -1) {
        // Buscar el valor numérico cerca del TOTAL
        for (let i = 0; i < row.length; i++) {
          if (typeof row[i] === 'number' && row[i] > 0) {
            expectedTotal = row[i];
            break;
          }
        }
      }

      // Buscar servicios sin conductor
      const hasServiceSinConductor = row.some(cell => 
        cell && typeof cell === 'string' && 
        (cell.includes('SERV SIN') || cell.includes('SIN CONDUCT'))
      );
      
      if (hasServiceSinConductor) {
        const serviceValue = row.find(cell => 
          typeof cell === 'number' && cell >= 0
        );
        if (serviceValue !== undefined) {
          result.summary.servicesWithoutDriverCount = serviceValue;
          // Agregar servicios sin conductor individuales
          for (let i = 0; i < serviceValue; i++) {
            result.servicesWithoutDriver.push({
              fecha: 'General',
              turno: 'Servicios sin conductor',
              descripcion: `Servicio sin conductor ${i + 1}`
            });
          }
        }
      }
    });

    // Luego, procesar las filas de datos normales
    let currentDate = null;
    let dayCounter = 0;

    dataRows.forEach((row, index) => {
      // Saltar filas TOTAL y servicios sin conductor
      const isTotalRow = row.some(cell => 
        cell && typeof cell === 'string' && 
        (cell.toString().includes('TOTAL') || cell.includes('SERV SIN') || cell.includes('SIN CONDUCT'))
      );
      
      if (isTotalRow) {
        return;
      }

      // Detectar nueva fecha
      const fechaValue = row[0];
      if (fechaValue && typeof fechaValue === 'number') {
        currentDate = excelDateToJSDate(fechaValue);
        dayCounter++;
      }

      // Procesar fila de datos normal
      if (row.length > cantIndex && row[cantIndex] && typeof row[cantIndex] === 'number') {
        const expectedConductors = row[cantIndex];
        const shiftType = row[1]; // Columna TURNO
        
        if (shiftType && typeof shiftType === 'string' && expectedConductors > 0) {
          // Contar conductores asignados (excluyendo 'x', 'X' y celdas vacías)
          let assignedConductors = 0;
          const conductoresAsignados = [];
          
          // Buscar conductores en las columnas después de CANT
          for (let i = cantIndex + 1; i < row.length; i++) {
            const cell = row[i];
            if (cell && typeof cell === 'string' && 
                cell.trim() !== '' && 
                !cell.toLowerCase().includes('x') &&
                !cell.toLowerCase().includes('serv sin') &&
                !cell.toLowerCase().includes('total')) {
              
              assignedConductors++;
              const workerName = cell.trim();
              conductoresAsignados.push(workerName);
              result.workers.add(workerName);
              
              // Actualizar contadores del trabajador
              if (!result.workerShiftCount.has(workerName)) {
                result.workerShiftCount.set(workerName, 0);
              }
              result.workerShiftCount.set(workerName, result.workerShiftCount.get(workerName) + 1);
              
              if (!result.workerShiftDetails.has(workerName)) {
                result.workerShiftDetails.set(workerName, {
                  'PRIMER TURNO': 0,
                  'SEGUNDO TURNO': 0,
                  'TERCER TURNO': 0,
                  total: 0
                });
              }
              
              const details = result.workerShiftDetails.get(workerName);
              const shiftTypeUpper = shiftType.toUpperCase();
              if (details[shiftTypeUpper] !== undefined) {
                details[shiftTypeUpper]++;
              }
              details.total++;
            }
          }

          // Contar el turno
          result.summary.totalShifts++;
          result.summary.totalWorkerShifts += expectedConductors;
          
          // Actualizar breakdown por tipo de turno
          const shiftTypeUpper = shiftType.toUpperCase();
          if (result.summary.shiftTypeBreakdown[shiftTypeUpper] !== undefined) {
            result.summary.shiftTypeBreakdown[shiftTypeUpper]++;
          }
          
          // Crear registro del turno
          result.shifts.push({
            fecha: currentDate ? currentDate.toISOString().split('T')[0] : `Día ${dayCounter}`,
            turno: shiftType,
            cantidadEsperada: expectedConductors,
            cantidadAsignada: assignedConductors,
            conductores: conductoresAsignados
          });
          
          // Validar concordancia
          if (assignedConductors !== expectedConductors) {
            const dateStr = currentDate ? currentDate.toISOString().split('T')[0] : `Fila ${headerRowIndex + index + 2}`;
            result.warnings.push(`${dateStr} ${shiftType}: Se esperaban ${expectedConductors} conductores, se encontraron ${assignedConductors}`);
          }
        }
      }
    });

    // Validar contra el total esperado
    if (expectedTotal && result.summary.totalShifts !== expectedTotal) {
      result.errors.push(`TOTAL: Se esperaban ${expectedTotal} turnos, se encontraron ${result.summary.totalShifts}`);
    }

    // Actualizar totales finales
    result.summary.uniqueWorkers = result.workers.size;
    result.summary.totalDays = dayCounter;

    return result;
  };
    const result = {
      fileName,
      workers: new Set(),
      shifts: [],
      routes: [],
      errors: [],
      workerShiftCount: new Map(), // Total de turnos por trabajador
      workerShiftDetails: new Map(), // Desglose por tipo de turno por trabajador
      servicesWithoutDriver: [], // Servicios sin conductor
      summary: {
        totalDays: 0,
        totalShifts: 0,
        uniqueWorkers: 0,
        totalWorkerShifts: 0, // Total de turnos trabajados (suma de CANT.)
        servicesWithoutDriverCount: 0,
        shiftTypeBreakdown: { // Desglose por tipo de turno
          'PRIMER TURNO': 0,
          'SEGUNDO TURNO': 0,
          'TERCER TURNO': 0
        }
      }
    }

    // Buscar la fila de encabezados
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i]
      if (row && row.some(cell => 
        typeof cell === 'string' && 
        cell.toUpperCase().includes('FECHA')
      )) {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1) {
      result.errors.push('No se encontró fila de encabezados válida')
      return result
    }

    const headers = data[headerRowIndex].map(h => h ? h.toString().trim() : '')
    
    // Identificar índices de columnas importantes
    const columnIndexes = {
      fecha: findColumnIndex(headers, ['FECHA']),
      turno: findColumnIndex(headers, ['TURNO']),
      cantidad: findColumnIndex(headers, ['CANT', 'CANTIDAD']),
      conductor1: findColumnIndex(headers, ['CONDUCTOR 1']),
      conductor2: findColumnIndex(headers, ['CONDUCTOR 2']),
      conductor3: findColumnIndex(headers, ['CONDUCTOR 3']),
      conductor4: findColumnIndex(headers, ['CONDUCTOR 4']),
      conductor5: findColumnIndex(headers, ['CONDUCTOR 5']),
      conductorExtra1: findColumnIndex(headers, ['CONDUCTOR EXTRA']),
      conductorExtra2: headers.lastIndexOf('CONDUCTOR EXTRA'),
      servSinConductor: findColumnIndex(headers, ['SERV SIN CONDUCTOR', 'SIN CONDUCTOR']),
      conductorRespaldo: findColumnIndex(headers, ['CONDUCTOR']) // La última columna "CONDUCTOR"
    }

    // Procesar filas de datos
    let currentDate = null
    let dayCounter = 0

    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      // Detectar nueva fecha
      const fechaValue = row[columnIndexes.fecha]
      if (fechaValue && fechaValue.toString().trim() !== '') {
        const fechaStr = fechaValue.toString().trim()
        // Filtrar filas que no son fechas válidas (como "TOTAL")
        if (fechaStr.toUpperCase().includes('TOTAL') || 
            fechaStr.toUpperCase().includes('SERV SIN CONDUCT')) {
          
          // Si es la fila de servicios sin conductor, extraer la cantidad
          if (fechaStr.toUpperCase().includes('SERV SIN CONDUCT')) {
            const cantidadServSin = row[columnIndexes.cantidad]
            if (cantidadServSin && !isNaN(parseInt(cantidadServSin))) {
              const cantidad = parseInt(cantidadServSin)
              for (let k = 0; k < cantidad; k++) {
                result.servicesWithoutDriver.push({
                  fecha: 'General',
                  turno: 'Servicios sin conductor',
                  descripcion: `Servicio sin conductor ${k + 1}`
                })
              }
            }
          }
          continue // Saltar estas filas
        }
        
        currentDate = normalizeFecha(fechaValue)
        dayCounter++
      }

      const turnoValue = row[columnIndexes.turno]
      if (!turnoValue || currentDate === null) continue

      const turno = turnoValue.toString().trim()
      const cantidadValue = row[columnIndexes.cantidad]
      
      // Si la cantidad es X, significa turno cancelado - no procesar
      if (!cantidadValue || cantidadValue.toString().trim().toUpperCase() === 'X') {
        continue
      }
      
      const cantidad = parseInt(cantidadValue) || 0
      
      // Solo procesar si hay cantidad válida
      if (cantidad === 0) continue

      // Extraer conductores según la cantidad especificada en CANT.
      const conductores = []
      let conductoresEncontrados = 0
      
      // Buscar conductores en las columnas principales hasta llegar a la cantidad
      for (let j = 1; j <= 5 && conductoresEncontrados < cantidad; j++) {
        const colIndex = columnIndexes[`conductor${j}`]
        if (colIndex !== -1 && row[colIndex]) {
          const conductor = cleanConductorName(row[colIndex])
          if (conductor) {
            conductores.push(conductor)
            result.workers.add(conductor)
            conductoresEncontrados++
            
            // Contar turno total por trabajador
            const currentCount = result.workerShiftCount.get(conductor) || 0
            result.workerShiftCount.set(conductor, currentCount + 1)
            
            // Desglose por tipo de turno
            if (!result.workerShiftDetails.has(conductor)) {
              result.workerShiftDetails.set(conductor, {
                'PRIMER TURNO': 0,
                'SEGUNDO TURNO': 0,
                'TERCER TURNO': 0,
                total: 0
              })
            }
            const details = result.workerShiftDetails.get(conductor)
            if (details[turno] !== undefined) {
              details[turno]++
            }
            details.total++
          }
        }
      }

      // Si faltan conductores, buscar en columnas extra
      if (conductoresEncontrados < cantidad) {
        if (columnIndexes.conductorExtra1 !== -1 && row[columnIndexes.conductorExtra1] && conductoresEncontrados < cantidad) {
          const conductor = cleanConductorName(row[columnIndexes.conductorExtra1])
          if (conductor) {
            conductores.push(conductor)
            result.workers.add(conductor)
            conductoresEncontrados++
            
            const currentCount = result.workerShiftCount.get(conductor) || 0
            result.workerShiftCount.set(conductor, currentCount + 1)
            
            if (!result.workerShiftDetails.has(conductor)) {
              result.workerShiftDetails.set(conductor, {
                'PRIMER TURNO': 0,
                'SEGUNDO TURNO': 0,
                'TERCER TURNO': 0,
                total: 0
              })
            }
            const details = result.workerShiftDetails.get(conductor)
            if (details[turno] !== undefined) {
              details[turno]++
            }
            details.total++
          }
        }

        if (columnIndexes.conductorExtra2 !== -1 && row[columnIndexes.conductorExtra2] && conductoresEncontrados < cantidad) {
          const conductor = cleanConductorName(row[columnIndexes.conductorExtra2])
          if (conductor) {
            conductores.push(conductor)
            result.workers.add(conductor)
            conductoresEncontrados++
            
            const currentCount = result.workerShiftCount.get(conductor) || 0
            result.workerShiftCount.set(conductor, currentCount + 1)
            
            if (!result.workerShiftDetails.has(conductor)) {
              result.workerShiftDetails.set(conductor, {
                'PRIMER TURNO': 0,
                'SEGUNDO TURNO': 0,
                'TERCER TURNO': 0,
                total: 0
              })
            }
            const details = result.workerShiftDetails.get(conductor)
            if (details[turno] !== undefined) {
              details[turno]++
            }
            details.total++
          }
        }
      }

      // Validar que la cantidad de conductores coincida con CANT.
      if (conductoresEncontrados !== cantidad) {
        result.errors.push(`${currentDate} ${turno}: Se esperaban ${cantidad} conductores, se encontraron ${conductoresEncontrados}`)
      }

      // Actualizar resumen por tipo de turno
      if (result.summary.shiftTypeBreakdown[turno] !== undefined) {
        result.summary.shiftTypeBreakdown[turno] += cantidad
      }

      // Conductor de respaldo - NO cuenta en el turno principal
      if (columnIndexes.conductorRespaldo !== -1 && row[columnIndexes.conductorRespaldo]) {
        const conductor = cleanConductorName(row[columnIndexes.conductorRespaldo])
        if (conductor) {
          result.workers.add(conductor) // Solo agregarlo a la lista de trabajadores
        }
      }

      // Servicios sin conductor - se procesaron en la lógica de fechas especiales arriba
      let servicioSinConductor = null

      // Crear registro de turno
      const shiftRecord = {
        fecha: currentDate,
        turno: turno,
        cantidad: cantidad, // Cantidad real del turno
        conductores: conductores,
        servicioSinConductor: servicioSinConductor
      }

      result.shifts.push(shiftRecord)
    }

    // Generar rutas basadas en los turnos
    result.routes = generateRoutesFromShifts(result.shifts)

    // Calcular resumen CORRECTO - suma directa de la columna CANT.
    const totalWorkerShifts = result.shifts.reduce((sum, shift) => sum + shift.cantidad, 0)
    
    result.summary = {
      totalDays: dayCounter,
      totalShifts: result.shifts.length,
      uniqueWorkers: result.workers.size,
      totalWorkerShifts: totalWorkerShifts, // Suma real de turnos trabajados (columna CANT.)
      servicesWithoutDriverCount: result.servicesWithoutDriver.length
    }

    return result
  }

  // Función auxiliar para encontrar índice de columna
  const findColumnIndex = (headers, searchTerms) => {
    for (let term of searchTerms) {
      const index = headers.findIndex(h => 
        h && h.toString().toUpperCase().includes(term.toUpperCase())
      )
      if (index !== -1) return index
    }
    return -1
  }

  // Función para limpiar nombres de conductores
  const cleanConductorName = (name) => {
    if (!name) return null
    let cleaned = name.toString().trim()
    
    // Filtrar valores que no son nombres válidos
    if (cleaned === '' || 
        cleaned.toUpperCase() === 'X' || 
        /^\d+$/.test(cleaned) || // Solo números
        cleaned.length < 2) {
      return null
    }
    
    // Normalizar espacios múltiples
    cleaned = cleaned.replace(/\s+/g, ' ')
    
    // Capitalizar correctamente y normalizar variaciones comunes
    const normalized = cleaned.split(' ').map(word => {
      word = word.toLowerCase()
      // Normalizar terminaciones comunes
      if (word.endsWith('os') && word.length > 4) {
        // Convertir "vallejos" a "vallejo" para evitar duplicados
        const singular = word.slice(0, -1)
        return singular.charAt(0).toUpperCase() + singular.slice(1)
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
    
    return normalized
  }

  // Función para normalizar fechas
  const normalizeFecha = (fecha) => {
    if (!fecha) return null
    
    const fechaStr = fecha.toString().trim()
    
    // Intentar varios formatos de fecha
    const formats = [
      /^(\d{1,2})-([A-Za-z]{3})$/,  // "28-Jul"
      /^(\d{1,2})-([A-Za-z]+)$/,    // "28-July"
      /^(\d{1,2})\/(\d{1,2})$/      // "28/7"
    ]

    const monthMap = {
      'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    }

    for (let format of formats) {
      const match = fechaStr.match(format)
      if (match) {
        const day = match[1].padStart(2, '0')
        const monthStr = match[2].toUpperCase().substring(0, 3)
        const month = monthMap[monthStr] || match[2].padStart(2, '0')
        return `2025-${month}-${day}` // Asumiendo año 2025
      }
    }

    return fechaStr
  }

  // Función para generar rutas basadas en turnos
  const generateRoutesFromShifts = (shifts) => {
    const routes = []
    const routeMap = new Map()

    shifts.forEach((shift, index) => {
      const routeKey = `${shift.turno}-${shift.fecha}`
      
      if (!routeMap.has(routeKey)) {
        const route = {
          id: index + 1,
          code: `RT-${shift.turno.charAt(0)}${shift.fecha.split('-')[2]}`,
          name: `${shift.turno} - ${shift.fecha}`,
          origin: 'Terminal Central',
          destination: 'Destino Asignado',
          date: shift.fecha,
          shift: shift.turno,
          assignedDrivers: shift.conductores,
          estimatedTime: getEstimatedTimeByShift(shift.turno),
          status: 'Programada'
        }
        
        routes.push(route)
        routeMap.set(routeKey, route)
      }
    })

    return routes
  }

  // Función auxiliar para tiempo estimado por turno
  const getEstimatedTimeByShift = (turno) => {
    const timeMap = {
      'PRIMER TURNO': '8h',
      'SEGUNDO TURNO': '8h',
      'TERCER TURNO': '6h'
    }
    return timeMap[turno] || '8h'
  }

  // Función para manejar la selección de archivos
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setIsProcessing(true)
    setUploadStatus(null)

    try {
      const results = []
      
      for (const file of files) {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const processedData = await processExcelFile(file)
          results.push(processedData)
        } else {
          results.push({
            fileName: file.name,
            errors: ['Formato de archivo no soportado. Use archivos .xlsx o .xls']
          })
        }
      }

      // Guardar resultados y mostrar modal de confirmación
      setProcessedResults(results)
      setShowConfirmModal(true)
      
    } catch (error) {
      console.error('Error procesando archivos:', error)
      setUploadStatus({
        type: 'error',
        message: `Error procesando archivos: ${error.message}`
      })
    } finally {
      setIsProcessing(false)
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Función para importar datos procesados
  const importProcessedData = async (results) => {
    let totalWorkersImported = 0
    let totalRoutesImported = 0
    let errors = []

    try {
      for (const result of results) {
        if (result.errors && result.errors.length > 0) {
          errors.push(...result.errors.map(err => `${result.fileName}: ${err}`))
          continue
        }

        // Importar trabajadores únicos
        const existingWorkers = masterDataService.getWorkers()
        const newWorkers = []
        
        result.workers.forEach(workerName => {
          const exists = existingWorkers.some(w => 
            w.name.toUpperCase() === workerName.toUpperCase()
          )
          
          if (!exists) {
            newWorkers.push({
              name: workerName,
              rut: generateTempRut(), // RUT temporal
              position: 'Conductor',
              phone: 'Por definir',
              status: 'Activo',
              hireDate: new Date().toISOString().split('T')[0],
              importedFrom: result.fileName
            })
          }
        })

        // Guardar nuevos trabajadores
        newWorkers.forEach(worker => {
          masterDataService.addWorker(worker)
          totalWorkersImported++
        })

        // Importar rutas
        result.routes.forEach(route => {
          masterDataService.addRoute({
            ...route,
            importedFrom: result.fileName
          })
          totalRoutesImported++
        })
      }

      const successMessage = `✅ Importación completada:\n• ${totalWorkersImported} trabajadores nuevos\n• ${totalRoutesImported} rutas importadas`
      
      if (errors.length > 0) {
        setUploadStatus({
          type: 'warning',
          message: `${successMessage}\n\n⚠️ Advertencias:\n${errors.join('\n')}`
        })
      } else {
        setUploadStatus({
          type: 'success',
          message: successMessage
        })
      }

      // Recargar la página después de 3 segundos para mostrar los nuevos datos
      setTimeout(() => {
        window.location.reload()
      }, 3000)

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `Error importando datos: ${error.message}`
      })
    }
  }

  // Función para generar RUT temporal
  const generateTempRut = () => {
    const randomNum = Math.floor(Math.random() * 99999999) + 10000000
    return `${randomNum.toString().substring(0, 2)}.${randomNum.toString().substring(2, 5)}.${randomNum.toString().substring(5, 8)}-${Math.floor(Math.random() * 9) + 1}`
  }

  // Función para confirmar la importación
  const handleConfirmImport = async () => {
    setShowConfirmModal(false)
    setIsProcessing(true)
    
    try {
      await importProcessedData(processedResults)
    } catch (error) {
      console.error('Error importando datos:', error)
      setUploadStatus({
        type: 'error',
        message: `Error importando datos: ${error.message}`
      })
    } finally {
      setIsProcessing(false)
      setProcessedResults([])
    }
  }

  // Función para cancelar la importación
  const handleCancelImport = () => {
    setShowConfirmModal(false)
    setProcessedResults([])
    setUploadStatus({
      type: 'info',
      message: 'Importación cancelada por el usuario.'
    })
  }

  // Función para calcular el resumen total
  const calculateTotalSummary = (results) => {
    let totalWorkers = new Set()
    let totalRoutes = 0
    let totalShifts = 0
    let totalErrors = 0
    let fileNames = []
    let totalWorkerShifts = 0
    let totalServicesWithoutDriver = 0
    let allWorkerShiftCounts = new Map()
    let allWorkerShiftDetails = new Map()
    let allServicesWithoutDriver = []
    let shiftTypeBreakdown = {
      'PRIMER TURNO': 0,
      'SEGUNDO TURNO': 0,
      'TERCER TURNO': 0
    }

    results.forEach(result => {
      if (result.errors && result.errors.length > 0) {
        totalErrors += result.errors.length
      } else {
        if (result.workers) {
          result.workers.forEach(worker => totalWorkers.add(worker))
        }
        if (result.routes) {
          totalRoutes += result.routes.length
        }
        if (result.shifts) {
          totalShifts += result.shifts.length
        }
        if (result.summary) {
          totalWorkerShifts += result.summary.totalWorkerShifts || 0
          totalServicesWithoutDriver += result.summary.servicesWithoutDriverCount || 0
          
          // Consolidar desglose por tipo de turno
          if (result.summary.shiftTypeBreakdown) {
            Object.keys(shiftTypeBreakdown).forEach(shiftType => {
              shiftTypeBreakdown[shiftType] += result.summary.shiftTypeBreakdown[shiftType] || 0
            })
          }
        }
        
        // Consolidar conteos de turnos por trabajador
        if (result.workerShiftCount) {
          result.workerShiftCount.forEach((count, worker) => {
            const currentCount = allWorkerShiftCounts.get(worker) || 0
            allWorkerShiftCounts.set(worker, currentCount + count)
          })
        }
        
        // Consolidar detalles de turnos por trabajador
        if (result.workerShiftDetails) {
          result.workerShiftDetails.forEach((details, worker) => {
            if (!allWorkerShiftDetails.has(worker)) {
              allWorkerShiftDetails.set(worker, {
                'PRIMER TURNO': 0,
                'SEGUNDO TURNO': 0,
                'TERCER TURNO': 0,
                total: 0
              })
            }
            const consolidated = allWorkerShiftDetails.get(worker)
            consolidated['PRIMER TURNO'] += details['PRIMER TURNO'] || 0
            consolidated['SEGUNDO TURNO'] += details['SEGUNDO TURNO'] || 0
            consolidated['TERCER TURNO'] += details['TERCER TURNO'] || 0
            consolidated.total += details.total || 0
          })
        }
        
        // Consolidar servicios sin conductor
        if (result.servicesWithoutDriver) {
          allServicesWithoutDriver.push(...result.servicesWithoutDriver)
        }
      }
      fileNames.push(result.fileName)
    })

    return {
      totalUniqueWorkers: totalWorkers.size,
      totalRoutes,
      totalShifts,
      totalErrors,
      fileNames,
      workersList: Array.from(totalWorkers).sort(),
      totalWorkerShifts,
      totalServicesWithoutDriver,
      workerShiftCounts: allWorkerShiftCounts,
      workerShiftDetails: allWorkerShiftDetails,
      servicesWithoutDriver: allServicesWithoutDriver,
      shiftTypeBreakdown
    }
  }

  // Función para manejar clic en zona de arrastre
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleLoadDemoData = async () => {
    if (window.confirm('¿Deseas cargar datos de demostración? Esto sobrescribirá los datos existentes.')) {
      setIsLoadingDemo(true)
      try {
        masterDataService.loadDemoData()
        alert('Datos de demostración cargados correctamente.')
        // Recargar la página para reflejar los cambios
        window.location.reload()
      } catch (error) {
        console.error('Error al cargar datos demo:', error)
        alert('Error al cargar los datos demo. Inténtalo de nuevo.')
      } finally {
        setIsLoadingDemo(false)
      }
    }
  }

  const handleClearAllData = async () => {
    if (window.confirm('🗑️ ¿ELIMINAR TODOS LOS DATOS?\n\nEsto borrará:\n- Todos los trabajadores\n- Todos los vehículos\n- Todas las rutas\n- Todos los pagos\n\n⚠️ Esta acción NO se puede deshacer.\n\n¿Estás completamente seguro?')) {
      setIsClearing(true)
      try {
        masterDataService.resetAllData()
        alert('✅ ¡Todos los datos han sido eliminados correctamente!\n\nLa aplicación se recargará automáticamente.')
        // Recargar la página para reflejar los cambios
        window.location.reload()
      } catch (error) {
        console.error('Error al limpiar datos:', error)
        alert('❌ Error al eliminar los datos. Inténtalo de nuevo.')
      } finally {
        setIsClearing(false)
      }
    }
  }
  return (
    <div className="space-y-6">
      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Confirmar Importación de Datos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Revisa el resumen de los datos que se van a importar
              </p>
            </div>
            
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {(() => {
                const summary = calculateTotalSummary(processedResults)
                
                return (
                  <div className="space-y-6">
                    {/* Resumen General */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">{summary.totalUniqueWorkers}</div>
                        <div className="text-sm text-blue-700">Trabajadores Únicos</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <Route className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">{summary.totalRoutes}</div>
                        <div className="text-sm text-green-700">Rutas</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-600">{summary.totalShifts}</div>
                        <div className="text-sm text-purple-700">Turnos</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4 text-center">
                        <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-orange-600">{summary.fileNames.length}</div>
                        <div className="text-sm text-orange-700">Archivos</div>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4 text-center">
                        <TrendingUp className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-indigo-600">{summary.totalWorkerShifts}</div>
                        <div className="text-sm text-indigo-700">Total Turnos Trabajados</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">{summary.totalServicesWithoutDriver}</div>
                        <div className="text-sm text-yellow-700">Servicios Sin Conductor</div>
                      </div>
                    </div>

                    {/* Archivos Procesados */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">📁 Archivos a Procesar:</h3>
                      <div className="space-y-2">
                        {summary.fileNames.map((fileName, index) => (
                          <div key={index} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{fileName}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lista de Trabajadores */}
                    {summary.workersList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">👥 Trabajadores que se importarán:</h3>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {summary.workersList.map((worker, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>{worker}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conteo de Turnos por Trabajador */}
                    {summary.workerShiftCounts && summary.workerShiftCounts.size > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">📊 Turnos por Trabajador:</h3>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Array.from(summary.workerShiftCounts.entries())
                              .sort((a, b) => b[1] - a[1]) // Ordenar por cantidad de turnos descendente
                              .map(([worker, count], index) => {
                                const details = summary.workerShiftDetails?.get(worker)
                                return (
                                  <div key={index} className="bg-white rounded p-3 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium">{worker}</span>
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        {count} turnos total
                                      </span>
                                    </div>
                                    {details && (
                                      <div className="grid grid-cols-3 gap-1 text-xs">
                                        <div className="text-center">
                                          <div className="text-green-600 font-medium">{details['PRIMER TURNO']}</div>
                                          <div className="text-gray-500">1er</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-orange-600 font-medium">{details['SEGUNDO TURNO']}</div>
                                          <div className="text-gray-500">2do</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-purple-600 font-medium">{details['TERCER TURNO']}</div>
                                          <div className="text-gray-500">3er</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Desglose por Tipo de Turno */}
                    {summary.shiftTypeBreakdown && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">🕐 Desglose por Tipo de Turno:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{summary.shiftTypeBreakdown['PRIMER TURNO']}</div>
                            <div className="text-sm text-green-700">Primer Turno</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{summary.shiftTypeBreakdown['SEGUNDO TURNO']}</div>
                            <div className="text-sm text-orange-700">Segundo Turno</div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{summary.shiftTypeBreakdown['TERCER TURNO']}</div>
                            <div className="text-sm text-purple-700">Tercer Turno</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Servicios Sin Conductor */}
                    {summary.servicesWithoutDriver && summary.servicesWithoutDriver.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">⚠️ Servicios Sin Conductor:</h3>
                        <div className="bg-yellow-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            {summary.servicesWithoutDriver.map((service, index) => (
                              <div key={index} className="flex items-center gap-3 bg-white rounded p-3 border border-yellow-200">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">{service.fecha}</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{service.turno}</span>
                                  </div>
                                  {service.descripcion && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {service.descripcion}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detalles por Archivo */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">📊 Detalles por Archivo:</h3>
                      <div className="space-y-3">
                        {processedResults.map((result, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{result.fileName}</span>
                            </div>
                            
                            {result.errors && result.errors.length > 0 ? (
                              <div className="text-red-600 text-sm">
                                <strong>Errores:</strong>
                                <ul className="list-disc list-inside ml-4">
                                  {result.errors.map((error, errorIndex) => (
                                    <li key={errorIndex}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Trabajadores:</span>
                                    <span className="font-medium ml-2">{result.workers ? result.workers.size : 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Rutas:</span>
                                    <span className="font-medium ml-2">{result.routes ? result.routes.length : 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Turnos:</span>
                                    <span className="font-medium ml-2">{result.shifts ? result.shifts.length : 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Total Trabajados:</span>
                                    <span className="font-medium ml-2">{result.summary ? result.summary.totalWorkerShifts : 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Sin Conductor:</span>
                                    <span className="font-medium ml-2">{result.summary ? result.summary.servicesWithoutDriverCount : 0}</span>
                                  </div>
                                </div>
                                
                                {/* Mostrar top 5 trabajadores con más turnos para este archivo */}
                                {result.workerShiftCount && result.workerShiftCount.size > 0 && (
                                  <div className="mt-3">
                                    <span className="text-xs text-gray-500 font-medium">Top trabajadores:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {Array.from(result.workerShiftCount.entries())
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 5)
                                        .map(([worker, count], workerIndex) => (
                                        <span key={workerIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {worker} ({count})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Advertencias */}
                    {summary.totalErrors > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">Advertencias encontradas</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          Se encontraron {summary.totalErrors} errores en los archivos. 
                          Los archivos con errores no serán importados.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancelImport}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? 'Importando...' : 'Confirmar Importación'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cargar Archivos</h1>
        <p className="text-gray-600 mt-2">
          Importa datos de trabajadores, vehículos y rutas mediante archivos CSV o Excel
        </p>
      </div>

      {/* Upload Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Cargar Datos
            </CardTitle>
            <CardDescription>
              Selecciona un archivo para importar datos al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Status de carga */}
            {uploadStatus && (
              <div className={`mb-4 p-4 rounded-lg border ${
                uploadStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                uploadStatus.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {uploadStatus.type === 'success' ? <CheckCircle className="h-5 w-5 mt-0.5" /> :
                   uploadStatus.type === 'warning' ? <AlertCircle className="h-5 w-5 mt-0.5" /> :
                   <AlertCircle className="h-5 w-5 mt-0.5" />}
                  <div className="text-sm whitespace-pre-line">{uploadStatus.message}</div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={handleUploadClick}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                {isProcessing ? 'Procesando archivos...' : 'Arrastra archivos Excel aquí'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {isProcessing ? 'Por favor espera...' : 'o haz clic para seleccionar archivos (.xlsx, .xls)'}
              </p>
              <Button 
                className="mt-4" 
                variant="outline"
                disabled={isProcessing}
                onClick={(e) => {
                  e.stopPropagation()
                  handleUploadClick()
                }}
              >
                {isProcessing ? 'Procesando...' : 'Seleccionar Archivos Excel'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Formatos Soportados
            </CardTitle>
            <CardDescription>
              Tipos de archivos que puedes cargar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Planillas de Turnos (.xlsx, .xls)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Registro de Conductores</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Programación de Rutas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Control de Turnos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Carga</CardTitle>
          <CardDescription>
            Sigue estos pasos para cargar correctamente tus datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h4 className="font-semibold text-gray-900 mb-2">Formato de archivos Excel:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Archivos de planillas de turnos (.xlsx o .xls)</li>
              <li>La primera fila debe contener los encabezados</li>
              <li>Estructura esperada: FECHA, TURNO, CANT., CONDUCTOR 1-5, etc.</li>
              <li>Los archivos serán procesados automáticamente</li>
            </ul>
            
            <h4 className="font-semibold text-gray-900 mb-2 mt-4">Datos que se extraen:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Trabajadores:</strong>
                <ul className="list-disc list-inside ml-4 text-gray-600">
                  <li>Nombres de conductores</li>
                  <li>RUT temporal generado</li>
                  <li>Cargo: Conductor</li>
                  <li>Estado: Activo</li>
                </ul>
              </div>
              <div>
                <strong>Rutas:</strong>
                <ul className="list-disc list-inside ml-4 text-gray-600">
                  <li>Turnos programados</li>
                  <li>Fechas de servicio</li>
                  <li>Conductores asignados</li>
                  <li>Códigos automáticos</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> El sistema reconoce automáticamente la estructura de las planillas 
                y extrae los nombres de conductores, fechas y turnos. Los datos duplicados se filtran automáticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Data Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Database className="h-5 w-5" />
            Datos de Demostración
          </CardTitle>
          <CardDescription className="text-blue-600">
            Gestiona los datos del sistema: carga ejemplos o limpia todo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-blue-700">
              <p className="mb-2"><strong>Los datos demo incluyen:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Trabajadores de ejemplo (conductores y mecánico)</li>
                <li>Vehículos con diferentes estados</li>
                <li>Rutas principales de transporte</li>
                <li>Registros de pagos con diferentes estados</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={handleLoadDemoData}
                disabled={isLoadingDemo || isClearing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Database className="h-4 w-4 mr-2" />
                {isLoadingDemo ? 'Cargando...' : 'Cargar Datos Demo'}
              </Button>
              <Button 
                onClick={handleClearAllData}
                disabled={isClearing || isLoadingDemo}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isClearing ? 'Limpiando...' : 'Limpiar Todos los Datos'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UploadFiles
