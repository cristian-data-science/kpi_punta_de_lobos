import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList,
  BarChart3,
  Settings,
  X,
  Waves,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { 
      path: '/', 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      description: 'Panel principal',
      color: 'from-teal-500 to-cyan-500'
    },
    { 
      path: '/personas', 
      icon: Users, 
      label: 'Personas',
      description: 'Gestión de personas',
      color: 'from-blue-500 to-indigo-500'
    },
    { 
      path: '/turnos', 
      icon: Clock, 
      label: 'Turnos',
      description: 'Gestión de turnos',
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      path: '/registros', 
      icon: ClipboardList, 
      label: 'Registros',
      description: 'Historial de actividades',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      path: '/reportes', 
      icon: BarChart3, 
      label: 'Reportes',
      description: 'Análisis y estadísticas',
      color: 'from-orange-500 to-red-500'
    },
    { 
      path: '/configuracion', 
      icon: Settings, 
      label: 'Configuración',
      description: 'Ajustes del sistema',
      color: 'from-gray-500 to-slate-600'
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
        fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-white via-gray-50/50 to-white border-r border-gray-200 shadow-lg
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ isolation: 'isolate' }}>
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm lg:hidden">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-1.5 rounded-lg shadow-md">
              <Waves className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="p-3 space-y-1.5 mt-16 lg:mt-4 h-full overflow-y-auto pb-36">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isLastItem = index === menuItems.length - 1
            return (
              <div key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => onClose()}
                  className={({ isActive }) => `
                    group relative flex items-center space-x-3 p-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 shadow-sm' 
                      : 'text-gray-700 hover:bg-white hover:shadow-sm'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {/* Icon container with gradient background on active */}
                      <div className={`
                        relative p-2 rounded-lg transition-all duration-200
                        ${isActive 
                          ? `bg-gradient-to-br ${item.color} shadow-md` 
                          : `bg-gray-100 group-hover:bg-gradient-to-br group-hover:${item.color}`
                        }
                      `}>
                        <Icon className={`
                          h-5 w-5 flex-shrink-0 transition-all duration-200
                          ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-white'}
                        `} />
                      </div>
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{item.label}</p>
                        <p className={`
                          text-xs truncate transition-colors duration-200
                          ${isActive ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-600'}
                        `}>
                          {item.description}
                        </p>
                      </div>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-l-full" />
                      )}
                    </>
                  )}
                </NavLink>
                {/* Extra spacing after last item */}
                {isLastItem && <div className="h-4"></div>}
              </div>
            )
          })}
        </nav>
        
        {/* Footer card */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 p-4 rounded-xl shadow-lg">
            {/* Decorative wave pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,50 Q25,40 50,50 T100,50 L100,100 L0,100 Z" fill="white" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                  <Waves className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Punta de Lobos</p>
                  <p className="text-xs text-teal-100">Gestión de Personas</p>
                </div>
              </div>
              
              {/* Version badge */}
              <div className="flex items-center justify-between pt-2 border-t border-white/20">
                <span className="text-xs text-teal-100">0.01</span>
                <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white">
                  Beta
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
