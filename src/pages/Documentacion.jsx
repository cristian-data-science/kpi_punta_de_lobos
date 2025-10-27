import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Users, 
  Clock, 
  DollarSign, 
  BarChart3, 
  Settings,
  FileText,
  Code2,
  Database,
  Cloud,
  ChevronRight,
  ChevronDown,
  Github,
  ExternalLink
} from 'lucide-react'

const Documentacion = () => {
  const [seccionActiva, setSeccionActiva] = useState('usuarios') // 'usuarios' o 'tecnica'
  const [moduloExpandido, setModuloExpandido] = useState(null)

  const toggleModulo = (modulo) => {
    setModuloExpandido(moduloExpandido === modulo ? null : modulo)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Documentación</h1>
                <p className="text-blue-100">Sistema KPI Punta de Lobos</p>
              </div>
            </div>
            
            {/* Enlace al Repositorio */}
            <a
              href="https://github.com/cristian-data-science/kpi_punta_de_lobos"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg transition-all duration-200 group border border-white/20"
            >
              <Github className="h-5 w-5" />
              <span className="font-medium hidden sm:inline">Ver Código del Proyecto</span>
              <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>

        {/* Selector de sección */}
        <div className="flex gap-4">
          <Button
            onClick={() => setSeccionActiva('usuarios')}
            variant={seccionActiva === 'usuarios' ? 'default' : 'outline'}
            className="flex-1 h-auto py-4 px-6"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Documentación de Usuarios</div>
                <div className="text-xs opacity-80">Guías paso a paso para usar la aplicación</div>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => setSeccionActiva('tecnica')}
            variant={seccionActiva === 'tecnica' ? 'default' : 'outline'}
            className="flex-1 h-auto py-4 px-6"
          >
            <div className="flex items-center gap-3">
              <Code2 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Documentación Técnica</div>
                <div className="text-xs opacity-80">Desarrollo, arquitectura y nuevos módulos</div>
              </div>
            </div>
          </Button>
        </div>

        {/* Contenido según sección activa */}
        {seccionActiva === 'usuarios' ? (
          <DocumentacionUsuarios moduloExpandido={moduloExpandido} toggleModulo={toggleModulo} />
        ) : (
          <DocumentacionTecnica moduloExpandido={moduloExpandido} toggleModulo={toggleModulo} />
        )}

      </div>
    </div>
  )
}

// ===== DOCUMENTACIÓN DE USUARIOS =====
const DocumentacionUsuarios = ({ moduloExpandido, toggleModulo }) => {
  const modulos = [
    {
      id: 'dashboard',
      icon: BarChart3,
      titulo: 'Dashboard',
      descripcion: 'Panel principal con resumen de información',
      color: 'from-teal-500 to-cyan-500',
      contenido: {
        queEs: 'El Dashboard es la pantalla principal que ves al entrar al sistema. Muestra un resumen general de toda la información importante de tu operación.',
        queHace: [
          'Muestra el total de personas registradas en el sistema',
          'Cuenta cuántos turnos tienes programados hoy, esta semana y este mes',
          'Muestra cuántas personas están activas actualmente',
          'Calcula estadísticas como turnos completados, cancelados y ausencias',
          'Muestra la tasa de asistencia (qué porcentaje de turnos se completaron)',
          'Lista los próximos turnos programados',
          'Muestra gráficos de evolución y tendencias'
        ],
        comoUsar: [
          'Al entrar al sistema, el Dashboard se carga automáticamente',
          'Puedes ver tarjetas con números grandes que resumen la información',
          'Desplázate hacia abajo para ver más detalles y gráficos',
          'Los números se actualizan automáticamente cuando hay cambios'
        ]
      }
    },
    {
      id: 'personas',
      icon: Users,
      titulo: 'Personas',
      descripcion: 'Gestión de personas que trabajan',
      color: 'from-blue-500 to-indigo-500',
      contenido: {
        queEs: 'El módulo de Personas te permite administrar toda la información de las personas que trabajan en tu operación.',
        queHace: [
          'Registrar nuevas personas con su nombre, RUT, email y teléfono',
          'Clasificar personas por tipo (visitante, trabajador, supervisor, etc.)',
          'Asignar tarifa por hora a cada persona',
          'Marcar personas como activas o inactivas',
          'Buscar personas por nombre o RUT',
          'Editar información de personas existentes',
          'Eliminar personas (solo si no tienen turnos asignados)',
          'Agregar notas o comentarios sobre cada persona'
        ],
        comoUsar: [
          'Para agregar una persona nueva: Haz clic en "Agregar Persona"',
          'Completa todos los campos obligatorios (nombre, RUT, tipo)',
          'Opcionalmente agrega email, teléfono y tarifa por hora',
          'Para buscar: Escribe el nombre o RUT en el cuadro de búsqueda',
          'Para editar: Haz clic en el botón "Editar" de la persona',
          'Para eliminar: Haz clic en "Eliminar" (solo si no tiene turnos)'
        ]
      }
    },
    {
      id: 'turnos',
      icon: Clock,
      titulo: 'Turnos',
      descripcion: 'Gestión y programación de turnos',
      color: 'from-emerald-500 to-teal-500',
      contenido: {
        queEs: 'El módulo de Turnos te permite programar, visualizar y gestionar los horarios de trabajo de las personas.',
        queHace: [
          'Ver turnos en formato calendario (vista semanal)',
          'Programar nuevos turnos asignando persona, fecha y horario',
          'Definir ubicación del turno (Playa, Estacionamiento, etc.)',
          'Asignar tipo de turno según la función',
          'Marcar turnos como completados, cancelados o ausentes',
          'Ver estado de cada turno con colores (verde=completado, amarillo=programado)',
          'Exportar turnos del mes a Excel',
          'Compartir link para que trabajadores vean sus turnos',
          'Agregar observaciones a cada turno'
        ],
        comoUsar: [
          'Para crear un turno: Haz clic en "Nuevo Turno"',
          'Selecciona la fecha, persona, horario y ubicación',
          'Guarda el turno y aparecerá en el calendario',
          'Para cambiar estado: Haz clic en el turno y selecciona el nuevo estado',
          'Para exportar: Haz clic en "Exportar Mes" (crea archivo Excel)',
          'Para compartir link: Haz clic en "Link Trabajadores" (se copia automáticamente)'
        ]
      }
    },
    {
      id: 'pagos',
      icon: DollarSign,
      titulo: 'Pagos',
      descripcion: 'Gestión de pagos a trabajadores',
      color: 'from-green-500 to-emerald-600',
      contenido: {
        queEs: 'El módulo de Pagos te permite gestionar los pagos que debes realizar a cada persona según sus turnos trabajados.',
        queHace: [
          'Calcula automáticamente cuánto debes pagar a cada persona',
          'Multiplica las horas trabajadas por la tarifa por hora',
          'Muestra el total a pagar por persona',
          'Lista todos los turnos que generan ese pago',
          'Permite marcar turnos como "pagados"',
          'Filtra pagos por mes y año',
          'Muestra historial de pagos realizados'
        ],
        comoUsar: [
          'Selecciona el mes y año que quieres revisar',
          'El sistema calcula automáticamente los montos',
          'Revisa el detalle de cada persona',
          'Cuando pagues, marca los turnos como "pagados"',
          'Puedes filtrar para ver solo pagos pendientes o completados'
        ]
      }
    },
    {
      id: 'reportes',
      icon: BarChart3,
      titulo: 'Reportes',
      descripcion: 'Análisis y estadísticas visuales',
      color: 'from-orange-500 to-red-500',
      contenido: {
        queEs: 'El módulo de Reportes te muestra análisis visuales de tu operación con gráficos y la opción de exportar datos a Excel.',
        queHace: [
          'Muestra gráfico de las 10 personas con más turnos completados',
          'Gráfico de distribución de turnos por tipo',
          'Gráfico de turnos por estado (completados, programados, cancelados)',
          'Distribución de turnos por ubicación',
          'Evolución de turnos en los últimos 30 días',
          'Promedio de horas trabajadas por tipo de persona',
          'Exportar base de datos de personas a Excel',
          'Exportar registro completo de turnos a Excel',
          'Exportar análisis combinado (personas + turnos) a Excel'
        ],
        comoUsar: [
          'Los gráficos se cargan automáticamente al entrar',
          'Puedes pasar el mouse sobre los gráficos para ver detalles',
          'Para exportar personas: Haz clic en "Base de Datos de Personas"',
          'Para exportar turnos: Haz clic en "Registro de Turnos Completo"',
          'Para exportar análisis: Haz clic en "Análisis Combinado" (2 hojas: resumen + detalle)'
        ]
      }
    },
    {
      id: 'configuracion',
      icon: Settings,
      titulo: 'Configuración',
      descripcion: 'Ajustes del sistema',
      color: 'from-gray-500 to-slate-600',
      contenido: {
        queEs: 'El módulo de Configuración te permite ajustar parámetros del sistema y gestionar tu sesión.',
        queHace: [
          'Permite cerrar sesión de forma segura',
          'Muestra información del usuario actual',
          'Permite configurar preferencias del sistema',
          'Gestiona ajustes generales de la aplicación'
        ],
        comoUsar: [
          'Accede desde el menú lateral',
          'Revisa los ajustes disponibles',
          'Modifica lo que necesites',
          'Para cerrar sesión: usa el botón "Cerrar Sesión"'
        ]
      }
    }
  ]

  return (
    <div className="space-y-6">
      
      {/* Información sobre la plataforma */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            Plataforma y Hosting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-base mb-2">🗄️ Base de Datos: Supabase</h4>
            <p className="text-sm text-gray-600 mb-3">
              Toda tu información (personas, turnos, pagos) se guarda en Supabase, un servicio en la nube gratuito. 
              Tus datos están seguros, respaldados automáticamente y disponibles desde cualquier dispositivo con internet.
            </p>
            <a 
              href="https://supabase.com/pricing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              Ver capa gratuita de Supabase →
            </a>
          </div>
          <div>
            <h4 className="font-semibold text-base mb-2">☁️ Hosting: Vercel</h4>
            <p className="text-sm text-gray-600 mb-3">
              La aplicación está alojada en Vercel, una plataforma gratuita de hosting web. 
              Esto significa que puedes acceder al sistema desde cualquier navegador sin instalar nada. 
              Las actualizaciones se despliegan automáticamente.
            </p>
            <a 
              href="https://vercel.com/pricing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              Ver capa gratuita de Vercel →
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Lista de módulos */}
      {modulos.map((modulo) => (
        <Card key={modulo.id} className={`overflow-hidden ${moduloExpandido === modulo.id ? `bg-gradient-to-br ${modulo.color}` : ''} ${moduloExpandido !== modulo.id ? 'p-0' : ''}`}>
          <CardHeader 
            className={`bg-gradient-to-r ${modulo.color} text-white cursor-pointer ${moduloExpandido !== modulo.id ? 'm-0' : ''}`}
            onClick={() => toggleModulo(modulo.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <modulo.icon className="h-6 w-6" />
                <div>
                  <CardTitle>{modulo.titulo}</CardTitle>
                  <CardDescription className="text-white/80">{modulo.descripcion}</CardDescription>
                </div>
              </div>
              {moduloExpandido === modulo.id ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          
          {moduloExpandido === modulo.id && (
            <CardContent className="pt-6 space-y-4 bg-white/95 backdrop-blur-sm">
              <div>
                <h3 className="font-semibold text-base mb-2">¿Qué es?</h3>
                <p className="text-sm text-gray-600">{modulo.contenido.queEs}</p>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-2">¿Qué hace?</h3>
                <ul className="space-y-2">
                  {modulo.contenido.queHace.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      </div>
                      <span className="text-sm text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-2">¿Cómo usar?</h3>
                <ol className="space-y-2">
                  {modulo.contenido.comoUsar.map((paso, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="bg-green-100 text-green-700 font-semibold rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-sm text-gray-600 pt-0.5">{paso}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}

// ===== DOCUMENTACIÓN TÉCNICA =====
const DocumentacionTecnica = ({ moduloExpandido, toggleModulo }) => {
  const modulosTecnicos = [
    {
      id: 'arquitectura',
      icon: Database,
      titulo: 'Arquitectura del Sistema',
      descripcion: 'Stack tecnológico y estructura general',
      color: 'from-purple-500 to-pink-500',
      contenido: {
        stack: [
          'React 19.1.1 - Framework frontend',
          'Vite 6.3.5 - Build tool y dev server',
          'Supabase - PostgreSQL backend (capa gratuita: 500MB DB, 50K usuarios)',
          'Vercel - Hosting y deployment (capa gratuita: builds ilimitados, 100GB bandwidth/mes)',
          'Tailwind CSS 4.1.7 - Styling',
          'Radix UI - Componentes base accesibles',
          'ExcelJS 4.4.0 - Exportación de datos',
          'React ECharts - Visualizaciones de datos',
          'React Router DOM 7.5.0 - Routing'
        ],
        estructura: [
          'src/pages/ - Componentes de página (Dashboard, Personas, Turnos, etc.)',
          'src/components/ - Componentes reutilizables y UI',
          'src/services/ - Lógica de negocio y llamadas a Supabase',
          'src/contexts/ - Contextos de React (Auth, Trabajador)',
          'src/utils/ - Funciones auxiliares',
          'src/hooks/ - Custom hooks',
          'sql/ - Scripts SQL para setup de base de datos'
        ],
        deployment: [
          'Build: pnpm build (genera carpeta dist/)',
          'Deploy: Automático vía Vercel al hacer push a master',
          'Variables de entorno: Configuradas en Vercel dashboard',
          'Supabase: Row Level Security (RLS) activado para seguridad'
        ]
      }
    },
    {
      id: 'supabase',
      icon: Database,
      titulo: 'Base de Datos Supabase',
      descripcion: 'Estructura y configuración de PostgreSQL',
      color: 'from-green-500 to-emerald-500',
      contenido: {
        tablas: [
          'personas - Información de trabajadores/visitantes (nombre, RUT, email, tipo, tarifa_hora, estado)',
          'turnos - Registro de turnos programados y completados (persona_id FK, fecha, hora_inicio, hora_fin, tipo_turno, ubicacion, estado)',
          'pagos - Registro de pagos realizados (persona_id FK, mes, anio, monto_calculado, monto_pagado, estado)'
        ],
        conexion: [
          'Cliente: @supabase/supabase-js',
          'Variables de entorno: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY',
          'Servicio centralizado: src/services/supabaseClient.js (singleton pattern)',
          'Helpers: src/services/supabaseHelpers.js (CRUD operations)'
        ],
        capaGratuita: [
          '500 MB de almacenamiento en base de datos',
          '50,000 usuarios activos mensuales',
          '1 GB de almacenamiento de archivos',
          '2 GB de transferencia de datos',
          'Sin límite de proyectos',
          'Row Level Security incluido',
          'Backups automáticos diarios'
        ]
      }
    },
    {
      id: 'vercel',
      icon: Cloud,
      titulo: 'Deployment en Vercel',
      descripcion: 'Configuración de hosting y CI/CD',
      color: 'from-blue-500 to-cyan-500',
      contenido: {
        configuracion: [
          'Framework: Vite (detección automática)',
          'Build Command: pnpm build',
          'Output Directory: dist',
          'Install Command: pnpm install',
          'Node Version: 18.x (configurado en package.json)'
        ],
        deployment: [
          'Git Integration: Push a master → Deploy automático',
          'Preview Deployments: Cada PR genera preview URL',
          'Environment Variables: Configuradas en Project Settings',
          'Custom Domain: Disponible en capa gratuita',
          'HTTPS automático con certificados SSL'
        ],
        capaGratuita: [
          'Builds y deployments ilimitados',
          '100 GB de bandwidth por mes',
          'Serverless functions: 100 GB-hours',
          '1000 horas de ejecución de funciones',
          'Preview deployments ilimitados',
          'Soporte para monorepos',
          'Analytics básicos incluidos'
        ]
      }
    },
    {
      id: 'crear-modulo',
      icon: Code2,
      titulo: 'Cómo Crear un Nuevo Módulo',
      descripcion: 'Guía paso a paso para extender funcionalidad',
      color: 'from-orange-500 to-red-500',
      contenido: {
        pasos: [
          '1. Crear archivo en src/pages/NuevoModulo.jsx',
          '2. Importar componentes base de shadcn/ui (Card, Button, etc.)',
          '3. Importar servicios necesarios de src/services/supabaseHelpers.js',
          '4. Definir estado con useState para datos y loading',
          '5. Crear useEffect para cargar datos al montar componente',
          '6. Implementar funciones CRUD usando servicios de Supabase',
          '7. Agregar ruta en src/App.jsx dentro de <Routes>',
          '8. Agregar item al menú en src/components/Sidebar.jsx',
          '9. Importar icono de lucide-react',
          '10. Hacer commit y push (deploy automático vía Vercel)'
        ],
        ejemploCodigo: `// src/pages/MiNuevoModulo.jsx
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getMisDatos } from '@/services/supabaseHelpers'

const MiNuevoModulo = () => {
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    const { data, error } = await getMisDatos()
    if (!error) setDatos(data || [])
    setLoading(false)
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Mi Nuevo Módulo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? 'Cargando...' : (
            <div>Datos: {datos.length}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MiNuevoModulo`,
        agregarRuta: `// En src/App.jsx
import MiNuevoModulo from './pages/MiNuevoModulo'

<Route path="mi-modulo" element={<MiNuevoModulo />} />`,
        agregarMenu: `// En src/components/Sidebar.jsx
{ 
  path: '/mi-modulo', 
  icon: Star, 
  label: 'Mi Módulo',
  description: 'Descripción breve',
  color: 'from-blue-500 to-indigo-500'
}`
      }
    },
    {
      id: 'servicios',
      icon: FileText,
      titulo: 'Servicios y Helpers',
      descripcion: 'Capa de servicios para Supabase',
      color: 'from-indigo-500 to-purple-500',
      contenido: {
        descripcion: 'Los servicios centralizan la lógica de acceso a datos y facilitan el mantenimiento.',
        archivos: [
          'src/services/supabaseClient.js - Cliente singleton de Supabase',
          'src/services/supabaseHelpers.js - Funciones CRUD para todas las tablas',
          'src/contexts/AuthContext.jsx - Gestión de autenticación'
        ],
        funcionesDisponibles: [
          'getPersonas(page, pageSize) - Obtener personas con paginación',
          'createPersona(data) - Crear nueva persona',
          'updatePersona(id, updates) - Actualizar persona',
          'deletePersona(id) - Eliminar persona',
          'getTurnos(filters) - Obtener turnos con filtros',
          'createTurno(data) - Crear nuevo turno',
          'updateTurno(id, updates) - Actualizar turno',
          'deleteTurno(id) - Eliminar turno',
          'getEstadisticas() - Obtener estadísticas generales',
          'searchPersonas(term) - Buscar personas por nombre/RUT'
        ],
        ejemploUso: `// Uso de servicios
import { getPersonas, createPersona } from '@/services/supabaseHelpers'

// Cargar datos
const { data, error, count } = await getPersonas(1, 50)

// Crear registro
const nuevaPersona = {
  nombre: 'Juan Pérez',
  rut: '12345678-9',
  tipo: 'trabajador',
  tarifa_hora: 10000
}
const { data: creada, error } = await createPersona(nuevaPersona)`
      }
    },
    {
      id: 'componentes',
      icon: Code2,
      titulo: 'Componentes UI',
      descripcion: 'Sistema de componentes reutilizables',
      color: 'from-pink-500 to-rose-500',
      contenido: {
        descripcion: 'Sistema de componentes basado en shadcn/ui y Radix UI, totalmente accesibles y personalizables.',
        componentesDisponibles: [
          'Card, CardHeader, CardTitle, CardContent - Tarjetas contenedoras',
          'Button - Botones con variantes (default, outline, ghost, destructive)',
          'Input, Label - Campos de formulario',
          'Badge - Etiquetas de estado',
          'Alert, AlertDescription - Alertas y mensajes',
          'Dialog, DialogContent, DialogHeader - Modales',
          'Select, SelectTrigger, SelectContent - Selectores',
          'Table, TableHeader, TableBody, TableRow - Tablas',
          'Checkbox - Casillas de verificación',
          'Switch - Interruptores on/off',
          'Accordion - Secciones expandibles'
        ],
        ubicacion: 'src/components/ui/ - Todos los componentes base',
        personalizacion: [
          'Tailwind CSS para styling',
          'Variantes con class-variance-authority',
          'Accesibilidad ARIA incluida',
          'Responsive por defecto'
        ],
        ejemplo: `// Uso de componentes
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="default">Acción</Button>
  </CardContent>
</Card>`
      }
    }
  ]

  return (
    <div className="space-y-6">
      
      {/* Información técnica sobre servicios */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            Servicios en la Nube (Capa Gratuita)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-base mb-2">🗄️ Supabase (Backend PostgreSQL)</h4>
            <p className="text-sm text-gray-600 mb-3">
              Base de datos PostgreSQL completa con autenticación, storage y APIs automáticas.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">500 MB de almacenamiento en base de datos</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">50,000 usuarios activos mensuales</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">1 GB de file storage</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">2 GB de transferencia de datos</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">Row Level Security (RLS) para seguridad</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">Backups automáticos diarios</span>
              </li>
            </ul>
            <a 
              href="https://supabase.com/pricing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-800 underline inline-flex items-center gap-1 mt-3"
            >
              Ver planes y límites de Supabase →
            </a>
          </div>
          <div>
            <h4 className="font-semibold text-base mb-2">☁️ Vercel (Hosting Frontend)</h4>
            <p className="text-sm text-gray-600 mb-3">
              Plataforma de deployment con CI/CD automático desde Git.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">Builds y deployments ilimitados</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">100 GB de bandwidth mensual</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">100 GB-hours de serverless functions</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">Preview deployments para cada PR</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">HTTPS automático con SSL</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                </div>
                <span className="text-sm text-gray-600">Custom domains incluido</span>
              </li>
            </ul>
            <a 
              href="https://vercel.com/pricing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-800 underline inline-flex items-center gap-1 mt-3"
            >
              Ver planes y límites de Vercel →
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Lista de módulos técnicos */}
      {modulosTecnicos.map((modulo) => (
        <Card key={modulo.id} className={`overflow-hidden ${moduloExpandido === modulo.id ? `bg-gradient-to-br ${modulo.color}` : ''} ${moduloExpandido !== modulo.id ? 'p-0' : ''}`}>
          <CardHeader 
            className={`bg-gradient-to-r ${modulo.color} text-white cursor-pointer ${moduloExpandido !== modulo.id ? 'm-0' : ''}`}
            onClick={() => toggleModulo(modulo.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <modulo.icon className="h-6 w-6" />
                <div>
                  <CardTitle>{modulo.titulo}</CardTitle>
                  <CardDescription className="text-white/80">{modulo.descripcion}</CardDescription>
                </div>
              </div>
              {moduloExpandido === modulo.id ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          
          {moduloExpandido === modulo.id && (
            <CardContent className="pt-6 space-y-4 bg-white/95 backdrop-blur-sm">
              {modulo.contenido.descripcion && (
                <p className="text-sm text-gray-600">{modulo.contenido.descripcion}</p>
              )}

              {modulo.contenido.stack && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Stack Tecnológico</h3>
                  <ul className="space-y-2">
                    {modulo.contenido.stack.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="bg-purple-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                        </div>
                        <code className="text-gray-700">{item}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.estructura && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Estructura de Carpetas</h3>
                  <ul className="space-y-2">
                    {modulo.contenido.estructura.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        </div>
                        <code className="text-gray-700">{item}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.deployment && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Deployment</h3>
                  <ul className="space-y-2">
                    {modulo.contenido.deployment.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="bg-green-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                        </div>
                        <code className="text-gray-700">{item}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.tablas && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Tablas de Base de Datos</h3>
                  <ul className="space-y-2">
                    {modulo.contenido.tablas.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="bg-green-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                        </div>
                        <code className="text-gray-700">{item}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.conexion && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Conexión</h3>
                  <ul className="space-y-2">
                    {modulo.contenido.conexion.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="bg-cyan-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                        </div>
                        <code className="text-gray-700">{item}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.capaGratuita && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-base mb-2 text-green-800">💰 Capa Gratuita</h3>
                  <ul className="space-y-2">
                    {modulo.contenido.capaGratuita.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="bg-green-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                        </div>
                        <span className="text-sm text-green-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.configuracion && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Configuración</h3>
                  <ul className="space-y-2">
                    {modulo.contenido.configuracion.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        </div>
                        <code className="text-gray-700">{item}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.pasos && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Pasos</h3>
                  <ol className="space-y-2">
                    {modulo.contenido.pasos.map((paso, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="bg-orange-100 text-orange-700 font-semibold rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                          {i + 1}
                        </div>
                        <code className="text-sm text-gray-700 pt-0.5">{paso}</code>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {modulo.contenido.archivos && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Archivos</h3>
                  <ul className="space-y-2">
                    {modulo.contenido.archivos.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600">
                        <code className="text-sm text-gray-700">{item}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.funcionesDisponibles && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Funciones Disponibles</h3>
                  <ul className="space-y-2">
                    {modulo.contenido.funcionesDisponibles.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">{item}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.componentesDisponibles && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Componentes Disponibles</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {modulo.contenido.componentesDisponibles.map((item, i) => (
                      <code key={i} className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                        {item}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {modulo.contenido.ubicacion && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <code className="text-sm text-blue-800">{modulo.contenido.ubicacion}</code>
                </div>
              )}

              {modulo.contenido.personalizacion && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Personalización</h3>
                  <ul className="space-y-1">
                    {modulo.contenido.personalizacion.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {modulo.contenido.ejemploCodigo && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Ejemplo de Código</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {modulo.contenido.ejemploCodigo}
                  </pre>
                </div>
              )}

              {modulo.contenido.agregarRuta && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Agregar Ruta</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {modulo.contenido.agregarRuta}
                  </pre>
                </div>
              )}

              {modulo.contenido.agregarMenu && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Agregar al Menú</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {modulo.contenido.agregarMenu}
                  </pre>
                </div>
              )}

              {modulo.contenido.ejemploUso && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Ejemplo de Uso</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {modulo.contenido.ejemploUso}
                  </pre>
                </div>
              )}

              {modulo.contenido.ejemplo && (
                <div>
                  <h3 className="font-semibold text-base mb-2">Ejemplo</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {modulo.contenido.ejemplo}
                  </pre>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {/* README del Proyecto */}
      {seccionActiva === 'tecnica' && (
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <Github className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">README del Proyecto</CardTitle>
                <CardDescription className="text-purple-100">
                  Documentación completa del repositorio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                🌊 Punta de Lobos - Sistema de Gestión de Personas
              </h1>
              <p className="text-gray-600">
                Sistema moderno y completo de gestión de personas para Punta de Lobos, construido con React, Vite y Supabase.
              </p>
            </div>

            {/* Características */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">✨ Características</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 font-bold">🔐</span>
                  Sistema de autenticación seguro con control de intentos
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 font-bold">📊</span>
                  Dashboard con métricas y estadísticas en tiempo real
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 font-bold">👥</span>
                  Gestión de personas
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 font-bold">📅</span>
                  Calendario de turnos
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 font-bold">💰</span>
                  Sistema de tarifas por persona
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 font-bold">📈</span>
                  Reportes y análisis de datos
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 font-bold">🎨</span>
                  UI moderna con TailwindCSS y shadcn/ui
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-teal-600 font-bold">🗄️</span>
                  Base de datos PostgreSQL en Supabase
                </li>
              </ul>
            </div>

            {/* Stack Tecnológico */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">🛠️ Stack Tecnológico</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-2">Frontend</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• React 19.1.0 - Framework principal</li>
                    <li>• Vite 6.3.5 - Build tool y dev server</li>
                    <li>• React Router DOM 7.6.1 - Navegación</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-2">Styling & UI</h3>
                  <ul className="space-y-1 text-sm text-purple-800">
                    <li>• Tailwind CSS 4.1.7 - Framework de estilos</li>
                    <li>• Radix UI - Componentes accesibles</li>
                    <li>• shadcn/ui - Sistema de componentes</li>
                    <li>• Lucide React - Iconografía</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-bold text-green-900 mb-2">Visualización</h3>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• ECharts 5.6.0 - Gráficos avanzados</li>
                    <li>• Recharts 2.15.3 - Gráficos React</li>
                    <li>• ExcelJS - Exportación a Excel</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-bold text-orange-900 mb-2">Backend & Base de Datos</h3>
                  <ul className="space-y-1 text-sm text-orange-800">
                    <li>• Supabase - PostgreSQL + Auth</li>
                    <li>• @supabase/supabase-js 2.57.2</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Requisitos */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">📋 Requisitos Previos</h2>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Node.js &gt;= 18.0.0
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  pnpm &gt;= 9.0.0
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                  Cuenta en Supabase (gratuita)
                </li>
              </ul>
            </div>

            {/* Instalación */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">🚀 Instalación</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">1. Clonar el repositorio</h3>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm">
{`git clone https://github.com/cristian-data-science/kpi_punta_de_lobos.git
cd kpi`}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">2. Instalar dependencias</h3>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm">
{`pnpm install`}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">3. Configurar variables de entorno</h3>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm">
{`cp .env.example .env.local`}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    Edita .env.local con tus credenciales de Supabase
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">4. Iniciar servidor de desarrollo</h3>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm">
{`pnpm dev`}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    Abre http://localhost:5173 en tu navegador
                  </p>
                </div>
              </div>
            </div>

            {/* Estructura del Proyecto */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">📁 Estructura del Proyecto</h2>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`kpi/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── contexts/            # Contextos de React
│   ├── pages/              # Páginas de la aplicación
│   ├── services/           # Servicios y API
│   ├── config/             # Configuraciones
│   ├── hooks/              # Custom hooks
│   └── utils/              # Funciones auxiliares
├── config/                 # Archivos de configuración
├── docs/                   # Documentación
├── scripts/                # Scripts de utilidades
├── sql/                    # Scripts SQL
└── public/                 # Assets estáticos`}
              </pre>
            </div>

            {/* Scripts Disponibles */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">📝 Scripts Disponibles</h2>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-300">
                <pre className="text-sm text-gray-800 space-y-1">
{`pnpm dev          # Servidor de desarrollo
pnpm build        # Build para producción
pnpm preview      # Vista previa del build
pnpm lint         # Ejecutar ESLint`}
                </pre>
              </div>
            </div>

            {/* Seguridad */}
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg">
              <h2 className="text-xl font-bold text-red-900 mb-2 flex items-center gap-2">
                🔒 Seguridad
              </h2>
              <p className="text-sm text-red-800 mb-3">
                Este proyecto sigue las mejores prácticas de seguridad:
              </p>
              <ul className="space-y-1 text-sm text-red-800">
                <li>✅ Credenciales SIEMPRE en variables de entorno</li>
                <li>✅ .env.local excluido del repositorio</li>
                <li>✅ Sin contraseñas hardcodeadas en el código</li>
                <li>✅ Control de intentos de login</li>
                <li>✅ Row Level Security (RLS) habilitado en Supabase</li>
              </ul>
            </div>

            {/* Agradecimientos */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">🙏 Agradecimientos</h2>
              <p className="text-gray-700 leading-relaxed">
                Agradecemos profundamente al <span className="font-semibold text-teal-700">equipo de Patagonia Chile</span> por 
                permitirnos hacer esta contribución a la fundación Parque Punta de Lobos, apoyando la gestión sostenible y 
                el cuidado de este invaluable patrimonio natural.
              </p>
              <div className="mt-4 text-center">
                <p className="text-gray-600 italic">Desarrollado con ❤️ para Punta de Lobos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Documentacion
