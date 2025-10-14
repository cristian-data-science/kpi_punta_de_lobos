import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList,
  BarChart3,
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
      path: '/personas', 
      icon: Users, 
      label: 'Personas',
      description: 'Gestión de personas'
    },
    { 
      path: '/registros', 
      icon: ClipboardList, 
      label: 'Registros',
      description: 'Historial de actividades'
    },
    { 
      path: '/reportes', 
      icon: BarChart3, 
      label: 'Reportes',
      description: 'Análisis y estadísticas'
    },
    { 
      path: '/configuracion', 
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
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 lg:hidden transition-opacity duration-150"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-0 lg:border-r-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ isolation: 'isolate' }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-2 mt-16 lg:mt-4 h-full overflow-y-auto pb-24">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) => `
                  flex items-center space-x-3 p-3 rounded-lg transition-none
                  ${isActive 
                    ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600' 
                    : 'text-gray-700'
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
          <div className="bg-teal-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-teal-900">🌊 Punta de Lobos</p>
            <p className="text-xs text-teal-700">Gestión de Personas</p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
