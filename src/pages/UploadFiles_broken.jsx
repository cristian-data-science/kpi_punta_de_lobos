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

  // Función auxiliar para convertir fechas de Excel a JavaScript
  const excelDateToJSDate = (excelDate) => {
    const epoch = new Date(1900, 0, 1);
    return new Date(epoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
  };

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
          const processedData = analyzeExcelTurnos(worksheet, file.name)
          resolve(processedData)
          
        } catch (error) {
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
          conductorExtra: headers.map((h, idx) => h && h.toString().includes('CONDUCTOR EXTRA') ? idx : -1).filter(idx => idx !== -1),
          servSinConductor: headers.findIndex(h => h && h.toString().includes('SERV SIN CONDUCTOR')),
          conductor: headers.lastIndexOf('CONDUCTOR'), // La última columna CONDUCTOR
          turnos: headers.findIndex(h => h && h.toString().includes('TURNOS'))
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
        (cell.toString().includes('TOTAL') || 
         cell.toString().includes('SERV SIN CONDUCT') ||
         (cell.length > 10 && /^[A-Z\s]+$/.test(cell))) // Detectar nombres de conductores en recuento
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
            servSinConductor: false
          };
          
          // Extraer conductores de las columnas
          const conductorColumns = [
            columnIndexes.conductor1,
            columnIndexes.conductor2, 
            columnIndexes.conductor3,
            columnIndexes.conductor4,
            columnIndexes.conductor5,
            ...columnIndexes.conductorExtra
          ].filter(idx => idx !== -1);
          
          let conductoresEncontrados = 0;
          
          for (const colIdx of conductorColumns) {
            const conductorCell = row[colIdx];
            if (conductorCell && typeof conductorCell === 'string') {
              const nombreConductor = conductorCell.toString().trim();
              
              // Verificar que no sea 'x', 'X' o vacío
              if (nombreConductor !== '' && 
                  !nombreConductor.toLowerCase().includes('x') &&
                  nombreConductor.length > 1) {
                
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
              }
            }
          }
          
          // Verificar servicios sin conductor
          const servSinCell = row[columnIndexes.servSinConductor];
          if (servSinCell && (servSinCell.toString().toLowerCase().includes('x') || servSinCell === 'X')) {
            turnoData.servSinConductor = true;
            result.summary.turnosSinConductor++;
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
    if (result.validationData.totalEsperado && result.summary.totalTurnos !== result.validationData.totalEsperado) {
      result.errors.push(
        `Total de turnos no coincide: esperado ${result.validationData.totalEsperado}, encontrado ${result.summary.totalTurnos}`
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
          conductorExtra: headers.map((h, idx) => h && h.toString().includes('CONDUCTOR EXTRA') ? idx : -1).filter(idx => idx !== -1),
          servSinConductor: headers.findIndex(h => h && h.toString().includes('SERV SIN CONDUCTOR')),
          conductor: headers.lastIndexOf('CONDUCTOR'), // La última columna CONDUCTOR
          turnos: headers.findIndex(h => h && h.toString().includes('TURNOS'))
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
        (cell.toString().includes('TOTAL') || 
         cell.toString().includes('SERV SIN CONDUCT') ||
         (cell.length > 10 && /^[A-Z\s]+$/.test(cell))) // Detectar nombres de conductores en recuento
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
        
        if (!result.summary.fechas.includes(currentDate?.toISOString().split('T')[0])) {
          result.summary.fechas.push(currentDate?.toISOString().split('T')[0]);
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
            servSinConductor: false
          };
          
          // Extraer conductores de las columnas
          const conductorColumns = [
            columnIndexes.conductor1,
            columnIndexes.conductor2, 
            columnIndexes.conductor3,
            columnIndexes.conductor4,
            columnIndexes.conductor5,
            ...columnIndexes.conductorExtra
          ].filter(idx => idx !== -1);
          
          let conductoresEncontrados = 0;
          
          for (const colIdx of conductorColumns) {
            const conductorCell = row[colIdx];
            if (conductorCell && typeof conductorCell === 'string') {
              const nombreConductor = conductorCell.toString().trim();
              
              // Verificar que no sea 'x', 'X' o vacío
              if (nombreConductor !== '' && 
                  !nombreConductor.toLowerCase().includes('x') &&
                  nombreConductor.length > 1) {
                
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
              }
            }
          }
          
          // Verificar servicios sin conductor
          const servSinCell = row[columnIndexes.servSinConductor];
          if (servSinCell && (servSinCell.toString().toLowerCase().includes('x') || servSinCell === 'X')) {
            turnoData.servSinConductor = true;
            result.summary.turnosSinConductor++;
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
    if (result.validationData.totalEsperado && result.summary.totalTurnos !== result.validationData.totalEsperado) {
      result.errors.push(
        `Total de turnos no coincide: esperado ${result.validationData.totalEsperado}, encontrado ${result.summary.totalTurnos}`
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
  const analyzeShiftSchedule = (worksheet, fileName) => {
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

      // Procesar fila de datos normal - verificar que tenga CANT y TURNO válidos
      if (row.length > cantIndex && 
          row[cantIndex] && 
          typeof row[cantIndex] === 'number' && 
          row[1] && 
          typeof row[1] === 'string') {
        
        const expectedConductors = row[cantIndex];
        const shiftType = row[1].toString().trim(); // Columna TURNO
        
        // Solo procesar si hay cantidad válida y no es "X"
        if (expectedConductors > 0 && shiftType !== 'X') {
          // Contar conductores asignados (excluyendo 'x', 'X' y celdas vacías)
          let assignedConductors = 0;
          const conductoresAsignados = [];
          
          // Buscar conductores en las columnas después de CANT
          for (let i = cantIndex + 1; i < row.length; i++) {
            const cell = row[i];
            if (cell && 
                typeof cell === 'string' && 
                cell.trim() !== '' && 
                !cell.toLowerCase().includes('x') &&
                !cell.toLowerCase().includes('serv sin') &&
                !cell.toLowerCase().includes('total') &&
                !cell.toLowerCase().includes('servicios sin')) {
              
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
    return processedResults.reduce((total, result) => {
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
  }

  // Función para confirmar importación
  const confirmImport = async () => {
    try {
      const validResults = processedResults.filter(result => result.errors.length === 0)
      
      if (validResults.length === 0) {
        setUploadStatus({ type: 'error', message: 'No hay archivos válidos para importar' })
        setShowConfirmModal(false)
        return
      }

      // Aquí iría la lógica para guardar en masterDataService
      // Por ahora solo mostramos éxito
      setUploadStatus({ 
        type: 'success', 
        message: `Se procesaron ${validResults.length} archivo(s) exitosamente.` 
      })
      setShowConfirmModal(false)
      setProcessedResults([])
    } catch (error) {
      setUploadStatus({ type: 'error', message: error.message })
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
      setUploadStatus({ type: 'success', message: 'Todos los datos han sido eliminados exitosamente' })
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
              className="w-full"
            >
              {isLoadingDemo ? 'Cargando...' : 'Cargar Datos Demo'}
            </Button>
            <Button 
              onClick={clearAllData}
              disabled={isClearing}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? 'Eliminando...' : 'Limpiar Todos los Datos'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Confirmar Importación</h2>
              <p className="text-gray-600">Revisa el resumen antes de confirmar la importación</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Resumen General */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{summary.uniqueWorkers}</div>
                    <div className="text-sm text-gray-600">Únicos</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Route className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">{summary.routes}</div>
                    <div className="text-sm text-gray-600">Rutas</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">{summary.totalShifts}</div>
                    <div className="text-sm text-gray-600">Turnos</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold">{summary.files}</div>
                    <div className="text-sm text-gray-600">Archivos</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                    <div className="text-2xl font-bold">{summary.totalWorkerShifts}</div>
                    <div className="text-sm text-gray-600">Total Turnos Trabajados</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                    <div className="text-2xl font-bold">{summary.servicesWithoutDriverCount}</div>
                    <div className="text-sm text-gray-600">Servicios Sin Conductor</div>
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
                      <h4 className="font-semibold mb-2">{result.fileName}</h4>
                      
                      {result.errors.length > 0 && (
                        <div className="mb-2">
                          <div className="text-red-600 font-medium">Errores:</div>
                          <ul className="list-disc list-inside text-sm text-red-600">
                            {result.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.warnings.length > 0 && (
                        <div className="mb-2">
                          <div className="text-yellow-600 font-medium">Advertencias:</div>
                          <div className="text-sm text-yellow-600">
                            Se encontraron {result.warnings.length} advertencias
                          </div>
                        </div>
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
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmImport}
                disabled={hasErrors}
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