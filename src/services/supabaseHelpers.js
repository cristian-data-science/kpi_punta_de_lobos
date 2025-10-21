// 🔧 Utilidades y Helpers para Supabase
// Funciones auxiliares para facilitar operaciones con Supabase

import { getSupabaseClient } from './supabaseClient'

/**
 * 🔍 Verifica si la conexión a Supabase está configurada correctamente
 * @returns {Object} Estado de la conexión y detalles
 */
export const checkSupabaseConnection = async () => {
  const supabase = getSupabaseClient()
  
  const status = {
    configured: false,
    connected: false,
    url: import.meta.env.VITE_SUPABASE_URL,
    hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    error: null
  }

  // Verificar que las variables de entorno están configuradas
  if (!status.url || status.url.includes('tu-proyecto')) {
    status.error = 'VITE_SUPABASE_URL no está configurada correctamente en .env.local'
    return status
  }

  if (!status.hasKey || import.meta.env.VITE_SUPABASE_ANON_KEY.includes('tu_anon_key')) {
    status.error = 'VITE_SUPABASE_ANON_KEY no está configurada correctamente en .env.local'
    return status
  }

  status.configured = true

  // Probar conexión con una query simple
  try {
    const { data, error } = await supabase.from('personas').select('count', { count: 'exact', head: true })
    
    if (error) {
      status.error = `Error al conectar: ${error.message}`
      return status
    }

    status.connected = true
    return status
  } catch (err) {
    status.error = `Error de conexión: ${err.message}`
    return status
  }
}

/**
 * 📊 Obtiene todas las personas con paginación
 */
export const getPersonas = async (page = 1, pageSize = 10) => {
  const supabase = getSupabaseClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('personas')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  return { data, error, count }
}

/**
 * ➕ Crea una nueva persona
 */
export const createPersona = async (personaData) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('personas')
    .insert([personaData])
    .select()
    .single()

  return { data, error }
}

/**
 * ✏️ Actualiza una persona existente
 */
export const updatePersona = async (id, updates) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('personas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

/**
 * 🗑️ Elimina una persona
 */
export const deletePersona = async (id) => {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('personas')
    .delete()
    .eq('id', id)

  return { error }
}

/**
 * 🔍 Busca personas por nombre o RUT
 */
export const searchPersonas = async (searchTerm) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .or(`nombre.ilike.%${searchTerm}%,rut.ilike.%${searchTerm}%`)
    .order('nombre')

  return { data, error }
}

/**
 * 📋 Obtiene registros/actividades
 */
export const getRegistros = async (filters = {}) => {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('registros')
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo)
    `)
    .order('fecha', { ascending: false })

  // Aplicar filtros opcionales
  if (filters.personaId) {
    query = query.eq('persona_id', filters.personaId)
  }
  
  if (filters.fechaDesde) {
    query = query.gte('fecha', filters.fechaDesde)
  }
  
  if (filters.fechaHasta) {
    query = query.lte('fecha', filters.fechaHasta)
  }
  
  if (filters.tipoActividad) {
    query = query.eq('tipo_actividad', filters.tipoActividad)
  }

  const { data, error } = await query

  return { data, error }
}

/**
 * ➕ Crea un nuevo registro/actividad
 */
export const createRegistro = async (registroData) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('registros')
    .insert([registroData])
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo)
    `)
    .single()

  return { data, error }
}

/**
 * ✏️ Actualiza un registro existente
 */
export const updateRegistro = async (id, updates) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('registros')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo)
    `)
    .single()

  return { data, error }
}

/**
 * 🗑️ Elimina un registro
 */
export const deleteRegistro = async (id) => {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('registros')
    .delete()
    .eq('id', id)

  return { error }
}

/**
 * 📊 Obtiene estadísticas generales
 */
export const getEstadisticas = async () => {
  const supabase = getSupabaseClient()
  
  // Obtener conteos totales
  const [
    { count: totalPersonas },
    { count: totalRegistros },
    { count: personasActivas },
    { count: totalTurnos },
    { count: totalCobros }
  ] = await Promise.all([
    supabase.from('personas').select('*', { count: 'exact', head: true }),
    supabase.from('registros').select('*', { count: 'exact', head: true }),
    supabase.from('personas').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
    supabase.from('turnos').select('*', { count: 'exact', head: true }),
    supabase.from('cobros').select('*', { count: 'exact', head: true })
  ])

  // Obtener registros por tipo de actividad
  const { data: registrosPorTipo } = await supabase
    .from('registros')
    .select('tipo_actividad')

  const actividadesPorTipo = registrosPorTipo?.reduce((acc, reg) => {
    acc[reg.tipo_actividad] = (acc[reg.tipo_actividad] || 0) + 1
    return acc
  }, {}) || {}

  return {
    totalPersonas: totalPersonas || 0,
    totalRegistros: totalRegistros || 0,
    personasActivas: personasActivas || 0,
    totalTurnos: totalTurnos || 0,
    totalCobros: totalCobros || 0,
    actividadesPorTipo
  }
}

/**
 * ⏰ Obtiene turnos con filtros opcionales
 */
export const getTurnos = async (filters = {}) => {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('turnos')
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo)
    `)
    .order('fecha', { ascending: false })

  // Aplicar filtros opcionales
  if (filters.personaId) {
    query = query.eq('persona_id', filters.personaId)
  }
  
  if (filters.fecha) {
    query = query.eq('fecha', filters.fecha)
  }
  
  if (filters.fechaDesde) {
    query = query.gte('fecha', filters.fechaDesde)
  }
  
  if (filters.fechaHasta) {
    query = query.lte('fecha', filters.fechaHasta)
  }
  
  if (filters.estado) {
    query = query.eq('estado', filters.estado)
  }
  
  if (filters.tipoTurno) {
    query = query.eq('tipo_turno', filters.tipoTurno)
  }

  const { data, error } = await query

  return { data, error }
}

/**
 * ➕ Crea un nuevo turno
 */
export const createTurno = async (turnoData) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('turnos')
    .insert([turnoData])
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo)
    `)
    .single()

  return { data, error }
}

/**
 * ✏️ Actualiza un turno existente
 */
export const updateTurno = async (id, updates) => {
  const supabase = getSupabaseClient()
  
  console.log('🔄 updateTurno - ID:', id, 'Updates:', updates)
  
  const { data, error } = await supabase
    .from('turnos')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo)
    `)
    .single()

  console.log('✅ updateTurno - Result:', { data, error })
  
  return { data, error }
}

/**
 * 🗑️ Elimina un turno
 */
export const deleteTurno = async (id) => {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('turnos')
    .delete()
    .eq('id', id)

  return { error }
}

/**
 * 💰 Obtiene cobros con filtros opcionales
 */
export const getCobros = async (filters = {}) => {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('cobros')
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo),
      registro:registros(id, descripcion, tipo_actividad),
      turno:turnos(id, fecha, tipo_turno)
    `)
    .order('fecha', { ascending: false })

  // Aplicar filtros opcionales
  if (filters.personaId) {
    query = query.eq('persona_id', filters.personaId)
  }
  
  if (filters.fecha) {
    query = query.eq('fecha', filters.fecha)
  }
  
  if (filters.fechaDesde) {
    query = query.gte('fecha', filters.fechaDesde)
  }
  
  if (filters.fechaHasta) {
    query = query.lte('fecha', filters.fechaHasta)
  }
  
  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo)
  }
  
  if (filters.estado) {
    query = query.eq('estado', filters.estado)
  }
  
  if (filters.metodoPago) {
    query = query.eq('metodo_pago', filters.metodoPago)
  }

  const { data, error } = await query

  return { data, error }
}

/**
 * ➕ Crea un nuevo cobro
 */
export const createCobro = async (cobroData) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('cobros')
    .insert([cobroData])
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo)
    `)
    .single()

  return { data, error }
}

/**
 * ✏️ Actualiza un cobro existente
 */
export const updateCobro = async (id, updates) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('cobros')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo)
    `)
    .single()

  return { data, error }
}

/**
 * 🗑️ Elimina un cobro
 */
export const deleteCobro = async (id) => {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('cobros')
    .delete()
    .eq('id', id)

  return { error }
}

/**
 * 📊 Obtiene resumen financiero
 */
export const getResumenFinanciero = async (filters = {}) => {
  const supabase = getSupabaseClient()
  
  let query = supabase.from('cobros').select('*')
  
  if (filters.fechaDesde) {
    query = query.gte('fecha', filters.fechaDesde)
  }
  
  if (filters.fechaHasta) {
    query = query.lte('fecha', filters.fechaHasta)
  }

  const { data: cobros } = await query

  const resumen = {
    totalCobros: 0,
    totalPagos: 0,
    totalReembolsos: 0,
    totalDescuentos: 0,
    balanceTotal: 0,
    cobrosPorEstado: {},
    cobrosPorMetodo: {}
  }

  cobros?.forEach(cobro => {
    const monto = parseFloat(cobro.monto || 0)
    
    switch (cobro.tipo) {
      case 'cobro':
        resumen.totalCobros += monto
        resumen.balanceTotal += monto
        break
      case 'pago':
        resumen.totalPagos += monto
        resumen.balanceTotal -= monto
        break
      case 'reembolso':
        resumen.totalReembolsos += monto
        resumen.balanceTotal -= monto
        break
      case 'descuento':
        resumen.totalDescuentos += monto
        resumen.balanceTotal -= monto
        break
    }
    
    // Contadores por estado
    resumen.cobrosPorEstado[cobro.estado] = (resumen.cobrosPorEstado[cobro.estado] || 0) + 1
    
    // Contadores por método
    if (cobro.metodo_pago) {
      resumen.cobrosPorMetodo[cobro.metodo_pago] = (resumen.cobrosPorMetodo[cobro.metodo_pago] || 0) + 1
    }
  })

  return resumen
}

/**
 * ⚙️ Obtiene configuración del sistema
 */
export const getConfiguracion = async (clave = null) => {
  const supabase = getSupabaseClient()
  
  let query = supabase.from('configuracion').select('*')
  
  if (clave) {
    query = query.eq('clave', clave).single()
  }

  const { data, error } = await query

  return { data, error }
}

/**
 * ✏️ Actualiza configuración del sistema
 */
export const updateConfiguracion = async (clave, valor) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('configuracion')
    .upsert({ clave, valor })
    .select()
    .single()

  return { data, error }
}

/**
 * 🔄 Suscribirse a cambios en tiempo real
 */
export const subscribeToTable = (table, callback) => {
  const supabase = getSupabaseClient()
  
  const subscription = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table
      },
      callback
    )
    .subscribe()

  return subscription
}

/**
 * 🛑 Cancelar suscripción
 */
export const unsubscribe = (subscription) => {
  if (subscription) {
    subscription.unsubscribe()
  }
}

// =========================================
// 👷 FUNCIONES PARA TRABAJADORES
// =========================================

/**
 * 🔍 Busca una persona por RUT (para login de trabajadores)
 */
export const getPersonaByRut = async (rut) => {
  const supabase = getSupabaseClient()
  
  console.log('🔍 Buscando persona con RUT:', rut)
  
  // Intentar búsqueda con RUT normalizado (sin puntos ni guiones)
  const rutNormalizado = rut.replace(/[.-]/g, '').toUpperCase()
  console.log('   RUT normalizado:', rutNormalizado)
  
  let { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('rut', rutNormalizado)
    .maybeSingle()

  // Si no se encontró, intentar con el RUT original (con puntos y guiones)
  if (!data && !error) {
    console.log('   No encontrado normalizado, intentando con formato original:', rut)
    const result = await supabase
      .from('personas')
      .select('*')
      .eq('rut', rut.toUpperCase())
      .maybeSingle()
    
    data = result.data
    error = result.error
  }

  // Si aún no se encontró, buscar con ilike para ser más flexible
  if (!data && !error) {
    console.log('   Intentando búsqueda flexible con ilike')
    const result = await supabase
      .from('personas')
      .select('*')
      .ilike('rut', rut.replace(/[.-]/g, '').toUpperCase())
      .maybeSingle()
    
    data = result.data
    error = result.error
  }

  if (data) {
    console.log('   ✅ Persona encontrada:', data.nombre, '- RUT en BD:', data.rut)
  } else {
    console.log('   ❌ No se encontró persona con ese RUT')
  }

  return { data, error }
}

/**
 * 📅 Obtiene turnos de un trabajador específico por ID de persona
 */
export const getTurnosByPersonaId = async (personaId, filters = {}) => {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('turnos')
    .select(`
      *,
      persona:personas(id, nombre, rut, tipo)
    `)
    .eq('persona_id', personaId)
    .order('fecha', { ascending: true })

  // Aplicar filtros opcionales
  if (filters.fechaDesde) {
    query = query.gte('fecha', filters.fechaDesde)
  }
  
  if (filters.fechaHasta) {
    query = query.lte('fecha', filters.fechaHasta)
  }
  
  if (filters.estado) {
    query = query.eq('estado', filters.estado)
  }

  const { data, error } = await query

  return { data, error }
}

/**
 * Obtiene la estructura del roadmap desde Supabase.
 * @param {string} slug Identificador del roadmap (default: 'principal').
 */
export const getRoadmapData = async (slug = 'principal') => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('slug', slug)
    .order('module_position', { ascending: true })
    .order('task_position', { ascending: true })

  return { data, error }
}

/**
 * Guarda la estructura completa del roadmap en tablas normalizadas.
 * @param {Array} structure Array de hitos/subtareas a persistir.
 * @param {Object} options Opciones (slug, updatedBy).
 */
export const saveRoadmapData = async (structure, { slug = 'principal', updatedBy = null } = {}) => {
  const supabase = getSupabaseClient()
  const normalizedStructure = Array.isArray(structure) ? structure : []

  // Limpiar los registros existentes
  const { error: deleteError } = await supabase
    .from('roadmap_items')
    .delete()
    .eq('slug', slug)

  if (deleteError) {
    return { data: null, error: deleteError }
  }

  if (normalizedStructure.length === 0) {
    return { data: { slug }, error: null }
  }

  const nowIso = new Date().toISOString()

  const rows = normalizedStructure.flatMap((module, moduleIndex) => {
    const base = {
      slug,
      module_code: module.id,
      module_title: module.title,
      module_description: module.description ?? '',
      module_position: moduleIndex,
      updated_at: nowIso,
      updated_by: updatedBy
    }

    if (!Array.isArray(module.tasks) || module.tasks.length === 0) {
      return [
        {
          ...base,
          task_code: null,
          task_title: null,
          task_status: null,
          task_position: null
        }
      ]
    }

    return module.tasks.map((task, taskIndex) => ({
      ...base,
      task_code: task.id,
      task_title: task.title,
      task_status: task.status,
      task_position: taskIndex
    }))
  })

  const { error: insertError } = await supabase
    .from('roadmap_items')
    .insert(rows)

  if (insertError) {
    return { data: null, error: insertError }
  }

  return { data: { slug }, error: null }
}

export default {
  checkSupabaseConnection,
  getPersonas,
  createPersona,
  updatePersona,
  deletePersona,
  searchPersonas,
  getRegistros,
  createRegistro,
  getTurnos,
  createTurno,
  updateTurno,
  deleteTurno,
  getCobros,
  createCobro,
  updateCobro,
  deleteCobro,
  getResumenFinanciero,
  getEstadisticas,
  getConfiguracion,
  updateConfiguracion,
  subscribeToTable,
  unsubscribe,
  // Funciones para trabajadores
  getPersonaByRut,
  getTurnosByPersonaId,
  getRoadmapData,
  saveRoadmapData
}
