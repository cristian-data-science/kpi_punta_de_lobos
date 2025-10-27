import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TrabajadorProvider } from './contexts/TrabajadorContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import LoginTrabajador from './pages/LoginTrabajador'
import TurnosViewer from './pages/TurnosViewer'
import Dashboard from './pages/Dashboard'
import Roadmap from './pages/Roadmap'
import Personas from './pages/Personas'
import Turnos from './pages/Turnos'
import Pagos from './pages/Pagos'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import TestSupabase from './pages/TestSupabase'
import { Waves } from 'lucide-react'
import './App.css'

// Componente interno que maneja la lógica de rutas
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth()

  console.log('AppRoutes: loading =', loading, 'isAuthenticated =', isAuthenticated)

  if (loading) {
    console.log('AppRoutes: Mostrando pantalla de carga')
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl shadow-2xl mb-4 animate-pulse">
            <Waves className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Punta de Lobos</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-150"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('AppRoutes: Mostrando página de login')
    return <Login />
  }

  console.log('AppRoutes: Mostrando aplicación principal')
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="personas" element={<Personas />} />
        <Route path="turnos" element={<Turnos />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="test-supabase" element={<TestSupabase />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas para trabajadores */}
        <Route path="/trabajador/*" element={
          <TrabajadorProvider>
            <Routes>
              <Route path="login" element={<LoginTrabajador />} />
              <Route path="turnos" element={<TurnosViewer />} />
            </Routes>
          </TrabajadorProvider>
        } />

        {/* Rutas de administración (requieren autenticación completa) */}
        <Route path="/*" element={
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        } />
      </Routes>
    </Router>
  )
}

export default App
