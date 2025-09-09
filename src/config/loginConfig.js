// Configuración de Seguridad de Login - TransApp
// Para desactivar el límite de intentos, cambiar loginAttemptsEnabled a false

export const LOGIN_CONFIG = {
  // 🔒 Control de intentos de login
  loginAttemptsEnabled: true,  // true = activado, false = desactivado
  
  // 📊 Configuración de límites
  maxLoginAttempts: 3,         // Número máximo de intentos permitidos
  lockoutDuration: 15,         // Minutos de bloqueo después de exceder intentos
  
  // 🛡️ Configuración adicional
  resetAttemptsOnSuccess: true, // Resetear contador al login exitoso
  showAttemptsRemaining: true   // Mostrar intentos restantes al usuario
}

// Configuración de credenciales (mantener existente)
export const VALID_CREDENTIALS = {
  username: 'admin',
  password: 'transapp123'
}
