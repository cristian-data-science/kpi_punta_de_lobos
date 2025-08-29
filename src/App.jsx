import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UploadFiles from './pages/UploadFiles'
import Workers from './pages/Workers'
import Vehicles from './pages/Vehicles'
import RoutesPage from './pages/Routes'
import Payments from './pages/Payments'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import { Truck } from 'lucide-react'
import './App.css'

// Componente interno que maneja la lógica de rutas
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth()

  console.log('AppRoutes: loading =', loading, 'isAuthenticated =', isAuthenticated)

  if (loading) {
    console.log('AppRoutes: Mostrando pantalla de carga')
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-orange-600 rounded-2xl shadow-2xl mb-4 animate-pulse">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">TransApp</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
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
        <Route path="upload" element={<UploadFiles />} />
        <Route path="workers" element={<Workers />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="payments" element={<Payments />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
