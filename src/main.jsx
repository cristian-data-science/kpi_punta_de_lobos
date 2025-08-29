import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import configService from './services/configService'

async function bootstrap() {
  // Intentar hidratar configuración desde snapshot compartido
  await configService.initFromSnapshot()
  // Empezar sincronización periódica cross-dispositivo
  configService.startSync(15000)

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
