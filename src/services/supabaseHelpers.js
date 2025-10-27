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

// =========================================
// 💰 FUNCIONES PARA SISTEMA DE PAGOS
// =========================================

/**
 * Calcula horas trabajadas entre dos horas
 * @param {string} horaInicio - Formato "HH:MM:SS" o "HH:MM"
 * @param {string} horaFin - Formato "HH:MM:SS" o "HH:MM"
 * @returns {number} - Horas trabajadas (decimal)
 */
const calcularHoras = (horaInicio, horaFin) => {
  try {
    const [horaIni, minIni] = horaInicio.split(':').map(Number)
    const [horaFin2, minFin] = horaFin.split(':').map(Number)
    
    const minutosInicio = horaIni * 60 + minIni
    const minutosFin = horaFin2 * 60 + minFin
    
    const diferenciaMinutos = minutosFin - minutosInicio
    const horas = diferenciaMinutos / 60
    
    return Math.round(horas * 100) / 100
  } catch (error) {
    console.error('❌ Error calculando horas:', error)
    return 0
  }
}

/**
 * 📊 Calcula pagos por periodo (mes o rango de fechas) desde turnos_v2
 * @param {Object} filters - Filtros del periodo { mes, anio, fechaDesde, fechaHasta }
 * @returns {Object} - Datos de pagos calculados por persona
 */
export const calcularPagosPorPeriodo = async (filters = {}) => {
  const supabase = getSupabaseClient()
  
  console.log('🔧 calcularPagosPorPeriodo - Filtros recibidos:', filters)
  
  try {
    // Construir query para obtener turnos del periodo
    let query = supabase
      .from('turnos')
      .select(`
        *,
        persona:persona_id (
          id,
          nombre,
          rut,
          tipo,
          tarifa_hora
        )
      `)
      .eq('estado', 'programado')  // CORREGIDO: el estado es 'programado' no 'asignado'
      .not('persona_id', 'is', null)

    console.log('🔍 Query base creada')

    // Aplicar filtros de periodo usando fecha directamente (no fecha_asignacion)
    if (filters.mes && filters.anio) {
      console.log(`📅 Filtrando por mes=${filters.mes} y anio=${filters.anio}`)
      
      // Calcular el primer y último día del mes
      const primerDia = new Date(filters.anio, filters.mes - 1, 1)
      const ultimoDia = new Date(filters.anio, filters.mes, 0)
      
      const fechaDesde = primerDia.toISOString().split('T')[0]
      const fechaHasta = ultimoDia.toISOString().split('T')[0]
      
      console.log(`📆 Rango de fechas: ${fechaDesde} a ${fechaHasta}`)
      
      query = query
        .gte('fecha', fechaDesde)  // CORREGIDO: campo 'fecha' no 'fecha_asignacion'
        .lte('fecha', fechaHasta)
    } else if (filters.fechaDesde && filters.fechaHasta) {
      console.log(`📅 Filtrando por rango de fechas: ${filters.fechaDesde} - ${filters.fechaHasta}`)
      query = query
        .gte('fecha', filters.fechaDesde)  // CORREGIDO: campo 'fecha'
        .lte('fecha', filters.fechaHasta)
    } else {
      console.warn('⚠️ No se aplicaron filtros de periodo')
    }

    const { data: turnos, error } = await query

    console.log('📦 Turnos obtenidos:', turnos?.length || 0)
    
    if (turnos && turnos.length > 0) {
      console.log('📋 Primeros 3 turnos:', turnos.slice(0, 3))
      console.log('📊 Estados encontrados:', [...new Set(turnos.map(t => t.estado))])
      console.log('👥 Personas con ID:', turnos.filter(t => t.persona_id).length)
      console.log('🔗 Personas con datos JOIN:', turnos.filter(t => t.persona).length)
    }

    if (error) {
      console.error('❌ Error obteniendo turnos:', error)
      return { data: null, error }
    }

    if (!turnos || turnos.length === 0) {
      console.warn('⚠️ No se encontraron turnos con los filtros aplicados')
      console.warn('💡 Sugerencia: Verifica en Supabase SQL Editor con DIAGNOSTICO_URGENTE_turnos.sql')
      return { data: [], error: null }
    }

    // Calcular pagos por persona
    const pagosPorPersona = {}

    turnos?.forEach(turno => {
      if (!turno.persona) return

      const personaId = turno.persona.id
      const nombre = turno.persona.nombre
      const rut = turno.persona.rut
      const tipo = turno.persona.tipo
      const tarifaHora = turno.persona.tarifa_hora || 8000

      // Calcular horas del turno
      const horas = calcularHoras(turno.hora_inicio, turno.hora_fin)
      const monto = horas * tarifaHora

      if (!pagosPorPersona[personaId]) {
        pagosPorPersona[personaId] = {
          persona_id: personaId,
          nombre,
          rut,
          tipo,
          tarifa_hora: tarifaHora,
          numero_turnos: 0,
          horas_trabajadas: 0,
          monto_calculado: 0,
          turnos: []
        }
      }

      pagosPorPersona[personaId].numero_turnos++
      pagosPorPersona[personaId].horas_trabajadas += horas
      pagosPorPersona[personaId].monto_calculado += monto
      pagosPorPersona[personaId].turnos.push({
        id: turno.id,
        fecha: turno.fecha,  // CORREGIDO: campo 'fecha' no 'fecha_asignacion'
        hora_inicio: turno.hora_inicio,
        hora_fin: turno.hora_fin,
        horas,
        monto,
        tipo_turno: turno.tipo_turno
      })
    })

    // Convertir a array y redondear valores
    const pagosArray = Object.values(pagosPorPersona).map(pago => ({
      ...pago,
      horas_trabajadas: Math.round(pago.horas_trabajadas * 100) / 100,
      monto_calculado: Math.round(pago.monto_calculado)
    }))

    return { data: pagosArray, error: null }
  } catch (error) {
    console.error('Error calculando pagos:', error)
    return { data: null, error }
  }
}

/**
 * 📈 Obtiene resumen de pagos con estadísticas
 * @param {Object} filters - Filtros { mes, anio }
 * @returns {Object} - Resumen con totales y estadísticas
 */
export const obtenerResumenPagos = async (filters = {}) => {
  const supabase = getSupabaseClient()
  
  try {
    // Obtener pagos calculados del periodo
    const { data: pagosCalculados, error: errorCalculo } = await calcularPagosPorPeriodo(filters)
    
    if (errorCalculo) return { data: null, error: errorCalculo }

    // Obtener pagos registrados en la tabla pagos (CORREGIDO: nombre de tabla)
    let queryPagos = supabase
      .from('pagos')
      .select('*')

    if (filters.mes && filters.anio) {
      queryPagos = queryPagos
        .eq('mes', filters.mes)
        .eq('anio', filters.anio)
    }

    const { data: pagosRegistrados, error: errorRegistros } = await queryPagos

    if (errorRegistros) {
      console.warn('Advertencia obteniendo pagos registrados:', errorRegistros)
    }

    console.log('💾 Pagos registrados en BD:', pagosRegistrados?.length || 0)

    // Calcular resumen
    const resumen = {
      total_calculado: 0,
      total_pagado: 0,
      total_pendiente: 0,
      numero_personas: pagosCalculados?.length || 0,
      personas_pagadas: 0,
      personas_pendientes: 0,
      personas_parciales: 0,
      total_turnos: 0,
      total_horas: 0,
      pagos_por_tipo: {}
    }

    // Procesar pagos calculados
    pagosCalculados?.forEach(pago => {
      resumen.total_calculado += pago.monto_calculado
      resumen.total_turnos += pago.numero_turnos
      resumen.total_horas += pago.horas_trabajadas

      // Agrupar por tipo de trabajador
      const tipo = pago.tipo || 'sin_tipo'
      if (!resumen.pagos_por_tipo[tipo]) {
        resumen.pagos_por_tipo[tipo] = {
          cantidad: 0,
          monto: 0,
          horas: 0
        }
      }
      resumen.pagos_por_tipo[tipo].cantidad++
      resumen.pagos_por_tipo[tipo].monto += pago.monto_calculado
      resumen.pagos_por_tipo[tipo].horas += pago.horas_trabajadas

      // Verificar si está pagado
      const pagoRegistrado = pagosRegistrados?.find(p => p.persona_id === pago.persona_id)
      
      if (pagoRegistrado) {
        resumen.total_pagado += parseFloat(pagoRegistrado.monto_pagado) || 0
        
        if (pagoRegistrado.estado === 'pagado') {
          resumen.personas_pagadas++
        } else if (pagoRegistrado.estado === 'parcial') {
          resumen.personas_parciales++
        } else {
          resumen.personas_pendientes++
        }
      } else {
        resumen.personas_pendientes++
      }
    })

    resumen.total_pendiente = resumen.total_calculado - resumen.total_pagado

    return { data: resumen, error: null }
  } catch (error) {
    console.error('Error obteniendo resumen de pagos:', error)
    return { data: null, error }
  }
}

/**
 * ➕ Crea o actualiza un registro de pago
 * @param {Object} pagoData - Datos del pago
 * @returns {Object} - Resultado de la operación
 */
export const crearPago = async (pagoData) => {
  const supabase = getSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('pagos')
      .upsert(pagoData, {
        onConflict: 'persona_id,mes,anio'
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error creando pago:', error)
    return { data: null, error }
  }
}

/**
 * ✏️ Actualiza el estado de un pago
 * @param {string} pagoId - ID del pago
 * @param {Object} updates - Datos a actualizar
 * @returns {Object} - Resultado de la operación
 */
export const actualizarEstadoPago = async (pagoId, updates) => {
  const supabase = getSupabaseClient()
  
  try {
    const { data, error} = await supabase
      .from('pagos')
      .update(updates)
      .eq('id', pagoId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error actualizando pago:', error)
    return { data: null, error }
  }
}

/**
 * 📜 Obtiene el histórico de pagos de una persona
 * @param {string} personaId - ID de la persona
 * @param {Object} filters - Filtros opcionales
 * @returns {Object} - Histórico de pagos
 */
export const obtenerHistoricoPagos = async (personaId, filters = {}) => {
  const supabase = getSupabaseClient()
  
  try {
    let query = supabase
      .from('pagos')
      .select(`
        *,
        persona:persona_id (
          id,
          nombre,
          rut,
          tipo
        )
      `)
      .eq('persona_id', personaId)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false })

    if (filters.estado) {
      query = query.eq('estado', filters.estado)
    }

    if (filters.anio) {
      query = query.eq('anio', filters.anio)
    }

    const { data, error } = await query

    return { data, error }
  } catch (error) {
    console.error('Error obteniendo histórico de pagos:', error)
    return { data: null, error }
  }
}

/**
 * 📊 Obtiene todos los pagos registrados con filtros
 * @param {Object} filters - Filtros { mes, anio, estado }
 * @returns {Object} - Lista de pagos
 */
export const obtenerPagosRegistrados = async (filters = {}) => {
  const supabase = getSupabaseClient()
  
  try {
    let query = supabase
      .from('pagos')
      .select(`
        *,
        persona:persona_id (
          id,
          nombre,
          rut,
          tipo,
          tarifa_hora
        )
      `)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false })

    if (filters.mes && filters.anio) {
      query = query.eq('mes', filters.mes).eq('anio', filters.anio)
    }

    if (filters.estado) {
      query = query.eq('estado', filters.estado)
    }

    const { data, error } = await query

    return { data, error }
  } catch (error) {
    console.error('Error obteniendo pagos registrados:', error)
    return { data: null, error }
  }
}

/**
 * 📅 Calcula pagos por semana del mes
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 * @returns {Object} - Pagos agrupados por semana
 */
export const calcularPagosPorSemana = async (mes, anio) => {
  const supabase = getSupabaseClient()
  
  try {
    // Calcular rango de fechas del mes
    const primerDia = new Date(anio, mes - 1, 1)
    const ultimoDia = new Date(anio, mes, 0)
    
    const fechaDesde = primerDia.toISOString().split('T')[0]
    const fechaHasta = ultimoDia.toISOString().split('T')[0]
    
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select(`
        *,
        persona:persona_id (
          tarifa_hora
        )
      `)
      .gte('fecha', fechaDesde)  // CORREGIDO: campo 'fecha'
      .lte('fecha', fechaHasta)
      .eq('estado', 'programado')  // CORREGIDO: estado 'programado'
      .not('persona_id', 'is', null)

    if (error) return { data: null, error }

    // Agrupar por semana del mes
    const pagosPorSemana = {
      semana1: 0,
      semana2: 0,
      semana3: 0,
      semana4: 0
    }

    turnos?.forEach(turno => {
      if (!turno.fecha || !turno.persona) return  // CORREGIDO: campo 'fecha'

      const fecha = new Date(turno.fecha)  // CORREGIDO: campo 'fecha'
      const diaMes = fecha.getDate()
      const tarifaHora = turno.persona.tarifa_hora || 8000
      const horas = calcularHoras(turno.hora_inicio, turno.hora_fin)
      const monto = horas * tarifaHora

      // Determinar semana (simple: días 1-7, 8-14, 15-21, 22-31)
      let semana
      if (diaMes <= 7) semana = 'semana1'
      else if (diaMes <= 14) semana = 'semana2'
      else if (diaMes <= 21) semana = 'semana3'
      else semana = 'semana4'

      pagosPorSemana[semana] += monto
    })

    return { data: pagosPorSemana, error: null }
  } catch (error) {
    console.error('Error calculando pagos por semana:', error)
    return { data: null, error }
  }
}

/**
 * ✅ Marcar pago como pagado
 * @param {string} pagoId - ID del pago
 * @param {number} montoPagado - Monto pagado
 * @param {string} metodoPago - Método de pago
 * @param {string} referenciaPago - Referencia del pago
 * @param {string} notas - Notas adicionales
 * @returns {Object} - Resultado de la operación
 */
export const marcarComoPagado = async (pagoId, montoPagado, metodoPago = 'transferencia', referenciaPago = null, notas = null) => {
  const supabase = getSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('pagos')
      .update({
        monto_pagado: montoPagado,
        metodo_pago: metodoPago,
        referencia_pago: referenciaPago,
        notas: notas,
        fecha_pago: new Date().toISOString()
      })
      .eq('id', pagoId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error marcando como pagado:', error)
    return { data: null, error }
  }
}

/**
 * ❌ Desmarcar pago (volver a pendiente)
 * @param {string} pagoId - ID del pago
 * @returns {Object} - Resultado de la operación
 */
export const desmarcarPago = async (pagoId) => {
  const supabase = getSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('pagos')
      .update({
        monto_pagado: 0,
        estado: 'pendiente',
        fecha_pago: null,
        metodo_pago: null,
        referencia_pago: null
      })
      .eq('id', pagoId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error desmarcando pago:', error)
    return { data: null, error }
  }
}

/**
 * 💾 Sincronizar pagos calculados con la tabla pagos
 * Crea o actualiza registros en la tabla pagos con los montos calculados
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 * @returns {Object} - Resultado de la operación
 */
export const sincronizarPagos = async (mes, anio) => {
  const supabase = getSupabaseClient()
  
  try {
    // Obtener pagos calculados
    const { data: pagosCalculados, error: errorCalculo } = await calcularPagosPorPeriodo({ mes, anio })
    
    if (errorCalculo) return { data: null, error: errorCalculo }

    // Para cada pago calculado, crear o actualizar registro
    const pagosParaInsertar = pagosCalculados.map(pago => ({
      persona_id: pago.persona_id,
      mes,
      anio,
      monto_calculado: pago.monto_calculado,
      numero_turnos: pago.numero_turnos,
      horas_trabajadas: pago.horas_trabajadas,
      tarifa_hora: pago.tarifa_hora
    }))

    const { data, error } = await supabase
      .from('pagos')
      .upsert(pagosParaInsertar, {
        onConflict: 'persona_id,mes,anio',
        ignoreDuplicates: false
      })
      .select()

    return { data, error }
  } catch (error) {
    console.error('Error sincronizando pagos:', error)
    return { data: null, error }
  }
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
  saveRoadmapData,
  // Funciones para sistema de pagos
  calcularPagosPorPeriodo,
  obtenerResumenPagos,
  crearPago,
  actualizarEstadoPago,
  obtenerHistoricoPagos,
  obtenerPagosRegistrados,
  calcularPagosPorSemana,
  marcarComoPagado,
  desmarcarPago,
  sincronizarPagos
}
