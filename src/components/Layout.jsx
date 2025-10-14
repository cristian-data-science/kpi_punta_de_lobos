import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/50 to-cyan-100/60 relative overflow-hidden">
      {/* Subtle overlay pattern for depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/50 via-transparent to-teal-50/30 pointer-events-none"></div>
      
      {/* Radial gradient accents - top right */}
      <div 
        className="absolute -top-40 -right-40 w-96 h-96 opacity-40 pointer-events-none blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(103, 232, 249, 0.3) 0%, rgba(20, 184, 166, 0.2) 40%, transparent 70%)'
        }}
      ></div>
      
      {/* Radial gradient accents - bottom left */}
      <div 
        className="absolute -bottom-40 -left-40 w-96 h-96 opacity-40 pointer-events-none blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, rgba(103, 232, 249, 0.2) 40%, transparent 70%)'
        }}
      ></div>
      
      {/* Center subtle glow */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none blur-3xl"
        style={{
          background: 'radial-gradient(ellipse, rgba(20, 184, 166, 0.15) 0%, transparent 60%)'
        }}
      ></div>
      
      <div className="relative z-10">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-6" style={{ isolation: 'isolate' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
