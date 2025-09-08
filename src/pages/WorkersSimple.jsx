import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  UserX, 
  UserCheck, 
  Calendar,
  FileText,
  Phone,
  Save,
  X,
  RefreshCw
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const WorkersSimple = () => {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Conexión directa a Supabase
  const supabase = createClient(
    'https://csqxopqlgujduhmwxixo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXhvcHFsZ3VqZHVobXd4aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTQ5MzMsImV4cCI6MjA3MjkzMDkzM30.zUiZNsHWFBIqH4KMNSyTE-g68f_t-rpdnpt7VNJ5DSs'
  )

  // Cargar trabajadores directamente
  const loadWorkers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Cargando trabajadores directamente desde Supabase...')
      
      const { data, error: supabaseError } = await supabase
        .from('trabajadores')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (supabaseError) {
        throw supabaseError
      }
      
      console.log('✅ Datos cargados exitosamente:', data?.length || 0, 'trabajadores')
      console.log('📋 Datos completos:', data)
      
      setWorkers(data || [])
    } catch (err) {
      console.error('❌ Error cargando trabajadores:', err)
      setError(err.message)
      setWorkers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkers()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-lg text-gray-600">Cargando trabajadores desde Supabase...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">❌ Error de conexión</div>
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadWorkers} className="mt-4">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trabajadores (Conexión Directa)</h1>
          <p className="text-gray-600 mt-2">
            Probando conexión directa a Supabase PostgreSQL
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadWorkers} 
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
        </div>
      </div>

      {/* Stats básicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trabajadores</p>
                <p className="text-2xl font-bold text-gray-900">{workers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {workers.filter(w => w.estado === 'activo').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos Fijo</p>
                <p className="text-2xl font-bold text-blue-600">
                  {workers.filter(w => w.contrato === 'fijo').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista simple */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Trabajadores (Datos Directos)</CardTitle>
          <CardDescription>
            Conectado directamente a Supabase PostgreSQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No hay trabajadores
              </h3>
              <p className="mt-2 text-gray-500">
                No se encontraron trabajadores en la base de datos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">RUT</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Contrato</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr key={worker.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                        {worker.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {worker.nombre}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono">
                        {worker.rut}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          worker.contrato === 'fijo' 
                            ? 'bg-blue-100 text-blue-800'
                            : worker.contrato === 'planta'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {worker.contrato}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          worker.estado === 'activo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {worker.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {worker.telefono || <span className="italic text-gray-400">Sin teléfono</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default WorkersSimple
