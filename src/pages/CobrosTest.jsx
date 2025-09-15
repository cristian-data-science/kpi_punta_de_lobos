import { useState, useEffect } from 'react'
import cobrosSupabaseService from '../services/cobrosSupabaseService'

const CobrosTest = () => {
  const [loading, setLoading] = useState(false)
  const [availableWeeks, setAvailableWeeks] = useState([])

  useEffect(() => {
    loadAvailableWeeks()
  }, [])

  const loadAvailableWeeks = async () => {
    try {
      console.log('🔄 Cargando semanas disponibles...')
      const weeks = await cobrosSupabaseService.getAvailableWeeksFromSupabase()
      setAvailableWeeks(weeks)
      console.log('✅ Semanas cargadas:', weeks.length)
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  return (
    <div>
      <h1>Cobros Test</h1>
      <p>Semanas disponibles: {availableWeeks.length}</p>
    </div>
  )
}

export default CobrosTest