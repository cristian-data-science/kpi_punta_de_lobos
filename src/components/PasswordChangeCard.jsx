import { useState } from 'react'
import { getSupabaseClient } from '../services/supabaseClient'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

const PasswordChangeCard = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Validaciones básicas
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Todos los campos son obligatorios')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Las contraseñas nuevas no coinciden')
      }

      if (currentPassword === newPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual')
      }

      const supabase = getSupabaseClient()

      // 1. Obtener contraseña actual de Supabase
      const { data: configData, error: fetchError } = await supabase
        .from('app_config')
        .select('config_value')
        .eq('config_key', 'admin_password')
        .single()

      if (fetchError) {
        console.error('Error al verificar contraseña:', fetchError)
        throw new Error('Error al verificar contraseña actual')
      }

      // 2. Validar contraseña actual
      if (configData.config_value !== currentPassword) {
        throw new Error('Contraseña actual incorrecta')
      }

      // 3. Actualizar contraseña en Supabase
      const { error: updateError } = await supabase
        .from('app_config')
        .update({
          config_value: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', 'admin_password')

      if (updateError) {
        console.error('Error al actualizar contraseña:', updateError)
        throw new Error('Error al actualizar contraseña')
      }

      // 4. Limpiar formulario
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setMessage({
        type: 'success',
        text: 'Contraseña actualizada exitosamente. Los cambios se aplicarán en el próximo inicio de sesión.'
      })

      // Auto-cerrar mensaje de éxito después de 5 segundos
      setTimeout(() => setMessage(null), 5000)

    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Cambiar Contraseña de Administrador</CardTitle>
          <CardDescription>
            Actualiza tu contraseña de acceso al sistema
          </CardDescription>
        </div>
        <Lock className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Contraseña Actual */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Contraseña Actual
            </label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Botón de envío */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Actualizando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </>
            )}
          </Button>
        </form>

        {/* Información adicional */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Importante
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>La nueva contraseña se guarda en la base de datos</li>
                <li>Los cambios se aplican inmediatamente</li>
                <li>Deberás usar la nueva contraseña en tu próximo login</li>
                <li>Se recomienda usar una contraseña fuerte y única</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PasswordChangeCard
