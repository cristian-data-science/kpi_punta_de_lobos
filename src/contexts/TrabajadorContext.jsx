import { createContext, useContext, useState, useEffect } from 'react'

const TrabajadorContext = createContext()

export const useTrabajador = () => {
  const context = useContext(TrabajadorContext)
  if (!context) {
    throw new Error('useTrabajador must be used within a TrabajadorProvider')
  }
  return context
}

export const TrabajadorProvider = ({ children }) => {
  const [trabajador, setTrabajador] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si el trabajador ya está autenticado
    console.log('TrabajadorContext: Verificando estado de autenticación...')
    const trabajadorData = localStorage.getItem('trabajador-auth')
    
    if (trabajadorData) {
      try {
        const data = JSON.parse(trabajadorData)
        setTrabajador(data)
        setIsAuthenticated(true)
        console.log('TrabajadorContext: Trabajador autenticado:', data.nombre)
      } catch (error) {
        console.error('TrabajadorContext: Error al parsear datos:', error)
        localStorage.removeItem('trabajador-auth')
      }
    } else {
      console.log('TrabajadorContext: Trabajador no autenticado')
    }
    
    setLoading(false)
    console.log('TrabajadorContext: Loading completado')
  }, [])

  const loginTrabajador = (personaData) => {
    // Guardar datos del trabajador en localStorage
    const trabajadorAuth = {
      id: personaData.id,
      rut: personaData.rut,
      nombre: personaData.nombre,
      email: personaData.email,
      tipo: personaData.tipo
    }
    
    localStorage.setItem('trabajador-auth', JSON.stringify(trabajadorAuth))
    setTrabajador(trabajadorAuth)
    setIsAuthenticated(true)
    
    console.log('TrabajadorContext: Login exitoso para:', trabajadorAuth.nombre)
    return { success: true }
  }

  const logoutTrabajador = () => {
    localStorage.removeItem('trabajador-auth')
    setTrabajador(null)
    setIsAuthenticated(false)
    console.log('TrabajadorContext: Logout exitoso')
  }

  const value = {
    trabajador,
    isAuthenticated,
    loading,
    loginTrabajador,
    logoutTrabajador
  }

  return (
    <TrabajadorContext.Provider value={value}>
      {children}
    </TrabajadorContext.Provider>
  )
}
