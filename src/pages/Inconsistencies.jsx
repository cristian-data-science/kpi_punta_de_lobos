import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { 
  AlertTriangle, 
  FileX, 
  AlertCircle, 
  Info, 
  RefreshCw,
  ChevronDown,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Trash2
} from 'lucide-react'
import inconsistenciesService from '../services/inconsistenciesService'

function Inconsistencies() {
  const [inconsistencies, setInconsistencies] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [expandedFiles, setExpandedFiles] = useState(new Set())

  // Cargar inconsistencias
  const loadInconsistencies = async () => {
    setLoading(true)
    try {
      const data = await inconsistenciesService.getInconsistencies()
      setInconsistencies(data)
    } catch (error) {
      console.error('Error cargando inconsistencias:', error)
      setInconsistencies({
        lastUpdate: null,
        summary: { totalFiles: 0, filesWithIssues: 0, totalIssues: 0, filesProcessed: 0 },
        files: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInconsistencies()
  }, [])

  // Limpiar inconsistencias
  const clearInconsistencies = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar todas las inconsistencias? Esta acción no se puede deshacer.')) {
      return
    }

    setClearing(true)
    try {
      await inconsistenciesService.clearInconsistencies()
      await loadInconsistencies() // Recargar después de limpiar
    } catch (error) {
      console.error('Error limpiando inconsistencies:', error)
    } finally {
      setClearing(false)
    }
  }

  // Expandir/contraer archivo
  const toggleFileExpansion = (fileName) => {
    const newExpanded = new Set(expandedFiles)
    if (newExpanded.has(fileName)) {
      newExpanded.delete(fileName)
    } else {
      newExpanded.add(fileName)
    }
    setExpandedFiles(newExpanded)
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    return date.toLocaleString('es-CL')
  }

  // Obtener icono según tipo de inconsistencia
  const getInconsistencyIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  // Obtener color según tipo
  const getInconsistencyColor = (type) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando inconsistencias...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inconsistencias en Archivos</h1>
          <p className="text-gray-600 mt-2">
            Errores, advertencias y correcciones detectadas durante la carga de archivos Excel
          </p>
          {inconsistencies?.lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Última actualización: {formatDate(inconsistencies.lastUpdate)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={clearInconsistencies} 
            variant="outline"
            disabled={clearing || !inconsistencies || inconsistencies.files.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {clearing ? 'Limpiando...' : 'Limpiar Todo'}
          </Button>
          <Button onClick={loadInconsistencies} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {!inconsistencies || inconsistencies.files.length === 0 ? (
        /* Estado vacío */
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay inconsistencias registradas</h3>
            <p className="text-gray-500 mb-4">
              Carga archivos Excel en la sección "Cargar Archivos" para generar el reporte de inconsistencias.
            </p>
            <Button variant="outline">
              Ir a Cargar Archivos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Archivos Procesados</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {inconsistencies.summary.filesProcessed}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Con Problemas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {inconsistencies.summary.filesWithIssues}
                    </p>
                  </div>
                  <FileX className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Inconsistencias</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {inconsistencies.summary.totalIssues}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Correcciones Aplicadas</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {inconsistencies.summary.totalCorrections}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                    <p className="text-2xl font-bold text-green-600">
                      {inconsistencies.summary.filesProcessed > 0 
                        ? Math.round(((inconsistencies.summary.filesProcessed - inconsistencies.summary.filesWithIssues) / inconsistencies.summary.filesProcessed) * 100)
                        : 100}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de archivos con inconsistencias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Reporte Detallado por Archivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inconsistencies.files.map((file) => {
                  const isExpanded = expandedFiles.has(file.fileName)
                  const hasIssues = file.issues && file.issues.length > 0
                  
                  return (
                    <div key={file.fileName} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header del archivo */}
                      <div 
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          hasIssues ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}
                        onClick={() => toggleFileExpansion(file.fileName)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ChevronDown 
                              className={`h-4 w-4 text-gray-400 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`} 
                            />
                            <FileText className="h-5 w-5 text-gray-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900">{file.fileName}</h3>
                              <p className="text-sm text-gray-600">
                                Procesado: {formatDate(file.processedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                hasIssues ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {hasIssues ? `${file.issues.length} problema(s)` : 'Sin problemas'}
                              </p>
                              {file.stats && (
                                <p className="text-xs text-gray-500">
                                  {file.stats.turnosProcessed} turnos procesados
                                </p>
                              )}
                            </div>
                            {hasIssues ? (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Detalles expandidos */}
                      {isExpanded && (
                        <div className="p-4 border-t border-gray-100">
                          {/* Estadísticas del archivo */}
                          {file.stats && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Estadísticas de Procesamiento</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Turnos:</span>
                                  <span className="ml-1 font-medium">{file.stats.turnosProcessed}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Conductores:</span>
                                  <span className="ml-1 font-medium">{file.stats.conductorsFound}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Correcciones:</span>
                                  <span className="ml-1 font-medium">{file.stats.correctionsApplied}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Configuración:</span>
                                  <span className="ml-1 font-medium">{file.stats.validationMode}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Lista de inconsistencias */}
                          {hasIssues ? (
                            <div className="space-y-4">
                              {/* Sección de Problemas (errores y advertencias) */}
                              {file.issues.filter(issue => issue.type === 'error' || issue.type === 'warning').length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    Problemas Detectados
                                  </h4>
                                  <div className="space-y-2">
                                    {file.issues.filter(issue => issue.type === 'error' || issue.type === 'warning').map((issue, index) => (
                                      <div 
                                        key={index} 
                                        className={`p-3 rounded-lg border ${getInconsistencyColor(issue.type)}`}
                                      >
                                        <div className="flex items-start gap-2">
                                          {getInconsistencyIcon(issue.type)}
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                              <h5 className="text-sm font-medium text-gray-900">
                                                {issue.title}
                                              </h5>
                                              <span className="text-xs text-gray-500">
                                                {issue.location}
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-1">
                                              {issue.description}
                                            </p>
                                            {issue.suggestion && (
                                              <p className="text-xs text-gray-600 mt-1 italic">
                                                💡 Sugerencia: {issue.suggestion}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Sección de Correcciones Automáticas */}
                              {file.issues.filter(issue => issue.isCorrection === true || issue.type === 'info').length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Correcciones Automáticas Aplicadas
                                  </h4>
                                  <div className="space-y-2">
                                    {file.issues.filter(issue => issue.isCorrection === true || issue.type === 'info').map((issue, index) => (
                                      <div 
                                        key={index} 
                                        className={`p-3 rounded-lg border ${getInconsistencyColor(issue.type)}`}
                                      >
                                        <div className="flex items-start gap-2">
                                          {getInconsistencyIcon(issue.type)}
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                              <h5 className="text-sm font-medium text-gray-900">
                                                {issue.title}
                                              </h5>
                                              <span className="text-xs text-gray-500">
                                                {issue.location}
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-1">
                                              {issue.description}
                                            </p>
                                            {issue.correctionApplied && (
                                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                                <p className="text-xs text-green-700 font-medium">
                                                  🔧 Detalle de la corrección:
                                                </p>
                                                <p className="text-xs text-green-600 mt-1">
                                                  {issue.correctionApplied}
                                                </p>
                                              </div>
                                            )}
                                            {issue.suggestion && (
                                              <p className="text-xs text-gray-600 mt-1 italic">
                                                ℹ️ {issue.suggestion}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                              <p className="text-sm text-gray-600">
                                Archivo procesado sin inconsistencias
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default Inconsistencies
