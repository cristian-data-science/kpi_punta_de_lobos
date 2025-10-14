import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import './Login.css'

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { 
    login, 
    loginAttempts, 
    isLocked, 
    remainingAttempts, 
    maxAttempts, 
    isLimitEnabled 
  } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = login(credentials.username, credentials.password)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="login-page">
      {/* Reflejos de luz en el agua */}
      <div className="water-shimmer"></div>

      {/* Paisaje de Punta de Lobos - Montañas/Quebradas */}
      <div className="mountain-back"></div>
      <div className="mountain-mid"></div>
      <div className="mountain-front"></div>

      {/* Rocas dispersas */}
      <div className="rock" style={{ bottom: '24%', left: '18%', width: '40px', height: '25px', animationDelay: '0.5s' }}></div>
      <div className="rock" style={{ bottom: '26%', right: '25%', width: '35px', height: '22px', animationDelay: '1.2s' }}></div>
      <div className="rock" style={{ bottom: '23%', left: '45%', width: '30px', height: '20px', animationDelay: '2s' }}></div>
      <div className="rock" style={{ bottom: '28%', right: '50%', width: '38px', height: '24px', animationDelay: '0.8s' }}></div>
      <div className="rock" style={{ bottom: '25%', left: '60%', width: '32px', height: '21px', animationDelay: '1.8s' }}></div>

      {/* Olas de fondo - múltiples capas para efecto realista */}
      <div className="wave"></div>
      <div className="wave2"></div>
      <div className="wave3"></div>
      <div className="wave4"></div>
      <div className="wave-top"></div>

      {/* Burbujas mejoradas - más variadas */}
      {[
        { left: '10%', size: '35px', delay: '0s' },
        { left: '25%', size: '25px', delay: '1.2s' },
        { left: '40%', size: '40px', delay: '2.3s' },
        { left: '60%', size: '30px', delay: '1.7s' },
        { left: '75%', size: '32px', delay: '0.9s' },
        { left: '85%', size: '28px', delay: '2.8s' },
        { left: '5%', size: '22px', delay: '3.5s' },
        { left: '50%', size: '38px', delay: '1.5s' },
        { left: '15%', size: '26px', delay: '4s' },
        { left: '65%', size: '34px', delay: '2.1s' },
        { left: '90%', size: '29px', delay: '3.2s' },
        { left: '35%', size: '24px', delay: '0.6s' }
      ].map((bubble, i) => (
        <div 
          key={`bubble-${i}`}
          className="bubble" 
          style={{ 
            left: bubble.left, 
            width: bubble.size, 
            height: bubble.size, 
            animationDelay: bubble.delay 
          }}
        ></div>
      ))}

      {/* Espuma del mar */}
      {[
        { bottom: '5%', left: '12%', width: '60px', height: '30px', delay: '0s' },
        { bottom: '8%', left: '45%', width: '80px', height: '35px', delay: '1.5s' },
        { bottom: '6%', left: '78%', width: '70px', height: '32px', delay: '2.8s' },
        { bottom: '10%', left: '25%', width: '55px', height: '28px', delay: '1s' },
        { bottom: '7%', left: '60%', width: '65px', height: '30px', delay: '3.5s' },
        { bottom: '9%', left: '88%', width: '75px', height: '33px', delay: '2.2s' },
        { bottom: '5%', left: '5%', width: '50px', height: '25px', delay: '0.8s' },
        { bottom: '11%', left: '35%', width: '68px', height: '31px', delay: '1.8s' }
      ].map((foam, i) => (
        <div 
          key={`foam-${i}`}
          className="foam" 
          style={{ 
            bottom: foam.bottom,
            left: foam.left, 
            width: foam.width, 
            height: foam.height, 
            animationDelay: foam.delay 
          }}
        ></div>
      ))}

      {/* Contenedor del login */}
      <div className="login-container">
        <div className="login-header">
          {/* Logo SVG animado */}
          <div className="logo-container">
            <svg className="logo-svg" xmlns="http://www.w3.org/2000/svg" version="1.0" width="480" height="240" viewBox="0 0 240.000000 120.000000" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="holographicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'rgb(0, 255, 255)', stopOpacity: 1 }}>
                    <animate attributeName="stop-color" values="rgb(0,255,255); rgb(255,0,255); rgb(0,255,255)" dur="3s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="25%" style={{ stopColor: 'rgb(128, 0, 255)', stopOpacity: 1 }}>
                    <animate attributeName="stop-color" values="rgb(128,0,255); rgb(0,255,128); rgb(128,0,255)" dur="3s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="50%" style={{ stopColor: 'rgb(255, 0, 255)', stopOpacity: 1 }}>
                    <animate attributeName="stop-color" values="rgb(255,0,255); rgb(255,255,0); rgb(255,0,255)" dur="3s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="75%" style={{ stopColor: 'rgb(0, 128, 255)', stopOpacity: 1 }}>
                    <animate attributeName="stop-color" values="rgb(0,128,255); rgb(255,128,0); rgb(0,128,255)" dur="3s" repeatCount="indefinite"/>
                  </stop>
                  <stop offset="100%" style={{ stopColor: 'rgb(0, 255, 255)', stopOpacity: 1 }}>
                    <animate attributeName="stop-color" values="rgb(0,255,255); rgb(255,0,255); rgb(0,255,255)" dur="3s" repeatCount="indefinite"/>
                  </stop>
                </linearGradient>
              </defs>
              <g transform="translate(0.000000,120.000000) scale(0.100000,-0.100000)">
                <path d="M991 1138 c-54 -15 -79 -37 -96 -82 -14 -36 -15 -55 -6 -120 6 -43 11 -101 11 -130 0 -29 9 -88 20 -131 25 -96 25 -117 2 -138 -28 -25 -60 -21 -93 13 -29 29 -30 31 -27 118 3 83 1 91 -24 128 -33 47 -33 52 -11 113 14 41 14 50 2 76 -21 45 -71 72 -175 96 -168 39 -332 12 -368 -60 -15 -30 -8 -162 14 -268 25 -120 -25 -240 -119 -284 -52 -25 -64 -39 -33 -39 33 0 121 60 150 103 54 77 65 164 35 270 -13 48 -14 65 -5 91 16 43 15 62 -3 90 -15 22 -14 26 9 52 23 27 30 29 114 32 97 4 229 -16 287 -44 44 -21 59 -46 51 -90 -3 -19 -9 -49 -12 -66 -4 -24 2 -46 21 -82 22 -42 25 -59 24 -133 -2 -84 -2 -84 33 -120 65 -65 166 -51 181 24 3 16 -3 69 -15 118 -12 56 -18 108 -14 137 3 27 -2 83 -10 125 -18 94 -12 124 29 159 31 26 34 26 137 22 175 -8 226 -44 201 -142 -19 -75 -14 -119 15 -147 25 -23 25 -27 19 -106 l-7 -81 29 -16 c18 -9 42 -38 62 -75 38 -72 72 -101 117 -101 44 0 43 13 0 28 -28 10 -40 25 -68 80 -19 39 -43 72 -57 79 -36 17 -40 30 -36 122 4 82 6 87 35 112 63 54 127 81 189 81 64 0 91 -10 134 -51 27 -24 57 -71 57 -87 0 -4 -12 4 -27 18 -59 57 -112 55 -156 -4 -46 -62 -16 -165 77 -265 97 -105 189 -135 452 -148 134 -7 184 -3 184 14 0 5 -73 11 -162 14 -199 6 -286 25 -365 76 -119 77 -192 217 -153 292 11 19 54 26 76 11 6 -4 21 -26 33 -49 25 -51 55 -70 78 -52 24 20 12 99 -23 156 -67 109 -185 137 -314 77 -36 -17 -82 -45 -102 -63 -20 -17 -41 -31 -47 -31 -20 0 -23 50 -6 114 20 72 12 103 -35 138 -48 34 -227 50 -309 26z"/>
                <path d="M861 358 c1 -29 3 -46 6 -36 2 9 15 19 29 22 48 12 38 66 -12 66 -22 0 -24 -4 -23 -52z m49 17 c0 -8 -9 -15 -20 -15 -11 0 -20 7 -20 15 0 8 9 15 20 15 11 0 20 -7 20 -15z"/>
                <path d="M982 373 c-25 -47 -29 -79 -8 -50 17 22 42 22 55 0 20 -37 18 -6 -3 42 l-23 50 -21 -42z m24 -20 c-10 -10 -19 5 -10 18 6 11 8 11 12 0 2 -7 1 -15 -2 -18z"/>
                <path d="M1087 403 c-11 -10 -8 -81 3 -88 6 -3 10 1 10 9 0 20 29 21 36 1 4 -8 10 -15 16 -15 5 0 5 6 0 17 -7 11 -6 23 1 34 8 13 7 21 -2 33 -14 16 -52 22 -64 9z m53 -28 c0 -8 -9 -15 -20 -15 -11 0 -20 7 -20 15 0 8 9 15 20 15 11 0 20 -7 20 -15z"/>
                <path d="M1217 392 c-10 -10 -17 -25 -17 -34 0 -23 32 -47 61 -45 21 2 26 7 27 34 3 32 -19 63 -42 63 -7 0 -20 -8 -29 -18z m57 -18 c7 -19 -10 -44 -31 -44 -17 0 -27 24 -19 45 7 20 42 19 50 -1z"/>
                <path d="M1344 371 c2 -83 68 -84 74 -2 2 29 0 41 -7 36 -6 -3 -11 -22 -11 -41 0 -31 -3 -35 -22 -32 -18 2 -24 12 -29 43 l-7 40 2 -44z"/>
                <path d="M1477 403 c-4 -3 -7 -26 -7 -50 0 -43 0 -43 35 -43 19 0 35 5 35 10 0 6 -11 10 -25 10 -14 0 -25 5 -25 10 0 6 9 10 20 10 11 0 20 5 20 10 0 6 -9 10 -20 10 -11 0 -20 5 -20 10 0 6 12 10 26 10 14 0 23 4 19 10 -7 11 -48 14 -58 3z"/>
                <path d="M60 340 c0 -6 120 -10 340 -10 220 0 340 4 340 10 0 6 -120 10 -340 10 -220 0 -340 -4 -340 -10z"/>
                <path d="M1660 340 c0 -6 120 -10 340 -10 220 0 340 4 340 10 0 6 -120 10 -340 10 -220 0 -340 -4 -340 -10z"/>
                <path d="M1642 235 c-38 -17 -66 -71 -56 -110 11 -43 52 -75 96 -75 103 0 136 140 43 185 -39 18 -41 18 -83 0z m73 -90 c0 -38 -2 -40 -30 -40 -23 0 -32 6 -39 27 -12 35 7 60 43 56 23 -3 26 -7 26 -43z"/>
                <path d="M2053 243 c-35 -7 -73 -59 -73 -100 0 -73 91 -119 155 -77 61 40 49 141 -19 169 -20 8 -37 14 -38 14 -2 -1 -13 -4 -25 -6z m57 -69 c10 -11 11 -23 4 -42 -7 -21 -16 -27 -39 -27 -25 0 -30 4 -33 28 -2 16 -1 35 2 43 7 19 50 18 66 -2z"/>
                <path d="M2235 240 c-31 -12 -47 -36 -43 -66 3 -28 12 -36 63 -56 27 -11 28 -12 8 -15 -12 -3 -31 0 -41 6 -16 8 -21 6 -30 -15 -11 -22 -9 -26 14 -34 73 -28 139 0 132 57 -2 22 -13 33 -48 51 l-45 23 37 -5 c26 -3 38 0 42 11 10 25 7 31 -25 42 -36 13 -37 13 -64 1z"/>
                <path d="M60 145 l0 -95 30 0 c27 0 30 3 30 30 0 26 4 30 28 30 56 0 85 68 47 110 -14 16 -31 20 -77 20 l-58 0 0 -95z m100 30 c0 -8 -9 -15 -20 -15 -11 0 -20 7 -20 15 0 8 9 15 20 15 11 0 20 -7 20 -15z"/>
                <path d="M232 164 c3 -65 7 -79 27 -95 23 -19 74 -25 106 -13 27 11 45 60 45 124 0 60 0 60 -30 60 -29 0 -29 0 -32 -67 -3 -65 -4 -68 -28 -68 -24 0 -25 3 -28 68 l-3 67 -31 0 -30 0 4 -76z"/>
                <path d="M430 145 l0 -95 30 0 c29 0 30 2 30 43 l1 42 37 -43 c23 -26 45 -42 60 -42 21 0 22 3 22 95 l0 95 -29 0 c-28 0 -30 -3 -33 -41 l-3 -41 -30 41 c-22 30 -37 41 -57 41 l-28 0 0 -95z"/>
                <path d="M622 218 c2 -17 11 -24 31 -26 27 -3 27 -4 27 -73 l0 -69 30 0 30 0 0 70 c0 68 1 70 25 70 20 0 25 5 25 25 0 25 -1 25 -86 25 -83 0 -85 -1 -82 -22z"/>
                <path d="M832 164 c3 -65 7 -79 27 -95 23 -19 74 -25 106 -13 27 11 45 60 45 124 0 60 0 60 -30 60 -29 0 -29 0 -32 -67 -3 -65 -4 -68 -28 -68 -24 0 -25 3 -28 68 l-3 67 -31 0 -30 0 4 -76z"/>
                <path d="M1032 164 c3 -65 7 -79 27 -95 23 -19 74 -25 106 -13 27 11 45 60 45 124 0 60 0 60 -30 60 -29 0 -29 0 -32 -67 -3 -65 -4 -68 -28 -68 -24 0 -25 3 -28 68 l-3 67 -31 0 -30 0 4 -76z"/>
              </g>
            </svg>
          </div>
          
          <h1>Bienvenido de vuelta</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} id="loginForm">
          <div className="form-group">
            <label htmlFor="username">Correo Electrónico o Usuario</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              placeholder="tu@email.com"
              value={credentials.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"}
                id="password" 
                name="password" 
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Mensajes de error y estado */}
          {error && (
            <div className={`alert ${isLocked ? 'alert-locked' : 'alert-error'}`}>
              {error}
            </div>
          )}

          {isLimitEnabled && !isLocked && loginAttempts > 0 && !error && (
            <div className="alert alert-warning">
              {remainingAttempts === 1 
                ? `⚠️ Último intento disponible antes del bloqueo` 
                : `Intentos restantes: ${remainingAttempts} de ${maxAttempts}`}
            </div>
          )}

          {isLimitEnabled && loginAttempts === 0 && !error && (
            <div className="security-info">
              Sistema de seguridad activo: máximo {maxAttempts} intentos permitidos
            </div>
          )}

          <div className="remember-forgot">
            <label>
              <input 
                type="checkbox" 
                name="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              /> Recordarme
            </label>
            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" className="btn-login" disabled={loading || isLocked}>
            {loading ? 'Ingresando...' : isLocked ? '🔒 Usuario Bloqueado' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="signup-link">
          ¿No tienes cuenta? <a href="#">Regístrate aquí</a>
        </div>
      </div>
    </div>
  )
}

export default Login
