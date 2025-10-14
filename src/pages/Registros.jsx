import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Registros = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registros</h1>
          <p className="text-gray-600 mt-2">Historial de actividades y eventos</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Registro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividades Recientes</CardTitle>
          <CardDescription>
            Registro cronológico de actividades en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No hay registros disponibles</p>
            <p className="text-sm mt-2">Los registros de actividades aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Registros
