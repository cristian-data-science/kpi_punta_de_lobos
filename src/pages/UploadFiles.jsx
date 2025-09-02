import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, Database, Trash2, AlertCircle, Users, Route, Clock, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import { useState, useRef } from 'react'
import masterDataService from '@/services/masterDataService'
import excelValidationService from '@/services/excelValidationService'
import inconsistenciesService from '@/services/inconsistenciesService'
import * as XLSX from 'xlsx'

const UploadFiles = () => {
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [processedResults, setProcessedResults] = useState([])
  const [validationMode, setValidationMode] = useState('default') // Nueva configuración
  const fileInputRef = useRef(null)

  // Función auxiliar para convertir fechas de Excel a JavaScript
  const excelDateToJSDate = (excelDate) => {
    const epoch = new Date(1900, 0, 1);
    return new Date(epoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
  };

  // Función para procesar archivos Excel de planillas de turnos - NUEVA VERSIÓN CON VALIDACIÓN ROBUSTA
  const processExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Procesar la primera hoja usando el nuevo servicio de validación
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          console.log(`📋 Procesando archivo con validación robusta: ${file.name}`)
          console.log(`🔧 Modo de validación: ${validationMode}`)
          
          // Usar el nuevo servicio de validación con configuración seleccionada
          const processedData = excelValidationService.validateAndCorrectExcel(worksheet, file.name, validationMode)
          
          // Agregar información adicional de procesamiento
          processedData.sheetName = sheetName
          processedData.processingMode = 'robust-validation'
          
          console.log(`✅ Archivo procesado con validación robusta:`, {
            archivo: file.name,
            errores: processedData.errors.length,
            advertencias: processedData.warnings.length,
            correcciones: processedData.correctionLog?.length || 0,
            turnos: processedData.turnos.length
          })
          
          resolve(processedData)
          
        } catch (error) {
          console.error(`❌ Error procesando archivo ${file.name}:`, error)
          reject(new Error(`Error procesando archivo ${file.name}: ${error.message}`))
        }
      }
      
      reader.onerror = () => reject(new Error(`Error leyendo archivo ${file.name}`))
      reader.readAsArrayBuffer(file)
    })
  }

  // Función para analizar la planilla de turnos - NUEVA LÓGICA COMPLETA
  const analyzeExcelTurnos = (worksheet, fileName) => {
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📋 Analizando archivo: ${fileName}`);
    console.log(`📊 Total de filas: ${data.length}`);
    
    // 1. ENCONTRAR LA FILA DE HEADERS
    let headerRowIndex = -1;
    let columnIndexes = {};
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some(cell => 
        cell && typeof cell === 'string' && 
        (cell.includes('FECHA') || cell.includes('TURNO') || cell.includes('CANT'))
      )) {
        headerRowIndex = i;
        const headers = row;
        
        // Mapear índices de columnas
        columnIndexes = {
          fecha: headers.findIndex(h => h && h.toString().includes('FECHA')),
          turno: headers.findIndex(h => h && h.toString().includes('TURNO')),
          cant: headers.findIndex(h => h && h.toString().includes('CANT')),
          conductor1: headers.findIndex(h => h && h.toString().includes('CONDUCTOR 1')),
          conductor2: headers.findIndex(h => h && h.toString().includes('CONDUCTOR 2')),
          conductor3: headers.findIndex(h => h && h.toString().includes('CONDUCTOR 3')),
          conductor4: headers.findIndex(h => h && h.toString().includes('CONDUCTOR 4')),
          conductor5: headers.findIndex(h => h && h.toString().includes('CONDUCTOR 5')),
          conductorExtra1: 8,  // Primera columna CONDUCTOR EXTRA
          conductorExtra2: 9,  // Segunda columna CONDUCTOR EXTRA  
          servSinConductor: 10, // SERV SIN CONDUCTOR
          conductor: 11,       // Columna CONDUCTOR adicional
          turnos: 12          // TURNOS
        };
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      return {
        fileName,
        errors: ['No se encontró la fila de headers'],
        warnings: [],
        turnos: [],
        conductorStats: new Map(),
        summary: {
          totalTurnos: 0,
          totalConductores: 0,
          turnosSinConductor: 0,
          desglosePorTipo: { 'PRIMER TURNO': 0, 'SEGUNDO TURNO': 0, 'TERCER TURNO': 0 },
          fechas: []
        },
        validationData: { totalEsperado: null, servSinConductEsperado: null }
      };
    }
    
    console.log('📍 Headers encontrados en fila:', headerRowIndex);
    console.log('🔍 Índices de columnas:', columnIndexes);
    
    // 2. PROCESAR DATOS DE TURNOS (desde header hasta encontrar TOTAL/recuentos)
    const result = {
      fileName,
      errors: [],
      warnings: [],
      turnos: [],
      conductorStats: new Map(),
      summary: {
        totalTurnos: 0,
        totalConductores: 0,
        turnosSinConductor: 0,
        desglosePorTipo: { 'PRIMER TURNO': 0, 'SEGUNDO TURNO': 0, 'TERCER TURNO': 0 },
        fechas: []
      },
      validationData: { totalEsperado: null, servSinConductEsperado: null }
    };
    
    let currentDate = null;
    let dataEndRow = data.length; // Por defecto hasta el final
    
    // Encontrar dónde terminan los datos de turnos (buscar primera fila con TOTAL o recuentos)
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (row && row.some(cell => 
        cell && typeof cell === 'string' && 
        (cell.toString().toUpperCase().includes('TOTAL') || 
         cell.toString().toUpperCase().includes('SERV SIN CONDUCT') ||
         // Detectar nombres de conductores en recuento (líneas con solo nombres sin fechas/turnos)
         (cell.length > 10 && /^[A-Z\s]+$/.test(cell) && !row[columnIndexes.fecha] && !row[columnIndexes.turno]))
      )) {
        dataEndRow = i;
        console.log('📊 Fin de datos de turnos en fila:', dataEndRow);
        break;
      }
    }
    
    // 3. PROCESAR FILAS DE DATOS DE TURNOS
    for (let i = headerRowIndex + 1; i < dataEndRow; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      // Detectar nueva fecha
      const fechaCell = row[columnIndexes.fecha];
      if (fechaCell && (typeof fechaCell === 'number' || (typeof fechaCell === 'string' && fechaCell.trim() !== ''))) {
        if (typeof fechaCell === 'number') {
          currentDate = excelDateToJSDate(fechaCell);
        } else {
          // Intentar parsear fecha como string
          const dateStr = fechaCell.toString().trim();
          currentDate = new Date(dateStr);
        }
        
        const fechaStr = currentDate?.toISOString().split('T')[0];
        if (fechaStr && !result.summary.fechas.includes(fechaStr)) {
          result.summary.fechas.push(fechaStr);
        }
      }
      
      // Procesar datos del turno
      const turnoCell = row[columnIndexes.turno];
      const cantCell = row[columnIndexes.cant];
      
      if (turnoCell && typeof turnoCell === 'string' && cantCell) {
        const turno = turnoCell.toString().trim().toUpperCase();
        const cantidadEsperada = typeof cantCell === 'number' ? cantCell : parseInt(cantCell) || 0;
        
        // Solo procesar si no es turno cancelado (X) y tiene cantidad válida
        if (turno !== 'X' && cantidadEsperada > 0) {
          const turnoData = {
            fecha: currentDate ? currentDate.toISOString().split('T')[0] : 'Sin fecha',
            turno: turno,
            cantidadEsperada: cantidadEsperada,
            conductoresAsignados: [],
            servSinConductor: 0
          };
          
          // Extraer conductores de las columnas (SOLO las columnas principales, no la adicional)
          const conductorColumns = [
            columnIndexes.conductor1,
            columnIndexes.conductor2, 
            columnIndexes.conductor3,
            columnIndexes.conductor4,
            columnIndexes.conductor5,
            columnIndexes.conductorExtra1,
            columnIndexes.conductorExtra2
            // NO incluir columnIndexes.conductor (columna 11) ya que parece ser información adicional
          ].filter(idx => idx !== -1 && idx !== undefined);
          
          let conductoresEncontrados = 0;
          const conductoresEnTurno = new Set(); // Para evitar duplicados en el mismo turno
          
          for (const colIdx of conductorColumns) {
            const conductorCell = row[colIdx];
            if (conductorCell && typeof conductorCell === 'string') {
              const nombreConductor = conductorCell.toString().trim();
              
              // Verificar que no sea 'x', 'X' o vacío
              if (nombreConductor !== '' && 
                  !nombreConductor.toLowerCase().includes('x') &&
                  nombreConductor.length > 1) {
                
                // Normalizar nombre para evitar duplicados por pequeñas diferencias
                const nombreNormalizado = nombreConductor.toUpperCase().trim();
                
                // Solo agregar si no está duplicado en este turno
                if (!conductoresEnTurno.has(nombreNormalizado)) {
                  conductoresEnTurno.add(nombreNormalizado);
                  turnoData.conductoresAsignados.push(nombreConductor);
                  conductoresEncontrados++;
                  
                  // Actualizar estadísticas del conductor
                  if (!result.conductorStats.has(nombreConductor)) {
                    result.conductorStats.set(nombreConductor, {
                      totalTurnos: 0,
                      'PRIMER TURNO': 0,
                      'SEGUNDO TURNO': 0,
                      'TERCER TURNO': 0,
                      fechas: []
                    });
                  }
                  
                  const stats = result.conductorStats.get(nombreConductor);
                  stats.totalTurnos++;
                  if (stats[turno] !== undefined) {
                    stats[turno]++;
                  }
                  if (!stats.fechas.includes(turnoData.fecha)) {
                    stats.fechas.push(turnoData.fecha);
                  }
                } else {
                  // Agregar advertencia por conductor duplicado
                  result.warnings.push(
                    `${turnoData.fecha} ${turno}: Conductor duplicado detectado: ${nombreConductor}`
                  );
                }
              }
            }
          }
          
          // Verificar servicios sin conductor (número en la columna)
          const servSinCell = row[columnIndexes.servSinConductor];
          if (servSinCell && typeof servSinCell === 'number' && servSinCell > 0) {
            turnoData.servSinConductor = servSinCell;
            result.summary.turnosSinConductor += servSinCell;
          }
          
          // Validar concordancia
          if (conductoresEncontrados !== cantidadEsperada) {
            result.warnings.push(
              `${turnoData.fecha} ${turno}: Se esperaban ${cantidadEsperada} conductores, se encontraron ${conductoresEncontrados}`
            );
          }
          
          // Agregar turno y actualizar contadores
          result.turnos.push(turnoData);
          result.summary.totalTurnos++;
          result.summary.totalConductores += conductoresEncontrados;
          
          if (result.summary.desglosePorTipo[turno] !== undefined) {
            result.summary.desglosePorTipo[turno]++;
          }
        }
      }
    }
    
    // 4. BUSCAR Y EXTRAER DATOS DE VALIDACIÓN (TOTAL y SERV SIN CONDUCT)
    for (let i = dataEndRow; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      // Buscar TOTAL
      const totalIndex = row.findIndex(cell => 
        cell && typeof cell === 'string' && cell.toString().includes('TOTAL')
      );
      if (totalIndex !== -1) {
        // Buscar número cerca del TOTAL
        for (let j = 0; j < row.length; j++) {
          if (typeof row[j] === 'number' && row[j] > 0) {
            result.validationData.totalEsperado = row[j];
            break;
          }
        }
      }
      
      // Buscar SERVICIOS SIN COND
      const servSinIndex = row.findIndex(cell => 
        cell && typeof cell === 'string' && 
        (cell.toString().includes('SERVICIOS SIN') || cell.toString().includes('SERV SIN CONDUCT'))
      );
      if (servSinIndex !== -1) {
        // Buscar número cerca de SERVICIOS SIN COND
        for (let j = 0; j < row.length; j++) {
          if (typeof row[j] === 'number' && row[j] >= 0) {
            result.validationData.servSinConductEsperado = row[j];
            break;
          }
        }
      }
    }
    
    // 5. VALIDACIONES FINALES
    if (result.validationData.totalEsperado && result.summary.totalConductores !== result.validationData.totalEsperado) {
      result.errors.push(
        `Total de conductores asignados no coincide: esperado ${result.validationData.totalEsperado}, encontrado ${result.summary.totalConductores}`
      );
    }
    
    if (result.validationData.servSinConductEsperado !== null && 
        result.summary.turnosSinConductor !== result.validationData.servSinConductEsperado) {
      result.warnings.push(
        `Servicios sin conductor no coincide: esperado ${result.validationData.servSinConductEsperado}, encontrado ${result.summary.turnosSinConductor}`
      );
    }
    
    console.log('✅ Análisis completado:', {
      totalTurnos: result.summary.totalTurnos,
      totalEsperado: result.validationData.totalEsperado,
      conductores: result.conductorStats.size,
      errores: result.errors.length,
      advertencias: result.warnings.length
    });
    
    return result;
  };

  // Función para manejar la subida de archivos
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setIsProcessing(true)
    setUploadStatus(null)

    try {
      const results = []
      
      for (const file of files) {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const result = await processExcelFile(file)
          results.push(result)
        } else {
          results.push({
            fileName: file.name,
            errors: ['Formato de archivo no soportado. Solo se aceptan archivos Excel (.xlsx, .xls)'],
            warnings: [],
            summary: {
              totalTurnos: 0,
              totalConductores: 0,
              turnosSinConductor: 0,
              desglosePorTipo: { 'PRIMER TURNO': 0, 'SEGUNDO TURNO': 0, 'TERCER TURNO': 0 }
            }
          })
        }
      }

      setProcessedResults(results)
      setShowConfirmModal(true)

    } catch (error) {
      setUploadStatus({ type: 'error', message: error.message })
    } finally {
      setIsProcessing(false)
    }
  }

  // Función para calcular el resumen total
  const calculateTotalSummary = () => {
    const summary = processedResults.reduce((total, result) => {
      return {
        files: total.files + 1,
        totalShifts: total.totalShifts + (result.summary?.totalTurnos || 0),
        uniqueWorkers: total.uniqueWorkers + (result.conductorStats?.size || 0),
        routes: total.routes + (result.summary?.fechas?.length || 0),
        totalWorkerShifts: total.totalWorkerShifts + (result.summary?.totalConductores || 0),
        servicesWithoutDriverCount: total.servicesWithoutDriverCount + (result.summary?.turnosSinConductor || 0),
        shiftTypeBreakdown: {
          'PRIMER TURNO': total.shiftTypeBreakdown['PRIMER TURNO'] + (result.summary?.desglosePorTipo?.['PRIMER TURNO'] || 0),
          'SEGUNDO TURNO': total.shiftTypeBreakdown['SEGUNDO TURNO'] + (result.summary?.desglosePorTipo?.['SEGUNDO TURNO'] || 0),
          'TERCER TURNO': total.shiftTypeBreakdown['TERCER TURNO'] + (result.summary?.desglosePorTipo?.['TERCER TURNO'] || 0)
        }
      }
    }, {
      files: 0,
      totalShifts: 0,
      uniqueWorkers: 0,
      routes: 0,
      totalWorkerShifts: 0,
      servicesWithoutDriverCount: 0,
      shiftTypeBreakdown: { 'PRIMER TURNO': 0, 'SEGUNDO TURNO': 0, 'TERCER TURNO': 0 }
    })

    // Calcular turnos que se van a importar (solo archivos válidos)
    const validResults = processedResults.filter(result => result.errors.length === 0)
    const turnosToImport = validResults.reduce((total, result) => {
      if (result.turnos && Array.isArray(result.turnos)) {
        return total + result.turnos.reduce((turnoSum, turno) => {
          return turnoSum + (turno.conductoresAsignados?.length || 0)
        }, 0)
      }
      return total
    }, 0)

    const totalCorrections = processedResults.reduce((total, result) => {
      return total + (result.correctionLog?.length || 0)
    }, 0)

    summary.turnosToImport = turnosToImport
    summary.totalCorrections = totalCorrections
    summary.validFiles = validResults.length
    summary.invalidFiles = processedResults.length - validResults.length

    return summary
  }

  // Función para confirmar importación
  const confirmImport = async () => {
    try {
      console.log('📋 Iniciando confirmación de importación...')
      console.log('📊 Resultados procesados:', processedResults)
      
      const validResults = processedResults.filter(result => result.errors.length === 0)
      
      console.log('✅ Resultados válidos:', validResults.length, 'de', processedResults.length)
      
      if (validResults.length === 0) {
        setUploadStatus({ type: 'error', message: 'No hay archivos válidos para importar' })
        setShowConfirmModal(false)
        return
      }

      // Procesar y guardar los turnos en masterDataService
      const allShifts = []
      let totalCorrectionsMade = 0
      
      validResults.forEach((result, resultIndex) => {
        console.log(`📂 Procesando archivo ${resultIndex + 1}: ${result.fileName}`)
        console.log(`📊 Estructura del resultado:`, result)
        console.log(`📊 Turnos encontrados:`, result.turnos?.length || 0)
        console.log(`🔧 Correcciones aplicadas:`, result.correctionLog?.length || 0)
        
        // Desglose detallado de turnos si existen
        if (result.turnos && result.turnos.length > 0) {
          console.log(`📝 Primeros 3 turnos:`, result.turnos.slice(0, 3))
          result.turnos.forEach((turno, idx) => {
            if (idx < 3) { // Solo los primeros 3 para no saturar
              console.log(`  📅 Turno ${idx + 1}:`, {
                fecha: turno.fecha,
                turno: turno.turno,
                conductores: turno.conductoresAsignados,
                cantidad: turno.cantidadEsperada
              })
            }
          })
        } else {
          console.warn(`⚠️ No hay turnos en este archivo`)
        }
        
        if (result.correctionLog) {
          totalCorrectionsMade += result.correctionLog.length
        }
        
        if (result.turnos && Array.isArray(result.turnos)) {
          result.turnos.forEach((turno, turnoIndex) => {
            console.log(`  🔄 Procesando turno ${turnoIndex + 1}:`, turno)
            
            // Crear un registro de turno por cada conductor asignado
            if (turno.conductoresAsignados && Array.isArray(turno.conductoresAsignados)) {
              turno.conductoresAsignados.forEach(conductorNombre => {
                allShifts.push({
                  fecha: turno.fecha,
                  turno: turno.turno,
                  conductorNombre: conductorNombre,
                  cantidadEsperada: turno.cantidadEsperada,
                  archivo: result.fileName,
                  fechaImportacion: new Date().toISOString(),
                  validationMode: result.configurationUsed || 'default',
                  correctionApplied: result.correctionLog?.length > 0
                })
              })
            } else {
              console.warn(`⚠️ Turno sin conductores asignados válidos:`, turno)
            }
          })
        } else {
          console.warn(`⚠️ Archivo sin turnos válidos:`, result.fileName)
        }
      })

      console.log('💾 Total de turnos a guardar:', allShifts.length)
      console.log('📝 Muestra de turnos:', allShifts.slice(0, 3))

      // Guardar en masterDataService
      if (allShifts.length > 0) {
        masterDataService.addWorkerShifts(allShifts)
        console.log('✅ Turnos guardados exitosamente en masterDataService')
      } else {
        console.warn('⚠️ No se encontraron turnos para guardar')
      }

      // Generar reportes de inconsistencias para cada archivo procesado
      console.log('📝 Generando reportes de inconsistencias...')
      for (const result of processedResults) {
        try {
          const processStats = {
            turnosImported: allShifts.filter(shift => shift.archivo === result.fileName).length,
            totalTurnosInFile: result.turnos ? result.turnos.length : 0,
            totalCorrections: result.correctionLog ? result.correctionLog.length : 0
          }
          
          const fileReport = inconsistenciesService.generateFileReport(
            result.fileName,
            result,
            processStats
          )
          
          await inconsistenciesService.updateInconsistencies(fileReport)
          console.log(`📊 Reporte de inconsistencias generado para: ${result.fileName}`)
        } catch (error) {
          console.error(`❌ Error generando reporte para ${result.fileName}:`, error)
        }
      }

      // Crear mensaje detallado de éxito
      const successMessage = [
        `✅ Importación completada exitosamente:`,
        `📂 ${validResults.length} archivo(s) procesado(s)`,
        `👥 ${allShifts.length} turno(s) importado(s)`,
        totalCorrectionsMade > 0 ? `🔧 ${totalCorrectionsMade} corrección(es) automática(s) aplicada(s)` : null
      ].filter(Boolean).join(' | ')

      setUploadStatus({ 
        type: 'success', 
        message: successMessage
      })
      
      setShowConfirmModal(false)
      setProcessedResults([])
      
      // Limpiar el input de archivo después de importar exitosamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      console.log('🎉 Proceso de importación completado')
      
    } catch (error) {
      console.error('❌ Error en confirmImport:', error)
      setUploadStatus({ type: 'error', message: `Error en importación: ${error.message}` })
    }
  }

  // Función para manejar la cancelación del modal
  const handleModalCancel = () => {
    setShowConfirmModal(false)
    setProcessedResults([])
    setUploadStatus(null)
    setIsProcessing(false)
    // Limpiar el input de archivo para permitir recargar el mismo archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Función para cargar datos demo
  const loadDemoData = async () => {
    setIsLoadingDemo(true)
    try {
      await masterDataService.loadDemoData()
      setUploadStatus({ type: 'success', message: 'Datos demo cargados exitosamente' })
    } catch (error) {
      setUploadStatus({ type: 'error', message: `Error cargando datos demo: ${error.message}` })
    } finally {
      setIsLoadingDemo(false)
    }
  }

  // Función para limpiar todos los datos
  const clearAllData = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
      return
    }

    setIsClearing(true)
    try {
      await masterDataService.resetAllData()
      await inconsistenciesService.clearInconsistencies()
      setUploadStatus({ type: 'success', message: 'Todos los datos e inconsistencias han sido eliminados exitosamente' })
    } catch (error) {
      setUploadStatus({ type: 'error', message: `Error eliminando datos: ${error.message}` })
    } finally {
      setIsClearing(false)
    }
  }

  // Función para manejar click en subir archivos
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const summary = calculateTotalSummary()
  const hasErrors = processedResults.some(result => result.errors.length > 0)
  const hasWarnings = processedResults.some(result => result.warnings.length > 0)

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Subida de Archivos</h1>
        <p className="text-gray-600">Importa archivos Excel de planillas de turnos para gestionar conductores y horarios</p>
      </div>

      {uploadStatus && (
        <div className={`p-4 rounded-lg ${
          uploadStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          uploadStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {uploadStatus.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
             uploadStatus.type === 'error' ? <AlertCircle className="h-5 w-5" /> :
             <FileText className="h-5 w-5" />}
            <span>{uploadStatus.message}</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subir Archivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Subir Archivos Excel</span>
            </CardTitle>
            <CardDescription>
              Selecciona archivos Excel (.xlsx, .xls) con planillas de turnos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de modo de validación */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Modo de Validación
              </label>
              <select 
                value={validationMode} 
                onChange={(e) => setValidationMode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              >
                <option value="default">Estándar - Validación equilibrada con correcciones automáticas</option>
                <option value="permissive">Permisivo - Acepta y corrige la mayoría de errores</option>
                <option value="strict">Estricto - Rechaza archivos con cualquier inconsistencia</option>
                <option value="legacy">Planillas Antiguas - Para formatos no estándar</option>
              </select>
              <p className="text-xs text-gray-500">
                {validationMode === 'default' && '✅ Modo recomendado para la mayoría de casos'}
                {validationMode === 'permissive' && '🔧 Ideal para archivos con errores menores frecuentes'}
                {validationMode === 'strict' && '⚠️ Solo archivos perfectamente formateados'}
                {validationMode === 'legacy' && '📄 Para archivos con formatos antiguos o variantes'}
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              onClick={handleUploadClick}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Procesando...' : 'Seleccionar Archivos'}
            </Button>
          </CardContent>
        </Card>

        {/* Datos Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Datos Demo</span>
            </CardTitle>
            <CardDescription>
              Carga datos de ejemplo para probar la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={loadDemoData}
              disabled={isLoadingDemo}
              variant="outline"
              className="w-full h-10 flex items-center justify-center"
            >
              <Database className="h-4 w-4 mr-2" />
              {isLoadingDemo ? 'Cargando...' : 'Cargar Datos Demo'}
            </Button>
            <Button 
              onClick={clearAllData}
              disabled={isClearing}
              variant="destructive"
              className="w-full h-10 flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? 'Eliminando...' : 'Limpiar Todos los Datos'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl border">
            <div className="p-6 border-b bg-white">
              <h2 className="text-xl font-bold">Confirmar Importación</h2>
              <p className="text-gray-600">Revisa el resumen antes de confirmar la importación</p>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
              {/* Resumen General */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">{summary.validFiles}</div>
                    <div className="text-sm text-gray-600">Válidos</div>
                    {summary.invalidFiles > 0 && (
                      <div className="text-xs text-red-500 mt-1">{summary.invalidFiles} con errores</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">{summary.turnosToImport}</div>
                    <div className="text-sm text-gray-600">Turnos a importar</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-600">{summary.uniqueWorkers}</div>
                    <div className="text-sm text-gray-600">Conductores únicos</div>
                  </CardContent>
                </Card>

                {summary.totalCorrections > 0 && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold text-orange-600">{summary.totalCorrections}</div>
                      <div className="text-sm text-gray-600">Correcciones aplicadas</div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Route className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                    <div className="text-2xl font-bold text-indigo-600">{summary.routes}</div>
                    <div className="text-sm text-gray-600">Fechas</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <div className="text-2xl font-bold text-gray-600">{summary.totalShifts}</div>
                    <div className="text-sm text-gray-600">Eventos de turno</div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Archivos */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  📁 Archivos a Procesar:
                </h3>
                <div className="space-y-2">
                  {processedResults.map((result, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {result.fileName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose por Tipo de Turno */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  🕐 Desglose por Tipo de Turno:
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.shiftTypeBreakdown['PRIMER TURNO']}</div>
                    <div className="text-sm text-gray-600">Primer Turno</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.shiftTypeBreakdown['SEGUNDO TURNO']}</div>
                    <div className="text-sm text-gray-600">Segundo Turno</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{summary.shiftTypeBreakdown['TERCER TURNO']}</div>
                    <div className="text-sm text-gray-600">Tercer Turno</div>
                  </div>
                </div>
              </div>

              {/* Detalles por Archivo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  📊 Detalles por Archivo:
                </h3>
                {processedResults.map((result, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center justify-between">
                        <span>{result.fileName}</span>
                        <div className="flex items-center space-x-2">
                          {result.configurationUsed && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Config: {result.configurationUsed}
                            </span>
                          )}
                          {result.processingMode === 'robust-validation' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Validación Robusta
                            </span>
                          )}
                        </div>
                      </h4>
                      
                      {/* Mostrar estadísticas de procesamiento */}
                      {result.correctionLog && result.correctionLog.length > 0 && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <div className="text-blue-700 font-medium text-sm">
                            ✨ Correcciones Automáticas Aplicadas: {result.correctionLog.length}
                          </div>
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                              Ver detalles de correcciones
                            </summary>
                            <div className="mt-2 space-y-1 text-xs">
                              {result.correctionLog.slice(0, 10).map((correction, i) => (
                                <div key={i} className="p-2 bg-white rounded border">
                                  <strong>{correction.message}:</strong>
                                  <br />
                                  <span className="text-gray-600">
                                    Original: "{correction.data.original}" → Corregido: "{correction.data.corrected}"
                                  </span>
                                </div>
                              ))}
                              {result.correctionLog.length > 10 && (
                                <div className="text-gray-500 italic">
                                  ... y {result.correctionLog.length - 10} correcciones más
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                      
                      {result.errors.length > 0 && (
                        <div className="mb-2">
                          <div className="text-red-600 font-medium">❌ Errores:</div>
                          <ul className="list-disc list-inside text-sm text-red-600">
                            {result.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.warnings.length > 0 && (
                        <div className="mb-2">
                          <div className="text-yellow-600 font-medium">⚠️ Advertencias:</div>
                          <details className="text-sm text-yellow-600">
                            <summary className="cursor-pointer hover:text-yellow-800">
                              {result.warnings.length} advertencias encontradas (click para expandir)
                            </summary>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              {result.warnings.map((warning, i) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      )}

                      {/* Mostrar logs de procesamiento si están disponibles */}
                      {result.processingLog && result.processingLog.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                            📋 Ver log completo de procesamiento ({result.processingLog.length} entradas)
                          </summary>
                          <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                            {result.processingLog.map((log, i) => (
                              <div key={i} className="text-xs mb-1 p-1 border-b border-gray-200">
                                <span className={`font-medium ${
                                  log.level === 'error' ? 'text-red-600' :
                                  log.level === 'warning' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>
                                  [{log.level.toUpperCase()}]
                                </span>
                                <span className="ml-2">{log.message}</span>
                                {log.data && Object.keys(log.data).length > 0 && (
                                  <div className="ml-4 text-gray-500">
                                    {JSON.stringify(log.data, null, 2)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {hasErrors && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-700 font-medium">
                    ⚠️ Advertencias encontradas
                  </div>
                  <div className="text-red-600 text-sm mt-1">
                    Se encontraron {processedResults.filter(r => r.errors.length > 0).length} errores en los archivos. Los archivos con errores no serán importados.
                  </div>
                </div>
              )}

              {/* Desglose detallado por trabajador */}
              {processedResults.length > 0 && processedResults.some(result => result.conductorStats && result.conductorStats.size > 0) && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Desglose de Turnos por Trabajador
                  </h3>
                  
                  {processedResults.map((result, resultIndex) => (
                    result.conductorStats && result.conductorStats.size > 0 && (
                      <div key={resultIndex} className="space-y-3">
                        <h4 className="font-medium text-gray-700 border-b pb-2">
                          📋 {result.fileName}
                        </h4>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left p-3 font-medium text-gray-700">👤 Trabajador</th>
                                <th className="text-center p-3 font-medium text-gray-700">Total</th>
                                <th className="text-center p-3 font-medium text-blue-600">1er Turno</th>
                                <th className="text-center p-3 font-medium text-orange-600">2do Turno</th>
                                <th className="text-center p-3 font-medium text-purple-600">3er Turno</th>
                                <th className="text-center p-3 font-medium text-gray-700">Días</th>
                                <th className="text-center p-3 font-medium text-gray-700">Promedio</th>
                                <th className="text-left p-3 font-medium text-gray-700">📅 Fechas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from(result.conductorStats.entries())
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([conductorName, stats], idx) => (
                                <tr key={conductorName} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                  <td className="p-3 font-medium text-gray-800">{conductorName}</td>
                                  <td className="p-3 text-center font-semibold text-gray-900">{stats.totalTurnos}</td>
                                  <td className="p-3 text-center text-blue-700 font-medium">{stats['PRIMER TURNO'] || 0}</td>
                                  <td className="p-3 text-center text-orange-700 font-medium">{stats['SEGUNDO TURNO'] || 0}</td>
                                  <td className="p-3 text-center text-purple-700 font-medium">{stats['TERCER TURNO'] || 0}</td>
                                  <td className="p-3 text-center text-gray-600">{stats.fechas?.length || 0}</td>
                                  <td className="p-3 text-center text-gray-600 font-medium">
                                    {stats.fechas?.length > 0 ? (stats.totalTurnos / stats.fechas.length).toFixed(1) : '0.0'}
                                  </td>
                                  <td className="p-3 text-xs text-gray-500 max-w-xs">
                                    {stats.fechas && stats.fechas.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {stats.fechas.map((fecha, fechaIdx) => {
                                          const fechaObj = new Date(fecha + 'T00:00:00');
                                          
                                          // Verificar si la fecha es válida
                                          if (isNaN(fechaObj.getTime())) {
                                            return (
                                              <span key={fechaIdx} className="inline-block px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                                ❌ Fecha inválida
                                              </span>
                                            );
                                          }
                                          
                                          return (
                                            <span key={fechaIdx} className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                              {fechaObj.toLocaleDateString('es-ES', { 
                                                day: '2-digit', 
                                                month: '2-digit' 
                                              })}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">Sin fechas</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
                                <td className="p-3 text-gray-800">
                                  📊 Total ({result.conductorStats.size} trabajadores)
                                </td>
                                <td className="p-3 text-center text-gray-900">
                                  {Array.from(result.conductorStats.values()).reduce((sum, stats) => sum + stats.totalTurnos, 0)}
                                </td>
                                <td className="p-3 text-center text-blue-700">
                                  {Array.from(result.conductorStats.values()).reduce((sum, stats) => sum + (stats['PRIMER TURNO'] || 0), 0)}
                                </td>
                                <td className="p-3 text-center text-orange-700">
                                  {Array.from(result.conductorStats.values()).reduce((sum, stats) => sum + (stats['SEGUNDO TURNO'] || 0), 0)}
                                </td>
                                <td className="p-3 text-center text-purple-700">
                                  {Array.from(result.conductorStats.values()).reduce((sum, stats) => sum + (stats['TERCER TURNO'] || 0), 0)}
                                </td>
                                <td className="p-3 text-center text-gray-600">
                                  {Array.from(new Set(Array.from(result.conductorStats.values()).flatMap(stats => stats.fechas || []))).length}
                                </td>
                                <td className="p-3 text-center text-gray-600">
                                  {(Array.from(result.conductorStats.values()).reduce((sum, stats) => sum + stats.totalTurnos, 0) / 
                                    Array.from(new Set(Array.from(result.conductorStats.values()).flatMap(stats => stats.fechas || []))).length).toFixed(1)}
                                </td>
                                <td className="p-3 text-xs text-gray-500">
                                  Promedio general de turnos por día
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              {/* Espaciador para evitar que el contenido se superponga con los botones */}
              <div className="h-4"></div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3 sticky bottom-0">
              <Button 
                variant="outline" 
                onClick={handleModalCancel}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmImport}
                disabled={hasErrors}
                className="min-w-[120px]"
              >
                Confirmar Importación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadFiles