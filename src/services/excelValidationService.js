/**
 * Servicio de Validación Robusta para Archivos Excel de Planillas de Turnos
 * 
 * Este servicio proporciona validaciones extensibles y correcciones automáticas
 * para manejar errores comunes en archivos Excel de planillas de turnos.
 */

import * as XLSX from 'xlsx'
import excelValidationConfig from './excelValidationConfig'

export class ExcelValidationService {
  constructor() {
    this.config = excelValidationConfig
    this.logger = new ValidationLogger()
  }

  /**
   * Obtiene las reglas de validación actuales desde la configuración
   */
  getValidationRules() {
    return this.config.getConfiguration()
  }

  /**
   * Valida y procesa un archivo Excel completo
   */
  validateAndCorrectExcel(worksheet, fileName, configKey = null) {
    // Autodetectar configuración si no se especifica
    if (configKey) {
      this.config.setCurrentConfiguration(configKey)
    } else {
      // Autodetectar basado en headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      const headerRow = this.findHeaderRow(rawData)
      if (headerRow) {
        const detectedConfig = this.config.detectBestConfiguration(headerRow)
        this.config.setCurrentConfiguration(detectedConfig)
        this.logger.logInfo(`Configuración autodetectada: ${detectedConfig}`)
      }
    }

    this.logger.startValidation(fileName)
    
    try {
      // 1. Convertir a datos brutos con validaciones defensivas
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      // Validar que tenemos datos válidos
      if (!Array.isArray(rawData) || rawData.length === 0) {
        return this.createErrorResult(fileName, ['El archivo está vacío o no contiene datos válidos'])
      }
      
      // Filtrar filas completamente vacías
      const validData = rawData.filter(row => 
        row && Array.isArray(row) && row.some(cell => 
          cell !== null && cell !== undefined && cell !== ''
        )
      )
      
      if (validData.length === 0) {
        return this.createErrorResult(fileName, ['No se encontraron filas con datos válidos'])
      }
      
      console.log(`📊 Datos válidos encontrados: ${validData.length} filas de ${rawData.length} totales`)
      
      // 2. Detectar y validar estructura
      const structure = this.detectExcelStructure(validData)
      if (!structure.isValid) {
        return this.createErrorResult(fileName, structure.errors)
      }

      // 3. Limpiar y corregir datos
      const correctedData = this.applyCorrectionRules(validData, structure)
      
      // 4. Validar datos corregidos
      const validationResult = this.validateCorrectedData(correctedData, structure)
      
      // 5. Procesar datos finales
      const processedData = this.processValidatedData(correctedData, structure, fileName)
      
      this.logger.endValidation(true)
      return processedData
      
    } catch (error) {
      this.logger.logError('Error crítico en validación', error)
      this.logger.endValidation(false)
      return this.createErrorResult(fileName, [`Error crítico: ${error.message}`])
    }
  }

  /**
   * Encuentra la fila de headers en los datos brutos
   */
  findHeaderRow(data) {
    const rules = this.getValidationRules()
    
    for (let i = 0; i < Math.min(rules.headers.maxHeaderRow, data.length); i++) {
      const row = data[i]
      if (!row) continue

      const headerScore = this.calculateHeaderScore(row)
      if (headerScore.isHeader) {
        return row
      }
    }
    return null
  }

  /**
   * Detecta la estructura del Excel y valida formato básico
   */
  detectExcelStructure(data) {
    const rules = this.getValidationRules()
    const result = {
      isValid: false,
      headerRow: -1,
      dataStartRow: -1,
      dataEndRow: -1,
      columnMapping: {},
      errors: [],
      warnings: []
    }

    // Buscar fila de headers
    for (let i = 0; i < Math.min(rules.headers.maxHeaderRow, data.length); i++) {
      const row = data[i]
      if (!row) continue

      const headerScore = this.calculateHeaderScore(row)
      if (headerScore.isHeader) {
        result.headerRow = i
        result.columnMapping = headerScore.mapping
        result.dataStartRow = i + 1
        break
      }
    }

    if (result.headerRow === -1) {
      result.errors.push('No se encontró fila de headers válida en las primeras ' + rules.headers.maxHeaderRow + ' filas')
      return result
    }

    // Detectar fin de datos (buscar totales)
    result.dataEndRow = this.findDataEndRow(data, result.dataStartRow)
    
    // Validar que tenemos columnas esenciales
    const requiredColumns = rules.headers.required
    const missingColumns = requiredColumns.filter(col => 
      !Object.keys(result.columnMapping).includes(col)
    )

    if (missingColumns.length > 0) {
      result.errors.push(`Columnas requeridas faltantes: ${missingColumns.join(', ')}`)
      return result
    }

    result.isValid = true
    this.logger.logInfo('Estructura detectada correctamente', {
      headerRow: result.headerRow,
      dataRange: `${result.dataStartRow}-${result.dataEndRow}`,
      columnsFound: Object.keys(result.columnMapping).length
    })

    return result
  }

  /**
   * Calcula score de probabilidad de que una fila sea header
   */
  calculateHeaderScore(row) {
    // Validación defensiva: verificar que row existe y es un array
    if (!row || !Array.isArray(row) || row.length === 0) {
      return {
        isHeader: false,
        score: 0,
        mapping: {}
      }
    }

    const rules = this.getValidationRules()
    let score = 0
    const mapping = {}
    const requiredHeaders = rules.headers.required
    const conductorHeaders = rules.headers.conductorColumns
    const headerVariations = rules.headers.headerVariations || {}

    for (let i = 0; i < row.length; i++) {
      const cell = row[i]
      if (!cell || typeof cell !== 'string') continue

      const cellUpper = cell.toString().toUpperCase().trim()
      
      // Buscar headers requeridos (con variaciones)
      for (const required of requiredHeaders) {
        const variations = headerVariations[required] || [required]
        // Usar comparación exacta en lugar de includes para evitar falsos positivos
        if (variations.some(variation => cellUpper === variation.toUpperCase())) {
          mapping[required] = i
          score += 10
        }
      }

      // Buscar headers de conductores
      for (const conductor of conductorHeaders) {
        // Usar comparación exacta para evitar falsos positivos
        if (cellUpper === conductor.toUpperCase()) {
          mapping[conductor] = i
          score += 5
        }
      }

      // Headers opcionales
      if (cellUpper.includes('CONDUCTOR EXTRA')) {
        mapping['CONDUCTOR EXTRA'] = mapping['CONDUCTOR EXTRA'] || []
        mapping['CONDUCTOR EXTRA'].push(i)
        score += 3
      }

      if (cellUpper.includes('SERV SIN CONDUCTOR')) {
        mapping['SERV SIN CONDUCTOR'] = i
        score += 5
      }
    }

    return {
      isHeader: score >= 20, // Umbral mínimo para considerar header
      score,
      mapping
    }
  }

  /**
   * Encuentra la fila donde terminan los datos de turnos
   */
  findDataEndRow(data, startRow) {
    // Validaciones defensivas
    if (!Array.isArray(data) || data.length === 0 || startRow >= data.length) {
      return data ? data.length : 0
    }

    for (let i = startRow; i < data.length; i++) {
      const row = data[i]
      if (!row || !Array.isArray(row)) continue

      // Buscar indicadores de fin de datos
      const hasTotal = row.some(cell => 
        cell && typeof cell === 'string' && 
        cell.toString().toUpperCase().includes('TOTAL')
      )

      const hasServSin = row.some(cell =>
        cell && typeof cell === 'string' &&
        cell.toString().toUpperCase().includes('SERV SIN')
      )

      // Detectar filas de recuento de conductores (solo nombres, sin fechas/turnos)
      const isRecuentoConductores = row.some(cell =>
        cell && typeof cell === 'string' && cell.length > 10 &&
        /^[A-Z\s]+$/.test(cell) && !row[0] && !row[1]
      )

      if (hasTotal || hasServSin || isRecuentoConductores) {
        return i
      }
    }

    return data.length
  }

  /**
   * Aplica reglas de corrección a los datos
   */
  applyCorrectionRules(rawData, structure) {
    // Validaciones defensivas
    if (!Array.isArray(rawData) || !structure || !structure.columnMapping) {
      console.warn('⚠️ Datos o estructura inválidos para corrección')
      return rawData || []
    }

    const rules = this.getValidationRules()
    const correctedData = rawData.map(row => 
      row && Array.isArray(row) ? [...row] : (row || [])
    )

    for (let i = structure.dataStartRow; i < structure.dataEndRow; i++) {
      const row = correctedData[i]
      if (!row || !Array.isArray(row)) continue

      // Validar que tenemos los índices de columnas necesarios
      const fechaIndex = structure.columnMapping.FECHA
      const turnoIndex = structure.columnMapping.TURNO
      
      if (fechaIndex === undefined || turnoIndex === undefined) {
        console.warn(`⚠️ Índices de columnas faltantes en fila ${i}`)
        continue
      }

      // Corregir fechas
      if (fechaIndex >= 0 && fechaIndex < row.length) {
        row[fechaIndex] = this.correctDate(
          row[fechaIndex],
          i > structure.dataStartRow ? correctedData[i-1][fechaIndex] : null
        )
      }

      // Corregir turnos
      if (turnoIndex >= 0 && turnoIndex < row.length) {
        row[turnoIndex] = this.correctTurno(row[turnoIndex])
      }

      // Corregir nombres de conductores
      this.correctConductorNames(row, structure.columnMapping)

      // Corregir cantidades
      const cantCol = structure.columnMapping['CANT.'] || structure.columnMapping['CANT']
      if (cantCol !== undefined) {
        row[cantCol] = this.correctCantidad(row[cantCol])
      }
    }

    return correctedData
  }

  /**
   * Corrige formato de fechas
   */
  correctDate(dateValue, previousDate) {
    const rules = this.getValidationRules()
    
    if (!dateValue) {
      // Si no hay fecha y tenemos configurado rellenar, usar fecha anterior
      if (rules.dates.fillMissingDates && previousDate) {
        // No registrar esta corrección como inconsistencia ya que es comportamiento esperado
        // this.logger.logCorrection('Fecha faltante rellenada con fecha anterior', {
        //   previous: previousDate,
        //   applied: previousDate
        // })
        return previousDate
      }
      return null
    }

    // Fecha numérica de Excel
    if (typeof dateValue === 'number') {
      if (dateValue >= rules.dates.minExcelDate && 
          dateValue <= rules.dates.maxExcelDate) {
        const jsDate = this.excelDateToJSDate(dateValue)
        const correctedDate = jsDate.toISOString().split('T')[0]
        // No registrar conversión de fecha Excel como corrección - es comportamiento normal
        // this.logger.logCorrection('Fecha Excel convertida', {
        //   original: dateValue,
        //   corrected: correctedDate
        // })
        return correctedDate
      }
    }

    // Fecha como string
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      } else {
        // Registrar fecha inválida como inconsistencia
        this.logger.logProblem('Fecha inválida', {
          original: dateValue,
          error: 'Formato de fecha no reconocido'
        })
        return dateValue // Mantener el valor original para que se vea el problema
      }
    }

    return dateValue
  }

  /**
   * Corrige formato de turnos
   */
  correctTurno(turnoValue) {
    const rules = this.getValidationRules()
    if (!turnoValue || typeof turnoValue !== 'string') return turnoValue

    let corrected = turnoValue.toString().trim().toUpperCase()
    
    // Aplicar correcciones automáticas usando variaciones de configuración
    for (const [standardTurno, variations] of Object.entries(rules.turnos.variations)) {
      if (variations.some(variation => corrected.includes(variation.toUpperCase()))) {
        // Solo registrar la corrección si hay un cambio real
        if (turnoValue !== standardTurno) {
          this.logger.logCorrection('Turno corregido automáticamente', {
            original: turnoValue,
            corrected: standardTurno
          })
        }
        return standardTurno
      }
    }

    // Solo registrar corrección si hay cambio (trim, uppercase, etc.)
    if (corrected !== turnoValue) {
      this.logger.logCorrection('Turno normalizado', {
        original: turnoValue,
        corrected: corrected
      })
    }

    return corrected
  }

  /**
   * Corrige nombres de conductores
   */
  correctConductorNames(row, columnMapping) {
    const rules = this.getValidationRules()
    const conductorColumns = [
      columnMapping['CONDUCTOR 1'],
      columnMapping['CONDUCTOR 2'],
      columnMapping['CONDUCTOR 3'],
      columnMapping['CONDUCTOR 4'],
      columnMapping['CONDUCTOR 5']
    ].filter(col => col !== undefined)

    // Agregar columnas CONDUCTOR EXTRA si existen
    if (columnMapping['CONDUCTOR EXTRA']) {
      if (Array.isArray(columnMapping['CONDUCTOR EXTRA'])) {
        conductorColumns.push(...columnMapping['CONDUCTOR EXTRA'])
      } else {
        conductorColumns.push(columnMapping['CONDUCTOR EXTRA'])
      }
    }

    for (const colIdx of conductorColumns) {
      const original = row[colIdx]
      if (!original || typeof original !== 'string') continue

      const autoCorrect = rules.conductores.autoCorrect
      let finalValue = original
      let corrections = []

      // 1. Aplicar reemplazos comunes PRIMERO
      const replacements = autoCorrect.commonReplacements || {}
      for (const [wrong, correct] of Object.entries(replacements)) {
        // Usar regex para reemplazar solo palabras completas, no subcadenas
        const regex = new RegExp(`\\b${wrong}\\b`, 'gi')
        if (regex.test(finalValue)) {
          const originalForLog = finalValue
          finalValue = finalValue.replace(regex, correct)
          if (finalValue !== originalForLog) {
            corrections.push(`Reemplazo de texto: "${wrong}" → "${correct}"`)
          }
        }
      }

      // 2. Aplicar normalizaciones paso a paso
      let hasSpaceChanges = false
      let hasCaseChanges = false

      // Detectar y aplicar trim de espacios
      if (autoCorrect.trimSpaces) {
        const trimmed = finalValue.trim()
        if (trimmed !== finalValue) {
          finalValue = trimmed
          hasSpaceChanges = true
        }
      }

      // Detectar y aplicar remoción de espacios extras
      if (autoCorrect.removeExtraSpaces) {
        const spacesCleaned = finalValue.replace(/\s+/g, ' ')
        if (spacesCleaned !== finalValue) {
          finalValue = spacesCleaned
          hasSpaceChanges = true
        }
      }

      // Detectar y aplicar cambios de case
      let caseChanged = finalValue
      if (autoCorrect.normalizeCase === 'upper') {
        caseChanged = finalValue.toUpperCase()
      } else if (autoCorrect.normalizeCase === 'lower') {
        caseChanged = finalValue.toLowerCase()
      } else if (autoCorrect.normalizeCase === 'title') {
        caseChanged = finalValue.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
      }

      if (caseChanged !== finalValue) {
        finalValue = caseChanged
        hasCaseChanges = true
      }

      // Solo registrar correcciones si hay cambios REALES y SIGNIFICATIVOS
      if (finalValue !== original) {
        // Verificación adicional: asegurar que no sean cambios superficiales
        const normalizedOriginal = original.trim().replace(/\s+/g, ' ').toUpperCase()
        const normalizedFinal = finalValue.trim().replace(/\s+/g, ' ').toUpperCase()
        
        // Solo registrar si después de normalizar ambos, aún hay diferencias
        if (normalizedOriginal !== normalizedFinal) {
          row[colIdx] = finalValue
          
          // Construir descripción específica de la corrección
          let correctionDescription = []
          
          if (corrections.length > 0) {
            correctionDescription.push(...corrections)
          }
          
          if (hasSpaceChanges) {
            correctionDescription.push('Espacios en blanco corregidos')
          }
          
          if (hasCaseChanges) {
            correctionDescription.push('Mayúsculas/minúsculas normalizadas')
          }

          // Registrar la corrección con descripción específica
          this.logger.logCorrection('Nombre normalizado', {
            original,
            corrected: finalValue,
            rule: correctionDescription.join(', ')
          })
        } else {
          // Si son cambios superficiales (solo espacios/case), aplicar sin registrar
          row[colIdx] = finalValue
        }
      }
      // Si original === finalValue, NO registrar nada
    }
  }

  /**
   * Corrige valores de cantidad
   */
  correctCantidad(cantValue) {
    const rules = this.getValidationRules()
    if (cantValue === null || cantValue === undefined) return null
    
    if (typeof cantValue === 'number') return cantValue
    
    if (typeof cantValue === 'string' && rules.cantidad.autoCorrect) {
      const parsed = parseInt(cantValue.trim())
      if (!isNaN(parsed)) {
        if (parsed !== parseFloat(cantValue)) {
          this.logger.logCorrection('Cantidad convertida a entero', {
            original: cantValue,
            corrected: parsed
          })
        }
        return parsed
      }
    }

    return cantValue
  }

  /**
   * Valida datos después de correcciones
   */
  validateCorrectedData(correctedData, structure) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: {}
    }

    for (let i = structure.dataStartRow; i < structure.dataEndRow; i++) {
      const row = correctedData[i]
      if (!row) continue

      const rowValidation = this.validateRow(row, structure.columnMapping, i)
      
      validation.errors.push(...rowValidation.errors)
      validation.warnings.push(...rowValidation.warnings)
      
      if (Object.keys(rowValidation.fieldErrors).length > 0) {
        validation.fieldErrors[i] = rowValidation.fieldErrors
      }
    }

    validation.isValid = validation.errors.length === 0

    return validation
  }

  /**
   * Valida una fila individual
   */
  validateRow(row, columnMapping, rowIndex) {
    const rules = this.getValidationRules()
    const validation = {
      errors: [],
      warnings: [],
      fieldErrors: {}
    }

    // Validar fecha
    const fecha = row[columnMapping.FECHA]
    if (!fecha) {
      validation.warnings.push(`Fila ${rowIndex}: Fecha faltante`)
    }

    // Validar turno
    const turno = row[columnMapping.TURNO]
    if (turno && !rules.turnos.allowed.includes(turno)) {
      if (!rules.turnos.cancelMarkers.includes(turno)) {
        validation.errors.push(`Fila ${rowIndex}: Turno inválido "${turno}"`)
        validation.fieldErrors.turno = `Turno inválido: ${turno}`
      }
    }

    // Validar cantidad
    const cantCol = columnMapping['CANT.'] || columnMapping['CANT']
    if (cantCol !== undefined) {
      const cant = row[cantCol]
      if (cant !== null && cant !== undefined) {
        if (typeof cant !== 'number' || cant < rules.cantidad.min || 
            cant > rules.cantidad.max) {
          validation.errors.push(`Fila ${rowIndex}: Cantidad inválida "${cant}"`)
          validation.fieldErrors.cantidad = `Cantidad fuera de rango: ${cant}`
        }
      }
    }

    // Validar conductores
    this.validateConductorsInRow(row, columnMapping, rowIndex, validation)

    return validation
  }

  /**
   * Valida conductores en una fila
   */
  validateConductorsInRow(row, columnMapping, rowIndex, validation) {
    const rules = this.getValidationRules()
    const conductorColumns = [
      columnMapping['CONDUCTOR 1'],
      columnMapping['CONDUCTOR 2'],
      columnMapping['CONDUCTOR 3'],
      columnMapping['CONDUCTOR 4'],
      columnMapping['CONDUCTOR 5']
    ].filter(col => col !== undefined)

    const conductoresEncontrados = new Set()
    const conductorRules = rules.conductores

    for (const colIdx of conductorColumns) {
      const conductor = row[colIdx]
      if (!conductor || typeof conductor !== 'string') continue

      const name = conductor.trim()
      
      // Verificar que no sea marcador inválido
      if (conductorRules.invalidMarkers.includes(name)) continue

      // Validar longitud
      if (name.length < conductorRules.minLength) {
        validation.warnings.push(`Fila ${rowIndex}: Nombre muy corto "${name}"`)
        continue
      }

      if (name.length > conductorRules.maxLength) {
        validation.warnings.push(`Fila ${rowIndex}: Nombre muy largo "${name}"`)
        continue
      }

      // Validar caracteres permitidos
      if (!conductorRules.allowedChars.test(name)) {
        validation.warnings.push(`Fila ${rowIndex}: Caracteres inválidos en "${name}"`)
        continue
      }

      // Detectar duplicados
      const normalizedName = conductorRules.caseSensitive ? name : name.toUpperCase()
      if (conductoresEncontrados.has(normalizedName)) {
        validation.warnings.push(`Fila ${rowIndex}: Conductor duplicado "${name}"`)
      } else {
        conductoresEncontrados.add(normalizedName)
      }
    }
  }

  /**
   * Procesa los datos validados y genera resultado final
   */
  processValidatedData(correctedData, structure, fileName) {
    // Reutilizar la lógica existente de analyzeExcelTurnos pero con datos ya validados y corregidos
    return this.convertToFinalFormat(correctedData, structure, fileName)
  }

  /**
   * Convierte datos validados al formato final esperado por la aplicación
   */
  convertToFinalFormat(data, structure, fileName) {
    const rules = this.getValidationRules()
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
      validationData: { totalEsperado: null, servSinConductEsperado: null },
      correctionLog: this.logger.getCorrections(),
      processingLog: this.logger.getLogs(),
      configurationUsed: this.config.currentConfig
    }

    console.log(`🔍 [${fileName}] Procesando datos finales:`)
    console.log(`📊 Estructura detectada:`, structure)
    console.log(`📊 Mapeo de columnas:`, structure.columnMapping)
    console.log(`📊 Rango de datos: ${structure.dataStartRow} - ${structure.dataEndRow}`)

    // Procesar cada fila de datos
    let currentDate = null

    for (let i = structure.dataStartRow; i < structure.dataEndRow; i++) {
      const row = data[i]
      if (!row) continue

      console.log(`📝 [${fileName}] Procesando fila ${i}:`, row)

      // Actualizar fecha actual
      const fechaCell = row[structure.columnMapping.FECHA]
      if (fechaCell) {
        currentDate = fechaCell
        if (!result.summary.fechas.includes(currentDate)) {
          result.summary.fechas.push(currentDate)
        }
      }

      // Procesar turno
      const turno = row[structure.columnMapping.TURNO]
      const cantCol = structure.columnMapping['CANT.'] || structure.columnMapping['CANT']
      const cantidadEsperada = cantCol !== undefined ? row[cantCol] : null

      console.log(`🔍 [${fileName}] Fila ${i} - Fecha: ${fechaCell}, Turno: ${turno}, Cantidad: ${cantidadEsperada}`)

      if (turno && rules.turnos.allowed.includes(turno) && cantidadEsperada > 0) {
        const turnoData = this.processTurnoRow(row, structure.columnMapping, currentDate, turno, cantidadEsperada)
        
        console.log(`✅ [${fileName}] Turno procesado:`, turnoData)
        
        result.turnos.push(turnoData)
        result.summary.totalTurnos++
        result.summary.totalConductores += turnoData.conductoresAsignados.length
        
        if (result.summary.desglosePorTipo[turno] !== undefined) {
          result.summary.desglosePorTipo[turno]++
        }

        // Actualizar estadísticas de conductores
        turnoData.conductoresAsignados.forEach(conductor => {
          if (!result.conductorStats.has(conductor)) {
            result.conductorStats.set(conductor, {
              totalTurnos: 0,
              'PRIMER TURNO': 0,
              'SEGUNDO TURNO': 0,
              'TERCER TURNO': 0,
              fechas: []
            })
          }

          const stats = result.conductorStats.get(conductor)
          stats.totalTurnos++
          if (stats[turno] !== undefined) {
            stats[turno]++
          }
          if (!stats.fechas.includes(currentDate)) {
            stats.fechas.push(currentDate)
          }
        })
      }
    }

    return result
  }

  /**
   * Procesa una fila de turno individual
   */
  processTurnoRow(row, columnMapping, fecha, turno, cantidadEsperada) {
    const rules = this.getValidationRules()
    const turnoData = {
      fecha: fecha || 'Sin fecha',
      turno: turno,
      cantidadEsperada: cantidadEsperada,
      conductoresAsignados: [],
      servSinConductor: 0
    }

    // Extraer conductores
    const conductorColumns = [
      columnMapping['CONDUCTOR 1'],
      columnMapping['CONDUCTOR 2'],
      columnMapping['CONDUCTOR 3'],
      columnMapping['CONDUCTOR 4'],
      columnMapping['CONDUCTOR 5']
    ].filter(col => col !== undefined)

    // Agregar conductores extra si existen
    if (columnMapping['CONDUCTOR EXTRA']) {
      if (Array.isArray(columnMapping['CONDUCTOR EXTRA'])) {
        conductorColumns.push(...columnMapping['CONDUCTOR EXTRA'])
      } else {
        conductorColumns.push(columnMapping['CONDUCTOR EXTRA'])
      }
    }

    const conductoresVistos = new Set()
    
    for (const colIdx of conductorColumns) {
      const conductor = row[colIdx]
      if (conductor && typeof conductor === 'string') {
        const nombre = conductor.trim()
        if (nombre && !rules.conductores.invalidMarkers.includes(nombre)) {
          const nombreNormalizado = rules.conductores.caseSensitive ? nombre : nombre.toUpperCase()
          if (!conductoresVistos.has(nombreNormalizado)) {
            conductoresVistos.add(nombreNormalizado)
            turnoData.conductoresAsignados.push(nombre)
          }
        }
      }
    }

    // Verificar servicios sin conductor
    const servSinCol = columnMapping['SERV SIN CONDUCTOR']
    if (servSinCol !== undefined) {
      const servSin = row[servSinCol]
      if (servSin && typeof servSin === 'number' && servSin > 0) {
        turnoData.servSinConductor = servSin
      }
    }

    return turnoData
  }

  /**
   * Utilitario para convertir fechas de Excel
   */
  excelDateToJSDate(excelDate) {
    // Corrección: Excel incorrectamente considera 1900 como año bisiesto
    // La fecha serial 1 de Excel = 1 de enero de 1900
    // Pero debido al error de Excel, necesitamos ajustar por el "29 de febrero de 1900" inexistente
    const epoch = new Date(1900, 0, 1) // 1 de enero de 1900
    
    // Para fechas después del "29 de febrero de 1900" (que no existe), Excel está 1 día adelantado
    // Por eso restamos 1 en lugar de 2
    const adjustedDays = excelDate > 59 ? excelDate - 1 : excelDate
    
    return new Date(epoch.getTime() + (adjustedDays - 1) * 24 * 60 * 60 * 1000)
  }

  /**
   * Crea resultado de error
   */
  createErrorResult(fileName, errors) {
    return {
      fileName,
      errors: Array.isArray(errors) ? errors : [errors],
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
      validationData: { totalEsperado: null, servSinConductEsperado: null },
      correctionLog: this.logger.getCorrections(),
      processingLog: this.logger.getLogs()
    }
  }
}

/**
 * Logger para validaciones y correcciones
 */
class ValidationLogger {
  constructor() {
    this.logs = []
    this.corrections = []
    this.startTime = null
    this.currentFile = null
  }

  startValidation(fileName) {
    this.currentFile = fileName
    this.startTime = new Date()
    this.logs = []
    this.corrections = []
    this.logInfo('Iniciando validación', { fileName })
  }

  endValidation(success) {
    const duration = new Date() - this.startTime
    this.logInfo('Validación completada', { 
      success, 
      duration: `${duration}ms`,
      corrections: this.corrections.length 
    })
  }

  logInfo(message, data = {}) {
    this.logs.push({
      level: 'info',
      message,
      data,
      timestamp: new Date().toISOString(),
      file: this.currentFile
    })
  }

  logWarning(message, data = {}) {
    this.logs.push({
      level: 'warning',
      message,
      data,
      timestamp: new Date().toISOString(),
      file: this.currentFile
    })
  }

  logError(message, error = null) {
    this.logs.push({
      level: 'error',
      message,
      error: error ? error.message : null,
      stack: error ? error.stack : null,
      timestamp: new Date().toISOString(),
      file: this.currentFile
    })
  }

  logProblem(message, data = {}) {
    this.logs.push({
      level: 'problem',
      message,
      data,
      timestamp: new Date().toISOString(),
      file: this.currentFile
    })
  }

  logCorrection(message, data = {}) {
    const correction = {
      type: 'correction',
      title: message,
      description: this.formatCorrectionDescription(message, data),
      originalValue: data.original,
      correctedValue: data.corrected || data.applied,
      location: data.location || `Archivo: ${this.currentFile}`,
      rule: data.rule || 'Corrección automática',
      timestamp: new Date().toISOString(),
      file: this.currentFile,
      // Datos originales para compatibilidad
      message,
      data
    }
    
    this.corrections.push(correction)
    this.logInfo(`CORRECCIÓN: ${message}`, data)
  }

  formatCorrectionDescription(message, data) {
    if (data.original && data.corrected) {
      return `${message}: "${data.original}" → "${data.corrected}"`
    } else if (data.original && data.applied) {
      return `${message}: se aplicó "${data.applied}" para "${data.original}"`
    } else {
      return message
    }
  }

  getLogs() {
    return [...this.logs]
  }

  getCorrections() {
    // Agrupar correcciones similares
    const grouped = new Map()
    
    for (const correction of this.corrections) {
      // Crear una clave única basada en el tipo de corrección Y la transformación específica
      const key = `${correction.title}|${correction.originalValue}→${correction.correctedValue}`
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)
        existing.count++
        // Ya no necesitamos examples array porque todas son idénticas
      } else {
        grouped.set(key, {
          ...correction,
          count: 1
        })
      }
    }
    
    // Convertir el Map a array y formatear la descripción
    return Array.from(grouped.values()).map(correction => {
      if (correction.count > 1) {
        // Formato para correcciones múltiples (misma transformación repetida)
        const description = `${correction.title} (${correction.count} veces): "${correction.originalValue}" → "${correction.correctedValue}"`
        
        return {
          ...correction,
          description: description,
          message: `${correction.title} (aplicado ${correction.count} veces)`,
          data: {
            ...correction.data,
            count: correction.count
          }
        }
      } else {
        // Formato para correcciones únicas
        const description = `${correction.title}: "${correction.originalValue}" → "${correction.correctedValue}"`
        return {
          ...correction,
          description: description
        }
      }
    })
  }
}

// Instancia singleton del servicio
export const excelValidationService = new ExcelValidationService()

export default excelValidationService
