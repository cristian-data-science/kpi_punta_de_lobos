/**
 * Servicio para gestionar inconsistencias encontradas durante el procesamiento de archivos Excel
 */

class InconsistenciesService {
  constructor() {
    this.storageKey = 'transapp_inconsistencies'
  }

  /**
   * Obtiene todas las inconsistencias almacenadas
   */
  async getInconsistencies() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : this.getEmptyReport()
    } catch (error) {
      console.error('Error al obtener inconsistencias:', error)
      return this.getEmptyReport()
    }
  }

  /**
   * Actualiza el reporte de inconsistencias con nuevo archivo procesado
   */
  async updateInconsistencies(fileReport) {
    try {
      const current = await this.getInconsistencies()
      
      // Remover archivo existente si ya existe
      current.files = current.files.filter(f => f.fileName !== fileReport.fileName)
      
      // Agregar nuevo reporte
      current.files.unshift(fileReport) // Agregar al inicio
      
      // Mantener solo los últimos 50 archivos
      if (current.files.length > 50) {
        current.files = current.files.slice(0, 50)
      }
      
      // Actualizar resumen
      current.lastUpdate = new Date().toISOString()
      current.summary = this.calculateSummary(current.files)
      
      // Guardar
      localStorage.setItem(this.storageKey, JSON.stringify(current))
      
      // Disparar evento para actualizar la UI
      this.dispatchInconsistenciesUpdate()
      
      return current
    } catch (error) {
      console.error('Error al actualizar inconsistencias:', error)
      throw error
    }
  }

  /**
   * Limpia todas las inconsistencias
   */
  async clearInconsistencies() {
    try {
      localStorage.removeItem(this.storageKey)
      
      // Disparar evento para actualizar la UI
      this.dispatchInconsistenciesUpdate()
      
      return this.getEmptyReport()
    } catch (error) {
      console.error('Error al limpiar inconsistencias:', error)
      throw error
    }
  }

  /**
   * Dispara un evento personalizado para notificar cambios en inconsistencias
   */
  dispatchInconsistenciesUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inconsistencies-updated'))
    }
  }

  /**
   * Genera un reporte de inconsistencias para un archivo procesado
   */
  generateFileReport(fileName, validationResult, processStats) {
    const issues = []
    const processedAt = new Date().toISOString()

    // Analizar errores de validación
    if (validationResult.errors && validationResult.errors.length > 0) {
      validationResult.errors.forEach((error, index) => {
        issues.push({
          type: 'error',
          title: 'Error de Validación',
          description: error,
          location: `Error ${index + 1}`,
          suggestion: 'Revisa el formato del archivo Excel y asegúrate de que contenga todas las columnas requeridas.'
        })
      })
    }

    // Analizar logs de procesamiento para detectar problemas específicos
    if (validationResult.processingLog && validationResult.processingLog.length > 0) {
      validationResult.processingLog.forEach((log, index) => {
        if (log.level === 'problem') {
          issues.push({
            type: 'error',
            title: log.message,
            description: `${log.message}: ${log.data.original} - ${log.data.error}`,
            location: `Fila ${index + 1}`,
            suggestion: 'Revisa y corrige el formato de los datos en el archivo Excel.'
          })
        }
      })
    }

    // Analizar advertencias de validación
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      validationResult.warnings.forEach((warning, index) => {
        issues.push({
          type: 'warning',
          title: 'Advertencia de Validación',
          description: warning,
          location: `Advertencia ${index + 1}`,
          suggestion: 'Este problema no impide el procesamiento pero podría afectar la calidad de los datos.'
        })
      })
    }

    // Analizar correcciones automáticas aplicadas
    if (validationResult.correctionLog && validationResult.correctionLog.length > 0) {
      validationResult.correctionLog.forEach((correction, index) => {
        // Determinar si es un string simple o un objeto con más detalle
        const correctionText = typeof correction === 'string' ? correction : 
          (correction.description || correction.message || 'Corrección aplicada')
        
        const correctionDetail = typeof correction === 'object' ? 
          (correction.correction || correction.action || 'Acción automática aplicada') : 
          'Corrección automática aplicada'

        issues.push({
          type: 'info',
          title: 'Corrección Automática Aplicada',
          description: correctionText,
          location: typeof correction === 'object' && correction.location ? 
            correction.location : `Corrección ${index + 1}`,
          correctionApplied: correctionDetail,
          suggestion: 'El sistema aplicó automáticamente esta corrección para mejorar la calidad de los datos.',
          isCorrection: true
        })
      })
    }

    // Analizar problemas en turnos procesados
    if (validationResult.turnos && Array.isArray(validationResult.turnos)) {
      validationResult.turnos.forEach((turno, turnoIndex) => {
        // Verificar turnos sin conductores
        if (!turno.conductoresAsignados || turno.conductoresAsignados.length === 0) {
          issues.push({
            type: 'warning',
            title: 'Turno Sin Conductores',
            description: `El turno "${turno.turno}" en fecha "${turno.fecha}" no tiene conductores asignados.`,
            location: `Turno ${turnoIndex + 1}`,
            suggestion: 'Verifica que las columnas de conductores estén correctamente pobladas en el archivo Excel.'
          })
        }

        // Verificar fechas problemáticas
        if (!turno.fecha || turno.fecha === 'Sin fecha') {
          issues.push({
            type: 'error',
            title: 'Fecha Faltante',
            description: `El turno "${turno.turno}" no tiene fecha asignada.`,
            location: `Turno ${turnoIndex + 1}`,
            suggestion: 'Asegúrate de que la columna FECHA esté correctamente poblada.'
          })
        }

        // Verificar cantidad esperada
        if (!turno.cantidadEsperada || turno.cantidadEsperada <= 0) {
          issues.push({
            type: 'warning',
            title: 'Cantidad Esperada Inválida',
            description: `El turno "${turno.turno}" tiene cantidad esperada inválida: ${turno.cantidadEsperada}`,
            location: `Turno ${turnoIndex + 1}`,
            suggestion: 'Verifica que la columna CANT tenga valores numéricos válidos.'
          })
        }

        // Verificar discrepancia entre cantidad esperada y conductores
        const conductoresCount = turno.conductoresAsignados ? turno.conductoresAsignados.length : 0
        if (turno.cantidadEsperada && conductoresCount > 0 && Math.abs(turno.cantidadEsperada - conductoresCount) > 1) {
          issues.push({
            type: 'warning',
            title: 'Discrepancia en Cantidad',
            description: `Se esperaban ${turno.cantidadEsperada} conductores pero se encontraron ${conductoresCount} en el turno "${turno.turno}".`,
            location: `Turno ${turnoIndex + 1}`,
            suggestion: 'Revisa que la cantidad esperada coincida con los conductores asignados.'
          })
        }
      })
    }

    // Analizar configuración utilizada
    if (validationResult.configurationUsed && validationResult.configurationUsed !== 'default') {
      issues.push({
        type: 'info',
        title: 'Configuración de Validación Especial',
        description: `Se utilizó la configuración "${validationResult.configurationUsed}" para procesar este archivo.`,
        location: 'Configuración',
        suggestion: 'Esto indica que el archivo tenía un formato no estándar que requirió configuración especial.'
      })
    }

    // Estadísticas del archivo
    const stats = {
      turnosProcessed: validationResult.turnos ? validationResult.turnos.length : 0,
      conductorsFound: this.countUniqueConductors(validationResult.turnos || []),
      correctionsApplied: validationResult.correctionLog ? validationResult.correctionLog.length : 0,
      validationMode: validationResult.configurationUsed || 'default',
      ...processStats
    }

    return {
      fileName,
      processedAt,
      issues,
      stats,
      hasIssues: issues.filter(i => i.type === 'error' || i.type === 'warning').length > 0
    }
  }

  /**
   * Cuenta conductores únicos en los turnos
   */
  countUniqueConductors(turnos) {
    const uniqueConductors = new Set()
    turnos.forEach(turno => {
      if (turno.conductoresAsignados) {
        turno.conductoresAsignados.forEach(conductor => {
          uniqueConductors.add(conductor)
        })
      }
    })
    return uniqueConductors.size
  }

  /**
   * Calcula el resumen basado en los archivos procesados
   */
  calculateSummary(files) {
    return {
      filesProcessed: files.length,
      filesWithIssues: files.filter(f => f.hasIssues).length,
      totalIssues: files.reduce((sum, f) => sum + f.issues.length, 0),
      totalTurnos: files.reduce((sum, f) => sum + (f.stats?.turnosProcessed || 0), 0),
      totalCorrections: files.reduce((sum, f) => sum + (f.stats?.correctionsApplied || 0), 0)
    }
  }

  /**
   * Retorna un reporte vacío
   */
  getEmptyReport() {
    return {
      lastUpdate: null,
      summary: {
        filesProcessed: 0,
        filesWithIssues: 0,
        totalIssues: 0,
        totalTurnos: 0,
        totalCorrections: 0
      },
      files: []
    }
  }

  /**
   * Obtiene estadísticas rápidas (para mostrar en otros componentes)
   */
  async getQuickStats() {
    const data = await this.getInconsistencies()
    return {
      hasIssues: data.summary.filesWithIssues > 0,
      totalIssues: data.summary.totalIssues,
      lastUpdate: data.lastUpdate
    }
  }
}

// Instancia singleton
const inconsistenciesService = new InconsistenciesService()

export default inconsistenciesService
