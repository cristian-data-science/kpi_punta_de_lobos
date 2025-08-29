import { createContext, useContext, useState, useEffect } from 'react'

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

  // Credenciales fijas
  const VALID_CREDENTIALS = {
    username: 'admin',
    password: 'transapp123'
  }

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
    setLoading(false)
    console.log('AuthProvider: Loading completado')
  }, [])

  const login = (username, password) => {
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true)
      localStorage.setItem('transapp-auth', 'authenticated')
      return { success: true }
    } else {
      return { success: false, error: 'Credenciales incorrectas' }
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('transapp-auth')
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
