import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, User, Bell, Shield, Database, Globe, Trash2 } from 'lucide-react'
import masterDataService from '@/services/masterDataService'
import { useState } from 'react'

const SettingsPage = () => {
  const [isClearing, setIsClearing] = useState(false)

  const handleClearAllData = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      setIsClearing(true)
      try {
        masterDataService.resetAllData()
        alert('Todos los datos han sido eliminados correctamente.')
        // Recargar la página para reflejar los cambios
        window.location.reload()
      } catch (error) {
        console.error('Error al limpiar datos:', error)
        alert('Error al eliminar los datos. Inténtalo de nuevo.')
      } finally {
        setIsClearing(false)
      }
    }
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">
          Administra las configuraciones generales del sistema
        </p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Información de la Empresa
            </CardTitle>
            <CardDescription>
              Configuración básica de la empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                defaultValue="TransApp Logística"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT Empresa
              </label>
              <input
                type="text"
                defaultValue="76.123.456-7"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                defaultValue="Av. Principal 123, Valparaíso"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button className="w-full">
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>
              Administra los usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">admin</p>
                  <p className="text-sm text-gray-500">Administrador</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Activo
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Agregar Usuario
            </Button>
            <Button variant="outline" className="w-full">
              Cambiar Contraseña
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Configura las alertas y notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Mantenimientos</p>
                <p className="text-sm text-gray-500">Alertas de mantenimiento de vehículos</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Pagos Pendientes</p>
                <p className="text-sm text-gray-500">Recordatorios de pagos por procesar</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Rutas Completadas</p>
                <p className="text-sm text-gray-500">Notificaciones de rutas finalizadas</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
            <Button className="w-full">
              Guardar Preferencias
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Configuraciones de seguridad del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Autenticación de dos factores</p>
                <p className="text-sm text-gray-500">Requiere código adicional para login</p>
              </div>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Cierre automático de sesión</p>
                <p className="text-sm text-gray-500">Después de 30 minutos de inactividad</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tiempo de sesión (minutos)
              </label>
              <input
                type="number"
                defaultValue="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button className="w-full">
              Aplicar Configuración
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Gestión de Datos
            </CardTitle>
            <CardDescription>
              Respaldo y gestión de información
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <Database className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900">Último respaldo</p>
                <p className="text-xs text-gray-500">20 de Enero, 2025 - 02:30 AM</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Crear Respaldo Manual
            </Button>
            <Button variant="outline" className="w-full">
              Exportar Datos
            </Button>
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleClearAllData}
              disabled={isClearing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? 'Limpiando...' : 'Limpiar TODOS los Datos'}
            </Button>
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              Sistema
            </CardTitle>
            <CardDescription>
              Información y configuración del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Versión:</span>
                <span className="text-sm font-medium text-gray-900">v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Última actualización:</span>
                <span className="text-sm font-medium text-gray-900">22 Enero 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Usuarios activos:</span>
                <span className="text-sm font-medium text-gray-900">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Espacio usado:</span>
                <span className="text-sm font-medium text-gray-900">2.3 GB</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Verificar Actualizaciones
            </Button>
            <Button variant="outline" className="w-full">
              Ver Logs del Sistema
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Estado del Sistema
              </h3>
              <p className="text-gray-600">
                Todos los servicios funcionando correctamente. 
                Última verificación: hace 5 minutos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Online</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage
