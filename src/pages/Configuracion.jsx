import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Database, Lock, Bell, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PasswordChangeCard from '@/components/PasswordChangeCard'

const Configuracion = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">Ajustes y preferencias del sistema</p>
      </div>

      {/* Sección de Cambio de Contraseña */}
      <PasswordChangeCard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Base de Datos</CardTitle>
              <CardDescription>Conexión y configuración de Supabase</CardDescription>
            </div>
            <Database className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Estado: <span className="text-green-600 font-medium">Conectado</span></p>
              <Button variant="outline" size="sm">Verificar Conexión</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>Control de acceso y permisos</CardDescription>
            </div>
            <Lock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Autenticación activa</p>
              <Button variant="outline" size="sm">Gestionar Usuarios</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Preferencias de alertas</CardDescription>
            </div>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Configurar alertas del sistema</p>
              <Button variant="outline" size="sm">Configurar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Temas y personalización</CardDescription>
            </div>
            <Palette className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Tema actual: Claro</p>
              <Button variant="outline" size="sm">Cambiar Tema</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
          <CardDescription>Detalles técnicos y versión</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Versión:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Entorno:</span>
              <span className="font-medium">Desarrollo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base de datos:</span>
              <span className="font-medium">Supabase</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Configuracion
