import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Upload, 
  Users, 
  Truck, 
  Receipt,
  DollarSign, 
  Calendar,
  Settings,
  AlertTriangle,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import inconsistenciesService from '@/services/inconsistenciesService'

const Sidebar = ({ isOpen, onClose }) => {
  const [inconsistencyStats, setInconsistencyStats] = useState({ hasIssues: false, totalIssues: 0 })

  // Cargar estadísticas de inconsistencias
  useEffect(() => {
    const loadInconsistencyStats = async () => {
      try {
        const stats = await inconsistenciesService.getQuickStats()
        setInconsistencyStats(stats)
      } catch (error) {
        console.error('Error cargando estadísticas de inconsistencias:', error)
      }
    }

    loadInconsistencyStats()

    // Actualizar cada 30 segundos cuando el sidebar está abierto
    const interval = setInterval(loadInconsistencyStats, 30000)

    // Escuchar cambios en localStorage para las inconsistencias
    const handleStorageChange = (e) => {
      if (e.key === 'transapp_inconsistencies' || e.key === null) {
        loadInconsistencyStats()
      }
    }

    // Agregar listener para cambios en localStorage
    window.addEventListener('storage', handleStorageChange)
    
    // También escuchar cambios dentro de la misma pestaña
    const handleCustomEvent = () => {
      loadInconsistencyStats()
    }
    window.addEventListener('inconsistencies-updated', handleCustomEvent)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('inconsistencies-updated', handleCustomEvent)
    }
  }, [isOpen])

  const menuItems = [
    { 
      path: '/', 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      description: 'Panel principal'
    },
    { 
      path: '/upload', 
      icon: Upload, 
      label: 'Cargar Archivos',
      description: 'Importar datos'
    },
    { 
      path: '/workers', 
      icon: Users, 
      label: 'Trabajadores',
      description: 'Gestión de personal'
    },
    { 
      path: '/vehicles', 
      icon: Truck, 
      label: 'Vehículos',
      description: 'Flota de camiones'
    },
    { 
      path: '/cobros', 
      icon: Receipt, 
      label: 'Cobros',
      description: 'Facturación de servicios'
    },
    { 
      path: '/payments', 
      icon: DollarSign, 
      label: 'Pagos',
      description: 'Control de pagos'
    },
    { 
      path: '/inconsistencies', 
      icon: AlertTriangle, 
      label: 'Inconsistencias',
      description: 'Errores en archivos'
    },
    { 
      path: '/calendar', 
      icon: Calendar, 
      label: 'Calendario',
      description: 'Turnos y tarifas'
    },
    { 
      path: '/settings', 
      icon: Settings, 
      label: 'Configuración',
      description: 'Ajustes del sistema'
    }
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-2 mt-16 lg:mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) => `
                  flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200
                  ${isActive 
                    ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600'
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.label}</p>
                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                </div>
                {item.path === '/inconsistencies' && inconsistencyStats.hasIssues && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {inconsistencyStats.totalIssues > 99 ? '99+' : inconsistencyStats.totalIssues}
                    </span>
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-orange-900">Sistema de Transporte</p>
            <p className="text-xs text-orange-700">Gestión de Flota</p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
