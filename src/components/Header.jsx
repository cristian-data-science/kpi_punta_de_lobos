import { Menu, Bell, User, Waves, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

const Header = ({ onMenuClick }) => {
  const { logout } = useAuth()

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout()
    }
  }

  return (
    <header className="relative bg-gradient-to-r from-white via-teal-50/40 to-cyan-50/50 shadow-lg border-b-2 border-gradient-to-r border-teal-200/60 sticky top-0 z-50 backdrop-blur-md">
      {/* Subtle overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-teal-50/10 pointer-events-none"></div>
      
      <div className="relative flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden hover:bg-gradient-to-br hover:from-teal-100 hover:to-cyan-100 transition-all duration-200"
          >
            <Menu className="h-5 w-5 text-teal-700" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 p-2 rounded-xl shadow-lg ring-2 ring-teal-200/60 ring-offset-2">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-xl pointer-events-none"></div>
              <Waves className="h-6 w-6 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 bg-clip-text text-transparent drop-shadow-sm">
                Punta de Lobos
              </h1>
              <p className="text-sm bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
                Sistema de Gestión de Personas
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="relative hover:bg-gradient-to-br hover:from-teal-100 hover:to-cyan-100 transition-all duration-200">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 via-red-600 to-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center shadow-md ring-2 ring-red-200/50 animate-pulse">
              2
            </span>
          </Button>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100/50 rounded-lg border border-teal-200/60 shadow-sm">
            <div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-1 rounded-md">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">admin</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-gradient-to-br hover:from-red-50 hover:to-orange-50 transition-all duration-200"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header
