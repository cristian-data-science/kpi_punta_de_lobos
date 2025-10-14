import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const Personas = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-600 mt-2">Gestión de personas registradas</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Agregar Persona
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Personas</CardTitle>
          <CardDescription>
            Administra el registro de personas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nombre, RUT o email..." 
                className="flex-1"
              />
            </div>
            
            <div className="border rounded-lg p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No hay personas registradas</p>
              <p className="text-sm mt-2">Comienza agregando la primera persona al sistema</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Personas
