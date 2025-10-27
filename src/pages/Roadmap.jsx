import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CheckCircle2,
  Loader2,
  Circle,
  Plus,
  Save,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { getRoadmapData, saveRoadmapData } from '@/services/supabaseHelpers'

const STATUS_CONFIG = {
  done: {
    label: 'Completado',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  },
  'in-progress': {
    label: 'En progreso',
    icon: Loader2,
    badgeClass: 'bg-sky-100 text-sky-700 border border-sky-200'
  },
  planned: {
    label: 'Pendiente',
    icon: Circle,
    badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200'
  }
}

const defaultRoadmap = [
  {
    id: 'access-control',
    title: 'Accesos y autenticacion',
    description:
      'Asegurar la entrada al sistema para administradores y trabajadores con sesiones confiables.',
    tasks: [
      {
        id: 'auth-admin',
        title: 'Login administrativo con Supabase y persistencia de sesion',
        status: 'done'
      },
      {
        id: 'protected-routes',
        title: 'Proteccion de rutas privadas con Layout y AuthProvider',
        status: 'done'
      },
      {
        id: 'portal-staff',
        title: 'Portal trabajador con autenticacion por RUT',
        status: 'done'
      },
      {
        id: 'worker-turnos-viewer',
        title: 'Visualizador de turnos para trabajadores enlazado a Supabase',
        status: 'done'
      },
      {
        id: 'session-hardening',
        title: 'Auto cierre de sesion y recordatorio de seguridad para administradores',
        status: 'planned'
      }
    ]
  },
  {
    id: 'turnos-operations',
    title: 'Operacion de turnos',
    description:
      'Planificacion, ejecucion y visibilidad completa de los turnos a cargo del staff.',
    tasks: [
      {
        id: 'turnos-crud',
        title: 'CRUD de turnos con modal de creacion y ediciones rapidas',
        status: 'done'
      },
      {
        id: 'weekly-calendar',
        title: 'Calendario semanal interactivo con bloques arrastrables',
        status: 'done'
      },
      {
        id: 'programacion-masiva',
        title: 'Programacion bimensual con asignaciones simuladas',
        status: 'in-progress'
      },
      {
        id: 'turnos-viewer-admin',
        title: 'Resumen administrativo de turnos con metricas de estado',
        status: 'done'
      },
      {
        id: 'alertas-conflictos',
        title: 'Alertas automaticas de traslape y conflictos de horarios',
        status: 'planned'
      }
    ]
  },
  {
    id: 'personas-registros',
    title: 'Gestion de personas y registros',
    description:
      'Administrar la base de personas y documentar actividades clave de la operacion.',
    tasks: [
      {
        id: 'personas-crud',
        title: 'Administracion de personas con busqueda y filtros por tipo',
        status: 'done'
      },
      {
        id: 'tarifas-personalizadas',
        title: 'Tarifas personalizadas por persona con notas y estados',
        status: 'done'
      },
      {
        id: 'registros-actividad',
        title: 'Bitacora de actividades con vinculacion a personas',
        status: 'done'
      },
      {
        id: 'import-personas',
        title: 'Importacion masiva de personas desde planilla',
        status: 'planned'
      }
    ]
  },
  {
    id: 'analytics-reporting',
    title: 'Analitica y reportes',
    description:
      'Medir desempeno operativo, detectar tendencias y compartir resultados con stakeholders.',
    tasks: [
      {
        id: 'dashboard-kpi',
        title: 'Dashboard con KPIs de asistencia, horas y montos',
        status: 'done'
      },
      {
        id: 'turnos-por-tipo',
        title: 'Graficos de distribucion de turnos y proximos eventos',
        status: 'done'
      },
      {
        id: 'reportes-export',
        title: 'Exportacion de reportes en XLSX y PDF',
        status: 'planned'
      },
      {
        id: 'alertas-metricas',
        title: 'Alertas automaticas basadas en KPIs criticos',
        status: 'planned'
      }
    ]
  },
  {
    id: 'finanzas-config',
    title: 'Finanzas y configuracion',
    description:
      'Control financiero y ajustes globales para adaptar la plataforma a cada temporada.',
    tasks: [
      {
        id: 'pagos-base',
        title: 'Sistema de pagos a trabajadores con cálculo automático',
        status: 'completed'
      },
      {
        id: 'flujo-cobros',
        title: 'Integracion de cobros reales con Supabase',
        status: 'planned'
      },
      {
        id: 'configuracion-general',
        title: 'Panel de configuracion con estado de servicios y ambiente',
        status: 'done'
      },
      {
        id: 'temas-apariencia',
        title: 'Selector de temas y personalizacion visual',
        status: 'planned'
      }
    ]
  }
]

const normalizeRoadmapData = (raw) => {
  if (!raw) return defaultRoadmap

  if (Array.isArray(raw)) {
    const modulesMap = new Map()

    raw.forEach((row, index) => {
      const moduleId = row.module_code ?? row.module_id ?? `module-${index}`
      if (!modulesMap.has(moduleId)) {
        modulesMap.set(moduleId, {
          id: moduleId,
          title: row.module_title ?? `Hito ${modulesMap.size + 1}`,
          description: row.module_description ?? '',
          position: row.module_position ?? modulesMap.size,
          tasks: []
        })
      }

      const moduleRef = modulesMap.get(moduleId)

      if (row.task_code || row.task_title) {
        moduleRef.tasks.push({
          id: row.task_code ?? `task-${moduleRef.tasks.length}`,
          title: row.task_title ?? `Subtarea ${moduleRef.tasks.length + 1}`,
          status: Object.prototype.hasOwnProperty.call(STATUS_CONFIG, row.task_status)
            ? row.task_status
            : 'planned',
          position: row.task_position ?? moduleRef.tasks.length
        })
      }
    })

    if (modulesMap.size === 0) return defaultRoadmap

    return Array.from(modulesMap.values())
      .sort((a, b) => a.position - b.position)
      .map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        tasks: module.tasks
          .sort((a, b) => a.position - b.position)
          .map((task) => ({
            id: task.id,
            title: task.title,
            status: task.status
          }))
      }))
  }

  return defaultRoadmap
}

const getRoadmapSummary = (modules) => {
  const totals = modules.reduce(
    (acc, module) => {
      module.tasks.forEach((task) => {
        acc.totalTasks += 1
        if (task.status === 'done') acc.completedTasks += 1
      })
      return acc
    },
    { totalTasks: 0, completedTasks: 0 }
  )

  return {
    ...totals,
    completion:
      totals.totalTasks > 0 ? Math.round((totals.completedTasks / totals.totalTasks) * 100) : 0
  }
}

const buildCollapsedMap = (modules) =>
  modules.reduce((acc, module) => {
    acc[module.id] = false
    return acc
  }, {})

const Roadmap = () => {
  const [roadmap, setRoadmap] = useState(defaultRoadmap)
  const [collapsedModules, setCollapsedModules] = useState(buildCollapsedMap(defaultRoadmap))
  const [editingModuleId, setEditingModuleId] = useState(null)
  const [moduleDraft, setModuleDraft] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [taskDraft, setTaskDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const summary = useMemo(() => getRoadmapSummary(roadmap), [roadmap])

  const saveToSupabase = useCallback(async (structure) => {
    setSaving(true)
    setSaveError(null)
    try {
      const { error } = await saveRoadmapData(structure)
      if (error) throw new Error(error.message || 'Error al guardar roadmap')
    } catch (err) {
      console.error('saveRoadmap error:', err)
      setSaveError(err.message ?? 'No se pudo guardar el roadmap.')
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const loadRoadmap = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await getRoadmapData()
      if (error) throw new Error(error.message || 'Error al obtener roadmap')

      const normalized = normalizeRoadmapData(data)
      setRoadmap(normalized)
      setCollapsedModules(buildCollapsedMap(normalized))
    } catch (err) {
      console.error('loadRoadmap error:', err)
      setLoadError(
        err.message ??
          'No se pudo cargar el roadmap remoto. Se mostrará la versión local por defecto.'
      )
      const fallback = normalizeRoadmapData(null)
      setRoadmap(fallback)
      setCollapsedModules(buildCollapsedMap(fallback))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRoadmap()
  }, [loadRoadmap])

  const beginModuleEdit = (module) => {
    setEditingModuleId(module.id)
    setModuleDraft({
      title: module.title,
      description: module.description ?? ''
    })
    setCollapsedModules((prev) => ({ ...prev, [module.id]: false }))
  }

  const cancelModuleEdit = () => {
    setEditingModuleId(null)
    setModuleDraft(null)
  }

  const saveModuleEdit = async () => {
    if (!moduleDraft?.title?.trim()) return

    const nextRoadmap = roadmap.map((module) =>
      module.id === editingModuleId
        ? {
            ...module,
            title: moduleDraft.title.trim(),
            description: moduleDraft.description?.trim() ?? ''
          }
        : module
    )

    setRoadmap(nextRoadmap)
    try {
      await saveToSupabase(nextRoadmap)
    } catch (error) {
      console.error('saveModuleEdit -> persist error', error)
      await loadRoadmap()
    }
    cancelModuleEdit()
  }

  const addModule = async () => {
    const newModule = {
      id: `module-${Date.now()}`,
      title: 'Nuevo hito',
      description: 'Describe el alcance del hito.',
      tasks: []
    }

    const nextRoadmap = [newModule, ...roadmap]
    setRoadmap(nextRoadmap)
    setCollapsedModules((prev) => ({ ...prev, [newModule.id]: false }))
    setEditingModuleId(newModule.id)
    setModuleDraft({ title: newModule.title, description: newModule.description })

    try {
      await saveToSupabase(nextRoadmap)
    } catch (error) {
      console.error('addModule -> persist error', error)
      await loadRoadmap()
    }
  }

  const deleteModule = async (moduleId) => {
    const nextRoadmap = roadmap.filter((module) => module.id !== moduleId)
    setRoadmap(nextRoadmap)
    setCollapsedModules((prev) => {
      const { [moduleId]: _removed, ...rest } = prev
      return rest
    })

    if (editingModuleId === moduleId) {
      cancelModuleEdit()
    }

    if (editingTask?.moduleId === moduleId) {
      setEditingTask(null)
      setTaskDraft(null)
    }

    try {
      await saveToSupabase(nextRoadmap)
    } catch (error) {
      console.error('deleteModule -> persist error', error)
      await loadRoadmap()
    }
  }

  const addTask = async (moduleId) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: 'Nueva subtarea',
      status: 'planned'
    }

    const nextRoadmap = roadmap.map((module) =>
      module.id === moduleId ? { ...module, tasks: [newTask, ...module.tasks] } : module
    )

    setRoadmap(nextRoadmap)
    setCollapsedModules((prev) => ({ ...prev, [moduleId]: false }))
    setEditingTask({ moduleId, taskId: newTask.id })
    setTaskDraft({ title: newTask.title, status: newTask.status })

    try {
      await saveToSupabase(nextRoadmap)
    } catch (error) {
      console.error('addTask -> persist error', error)
      await loadRoadmap()
    }
  }

  const deleteTask = async (moduleId, taskId) => {
    const nextRoadmap = roadmap.map((module) =>
      module.id === moduleId
        ? { ...module, tasks: module.tasks.filter((task) => task.id !== taskId) }
        : module
    )

    setRoadmap(nextRoadmap)

    if (editingTask?.moduleId === moduleId && editingTask?.taskId === taskId) {
      setEditingTask(null)
      setTaskDraft(null)
    }

    try {
      await saveToSupabase(nextRoadmap)
    } catch (error) {
      console.error('deleteTask -> persist error', error)
      await loadRoadmap()
    }
  }

  const beginTaskEdit = (moduleId, task) => {
    setEditingTask({ moduleId, taskId: task.id })
    setTaskDraft({
      title: task.title,
      status: Object.prototype.hasOwnProperty.call(STATUS_CONFIG, task.status)
        ? task.status
        : 'planned'
    })
    setCollapsedModules((prev) => ({ ...prev, [moduleId]: false }))
  }

  const cancelTaskEdit = () => {
    setEditingTask(null)
    setTaskDraft(null)
  }

  const saveTaskEdit = async () => {
    if (!taskDraft?.title?.trim()) return
    if (!editingTask?.moduleId || !editingTask?.taskId) return

    const nextRoadmap = roadmap.map((module) =>
      module.id === editingTask.moduleId
        ? {
            ...module,
            tasks: module.tasks.map((task) =>
              task.id === editingTask.taskId
                ? {
                    ...task,
                    title: taskDraft.title.trim(),
                    status: taskDraft.status
                  }
                : task
            )
          }
        : module
    )

    setRoadmap(nextRoadmap)
    try {
      await saveToSupabase(nextRoadmap)
    } catch (error) {
      console.error('saveTaskEdit -> persist error', error)
      await loadRoadmap()
    }
    cancelTaskEdit()
  }

  const setTaskStatus = async (moduleId, taskId, status) => {
    const nextRoadmap = roadmap.map((module) =>
      module.id === moduleId
        ? {
            ...module,
            tasks: module.tasks.map((task) =>
              task.id === taskId ? { ...task, status } : task
            )
          }
        : module
    )

    setRoadmap(nextRoadmap)
    try {
      await saveToSupabase(nextRoadmap)
    } catch (error) {
      console.error('setTaskStatus -> persist error', error)
      await loadRoadmap()
    }
  }

  const toggleModuleCollapse = (moduleId) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  const loadingState = (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-12 text-center text-slate-500">Cargando roadmap...</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Roadmap del proyecto</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Revisa los hitos principales y marca el avance de cada subtarea. Puedes editar la
              estructura segun las necesidades del equipo y los cambios se guardan en Supabase.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{summary.completedTasks}</span> de{' '}
            {summary.totalTasks} subtareas completadas
            {summary.totalTasks > 0 && (
              <span className="ml-2 text-slate-400">({summary.completion}% completado)</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-teal-600">Guardando cambios...</span>}
          {saveError && <span className="text-sm text-red-600">{saveError}</span>}
          <Button
            onClick={addModule}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
            disabled={loading || saving}
          >
            <Plus className="h-4 w-4" />
            Nuevo hito
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      {loading ? (
        loadingState
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          {roadmap.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500">
              Aun no hay hitos definidos. Agrega el primero para comenzar.
            </div>
          ) : (
            roadmap.map((module, index) => {
              const doneTasks = module.tasks.filter((task) => task.status === 'done').length
              const moduleEditing = editingModuleId === module.id
              const isCollapsed = collapsedModules[module.id] === true

              return (
                <div
                  key={module.id}
                  className={`border-b border-slate-200 ${index === roadmap.length - 1 ? '' : ''}`}
                >
                  <div className="px-6 py-5 bg-slate-50/70 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {moduleEditing ? (
                      <div className="space-y-3 w-full md:max-w-3xl">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor={`module-title-${module.id}`}
                            className="text-xs uppercase text-slate-500"
                          >
                            Nombre del hito
                          </Label>
                          <Input
                            id={`module-title-${module.id}`}
                            value={moduleDraft?.title ?? ''}
                            onChange={(event) =>
                              setModuleDraft((prev) => ({
                                ...prev,
                                title: event.target.value
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor={`module-description-${module.id}`}
                            className="text-xs uppercase text-slate-500"
                          >
                            Descripcion
                          </Label>
                          <textarea
                            id={`module-description-${module.id}`}
                            value={moduleDraft?.description ?? ''}
                            onChange={(event) =>
                              setModuleDraft((prev) => ({
                                ...prev,
                                description: event.target.value
                              }))
                            }
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleModuleCollapse(module.id)}
                              className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                            <h2 className="text-xl font-semibold text-slate-900">{module.title}</h2>
                          </div>
                          <Badge variant="outline" className="text-xs text-slate-600 border-slate-200">
                            {doneTasks}/{module.tasks.length} completadas
                          </Badge>
                        </div>
                        {module.description && (
                          <p className="text-sm text-slate-600 max-w-3xl">{module.description}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      {moduleEditing ? (
                        <>
                          <Button
                            size="sm"
                            onClick={saveModuleEdit}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700"
                            disabled={saving}
                          >
                            <Save className="h-4 w-4" />
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelModuleEdit} disabled={saving}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addTask(module.id)}
                            className="flex items-center gap-2"
                            disabled={saving}
                          >
                            <Plus className="h-4 w-4" />
                            Subtarea
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => beginModuleEdit(module)}
                            className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
                            disabled={saving}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteModule(module.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="divide-y divide-slate-200">
                      {module.tasks.length === 0 ? (
                        <div className="px-6 py-6 text-sm text-slate-500">
                          Aun no hay subtareas en este hito. Agrega la primera para detallar el
                          trabajo.
                        </div>
                      ) : (
                        module.tasks.map((task) => {
                          const taskEditing =
                            editingTask?.moduleId === module.id && editingTask?.taskId === task.id
                          const statusConfig = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.planned
                          const StatusIcon = statusConfig.icon

                          return (
                            <div
                              key={task.id}
                              className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
                            >
                              {taskEditing ? (
                                <div className="space-y-3 w-full md:max-w-2xl">
                                  <div className="space-y-1.5">
                                    <Label
                                      htmlFor={`task-title-${task.id}`}
                                      className="text-xs uppercase text-slate-500"
                                    >
                                      Nombre de la subtarea
                                    </Label>
                                    <Input
                                      id={`task-title-${task.id}`}
                                      value={taskDraft?.title ?? ''}
                                      onChange={(event) =>
                                        setTaskDraft((prev) => ({
                                          ...prev,
                                          title: event.target.value
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs uppercase text-slate-500">
                                      Estado
                                    </Label>
                                    <select
                                      value={taskDraft?.status ?? 'planned'}
                                      onChange={(event) =>
                                        setTaskDraft((prev) => ({
                                          ...prev,
                                          status: event.target.value
                                        }))
                                      }
                                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                                    >
                                      {Object.entries(STATUS_CONFIG).map(([key, option]) => (
                                        <option key={key} value={key}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-3 md:max-w-2xl">
                                  <Checkbox
                                    checked={task.status === 'done'}
                                    onCheckedChange={async (value) =>
                                      setTaskStatus(
                                        module.id,
                                        task.id,
                                        value === true ? 'done' : 'planned'
                                      )
                                    }
                                    disabled={saving}
                                    className="mt-1"
                                  />
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p
                                        className={`text-sm font-medium ${
                                          task.status === 'done'
                                            ? 'text-slate-400 line-through'
                                            : 'text-slate-800'
                                        }`}
                                      >
                                        {task.title}
                                      </p>
                                      {task.status !== 'done' && (
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${statusConfig.badgeClass}`}
                                        >
                                          <StatusIcon
                                            className={`h-3.5 w-3.5 ${
                                              task.status === 'in-progress' ? 'animate-spin' : ''
                                            }`}
                                          />
                                          <span className="ml-1">{statusConfig.label}</span>
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                {taskEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={saveTaskEdit}
                                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700"
                                      disabled={saving}
                                    >
                                      <Save className="h-4 w-4" />
                                      Guardar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelTaskEdit}
                                      disabled={saving}
                                    >
                                      Cancelar
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => beginTaskEdit(module.id, task)}
                                      className="text-slate-600 hover:text-teal-600 hover:bg-teal-50"
                                      disabled={saving}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteTask(module.id, task.id)}
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                      disabled={saving}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Roadmap
