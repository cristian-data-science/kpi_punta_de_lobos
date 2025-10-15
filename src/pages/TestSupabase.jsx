// 🧪 Página de Prueba de Supabase
// Página temporal para probar la conexión a Supabase

import { useState } from 'react'
import SupabaseConnectionTest from '@/components/SupabaseConnectionTest'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createPersona, searchPersonas } from '@/services/supabaseHelpers'
import { UserPlus, Search, Database } from 'lucide-react'

const TestSupabase = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    tipo: 'visitante'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleCreatePersona = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await createPersona(formData)
      
      if (error) {
        setMessage({ type: 'error', text: `Error: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: '✅ Persona creada exitosamente' })
        // Limpiar formulario
        setFormData({
          nombre: '',
          rut: '',
          email: '',
          telefono: '',
          tipo: 'visitante'
        })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const { data, error } = await searchPersonas(searchTerm)
      
      if (error) {
        setMessage({ type: 'error', text: `Error: ${error.message}` })
        setSearchResults([])
      } else {
        setSearchResults(data || [])
        setMessage(null)
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Prueba de Conexión Supabase
        </h1>
        <p className="text-muted-foreground mt-2">
          Página de prueba para verificar y probar la conexión con Supabase
        </p>
      </div>

      {/* Test de Conexión */}
      <SupabaseConnectionTest />

      {/* Crear Persona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Crear Nueva Persona
          </CardTitle>
          <CardDescription>
            Prueba crear un registro en la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePersona} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Juan Pérez"
                />
              </div>
              
              <div>
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  placeholder="12345678-9"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+56912345678"
                />
              </div>
              
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="visitante">Visitante</option>
                  <option value="guia">Guía</option>
                  <option value="staff">Staff</option>
                  <option value="instructor">Instructor</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Persona'}
            </Button>
          </form>

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mt-4">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Buscar Personas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Personas
          </CardTitle>
          <CardDescription>
            Busca por nombre o RUT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Buscar por nombre o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">
                {searchResults.length} resultado(s) encontrado(s):
              </div>
              {searchResults.map((persona) => (
                <div key={persona.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{persona.nombre}</div>
                  <div className="text-sm text-muted-foreground">
                    {persona.rut && `RUT: ${persona.rut} • `}
                    {persona.tipo && `Tipo: ${persona.tipo}`}
                    {persona.email && ` • ${persona.email}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !loading && (
            <div className="text-center text-muted-foreground py-4">
              No se encontraron resultados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Documentación</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Archivos importantes:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><code>services/supabaseClient.js</code> - Cliente Supabase (singleton)</li>
            <li><code>services/supabaseHelpers.js</code> - Funciones auxiliares para BD</li>
            <li><code>components/SupabaseConnectionTest.jsx</code> - Este componente de prueba</li>
            <li><code>sql/puntadelobos_setup.sql</code> - Script SQL para crear tablas</li>
          </ul>
          
          <p className="mt-4">
            <strong>Documentación completa:</strong> <code>SETUP_SUPABASE_RAPIDO.md</code>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default TestSupabase
