// 🔌 Componente para verificar la conexión a Supabase
// Uso: Importa este componente en tu App.jsx o Dashboard para verificar la conexión

import { useState, useEffect } from 'react'
import { checkSupabaseConnection, getEstadisticas } from '@/services/supabaseHelpers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, RefreshCw, Database, Users, Activity } from 'lucide-react'

export const SupabaseConnectionTest = () => {
  const [status, setStatus] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const connectionStatus = await checkSupabaseConnection()
      setStatus(connectionStatus)

      // Si la conexión es exitosa, obtener estadísticas
      if (connectionStatus.connected) {
        const statistics = await getEstadisticas()
        setStats(statistics)
      }
    } catch (error) {
      setStatus({
        configured: false,
        connected: false,
        error: error.message
      })
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  const handleRetry = () => {
    setRetrying(true)
    checkConnection()
  }

  if (loading && !retrying) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Verificando conexión a Supabase...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Estado de la Conexión */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Estado de Supabase</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={loading || retrying}
            >
              {retrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Verificación de conexión y configuración
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado de Configuración */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">Configuración</span>
            {status?.configured ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                No Configurado
              </Badge>
            )}
          </div>

          {/* Estado de Conexión */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="font-medium">Conexión</span>
            {status?.connected ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
          </div>

          {/* Información de URL */}
          {status?.url && (
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-1">URL del Proyecto</div>
              <div className="text-xs text-muted-foreground truncate">
                {status.url}
              </div>
            </div>
          )}

          {/* Error */}
          {status?.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Error de Conexión</div>
                <div className="text-sm mt-1">{status.error}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Instrucciones de Configuración */}
          {!status?.configured && (
            <Alert>
              <AlertDescription>
                <div className="font-medium mb-2">⚙️ Configuración Requerida</div>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Ve a <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Supabase Dashboard</a></li>
                  <li>Crea un proyecto o selecciona uno existente</li>
                  <li>Ve a Settings → API</li>
                  <li>Copia la URL del proyecto y la anon key</li>
                  <li>Pega estos valores en el archivo <code className="bg-muted px-1 rounded">.env.local</code></li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas (solo si está conectado) */}
      {status?.connected && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estadísticas de la Base de Datos
            </CardTitle>
            <CardDescription>
              Datos en tiempo real de tu proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Personas */}
              <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Total Personas
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.totalPersonas}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {stats.personasActivas} activas
                </div>
              </div>

              {/* Total Registros */}
              <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Total Registros
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {stats.totalRegistros}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Actividades registradas
                </div>
              </div>

              {/* Actividades por Tipo */}
              <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Tipos de Actividad
                  </span>
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {Object.keys(stats.actividadesPorTipo || {}).length}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Categorías diferentes
                </div>
              </div>
            </div>

            {/* Detalle de Actividades por Tipo */}
            {stats.actividadesPorTipo && Object.keys(stats.actividadesPorTipo).length > 0 && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <div className="text-sm font-medium mb-2">Distribución por Tipo:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.actividadesPorTipo).map(([tipo, count]) => (
                    <Badge key={tipo} variant="outline">
                      {tipo}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guía Rápida */}
      {status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>✅ ¡Conexión Exitosa!</CardTitle>
            <CardDescription>
              Tu aplicación está conectada a Supabase. Próximos pasos:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Usa los helpers en <code className="bg-muted px-1 rounded">services/supabaseHelpers.js</code> para interactuar con la BD</li>
              <li>Implementa CRUD (crear, leer, actualizar, eliminar) en tus componentes</li>
              <li>Configura Supabase Auth para reemplazar el login actual</li>
              <li>Habilita Real-time para actualizaciones en vivo</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SupabaseConnectionTest
