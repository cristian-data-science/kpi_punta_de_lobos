import { useState, useEffect } from 'react'
import cobrosSupabaseService from '../services/cobrosSupabaseService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const Cobros = () => {
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cobros Simplificado</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Componente funcionando</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Cobros