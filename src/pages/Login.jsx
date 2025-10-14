import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Truck, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Route,
  Settings,
  Shield
} from 'lucide-react'

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { 
    login, 
    loginAttempts, 
    isLocked, 
    remainingAttempts, 
    maxAttempts, 
    isLimitEnabled 
  } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = login(credentials.username, credentials.password)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Iconos flotantes */}
        <div className="absolute top-20 left-20 text-blue-200 animate-bounce">
          <Truck className="h-8 w-8" />
        </div>
        <div className="absolute top-40 right-32 text-orange-200 animate-bounce delay-500">
          <Route className="h-6 w-6" />
        </div>
        <div className="absolute bottom-32 left-32 text-blue-200 animate-bounce delay-1000">
          <Settings className="h-7 w-7" />
        </div>
        <div className="absolute bottom-20 right-20 text-orange-200 animate-bounce delay-700">
          <Truck className="h-8 w-8" />
        </div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-orange-600 rounded-2xl shadow-2xl mb-4">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            TransApp
          </h1>
          <p className="text-gray-600 mt-2">Sistema de Gestión de Transporte</p>
        </div>

        {/* Tarjeta de Login */}
        <Card className="backdrop-blur-xl bg-white/80 border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Acceso Seguro
            </CardTitle>
            <CardDescription className="text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Usuario */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={credentials.username}
                    onChange={handleInputChange}
                    placeholder="Ingresa tu usuario"
                    className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={handleInputChange}
                    placeholder="Ingresa tu contraseña"
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert className={`border-red-200 ${isLocked ? 'bg-red-100' : 'bg-red-50'}`}>
                  <AlertDescription className={`text-red-700 text-sm ${isLocked ? 'font-semibold' : ''}`}>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Información de Intentos de Login */}
              {isLimitEnabled && !isLocked && loginAttempts > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700 text-sm">
                    {remainingAttempts === 1 
                      ? `⚠️ Último intento disponible antes del bloqueo` 
                      : `Intentos restantes: ${remainingAttempts} de ${maxAttempts}`}
                  </AlertDescription>
                </Alert>
              )}

              {/* Estado de Usuario Bloqueado */}
              {isLocked && (
                <Alert className="border-red-300 bg-red-100">
                  <Lock className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm font-medium">
                    🔒 Usuario bloqueado por seguridad. Espera para intentar nuevamente.
                  </AlertDescription>
                </Alert>
              )}

              {/* Información del Sistema de Límites */}
              {isLimitEnabled && loginAttempts === 0 && !error && (
                <div className="text-xs text-gray-500 text-center">
                  Sistema de seguridad activo: máximo {maxAttempts} intentos permitidos
                </div>
              )}

              {/* Botón de Login */}
              <Button
                type="submit"
                disabled={loading || isLocked}
                className={`w-full h-12 font-medium rounded-lg transition-colors duration-150 shadow-lg ${
                  isLocked 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700'
                } text-white`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Verificando...
                  </div>
                ) : isLocked ? (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Usuario Bloqueado
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Iniciar Sesión
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2025 TransApp - Sistema de Gestión de Transporte
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Control de Flota y Personal
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
