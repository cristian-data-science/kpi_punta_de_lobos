import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, Database, Trash2, AlertCircle, Users, Route, Clock, Calendar, TrendingUp, AlertTriangle, CloudUpload, Server, Lightbulb } from 'lucide-react'
import { useState, useRef } from 'react'
import masterDataService from '@/services/masterDataService'
import excelValidationService from '@/services/excelValidationService'
import inconsistenciesService from '@/services/inconsistenciesService'
import { getSupabaseClient } from '../services/supabaseClient.js'
import * as XLSX from 'xlsx'

// Conexión singleton a Supabase (fuera del componente para evitar múltiples instancias)
const supabase = getSupabaseClient()

const UploadFiles = () => {
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [processedResults, setProcessedResults] = useState([])
  const [validationMode, setValidationMode] = useState('default') // Nueva configuración
  const [saveToSupabase, setSaveToSupabase] = useState(true) // Nueva opción para guardar en Supabase
  const [isUploadingToSupabase, setIsUploadingToSupabase] = useState(false)
  const [officialWorkers, setOfficialWorkers] = useState([]) // Trabajadores oficiales de Supabase
  const [workerMapping, setWorkerMapping] = useState(new Map()) // Mapeo manual nombre_archivo -> trabajador_oficial
  const [showMappingInterface, setShowMappingInterface] = useState(false)
  const [uniqueFileWorkers, setUniqueFileWorkers] = useState([]) // Nombres únicos del archivo
  const fileInputRef = useRef(null)

  // Función auxiliar para convertir fechas de Excel a JavaScript
  const excelDateToJSDate = (excelDate) => {
    const epoch = new Date(1900, 0, 1);
    return new Date(epoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
  };

  // Función para cargar trabajadores oficiales de Supabase
  const loadOfficialWorkers = async () => {
    try {
      console.log('👥 Cargando trabajadores oficiales de Supabase...')
      const { data, error } = await supabase
        .from('trabajadores')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre')
      
      if (error) throw error
      
      console.log('✅ Trabajadores oficiales cargados:', data?.length || 0)
      setOfficialWorkers(data || [])
      
      // Auto-aplicar sugerencias después de cargar trabajadores
      if (data && data.length > 0 && uniqueFileWorkers.length > 0) {
        console.log('🎯 Auto-aplicando sugerencias iniciales...')
        setTimeout(() => {
          applySuggestionsAfterLoad(data)
        }, 200)
      }
      
      return data || []
    } catch (error) {
      console.error('❌ Error cargando trabajadores oficiales:', error)
      setOfficialWorkers([])
      return []
    }
  }

  // Función para aplicar sugerencias después de cargar trabajadores
  const applySuggestionsAfterLoad = (workers) => {
    try {
      const suggestions = new Map()
      
      uniqueFileWorkers.forEach(fileWorker => {
        let bestMatch = null
        let bestScore = 0
        
        workers.forEach(officialWorker => {
          const similarity = calculateNameSimilarity(fileWorker, officialWorker.nombre)
          if (similarity > bestScore && similarity >= 0.4) {
            bestScore = similarity
            bestMatch = {
              id: officialWorker.id,
              name: officialWorker.nombre,
              rut: officialWorker.rut,
              score: similarity
            }
          }
        })
        
        if (bestMatch) {
          suggestions.set(fileWorker, bestMatch)
          console.log(`💡 Auto-sugerencia para "${fileWorker}": ${bestMatch.name} (${Math.round(bestMatch.score * 100)}% confianza)`)
        }
      })
      
      // Aplicar las sugerencias automáticamente
      const newMapping = new Map()
      suggestions.forEach((suggestion, fileWorker) => {
        newMapping.set(fileWorker, suggestion.id)
      })
      
      setWorkerMapping(newMapping)
      console.log(`🚀 Auto-aplicadas ${suggestions.size} sugerencias iniciales`)
      
    } catch (error) {
      console.error('❌ Error auto-aplicando sugerencias:', error)
    }
  }

  // Función para extraer nombres únicos de trabajadores desde los turnos procesados
  const extractUniqueWorkersFromShifts = (allShifts) => {
    const uniqueNames = new Set()
    
    allShifts.forEach(shift => {
      const workerName = shift.conductorNombre
      if (workerName && workerName.trim() !== '') {
        uniqueNames.add(workerName.trim())
      }
    })
    
    const uniqueArray = Array.from(uniqueNames).sort()
    console.log('👥 Nombres únicos en archivos:', uniqueArray.length)
    console.log('📝 Nombres encontrados:', uniqueArray)
    return uniqueArray
  }

  // Función para transformar turnos al formato de Supabase usando mapeo manual
  const transformShiftsForSupabase = (results) => {
    const supabaseShifts = []
    let unmappedCount = 0
    const omittedWorkers = new Set()
    
    results.forEach(result => {
      if (result.turnos && result.turnos.length > 0) {
        result.turnos.forEach(turno => {
          if (turno.conductoresAsignados && Array.isArray(turno.conductoresAsignados)) {
            turno.conductoresAsignados.forEach(conductor => {
              const conductorName = conductor.trim()
              const mappedWorkerId = workerMapping.get(conductorName)
              
              if (mappedWorkerId) {
                // Mapear tipo de turno al formato de Supabase
                let turno_tipo = 'primer_turno'
                const tipoTurno = turno.turno || ''
                if (tipoTurno.includes('SEGUNDO')) {
                  turno_tipo = 'segundo_turno'
                } else if (tipoTurno.includes('TERCER')) {
                  turno_tipo = 'tercer_turno'
                }
                
                supabaseShifts.push({
                  trabajador_id: mappedWorkerId,
                  fecha: turno.fecha,
                  turno_tipo: turno_tipo,
                  estado: 'programado'
                })
              } else {
                unmappedCount++
                omittedWorkers.add(conductorName)
                console.warn('⚠️ Turno sin mapear:', conductorName, turno.fecha, turno.turno)
              }
            })
          }
        })
      }
    })
    
    console.log('📅 Turnos transformados para Supabase:', supabaseShifts.length)
    if (unmappedCount > 0) {
      console.warn('⚠️ Turnos sin mapear:', unmappedCount, 'de trabajadores:', Array.from(omittedWorkers))
    }
    return { 
      shifts: supabaseShifts, 
      unmapped: unmappedCount,
      omittedWorkers: Array.from(omittedWorkers)
    }
  }

  // Función para verificar si el mapeo está completo
  const isMappingComplete = () => {
    return uniqueFileWorkers.every(workerName => workerMapping.has(workerName))
  }

  // Función para obtener estadísticas del mapeo
  const getMappingStats = () => {
    const totalWorkers = uniqueFileWorkers.length
    const mappedWorkers = uniqueFileWorkers.filter(worker => workerMapping.has(worker))
    const unmappedWorkers = uniqueFileWorkers.filter(worker => !workerMapping.has(worker))
    
    return {
      total: totalWorkers,
      mapped: mappedWorkers.length,
      unmapped: unmappedWorkers.length,
      mappedNames: mappedWorkers,
      unmappedNames: unmappedWorkers,
      canProceed: mappedWorkers.length > 0 // Puede proceder si hay al menos 1 mapeado
    }
  }

  // Función para calcular cuántos turnos se cargarán vs se omitirán
  const getShiftStats = () => {
    let turnosACargar = 0
    let turnosAOmitir = 0
    
    processedResults.forEach(result => {
      if (result.turnos && result.turnos.length > 0) {
        result.turnos.forEach(turno => {
          if (turno.conductoresAsignados && Array.isArray(turno.conductoresAsignados)) {
            turno.conductoresAsignados.forEach(conductor => {
              const conductorName = conductor.trim()
              if (workerMapping.has(conductorName)) {
                turnosACargar++
              } else {
                turnosAOmitir++
              }
            })
          }
        })
      }
    })
    
    return { turnosACargar, turnosAOmitir }
  }

  // Función para manejar la asignación de trabajadores
  const handleWorkerMapping = (fileWorkerName, officialWorkerId) => {
    const updatedMapping = new Map(workerMapping)
    if (officialWorkerId) {
      const worker = officialWorkers.find(w => w.id === officialWorkerId)
      console.log(`✅ Mapeando "${fileWorkerName}" -> "${worker?.nombre || 'Desconocido'}" (ID: ${officialWorkerId})`)
      updatedMapping.set(fileWorkerName, officialWorkerId)
    } else {
      console.log(`❌ Desmapeando "${fileWorkerName}"`)
      updatedMapping.delete(fileWorkerName)
    }
    setWorkerMapping(updatedMapping)
    
    // Log estado actual del mapeo
    console.log('📊 Mapeo actual:', {
      total: updatedMapping.size,
      completado: `${updatedMapping.size}/${uniqueFileWorkers.length}`,
      estado: Object.fromEntries(updatedMapping)
    })
  }

  // Función para normalizar nombres para comparación
  const normalizeName = (name) => {
    if (!name) return ''
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
      .trim()
  }

  // Función para calcular similitud entre nombres
  const calculateNameSimilarity = (name1, name2) => {
    if (!name1 || !name2) return 0
    
    const normalized1 = normalizeName(name1)
    const normalized2 = normalizeName(name2)
    
    // Verificar coincidencia exacta
    if (normalized1 === normalized2) return 1.0
    
    // Verificar si uno contiene al otro completamente
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.9
    
    // Separar palabras y filtrar palabras muy cortas (< 3 caracteres)
    const words1 = normalized1.split(/\s+/).filter(w => w.length >= 2)
    const words2 = normalized2.split(/\s+/).filter(w => w.length >= 2)
    
    // Algoritmo mejorado de coincidencia de palabras
    let matchingWords = 0
    let exactMatches = 0
    let partialMatches = 0
    
    words1.forEach(word1 => {
      let bestMatchForWord = 0
      
      words2.forEach(word2 => {
        if (word1 === word2) {
          // Coincidencia exacta
          exactMatches++
          bestMatchForWord = Math.max(bestMatchForWord, 1.0)
        } else if (word1.length >= 4 && word2.length >= 4) {
          // Para palabras largas, verificar similitud parcial mejorada
          if (word1.includes(word2) || word2.includes(word1)) {
            partialMatches += 0.8
            bestMatchForWord = Math.max(bestMatchForWord, 0.8)
          } else {
            // Similitud por caracteres comunes en palabras largas
            const commonChars = [...word1].filter(char => word2.includes(char)).length
            const similarity = commonChars / Math.max(word1.length, word2.length)
            if (similarity >= 0.6) { // 60% de similitud mínima
              partialMatches += similarity * 0.6
              bestMatchForWord = Math.max(bestMatchForWord, similarity * 0.6)
            }
          }
        } else if (word1.length >= 3 && word2.length >= 3) {
          // Para palabras medianas, verificar inclusión o similitud alta
          if (word1.includes(word2) || word2.includes(word1)) {
            partialMatches += 0.7
            bestMatchForWord = Math.max(bestMatchForWord, 0.7)
          }
        }
      })
      
      if (bestMatchForWord > 0) {
        matchingWords += bestMatchForWord
      }
    })
    
    // Calcular score de palabras mejorado
    const minWords = Math.min(words1.length, words2.length)
    const maxWords = Math.max(words1.length, words2.length)
    
    let wordSimilarity = 0
    if (maxWords > 0) {
      // Dar más peso a coincidencias exactas
      const weightedScore = (exactMatches * 1.0) + partialMatches
      wordSimilarity = weightedScore / maxWords
      
      // Bonificación si hay coincidencias en nombres cortos
      if (minWords <= 2 && exactMatches >= 1) {
        wordSimilarity = Math.min(wordSimilarity + 0.2, 1.0)
      }
    }
    
    // Calcular similitud por caracteres comunes (mejorada)
    const commonChars = [...normalized1].filter(char => normalized2.includes(char)).length
    const maxLength = Math.max(normalized1.length, normalized2.length)
    const charSimilarity = maxLength > 0 ? commonChars / maxLength : 0
    
    // Verificar patrones específicos (primer nombre + apellido)
    const firstWord1 = words1[0] || ''
    const lastWord1 = words1[words1.length - 1] || ''
    const firstWord2 = words2[0] || ''
    const lastWord2 = words2[words2.length - 1] || ''
    
    let namePatternBonus = 0
    if (firstWord1 && firstWord2 && firstWord1 === firstWord2) {
      namePatternBonus += 0.3 // Bonus por primer nombre igual
      
      // Bonus adicional si también coincide algún apellido
      words1.slice(1).forEach(surname1 => {
        words2.slice(1).forEach(surname2 => {
          if (surname1 === surname2 || 
              (surname1.length >= 4 && surname2.length >= 4 && 
               (surname1.includes(surname2) || surname2.includes(surname1)))) {
            namePatternBonus += 0.2
          }
        })
      })
    }
    
    // Score final con ponderación mejorada
    let finalScore = (wordSimilarity * 0.8) + (charSimilarity * 0.2) + Math.min(namePatternBonus, 0.4)
    
    // Asegurar que no exceda 1.0
    finalScore = Math.min(finalScore, 1.0)
    
    return Math.round(finalScore * 100) / 100 // Redondear a 2 decimales
  }

  // Función para generar sugerencias de mapeo automático
  const generateMappingSuggestions = () => {
    console.log('🔍 Generando sugerencias mejoradas...', {
      uniqueFileWorkers: uniqueFileWorkers,
      officialWorkers: officialWorkers.length,
      officialWorkersNames: officialWorkers.map(w => w.nombre)
    })
    
    const suggestions = new Map()
    
    // Buscar trabajador "EVENTUAL SIN RUT" en la base de datos
    const eventualWorker = officialWorkers.find(w => 
      w.nombre && w.nombre.toUpperCase().includes('EVENTUAL') && w.nombre.toUpperCase().includes('SIN RUT')
    )
    
    console.log('🔍 Trabajador EVENTUAL encontrado:', eventualWorker ? eventualWorker.nombre : 'NO ENCONTRADO')
    
    uniqueFileWorkers.forEach(fileWorker => {
      console.log(`🔍 Analizando trabajador del archivo: "${fileWorker}"`)
      let bestMatch = null
      let bestScore = 0
      
      // Buscar coincidencias con trabajadores oficiales (excluyendo EVENTUAL)
      officialWorkers.forEach(officialWorker => {
        // Excluir EVENTUAL SIN RUT de las comparaciones normales
        if (officialWorker.nombre && officialWorker.nombre.toUpperCase().includes('EVENTUAL')) {
          return
        }
        
        const similarity = calculateNameSimilarity(fileWorker, officialWorker.nombre)
        console.log(`  📊 "${fileWorker}" vs "${officialWorker.nombre}": ${Math.round(similarity * 100)}%`)
        
        if (similarity > bestScore && similarity >= 0.3) { // Umbral reducido a 30% para mejor detección
          bestScore = similarity
          bestMatch = {
            id: officialWorker.id,
            name: officialWorker.nombre,
            rut: officialWorker.rut,
            score: similarity
          }
        }
      })
      
      if (bestMatch) {
        suggestions.set(fileWorker, bestMatch)
        console.log(`💡 ✅ Sugerencia para "${fileWorker}": ${bestMatch.name} (${Math.round(bestMatch.score * 100)}% confianza)`)
      } else {
        // Si no hay coincidencias y existe EVENTUAL SIN RUT, sugerirlo
        if (eventualWorker) {
          suggestions.set(fileWorker, {
            id: eventualWorker.id,
            name: eventualWorker.nombre,
            rut: eventualWorker.rut,
            score: 0, // 0% de similitud, pero es opción de respaldo
            isEventual: true // Marcar como sugerencia eventual
          })
          console.log(`💡 🔄 Sugerencia EVENTUAL para "${fileWorker}": ${eventualWorker.nombre} (respaldo por 0% coincidencia)`)
        } else {
          console.log(`💡 ❌ Sin sugerencia para "${fileWorker}" (mejor score: ${Math.round(bestScore * 100)}%)`)
        }
      }
    })
    
    console.log(`🎯 Total sugerencias generadas: ${suggestions.size}`)
    return suggestions
  }

  // Función para aplicar sugerencias automáticas
  const applySuggestions = () => {
    console.log('🔄 Aplicando sugerencias automáticas...')
    console.log('📋 Estados actuales:', {
      uniqueFileWorkers: uniqueFileWorkers,
      officialWorkersCount: officialWorkers.length,
      currentMapping: Object.fromEntries(workerMapping)
    })
    
    if (uniqueFileWorkers.length === 0) {
      console.warn('⚠️ No hay trabajadores únicos del archivo para mapear')
      return
    }
    
    if (officialWorkers.length === 0) {
      console.warn('⚠️ No hay trabajadores oficiales cargados')
      return
    }
    
    const suggestions = generateMappingSuggestions()
    const newMapping = new Map(workerMapping)
    
    suggestions.forEach((suggestion, fileWorker) => {
      console.log(`🎯 Mapeando: "${fileWorker}" -> "${suggestion.name}" (ID: ${suggestion.id})`)
      newMapping.set(fileWorker, suggestion.id)
    })
    
    setWorkerMapping(newMapping)
    console.log(`✨ Aplicadas ${suggestions.size} sugerencias automáticas`)
    
    // Forzar re-render para mostrar cambios inmediatamente
    setTimeout(() => {
      console.log('📊 Estado del mapeo actualizado:', Object.fromEntries(newMapping))
    }, 100)
  }

  // Función para extraer nombres únicos de trabajadores del archivo
  const extractUniqueFileWorkers = (results) => {
    const allWorkers = []
    
    results.forEach(result => {
      if (result.turnos && result.turnos.length > 0) {
        result.turnos.forEach(turno => {
          if (turno.conductoresAsignados && Array.isArray(turno.conductoresAsignados)) {
            turno.conductoresAsignados.forEach(conductor => {
              if (conductor && conductor.trim()) {
                allWorkers.push(conductor.trim())
              }
            })
          }
        })
      }
    })
    
    const uniqueNames = [...new Set(allWorkers)]
    console.log('👥 Trabajadores únicos en archivos:', uniqueNames)
    return uniqueNames
  }

  // Función principal para subir datos a Supabase (SIN crear trabajadores automáticamente)
  const uploadToSupabase = async (allShifts) => {
    setIsUploadingToSupabase(true)
    console.log('� Iniciando carga a Supabase con mapeo manual...')
    
    try {
      const mappingStats = getMappingStats()
      const shiftStats = getShiftStats()
      
      // Verificar que haya al menos 1 trabajador mapeado
      if (!mappingStats.canProceed) {
        throw new Error('No hay trabajadores mapeados. Debe mapear al menos un trabajador para proceder.')
      }

      console.log('📊 Estadísticas de carga:', {
        trabajadoresMapeados: mappingStats.mapped,
        trabajadoresOmitidos: mappingStats.unmapped,
        turnosACargar: shiftStats.turnosACargar,
        turnosAOmitir: shiftStats.turnosAOmitir
      })

      // Transformar turnos para Supabase usando el mapeo manual  
      const validResults = processedResults.filter(result => result.turnos && result.turnos.length > 0)
      const { shifts: supabaseShifts, unmapped, omittedWorkers } = transformShiftsForSupabase(validResults)
      
      if (supabaseShifts.length > 0) {
        console.log('📅 Insertando turnos en Supabase:', supabaseShifts.length)
        if (unmapped > 0) {
          console.warn(`⚠️ Se omitirán ${unmapped} turnos de trabajadores no mapeados:`, omittedWorkers)
        }
        
        // Obtener fechas únicas para limpiar turnos existentes
        const uniqueDates = [...new Set(supabaseShifts.map(shift => shift.fecha))]
        console.log('📅 Fechas únicas de turnos:', uniqueDates.length)
        
        // Limpiar turnos existentes para las fechas importadas
        if (uniqueDates.length > 0) {
          console.log('🗑️ Limpiando turnos existentes para las fechas importadas...')
          const { error: deleteError } = await supabase
            .from('turnos')
            .delete()
            .in('fecha', uniqueDates)
          
          if (deleteError) {
            console.warn('⚠️ Warning al limpiar turnos existentes:', deleteError)
          } else {
            console.log('✅ Turnos existentes limpiados para fechas importadas')
          }
        }
        
        // Insertar nuevos turnos
        const { data: createdShifts, error: shiftsError } = await supabase
          .from('turnos')
          .insert(supabaseShifts)
          .select()
        
        if (shiftsError) throw shiftsError
        
        console.log('✅ Turnos insertados exitosamente:', createdShifts.length)
        
        return {
          workersUsed: mappingStats.mapped,
          workersOmitted: mappingStats.unmapped,
          shiftsInserted: supabaseShifts.length,
          shiftsOmitted: unmapped,
          datesProcessed: uniqueDates.length,
          omittedWorkerNames: mappingStats.unmappedNames
        }
      } else {
        console.warn('⚠️ No se generaron turnos para insertar')
        return {
          workersUsed: 0,
          workersOmitted: mappingStats.unmapped,
          shiftsInserted: 0,
          shiftsOmitted: unmapped,
          datesProcessed: 0,
          omittedWorkerNames: mappingStats.unmappedNames
        }
      }
      
    } catch (error) {
      console.error('❌ Error subiendo a Supabase:', error)
      throw error
    } finally {
      setIsUploadingToSupabase(false)
    }
  }

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
      
      // Si hay archivos válidos Y se debe guardar en Supabase, preparar el mapeo
      if (saveToSupabase && results.some(result => result.turnos && result.turnos.length > 0)) {
        // Extraer trabajadores únicos de todos los archivos exitosos
        const validResults = results.filter(result => result.turnos && result.turnos.length > 0)
        
        const uniqueWorkers = extractUniqueFileWorkers(validResults)
        setUniqueFileWorkers(uniqueWorkers)
        
        // Limpiar mapeo previo
        setWorkerMapping(new Map())
        
        // Cargar trabajadores oficiales de Supabase para el mapeo
        await loadOfficialWorkers()
        
        // Si hay trabajadores únicos, mostrar interfaz de mapeo
        if (uniqueWorkers.length > 0) {
          setShowMappingInterface(true)
        }
      }

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
      console.log('🗄️ Guardar en Supabase:', saveToSupabase)
      
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

      // Guardar en masterDataService (localStorage)
      if (allShifts.length > 0) {
        masterDataService.addWorkerShifts(allShifts)
        console.log('✅ Turnos guardados exitosamente en masterDataService (localStorage)')
      } else {
        console.warn('⚠️ No se encontraron turnos para guardar')
      }

      // Opcionalmente subir a Supabase
      let supabaseResults = null
      if (saveToSupabase && allShifts.length > 0) {
        console.log('🗄️ Iniciando carga a Supabase...')
        try {
          supabaseResults = await uploadToSupabase(allShifts)
          console.log('✅ Datos subidos exitosamente a Supabase:', supabaseResults)
        } catch (supabaseError) {
          console.error('❌ Error subiendo a Supabase:', supabaseError)
          setUploadStatus({ 
            type: 'error', 
            message: `Datos guardados localmente, pero error al subir a Supabase: ${supabaseError.message}` 
          })
          setShowConfirmModal(false)
          return
        }
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
        totalCorrectionsMade > 0 ? `🔧 ${totalCorrectionsMade} corrección(es) automática(s) aplicada(s)` : null,
        supabaseResults ? [
          `🗄️ Supabase: ${supabaseResults.shiftsInserted} turnos insertados`,
          supabaseResults.workersUsed ? `${supabaseResults.workersUsed} trabajadores utilizados` : null,
          supabaseResults.shiftsOmitted > 0 ? `${supabaseResults.shiftsOmitted} turnos omitidos` : null,
          supabaseResults.workersOmitted > 0 ? `${supabaseResults.workersOmitted} trabajadores sin mapear` : null
        ].filter(Boolean).join(', ') : null
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
    // Limpiar estados del mapeo
    setUniqueFileWorkers([])
    setWorkerMapping(new Map())
    setShowMappingInterface(false)
    setOfficialWorkers([])
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

            {/* Opción de guardado en Supabase */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="saveToSupabase"
                  checked={saveToSupabase}
                  onChange={(e) => setSaveToSupabase(e.target.checked)}
                  disabled={isProcessing}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="saveToSupabase" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-600" />
                  Guardar directamente en Supabase
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                {saveToSupabase ? 
                  '🗄️ Los datos se guardarán en localStorage y también en la base de datos Supabase PostgreSQL' :
                  '📁 Los datos solo se guardarán en localStorage (almacenamiento local del navegador)'
                }
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

              {/* Interfaz de Mapeo de Trabajadores */}
              {showMappingInterface && saveToSupabase && uniqueFileWorkers.length > 0 && (
                <div className="mb-6 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center text-blue-800">
                      <Users className="h-5 w-5 mr-2" />
                      👤 Mapeo de Trabajadores (Requerido para Supabase)
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={applySuggestions}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-white hover:bg-blue-100 border-blue-300"
                      >
                        <Lightbulb className="h-4 w-4" />
                        Aplicar Sugerencias
                      </Button>
                      <Button
                        onClick={() => {
                          console.log('🧪 Botón de prueba presionado')
                          console.log('📊 Estados de diagnóstico:', {
                            uniqueFileWorkers,
                            officialWorkers: officialWorkers.length,
                            workerMapping: Object.fromEntries(workerMapping)
                          })
                          loadOfficialWorkers()
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                      >
                        🧪 Debug
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">
                    Los siguientes nombres aparecen en los archivos. Selecciona el trabajador oficial correspondiente o usa sugerencias automáticas:
                  </p>
                  
                  <div className="space-y-3">
                    {uniqueFileWorkers.map((fileWorkerName) => {
                      const suggestions = generateMappingSuggestions()
                      const suggestion = suggestions.get(fileWorkerName)
                      
                      return (
                        <div key={fileWorkerName} className="p-3 bg-white rounded-md border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <span className="font-medium text-gray-800">📄 {fileWorkerName}</span>
                            </div>
                            <div className="ml-3">
                              {workerMapping.has(fileWorkerName) ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                              )}
                            </div>
                          </div>
                          
                          {/* Sugerencia automática */}
                          {suggestion && !workerMapping.has(fileWorkerName) && (
                            <div className={`mb-2 p-2 rounded text-sm border ${
                              suggestion.isEventual 
                                ? 'bg-orange-50 border-orange-200' 
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                <Lightbulb className={`h-4 w-4 ${
                                  suggestion.isEventual ? 'text-orange-600' : 'text-yellow-600'
                                }`} />
                                <span className={`font-medium ${
                                  suggestion.isEventual ? 'text-orange-700' : 'text-yellow-700'
                                }`}>
                                  {suggestion.isEventual ? 'Respaldo' : 'Sugerencia'}: {suggestion.name} ({suggestion.rut})
                                </span>
                                {suggestion.isEventual ? (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    Sin coincidencia - Eventual
                                  </span>
                                ) : (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    {Math.round(suggestion.score * 100)}% confianza
                                  </span>
                                )}
                                <Button
                                  onClick={() => {
                                    console.log(`🎯 Aplicando sugerencia individual: "${fileWorkerName}" -> "${suggestion.name}" (ID: ${suggestion.id})`)
                                    handleWorkerMapping(fileWorkerName, suggestion.id)
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="ml-auto h-6 text-xs py-1 px-2"
                                >
                                  Aplicar
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <select
                              value={workerMapping.get(fileWorkerName) || ''}
                              onChange={(e) => handleWorkerMapping(fileWorkerName, e.target.value)}
                              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                              <option value="">Seleccionar trabajador oficial...</option>
                              {officialWorkers
                                .sort((a, b) => {
                                  // Priorizar sugerencia en el orden
                                  if (suggestion && a.id === suggestion.id) return -1
                                  if (suggestion && b.id === suggestion.id) return 1
                                  return a.nombre.localeCompare(b.nombre)
                                })
                                .map((worker) => (
                                  <option key={worker.id} value={worker.id}>
                                    {worker.nombre} ({worker.rut})
                                    {suggestion && worker.id === suggestion.id ? ' ⭐ SUGERIDO' : ''}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-4 text-sm space-y-3">
                    {(() => {
                      const stats = getMappingStats()
                      const shiftStats = getShiftStats()
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">
                              Progreso: {stats.mapped} de {stats.total} trabajadores mapeados
                            </span>
                            {isMappingComplete() ? (
                              <span className="text-green-600 font-medium flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                ✅ Mapeo completo
                              </span>
                            ) : stats.canProceed ? (
                              <span className="text-blue-600 font-medium flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                ✅ Puede proceder
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                ❌ Sin mapeos
                              </span>
                            )}
                          </div>
                          
                          {/* Estadísticas de turnos */}
                          {stats.mapped > 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-blue-800 font-medium mb-2">📊 Resumen de Carga:</div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center">
                                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                  <span className="text-green-700">Se cargarán: {shiftStats.turnosACargar} turnos</span>
                                </div>
                                {shiftStats.turnosAOmitir > 0 && (
                                  <div className="flex items-center">
                                    <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                                    <span className="text-orange-700">Se omitirán: {shiftStats.turnosAOmitir} turnos</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Trabajadores no mapeados */}
                          {stats.unmapped > 0 && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="text-orange-800 font-medium mb-2">
                                ⚠️ Trabajadores sin mapear ({stats.unmapped}):
                              </div>
                              <div className="text-xs text-orange-700">
                                {stats.unmappedNames.map((name, index) => (
                                  <span key={name} className="inline-block bg-orange-100 px-2 py-1 rounded mr-1 mb-1">
                                    {name}
                                  </span>
                                ))}
                              </div>
                              <div className="text-xs text-orange-600 mt-2 italic">
                                Los turnos de estos trabajadores no se cargarán en Supabase.
                              </div>
                            </div>
                          )}
                          
                          {/* Información de sugerencias */}
                          {(() => {
                            const suggestions = generateMappingSuggestions()
                            const availableSuggestions = suggestions.size
                            return availableSuggestions > 0 && (
                              <div className="flex items-center text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                                <Lightbulb className="h-3 w-3 mr-1" />
                                {availableSuggestions} sugerencia{availableSuggestions > 1 ? 's' : ''} automática{availableSuggestions > 1 ? 's' : ''} disponible{availableSuggestions > 1 ? 's' : ''}
                              </div>
                            )
                          })()}
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

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

            <div className="p-6 border-t bg-gray-50 sticky bottom-0">
              {/* Información sobre destino de guardado */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Database className="h-4 w-4" />
                  <span>Destino de guardado:</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>localStorage (siempre)</span>
                  </div>
                  {saveToSupabase && (
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Supabase PostgreSQL</span>
                    </div>
                  )}
                </div>
                {saveToSupabase && (
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Los trabajadores se mapearán manualmente. Solo se cargarán turnos de trabajadores mapeados.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleModalCancel}
                  className="min-w-[100px]"
                  disabled={isUploadingToSupabase}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmImport}
                  disabled={hasErrors || isUploadingToSupabase || (saveToSupabase && showMappingInterface && !getMappingStats().canProceed)}
                  className="min-w-[120px] flex items-center gap-2"
                >
                  {isUploadingToSupabase ? (
                    <>
                      <CloudUpload className="h-4 w-4 animate-pulse" />
                      Subiendo...
                    </>
                  ) : (() => {
                    const stats = getMappingStats()
                    const isPartialMapping = saveToSupabase && showMappingInterface && stats.unmapped > 0 && stats.mapped > 0
                    
                    return (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {isPartialMapping ? `Importar ${stats.mapped} Trabajadores` : 'Confirmar Importación'}
                      </>
                    )
                  })()}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadFiles