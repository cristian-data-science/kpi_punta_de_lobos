import { createContext, useContext, useState, useEffect } from 'react'
import { LOGIN_CONFIG, VALID_CREDENTIALS } from '@/config/loginConfig'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutEndTime, setLockoutEndTime] = useState(null)

  useEffect(() => {
    // Verificar si el usuario ya está autenticado
    console.log('AuthProvider: Verificando estado de autenticación...')
    const authStatus = localStorage.getItem('transapp-auth')
    console.log('AuthProvider: authStatus from localStorage:', authStatus)
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
      console.log('AuthProvider: Usuario ya autenticado')
    } else {
      console.log('AuthProvider: Usuario no autenticado')
    }
    
    // Verificar estado de bloqueo si está habilitado
    if (LOGIN_CONFIG.loginAttemptsEnabled) {
      checkLockoutStatus()
    }
    
    setLoading(false)
    console.log('AuthProvider: Loading completado')
  }, [])

  // Verificar si el usuario está bloqueado
  const checkLockoutStatus = () => {
    const lockoutData = localStorage.getItem('transapp-lockout')
    if (lockoutData) {
      const { endTime, attempts } = JSON.parse(lockoutData)
      const now = new Date().getTime()
      
      if (now < endTime) {
        setIsLocked(true)
        setLockoutEndTime(endTime)
        setLoginAttempts(attempts)
      } else {
        // El bloqueo ha expirado, limpiar datos
        localStorage.removeItem('transapp-lockout')
        localStorage.removeItem('transapp-login-attempts')
        setIsLocked(false)
        setLockoutEndTime(null)
        setLoginAttempts(0)
      }
    } else {
      // Verificar intentos previos
      const attempts = parseInt(localStorage.getItem('transapp-login-attempts') || '0')
      setLoginAttempts(attempts)
    }
  }

  // Función para bloquear usuario
  const lockUser = () => {
    const endTime = new Date().getTime() + (LOGIN_CONFIG.lockoutDuration * 60 * 1000)
    const lockoutData = {
      endTime,
      attempts: loginAttempts
    }
    localStorage.setItem('transapp-lockout', JSON.stringify(lockoutData))
    setIsLocked(true)
    setLockoutEndTime(endTime)
  }

  // Función para resetear intentos
  const resetAttempts = () => {
    localStorage.removeItem('transapp-login-attempts')
    localStorage.removeItem('transapp-lockout')
    setLoginAttempts(0)
    setIsLocked(false)
    setLockoutEndTime(null)
  }

  const login = (username, password) => {
    // Si el sistema de límite de intentos está desactivado, usar login normal
    if (!LOGIN_CONFIG.loginAttemptsEnabled) {
      if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
        setIsAuthenticated(true)
        localStorage.setItem('transapp-auth', 'authenticated')
        return { success: true }
      } else {
        return { success: false, error: 'Credenciales incorrectas' }
      }
    }

    // Verificar si el usuario está bloqueado
    if (isLocked) {
      const now = new Date().getTime()
      const remainingTime = Math.ceil((lockoutEndTime - now) / (1000 * 60))
      return { 
        success: false, 
        error: `Usuario bloqueado. Intenta nuevamente en ${remainingTime} minutos.`,
        isLocked: true,
        remainingTime
      }
    }

    // Verificar credenciales
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      // Login exitoso
      setIsAuthenticated(true)
      localStorage.setItem('transapp-auth', 'authenticated')
      
      // Resetear intentos si está configurado
      if (LOGIN_CONFIG.resetAttemptsOnSuccess) {
        resetAttempts()
      }
      
      return { success: true }
    } else {
      // Login fallido
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)
      localStorage.setItem('transapp-login-attempts', newAttempts.toString())

      // Verificar si se debe bloquear el usuario
      if (newAttempts >= LOGIN_CONFIG.maxLoginAttempts) {
        lockUser()
        return { 
          success: false, 
          error: `Demasiados intentos fallidos. Usuario bloqueado por ${LOGIN_CONFIG.lockoutDuration} minutos.`,
          isLocked: true,
          attemptsExceeded: true
        }
      }

      const remainingAttempts = LOGIN_CONFIG.maxLoginAttempts - newAttempts
      const errorMessage = LOGIN_CONFIG.showAttemptsRemaining 
        ? `Credenciales incorrectas. Te quedan ${remainingAttempts} intentos.`
        : 'Credenciales incorrectas'

      return { 
        success: false, 
        error: errorMessage,
        remainingAttempts,
        currentAttempts: newAttempts
      }
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('transapp-auth')
    // Opcional: resetear intentos al hacer logout
    // resetAttempts()
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      loading,
      login,
      logout,
      loginAttempts,
      isLocked,
      lockoutEndTime,
      remainingAttempts: LOGIN_CONFIG.maxLoginAttempts - loginAttempts,
      maxAttempts: LOGIN_CONFIG.maxLoginAttempts,
      isLimitEnabled: LOGIN_CONFIG.loginAttemptsEnabled,
      resetAttempts
    }}>
      {children}
    </AuthContext.Provider>
  )
}
