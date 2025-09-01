/**
 * Servicio de Configuración para Validaciones de Excel
 * 
 * Permite configurar diferentes tipos de planillas y reglas de validación
 * de manera flexible y extensible.
 */

export class ExcelValidationConfig {
  constructor() {
    this.configurations = new Map()
    this.currentConfig = 'default'
    this.initializeDefaultConfigurations()
  }

  /**
   * Inicializa las configuraciones por defecto
   */
  initializeDefaultConfigurations() {
    // Configuración estándar actual
    this.addConfiguration('default', {
      name: 'Planilla Estándar',
      description: 'Formato estándar de planillas de turnos de conductores',
      headers: {
        required: ['FECHA', 'TURNO', 'CANT'],
        conductorColumns: ['CONDUCTOR 1', 'CONDUCTOR 2', 'CONDUCTOR 3', 'CONDUCTOR 4', 'CONDUCTOR 5'],
        optional: ['CONDUCTOR EXTRA', 'SERV SIN CONDUCTOR', 'CONDUCTOR', 'TURNOS'],
        maxHeaderRow: 10,
        headerVariations: {
          'FECHA': ['FECHA', 'DIA', 'DATE'],
          'TURNO': ['TURNO', 'SHIFT', 'TIPO TURNO'],
          'CANT': ['CANT', 'CANT.', 'CANTIDAD', 'QTY', 'CONDUCTORES']
        }
      },
      dates: {
        minExcelDate: 40000,
        maxExcelDate: 50000,
        allowedFormats: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'],
        autoDetectFormat: true,
        convertExcelDates: true,
        fillMissingDates: true
      },
      turnos: {
        allowed: ['PRIMER TURNO', 'SEGUNDO TURNO', 'TERCER TURNO'],
        variations: {
          'PRIMER TURNO': ['PRIMER TURNO', 'PRIMERO', '1ER TURNO', '1ER', 'TURNO 1', 'PRIMERA'],
          'SEGUNDO TURNO': ['SEGUNDO TURNO', 'SEGUNDO', '2DO TURNO', '2DO', 'TURNO 2', 'SEGUNDA'],
          'TERCER TURNO': ['TERCER TURNO', 'TERCERO', '3ER TURNO', '3ER', 'TURNO 3', 'TERCERA']
        },
        cancelMarkers: ['X', 'x', 'CANCELADO', 'CANCELA', 'N/A', '-']
      },
      conductores: {
        minLength: 2,
        maxLength: 50,
        allowedChars: /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-\.\']+$/,
        invalidMarkers: ['X', 'x', 'NULL', 'N/A', '', ' ', '-'],
        caseSensitive: false,
        autoCorrect: {
          trimSpaces: true,
          normalizeCase: 'upper',
          removeExtraSpaces: true,
          commonReplacements: {
            'VALDES': 'VALDEZ',
            'VALLEJO': 'VALLEJOS',
            'VALLEJAS': 'VALLEJOS',
            'GONZALES': 'GONZALEZ',
            'NELSO': 'NELSON'
          }
        }
      },
      cantidad: {
        min: 0,
        max: 20,
        mustBeInteger: true,
        autoCorrect: true
      },
      validation: {
        strictMode: false, // Si es true, errores menores se vuelven críticos
        allowPartialData: true, // Permite procesar archivos con algunos errores
        maxWarnings: 50, // Máximo de advertencias antes de fallar
        requireTotals: false, // Requiere que existan filas de totales
        autoCorrection: true // Habilita corrección automática
      }
    })

    // Configuración estricta
    this.addConfiguration('strict', {
      name: 'Validación Estricta',
      description: 'Validación estricta que rechaza archivos con cualquier inconsistencia',
      headers: {
        required: ['FECHA', 'TURNO', 'CANT'],
        conductorColumns: ['CONDUCTOR 1', 'CONDUCTOR 2', 'CONDUCTOR 3', 'CONDUCTOR 4', 'CONDUCTOR 5'],
        optional: ['CONDUCTOR EXTRA', 'SERV SIN CONDUCTOR', 'CONDUCTOR', 'TURNOS'],
        maxHeaderRow: 10,
        headerVariations: {
          'FECHA': ['FECHA', 'DIA', 'DATE'],
          'TURNO': ['TURNO', 'SHIFT', 'TIPO TURNO'],
          'CANT': ['CANT', 'CANT.', 'CANTIDAD', 'QTY', 'CONDUCTORES']
        }
      },
      dates: {
        minExcelDate: 40000,
        maxExcelDate: 50000,
        allowedFormats: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'],
        autoDetectFormat: true,
        convertExcelDates: true,
        fillMissingDates: false
      },
      turnos: {
        allowed: ['PRIMER TURNO', 'SEGUNDO TURNO', 'TERCER TURNO'],
        variations: {
          'PRIMER TURNO': ['PRIMER TURNO'],
          'SEGUNDO TURNO': ['SEGUNDO TURNO'],
          'TERCER TURNO': ['TERCER TURNO']
        },
        cancelMarkers: ['X', 'x', 'CANCELADO', 'CANCELA', 'N/A', '-']
      },
      conductores: {
        minLength: 2,
        maxLength: 50,
        allowedChars: /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-\.\']+$/,
        invalidMarkers: ['X', 'x', 'NULL', 'N/A', '', ' ', '-'],
        caseSensitive: true,
        autoCorrect: {
          trimSpaces: false,
          normalizeCase: 'none',
          removeExtraSpaces: false,
          commonReplacements: {}
        }
      },
      cantidad: {
        min: 0,
        max: 20,
        mustBeInteger: true,
        autoCorrect: false
      },
      validation: {
        strictMode: true,
        allowPartialData: false,
        maxWarnings: 10,
        requireTotals: true,
        autoCorrection: false
      }
    })

    // Configuración permisiva
    this.addConfiguration('permissive', {
      name: 'Validación Permisiva',
      description: 'Validación permisiva que acepta y corrige la mayoría de errores',
      headers: {
        required: ['FECHA', 'TURNO', 'CANT'],
        conductorColumns: ['CONDUCTOR 1', 'CONDUCTOR 2', 'CONDUCTOR 3', 'CONDUCTOR 4', 'CONDUCTOR 5'],
        optional: ['CONDUCTOR EXTRA', 'SERV SIN CONDUCTOR', 'CONDUCTOR', 'TURNOS'],
        maxHeaderRow: 15,
        headerVariations: {
          'FECHA': ['FECHA', 'DIA', 'DATE'],
          'TURNO': ['TURNO', 'SHIFT', 'TIPO TURNO'],
          'CANT': ['CANT', 'CANT.', 'CANTIDAD', 'QTY', 'CONDUCTORES']
        }
      },
      dates: {
        minExcelDate: 40000,
        maxExcelDate: 50000,
        allowedFormats: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'],
        autoDetectFormat: true,
        convertExcelDates: true,
        fillMissingDates: true
      },
      turnos: {
        allowed: ['PRIMER TURNO', 'SEGUNDO TURNO', 'TERCER TURNO'],
        variations: {
          'PRIMER TURNO': ['PRIMER TURNO', 'PRIMERO', '1ER TURNO', '1ER', 'TURNO 1', 'PRIMERA'],
          'SEGUNDO TURNO': ['SEGUNDO TURNO', 'SEGUNDO', '2DO TURNO', '2DO', 'TURNO 2', 'SEGUNDA'],
          'TERCER TURNO': ['TERCER TURNO', 'TERCERO', '3ER TURNO', '3ER', 'TURNO 3', 'TERCERA']
        },
        cancelMarkers: ['X', 'x', 'CANCELADO', 'CANCELA', 'N/A', '-']
      },
      conductores: {
        minLength: 1,
        maxLength: 50,
        allowedChars: /^[A-Za-zÀ-ÿ\u00f1\u00d1\s\-\.\']+$/,
        invalidMarkers: ['X', 'x', 'NULL', 'N/A', '', ' ', '-'],
        caseSensitive: false,
        autoCorrect: {
          trimSpaces: true,
          normalizeCase: 'upper',
          removeExtraSpaces: true,
          commonReplacements: {
            'VALDES': 'VALDEZ',
            'VALLEJOS': 'VALLEJO',
            'VALLEJAS': 'VALLEJO',
            'GONZALES': 'GONZALEZ',
            'NELSO': 'NELSON'
          }
        }
      },
      cantidad: {
        min: 0,
        max: 25,
        mustBeInteger: true,
        autoCorrect: true
      },
      validation: {
        strictMode: false,
        allowPartialData: true,
        maxWarnings: 200,
        requireTotals: false,
        autoCorrection: true
      }
    })

    // Configuración para planillas antiguas
    this.addConfiguration('legacy', {
      name: 'Planillas Antiguas',
      description: 'Para procesar planillas con formato anterior o no estándar',
      headers: {
        required: ['FECHA', 'TURNO'],
        conductorColumns: ['CONDUCTOR 1', 'CONDUCTOR 2', 'CONDUCTOR 3', 'CONDUCTOR 4'],
        optional: ['CANTIDAD', 'CANT', 'SERVICIOS', 'OBSERVACIONES'],
        maxHeaderRow: 15,
        headerVariations: {
          'FECHA': ['FECHA', 'DIA', 'DATE', 'F', 'JORNADA'],
          'TURNO': ['TURNO', 'SHIFT', 'TIPO', 'T', 'HORARIO'],
          'CANT': ['CANT', 'CANTIDAD', 'QTY', 'NUM', 'TOTAL']
        }
      },
      dates: {
        minExcelDate: 35000, // Fechas más antiguas
        maxExcelDate: 50000,
        allowedFormats: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY'],
        autoDetectFormat: true,
        convertExcelDates: true,
        fillMissingDates: true
      },
      turnos: {
        allowed: ['PRIMER TURNO', 'SEGUNDO TURNO', 'TERCER TURNO', 'MAÑANA', 'TARDE', 'NOCHE'],
        variations: {
          'PRIMER TURNO': ['PRIMER TURNO', 'MAÑANA', 'AM', '1ER', 'TURNO 1', 'MATUTINO'],
          'SEGUNDO TURNO': ['SEGUNDO TURNO', 'TARDE', 'PM', '2DO', 'TURNO 2', 'VESPERTINO'],
          'TERCER TURNO': ['TERCER TURNO', 'NOCHE', 'NOCTURNO', '3ER', 'TURNO 3']
        },
        cancelMarkers: ['X', 'x', 'CANCELADO', 'CANCELA', 'N/A', '-', 'NO']
      },
      validation: {
        strictMode: false,
        allowPartialData: true,
        maxWarnings: 100,
        requireTotals: false,
        autoCorrection: true
      }
    })
  }

  /**
   * Agrega una nueva configuración
   */
  addConfiguration(key, config) {
    this.configurations.set(key, config)
  }

  /**
   * Obtiene una configuración por clave
   */
  getConfiguration(key = null) {
    const configKey = key || this.currentConfig
    return this.configurations.get(configKey) || this.configurations.get('default')
  }

  /**
   * Establece la configuración actual
   */
  setCurrentConfiguration(key) {
    if (this.configurations.has(key)) {
      this.currentConfig = key
      return true
    }
    return false
  }

  /**
   * Lista todas las configuraciones disponibles
   */
  listConfigurations() {
    return Array.from(this.configurations.entries()).map(([key, config]) => ({
      key,
      name: config.name,
      description: config.description
    }))
  }

  /**
   * Detecta automáticamente la mejor configuración para un archivo
   */
  detectBestConfiguration(headerRow) {
    const scores = new Map()

    for (const [key, config] of this.configurations) {
      let score = 0

      // Puntuar por headers encontrados
      const requiredHeaders = config.headers.required
      for (const required of requiredHeaders) {
        if (this.findHeaderInRow(headerRow, required, config.headers.headerVariations)) {
          score += 10
        }
      }

      // Puntuar por headers de conductores
      const conductorHeaders = config.headers.conductorColumns
      for (const conductor of conductorHeaders) {
        if (this.findHeaderInRow(headerRow, conductor)) {
          score += 5
        }
      }

      scores.set(key, score)
    }

    // Retornar la configuración con mayor puntaje
    const bestConfig = Array.from(scores.entries())
      .sort(([,a], [,b]) => b - a)[0]

    return bestConfig ? bestConfig[0] : 'default'
  }

  /**
   * Busca un header en una fila considerando variaciones
   */
  findHeaderInRow(row, headerName, variations = {}) {
    if (!row || !Array.isArray(row)) return false

    const searchTerms = variations[headerName] || [headerName]
    
    return row.some(cell => {
      if (!cell || typeof cell !== 'string') return false
      
      const cellUpper = cell.toString().toUpperCase().trim()
      return searchTerms.some(term => cellUpper.includes(term.toUpperCase()))
    })
  }

  /**
   * Valida una configuración personalizada
   */
  validateConfiguration(config) {
    const errors = []

    // Validar estructura básica
    if (!config.headers || !config.headers.required) {
      errors.push('Configuración debe tener headers.required')
    }

    if (!config.turnos || !config.turnos.allowed) {
      errors.push('Configuración debe tener turnos.allowed')
    }

    if (!config.conductores) {
      errors.push('Configuración debe tener configuración de conductores')
    }

    if (!config.validation) {
      errors.push('Configuración debe tener configuración de validation')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Crea una configuración personalizada basada en una existente
   */
  createCustomConfiguration(baseKey, overrides, customKey) {
    const baseConfig = this.getConfiguration(baseKey)
    if (!baseConfig) {
      throw new Error(`Configuración base '${baseKey}' no encontrada`)
    }

    // Combinar configuración base con overrides
    const customConfig = this.deepMerge(baseConfig, overrides)

    // Validar configuración personalizada
    const validation = this.validateConfiguration(customConfig)
    if (!validation.isValid) {
      throw new Error(`Configuración inválida: ${validation.errors.join(', ')}`)
    }

    // Agregar configuración personalizada
    this.addConfiguration(customKey, customConfig)
    return customConfig
  }

  /**
   * Merge profundo de objetos
   */
  deepMerge(target, source) {
    const result = { ...target }

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }

    return result
  }

  /**
   * Exporta configuración a JSON
   */
  exportConfiguration(key) {
    const config = this.getConfiguration(key)
    return JSON.stringify(config, null, 2)
  }

  /**
   * Importa configuración desde JSON
   */
  importConfiguration(jsonString, key) {
    try {
      const config = JSON.parse(jsonString)
      const validation = this.validateConfiguration(config)
      
      if (!validation.isValid) {
        throw new Error(`Configuración inválida: ${validation.errors.join(', ')}`)
      }

      this.addConfiguration(key, config)
      return true
    } catch (error) {
      throw new Error(`Error importando configuración: ${error.message}`)
    }
  }

  /**
   * Obtiene estadísticas de uso de configuraciones
   */
  getUsageStats() {
    // Esto se podría implementar con un sistema de logging más avanzado
    return {
      totalConfigurations: this.configurations.size,
      currentConfiguration: this.currentConfig,
      availableConfigurations: this.listConfigurations()
    }
  }
}

// Instancia singleton
export const excelValidationConfig = new ExcelValidationConfig()

export default excelValidationConfig
