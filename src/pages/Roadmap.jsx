import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  Circle,
  Edit3,
  Save,
  X,
  Plus,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const STORAGE_KEY = 'codex-roadmap-steps'

const defaultSteps = [
  {
    id: 'auth',
    title: 'Autenticación y control de acceso',
    description:
      'Inicio de sesión con Supabase, gestión de sesiones y protección de rutas para garantizar el acceso seguro.',
    status: 'done',
    updatedAt: '2024-09-01T12:00:00.000Z'
  },
  {
    id: 'dashboard',
    title: 'Panel de control y métricas clave',
    description:
      'Visualización consolidada del estado operativo con tarjetas informativas y accesos rápidos a los módulos principales.',
    status: 'done',
    updatedAt: '2024-09-10T12:00:00.000Z'
  },
  {
    id: 'personas',
    title: 'Gestión de personas',
    description:
      'ABM completo de colaboradores incluyendo información de contacto, roles y asignaciones activas.',
    status: 'done',
    updatedAt: '2024-09-18T12:00:00.000Z'
  },
  {
    id: 'turnos',
    title: 'Programación y seguimiento de turnos',
    description:
      'Creación de turnos, vistas mejoradas del calendario y herramientas de asignación para optimizar la operación diaria.',
    status: 'done',
    updatedAt: '2024-10-02T12:00:00.000Z'
  },
  {
    id: 'reportes',
    title: 'Reportes analíticos',
    description:
      'Reportes personalizados de asistencia, productividad y datos financieros con filtros dinámicos.',
    status: 'in_progress',
    updatedAt: '2024-10-08T12:00:00.000Z'
  },
  {
    id: 'automatizaciones',
    title: 'Automatización de alertas y notificaciones',
    description:
      'Notificaciones programadas por correo y canales internos para eventos críticos y recordatorios operativos.',
    status: 'planned',
    updatedAt: '2024-10-15T12:00:00.000Z'
  }
]

const STATUS_META = {
  done: {
    label: 'Completado',
    icon: CheckCircle2,
    badgeVariant: 'default',
    accent: 'text-emerald-600',
    indicator: 'from-emerald-500 to-teal-500'
  },
  in_progress: {
    label: 'En progreso',
    icon: Clock3,
    badgeVariant: 'secondary',
    accent: 'text-amber-500',
    indicator: 'from-amber-500 to-orange-500'
  },
  planned: {
    label: 'Pendiente',
    icon: Circle,
    badgeVariant: 'outline',
    accent: 'text-slate-500',
    indicator: 'from-slate-400 to-slate-500'
  }
}

const statusOptions = [
  { value: 'done', label: 'Completado' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'planned', label: 'Pendiente' }
]

const formatDate = (isoString) => {
  if (!isoString) {
    return 'Sin fecha'
  }

  const date = new Date(isoString)
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const Roadmap = () => {
  const [steps, setSteps] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)

    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setSteps(parsed)
          setIsReady(true)
          return
        }
      } catch (error) {
        console.warn('Roadmap: no se pudo parsear el contenido almacenado, se usará la configuración por defecto.', error)
      }
    }

    setSteps(defaultSteps)
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(steps))
  }, [steps, isReady])

  const progress = useMemo(() => {
    if (!steps.length) return 0
    const completed = steps.filter((step) => step.status === 'done').length
    return Math.round((completed / steps.length) * 100)
  }, [steps])

  const handleEdit = (step) => {
    setEditingId(step.id)
    setDraft({ ...step })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setDraft(null)
  }

  const handleChangeDraft = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handleSave = () => {
    if (!draft || !editingId) return

    const updatedStep = {
      ...draft,
      updatedAt: new Date().toISOString()
    }

    setSteps((prev) => prev.map((step) => (step.id === editingId ? updatedStep : step)))
    setEditingId(null)
    setDraft(null)
  }

  const handleAddStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      title: 'Nuevo hito',
      description: 'Describe el objetivo y el entregable esperado.',
      status: 'planned',
      updatedAt: new Date().toISOString()
    }

    setSteps((prev) => [...prev, newStep])
    setEditingId(newStep.id)
    setDraft(newStep)
  }

  const handleDelete = (id) => {
    setSteps((prev) => prev.filter((step) => step.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setDraft(null)
    }
  }

  const handleReset = () => {
    setSteps(defaultSteps)
    setEditingId(null)
    setDraft(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Roadmap de producto</h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Visualiza el estado actual del proyecto, marca los hitos completados y adapta el plan a medida que evolucionan las necesidades del equipo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="text-slate-600">
            <RefreshCw className="h-4 w-4" /> Restablecer
          </Button>
          <Button onClick={handleAddStep} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
            <Plus className="h-4 w-4" /> Añadir hito
          </Button>
        </div>
      </div>

      <Card className="border-slate-200/80 bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg text-slate-800">Progreso general</CardTitle>
            <CardDescription className="text-sm text-slate-500">
              {progress === 100
                ? 'Todos los hitos definidos se encuentran completados.'
                : `Has completado ${progress}% del roadmap establecido.`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <div className="text-3xl font-semibold text-slate-900">{progress}%</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completado</div>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="h-3 rounded-full bg-slate-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {steps.map((step) => {
          const meta = STATUS_META[step.status] ?? STATUS_META.planned
          const Icon = meta.icon
          const isEditing = editingId === step.id

          return (
            <Card key={step.id} className="border-slate-200/70 bg-white/90 backdrop-blur-sm">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br ${meta.indicator} text-white shadow-sm`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`title-${step.id}`} className="text-slate-600">
                              Título
                            </Label>
                            <Input
                              id={`title-${step.id}`}
                              value={draft?.title ?? ''}
                              onChange={(event) => handleChangeDraft('title', event.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`description-${step.id}`} className="text-slate-600">
                              Descripción
                            </Label>
                            <textarea
                              id={`description-${step.id}`}
                              value={draft?.description ?? ''}
                              onChange={(event) => handleChangeDraft('description', event.target.value)}
                              className="mt-1 w-full min-h-[100px] resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                              placeholder="Detalla el objetivo, entregable y métricas de éxito del hito."
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`status-${step.id}`} className="text-slate-600">
                              Estado
                            </Label>
                            <select
                              id={`status-${step.id}`}
                              value={draft?.status ?? 'planned'}
                              onChange={(event) => handleChangeDraft('status', event.target.value)}
                              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <CardTitle className="text-xl text-slate-900">{step.title}</CardTitle>
                          <CardDescription className="text-sm leading-relaxed text-slate-600">
                            {step.description}
                          </CardDescription>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                      Última actualización: {formatDate(step.updatedAt)}
                    </span>
                    {step.status === 'done' && !isEditing && (
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> Implementado
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSave} className="bg-teal-500 hover:bg-teal-600">
                        <Save className="h-4 w-4" /> Guardar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="text-slate-500 hover:text-slate-700">
                        <X className="h-4 w-4" /> Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(step)} className="text-slate-600">
                        <Edit3 className="h-4 w-4" /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(step.id)} className="text-rose-500 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Roadmap
