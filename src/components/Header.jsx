import { Menu, Bell, User, Waves, LogOut, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const Header = ({ onMenuClick }) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [showPatagoniaModal, setShowPatagoniaModal] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const fullMessage = `Desde Patagonia desarrollamos esta aplicación con mucho cariño para Fundación Punta de Lobos. Nació en la instancia KPI Colectivo, con tiempos acotados pero con foco en entregar valor desde ya.

Esta primera versión (maqueta funcional) apoya la administración de turnos, simplifica la gestión de personas y calcula remuneraciones según las horas efectivamente trabajadas en turnos completados.

Sabemos que esta aplicación tiene alcances definidos y espacio para crecer. Es por eso que incluimos documentación completa pensada tanto para el uso cotidiano como para que cualquier desarrollador/a pueda retomar este proyecto en el futuro, orientarse rápidamente y crear nuevos módulos o mejorar las lógicas ya existentes.

¡Gracias por la confianza y por permitirnos contribuir a su misión!

— Equipo Patagonia 🌊`

  useEffect(() => {
    if (showPatagoniaModal && !isTyping) {
      setIsTyping(true)
      setDisplayedText('')
      
      let currentIndex = 0
      const typingInterval = setInterval(() => {
        if (currentIndex < fullMessage.length) {
          setDisplayedText(fullMessage.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          setIsTyping(false)
          clearInterval(typingInterval)
        }
      }, 20) // Velocidad de escritura (20ms por carácter)

      return () => clearInterval(typingInterval)
    }
  }, [showPatagoniaModal])

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout()
    }
  }

  const handleGoToDocumentation = () => {
    setShowPatagoniaModal(false)
    navigate('/documentacion')
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPatagoniaModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100/50 rounded-lg border border-teal-200/60 shadow-sm hover:shadow-md hover:from-teal-100 hover:to-cyan-100 transition-all duration-200"
          >
            <div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-1 rounded-md">
              <Heart className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
              Mensaje Patagonia
            </span>
          </Button>
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

      {/* Modal Mensaje Patagonia */}
      <Dialog open={showPatagoniaModal} onOpenChange={setShowPatagoniaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
              <Heart className="w-6 h-6 text-teal-600" fill="currentColor" />
              Mensaje de Patagonia
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[300px]">
            {displayedText}
            {isTyping && <span className="inline-block w-2 h-5 bg-teal-600 animate-pulse ml-1"></span>}
          </div>

          {!isTyping && (
            <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
              <p className="text-sm text-gray-700 mb-3 font-medium">
                📚 Explora la documentación completa:
              </p>
              <Button 
                onClick={handleGoToDocumentation}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
              >
                Ir a Documentación
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  )
}

export default Header
