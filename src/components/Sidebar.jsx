import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Upload, 
  Users, 
  Truck, 
  Route,
  DollarSign, 
  Calendar,
  Settings,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const Sidebar = ({ isOpen, onClose }) => {
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
      path: '/routes', 
      icon: Route, 
      label: 'Rutas',
      description: 'Gestión de rutas'
    },
    { 
      path: '/payments', 
      icon: DollarSign, 
      label: 'Pagos',
      description: 'Control de pagos'
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
